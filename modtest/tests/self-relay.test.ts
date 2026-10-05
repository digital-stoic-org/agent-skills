import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'
import { hideTrailer } from '../hooks/self-relay.tsx'

const PANE_PROPS = {
  title: 'self-relay',
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
const STATE = 'relay-proj-llm.md'
const JOURNAL = 'journal/proj.md'
const RULE = "Journal journal/proj.md: never read it whole; to see an entry, grep by id: grep -A8 '^### cNN' journal/proj.md"
const ISO = new Date(1_000_000).toISOString()
const TRAILER = '<!-- ckpt decision: use code · reasoning: because -->'

type World = {
  submits: string[]
  opens: string[]
  clears: number
  toasts: string[]
  forkPrompts: string[]
  store: Map<string, unknown>
  files: Map<string, string>
  sid: string
  gate: Promise<void> | null
  // runs right after each fs.read answered: simulates another session writing between read and the size check
  afterRead: ((path: string) => void) | null
  failWrites: boolean
  forkText: string | null
  clock: { advance: (ms: number) => Promise<void> }
}

// The engine resolves a relative path against the session cwd before the fs.* ops are answered: key files by their relative tail.
const rel = (path: string) => path.replace(/^.*?((?:relay-[^/]+-llm\.md)|(?:journal\/[^/]+\.md))$/, '$1')

const bytes = (s: string) => new TextEncoder().encode(s).length

// Stubs the engine beneath the plugin: fork answers `w.forkText`, files live in `w.files`, everything else is recorded.
function world(on: On, forkText: string | null, store?: Record<string, unknown>, now = 1_000_000): World {
  // Own in-memory store (not mock.store) so the test can read what the plugin kept.
  const w: World = {
    submits: [],
    opens: [],
    clears: 0,
    toasts: [],
    forkPrompts: [],
    store: new Map(Object.entries(store ?? {})),
    files: new Map(),
    sid: 'sess-1',
    gate: null,
    afterRead: null,
    failWrites: false,
    forkText,
    clock: { advance: async () => undefined },
  }
  on('store.get', (_$, e) => ({ value: w.store.get(e.key) }))
  on('store.set', (_$, e) => (w.store.set(e.key, e.value), { value: undefined }))
  on('store.delete', (_$, e) => (w.store.delete(e.key), { value: undefined }))
  w.clock = mock.clock(on, { now })
  // Calls on `$` (ops) answer `{ value }` or `{ deny }`; engine events answer their own result.
  on('model.fork', async (_$, e) => {
    w.forkPrompts.push(e.prompt)
    if (w.gate) await w.gate
    return {
      value:
        w.forkText === null
          ? { isAnswered: false, reason: 'nothing-to-fork' }
          : { isAnswered: true, text: w.forkText, usage: { input_tokens: 1, output_tokens: 1 } },
    }
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
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', (_$, e) => (w.toasts.push(e.text), { value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  on('classic.SessionStart', () => ({}))
  on('classic.UserPromptSubmit', () => ({}))
  on('turn.complete', (_$, e) => ({ text: e.answer }))
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

const runSelfRelay = ($: Engine, args = '') =>
  $.command.run({
    command: 'self-relay',
    args,
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 120 },
  })

// Relay on stream `proj` (explicit arg binds it).
const relayProj = ($: Engine, flags = '') => runSelfRelay($, `proj ${flags}`.trim())

const mountPane = ($: Engine) =>
  $.ui.mount({ plugin: 'modtest', surface: 'terminal', component: 'Pane', requestId: 'self-relay', props: PANE_PROPS })

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
  const out = await relayProj($)
  expect(out.text).toBe('self-relay blocked: mid synthesis')
  expect(w.opens).toHaveLength(0)
  expect(w.store.get('self-relay:pending')).toBeUndefined()
  expect(w.files.has(STATE)).toBe(false)
})

test('fork without answer: blocked with the reason', async ($, on) => {
  const w = world(on, null)
  await fresh($)
  const out = await relayProj($)
  expect(out.text).toBe('self-relay blocked: fork failed (nothing-to-fork)')
  expect(w.opens).toHaveLength(0)
})

test('ok gate: state written, pane opens with state + journal rule and two buttons', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await relayProj($)
  expect(w.opens).toEqual(['self-relay'])
  const state = w.files.get(STATE) ?? ''
  expect(state).toContain('stream: proj')
  expect(state).toContain('goal: ship v2')
  const stored = w.store.get('self-relay:pending') as { packet: string; phase: string; cwd: string }
  expect(stored).toMatchObject({ phase: 'review', cwd: CWD })
  expect(stored.packet).toBe(`${state.trimEnd()}\n\n${RULE}`)
  const ui = await mountPane($)
  expect(await ui.findAll({ type: 'Button' })).toHaveLength(2)
  await ui.press({ key: 'cancel' })
  await ui.unmount()
})

test('cancel: store emptied, back to idle', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await relayProj($)
  const ui = await mountPane($)
  await ui.press({ key: 'cancel' })
  await ui.unmount()
  expect(w.store.get('self-relay:pending')).toBeUndefined()
  const again = await relayProj($)
  expect(again.text).toBeUndefined()
})

test('clear & relay: armed, /clear run, packet + regime submitted once after clear', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await relayProj($)
  const ui = await mountPane($)
  await ui.press({ key: 'relay' })
  await ui.unmount()
  expect(w.clears).toBe(1)
  expect(w.store.get('self-relay:pending')).toMatchObject({ phase: 'armed' })
  await clear($)
  expect(w.submits).toHaveLength(1)
  expect(w.submits[0]).toContain('goal: ship v2')
  expect(w.submits[0]).toContain(RULE)
  expect(w.submits[0]).toContain('Announce [READY] on a single line and stop there.')
  expect(w.store.get('self-relay:pending')).toBeUndefined()
})

test('/clear during review: no injection, pending dropped', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await relayProj($)
  await clear($)
  expect(w.submits).toHaveLength(0)
  expect(w.store.get('self-relay:pending')).toBeUndefined()
})

test('stale store entry (> 10 min): no injection', async ($, on) => {
  const stale = { packet: 'p', phase: 'armed', cwd: CWD, createdAt: 0 }
  const w = world(on, null, { 'self-relay:pending': stale }, 11 * 60 * 1000)
  await fresh($)
  await clear($)
  expect(w.submits).toHaveLength(0)
  expect(w.store.get('self-relay:pending')).toBeUndefined()
})

test('fresh store entry from same cwd (mod reloaded): injected', async ($, on) => {
  const fresher = { packet: 'p', phase: 'armed', cwd: CWD, createdAt: 0 }
  const w = world(on, null, { 'self-relay:pending': fresher }, 60 * 1000)
  await clear($)
  expect(w.submits).toHaveLength(1)
})

test('--yes: no pane, armed, relay packet = state + journal rule, submitted after the human /clear', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  const out = await relayProj($, '--yes')
  expect(out.text).toContain('Type /clear')
  expect(w.opens).toHaveLength(0)
  expect(w.clears).toBe(0)
  expect(w.store.get('self-relay:pending')).toMatchObject({ phase: 'armed' })
  await clear($)
  expect(w.submits).toHaveLength(1)
  const state = w.files.get(STATE) ?? ''
  expect(w.submits[0].startsWith(`${state.trimEnd()}\n\n${RULE}\n\nYou are taking over this name.`)).toBe(true)
})

test('-y with a state over 8,000 chars after cuts: blocked, nothing written, nothing armed, no pane', async ($, on) => {
  const w = world(on, OK(['decisions:', `- ${'x'.repeat(9_000)} — why`]))
  await fresh($)
  const out = await relayProj($, '-y')
  expect(out.text).toContain('self-relay blocked: state')
  expect(out.text).toContain('> 8000')
  expect(w.opens).toHaveLength(0)
  expect(w.clears).toBe(0)
  expect(w.files.has(STATE)).toBe(false)
  expect(w.store.get('self-relay:pending')).toBeUndefined()
  await clear($)
  expect(w.submits).toHaveLength(0)
})

// ---------- T9 stream binding ----------

test('stream: explicit arg > session_title > refuse', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  const refused = await runSelfRelay($, '--yes')
  expect(refused.text).toContain('no stream')
  expect(w.forkPrompts).toHaveLength(0)

  await title($, 'my-title')
  expect((await runSelfRelay($, '--yes')).text).toContain('relay-my-title-llm.md')
  await clear($)

  await runSelfRelay($, 'explicit --yes')
  expect(w.files.has('relay-explicit-llm.md')).toBe(true)
  await clear($)

  // the explicit binding wins over a later title
  await title($, 'later-title')
  expect((await runSelfRelay($, '--yes')).text).toContain('relay-explicit-llm.md')
})

test('stream: a session_title that is not a stream name is slugified', async ($, on) => {
  world(on, OK())
  const streamOf = async (t: string) => {
    await fresh($)
    await title($, t)
    const out = await runSelfRelay($, '--yes')
    return out.text?.match(/relay-(.+)-llm\.md/)?.[1] ?? 'none'
  }
  expect(await streamOf('Keep_Case-1')).toBe('Keep_Case-1')
  expect(await streamOf('  Hello, World!! ')).toBe('hello-world')
  expect(await streamOf('a'.repeat(30) + ' ' + 'b'.repeat(30))).toBe('a'.repeat(30) + '-' + 'b'.repeat(19))
  expect(await streamOf('###')).toBe('none')
})

test('stream: binding survives /clear', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await relayProj($, '--yes')
  await clear($)
  await complete($, `done\n${TRAILER}`)
  expect(w.files.get(JOURNAL)).toContain(TRAILER)
})

test('stream: reserved words and invalid names are refused', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  expect((await runSelfRelay($, 'save save')).text).toContain('reserved word')
  expect((await runSelfRelay($, 'load load')).text).toContain('reserved word')
  expect((await runSelfRelay($, 'bad/name')).text).toContain('invalid stream')
  expect((await runSelfRelay($, 'a b')).text).toContain('too many arguments')
  expect((await runSelfRelay($, 'save --yes')).text).toContain('--yes only goes with the relay form')
  expect(w.forkPrompts).toHaveLength(0)
})

test('pre-binding buffer: kept in the store, flushed to the journal when a stream gets bound', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await complete($, `a\n${TRAILER}`)
  expect(w.files.has(JOURNAL)).toBe(false)
  expect(w.store.get('self-relay:buffer:sess-1')).toHaveLength(1)
  await title($, 'proj')
  expect(w.files.get(JOURNAL)).toBe(`### c01 ${ISO} sess-1\n${TRAILER}\n\n`)
  expect(w.store.get('self-relay:buffer:sess-1')).toBeUndefined()
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
  expect(w.store.get('self-relay:buffer:sess-1')).toBeUndefined()
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
  expect(w.store.get('self-relay:buffer:sess-1')).toBeUndefined()
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
  expect(w.store.get('self-relay:buffer:sess-1')).toHaveLength(1)
  expect(w.toasts.some(t => t.includes('journal write failed'))).toBe(true)
  // the next successful capture flushes the buffer first
  w.afterRead = null
  await complete($, '<!-- ckpt decision: later -->')
  const journal = w.files.get(JOURNAL) ?? ''
  expect(journal.indexOf(TRAILER)).toBeLessThan(journal.indexOf('decision: later'))
  expect(w.store.get('self-relay:buffer:sess-1')).toBeUndefined()
})

test('journal: a failing write never throws into the engine', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await title($, 'proj')
  w.failWrites = true
  const out = await complete($, TRAILER)
  expect(out.text).toContain('ckpt')
  expect(w.store.get('self-relay:buffer:sess-1')).toHaveLength(1)
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
  await relayProj($, '--yes')
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
  await relayProj($, '--yes')
  const keys = (w.files.get(STATE) ?? '').split('\n').flatMap(l => l.match(/^([a-z_]+):/)?.[1] ?? [])
  expect(keys).toEqual([
    'stream', 'saved', 'status', 'predecessor', 'goal', 'journal', 'journal_cursor',
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
  await relayProj($, '--yes')
  expect(section(w.files.get(STATE) ?? '', 'decisions')).toContain('use A (c01)')
  await clear($)

  w.files.set(JOURNAL, (w.files.get(JOURNAL) ?? '') + entry('c02', '<!-- ckpt decision: use B instead · learning: A is slow -->'))
  w.forkText = OK(['retire_reversed: c01', 'retire_answered: c01'])
  await relayProj($, '--yes')
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
  await relayProj($, '--yes')
  const decisions = section(w.files.get(STATE) ?? '', 'decisions')
  expect(decisions).toContain('no why here — why missing')
  expect(decisions.join('\n')).not.toContain('c42')
})

test('state: predecessor = previous writer when another session saves', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await relayProj($, '--yes')
  expect(w.files.get(STATE)).toContain('predecessor: none')
  await clear($)
  w.sid = 'sess-2'
  await relayProj($, '--yes')
  expect(w.files.get(STATE)).toContain('predecessor: sess-1')
  expect(w.files.get(STATE)).toContain(`saved: ${ISO} sess-2`)
})

test('state: over 8,000 chars cuts read_if_needed, then stale, then in_progress; never decisions/next/unknowns', async ($, on) => {
  const lines = (key: string, n: number) => [`${key}:`, ...Array.from({ length: n }, (_, i) => `- /${key}/${pad2(i)} — ${'x'.repeat(90)}`)]
  const big = OK([...lines('read_if_needed', 5), ...lines('stale', 40), ...lines('in_progress', 30), ...lines('next', 3)])
  const w = world(on, big)
  await fresh($)
  await relayProj($, '--yes')
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
  await relayProj($, '--yes')
  const lines = section(w.files.get(STATE) ?? '', 'read_if_needed')
  expect(lines.length).toBeGreaterThan(0)
  expect(lines.every(l => l.length <= 80)).toBe(true)
})

// ---------- T11 save: unawaited fork ----------

test('save: returns before the fork settles, writes the state after, toasts the outcome', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  let release: () => void = () => undefined
  w.gate = new Promise<void>(r => (release = r))
  const out = await runSelfRelay($, 'save proj')
  expect(out.text).toBe('self-relay: saving proj...')
  expect(w.files.has(STATE)).toBe(false)
  expect((await runSelfRelay($, 'save proj')).text).toBe('self-relay: already saving')
  release()
  await settle(() => w.files.has(STATE))
  expect(w.files.get(STATE)).toContain('goal: ship v2')
  await settle(() => w.toasts.some(t => t.includes('saved')))
  expect(w.toasts.some(t => t.includes('proj saved'))).toBe(true)
  expect(w.opens).toHaveLength(0)
  expect(w.clears).toBe(0)
  // the guard is released: a second save runs
  expect((await runSelfRelay($, 'save')).text).toBe('self-relay: saving proj...')
  await settle(() => w.toasts.filter(t => t.includes('saved')).length === 2)
})

test('save: a blocked fork toasts the reason and writes nothing', async ($, on) => {
  const w = world(on, 'GATE: blocked - mid synthesis')
  await fresh($)
  await runSelfRelay($, 'save proj')
  await settle(() => w.toasts.length > 0)
  expect(w.toasts[0]).toContain('mid synthesis')
  expect(w.files.has(STATE)).toBe(false)
})

// ---------- T12 load ----------

test('load: injects state + journal rule + regime as the first message', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  w.files.set(STATE, 'stream: proj\ngoal: g\n')
  const out = await runSelfRelay($, 'load proj')
  expect(out.text).toContain('loading relay-proj-llm.md')
  // the host refuses prompt.submit inside the command.run hook: it runs from a clock.after dispatch
  expect(w.submits).toHaveLength(0)
  await w.clock.advance(5)
  expect(w.submits).toHaveLength(1)
  expect(w.submits[0].startsWith('stream: proj\ngoal: g\n\nJournal journal/proj.md')).toBe(true)
  expect(w.submits[0]).toContain(RULE)
  expect(w.submits[0]).toContain('Announce [READY] on a single line and stop there.')
  expect(w.submits[0]).toContain('Questions go to me, in this window.')
  expect(w.submits[0]).toContain('After my go, read the `read_first` files before acting.')
  expect(w.submits[0]).not.toContain('orchestrator')
  expect(w.forkPrompts).toHaveLength(0)
})

test('load: missing state file -> {text} error, nothing injected', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  const out = await runSelfRelay($, 'load nowhere')
  expect(out.text).toContain('no state file relay-nowhere-llm.md')
  expect(w.submits).toHaveLength(0)
})

test('load without a stream: refused', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  expect((await runSelfRelay($, 'load')).text).toContain('no stream')
  expect(w.submits).toHaveLength(0)
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
    plugin: 'modtest',
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
  await relayProj($, '--yes')
  const answer = `Done.\n\n${TRAILER}`
  const ui = await mountMessage($, answer)
  expect(await ui.findAll({ text: /<!-- ckpt/ })).toHaveLength(0)
  await ui.unmount()
  await complete($, answer)
  expect(w.files.get(JOURNAL)).toContain(TRAILER)
})
