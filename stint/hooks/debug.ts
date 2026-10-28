import type { EngineInterface, On, PluginOptions } from 'claude-code'

// Debug mode of the pit: a trace of the steps between /pit and the re-injection, kept in $.store and mirrored to the debug log.
// Observation only: with debug off nothing here writes, waits or arms a timer. Only metadata is traced (paths, sizes, ids), never the notes.

export const DEBUG_KEY = 'stint.debug'
export const TRACE_KEY = 'stint:trace'
export const TRACE_MAX = 200
// After the fresh session starts, the re-injected prompt and its turn must show within this time.
export const WATCH_MS = 10_000

export type TraceEvent = { t: number; sid: string | undefined; cwd: string | undefined; stream: string | undefined; ev: string; detail: Record<string, unknown> }

let enabled = false
let buf: TraceEvent[] | null = null
let chain: Promise<void> = Promise.resolve()
let announced = false
let loadedAt = Date.now()
let watch: Watch | null = null

type Watch = { seenPrompt: boolean; seenTurn: boolean; timer: { cancel: () => void } | null }

export const debugOn = () => enabled

// Functions declarations, not arrows: the hooks compiler follows $ only into those.
export async function sidNow($: EngineInterface): Promise<string | undefined> {
  try {
    return await $.session.id()
  } catch {
    return undefined
  }
}

async function cwdNow($: EngineInterface): Promise<string | undefined> {
  try {
    return await $.session.cwd()
  } catch {
    return undefined
  }
}

async function load($: EngineInterface): Promise<TraceEvent[]> {
  if (buf === null) {
    const stored = (await $.store.get(TRACE_KEY)) as TraceEvent[] | undefined
    buf = Array.isArray(stored) ? stored.slice(-TRACE_MAX) : []
  }
  return buf
}

async function add($: EngineInterface, ev: string, detail: Record<string, unknown>, stream: string | undefined) {
  const events = await load($)
  const push = async (name: string, d: Record<string, unknown>) => {
    const event: TraceEvent = { t: await $.clock.now(), sid: await sidNow($), cwd: await cwdNow($), stream, ev: name, detail: d }
    events.push(event)
    if (events.length > TRACE_MAX) events.splice(0, events.length - TRACE_MAX)
    $.ui.log(`stint trace ${JSON.stringify(event)}`, { to: 'debug' })
  }
  // A second module.load in the buffer is a reload.
  if (!announced) {
    announced = true
    await push('module.load', { loadedAt })
  }
  await push(ev, detail)
  await $.store.set(TRACE_KEY, events)
}

// Queued, never awaited by the caller, never throws: the trace cannot change what /pit does.
export function trace($: EngineInterface, ev: string, detail: Record<string, unknown> = {}, stream?: string) {
  if (!enabled) return
  chain = chain.then(() => add($, ev, detail, stream)).catch(() => undefined)
}

export async function events($: EngineInterface): Promise<TraceEvent[]> {
  await chain
  return [...(await load($))]
}

export const stamp = (ms: number) => new Date(ms).toISOString().replace(/[:.]/g, '-')

// The steps from /pit to the first turn, in order; the summary says which were reached after the last pit.start.
const STEPS = ['pit.start', 'notes.written', 'pending.persisted', 'clear.run', 'session.start', 'pending.lookup', 'inject.submit', 'prompt.seen', 'turn.start']

export function report(all: readonly TraceEvent[], why: string): string {
  const from = all.map(e => e.ev).lastIndexOf('pit.start')
  const run = from < 0 ? [] : all.slice(from)
  const reached = (step: string) => run.some(e => e.ev === step && (step !== 'session.start' || e.detail.source === 'clear') && (step !== 'pending.lookup' || e.detail.hit === true))
  const lines = ['# stint pit trace', '', `why: ${why}`, `events: ${all.length} (cap ${TRACE_MAX}), metadata only`, '', '## steps after the last pit.start', '']
  if (from < 0) lines.push('no pit.start in the buffer')
  for (const step of STEPS) if (from >= 0) lines.push(`- ${step}: ${reached(step) ? 'reached' : 'MISSING'}`)
  lines.push('', '## events', '', '```')
  for (const e of all) lines.push(JSON.stringify(e))
  lines.push('```', '')
  return lines.join('\n')
}

// Writes the report under <cwd>/.stint/ and returns its absolute path.
export async function writeReport($: EngineInterface, cwd: string, why: string): Promise<string> {
  const all = await events($)
  const path = `${cwd}/.stint/debug-${stamp(await $.clock.now())}.md`
  await $.fs.write(path, report(all, why))
  return path
}

// The watch after an armed re-injection: onTimeout fires unless both the injected prompt and its turn were seen in time.
export function startWatch($: EngineInterface, onTimeout: (missing: string) => void) {
  stopWatch()
  const w: Watch = { seenPrompt: false, seenTurn: false, timer: null }
  watch = w
  w.timer = $.clock.after(WATCH_MS, () => {
    if (watch !== w) return
    watch = null
    if (!w.seenPrompt) onTimeout('no prompt.seen')
    else if (!w.seenTurn) onTimeout('no turn.start')
  })
}

export function stopWatch() {
  watch?.timer?.cancel()
  watch = null
}

export function registerDebug(on: On, userOptions: PluginOptions) {
  enabled = userOptions.debug === 'on'
  buf = null
  chain = Promise.resolve()
  announced = false
  loadedAt = Date.now()
  watch = null

  on('config.set', { key: DEBUG_KEY }, async ($, e, next) => {
    const result = await next(e)
    if ('deny' in result && result.deny !== undefined) return result
    enabled = e.value === 'on'
    if (!enabled) stopWatch()
    return result
  }).catch(($, e, next) => next(e))

  // Our injected prompt reaching the hook: recognised by its origin, logged by length only.
  on('prompt.submit', async ($, e, next) => {
    if (enabled && e.origin.kind === 'plugin' && e.origin.name === 'stint' && e.origin.asUser) {
      trace($, 'prompt.seen', { chars: e.text.length })
      if (watch) watch.seenPrompt = true
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.start', async ($, e, next) => {
    if (enabled && e.agentId === undefined) {
      trace($, 'turn.start', { turnId: e.turnId })
      if (watch) watch.seenTurn = true
    }
    return next(e)
  }).catch(($, e, next) => next(e))
}
