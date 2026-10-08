import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { AgentInfo, On } from 'claude-code'
import { HARD, SLOW_MS, SOFT, STRONG, WALL_CAP, elapsed, hardAtOf, hasDecisionSeam, hideTrailer, progressText, seamOf, waitingText } from '../hooks/pack.tsx'

const PANE_PROPS = {
  title: 'pack',
  isFocused: true,
  bodyColumns: 100,
  placement: 'inline',
  scroll: { offset: 0, bodyRows: 40 },
  view: {},
} as const

const FORK_LINES = [
  'status: building',
  'goal: ship v2',
  'read_first:',
  '- /w/spec.md — the spec',
  'deliverable: /w/out.md',
  'decisions:',
  '- assemble by code — the fork cannot be trusted to copy',
  'unknowns:',
  '- does answer keep html comments',
]
const OK = (extra: string[] = []) => `GATE: ok\n${[...FORK_LINES, ...extra].join('\n')}`
const CWD = '/work'
const STATE = 'pack-proj-llm.md'
const JOURNAL = 'journal/proj.md'
const RULE = "Journal journal/proj.md: never read it whole; to see an entry, grep by id: grep -A8 '^### cNN' journal/proj.md"
const ISO = new Date(1_000_000).toISOString()
const TRAILER = '<!-- ckpt decision: use code · reasoning: because -->'

type World = {
  submits: string[]
  opens: string[]
  clears: number
  toasts: string[]
  logs: string[]
  logSinks: string[]
  statuses: (string | undefined)[]
  forkPrompts: string[]
  store: Map<string, unknown>
  files: Map<string, string>
  sid: string
  gate: Promise<void> | null
  // runs right after each fs.read answered: simulates another session writing between read and the size check
  afterRead: ((path: string) => void) | null
  failWrites: boolean
  // classic events whose bottom hook throws once (the chain beneath a gating hook failing), by event name
  failOps: Set<string>
  forkText: string | null
  // answers of the next forks, in order; empty = forkText
  forkQueue: string[]
  clock: { advance: (ms: number) => Promise<void> }
  // what $.agent.list() answers; forkAgent joins it once a fork has started
  agents: AgentInfo[]
  forkAgent: AgentInfo | null
  agentsThrow: boolean
}

// The engine resolves a relative path against the session cwd before the fs.* ops are answered: key files by their relative tail.
const rel = (path: string) => path.replace(/^.*?((?:(?:pack|relay)-[^/]+-llm\.md)|(?:journal\/[^/]+\.md))$/, '$1')

const bytes = (s: string) => new TextEncoder().encode(s).length

// Stubs the engine beneath the plugin: fork answers `w.forkText`, files live in `w.files`, everything else is recorded.
function world(on: On, forkText: string | null, store?: Record<string, unknown>, now = 1_000_000): World {
  // Own in-memory store (not mock.store) so the test can read what the plugin kept.
  const w: World = {
    submits: [],
    opens: [],
    clears: 0,
    toasts: [],
    logs: [],
    logSinks: [],
    statuses: [],
    forkPrompts: [],
    store: new Map(Object.entries(store ?? {})),
    files: new Map(),
    sid: 'sess-1',
    gate: null,
    afterRead: null,
    failWrites: false,
    failOps: new Set(),
    forkText,
    forkQueue: [],
    clock: { advance: async () => undefined },
    agents: [],
    forkAgent: null,
    agentsThrow: false,
  }
  on('store.get', (_$, e) => ({ value: w.store.get(e.key) }))
  on('store.set', (_$, e) => (w.store.set(e.key, e.value), { value: undefined }))
  on('store.delete', (_$, e) => (w.store.delete(e.key), { value: undefined }))
  w.clock = mock.clock(on, { now })
  // Calls on `$` (ops) answer `{ value }` or `{ deny }`; engine events answer their own result.
  on('model.fork', async (_$, e) => {
    w.forkPrompts.push(e.prompt)
    if (w.gate) await w.gate
    const text = w.forkQueue.shift() ?? w.forkText
    return {
      value:
        text === null
          ? { isAnswered: false, reason: 'nothing-to-fork' }
          : { isAnswered: true, text, usage: { input_tokens: 1, output_tokens: 1 } },
    }
  })
  on('agent.list', () => {
    if (w.agentsThrow) throw new Error('agent.list down')
    // a forked skill is in the list while its fork runs: the plugin must have listed before it started
    return { value: w.forkPrompts.length > 0 && w.forkAgent ? [...w.agents, w.forkAgent] : w.agents }
  })
  on('session.cwd', () => ({ value: CWD }))
  on('session.id', () => ({ value: w.sid }))
  on('fs.exists', (_$, e) => ({ value: w.files.has(rel(e.path)) }))
  on('fs.read', (_$, e) => {
    const text = w.files.get(rel(e.path))
    if (text === undefined) return { deny: 'ENOENT' }
    w.afterRead?.(rel(e.path))
    return { value: text }
  })
  on('fs.stat', (_$, e) => {
    const text = w.files.get(rel(e.path))
    return text === undefined ? { deny: 'ENOENT' } : { value: { kind: 'file', size: bytes(text), mtimeMs: 0, isLink: false } }
  })
  on('fs.write', (_$, e) => {
    if (w.failWrites) return { deny: 'EACCES' }
    w.files.set(rel(e.path), e.text)
    return { value: undefined }
  })
  on('ui.open', (_$, e) => {
    w.opens.push(e.id)
    return { value: { isPlaced: true } }
  })
  on('ui.close', () => ({ value: undefined }))
  on('ui.status', (_$, e) => (w.statuses.push(e.text), { value: undefined }))
  on('ui.toast', (_$, e) => (w.toasts.push(e.text), { value: undefined }))
  on('ui.log', (_$, e) => (w.logs.push(e.text), w.logSinks.push(e.to), { value: undefined }))
  on('classic.SessionStart', () => {
    if (w.failOps.delete('classic.SessionStart')) throw new Error('chain down')
    return {}
  })
  on('classic.UserPromptSubmit', () => {
    if (w.failOps.delete('classic.UserPromptSubmit')) throw new Error('chain down')
    return {}
  })
  on('turn.complete', (_$, e) => ({ text: e.answer }))
  on('session.measure', (_$, e) => ({ changed: e.changed }))
  on('command.run', { command: 'clear' }, () => {
    w.clears++
    return {}
  })
  on('prompt.submit', (_$, e) => {
    w.submits.push(e.text)
    return { text: e.text }
  })
  return w
}

const runCommand = ($: Engine, command: string, args = '') =>
  $.command.run({
    command,
    args,
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 120 },
  })

const runPack = ($: Engine, args = '') => runCommand($, 'pack', args)
const runUnpack = ($: Engine, args = '') => runCommand($, 'unpack', args)

// Pack on stream `proj` (explicit arg binds it).
const packProj = ($: Engine, flags = '') => runPack($, `proj ${flags}`.trim())

const mountPane = ($: Engine) =>
  $.ui.mount({ plugin: 'stoa', surface: 'terminal', component: 'Pane', requestId: 'pack', props: PANE_PROPS })

// A startup is a fresh session: unbinds the stream, drops phase and pending.
const fresh = ($: Engine) => $.classic.SessionStart({ source: 'startup' })
const clear = ($: Engine) => $.classic.SessionStart({ source: 'clear' })

const complete = ($: Engine, answer: string, extra: Record<string, unknown> = {}) =>
  $.turn.complete({ answer, durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer', ...extra } as never)

const title = ($: Engine, session_title: string) => $.classic.UserPromptSubmit({ prompt: 'x', session_title })

const settle = async (done: () => boolean) => {
  for (let i = 0; i < 100 && !done(); i++) await new Promise(r => setTimeout(r, 5))
}

const entry = (id: string, trailer: string, sid = 'old-sess') => `### ${id} 2026-10-05T00:00:00.000Z ${sid}\n${trailer}\n\n`

// Lines under `key:` of a state file, until the next key.
const section = (text: string, key: string) => {
  const lines = text.split('\n')
  const from = lines.indexOf(`${key}:`)
  if (from < 0) return []
  const out: string[] = []
  for (const l of lines.slice(from + 1)) {
    if (!l.startsWith('- ')) break
    out.push(l.slice(2))
  }
  return out
}

// ---------- v1 flow, adapted to the v2 state ----------

test('blocked gate: no pane, nothing stored, nothing written', async ($, on) => {
  const w = world(on, 'GATE: blocked - mid synthesis')
  await fresh($)
  const out = await packProj($)
  expect(out.text).toBe('pack: could not save stream "proj": mid synthesis. No fresh start armed.')
  expect(w.opens).toHaveLength(0)
  expect(w.store.get('pack:pending')).toBeUndefined()
  expect(w.files.has(STATE)).toBe(false)
})

test('fork without answer: blocked with the reason', async ($, on) => {
  const w = world(on, null)
  await fresh($)
  const out = await packProj($)
  expect(out.text).toBe('pack: could not save stream "proj": fork failed (nothing-to-fork). No fresh start armed.')
  expect(w.opens).toHaveLength(0)
})

test('ok gate: state written, pane opens with state + journal rule and two buttons', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await packProj($)
  expect(w.opens).toEqual(['pack'])
  const state = w.files.get(STATE) ?? ''
  expect(state).toContain('stream: proj')
  expect(state).toContain('goal: ship v2')
  const stored = w.store.get('pack:pending') as { pack: string; phase: string; cwd: string }
  expect(stored).toMatchObject({ phase: 'review', cwd: CWD })
  expect(stored.pack).toBe(`${state.trimEnd()}\n\n${RULE}`)
  const ui = await mountPane($)
  expect(await ui.findAll({ type: 'Button' })).toHaveLength(2)
  await ui.press({ key: 'cancel' })
  await ui.unmount()
})

test('cancel: store emptied, back to idle', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await packProj($)
  const ui = await mountPane($)
  await ui.press({ key: 'cancel' })
  await ui.unmount()
  expect(w.store.get('pack:pending')).toBeUndefined()
  const again = await packProj($)
  expect(again.text).toBeUndefined()
})

test('clear & continue: armed, /clear run, pack + unpack rules submitted once after clear', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await packProj($)
  const ui = await mountPane($)
  await ui.press({ key: 'continue' })
  await ui.unmount()
  expect(w.clears).toBe(1)
  expect(w.store.get('pack:pending')).toMatchObject({ phase: 'armed' })
  await clear($)
  expect(w.submits).toHaveLength(1)
  expect(w.submits[0]).toContain('goal: ship v2')
  expect(w.submits[0]).toContain(RULE)
  expect(w.submits[0]).toContain('Reply with one line saying you are ready, then stop there.')
  expect(w.store.get('pack:pending')).toBeUndefined()
})

test('/clear during review: no injection, pending dropped', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await packProj($)
  await clear($)
  expect(w.submits).toHaveLength(0)
  expect(w.store.get('pack:pending')).toBeUndefined()
})

test('stale store entry (> 10 min): no injection', async ($, on) => {
  const stale = { pack: 'p', phase: 'armed', cwd: CWD, createdAt: 0 }
  const w = world(on, null, { 'pack:pending': stale }, 11 * 60 * 1000)
  await fresh($)
  await clear($)
  expect(w.submits).toHaveLength(0)
  expect(w.store.get('pack:pending')).toBeUndefined()
})

test('fresh store entry from same cwd (mod reloaded): injected', async ($, on) => {
  const fresher = { pack: 'p', phase: 'armed', cwd: CWD, createdAt: 0 }
  const w = world(on, null, { 'pack:pending': fresher }, 60 * 1000)
  await clear($)
  expect(w.submits).toHaveLength(1)
})

test('--yes: no pane, armed, /clear scheduled after the hook, pack = state + journal rule, submitted after the clear', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  const out = await packProj($, '--yes')
  expect(out.text).toContain('Starting a fresh session')
  expect(out.text).toContain('type /clear')
  expect(w.opens).toHaveLength(0)
  // the host rejects command.run inside the hook: the clear runs from a clock.after dispatch
  expect(w.clears).toBe(0)
  await w.clock.advance(5)
  expect(w.clears).toBe(1)
  expect(w.store.get('pack:pending')).toMatchObject({ phase: 'armed' })
  await clear($)
  expect(w.submits).toHaveLength(1)
  const state = w.files.get(STATE) ?? ''
  expect(w.submits[0].startsWith(`${state.trimEnd()}\n\n${RULE}\n\nReply with one line saying you are ready, then stop there.`)).toBe(true)
})

test('-y with a 9,000-char decision: cut to fit by code, one fork, overflow line, armed', async ($, on) => {
  const w = world(on, OK(['decisions:', `- ${'x'.repeat(9_000)} — why`]))
  await fresh($)
  const out = await packProj($, '-y')
  expect(out.text).toContain('Starting a fresh session')
  expect(w.forkPrompts).toHaveLength(1)
  const state = w.files.get(STATE) ?? ''
  expect(state.length).toBeLessThanOrEqual(8_000)
  expect(state).not.toContain('xxxxxxxxxx')
  // un-id'd lines go last, oldest first: nothing numbered to drop here, so they are counted, not named
  expect(section(state, 'stale').at(-1)).toBe('overflow: dropped to fit 8000 chars: no journal line + 3 unnumbered — grep the journal by id')
  expect(w.files.get('pack-proj-status-llm.md')).toContain('outcome: degraded')
  expect(w.store.get('pack:pending')).toMatchObject({ phase: 'armed' })
})

test('-y with header + read_first alone over the cap: blocked, nothing written, nothing armed, no pane', async ($, on) => {
  const w = world(on, OK(['read_first:', `- /w/${'x'.repeat(9_000)} — role`]))
  await fresh($)
  const out = await packProj($, '-y')
  expect(out.text).toContain('pack: could not save stream "proj": state')
  expect(out.text).toContain('> 8000')
  expect(w.opens).toHaveLength(0)
  expect(w.clears).toBe(0)
  expect(w.files.has(STATE)).toBe(false)
  expect(w.store.get('pack:pending')).toBeUndefined()
  expect(w.forkPrompts).toHaveLength(1)
  expect(w.files.get('pack-proj-status-llm.md')).toContain('outcome: blocked\nreason: state')
  await clear($)
  expect(w.submits).toHaveLength(0)
})

// ---------- T9 stream binding ----------

test('stream: explicit arg > session_title > refuse', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  const refused = await runPack($, '--yes')
  expect(refused.text).toContain('no stream')
  expect(w.forkPrompts).toHaveLength(0)

  await title($, 'my-title')
  expect((await runPack($, '--yes')).text).toContain('stream "my-title" saved')
  await clear($)

  await runPack($, 'explicit --yes')
  expect(w.files.has('pack-explicit-llm.md')).toBe(true)
  await clear($)

  // the explicit binding wins over a later title
  await title($, 'later-title')
  expect((await runPack($, '--yes')).text).toContain('stream "explicit" saved')
})

test('stream: a session_title that is not a stream name is slugified', async ($, on) => {
  world(on, OK())
  const streamOf = async (t: string) => {
    await fresh($)
    await title($, t)
    const out = await runPack($, '--yes')
    return out.text?.match(/stream "(.+)" saved/)?.[1] ?? 'none'
  }
  expect(await streamOf('Keep_Case-1')).toBe('Keep_Case-1')
  expect(await streamOf('  Hello, World!! ')).toBe('hello-world')
  expect(await streamOf('a'.repeat(30) + ' ' + 'b'.repeat(30))).toBe('a'.repeat(30) + '-' + 'b'.repeat(19))
  expect(await streamOf('###')).toBe('none')
})

test('stream: binding survives /clear', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await packProj($, '--yes')
  await clear($)
  await complete($, `done\n${TRAILER}`)
  expect(w.files.get(JOURNAL)).toContain(TRAILER)
})

test('stream: reserved words and invalid names are refused', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  expect((await runPack($, 'save save')).text).toContain('reserved word')
  expect((await runUnpack($, 'load')).text).toContain('reserved word')
  expect((await runPack($, 'bad/name')).text).toContain('invalid stream')
  expect((await runPack($, 'a b')).text).toContain('too many arguments')
  expect((await runPack($, 'save --yes')).text).toContain('--yes only goes with the full form')
  expect(w.forkPrompts).toHaveLength(0)
})

test('pre-binding buffer: kept in the store, flushed to the journal when a stream gets bound', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await complete($, `a\n${TRAILER}`)
  expect(w.files.has(JOURNAL)).toBe(false)
  expect(w.store.get('pack:buffer:sess-1')).toHaveLength(1)
  await title($, 'proj')
  expect(w.files.get(JOURNAL)).toBe(`### c01 ${ISO} sess-1\n${TRAILER}\n\n`)
  expect(w.store.get('pack:buffer:sess-1')).toBeUndefined()
})

// ---------- T10 journal capture ----------

test('journal: trailer appended verbatim, ids monotonic across two turns', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await title($, 'proj')
  const second = '<!-- ckpt\nlearning: x\nopen: y\n-->'
  await complete($, `first\n${TRAILER}\nbye`)
  await complete($, `second ${second} end`)
  expect(w.files.get(JOURNAL)).toBe(`### c01 ${ISO} sess-1\n${TRAILER}\n\n### c02 ${ISO} sess-1\n${second}\n\n`)
})

test('journal: ids continue after the max existing id (c09 -> c10, c99 -> c100)', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await title($, 'proj')
  w.files.set(JOURNAL, entry('c09', 'old') + entry('c03', 'older'))
  await complete($, TRAILER)
  expect(w.files.get(JOURNAL)).toContain(`### c10 ${ISO} sess-1\n${TRAILER}`)
  w.files.set(JOURNAL, entry('c99', 'old'))
  await complete($, TRAILER)
  expect(w.files.get(JOURNAL)).toContain(`### c100 ${ISO} sess-1\n${TRAILER}`)
  expect(w.files.get(JOURNAL)?.startsWith(entry('c99', 'old'))).toBe(true)
})

test('journal: two trailers in one answer give two entries, in order', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await title($, 'proj')
  await complete($, `a <!-- ckpt decision: one --> b <!-- ckpt decision: two --> c`)
  expect(w.files.get(JOURNAL)).toBe(
    `### c01 ${ISO} sess-1\n<!-- ckpt decision: one -->\n\n### c02 ${ISO} sess-1\n<!-- ckpt decision: two -->\n\n`,
  )
})

test('journal: a subagent turn is ignored', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await title($, 'proj')
  await complete($, TRAILER, { agentId: 'agent-7' })
  expect(w.files.has(JOURNAL)).toBe(false)
  expect(w.store.get('pack:buffer:sess-1')).toBeUndefined()
})

test('journal: an aborted turn is ignored', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await title($, 'proj')
  await complete($, TRAILER, { isAborted: true, reason: 'aborted' })
  expect(w.files.has(JOURNAL)).toBe(false)
})

test('journal: size changed between read and write -> re-read and retry once', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await title($, 'proj')
  w.files.set(JOURNAL, entry('c01', 'mine'))
  let raced = false
  // another session appends c02 right after our first read
  w.afterRead = path => {
    if (raced) return
    raced = true
    w.files.set(path, (w.files.get(path) ?? '') + entry('c02', 'theirs'))
  }
  await complete($, TRAILER)
  const journal = w.files.get(JOURNAL) ?? ''
  expect(journal).toContain('theirs')
  expect(journal).toContain(`### c03 ${ISO} sess-1\n${TRAILER}`)
  expect(w.store.get('pack:buffer:sess-1')).toBeUndefined()
})

test('journal: still racing after the retry -> toast, entry kept in the store buffer, no throw', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await title($, 'proj')
  w.files.set(JOURNAL, entry('c01', 'mine'))
  let n = 0
  w.afterRead = path => w.files.set(path, (w.files.get(path) ?? '') + entry(`c${pad2(++n + 1)}`, 'theirs'))
  await complete($, TRAILER)
  expect(w.files.get(JOURNAL)).not.toContain(TRAILER)
  expect(w.store.get('pack:buffer:sess-1')).toHaveLength(1)
  expect(w.toasts.some(t => t.includes('Could not write the journal of stream'))).toBe(true)
  // the next successful capture flushes the buffer first
  w.afterRead = null
  await complete($, '<!-- ckpt decision: later -->')
  const journal = w.files.get(JOURNAL) ?? ''
  expect(journal.indexOf(TRAILER)).toBeLessThan(journal.indexOf('decision: later'))
  expect(w.store.get('pack:buffer:sess-1')).toBeUndefined()
})

test('journal: a failing write never throws into the engine', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await title($, 'proj')
  w.failWrites = true
  const out = await complete($, TRAILER)
  expect(out.text).toContain('ckpt')
  expect(w.store.get('pack:buffer:sess-1')).toHaveLength(1)
})

const pad2 = (n: number) => String(n).padStart(2, '0')

// ---------- T11 state assembly ----------

test('state: clauses parsed by code and routed by type, reasoning and pivot stay in the journal', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  w.files.set(
    JOURNAL,
    entry('c01', '<!-- ckpt decision: use code · reasoning: because x · learning: L1 · pivot: P1 -->') +
      entry(
        'c02',
        '<!-- ckpt\nrejected: tried A — too slow\nconstraint: no git\nopen: who owns X?\nassumption: cwd is stable\ndefinition: stream=named journal\nrefs: /w/a.md→§2\n-->',
      ),
  )
  await packProj($, '--yes')
  const state = w.files.get(STATE) ?? ''
  expect(section(state, 'decisions')).toEqual(['use code (c01)', 'no git (c02)', 'assemble by code — the fork cannot be trusted to copy'])
  expect(section(state, 'learnings')).toEqual(['L1 (c01)', 'stream=named journal (c02)'])
  expect(section(state, 'discarded')).toEqual(['tried A — too slow (c02)'])
  expect(section(state, 'next')).toEqual(['who owns X? (c02)'])
  expect(section(state, 'unknowns')).toEqual(['cwd is stable (c02)', 'does answer keep html comments'])
  expect(section(state, 'read_if_needed')).toEqual(['/w/a.md→§2 (c02)'])
  expect(state).not.toContain('because x')
  expect(state).not.toContain('P1')
  expect(state).toContain('journal_cursor: c02')
  // the fork got the entries with their ids, never the journal file path to read
  expect(w.forkPrompts[0]).toContain('### c01\n<!-- ckpt decision: use code')
})

test('state: 7 header fields then 10 body fields, in table order', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await packProj($, '--yes')
  const keys = (w.files.get(STATE) ?? '').split('\n').flatMap(l => l.match(/^([a-z_]+):/)?.[1] ?? [])
  expect(keys).toEqual([
    'stream', 'saved', 'status', 'previous_session', 'goal', 'journal', 'journal_cursor',
    'read_first', 'read_if_needed', 'deliverable', 'decisions', 'learnings', 'discarded', 'in_progress', 'next', 'unknowns', 'stale',
  ])
  const state = w.files.get(STATE) ?? ''
  expect(state).toContain('journal: journal/proj.md')
  expect(state).toContain('journal_cursor: c00')
  expect(state).toContain(`saved: ${ISO} sess-1`)
})

test('state: reversed decision moves to discarded with its id, answered open is retired, cursor advances', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  w.files.set(JOURNAL, entry('c01', '<!-- ckpt decision: use A · open: who owns X? · assumption: cwd stable -->'))
  await packProj($, '--yes')
  expect(section(w.files.get(STATE) ?? '', 'decisions')).toContain('use A (c01)')
  await clear($)

  w.files.set(JOURNAL, (w.files.get(JOURNAL) ?? '') + entry('c02', '<!-- ckpt decision: use B instead · learning: A is slow -->'))
  w.forkText = OK(['retire_reversed: c01', 'retire_answered: c01'])
  await packProj($, '--yes')
  const state = w.files.get(STATE) ?? ''
  expect(section(state, 'decisions')).not.toContain('use A (c01)')
  expect(section(state, 'decisions')).toContain('use B instead (c02)')
  expect(section(state, 'discarded')).toEqual(['use A — reversed (c01)'])
  expect(section(state, 'next')).toEqual([])
  expect(section(state, 'unknowns')).not.toContain('cwd stable (c01)')
  expect(state).toContain('journal_cursor: c02')
  // second fork only gets the entries after the cursor, plus the previous state
  expect(w.forkPrompts[1]).toContain('### c02')
  expect(w.forkPrompts[1]).not.toContain('### c01')
  expect(w.forkPrompts[1]).toContain('PREVIOUS STATE:\nstream: proj')
})

test('state: a fork decision without its why is flagged, a fork line ending in (cNN) is dropped', async ($, on) => {
  const w = world(on, OK(['decisions:', '- no why here', '- stolen line (c42)']))
  await fresh($)
  await packProj($, '--yes')
  const decisions = section(w.files.get(STATE) ?? '', 'decisions')
  expect(decisions).toContain('no why here — why missing')
  expect(decisions.join('\n')).not.toContain('c42')
})

test('state: previous_session = previous writer when another session saves', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await packProj($, '--yes')
  expect(w.files.get(STATE)).toContain('previous_session: none')
  await clear($)
  w.sid = 'sess-2'
  await packProj($, '--yes')
  expect(w.files.get(STATE)).toContain('previous_session: sess-1')
  expect(w.files.get(STATE)).toContain(`saved: ${ISO} sess-2`)
})

test('state: over 8,000 chars cuts read_if_needed, then stale, then in_progress; never decisions/next/unknowns', async ($, on) => {
  const lines = (key: string, n: number) => [`${key}:`, ...Array.from({ length: n }, (_, i) => `- /${key}/${pad2(i)} — ${'x'.repeat(90)}`)]
  const big = OK([...lines('read_if_needed', 5), ...lines('stale', 40), ...lines('in_progress', 30), ...lines('next', 3)])
  const w = world(on, big)
  await fresh($)
  await packProj($, '--yes')
  const state = w.files.get(STATE) ?? ''
  expect(state.length).toBeLessThanOrEqual(8_000)
  expect(section(state, 'read_if_needed')).toHaveLength(0)
  const stale = section(state, 'stale').length
  expect(stale).toBeGreaterThan(0)
  expect(stale).toBeLessThan(40)
  expect(section(state, 'in_progress')).toHaveLength(30)
  expect(section(state, 'next')).toHaveLength(3)
  expect(section(state, 'decisions')).toHaveLength(1)
  expect(section(state, 'unknowns')).toHaveLength(1)
  expect(w.toasts.length).toBe(0)
})

test('state: read_if_needed is compressed before anything is dropped', async ($, on) => {
  const rin = ['read_if_needed:', ...Array.from({ length: 45 }, (_, i) => `- /r/${pad2(i)} — ${'x'.repeat(200)}`)]
  const w = world(on, OK(rin))
  await fresh($)
  await packProj($, '--yes')
  const lines = section(w.files.get(STATE) ?? '', 'read_if_needed')
  expect(lines.length).toBeGreaterThan(0)
  expect(lines.every(l => l.length <= 80)).toBe(true)
})

// ---------- 0.4.0: legacy state, retire keys, over-cap degradation, status file ----------

const LEGACY = 'relay-proj-llm.md'
const STATUS = 'pack-proj-status-llm.md'

test('migration: state under the legacy relay- name only -> previous state, written forward, cursor and predecessor kept', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  w.files.set(
    LEGACY,
    ['stream: proj', `saved: ${ISO} sess-1`, 'predecessor: older-sess', 'goal: ship v1', 'journal: journal/proj.md', 'journal_cursor: c02', '', 'decisions:', '- use A — why (c01)', 'learnings:', '- L1 (c02)'].join('\n'),
  )
  w.files.set(JOURNAL, entry('c01', '<!-- ckpt decision: use A -->') + entry('c02', '<!-- ckpt learning: L1 -->') + entry('c03', '<!-- ckpt learning: L3 -->'))
  await runPack($, 'save proj')
  await settle(() => w.toasts.length > 0)
  expect(w.toasts[0]).toContain('migrated from relay-proj-llm.md')
  const state = w.files.get(STATE) ?? ''
  expect(state).toContain('journal_cursor: c03')
  expect(state).toContain('previous_session: older-sess')
  expect(section(state, 'decisions')).toContain('use A — why (c01)')
  expect(section(state, 'learnings')).toEqual(['L1 (c02)', 'L3 (c03)'])
  // incremental: the fork got the legacy state and only the entries after its cursor
  expect(w.forkPrompts[0]).toContain('PREVIOUS STATE:\nstream: proj')
  expect(w.forkPrompts[0]).toContain('### c03')
  expect(w.forkPrompts[0]).not.toContain('### c02')
  // written forward: the next save reads the new name, no second migration
  await runPack($, 'save')
  await settle(() => w.toasts.length > 1)
  expect(w.toasts[1]).not.toContain('migrated')
})

test('migration: the new name wins when both files exist', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  w.files.set(STATE, 'stream: proj\ngoal: from pack\n')
  w.files.set(LEGACY, 'stream: proj\ngoal: from relay\n')
  await packProj($, '--yes')
  expect(w.forkPrompts[0]).toContain('goal: from pack')
  expect(w.forkPrompts[0]).not.toContain('goal: from relay')
})

test('retire: superseded decision -> discarded, done next item and obsolete learning vanish', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  w.files.set(JOURNAL, entry('c01', '<!-- ckpt decision: use A · open: write docs · learning: bug in X -->'))
  await packProj($, '--yes')
  await clear($)
  w.files.set(JOURNAL, (w.files.get(JOURNAL) ?? '') + entry('c02', '<!-- ckpt decision: use B · learning: X fixed -->'))
  w.forkText = OK(['retire_superseded: c01', 'retire_done: c01', 'retire_learned: c01'])
  await packProj($, '--yes')
  const state = w.files.get(STATE) ?? ''
  expect(section(state, 'decisions')).not.toContain('use A (c01)')
  expect(section(state, 'decisions')).toContain('use B (c02)')
  expect(section(state, 'discarded')).toEqual(['use A — superseded (c01)'])
  expect(section(state, 'next')).toEqual([])
  expect(section(state, 'learnings')).toEqual(['X fixed (c02)'])
})

// A saved state near the cap: discarded c01-c02, learnings c03..c<n+2>, cursor on the last one.
const nearCap = (n: number) =>
  [
    'stream: proj', `saved: ${ISO} sess-1`, 'status: building', 'previous_session: none', 'goal: ship v2', 'journal: journal/proj.md', `journal_cursor: c${pad2(n + 2)}`, '',
    'discarded:', '- tried D1 — slow (c01)', '- tried D2 — slow (c02)',
    'learnings:', ...Array.from({ length: n }, (_, i) => `- L${i + 3} ${'y'.repeat(90)} (c${pad2(i + 3)})`),
  ].join('\n')

test('over cap: one fork only, degraded state written (discarded then learnings dropped, overflow named), cursor advances', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  w.files.set(STATE, nearCap(74))
  expect((w.files.get(STATE) ?? '').length).toBeGreaterThan(7_700)
  w.files.set(JOURNAL, [77, 78, 79].map(n => entry(`c${n}`, `<!-- ckpt learning: new ${n} -->`)).join(''))
  await runPack($, 'save proj')
  await settle(() => w.toasts.length > 0)
  expect(w.forkPrompts).toHaveLength(1)
  expect(w.forkPrompts[0]).not.toContain('OVERFLOW:')
  const state = w.files.get(STATE) ?? ''
  expect(state.length).toBeLessThanOrEqual(8_000)
  expect(state).toContain('journal_cursor: c79')
  expect(section(state, 'discarded')).toEqual([])
  const learnings = section(state, 'learnings')
  expect(learnings).not.toContain(`L3 ${'y'.repeat(90)} (c03)`)
  expect(learnings.slice(-3)).toEqual(['new 77 (c77)', 'new 78 (c78)', 'new 79 (c79)'])
  expect(section(state, 'stale').at(-1)).toMatch(/^overflow: dropped to fit 8000 chars: c01, c02, c03.* — grep the journal by id$/)
  expect(section(state, 'decisions')).toHaveLength(1)
  // toast + sticky status: plain words; the cut details stay in the status file
  expect(w.toasts[0]).toBe('\u26A0 Stream "proj" saved over the size cap: old entries dropped, see pack-proj-status-llm.md')
  expect(w.statuses.at(-1)).toBe(w.toasts[0])
  expect(w.files.get(STATUS)).toContain('outcome: degraded')
  expect(w.files.get(STATUS)).toContain('over the cap, dropped: ')
  expect(w.files.get(STATUS)).toContain('discarded -2, learnings -')
})

test('over cap, the fork retires enough on its first call: clean state, nothing dropped, one fork', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  w.files.set(STATE, nearCap(74))
  w.files.set(JOURNAL, [77, 78, 79].map(n => entry(`c${n}`, `<!-- ckpt learning: new ${n} -->`)).join(''))
  const ids = Array.from({ length: 20 }, (_, i) => `c${pad2(i + 3)}`).join(', ')
  w.forkText = OK([`retire_learned: ${ids}`])
  await packProj($, '--yes')
  const state = w.files.get(STATE) ?? ''
  expect(w.forkPrompts).toHaveLength(1)
  expect(state).not.toContain('overflow:')
  expect(section(state, 'discarded')).toHaveLength(2)
  expect(section(state, 'learnings')).not.toContain(`L3 ${'y'.repeat(90)} (c03)`)
  expect(section(state, 'learnings')).toContain(`L23 ${'y'.repeat(90)} (c23)`)
  expect(w.files.get(STATUS)).toContain('outcome: ok')
})

test('first fork prompt: ceiling, previous size and room; the retire-first nudge only when the room is tight', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await packProj($, '--yes')
  expect(w.forkPrompts[0]).toContain('may not exceed 8,000 characters')
  expect(w.forkPrompts[0]).toContain('PREVIOUS STATE is 0 characters: 8,000 left')
  expect(w.forkPrompts[0]).not.toContain('Room is tight')
  expect(w.forkPrompts[0]).not.toContain('Total ≤ 8,000')
  await clear($)
  const prev = w.files.get(STATE) ?? ''
  // a fatter previous state: the figures follow its real length
  w.files.set(STATE, nearCap(74))
  const size = (w.files.get(STATE) ?? '').length
  await packProj($, '--yes')
  const prompt = w.forkPrompts[1]
  expect(prompt).toContain(`PREVIOUS STATE is ${size.toLocaleString('en-US')} characters: ${(8_000 - size).toLocaleString('en-US')} left`)
  expect(prompt).toContain('Room is tight: designate retire_* ids first')
  expect(prev.length).toBeLessThan(size)
})

test('over cap: id\'d lines of every section go oldest cNN first, decisions included; ceiling holds; overflow names them', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  const big = (tag: string) => `${tag} ${'z'.repeat(3_000)}`
  w.files.set(
    STATE,
    [
      'stream: proj', `saved: ${ISO} sess-1`, 'status: building', 'previous_session: none', 'goal: ship v2', 'journal: journal/proj.md', 'journal_cursor: c07', '',
      'decisions:', `- ${big('D5')} (c05)`, `- ${big('D7')} (c07)`,
      'next:', `- ${big('N1')} (c01)`,
      'unknowns:', `- ${big('U3')} (c03)`,
    ].join('\n'),
  )
  await packProj($, '--yes')
  expect(w.forkPrompts).toHaveLength(1)
  const state = w.files.get(STATE) ?? ''
  expect(state.length).toBeLessThanOrEqual(8_000)
  // 12,000+ chars of numbered lines: c01 (next) and c03 (unknowns) go, the decisions c05 and c07 stay
  expect(section(state, 'next')).toEqual([])
  expect(section(state, 'unknowns').some(l => l.includes('U3'))).toBe(false)
  expect(section(state, 'decisions').filter(l => l.includes('(c0'))).toEqual([`${big('D5')} (c05)`, `${big('D7')} (c07)`])
  expect(section(state, 'stale').at(-1)).toBe('overflow: dropped to fit 8000 chars: c01, c03 — grep the journal by id')
  expect(w.files.get(STATUS)).toContain('next -1, unknowns -1')
})

test('over cap: after discarded and learnings, a decision is cut too, the oldest cNN first', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  const big = (tag: string) => `${tag} ${'z'.repeat(3_000)}`
  w.files.set(
    STATE,
    [
      'stream: proj', `saved: ${ISO} sess-1`, 'status: building', 'previous_session: none', 'goal: ship v2', 'journal: journal/proj.md', 'journal_cursor: c09', '',
      'decisions:', `- ${big('D9')} (c09)`, `- ${big('D2')} (c02)`, `- ${big('D4')} (c04)`,
      'learnings:', `- ${big('L6')} (c06)`,
    ].join('\n'),
  )
  await packProj($, '--yes')
  const state = w.files.get(STATE) ?? ''
  expect(state.length).toBeLessThanOrEqual(8_000)
  expect(section(state, 'learnings')).toEqual([])
  expect(section(state, 'decisions').some(l => l.includes('D2'))).toBe(false)
  expect(section(state, 'decisions').some(l => l.includes('D9'))).toBe(true)
  // learnings go first (existing step), then the oldest numbered decision: c02 before c04 and c09
  expect(section(state, 'decisions').some(l => l.includes('D4'))).toBe(true)
  expect(section(state, 'stale').at(-1)).toBe('overflow: dropped to fit 8000 chars: c02, c06 — grep the journal by id')
})

test('status file: a failed save leaves its reason on disk and the toast points to it', async ($, on) => {
  const w = world(on, 'GATE: blocked - mid synthesis')
  await fresh($)
  await runPack($, 'save proj')
  await settle(() => w.toasts.length > 0)
  expect(w.toasts[0]).toContain('pack-proj-status-llm.md')
  expect(w.files.get(STATUS)).toBe(`stream: proj\nat: ${ISO}\noutcome: blocked\nreason: mid synthesis\n`)
  expect(w.files.has(STATE)).toBe(false)
})

// ---------- T11 save: unawaited fork ----------

test('save: returns before the fork settles, writes the state after, toasts the outcome', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  let release: () => void = () => undefined
  w.gate = new Promise<void>(r => (release = r))
  const out = await runPack($, 'save proj')
  expect(out.text).toBe('pack: save of stream "proj" started; the outcome will show in the status line')
  expect(w.files.has(STATE)).toBe(false)
  expect((await runPack($, 'save proj')).text).toBe('pack: a save is running, its outcome will show in the status line')
  release()
  await settle(() => w.files.has(STATE))
  expect(w.files.get(STATE)).toContain('goal: ship v2')
  await settle(() => w.toasts.some(t => t.includes('saved')))
  expect(w.toasts.some(t => t.includes('Stream "proj" saved'))).toBe(true)
  expect(w.opens).toHaveLength(0)
  expect(w.clears).toBe(0)
  // the guard is released: a second save runs
  expect((await runPack($, 'save')).text).toBe('pack: save of stream "proj" started; the outcome will show in the status line')
  await settle(() => w.toasts.filter(t => t.includes('saved')).length === 2)
})

test('save: a blocked fork toasts the reason and writes nothing', async ($, on) => {
  const w = world(on, 'GATE: blocked - mid synthesis')
  await fresh($)
  await runPack($, 'save proj')
  await settle(() => w.toasts.length > 0)
  expect(w.toasts[0]).toContain('mid synthesis')
  expect(w.files.has(STATE)).toBe(false)
})

// ---------- T12 load ----------

test('load: injects state + journal rule + unpack rules as the first message', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  w.files.set(STATE, 'stream: proj\ngoal: g\n')
  const out = await runUnpack($, 'proj')
  expect(out.text).toBe('unpack: loading stream "proj" as the first message.')
  expect(out.text).toContain('loading stream "proj" as the first message')
  // the host refuses prompt.submit inside the command.run hook: it runs from a clock.after dispatch
  expect(w.submits).toHaveLength(0)
  await w.clock.advance(5)
  expect(w.submits).toHaveLength(1)
  expect(w.submits[0].startsWith('stream: proj\ngoal: g\n\nJournal journal/proj.md')).toBe(true)
  expect(w.submits[0]).toContain(RULE)
  expect(w.submits[0]).toContain('Reply with one line saying you are ready, then stop there.')
  expect(w.submits[0]).toContain('Questions go to me, in this window.')
  expect(w.submits[0]).toContain('After my go, read the `read_first` files before acting.')
  expect(w.submits[0]).not.toContain('orchestrator')
  expect(w.forkPrompts).toHaveLength(0)
})

test('load: missing state file -> {text} error, nothing injected', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  const out = await runUnpack($, 'nowhere')
  expect(out.text).toContain('unpack: no saved stream "nowhere" in this folder')
  expect(w.submits).toHaveLength(0)
})

test('unpack without a stream: clear reply, nothing injected', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  expect((await runUnpack($)).text).toBe('unpack: no stream given. Usage: /unpack <stream>')
  expect(w.submits).toHaveLength(0)
})

test('unpack: bad arguments are refused with the unpack usage', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  expect((await runUnpack($, 'bad/name')).text).toContain('invalid stream')
  expect((await runUnpack($, 'a b')).text).toBe('unpack: too many arguments. Usage: /unpack <stream>')
  expect((await runUnpack($, 'proj --yes')).text).toBe('unpack: unknown option --yes. Usage: /unpack <stream>')
  expect(w.submits).toHaveLength(0)
})

test('unpack <stream> reaches load: injects the state of a stream saved by /pack, and binds the stream', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  expect((await runPack($, 'save proj')).text).toBe('pack: save of stream "proj" started; the outcome will show in the status line')
  await settle(() => w.files.has(STATE))
  await fresh($)
  const out = await runUnpack($, 'proj')
  expect(out.text).toBe('unpack: loading stream "proj" as the first message.')
  await w.clock.advance(5)
  expect(w.submits).toHaveLength(1)
  expect(w.submits[0]).toContain('goal: ship v2')
  expect(w.submits[0]).toContain(RULE)
  // the stream is bound for the rest of the session, as the old load verb did
  expect((await runPack($, 'save')).text).toBe('pack: save of stream "proj" started; the outcome will show in the status line')
  await settle(() => w.toasts.some(t => t.includes('saved')))
})

test('pack load: removed, points to /unpack', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  w.files.set(STATE, 'stream: proj\ngoal: g\n')
  expect((await runPack($, 'load proj')).text).toBe('pack: load moved: type /unpack <stream>')
  expect((await runPack($, 'load')).text).toBe('pack: load moved: type /unpack <stream>')
  await w.clock.advance(5)
  expect(w.submits).toHaveLength(0)
})

test('register: /pack and /unpack are both declared at session start', async ($, on) => {
  const registered: { name: string; description?: string; argumentHint?: string }[] = []
  world(on, OK())
  on('command.register', (_$, e) => (registered.push(e as never), { value: { command: (e as { name: string }).name } }) as never)
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: CWD, surface: 'terminal', isInteractive: true })
  expect(registered.map(c => c.name).sort()).toEqual(['pack', 'unpack'])
  expect(registered.find(c => c.name === 'unpack')?.argumentHint).toBe('<stream>')
  expect(registered.find(c => c.name === 'pack')?.argumentHint).toBe('save [stream] | cancel | [stream] [--yes]')
})

// ---------- on-screen trailer hiding ----------

test('hideTrailer: closed trailer stripped, marker lists the clause keywords', () => {
  expect(hideTrailer(`Done.\n\n${TRAILER}\n`)).toBe(`Done.\n\n_ckpt: decision, reasoning_`)
})

test('hideTrailer: two trailers -> one marker, keywords deduplicated in first-seen order', () => {
  const t2 = '<!-- ckpt learning: x · decision: y -->'
  const out = hideTrailer(`a\n${TRAILER}\nb\n${t2}\n`)
  expect(out).not.toContain('<!--')
  expect(out).toBe(`a\nb\n\n_ckpt: decision, reasoning, learning_`)
})

test('hideTrailer: unclosed streaming trailer stripped, no marker yet', () => {
  expect(hideTrailer('Working on it.\n\n<!-- ckpt decision: use co')).toBe('Working on it.')
  expect(hideTrailer(`x\n${TRAILER}\n<!-- ckpt lear`)).toBe('x')
})

test('hideTrailer: no trailer -> same string', () => {
  const t = 'plain **md**\n\n<!-- other comment -->\n  '
  expect(hideTrailer(t)).toBe(t)
  expect(hideTrailer('')).toBe('')
})

test('hideTrailer: text before the trailer kept byte for byte; no recognized clause -> bare marker', () => {
  const before = '  Line one \t\n\n```ts\nconst a = 1\n```\n- item  \n\nlast line'
  expect(hideTrailer(`${before}\n\n${TRAILER}`).startsWith(`${before}\n\n_ckpt:`)).toBe(true)
  expect(hideTrailer(`${before}\n<!-- ckpt nothing known -->`)).toBe(`${before}\n\n_ckpt_`)
  expect(hideTrailer(`<!-- ckpt open: q -->`)).toBe(`_ckpt: open_`)
})

test('hideTrailer: idempotent', () => {
  const once = hideTrailer(`a\n${TRAILER}`)
  expect(hideTrailer(once)).toBe(once)
})

// The test kit has no native transcript beneath the plugin: this stand-in draws the props it receives (after the mod's rewrite) as one Markdown.
const drawMessages = (on: On) => on('ui.render', { component: 'AssistantMessage' }, (_$, e) => ({ type: 'Markdown', props: { text: e.props.text } }) as never)

const mountMessage = ($: Engine, text: string, requestId = 'm1', isFullscreen = true) =>
  $.ui.mount({
    plugin: 'stoa',
    surface: 'terminal',
    component: 'AssistantMessage',
    requestId,
    viewport: { columns: 100, rows: 40, isFullscreen },
    props: { text, isFirstOfReply: true },
  } as never)

const REPLY = `Hello.\n\n${TRAILER}`
const COLLAPSED = /\u25B8 ckpt: decision, reasoning/
const EXPANDED = /\u25BE ckpt: decision, reasoning/
const found = async (ui: Awaited<ReturnType<typeof mountMessage>>, text: RegExp) => (await ui.findAll({ text })).length > 0

test('ui.render AssistantMessage: collapsed draw = reply + marker with clauses, no trailer text', async ($, on) => {
  world(on, OK())
  drawMessages(on)
  const ui = await mountMessage($, REPLY)
  expect(await ui.findAll({ text: /<!-- ckpt/ })).toHaveLength(0)
  expect(await ui.findAll({ text: /use code/ })).toHaveLength(0)
  expect(await found(ui, COLLAPSED)).toBe(true)
  expect(await found(ui, /Hello\./)).toBe(true)
  expect(await ui.findAll({ type: 'Button' })).toHaveLength(1)
  await ui.unmount()
})

test('ui.render AssistantMessage: press on the marker expands to the full trailer, a second press collapses', async ($, on) => {
  world(on, OK())
  drawMessages(on)
  const ui = await mountMessage($, REPLY)
  await ui.press({ key: 'ckpt-toggle' })
  expect(await found(ui, EXPANDED)).toBe(true)
  expect(await found(ui, /use code · reasoning: because/)).toBe(true)
  expect(await found(ui, COLLAPSED)).toBe(false)
  await ui.press({ key: 'ckpt-toggle' })
  expect(await found(ui, COLLAPSED)).toBe(true)
  expect(await ui.findAll({ text: /use code/ })).toHaveLength(0)
  await ui.unmount()
})

test('ui.render AssistantMessage: two replies toggle independently (one requestId each)', async ($, on) => {
  world(on, OK())
  drawMessages(on)
  const a = await mountMessage($, REPLY, 'ma')
  const b = await mountMessage($, REPLY, 'mb')
  await a.press({ key: 'ckpt-toggle' })
  expect(await found(a, EXPANDED)).toBe(true)
  expect(await found(b, COLLAPSED)).toBe(true)
  expect(await found(b, /use code/)).toBe(false)
  await b.press({ key: 'ckpt-toggle' })
  await a.press({ key: 'ckpt-toggle' })
  expect(await found(a, COLLAPSED)).toBe(true)
  expect(await found(b, EXPANDED)).toBe(true)
  await b.press({ key: 'ckpt-toggle' })
  await a.unmount()
  await b.unmount()
})

test('ui.render AssistantMessage: not fullscreen -> collapsed marker still drawn', async ($, on) => {
  world(on, OK())
  drawMessages(on)
  const ui = await mountMessage($, REPLY, 'm1', false)
  expect(await found(ui, COLLAPSED)).toBe(true)
  expect(await found(ui, /use code/)).toBe(false)
  await ui.unmount()
})

test('ui.render AssistantMessage: streaming unclosed trailer rewritten as text, no marker', async ($, on) => {
  world(on, OK())
  drawMessages(on)
  const ui = await mountMessage($, 'Working.\n\n<!-- ckpt decision: use co')
  expect(await found(ui, /Working\./)).toBe(true)
  expect(await ui.findAll({ text: /ckpt/ })).toHaveLength(0)
  expect(await ui.findAll({ type: 'Button' })).toHaveLength(0)
  await ui.unmount()
})

test('ui.render AssistantMessage: no trailer -> drawn untouched', async ($, on) => {
  world(on, OK())
  drawMessages(on)
  const ui = await mountMessage($, 'Just text.')
  expect(await found(ui, /Just text\./)).toBe(true)
  expect(await ui.findAll({ text: /ckpt/ })).toHaveLength(0)
  expect(await ui.findAll({ type: 'Button' })).toHaveLength(0)
  await ui.unmount()
})

test('journal capture still sees the full trailer while the drawing hides it', async ($, on) => {
  const w = world(on, OK())
  drawMessages(on)
  await fresh($)
  await packProj($, '--yes')
  const answer = `Done.\n\n${TRAILER}`
  const ui = await mountMessage($, answer)
  expect(await ui.findAll({ text: /<!-- ckpt/ })).toHaveLength(0)
  await ui.unmount()
  await complete($, answer)
  expect(w.files.get(JOURNAL)).toContain(TRAILER)
})


// ---------- T19 / T21 context zones ----------

// Live shape: 200k window, wall (autoCompactThreshold) below it. All floors are relative to the WINDOW (T22).
const WINDOW = 200_000
const WALL = 160_000
// A decision = a simple seam. A closed task or a pivot = a strong seam (text detection, no new clause).
const SEAM = 'Done.\n\n<!-- ckpt decision: use code · reasoning: because -->'
const TASK = 'Done.\n\n<!-- ckpt learning: x · open: T19 done -->'
const PIVOT = 'Done.\n\n<!-- ckpt pivot: switch to code · reasoning: because -->'

const FRESH = 'Good moment for a fresh start'
const STRONG_MSG = (pct: number) => `${FRESH}: T19 just closed (context ${pct}%). Type /pack --yes`
const PIVOT_MSG = (pct: number) => `${FRESH}: the direction just changed (context ${pct}%). Type /pack --yes`
const SIMPLE_MSG = (pct: number) => `${FRESH}: a decision just landed (context ${pct}%). Type /pack --yes`
const SAVED_MSG = (pct: number) => `Progress saved automatically (context ${pct}%). Type /pack --yes to continue in a fresh session`
const SAVING_MSG = (pct: number) => `Context almost full (${pct}%): automatically saving your progress...`

// Stubs session.usage; `calls.n` counts the asks. wall null = no autoCompactThreshold; raw null = no rawMaxTokens.
function usage(on: On, wall: number | null = WALL, raw: number | null = null, window = WINDOW) {
  const calls = { n: 0, args: [] as unknown[] }
  on('session.usage', (_$, e) => {
    calls.n++
    calls.args.push({ breakdown: e.breakdown })
    return {
      value: {
        startedAt: 0,
        context: {
          window,
          breakdown: { autoCompactThreshold: wall ?? undefined, rawMaxTokens: raw ?? undefined },
        },
        rateLimits: [],
      },
    } as never
  })
  return calls
}

const measure = ($: Engine, tokens: number | undefined, changed: string[] = ['context'], percent?: number, window = WINDOW) =>
  $.session.measure({
    context: tokens === undefined ? { window } : { window, tokens, ...(percent === undefined ? {} : { percent }) },
    rateLimits: [],
    changed,
  } as never)

const at = (fill: number) => Math.round(fill * WINDOW)
const advised = (w: World) => w.toasts.filter(t => t.includes(FRESH))
// The zone tests bind no stream: their trailers wait in the store and the no-stream hint is the background line, read as no line.
const HINT = /^\d+ checkpoints? waiting for a stream/
const lastStatus = (w: World) => {
  const s = w.statuses[w.statuses.length - 1]
  return s !== undefined && HINT.test(s) ? undefined : s
}
const lines = (w: World) => w.statuses.filter(s => s !== undefined && !HINT.test(s))
const ctxLines = (w: World) => w.logs.filter(l => l.startsWith('pack: ctx pct='))

test('zones: constants', () => {
  expect(STRONG).toBe(0.3)
  expect(SOFT).toBe(0.5)
  expect(HARD).toBe(0.7)
  expect(WALL_CAP).toBe(0.95)
})

test('zones: hardAtOf = min(HARD * window, WALL_CAP * wall); no wall = HARD * window', () => {
  expect(hardAtOf(200_000, 167_000)).toBe(140_000)
  expect(hardAtOf(1_000_000, 400_000)).toBe(380_000)
  expect(hardAtOf(1_000_000, 1_000_000)).toBe(700_000)
  expect(hardAtOf(200_000, null)).toBe(140_000)
})

test('zones: floors are exact on the WINDOW (strong 30%, simple 50%, hard 70%)', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await title($, 'proj')
  await complete($, TASK)
  await measure($, 59_999)
  expect(advised(w)).toHaveLength(0)
  await measure($, 60_000)
  expect(advised(w)).toEqual([STRONG_MSG(30)])
  await clear($)
  await complete($, SEAM)
  await measure($, 99_999)
  expect(advised(w)).toHaveLength(1)
  await measure($, 100_000)
  expect(advised(w)).toEqual([STRONG_MSG(30), SIMPLE_MSG(50)])
  await clear($)
  await measure($, 139_999)
  expect(w.forkPrompts).toHaveLength(0)
  await measure($, 140_000)
  await settle(() => w.toasts.some(t => t.includes('Progress saved')))
  expect(w.forkPrompts).toHaveLength(1)
})

test('zones: the message shows the window percent, the status-line one when present (live: 116,000 / 200,000, wall 167,000 -> 58%)', async ($, on) => {
  const w = world(on, OK())
  usage(on, 167_000)
  await fresh($)
  await complete($, TASK)
  await measure($, 116_000)
  expect(lastStatus(w)).toBe(STRONG_MSG(58))
  await measure($, 116_000, ['context'], 57)
  expect(lastStatus(w)).toBe(STRONG_MSG(57))
  expect(advised(w)).toEqual([STRONG_MSG(58)])
})

test('zones: hasDecisionSeam needs a decision clause in a ckpt trailer', () => {
  expect(hasDecisionSeam(SEAM)).toBe(true)
  expect(hasDecisionSeam('x\n<!-- ckpt learning: a · open: b -->')).toBe(false)
  expect(hasDecisionSeam('decision: not in a trailer')).toBe(false)
})

test('seam: "T19 done", "T21 ✅", "closes T4" and a pivot clause are strong', () => {
  expect(seamOf('<!-- ckpt learning: x · open: T19 done -->')).toEqual({ level: 'strong', task: 'T19' })
  expect(seamOf('<!-- ckpt decision: ship · learning: T21 ✅ -->')).toEqual({ level: 'strong', task: 'T21' })
  expect(seamOf('<!-- ckpt learning: closes T4 -->')).toEqual({ level: 'strong', task: 'T4' })
  expect(seamOf('<!-- ckpt learning: T7 CLOSED -->')).toEqual({ level: 'strong', task: 'T7' })
  expect(seamOf('<!-- ckpt pivot: new direction · reasoning: x -->')).toEqual({ level: 'strong' })
  // the id nearest to the done word
  expect(seamOf('<!-- ckpt learning: T5 blocked, T4 done -->')).toEqual({ level: 'strong', task: 'T4' })
})

test('seam: a decision alone is simple; a task id without done, or done without an id, is not strong', () => {
  expect(seamOf(SEAM)).toEqual({ level: 'simple' })
  expect(seamOf('<!-- ckpt learning: T19 is next -->')).toEqual({ level: 'none' })
  expect(seamOf('<!-- ckpt learning: the migration is done -->')).toEqual({ level: 'none' })
  expect(seamOf('<!-- ckpt learning: T19 undone -->')).toEqual({ level: 'none' })
  expect(seamOf('T19 done, pivot: no trailer here')).toEqual({ level: 'none' })
  expect(seamOf('no trailer')).toEqual({ level: 'none' })
})

test('zones: strong seam at 40% -> advice line + one toast, same wording', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await complete($, TASK)
  await measure($, at(0.4))
  expect(advised(w)).toEqual([STRONG_MSG(40)])
  expect(lastStatus(w)).toBe(STRONG_MSG(40))
  expect(w.forkPrompts).toHaveLength(0)
})

test('zones: strong seam by a pivot -> the direction wording', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await complete($, PIVOT)
  await measure($, at(0.41))
  expect(advised(w)).toEqual([PIVOT_MSG(41)])
  expect(lastStatus(w)).toBe(PIVOT_MSG(41))
})

test('zones: strong seam below STRONG -> nothing', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await complete($, TASK)
  await measure($, at(0.29))
  expect(w.toasts).toHaveLength(0)
  expect(lastStatus(w)).toBeUndefined()
})

test('zones: simple seam at 40% -> nothing', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await complete($, SEAM)
  await measure($, at(0.4))
  expect(w.toasts).toHaveLength(0)
  expect(lines(w)).toHaveLength(0)
  expect(w.forkPrompts).toHaveLength(0)
})

test('zones: simple seam at 63% -> advice line + one toast', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await complete($, SEAM)
  await measure($, at(0.63))
  expect(advised(w)).toEqual([SIMPLE_MSG(63)])
  expect(lastStatus(w)).toBe(SIMPLE_MSG(63))
})

test('zones: no seam -> nothing at any fill below hard', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await complete($, 'Done.\n\n<!-- ckpt learning: a -->')
  await measure($, at(0.65))
  expect(w.toasts).toHaveLength(0)
  expect(lines(w)).toHaveLength(0)
  expect(w.forkPrompts).toHaveLength(0)
})

test('zones: toast once per cycle, the line follows the fill', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await complete($, TASK)
  await measure($, at(0.4))
  await complete($, 'No seam this time.')
  await measure($, at(0.45))
  await complete($, TASK)
  await measure($, at(0.5))
  expect(advised(w)).toHaveLength(1)
  // a later turn without a seam does not drop the advice
  expect(lastStatus(w)).toBe(STRONG_MSG(50))
  expect(w.forkPrompts).toHaveLength(0)
})

test('zones: strong seam after a simple advice upgrades the line, no second toast', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await complete($, SEAM)
  await measure($, at(0.65))
  expect(lastStatus(w)).toBe(SIMPLE_MSG(65))
  await complete($, TASK)
  expect(lastStatus(w)).toBe(STRONG_MSG(65))
  expect(advised(w)).toHaveLength(1)
  // a simple seam later does not downgrade it
  await complete($, SEAM)
  expect(lastStatus(w)).toBe(STRONG_MSG(65))
})

test('zones: strong seam, measure BEFORE turn.complete -> still one toast and the line', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await measure($, at(0.4))
  expect(advised(w)).toHaveLength(0)
  expect(lastStatus(w)).toBeUndefined()
  await complete($, TASK)
  expect(advised(w)).toEqual([STRONG_MSG(40)])
  expect(lastStatus(w)).toBe(STRONG_MSG(40))
  await measure($, at(0.41))
  expect(advised(w)).toHaveLength(1)
})

test('zones: subagent and aborted turns do not set the seam', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await measure($, at(0.65))
  await complete($, SEAM, { agentId: 'sub-1' })
  await complete($, TASK, { agentId: 'sub-1' })
  await complete($, SEAM, { isAborted: true, reason: 'aborted' })
  expect(advised(w)).toHaveLength(0)
  expect(lastStatus(w)).toBeUndefined()
})

test('zones: usage is only asked from 35% of the window; a strong seam at 30% needs no call', async ($, on) => {
  const w = world(on, OK())
  const calls = usage(on)
  await fresh($)
  await complete($, TASK)
  await measure($, 40_000)
  expect(calls.n).toBe(0)
  await measure($, at(0.3))
  expect(calls.n).toBe(0)
  expect(advised(w)).toEqual([STRONG_MSG(30)])
  await measure($, at(0.34))
  expect(calls.n).toBe(0)
  await measure($, at(0.35))
  expect(calls.n).toBe(1)
  expect(calls.args[0]).toEqual({ breakdown: 'summary' })
})

test('zones: a log line for every measure, silent ones included, debug sink only', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  // far below, no seam, no usage call
  await measure($, 40_000, ['context'], 20)
  // usage asked, no seam; the status-line percent is the one shown
  await measure($, at(0.45), ['context'], 40)
  // simple seam below its floor
  await complete($, SEAM)
  await measure($, at(0.45))
  // strong seam acting
  await complete($, TASK)
  await measure($, at(0.5))
  const lines = ctxLines(w)
  expect(lines).toHaveLength(5)
  expect(lines[0]).toBe(`pack: ctx pct=20% tokens=40000 window=${WINDOW} wall=none hard=140000 seam=none action=no-seam src=measure`)
  expect(lines[1]).toBe(`pack: ctx pct=40% tokens=${at(0.45)} window=${WINDOW} wall=${WALL} hard=140000 seam=none action=no-seam src=measure`)
  expect(lines[2]).toContain('seam=simple action=below-floor')
  expect(lines[3]).toContain('seam=strong:T19 action=advice src=turn')
  expect(lines[4]).toContain('pct=50% tokens=100000')
  expect(lines[4]).toContain('seam=strong:T19 action=advice-keep')
  expect(w.logs.every((l, i) => (l.startsWith('pack: ctx fill=') ? w.logSinks[i] === 'debug' : true))).toBe(true)
  expect(w.toasts).toHaveLength(1)
})

// ---- status precedence: an active flow wins, the advice comes back ----

test('status: a pack flow wins over the advice, and the advice is back when the pack is blocked', async ($, on) => {
  const w = world(on, null)
  usage(on)
  await fresh($)
  await complete($, TASK)
  await measure($, at(0.4))
  expect(lastStatus(w)).toBe(STRONG_MSG(40))
  let release = () => {}
  w.gate = new Promise<void>(r => (release = r))
  const run = packProj($)
  await settle(() => w.forkPrompts.length === 1)
  expect(lastStatus(w)).toBe('Saving stream "proj" before the fresh start...')
  release()
  const out = await run
  expect(out.text).toContain('pack: could not save stream "proj"')
  // the failure stays on the status line, over the advice
  expect(lastStatus(w)).toBe('\u26A0 Could not save stream "proj": fork failed (nothing-to-fork) (see pack-proj-status-llm.md)')
  expect(advised(w)).toHaveLength(1)
})

test('status: review pane wins over the advice, cancel brings the advice back, no second toast', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await complete($, TASK)
  await measure($, at(0.4))
  await packProj($)
  expect(lastStatus(w)).toBe('Saved. Check the pack, then clear & continue [c] or keep working [x]')
  const ui = await mountPane($)
  await ui.press({ key: 'cancel' })
  await ui.unmount()
  expect(lastStatus(w)).toBe(STRONG_MSG(40))
  expect(advised(w)).toHaveLength(1)
})

test('status: a flow never erases the advice for good: a manual save shows its line, then the zones re-arm', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await complete($, TASK)
  await measure($, at(0.4))
  await runPack($, 'save proj')
  expect(w.statuses).toContain('Saving stream "proj"...')
  await settle(() => w.toasts.some(t => t.includes('saved (')))
  // save done = re-arm: the outcome line replaces the advice, the toast may fire again at the next measure
  expect(lastStatus(w)).toMatch(/^\u2713 Stream "proj" saved at \d\d:\d\d \(\d+ chars\)$/)
  await measure($, at(0.41))
  expect(advised(w)).toHaveLength(2)
  expect(lastStatus(w)).toBe(STRONG_MSG(41))
})

// ---- the advice line goes when ----

test('advice clears: on pack --yes (armed)', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await complete($, TASK)
  await measure($, at(0.4))
  await packProj($, '--yes')
  expect(lastStatus(w)).toBe('Starting a fresh session...')
  await clear($)
  expect(lastStatus(w)).toBeUndefined()
})

test('advice clears: on clear & continue (armed), not at review', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await complete($, TASK)
  await measure($, at(0.4))
  await packProj($)
  const ui = await mountPane($)
  await ui.press({ key: 'continue' })
  await ui.unmount()
  expect(lastStatus(w)).toBe('Starting a fresh session...')
  await clear($)
  expect(lastStatus(w)).toBeUndefined()
  // seam was reset by the clear: nothing comes back at the same fill
  await measure($, at(0.4))
  expect(lastStatus(w)).toBeUndefined()
})

test('advice clears: on /clear, and the seam is gone with it', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await complete($, TASK)
  await measure($, at(0.4))
  expect(lastStatus(w)).toBe(STRONG_MSG(40))
  await clear($)
  expect(lastStatus(w)).toBeUndefined()
  await measure($, at(0.4))
  expect(advised(w)).toHaveLength(1)
  await complete($, TASK)
  expect(advised(w)).toHaveLength(2)
  expect(lastStatus(w)).toBe(STRONG_MSG(40))
})

test('advice clears: when the fill drops below the floor (strong: STRONG; simple: SOFT)', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await complete($, TASK)
  await measure($, at(0.4))
  await measure($, at(0.36))
  expect(lastStatus(w)).toBe(STRONG_MSG(36))
  await measure($, at(0.25))
  expect(lastStatus(w)).toBeUndefined()
  expect(w.logs.some(l => l.includes('action=rearm'))).toBe(true)
  // re-armed: a new seam at the same fill advises again
  await complete($, TASK)
  await measure($, at(0.4))
  expect(advised(w)).toHaveLength(2)
  // simple seam: floor SOFT
  await clear($)
  await complete($, SEAM)
  await measure($, at(0.65))
  expect(lastStatus(w)).toBe(SIMPLE_MSG(65))
  await measure($, at(0.45))
  expect(lastStatus(w)).toBeUndefined()
})

test('advice clears: far below the floors (after a compaction) too', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await complete($, TASK)
  await measure($, at(0.4))
  await measure($, 20_000)
  expect(lastStatus(w)).toBeUndefined()
  expect(w.logs.some(l => l.includes('action=rearm'))).toBe(true)
})

// ---- hard zone ----

test('zones: hard with a stream -> saving line, then saved line + toast; not two saves', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await runPack($, 'save proj')
  await settle(() => w.toasts.some(t => t.includes('saved (')))
  w.toasts.length = 0
  w.statuses.length = 0
  w.forkPrompts.length = 0
  await measure($, at(0.9))
  await settle(() => w.toasts.some(t => t.includes('Progress saved')))
  expect(w.forkPrompts).toHaveLength(1)
  expect(w.files.has(STATE)).toBe(true)
  expect(w.statuses).toEqual([SAVING_MSG(90), SAVED_MSG(90)])
  expect(w.toasts).toEqual([SAVED_MSG(90)])
  expect(lastStatus(w)).toBe(SAVED_MSG(90))
  await measure($, at(0.92))
  await complete($, SEAM)
  await new Promise(r => setTimeout(r, 20))
  expect(w.forkPrompts).toHaveLength(1)
  expect(w.toasts).toHaveLength(1)
  expect(lastStatus(w)).toBe(SAVED_MSG(92))
  expect(w.clears).toBe(0)
  expect(w.store.get('pack:pending')).toBeUndefined()
  expect(w.logs.some(l => l.includes('action=hard-save'))).toBe(true)
})

test('zones: hard save blocked -> failed line with a short reason', async ($, on) => {
  const w = world(on, 'GATE: blocked - cross-item step')
  usage(on)
  await fresh($)
  await title($, 'proj')
  await measure($, at(0.9))
  await settle(() => w.toasts.length > 0)
  const msg = 'Context almost full (90%) and the automatic save failed (cross-item step). Type /pack --yes to continue in a fresh session'
  expect(w.toasts).toEqual([msg])
  expect(lastStatus(w)).toBe(msg)
})

test('zones: hard over a strong advice -> the saving line wins, then the hard outcome replaces the advice', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await title($, 'proj')
  await complete($, TASK)
  await measure($, at(0.4))
  expect(lastStatus(w)).toBe(STRONG_MSG(40))
  let release = () => {}
  w.gate = new Promise<void>(r => (release = r))
  await measure($, at(0.9))
  expect(lastStatus(w)).toBe(SAVING_MSG(90))
  release()
  await settle(() => w.toasts.some(t => t.includes('Progress saved')))
  expect(lastStatus(w)).toBe(SAVED_MSG(90))
})

test('zones: hard save finishing after a /clear leaves no stale advice', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await title($, 'proj')
  let release = () => {}
  w.gate = new Promise<void>(r => (release = r))
  await measure($, at(0.9))
  await settle(() => w.forkPrompts.length === 1)
  await clear($)
  release()
  await new Promise(r => setTimeout(r, 40))
  expect(lastStatus(w)).toBeUndefined()
  expect(w.toasts).toHaveLength(0)
})

test('zones: hard while saving -> no second fork', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  let release = () => {}
  w.gate = new Promise<void>(r => (release = r))
  await runPack($, 'save proj')
  await settle(() => w.forkPrompts.length === 1)
  expect(w.forkPrompts).toHaveLength(1)
  await measure($, at(0.9))
  expect(w.forkPrompts).toHaveLength(1)
  expect(w.logs.some(l => l.includes('action=hard-skip-saving'))).toBe(true)
  release()
  await settle(() => w.toasts.some(t => t.includes('saved (')))
  await new Promise(r => setTimeout(r, 20))
  expect(w.forkPrompts).toHaveLength(1)
  expect(w.toasts.filter(t => t.includes('Progress saved'))).toHaveLength(0)
})

test('zones: hard with no stream bound -> message with the save command, no save', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await measure($, at(0.9))
  const msg = 'Context almost full (90%) but no stream is set, so nothing was saved. Type /pack save <name>'
  expect(w.toasts).toEqual([msg])
  expect(lastStatus(w)).toBe(msg)
  expect(w.forkPrompts).toHaveLength(0)
  expect(w.files.size).toBe(0)
})

test('zones: hard jumping over every floor in one measure -> hard action only', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await title($, 'proj')
  await complete($, SEAM)
  await measure($, at(0.9))
  await settle(() => w.toasts.some(t => t.includes('Progress saved')))
  expect(advised(w)).toHaveLength(0)
  expect(w.toasts).toHaveLength(1)
})

test('zones: re-arm after a hard save when the fill drops below SOFT', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await title($, 'proj')
  await measure($, at(0.9))
  await settle(() => w.toasts.some(t => t.includes('Progress saved')))
  await measure($, at(0.45))
  expect(lastStatus(w)).toBeUndefined()
  await complete($, TASK)
  await measure($, at(0.5))
  expect(advised(w)).toHaveLength(1)
})

test('zones: re-arm after a manual save', async ($, on) => {
  const w = world(on, OK())
  usage(on)
  await fresh($)
  await complete($, SEAM)
  await measure($, at(0.65))
  expect(advised(w)).toHaveLength(1)
  await runPack($, 'save proj')
  await settle(() => w.toasts.some(t => t.includes('saved (')))
  await measure($, at(0.66))
  expect(advised(w)).toHaveLength(2)
})

test('zones: tokens absent or context unchanged -> nothing', async ($, on) => {
  const w = world(on, OK())
  const calls = usage(on)
  await fresh($)
  await complete($, SEAM)
  await measure($, undefined)
  await measure($, at(0.9), ['cost'])
  expect(w.toasts).toHaveLength(0)
  expect(calls.n).toBe(0)
  expect(w.forkPrompts).toHaveLength(0)
  expect(ctxLines(w)).toHaveLength(0)
})

test('zones: wall falls back to rawMaxTokens', async ($, on) => {
  const w = world(on, OK())
  usage(on, null, 150_000)
  await fresh($)
  await complete($, SEAM)
  await measure($, 100_000)
  expect(w.logs.some(l => l.includes('pct=50%') && l.includes('wall=150000') && l.includes('hard=140000'))).toBe(true)
  expect(advised(w)).toEqual([SIMPLE_MSG(50)])
})

test('zones: usage unavailable (no wall in the breakdown) -> hard = HARD * window alone', async ($, on) => {
  const w = world(on, OK())
  usage(on, null, null)
  await fresh($)
  await title($, 'proj')
  await measure($, 139_999)
  expect(w.forkPrompts).toHaveLength(0)
  await measure($, 140_000)
  await settle(() => w.toasts.some(t => t.includes('Progress saved')))
  expect(w.forkPrompts).toHaveLength(1)
  expect(w.logs.some(l => l.includes('wall=none hard=140000') && l.includes('action=hard-save'))).toBe(true)
})

test('zones: usage call failing -> hard = HARD * window alone, logged, nothing thrown', async ($, on) => {
  const w = world(on, OK())
  on('session.usage', () => {
    throw new Error('no usage')
  })
  await fresh($)
  await title($, 'proj')
  await measure($, 140_000)
  await settle(() => w.toasts.some(t => t.includes('Progress saved')))
  expect(w.logs.some(l => l.includes('usage unavailable'))).toBe(true)
  expect(w.logs.some(l => l.includes('wall=none hard=140000'))).toBe(true)
})

test('zones: hard cap = 95% of a low wall (window 1M, wall 400k, HARD * window 700k) -> fires at 380k', async ($, on) => {
  const w = world(on, OK())
  const calls = usage(on, 400_000, null, 1_000_000)
  await fresh($)
  await title($, 'proj')
  await measure($, 379_999, ['context'], undefined, 1_000_000)
  expect(w.forkPrompts).toHaveLength(0)
  expect(calls.n).toBe(1)
  await measure($, 380_000, ['context'], undefined, 1_000_000)
  await settle(() => w.toasts.some(t => t.includes('Progress saved')))
  expect(w.forkPrompts).toHaveLength(1)
  expect(w.statuses).toContain(SAVING_MSG(38))
  expect(lastStatus(w)).toBe(SAVED_MSG(38))
  expect(w.logs.some(l => l.includes('window=1000000 wall=400000 hard=380000') && l.includes('action=hard-save'))).toBe(true)
})

test('zones: hard cap, a low wall does not re-arm at once (no second save at 37%), only well below it', async ($, on) => {
  const w = world(on, OK())
  usage(on, 400_000, null, 1_000_000)
  await fresh($)
  await title($, 'proj')
  await measure($, 380_000, ['context'], undefined, 1_000_000)
  await settle(() => w.toasts.some(t => t.includes('Progress saved')))
  await measure($, 370_000, ['context'], undefined, 1_000_000)
  await measure($, 380_000, ['context'], undefined, 1_000_000)
  expect(w.forkPrompts).toHaveLength(1)
  // under 90% of the hard start (342k): re-armed
  await measure($, 300_000, ['context'], undefined, 1_000_000)
  expect(lastStatus(w)).toBeUndefined()
  await measure($, 380_000, ['context'], undefined, 1_000_000)
  await settle(() => w.forkPrompts.length === 2)
  expect(w.forkPrompts).toHaveLength(2)
})

test('zones: on a 1M window the floors follow the window (strong 30% = 300k, no usage call)', async ($, on) => {
  const w = world(on, OK())
  const calls = usage(on, 400_000, null, 1_000_000)
  await fresh($)
  await complete($, TASK)
  await measure($, 299_999, ['context'], undefined, 1_000_000)
  expect(advised(w)).toHaveLength(0)
  await measure($, 300_000, ['context'], undefined, 1_000_000)
  expect(advised(w)).toEqual([STRONG_MSG(30)])
  expect(calls.n).toBe(0)
})

test('zones: wall cached after the first usage call, dropped by a /clear', async ($, on) => {
  world(on, OK())
  const calls = usage(on)
  await fresh($)
  await measure($, at(0.6))
  await measure($, at(0.62))
  await measure($, at(0.3))
  expect(calls.n).toBe(1)
  await clear($)
  await measure($, at(0.6))
  expect(calls.n).toBe(2)
})

// ---------- gating hooks: a failing hook is silently absent unless it has a .catch; here the catch handler runs and logs, then passes the event on ----------
// Limits of the test engine: a `$` call of the plugin that fails is dropped, never thrown, so the hook itself cannot be made to throw before its next(e);
// the failure comes from the chain beneath (next(e) rejects). The handler's replayed next(e) then rejects the same way: what is asserted is that the handler ran.
// ui.close with a person origin cannot be raised from the test engine (no $.ui.close): that hook's .catch is not covered here.

test('catch: UserPromptSubmit failing -> the catch handler runs and logs the failure', async ($, on) => {
  const w = world(on, OK())
  w.failOps.add('classic.UserPromptSubmit')
  await title($, 'proj').catch(() => undefined)
  expect(w.logs.some(l => l.includes('pack: classic.UserPromptSubmit hook throw: '))).toBe(true)
  expect(w.logSinks).toContain('debug')
})

test('catch: SessionStart failing -> the catch handler runs and logs the failure', async ($, on) => {
  const w = world(on, OK())
  w.failOps.add('classic.SessionStart')
  await fresh($).catch(() => undefined)
  expect(w.logs.some(l => l.includes('pack: classic.SessionStart hook throw: '))).toBe(true)
  expect(w.logSinks).toContain('debug')
})

// ---------- feedback: progress, outcome line, /pack cancel, waiting checkpoints ----------

test('feedback: elapsed and progress wording, slow past SLOW_MS', () => {
  expect(elapsed(0)).toBe('0s')
  expect(elapsed(59_999)).toBe('59s')
  expect(elapsed(185_000)).toBe('3m 05s')
  expect(progressText('Saving stream "p"', 0)).toBe('Saving stream "p"...')
  expect(progressText('Saving stream "p"', 12_000)).toBe('Saving stream "p"... 12s')
  expect(progressText('Saving stream "p"', SLOW_MS)).toBe('Saving stream "p": still running after 3m 00s, slow or stuck; the outcome will show here')
  expect(waitingText({ count: 1, stream: null })).toBe('1 checkpoint waiting for a stream: /rename the session or type /pack save <name>')
  expect(waitingText({ count: 2, stream: 'p' })).toBe('\u26A0 Journal of stream "p" not written: 2 checkpoints kept, retried at the next checkpoint')
})

test('feedback: the saving line ticks, says slow past SLOW_MS, and stops at the outcome', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  let release: () => void = () => undefined
  w.gate = new Promise<void>(r => (release = r))
  await runPack($, 'save proj')
  expect(w.statuses.at(-1)).toBe('Saving stream "proj"...')
  await w.clock.advance(2_000)
  expect(w.statuses.at(-1)).toBe('Saving stream "proj"... 2s')
  await w.clock.advance(SLOW_MS)
  expect(w.statuses.at(-1)).toContain('still running after 3m 02s, slow or stuck')
  release()
  await settle(() => w.toasts.some(t => t.includes('saved (')))
  const done = w.statuses.at(-1)
  expect(done).toMatch(/^\u2713 Stream "proj" saved at \d\d:\d\d \(\d+ chars\)$/)
  await w.clock.advance(5_000)
  expect(w.statuses.at(-1)).toBe(done)
})

test('feedback: the ok outcome stays through a turn not prompted, goes at the end of the next prompted turn', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await runPack($, 'save proj')
  await settle(() => w.toasts.some(t => t.includes('saved (')))
  const done = w.statuses.at(-1)
  expect(done).toContain('\u2713 Stream "proj" saved at')
  await complete($, 'still running from before')
  expect(w.statuses.at(-1)).toBe(done)
  await title($, 'proj')
  await complete($, 'next answer')
  expect(w.statuses.at(-1)).toBeUndefined()
})

test('feedback: a failed save stays on the status line through turns, until the next command', async ($, on) => {
  const w = world(on, 'GATE: blocked - mid synthesis')
  await fresh($)
  await runPack($, 'save proj')
  await settle(() => w.toasts.length > 0)
  const failed = '\u26A0 Could not save stream "proj": mid synthesis (see pack-proj-status-llm.md)'
  expect(w.statuses.at(-1)).toBe(failed)
  await title($, 'proj')
  await complete($, 'answer')
  expect(w.statuses.at(-1)).toBe(failed)
  w.forkText = OK()
  await runPack($, 'save')
  expect(w.statuses).toContain('Saving stream "proj"...')
  await settle(() => w.toasts.some(t => t.includes('saved (')))
  expect(w.statuses.at(-1)).toContain('\u2713 Stream "proj" saved at')
})

test('feedback: /pack cancel leaves the armed state, the state file stays, /clear injects nothing', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  expect((await runPack($, 'cancel')).text).toBe('pack: nothing to cancel')
  await packProj($, '--yes')
  expect((await runPack($, 'save')).text).toBe('pack: ready for a fresh start: type /clear, or /pack cancel to stay')
  const out = await runPack($, 'cancel')
  expect(out.text).toBe('pack: staying in this session; stream "proj" stays saved in pack-proj-llm.md')
  expect(w.statuses.at(-1)).toBeUndefined()
  expect(w.store.get('pack:pending')).toBeUndefined()
  expect(w.files.has(STATE)).toBe(true)
  await clear($)
  expect(w.submits).toHaveLength(0)
})

test('feedback: /pack cancel during the review closes the pane; cancel takes no argument and is not a stream name', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  expect((await runPack($, 'cancel proj')).text).toBe('pack: cancel takes nothing else. Usage: /pack cancel')
  expect((await runPack($, 'cancel -y')).text).toBe('pack: cancel takes nothing else. Usage: /pack cancel')
  expect((await runUnpack($, 'cancel')).text).toContain('reserved word')
  await packProj($)
  expect(w.opens).toEqual(['pack'])
  const out = await runPack($, 'cancel')
  expect(out.text).toBe('pack: staying in this session; stream "proj" stays saved in pack-proj-llm.md')
  expect(w.store.get('pack:pending')).toBeUndefined()
  expect(w.toasts.at(-1)).toBe('Staying in this session; stream "proj" stays saved in pack-proj-llm.md')
})

test('feedback: the pane says where the pack was saved and offers keep working', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await packProj($)
  const ui = await mountPane($)
  expect(await ui.find({ type: 'Text', text: /^Saved to pack-proj-llm\.md, \d+ chars\. Clear now/ })).toBeDefined()
  expect(await ui.find({ type: 'Button', text: 'keep working' })).toBeDefined()
  await ui.press({ key: 'cancel' })
  await ui.unmount()
  expect(w.toasts.at(-1)).toBe('Staying in this session; stream "proj" stays saved in pack-proj-llm.md')
})

test('feedback: checkpoints with no stream show a hint, gone once a stream takes them', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await complete($, `a\n\n${TRAILER}`)
  expect(w.statuses.at(-1)).toBe('1 checkpoint waiting for a stream: /rename the session or type /pack save <name>')
  await complete($, `b\n\n${TRAILER}`)
  expect(w.statuses.at(-1)).toBe('2 checkpoints waiting for a stream: /rename the session or type /pack save <name>')
  await title($, 'proj')
  expect(w.statuses.at(-1)).toBeUndefined()
  expect(w.files.get(JOURNAL)).toContain('### c02 ')
})

// ---------- agents in flight (listed by code in in_progress) ----------

const agent = (id: string, status: AgentInfo['status'], extra: Partial<AgentInfo> = {}): AgentInfo => ({ id, status, description: `task of ${id}`, type: 'general-purpose', ...extra })
const flying = (state: string) => section(state, 'in_progress').filter(l => l.startsWith('agent in flight:'))

test('agents: a running agent is listed by code, a completed one is not', async ($, on) => {
  const w = world(on, OK(['in_progress:', '- fork own line']))
  w.agents = [agent('a1', 'running', { name: 'scout' }), agent('a2', 'completed'), agent('a3', 'idle'), agent('a4', 'failed')]
  await fresh($)
  await packProj($, '--yes')
  const state = w.files.get(STATE) ?? ''
  expect(flying(state)).toEqual(['agent in flight: scout [a1] running — task of a1', 'agent in flight: general-purpose [a3] idle — task of a3'])
  expect(section(state, 'in_progress').at(-1)).toBe('fork own line')
})

test('agents: no live agent, no line', async ($, on) => {
  const w = world(on, OK())
  w.agents = [agent('a2', 'completed')]
  await fresh($)
  await packProj($, '--yes')
  expect(w.files.get(STATE)).not.toContain('agent in flight')
})

test('agents: the save fork itself (in the list while it runs) is excluded, on /pack save too', async ($, on) => {
  const w = world(on, OK())
  w.agents = [agent('a1', 'running')]
  w.forkAgent = agent('fork-1', 'running', { type: 'fork' })
  await fresh($)
  await runPack($, 'save proj')
  await settle(() => w.toasts.length > 0)
  const state = w.files.get(STATE) ?? ''
  expect(flying(state)).toHaveLength(1)
  expect(state).toContain('[a1]')
  expect(state).not.toContain('fork-1')
})

test('agents: a fork that copies the agent lines does not duplicate them', async ($, on) => {
  const w = world(on, OK(['in_progress:', '- agent in flight: ghost [g1] running — stale copy']))
  w.agents = [agent('a1', 'running')]
  await fresh($)
  await packProj($, '--yes')
  expect(flying(w.files.get(STATE) ?? '')).toEqual(['agent in flight: general-purpose [a1] running — task of a1'])
})

test('agents: agent.list throwing -> the save still succeeds, no line', async ($, on) => {
  const w = world(on, OK())
  w.agentsThrow = true
  await fresh($)
  const out = await packProj($, '--yes')
  expect(out.text).toContain('Starting a fresh session')
  expect(w.files.get(STATE)).toBeDefined()
  expect(w.files.get(STATE)).not.toContain('agent in flight')
  expect(w.files.get(STATUS)).toContain('outcome: ok')
})

test('agents: the lines survive an over-cap cut that empties in_progress', async ($, on) => {
  const lines = (key: string, n: number) => [`${key}:`, ...Array.from({ length: n }, (_, i) => `- /${key}/${pad2(i)} — ${'x'.repeat(90)}`)]
  const w = world(on, OK([...lines('read_if_needed', 5), ...lines('stale', 40), ...lines('in_progress', 60), ...lines('discarded', 20), ...lines('learnings', 120)]))
  w.agents = [agent('a1', 'running'), agent('a2', 'waiting')]
  await fresh($)
  await packProj($, '--yes')
  const state = w.files.get(STATE) ?? ''
  expect(state.length).toBeLessThanOrEqual(8_000)
  expect(section(state, 'in_progress').filter(l => l.startsWith('/in_progress/'))).toHaveLength(0)
  expect(flying(state)).toHaveLength(2)
  expect(section(state, 'in_progress').slice(0, 2)).toEqual(flying(state))
})

test('agents: more than 10 live -> 10 lines and a count line', async ($, on) => {
  const w = world(on, OK())
  w.agents = Array.from({ length: 13 }, (_, i) => agent(`a${i}`, 'running'))
  await fresh($)
  await packProj($, '--yes')
  const f = flying(w.files.get(STATE) ?? '')
  expect(f).toHaveLength(11)
  expect(f.at(-1)).toBe('agent in flight: +3 more, not listed')
})
