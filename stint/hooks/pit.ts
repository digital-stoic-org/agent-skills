import type { EngineInterface, On } from 'claude-code'

import { pitDone, pitStart, setLap } from './dash.ts'
import { setPitBoard, setPitLine, writeStatus } from './status.ts'

// pit (stint): one mod, two commands.
//   /pit [stream]      save notes (awaited fork) -> /clear (automatic) -> notes re-injected as the first message of the fresh context
//   /rejoin [stream]   notes of a stream -> first message of this session
// Notes live in <session cwd>/.stint/<stream>-notes.md. One $.model.fork designates every field; code parses, assembles and caps the file.
// Command names: `$.command.register` takes letters, digits, `_` and `-` only (CommandSpec.name), so no `stint:pit`: the commands are /pit and /rejoin.

const STORE_KEY = 'stint:pending'
const STALE_MS = 10 * 60 * 1000
export const NOTES_DIR = '.stint'
export const DEFAULT_STREAM = 'main'
// Hard cap of the notes file, enforced by code: the fork is told the ceiling and the room left, assemble() cuts what still overflows.
export const NOTES_MAX = 8_000
const SHRINK_LINE = 80
export const STREAM_RE = /^[a-zA-Z0-9_-]{1,50}$/
export const RESERVED = ['pit', 'rejoin']
// $.agent.list() is raced against this: a hang would leave a pit stuck without a word.
const AGENT_LIST_MS = 5_000
const ERROR_TOAST_MS = 12_000
// A flow line older than this says it may be stuck ($.model.fork cannot be cancelled).
export const SLOW_MS = 3 * 60 * 1000
// The fork runs in this very context: at or above this share of the wall (where auto-compaction fires) it would fail there.
export const WALL_CAP = 0.95

// Injected after the notes, verbatim from the previous generation (the "wait for my go" variant).
export const UNPACK_RULES = `Reply with one line saying you are ready, then stop there.
Do nothing without my explicit go — no file read, no command, no sub-agent, no continuation of what is in progress.
Do not read the notes back to me. One line of acknowledgement is the whole answer.
Write a message only when something changes. The rest of the time stay silent.
Questions go to me, in this window.
After my go, read the \`read_first\` files before acting.`

export const FORK_PROMPT = `You are writing the notes of this work stream for yourself. After a /clear the notes file is the ONLY thing the fresh context receives. You designate every field yourself; code only assembles and caps the file.
First line, exactly one of:
GATE: ok
GATE: blocked - <one-line reason>
Blocked = you are in the middle of a cross-item step (synthesis, deduplication, global arbitration across all units). Then output nothing else.
If ok, from line 2 output ONLY the block below, keys in this order, no markdown, no prose, no blank line. Scalar = one line \`key: value\`. List = \`key:\` then one \`- item\` line per item; a missing list = empty.
status: <one word or short phrase: building | blocked | review ...>
goal: <1 sentence, carried from PREVIOUS NOTES unless it changed>
read_first:
- <path — role>   (closed list, read only after the human's go, never before the go)
read_if_needed:
- <path or URL — when to read it>
deliverable: <path where the written work lives>
decisions:
- <choice — why>   (the why is mandatory; do not reopen)
learnings:
- <non-obvious fact — command or path that proves it>
discarded:
- <path or approach tried — why rejected>
in_progress:
- <half-done item — where it stands>
next:
- <action>   (2-4 actions)
unknowns:
- <what is not known>   (never empty)
stale:
- <path — replaced by X; do not reload>
Rules:
- You own every field. Return the COMPLETE current content of every list: merge PREVIOUS NOTES with what this conversation added. Carry forward what is still true; drop what is done, answered, replaced or reversed (a reversed decision goes to discarded). Never restart from scratch.
- Lines starting "agent in flight:" are written by code: never write one.
- A pointer (absolute path, path:line, command) replaces any explanation. Do not run commands; write them.`

// ---------- pure helpers ----------

export const pad = (n: number) => String(n).padStart(2, '0')
export const notesPath = (cwd: string, stream: string) => `${cwd.replace(/\/+$/, '')}/${NOTES_DIR}/${stream}-notes.md`
const NOTES_FILE_RE = /^(.+)-notes\.md$/

// Stream names found in a `.stint` listing, sorted; anything that is not a valid `<stream>-notes.md` is ignored.
export function streamsFromNames(names: string[]): string[] {
  const out: string[] = []
  for (const name of names) {
    const m = name.match(NOTES_FILE_RE)
    if (m && STREAM_RE.test(m[1] as string) && !RESERVED.includes(m[1] as string)) out.push(m[1] as string)
  }
  return out.sort()
}

// A /rename title that is not a valid stream name becomes one; empty or reserved = no stream.
export function slugify(title: string): string | null {
  const slug = STREAM_RE.test(title)
    ? title
    : title
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50)
        .replace(/-+$/, '')
  return slug === '' || RESERVED.includes(slug) ? null : slug
}

export type Cmd = 'pit' | 'rejoin'
export type ParsedArgs = { stream?: string } | { error: string }

const USAGE: Record<Cmd, string> = { pit: 'Usage: /pit [stream]', rejoin: 'Usage: /rejoin [stream]' }

export function parseArgs(args: string, cmd: Cmd): ParsedArgs {
  const tokens = args.split(/\s+/).filter(t => t !== '')
  const bad = tokens.find(t => t.startsWith('-'))
  if (bad) return { error: `unknown option ${bad}. ${USAGE[cmd]}` }
  if (tokens.length > 1) return { error: `too many arguments. ${USAGE[cmd]}` }
  const stream = tokens[0]
  if (stream === undefined) return {}
  if (RESERVED.includes(stream)) return { error: `"${stream}" is a reserved word, not a stream name` }
  if (!STREAM_RE.test(stream)) return { error: `invalid stream "${stream}": use 1-50 chars of a-z A-Z 0-9 _ -` }
  return { stream }
}

// Explicit binding (a command argument) > session title (/rename) > the default stream.
export function resolveStream(bound: string | null, title: string | null): string {
  return bound ?? title ?? DEFAULT_STREAM
}

// The wall is where auto-compaction fires; a fork started at or above WALL_CAP of it would fail there.
export function overWall(tokens: number, wall: number): boolean {
  return wall > 0 && tokens >= WALL_CAP * wall
}

export const elapsed = (ms: number) => {
  const s = Math.floor(ms / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${pad(s % 60)}s`
}

export function progressText(label: string, ms: number): string {
  if (ms >= SLOW_MS) return `${label}: still running after ${elapsed(ms)}, slow or stuck; the outcome will show here`
  return ms < 1000 ? `${label}...` : `${label}... ${elapsed(ms)}`
}

// The same flow for the band's board slot: short, no quotes around nothing.
export function boardProgress(stream: string, ms: number): string {
  if (ms >= SLOW_MS) return `pitting "${stream}": slow or stuck, ${elapsed(ms)}`
  return ms < 1000 ? `pitting "${stream}"...` : `pitting "${stream}"... ${elapsed(ms)}`
}

export const savedBoard = (chars: number) => `saved ${chars >= 1000 ? `${(chars / 1000).toFixed(1)}k` : chars} -> clearing`

export function hintBoard(streams: string[]): string {
  return streams.length === 1 ? `notes found: /rejoin ${streams[0]}` : '/rejoin <stream>: several notes found'
}

export function hintText(streams: string[]): string {
  if (streams.length === 1) return `Notes for stream "${streams[0]}" found: /rejoin ${streams[0]}`
  return `Notes found for streams ${streams.map(s => `"${s}"`).join(', ')}: /rejoin <stream>`
}

const SHORT_REASON = 80
const shortReason = (reason: string) => {
  const one = reason.replace(/\s+/g, ' ').trim()
  return one.length > SHORT_REASON ? `${one.slice(0, SHORT_REASON - 1)}…` : one
}

// ---------- notes format ----------

export const SCALARS_HEADER = ['stream', 'saved', 'status', 'previous_session', 'goal']
// Written after the header scalars when the caller gives a stint number: the stint the notes hand over to (absent in older notes = 1).
export const STINT_KEY = 'stint'
export const LISTS = ['read_first', 'read_if_needed', 'decisions', 'learnings', 'discarded', 'in_progress', 'next', 'unknowns', 'stale']
// Body order of the notes file (deliverable is the only scalar among them).
export const BODY_ORDER = ['read_first', 'read_if_needed', 'deliverable', 'decisions', 'learnings', 'discarded', 'in_progress', 'next', 'unknowns', 'stale']

export type Keyed = { scalars: Record<string, string>; lists: Record<string, string[]> }

// `key: value` scalars and `key:` + `- item` lists; unknown lines are ignored.
export function parseKeyed(text: string, scalarKeys: string[], listKeys: string[]): Keyed {
  const out: Keyed = { scalars: {}, lists: {} }
  let current: string | null = null
  for (const raw of text.split('\n')) {
    const line = raw.trimEnd()
    const key = line.match(/^([a-z_]+):\s*(.*)$/)
    if (key && scalarKeys.includes(key[1] as string)) {
      out.scalars[key[1] as string] = (key[2] as string).trim()
      current = null
    } else if (key && listKeys.includes(key[1] as string)) {
      const k = key[1] as string
      out.lists[k] = out.lists[k] ?? []
      current = k
      if ((key[2] as string).trim()) (out.lists[k] as string[]).push((key[2] as string).trim())
    } else if (current && line.startsWith('- ')) {
      ;(out.lists[current] as string[]).push(line.slice(2).trim())
    }
  }
  return out
}

const NOTES_SCALARS = [...SCALARS_HEADER, STINT_KEY, 'deliverable']
export const parseNotes = (text: string) => parseKeyed(text, NOTES_SCALARS, LISTS)

// The stint number in a notes file; missing, malformed or no file = 1.
export function stintOf(notes: string | null): number {
  const raw = notes ? parseNotes(notes).scalars[STINT_KEY] : undefined
  const n = raw !== undefined && /^\d{1,6}$/.test(raw) ? Number(raw) : 1
  return n >= 1 ? n : 1
}

const FORK_SCALARS = ['status', 'goal', 'deliverable']
export type ForkParse = { kind: 'ok'; body: string } | { kind: 'blocked'; reason: string }

export function parseFork(text: string): ForkParse {
  const lines = text.trim().split('\n')
  const first = (lines[0] ?? '').trim()
  if (first === 'GATE: ok') {
    const body = lines.slice(1).join('\n').trim()
    return body ? { kind: 'ok', body } : { kind: 'blocked', reason: 'empty fork output' }
  }
  const blocked = first.match(/^GATE:\s*blocked\s*[-—:]?\s*(.*)$/)
  if (blocked) return { kind: 'blocked', reason: blocked[1] || 'no reason given' }
  return { kind: 'blocked', reason: `malformed first line: ${first.slice(0, 80)}` }
}

export function parseForkBody(body: string): Keyed | null {
  const fields = parseKeyed(body, FORK_SCALARS, LISTS)
  if (Object.keys(fields.scalars).length === 0 && Object.keys(fields.lists).length === 0) return null
  return fields
}

const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim()
export const AGENT_LINE = 'agent in flight:'
// The list did not answer in AGENT_LIST_MS: said once in the notes instead of silently listing nobody.
export const AGENTS_UNKNOWN = 'agents: unknown (list timed out)'
const AGENTS_MAX = 10
const AGENT_DESC_MAX = 100
const LIVE_STATUS = ['pending', 'running', 'waiting', 'idle']

export type AgentLike = { id: string; name?: string; type: string; status: string; description?: string }

// One code-written line per live background agent, so the fresh context after /clear knows whom it can still SendMessage.
export function agentLinesOf(listed: AgentLike[]): string[] {
  const live = listed.filter(a => LIVE_STATUS.includes(a.status))
  const lines = live.slice(0, AGENTS_MAX).map(a => {
    const desc = oneLine(a.description ?? '')
    return `${AGENT_LINE} ${oneLine(a.name || a.type)} [${a.id}] ${a.status}${desc ? ` — ${desc.slice(0, AGENT_DESC_MAX)}` : ''}`
  })
  if (live.length > AGENTS_MAX) lines.push(`${AGENT_LINE} +${live.length - AGENTS_MAX} more, not listed`)
  return lines
}

const uniq = (lines: string[]) => [...new Set(lines)]

export type AssembleInput = {
  stream: string
  saved: string
  sid: string
  prev: string | null
  fork: Keyed
  // The stint the notes hand over to; no line in the header when absent.
  stint?: number
  // In-flight agent lines (agentLines()), written by code; rendered first in in_progress and never cut.
  agents?: string[]
}
export type Assembled =
  | { kind: 'ok'; state: string; cut: string[]; degraded: boolean }
  | { kind: 'blocked'; reason: string }

// The fork designated every field; code merges nothing but the header and the agent lines, then enforces the cap.
export function assemble(input: AssembleInput): Assembled {
  const prev = input.prev ? parseNotes(input.prev) : null
  const fields = input.fork

  const lists: Record<string, string[]> = {}
  for (const sec of LISTS) {
    let own = uniq((fields.lists[sec] ?? []).map(oneLine).filter(l => l !== ''))
    if (sec === 'decisions') own = own.map(l => (l.includes('—') ? l : `${l} — why missing`))
    if (sec === 'in_progress') own = own.filter(l => !l.startsWith(AGENT_LINE) && l !== AGENTS_UNKNOWN) // code writes those, never the fork
    lists[sec] = own
  }
  if (lists.unknowns?.length === 0) lists.unknowns = ['nothing recorded — treat every fact as unverified']

  const prevWriter = (prev?.scalars.saved ?? '').split(/\s+/)[1]
  const previousSession = prevWriter && prevWriter !== input.sid ? prevWriter : prev?.scalars.previous_session || 'none'
  const scalars: Record<string, string> = {
    stream: input.stream,
    saved: `${input.saved} ${input.sid}`,
    status: oneLine(fields.scalars.status || prev?.scalars.status || 'unknown'),
    previous_session: previousSession,
    goal: oneLine(fields.scalars.goal || prev?.scalars.goal || 'unknown'),
    deliverable: oneLine(fields.scalars.deliverable || prev?.scalars.deliverable || 'none'),
  }

  // The overflow line is the last line of stale, outside `lists` so no cut step can drop it; the agent lines sit the same way in front of in_progress.
  let overflowLine: string | null = null
  let degraded = false
  const render = () => {
    const header: Record<string, string | undefined> = { ...scalars, status: degraded ? `degraded (${scalars.status})` : scalars.status }
    const head = [...SCALARS_HEADER.map(k => `${k}: ${header[k]}`), ...(input.stint !== undefined ? [`${STINT_KEY}: ${input.stint}`] : [])].join('\n')
    const agents = input.agents ?? []
    const shown = (k: string) => {
      const list = lists[k] ?? []
      return k === 'stale' && overflowLine ? [...list, overflowLine] : k === 'in_progress' ? [...agents, ...list] : list
    }
    const body = BODY_ORDER.map(k => (k === 'deliverable' ? `deliverable: ${scalars.deliverable}` : `${k}:${shown(k).map(l => `\n- ${l}`).join('')}`)).join('\n')
    return `${head}\n\n${body}\n`
  }

  // Hard cap, enforced here whatever the fork wrote. Cut order: read_if_needed (compressed), stale, in_progress, discarded, learnings (each oldest first).
  // Still over: what is left of read_if_needed, then next, unknowns, decisions. Never cut: header scalars, read_first, deliverable, the agent lines.
  const cut: string[] = []
  let text = render()
  const over = () => text.length > NOTES_MAX
  if (over()) {
    degraded = true
    text = render()
  }
  const dropped: Record<string, number> = {}
  const drop = (sec: string) => {
    ;(lists[sec] as string[]).shift()
    dropped[sec] = (dropped[sec] ?? 0) + 1
    text = render()
  }
  if (over()) {
    const before = (lists.read_if_needed as string[]).join('\n')
    lists.read_if_needed = (lists.read_if_needed as string[]).map(l => (l.length <= SHRINK_LINE ? l : `${l.slice(0, SHRINK_LINE - 1)}…`))
    text = render()
    if ((lists.read_if_needed as string[]).join('\n') !== before) cut.push('read_if_needed compressed')
  }
  for (const sec of ['stale', 'in_progress', 'discarded', 'learnings']) {
    while (over() && (lists[sec] as string[]).length > 0) drop(sec)
  }
  if (over()) {
    // The cut is announced in stale, inside the measured text.
    const overflow = () =>
      `overflow: cut to fit ${NOTES_MAX} chars: ${Object.entries(dropped).map(([s, n]) => `${s} -${n}`).join(', ') || 'nothing yet'}`
    overflowLine = overflow()
    text = render()
    for (const sec of ['read_if_needed', 'next', 'unknowns', 'decisions']) {
      while (over() && (lists[sec] as string[]).length > 0) {
        drop(sec)
        overflowLine = overflow()
        text = render()
      }
    }
  }
  for (const [sec, n] of Object.entries(dropped)) cut.push(`${sec} -${n}`)
  if (over()) {
    return {
      kind: 'blocked',
      reason: `notes ${text.length} chars > ${NOTES_MAX} after cutting ${cut.join(', ') || 'nothing cuttable'}; the header, read_first and the agent lines alone exceed the cap: shorten read_first by hand. Nothing written.`,
    }
  }
  return { kind: 'ok', state: text, cut, degraded: degraded }
}

export function forkPrompt(prev: string | null): string {
  const n = (v: number) => v.toLocaleString('en-US')
  const room = NOTES_MAX - (prev?.length ?? 0)
  const budget = `SIZE: the notes file may not exceed ${n(NOTES_MAX)} characters; past it code cuts, in this order, read_if_needed, stale, in_progress, discarded, learnings, then the rest. PREVIOUS NOTES are ${n(prev?.length ?? 0)} characters: ${room >= 0 ? `${n(room)} left` : `${n(-room)} over`} for what this conversation adds.${room < 1_500 ? ' Room is tight: drop obsolete lines and shorten the rest.' : ''}`
  return `${FORK_PROMPT}\n\n${budget}\n\nPREVIOUS NOTES:\n${prev ?? '(none)'}`
}

// The text injected as the first message: the notes, then the rules.
export const injectText = (notes: string) => `${notes.trimEnd()}\n\n${UNPACK_RULES}`

function forkFailure(reason: string): string {
  return reason === 'nothing-to-fork' ? 'nothing to save yet: this conversation has no response' : `fork failed (${reason})`
}

// ---------- module state (survives /clear, lost on mod reload; the pending injection is backed up in $.store) ----------

type Pending = { text: string; createdAt: number; cwd: string; stream: string }

let pending: Pending | null = null
// A pit is running (the fork is slow): refuse a second one meanwhile.
let saving = false
// Stream binding. Same session across /clear, so it survives /clear; reset on startup/resume/fork.
let boundArg: string | null = null
let titleStream: string | null = null
// The pit's message: running flow, then last sticky outcome, then the session-start hint. `status` goes to the status line
// (only where the band was never raised), `board` to the band's board slot; `bad` draws it red. An empty status writes nothing.
type Line = { status: string; board: string; bad?: boolean }
let flowLine: Line | undefined
let ticker: { cancel: () => void } | null = null
let outcome: Line | undefined
let hint: Line | undefined

const current = () => resolveStream(boundArg, titleStream)

// pit's own lines (flow, outcome, hint) come first; with none, the dash line (status.ts).
function paint($: EngineInterface) {
  const line = flowLine ?? outcome ?? hint
  setPitLine(line?.status || undefined)
  setPitBoard(line ? { text: line.board, ...(line.bad ? { bad: true } : {}) } : undefined)
  writeStatus($)
  $.ui.invalidate('ui.render')
}

function flowStatus($: EngineInterface, line: Line | undefined) {
  stopProgress()
  flowLine = line
  paint($)
}

// A flow line with its elapsed time, ticking every second until the next flowStatus().
function startProgress($: EngineInterface, label: string, stream: string) {
  const at = (ms: number): Line => ({ status: progressText(label, ms), board: boardProgress(stream, ms) })
  flowStatus($, at(0))
  let ms = 0
  ticker = $.clock.every(1000, () => {
    ms += 1000
    flowLine = at(ms)
    paint($)
  })
}

function stopProgress() {
  ticker?.cancel()
  ticker = null
}

function fail($: EngineInterface, text: string, board: string) {
  outcome = { status: `⚠ ${shortReason(text)}`, board, bad: true }
  $.ui.toast(text, { timeoutMs: ERROR_TOAST_MS })
  flowStatus($, undefined)
}

// ---------- disk ----------

async function readOptional($: EngineInterface, path: string): Promise<string | null> {
  return (await $.fs.exists(path)) ? await $.fs.read(path) : null
}

// Streams that have a notes file in the session cwd; a missing directory is no notes.
async function listStreams($: EngineInterface): Promise<string[]> {
  try {
    const entries = await $.fs.list(`${(await $.session.cwd()).replace(/\/+$/, '')}/${NOTES_DIR}`)
    return streamsFromNames(entries.filter(e => e.kind === 'file').map(e => e.name))
  } catch {
    return []
  }
}

// $.agent.list() raced against AGENT_LIST_MS. Called BEFORE the fork starts, so the fork never lists itself. Never fails the pit.
async function agentLines($: EngineInterface): Promise<string[]> {
  let timer: { cancel: () => void } | null = null
  try {
    const timeout = new Promise<'timeout'>(resolve => {
      timer = $.clock.after(AGENT_LIST_MS, () => resolve('timeout'))
    })
    const listed = await Promise.race([$.agent.list(), timeout])
    if (listed === 'timeout') return [AGENTS_UNKNOWN]
    return agentLinesOf(listed)
  } catch {
    return []
  } finally {
    ;(timer as { cancel: () => void } | null)?.cancel()
  }
}

// ---------- save ----------

type Built = { kind: 'ok'; state: string; cut: string[]; degraded: boolean; stint: number } | { kind: 'blocked'; reason: string }

async function askFork($: EngineInterface, prompt: string): Promise<{ kind: 'ok'; fork: Keyed } | { kind: 'blocked'; reason: string }> {
  const reply = await $.model.fork({ prompt })
  if (!reply.isAnswered) return { kind: 'blocked', reason: forkFailure(reply.reason) }
  const parsed = parseFork(reply.text)
  if (parsed.kind === 'blocked') return parsed
  const fork = parseForkBody(parsed.body)
  return fork ? { kind: 'ok', fork } : { kind: 'blocked', reason: 'unparseable fork output' }
}

async function buildNotes($: EngineInterface, cwd: string, stream: string): Promise<Built> {
  try {
    const sid = await $.session.id()
    const path = notesPath(cwd, stream)
    const prev = await readOptional($, path)
    const agents = await agentLines($)
    // One fork per save: an over-cap answer is cut by assemble(), never re-asked.
    const asked = await askFork($, forkPrompt(prev))
    if (asked.kind === 'blocked') return asked
    const stint = stintOf(prev) + 1
    const result = assemble({ stream, saved: new Date(await $.clock.now()).toISOString(), sid, prev, fork: asked.fork, agents, stint })
    if (result.kind === 'blocked') return result
    await $.fs.write(path, result.state)
    if (!(await $.fs.exists(path))) return { kind: 'blocked', reason: `${path} not found after writing` }
    return { ...result, stint }
  } catch (err) {
    return { kind: 'blocked', reason: `error: ${String(err)}` }
  }
}

// Context fill against the wall; null when the host gives no figure (the pit then goes on).
async function headroom($: EngineInterface): Promise<{ tokens: number; wall: number } | null> {
  try {
    const { context } = await $.session.usage({ breakdown: 'summary' })
    const b = context.breakdown
    const tokens = context.tokens ?? b?.totalTokens
    const wall = b?.autoCompactThreshold ?? b?.rawMaxTokens ?? context.window
    return tokens !== undefined && wall > 0 ? { tokens, wall } : null
  } catch (err) {
    $.ui.log(`stint: context figures unavailable, headroom not checked: ${String(err)}`, { to: 'debug' })
    return null
  }
}

async function persist($: EngineInterface) {
  if (pending) await $.store.set(STORE_KEY, pending satisfies Pending)
}

async function reset($: EngineInterface) {
  pending = null
  await $.store.delete(STORE_KEY)
  flowStatus($, undefined)
}

const READY: Line = { status: 'Ready: type /clear to continue in a fresh session', board: 'type /clear to continue', bad: true }
const DONE_MS = 3000

// The notes to re-inject after /clear: module var first, else a fresh store entry from this cwd.
async function armedPending($: EngineInterface): Promise<Pending | null> {
  const stored = pending ?? ((await $.store.get(STORE_KEY)) as Pending | undefined)
  if (!stored) return null
  if ((await $.clock.now()) - stored.createdAt >= STALE_MS) return null
  if (stored.cwd !== (await $.session.cwd())) return null
  return stored
}

// ---------- inject (shared by the fresh start after /clear and /rejoin) ----------

// Injection = $.prompt.submit({ asUser: true }): it starts a turn, so UNPACK_RULES can hold the model at its acknowledgement line.
// The host REFUSES prompt.submit called from inside the command.run hook, so /rejoin passes `defer` and the submit runs from a $.clock.after
// dispatch, after the hook returned. SessionStart submits directly.
function inject($: EngineInterface, stream: string, notes: string, defer: boolean) {
  const run = () => {
    $.prompt.submit({ text: injectText(notes), asUser: true }).catch(err => {
      fail($, `Loading the notes of stream "${stream}" failed: ${String(err)}. Try /rejoin ${stream}`, `LOADING NOTES FAILED, try /rejoin ${stream}`)
    })
  }
  if (defer) $.clock.after(1, run)
  else run()
}

// The pit is done: a positive board message for a few seconds, then the board is free again. Nothing on the status line.
function backOnTrack($: EngineInterface, stint: number) {
  const line: Line = { status: '', board: `back on track, stint ${stint}` }
  outcome = line
  paint($)
  $.clock.after(DONE_MS, () => {
    if (outcome !== line) return
    outcome = undefined
    paint($)
  })
}

// ---------- commands ----------

async function pit($: EngineInterface, args: string) {
  const parsed = parseArgs(args, 'pit')
  if ('error' in parsed) return { text: `pit: ${parsed.error}` }
  if (saving) return { text: `pit: a pit is already running, its outcome will show in the status line` }

  const cwd = await $.session.cwd()
  const room = await headroom($)
  if (room && overWall(room.tokens, room.wall)) {
    const pct = Math.round((room.tokens / room.wall) * 100)
    const text = `pit: context is at ${pct}% of the limit where the host compacts on its own (${room.tokens} of ${room.wall} tokens); the save runs in this context and would fail there. Nothing saved, the session is unchanged.`
    outcome = { status: `⚠ Pit refused: context at ${pct}% of the compaction limit, nothing saved`, board: `PIT REFUSED at ${pct}% of the limit, nothing saved`, bad: true }
    paint($)
    return { text }
  }

  // Explicit argument binds for the session; a new command replaces the last outcome.
  if (parsed.stream !== undefined) boundArg = parsed.stream
  outcome = undefined
  hint = undefined
  const stream = current()

  saving = true
  startProgress($, `Pitting stream "${stream}"`, stream)
  let built: Built
  try {
    built = await buildNotes($, cwd, stream)
  } finally {
    saving = false
  }
  if (built.kind === 'blocked') {
    // Rail 1: nothing is cleared, the session stays as it is.
    fail($, `Pit of stream "${stream}" failed: ${built.reason.replace(/\.$/, '')}. Session kept.`, 'PIT FAILED, session kept')
    return { text: `pit: could not save stream "${stream}": ${built.reason.replace(/\.$/, '')}. No /clear run, the session is unchanged.` }
  }

  pending = { text: built.state, createdAt: await $.clock.now(), cwd, stream }
  await persist($)
  await setLap($, built.stint)
  pitStart()
  flowStatus($, { status: 'Starting a fresh session...', board: savedBoard(built.state.length) })
  // $.command.run rejects inside the hook the run waits on, so the /clear runs from a $.clock.after dispatch, after the hook returned.
  // If the host still refuses, the human types /clear.
  $.clock.after(1, () => {
    $.command.run({ command: 'clear' }).then(() => { pitDone($); backOnTrack($, built.stint) }, () => flowStatus($, READY))
  })
  return { text: `pit: saved ${NOTES_DIR}/${stream}-notes.md` }
}

async function rejoin($: EngineInterface, args: string) {
  const parsed = parseArgs(args, 'rejoin')
  if ('error' in parsed) return { text: `rejoin: ${parsed.error}` }
  outcome = undefined
  const cwd = await $.session.cwd()
  const streams = await listStreams($)
  const list = streams.length ? ` Notes here: ${streams.join(', ')}.` : ''

  let stream = parsed.stream
  if (stream === undefined) {
    // No argument: the bound stream when it has notes, else the only notes file there is.
    if ((boundArg ?? titleStream) !== null && streams.includes(current())) stream = current()
    else if (streams.length === 1) stream = streams[0]
    else if (streams.length > 1) return { text: `rejoin: several notes here, pick one with /rejoin <stream>: ${streams.join(', ')}` }
    else return { text: `rejoin: no notes in ${NOTES_DIR}/ of this folder. Nothing loaded.` }
  }
  const chosen = stream as string

  let notes: string | null
  try {
    notes = await readOptional($, notesPath(cwd, chosen))
  } catch (err) {
    return { text: `rejoin: cannot read the notes of stream "${chosen}": ${String(err)}` }
  }
  if (notes === null) return { text: `rejoin: no notes for stream "${chosen}" in this folder. Nothing loaded.${list}` }

  boundArg = chosen
  hint = undefined
  await setLap($, stintOf(notes))
  paint($)
  inject($, chosen, notes, true)
  return { text: `rejoin: loading stream "${chosen}" as the first message.` }
}

// ---------- hooks ----------

function noteCaught($: EngineInterface, hook: string, error: { kind: string; message?: string }) {
  try {
    $.ui.log(`stint: ${hook} hook ${error.kind}${error.message ? `: ${error.message}` : ''}`, { to: 'debug' })
  } catch {
    // nothing left to do
  }
}

async function noteTitle(title: string | undefined) {
  if (title === undefined) return
  const slug = slugify(title)
  if (slug !== null) titleStream = slug
}

export function registerPit(on: On) {
  on('session.start', async ($, e, next) => {
    const commands = [
      { name: 'pit', description: 'Save the notes of a stream, then continue it in a fresh session', argumentHint: '[stream]' },
      { name: 'rejoin', description: 'Load the notes of a stream as the first message of this session', argumentHint: '[stream]' },
    ]
    for (const command of commands) {
      try {
        await $.command.register(command)
      } catch (err) {
        $.ui.log(`stint: command ${command.name} not registered: ${String(err)}`)
      }
    }
    return next(e)
  })

  on('command.run', { command: 'pit' }, ($, e) => pit($, e.args)).catch(($, e, next) => {
    noteCaught($, 'command.run pit', next.error)
    saving = false
    stopProgress()
    return { text: 'pit: failed unexpectedly, nothing was cleared. Run it again.' }
  })
  on('command.run', { command: 'rejoin' }, ($, e) => rejoin($, e.args)).catch(($, e, next) => {
    noteCaught($, 'command.run rejoin', next.error)
    return { text: 'rejoin: failed unexpectedly, nothing was loaded. Run it again.' }
  })

  on('classic.UserPromptSubmit', async ($, e, next) => {
    // The hint was seen: it goes at the first prompt.
    if (hint !== undefined) {
      hint = undefined
      paint($)
    }
    await noteTitle(e.session_title)
    return next(e)
  }).catch(($, e, next) => {
    noteCaught($, 'classic.UserPromptSubmit', next.error)
    return next(e)
  })

  on('classic.SessionStart', async ($, e, next) => {
    hint = undefined
    outcome = undefined
    if (e.source !== 'clear') {
      // A new, resumed or forked session is another session: unbind and drop any armed injection.
      if (e.source === 'startup' || e.source === 'resume' || e.source === 'fork') {
        boundArg = null
        titleStream = null
        pending = null
        saving = false
        stopProgress()
        flowLine = undefined
      }
      await noteTitle(e.session_title)
      if (boundArg === null) {
        const streams = await listStreams($)
        if (streams.length > 0) hint = { status: hintText(streams), board: hintBoard(streams) }
      }
      paint($)
      return next(e)
    }

    await noteTitle(e.session_title)
    const armed = await armedPending($)
    await reset($)
    if (armed === null) return next(e)

    // Rail 3: the binding survives /clear; restore it when a mod reload lost it.
    if (boundArg === null) boundArg = armed.stream
    inject($, armed.stream, armed.text, false)
    $.ui.toast(`Fresh session started with the notes of stream "${armed.stream}"`)
    return next(e)
  }).catch(($, e, next) => {
    noteCaught($, 'classic.SessionStart', next.error)
    return next(e)
  })
}
