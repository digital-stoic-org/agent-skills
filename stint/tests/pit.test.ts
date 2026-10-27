import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'
import {
  AGENT_LINE,
  AGENTS_UNKNOWN,
  NOTES_MAX,
  SLOW_MS,
  UNPACK_RULES,
  WALL_CAP,
  agentLinesOf,
  boardProgress,
  hintBoard,
  savedBoard,
  assemble,
  elapsed,
  forkPrompt,
  hintText,
  notesPath,
  overWall,
  parseArgs,
  parseFork,
  parseForkBody,
  parseNotes,
  progressText,
  resolveStream,
  slugify,
  streamsFromNames,
} from '../hooks/pit.ts'

// ---------- pure functions ----------

test('parseArgs: no argument, a valid stream, usage errors', () => {
  expect(parseArgs('', 'pit')).toEqual({})
  expect(parseArgs('  proj  ', 'pit')).toEqual({ stream: 'proj' })
  expect(parseArgs('a_b-9', 'rejoin')).toEqual({ stream: 'a_b-9' })
  expect(parseArgs('a b', 'pit')).toEqual({ error: 'too many arguments. Usage: /pit [stream]' })
  expect(parseArgs('--review', 'pit')).toEqual({ error: 'unknown option --review. Usage: /pit [stream]' })
  expect(parseArgs('-y', 'rejoin')).toEqual({ error: 'unknown option -y. Usage: /rejoin [stream]' })
  expect(parseArgs('a/b', 'pit')).toEqual({ error: 'invalid stream "a/b": use 1-50 chars of a-z A-Z 0-9 _ -' })
  expect(parseArgs('x'.repeat(51), 'pit')).toHaveProperty('error')
  expect(parseArgs('x'.repeat(50), 'pit')).toEqual({ stream: 'x'.repeat(50) })
})

test('parseArgs: reserved words are refused', () => {
  expect(parseArgs('pit', 'pit')).toEqual({ error: '"pit" is a reserved word, not a stream name' })
  expect(parseArgs('rejoin', 'rejoin')).toEqual({ error: '"rejoin" is a reserved word, not a stream name' })
})

test('slugify: a valid name stays, a title becomes a slug, empty or reserved is no stream', () => {
  expect(slugify('proj-1')).toBe('proj-1')
  expect(slugify('Ship the v2 plugin!')).toBe('ship-the-v2-plugin')
  expect(slugify('  --Éclair--  ')).toBe('clair')
  expect(slugify('???')).toBeNull()
  expect(slugify('')).toBeNull()
  expect(slugify('pit')).toBeNull()
  expect(slugify('  REJOIN ')).toBeNull()
  expect(slugify('a'.repeat(80))).toBe('a'.repeat(50))
  expect(slugify(`${'a'.repeat(49)} bbb`)).toBe('a'.repeat(49))
})

test('resolveStream: explicit binding > title > main', () => {
  expect(resolveStream('arg', 'title')).toBe('arg')
  expect(resolveStream(null, 'title')).toBe('title')
  expect(resolveStream(null, null)).toBe('main')
})

test('notesPath: <cwd>/.stint/<stream>-notes.md', () => {
  expect(notesPath('/work', 'proj')).toBe('/work/.stint/proj-notes.md')
  expect(notesPath('/work/', 'proj')).toBe('/work/.stint/proj-notes.md')
})

test('streamsFromNames: only <stream>-notes.md files, sorted', () => {
  expect(streamsFromNames(['b-notes.md', 'a-notes.md', 'readme.md', 'x-notes.txt', '-notes.md', 'a b-notes.md', 'a-notes-notes.md'])).toEqual(['a', 'a-notes', 'b'])
  expect(streamsFromNames([])).toEqual([])
})

test('overWall: at or above 95% of the wall', () => {
  expect(WALL_CAP).toBe(0.95)
  expect(overWall(94_999, 100_000)).toBe(false)
  expect(overWall(95_000, 100_000)).toBe(true)
  expect(overWall(120_000, 100_000)).toBe(true)
  expect(overWall(10, 0)).toBe(false)
})

test('progress text: ticks, then says slow or stuck', () => {
  expect(elapsed(12_000)).toBe('12s')
  expect(elapsed(125_000)).toBe('2m 05s')
  expect(progressText('Pitting stream "x"', 0)).toBe('Pitting stream "x"...')
  expect(progressText('Pitting stream "x"', 12_000)).toBe('Pitting stream "x"... 12s')
  expect(progressText('Pitting stream "x"', SLOW_MS)).toContain('slow or stuck')
})

test('hintText: one stream names the command, several ask for a pick', () => {
  expect(hintText(['x'])).toBe('Notes for stream "x" found: /rejoin x')
  expect(hintText(['a', 'b'])).toBe('Notes found for streams "a", "b": /rejoin <stream>')
})

// ---------- fork output ----------

const FORK_LINES = [
  'status: building',
  'goal: ship v2',
  'read_first:',
  '- /w/spec.md — the spec',
  'read_if_needed:',
  '- /w/extra.md — when X',
  'deliverable: /w/out.md',
  'decisions:',
  '- notes by one fork — simpler',
  'learnings:',
  '- the fork cannot run commands — see the prompt',
  'discarded:',
  '- a second fork — too slow',
  'in_progress:',
  '- parser half done',
  'next:',
  '- write tests',
  'unknowns:',
  '- does clear work from a hook',
  'stale:',
  '- /w/old.md — replaced by spec.md',
]
const OK = (lines: string[] = FORK_LINES) => `GATE: ok\n${lines.join('\n')}`
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
const asm = (lines: string[] = FORK_LINES, extra: { prev?: string | null; agents?: string[] } = {}) => {
  const parsed = parseFork(OK(lines))
  if (parsed.kind !== 'ok') throw new Error('blocked')
  const fork = parseForkBody(parsed.body)
  if (!fork) throw new Error('unparseable')
  return assemble({ stream: 'proj', saved: '2026-10-22T10:00:00.000Z', sid: 's2', prev: extra.prev ?? null, fork, agents: extra.agents })
}

test('parseFork: ok, blocked with reason, malformed, empty', () => {
  expect(parseFork('GATE: ok\nstatus: x')).toEqual({ kind: 'ok', body: 'status: x' })
  expect(parseFork('GATE: blocked - mid synthesis')).toEqual({ kind: 'blocked', reason: 'mid synthesis' })
  expect(parseFork('GATE: blocked')).toEqual({ kind: 'blocked', reason: 'no reason given' })
  expect(parseFork('hello')).toEqual({ kind: 'blocked', reason: 'malformed first line: hello' })
  expect(parseFork('GATE: ok\n')).toEqual({ kind: 'blocked', reason: 'empty fork output' })
})

test('parseForkBody: scalars and lists, unknown lines ignored, nothing parseable is null', () => {
  const fields = parseForkBody(FORK_LINES.join('\n') + '\nretire_done: c01\nnoise')
  expect(fields?.scalars).toEqual({ status: 'building', goal: 'ship v2', deliverable: '/w/out.md' })
  expect(fields?.lists.read_first).toEqual(['/w/spec.md — the spec'])
  expect(fields?.lists.next).toEqual(['write tests'])
  expect(fields?.lists).not.toHaveProperty('retire_done')
  expect(parseForkBody('just some prose')).toBeNull()
})

// ---------- assemble ----------

test('assemble: header scalars, body in order, ends with a newline', () => {
  const r = assemble0()
  expect(r.kind).toBe('ok')
  const state = r.kind === 'ok' ? r.state : ''
  expect(state.split('\n').slice(0, 5)).toEqual([
    'stream: proj',
    'saved: 2026-10-22T10:00:00.000Z s2',
    'status: building',
    'previous_session: none',
    'goal: ship v2',
  ])
  const keys = state.split('\n').filter(l => /^[a-z_]+:/.test(l)).map(l => l.split(':')[0])
  expect(keys).toEqual(['stream', 'saved', 'status', 'previous_session', 'goal', 'read_first', 'read_if_needed', 'deliverable', 'decisions', 'learnings', 'discarded', 'in_progress', 'next', 'unknowns', 'stale'])
  expect(state).not.toContain('journal')
  expect(state.endsWith('\n')).toBe(true)
  expect(r.kind === 'ok' && r.degraded).toBe(false)
})
const assemble0 = () => asm()

test('assemble: previous header carried (previous_session, status, goal), the fork wins when it writes one', () => {
  const prev = 'stream: proj\nsaved: 2026-10-21T10:00:00.000Z s1\nstatus: review\nprevious_session: s0\ngoal: old goal\n\nread_first:\ndeliverable: /w/old.md\n'
  const r = asm(['read_first:', '- /a — b'], { prev })
  const state = r.kind === 'ok' ? r.state : ''
  expect(state).toContain('previous_session: s1')
  expect(state).toContain('status: review')
  expect(state).toContain('goal: old goal')
  expect(state).toContain('deliverable: /w/old.md')
  const same = asm(['status: done'], { prev: prev.replace('s1', 's2') })
  expect(same.kind === 'ok' && same.state).toContain('previous_session: s0')
  expect(same.kind === 'ok' && same.state).toContain('status: done')
})

test('assemble: a decision without a why gets one, an empty unknowns gets a default, duplicates collapse', () => {
  const r = asm(['decisions:', '- plain choice', '- plain choice', 'unknowns:'])
  const state = r.kind === 'ok' ? r.state : ''
  expect(section(state, 'decisions')).toEqual(['plain choice — why missing'])
  expect(section(state, 'unknowns')).toEqual(['nothing recorded — treat every fact as unverified'])
})

test('assemble: agent lines first in in_progress, written by code; the fork cannot write one', () => {
  const r = asm(['in_progress:', `- ${AGENT_LINE} ghost [g1] running — copied`, `- ${AGENTS_UNKNOWN}`, '- half done'], { agents: [`${AGENT_LINE} scout [a1] running — task`] })
  const state = r.kind === 'ok' ? r.state : ''
  expect(section(state, 'in_progress')).toEqual([`${AGENT_LINE} scout [a1] running — task`, 'half done'])
})

test('agentLinesOf: format, live statuses only, capped at 10 with a count line', () => {
  const mk = (i: number, status = 'running') => ({ id: `a${i}`, name: i === 1 ? 'scout' : '', type: 'general-purpose', status, description: `task   of\n a${i}` })
  expect(agentLinesOf([mk(1), mk(2, 'idle'), mk(3, 'completed'), mk(4, 'failed')])).toEqual([
    'agent in flight: scout [a1] running — task of a1',
    'agent in flight: general-purpose [a2] idle — task of a2',
  ])
  expect(agentLinesOf([{ id: 'z', type: 'Explore', status: 'pending' }])).toEqual(['agent in flight: Explore [z] pending'])
  const many = agentLinesOf(Array.from({ length: 13 }, (_, i) => mk(i + 1)))
  expect(many).toHaveLength(11)
  expect(many[10]).toBe('agent in flight: +3 more, not listed')
  expect(agentLinesOf([{ id: 'l', type: 't', status: 'running', description: 'x'.repeat(300) }])[0]?.length).toBeLessThan(160)
})

// ---------- the cap ----------

const filler = (tag: string, n: number, len = 70) => Array.from({ length: n }, (_, i) => `- ${tag}${String(i).padStart(3, '0')} ${'.'.repeat(len)}`)
const big = (extra: Record<string, string[]>) =>
  [
    'status: building',
    'goal: g',
    'read_first:',
    '- /w/spec.md — the spec',
    ...Object.entries(extra).flatMap(([k, v]) => [`${k}:`, ...v]),
  ]

test('cap: under the cap nothing is cut', () => {
  const r = asm()
  expect(r.kind === 'ok' && r.cut).toEqual([])
})

test('cap: read_if_needed is compressed first, then stale, in_progress, discarded, learnings go oldest first, status marked degraded', () => {
  // ~9.4 KB: after the compression, stale then in_progress go, then discarded; learnings are untouched.
  const lines = big({
    read_if_needed: filler('r', 10, 150),
    stale: filler('s', 10),
    in_progress: filler('p', 10),
    discarded: filler('d', 30),
    learnings: filler('l', 60),
    next: ['- keep next'],
  })
  const r = asm(lines)
  expect(r.kind).toBe('ok')
  if (r.kind !== 'ok') return
  expect(r.state.length).toBeLessThanOrEqual(NOTES_MAX)
  expect(r.degraded).toBe(true)
  expect(r.state).toContain('status: degraded (building)')
  expect(r.cut[0]).toBe('read_if_needed compressed')
  // order: stale is exhausted before in_progress is touched, in_progress before discarded, discarded before learnings
  const cutKeys = r.cut.slice(1).map(c => c.split(' ')[0])
  const order = ['stale', 'in_progress', 'discarded', 'learnings']
  expect(cutKeys).toEqual(order.filter(k => cutKeys.includes(k)))
  expect(cutKeys.slice(0, 2)).toEqual(['stale', 'in_progress'])
  expect(section(r.state, 'stale')).toEqual([])
  expect(section(r.state, 'in_progress')).toEqual([])
  expect(section(r.state, 'learnings')).toHaveLength(60)
  // never cut
  expect(section(r.state, 'read_first')).toEqual(['/w/spec.md — the spec'])
  expect(section(r.state, 'next')).toEqual(['keep next'])
  for (const l of section(r.state, 'read_if_needed')) expect(l.length).toBeLessThanOrEqual(80)
})

test('cap: learnings are the last of the five; the oldest line goes first', () => {
  const r = asm(big({ stale: filler('s', 5), in_progress: filler('p', 5), discarded: filler('d', 5), learnings: filler('l', 110) }))
  expect(r.kind).toBe('ok')
  if (r.kind !== 'ok') return
  expect(r.cut.map(c => c.split(' ')[0])).toEqual(['stale', 'in_progress', 'discarded', 'learnings'])
  expect(section(r.state, 'stale')).toEqual([])
  const kept = section(r.state, 'learnings')
  expect(kept.length).toBeGreaterThan(0)
  expect(kept[0]).not.toContain('l000')
  expect(kept[kept.length - 1]).toContain('l109')
  expect(r.state.length).toBeLessThanOrEqual(NOTES_MAX)
})

test('cap: the first cut is read_if_needed compression alone when that is enough', () => {
  const r = asm(big({ read_if_needed: filler('r', 40, 190) }))
  expect(r.kind).toBe('ok')
  if (r.kind !== 'ok') return
  expect(r.cut).toEqual(['read_if_needed compressed'])
  expect(r.degraded).toBe(true)
})

test('cap: past the five sections the rest is cut and the cut is named in stale; the agent lines survive', () => {
  const agents = ['agent in flight: scout [a1] running — task']
  const r = asm(big({ decisions: filler('x', 40, 190), next: filler('n', 20, 100) }), { agents })
  expect(r.kind).toBe('ok')
  if (r.kind !== 'ok') return
  expect(r.state.length).toBeLessThanOrEqual(NOTES_MAX)
  expect(section(r.state, 'in_progress')).toEqual(agents)
  expect(section(r.state, 'stale').some(l => l.startsWith('overflow: cut to fit 8000 chars:'))).toBe(true)
  expect(section(r.state, 'read_first')).toEqual(['/w/spec.md — the spec'])
})

test('cap: header, read_first and agent lines alone over the cap is refused, nothing written', () => {
  const r = asm(['read_first:', ...filler('f', 120, 80)])
  expect(r.kind).toBe('blocked')
  expect(r.kind === 'blocked' && r.reason).toContain('shorten read_first')
})

// ---------- previous notes and the prompt ----------

test('forkPrompt: previous notes are passed to merge; none says (none); the room is told', () => {
  const prev = 'stream: proj\nstatus: building\n'
  const p = forkPrompt(prev)
  expect(p).toContain(`PREVIOUS NOTES:\n${prev}`)
  expect(p).toContain('Never restart from scratch')
  expect(p).toContain('8,000 characters')
  expect(forkPrompt(null)).toContain('PREVIOUS NOTES:\n(none)')
  expect(forkPrompt('x'.repeat(7_000))).toContain('Room is tight')
  expect(p).not.toContain('retire_')
  expect(p).not.toContain('ckpt')
  expect(parseNotes(prev).scalars.status).toBe('building')
})

// ---------- flows against a stubbed engine ----------

const CWD = '/work'
const NOTES = '/work/.stint/proj-notes.md'
const TOKENS = { tokens: 10_000, wall: 100_000 }

type World = {
  submits: string[]
  clears: number
  toasts: string[]
  statuses: (string | undefined)[]
  forkPrompts: string[]
  store: Map<string, unknown>
  files: Map<string, string>
  forkText: string | null
  gate: Promise<void> | null
  usage: { tokens?: number; wall: number } | 'throws'
  clock: { advance: (ms: number) => Promise<void> }
  agents: { id: string; name?: string; description: string; type: string; status: string }[]
  refuseClear: boolean
  failWrites: boolean
}

function world(on: On, forkText: string | null, now = 1_000_000): World {
  const w: World = {
    submits: [],
    clears: 0,
    toasts: [],
    statuses: [],
    forkPrompts: [],
    store: new Map(),
    files: new Map(),
    forkText,
    gate: null,
    usage: TOKENS,
    clock: { advance: async () => undefined },
    agents: [],
    refuseClear: false,
    failWrites: false,
  }
  on('store.get', (_$, e) => ({ value: w.store.get(e.key) }))
  on('store.set', (_$, e) => (w.store.set(e.key, e.value), { value: undefined }))
  on('store.delete', (_$, e) => (w.store.delete(e.key), { value: undefined }))
  w.clock = mock.clock(on, { now })
  on('model.fork', async (_$, e) => {
    w.forkPrompts.push(e.prompt)
    if (w.gate) await w.gate
    return {
      value: w.forkText === null ? { isAnswered: false, reason: 'nothing-to-fork' } : { isAnswered: true, text: w.forkText, usage: { input_tokens: 1, output_tokens: 1 } },
    } as never
  })
  on('agent.list', () => ({ value: w.agents }) as never)
  on('session.cwd', () => ({ value: CWD }))
  on('session.id', () => ({ value: 'sess-1' }))
  on('session.usage', () => {
    if (w.usage === 'throws') throw new Error('usage down')
    return { value: { startedAt: 0, context: { window: 200_000, tokens: w.usage.tokens, breakdown: { autoCompactThreshold: w.usage.wall } }, rateLimits: [] } } as never
  })
  on('fs.exists', (_$, e) => ({ value: w.files.has(e.path) }))
  on('fs.read', (_$, e) => {
    const text = w.files.get(e.path)
    return text === undefined ? { deny: 'ENOENT' } : { value: text }
  })
  on('fs.write', (_$, e) => {
    if (w.failWrites) return { deny: 'EACCES' }
    w.files.set(e.path, e.text)
    return { value: undefined }
  })
  on('fs.list', (_$, e) => {
    const prefix = `${e.path}/`
    const names = [...w.files.keys()].filter(p => p.startsWith(prefix) && !p.slice(prefix.length).includes('/')).map(p => p.slice(prefix.length))
    if (names.length === 0) return { deny: 'ENOENT' }
    return { value: names.map(name => ({ name, kind: 'file', size: 1, mtimeMs: 0, isLink: false })) } as never
  })
  on('session.measure', (_$, e) => ({ changed: [...e.changed] }))
  on('ui.status', (_$, e) => (w.statuses.push(e.text), { value: undefined }))
  on('ui.toast', (_$, e) => (w.toasts.push(e.text), { value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  on('classic.SessionStart', () => ({}))
  on('classic.UserPromptSubmit', () => ({}))
  on('command.run', { command: 'clear' }, () => {
    if (w.refuseClear) throw new Error('refused')
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
  $.command.run({ command, args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 120 } })
const pit = ($: Engine, args = 'proj') => runCommand($, 'pit', args)
const rejoin = ($: Engine, args = '') => runCommand($, 'rejoin', args)
const fresh = ($: Engine) => $.classic.SessionStart({ source: 'startup' })
const clear = ($: Engine) => $.classic.SessionStart({ source: 'clear' })
const title = ($: Engine, session_title: string) => $.classic.UserPromptSubmit({ prompt: 'x', session_title })
const BAND = { plugin: 'stint', surface: 'terminal', component: 'AbovePrompt', requestId: 'band', viewport: { columns: 120, rows: 40, isFullscreen: false }, props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 110, scroll: { first: 1, last: 1, of: 1 }, view: {} } } as never
// The band's text now. Raising the band moves the pit lines off the status line, so call it after the status assertions.
async function bandNow($: Engine): Promise<string> {
  await $.session.measure({ context: { window: 200_000, tokens: 2_000, percent: 1 }, rateLimits: [], changed: ['context'] })
  const ui = await $.ui.mount(BAND)
  const text = (await ui.findAll({ type: 'Text' }))[0]?.text ?? ''
  await ui.unmount()
  return text
}
const lastStatus = (w: World) => w.statuses[w.statuses.length - 1]

test('pit: saves, runs /clear after the hook, re-injects the notes + rules once after the clear', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  const out = await pit($)
  expect(out.text).toBe('pit: saved .stint/proj-notes.md')
  const notes = w.files.get(NOTES) ?? ''
  expect(notes).toContain('stream: proj')
  expect(notes).toContain('goal: ship v2')
  // the host rejects command.run inside the hook: the clear runs from a clock.after dispatch
  expect(w.clears).toBe(0)
  await w.clock.advance(5)
  expect(w.clears).toBe(1)
  expect(w.store.get('stint:pending')).toMatchObject({ stream: 'proj', cwd: CWD })
  await clear($)
  expect(w.submits).toEqual([`${notes.trimEnd()}\n\n${UNPACK_RULES}`])
  expect(w.store.get('stint:pending')).toBeUndefined()
  expect(w.toasts.some(t => t.includes('stream "proj"'))).toBe(true)
  // nothing is injected twice
  await clear($)
  expect(w.submits).toHaveLength(1)
})

test('pit: a fork gate that blocks, a fork without answer, a failed write: no /clear, status line warns, notes untouched', async ($, on) => {
  const w = world(on, 'GATE: blocked - mid synthesis')
  await fresh($)
  const blocked = await pit($)
  expect(blocked.text).toBe('pit: could not save stream "proj": mid synthesis. No /clear run, the session is unchanged.')
  expect(lastStatus(w)).toMatch(/^⚠ /)
  expect(w.files.has(NOTES)).toBe(false)
  // red and sticky on the board until the next command
  await w.clock.advance(60_000)
  expect(await bandNow($)).toContain('PIT FAILED, session kept')

  w.forkText = null
  const none = await pit($)
  expect(none.text).toContain('nothing to save yet')

  w.forkText = OK()
  w.failWrites = true
  const failed = await pit($)
  expect(failed.text).toContain('could not save stream "proj"')

  await w.clock.advance(5)
  expect(w.clears).toBe(0)
  expect(w.store.get('stint:pending')).toBeUndefined()
  await clear($)
  expect(w.submits).toHaveLength(0)
})

test('pit: refused before the fork when the context is at 95% of the wall', async ($, on) => {
  const w = world(on, OK())
  w.usage = { tokens: 95_000, wall: 100_000 }
  await fresh($)
  const out = await pit($)
  expect(out.text).toContain('pit: context is at 95%')
  expect(out.text).toContain('Nothing saved, the session is unchanged')
  expect(w.forkPrompts).toHaveLength(0)
  expect(lastStatus(w)).toMatch(/^⚠ Pit refused/)
  expect(await bandNow($)).toContain('PIT REFUSED at 95% of the limit, nothing saved')
  await w.clock.advance(5)
  expect(w.clears).toBe(0)
  // just under goes through
  w.usage = { tokens: 94_000, wall: 100_000 }
  const ok = await pit($)
  expect(ok.text).toContain('saved')
  // unknown figures do not block
  w.usage = 'throws'
  expect((await pit($)).text).toContain('saved')
})

test('pit: the stream binds for the session and survives /clear; the next pit without argument reuses it', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  await pit($, 'proj')
  await w.clock.advance(5)
  await clear($)
  const again = await pit($, '')
  expect(again.text).toBe('pit: saved .stint/proj-notes.md')
  expect(w.files.has('/work/.stint/main-notes.md')).toBe(false)
})

test('pit: stream = title (slugified) without argument, main without title', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  expect((await pit($, '')).text).toBe('pit: saved .stint/main-notes.md')
  await title($, 'Ship the v2 plugin')
  expect((await pit($, '')).text).toBe('pit: saved .stint/ship-the-v2-plugin-notes.md')
  expect(w.files.has('/work/.stint/ship-the-v2-plugin-notes.md')).toBe(true)
  // an explicit argument wins over the title
  expect((await pit($, 'proj')).text).toBe('pit: saved .stint/proj-notes.md')
  expect((await pit($, '')).text).toBe('pit: saved .stint/proj-notes.md')
})

test('pit: previous notes of the stream are fed to the fork and merged', async ($, on) => {
  const w = world(on, OK())
  w.files.set(NOTES, 'stream: proj\nsaved: 2026-10-21T10:00:00.000Z old-sess\nstatus: building\nprevious_session: none\ngoal: old goal\n\nread_first:\ndeliverable: none\n')
  await fresh($)
  await pit($)
  expect(w.forkPrompts[0]).toContain('goal: old goal')
  expect(w.files.get(NOTES)).toContain('previous_session: old-sess')
})

test('pit: agents in flight are listed in in_progress by code before the fork', async ($, on) => {
  const w = world(on, OK())
  w.agents = [{ id: 'a1', name: 'scout', description: 'look around', type: 'Explore', status: 'running' }]
  await fresh($)
  await pit($)
  expect(section(w.files.get(NOTES) ?? '', 'in_progress')).toEqual(['agent in flight: scout [a1] running — look around', 'parser half done'])
})

test('boardProgress, savedBoard, hintBoard: short board texts', () => {
  expect(boardProgress('x', 0)).toBe('pitting "x"...')
  expect(boardProgress('x', 12_000)).toBe('pitting "x"... 12s')
  expect(boardProgress('x', SLOW_MS)).toContain('slow or stuck')
  expect(savedBoard(9_800)).toBe('saved 9.8k -> clearing')
  expect(savedBoard(420)).toBe('saved 420 -> clearing')
  expect(hintBoard(['a'])).toBe('notes found: /rejoin a')
  expect(hintBoard(['a', 'b'])).toBe('/rejoin <stream>: several notes found')
})

test('pit: a second pit while one runs is refused; progress ticks on the status line, slow past 3 min', async ($, on) => {
  const w = world(on, OK())
  let release = () => {}
  w.gate = new Promise<void>(r => (release = r))
  await fresh($)
  const first = pit($)
  await new Promise(r => setTimeout(r, 20))
  expect(lastStatus(w)).toBe('Pitting stream "proj"...')
  await w.clock.advance(12_000)
  expect(lastStatus(w)).toBe('Pitting stream "proj"... 12s')
  const second = await pit($)
  expect(second.text).toBe('pit: a pit is already running, its outcome will show in the status line')
  await w.clock.advance(SLOW_MS)
  expect(lastStatus(w)).toContain('slow or stuck')
  expect(await bandNow($)).toContain('pitting "proj": slow or stuck, 3m 12s')
  release()
  const done = await first
  expect(done.text).toContain('saved')
  expect(w.forkPrompts).toHaveLength(1)
})

test('pit: when the host refuses /clear the status line says to type it, and the clear still injects', async ($, on) => {
  const w = world(on, OK())
  w.refuseClear = true
  await fresh($)
  await pit($)
  await w.clock.advance(5)
  await new Promise(r => setTimeout(r, 10))
  expect(lastStatus(w)).toBe('Ready: type /clear to continue in a fresh session')
  expect(await bandNow($)).toContain('type /clear to continue')
  await clear($)
  expect(w.submits).toHaveLength(1)
})

test('pit: a stale armed entry (> 10 min) is not injected', async ($, on) => {
  const w = world(on, null, 11 * 60 * 1000)
  w.store.set('stint:pending', { text: 'n', createdAt: 0, cwd: CWD, stream: 'proj' })
  await clear($)
  expect(w.submits).toHaveLength(0)
  expect(w.store.get('stint:pending')).toBeUndefined()
})

test('pit: a fresh armed entry in the store (mod reloaded) is injected and re-binds its stream', async ($, on) => {
  const w = world(on, OK(), 60 * 1000)
  w.store.set('stint:pending', { text: 'n', createdAt: 0, cwd: CWD, stream: 'proj' })
  await clear($)
  expect(w.submits).toEqual([`n\n\n${UNPACK_RULES}`])
  expect((await pit($, '')).text).toBe('pit: saved .stint/proj-notes.md')
})

test('pit: bad arguments are refused with the usage', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  expect((await pit($, 'a b')).text).toBe('pit: too many arguments. Usage: /pit [stream]')
  expect((await pit($, 'rejoin')).text).toContain('reserved word')
  expect(w.forkPrompts).toHaveLength(0)
})

test('rejoin: a named stream becomes the first message (after the hook) and binds', async ($, on) => {
  const w = world(on, OK())
  w.files.set(NOTES, 'stream: proj\ngoal: g\n')
  await fresh($)
  const out = await rejoin($, 'proj')
  expect(out.text).toBe('rejoin: loading stream "proj" as the first message.')
  expect(w.submits).toHaveLength(0)
  await w.clock.advance(5)
  expect(w.submits).toEqual([`stream: proj\ngoal: g\n\n${UNPACK_RULES}`.replace('g\n\n', 'g\n\n')])
  // bound: a pit without argument uses it
  expect((await pit($, '')).text).toBe('pit: saved .stint/proj-notes.md')
})

test('rejoin: no argument takes the only notes file, or says none', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  expect((await rejoin($)).text).toBe('rejoin: no notes in .stint/ of this folder. Nothing loaded.')
  w.files.set(NOTES, 'stream: proj\n')
  expect((await rejoin($)).text).toBe('rejoin: loading stream "proj" as the first message.')
  await w.clock.advance(5)
  expect(w.submits).toHaveLength(1)
})

test('rejoin: no argument lists several notes files', async ($, on) => {
  const w2 = world(on, OK())
  w2.files.set('/work/.stint/a-notes.md', 'x')
  w2.files.set('/work/.stint/b-notes.md', 'y')
  await fresh($)
  expect((await rejoin($)).text).toBe('rejoin: several notes here, pick one with /rejoin <stream>: a, b')
  await w2.clock.advance(5)
  expect(w2.submits).toHaveLength(0)
})

test('rejoin: an unknown stream says so and lists what exists; bad arguments are refused', async ($, on) => {
  const w = world(on, OK())
  w.files.set('/work/.stint/a-notes.md', 'x')
  await fresh($)
  expect((await rejoin($, 'nope')).text).toBe('rejoin: no notes for stream "nope" in this folder. Nothing loaded. Notes here: a.')
  expect((await rejoin($, 'a b')).text).toBe('rejoin: too many arguments. Usage: /rejoin [stream]')
  expect((await rejoin($, 'pit')).text).toContain('reserved word')
  await w.clock.advance(5)
  expect(w.submits).toHaveLength(0)
})

test('session start: a hint when notes exist and no stream is bound; none otherwise; gone once bound', async ($, on) => {
  const w = world(on, OK())
  await fresh($)
  expect(w.statuses.filter(s => s !== undefined)).toHaveLength(0)

  w.files.set(NOTES, 'x')
  await fresh($)
  expect(lastStatus(w)).toBe('Notes for stream "proj" found: /rejoin proj')
  await title($, 'whatever')
  expect(lastStatus(w)).toBeUndefined()

  await fresh($)
  expect(lastStatus(w)).toBe('Notes for stream "proj" found: /rejoin proj')
  await rejoin($, 'proj')
  expect(lastStatus(w)).toBeUndefined()

  // a bound stream (survives /clear) shows no hint
  await clear($)
  expect(lastStatus(w)).toBeUndefined()
})
