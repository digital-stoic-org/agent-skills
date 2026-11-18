import { expect, test } from 'claude-code/testing'
import {
  USAGE,
  applyControl,
  armReply,
  decide,
  detectBlocked,
  freshCounters,
  hashText,
  isHumanOrigin,
  iterPrompt,
  firstPrompt,
  judgeFromCheck,
  judgePrompt,
  label,
  limitFromRun,
  limitToast,
  loopRules,
  newGoal,
  parseCommand,
  parseState,
  parseVerdict,
  recordTurn,
  recordVerdict,
  renderState,
  settle,
  statusSegment,
  statusText,
  stateFileName,
  type Command,
  type Counters,
  type TackState,
  type TurnFacts,
} from '../hooks/tack-core.ts'

const HUMAN = { kind: 'composer' }
const set = (c: Command) => {
  if (c.kind !== 'set') throw new Error(`not a set command: ${JSON.stringify(c)}`)
  return c
}

// ── grammar ─────────────────────────────────────────────────────────────────

test('grammar: bare word commands and aliases', () => {
  expect(parseCommand('')).toEqual({ kind: 'status' })
  expect(parseCommand('   ')).toEqual({ kind: 'status' })
  expect(parseCommand('pause')).toEqual({ kind: 'pause' })
  expect(parseCommand(' Resume ')).toEqual({ kind: 'resume' })
  for (const w of ['clear', 'stop', 'off', 'reset', 'cancel', 'CLEAR']) expect(parseCommand(w)).toEqual({ kind: 'clear' })
})

test('grammar: a command word at the head of a longer text is a condition', () => {
  expect(set(parseCommand('stop the server leaking memory')).condition).toBe('stop the server leaking memory')
  expect(set(parseCommand('pause menu works')).condition).toBe('pause menu works')
})

test('grammar: condition only gets the defaults', () => {
  expect(parseCommand('  all tests pass  ')).toEqual({ kind: 'set', condition: 'all tests pass', check: '', stop: '', max: 20, hours: 0 })
})

test('grammar: flags in any order, quotes, decimal hours', () => {
  const c = set(parseCommand('--max 5 --hours 1.5 --stop "du -s out | awk \'$1>9\'" --check \'npm test\' make it green', HUMAN))
  expect(c).toEqual({ kind: 'set', condition: 'make it green', check: 'npm test', stop: "du -s out | awk '$1>9'", max: 5, hours: 1.5 })
})

test('grammar: double quotes unescape \\" and \\\\ only, single quotes are literal', () => {
  expect(set(parseCommand('--check "grep \\"a b\\" f \\\\ \\n" goal', HUMAN)).check).toBe('grep "a b" f \\ \\n')
  expect(set(parseCommand("--check 'a \\\" b' goal", HUMAN)).check).toBe('a \\" b')
})

test('grammar: a -- inside the condition is text, a bare -- ends the flags', () => {
  expect(set(parseCommand('--max 3 run the build --verbose twice')).condition).toBe('run the build --verbose twice')
  expect(set(parseCommand('-- --weird goal')).condition).toBe('--weird goal')
  expect(set(parseCommand('--5 is a number')).condition).toBe('--5 is a number')
})

test('grammar: errors', () => {
  const msg = (a: string, o: { kind: string } = HUMAN) => {
    const c = parseCommand(a, o)
    return c.kind === 'error' ? c.message : `NOT AN ERROR: ${JSON.stringify(c)}`
  }
  expect(msg('--max 5')).toBe(USAGE)
  expect(msg('--check "x"')).toBe(USAGE)
  expect(msg('--nope 1 goal')).toContain('unknown flag --nope')
  expect(msg('--max 0 goal')).toContain('--max must be an integer from 1 to 200 (got 0)')
  expect(msg('--max 201 goal')).toContain('got 201')
  expect(msg('--max 2.5 goal')).toContain('got 2.5')
  expect(msg('--max --check goal')).toContain('got --check')
  expect(msg('--max')).toContain('needs a value')
  expect(msg('--hours 0 goal')).toContain('--hours must be a positive number')
  expect(msg('--hours -1 goal')).toContain('--hours')
  expect(msg('--check npm goal')).toContain('needs a quoted command')
  expect(msg('--check "npm goal')).toContain('unclosed quote')
  expect(msg('--check "" goal')).toContain('is empty')
  expect(msg('--check "a"b goal')).toContain('followed by a space')
  expect(msg('--max 3 --max 4 goal')).toContain('--max given twice')
})

test('grammar: condition length limit is 4000', () => {
  expect(parseCommand('x'.repeat(4000)).kind).toBe('set')
  expect(parseCommand('x'.repeat(4001))).toEqual({ kind: 'error', message: 'tack: condition is limited to 4000 characters (got 4001)' })
})

test('D15: --check and --stop only from composer, bridge, sdk', () => {
  for (const kind of ['composer', 'bridge', 'sdk']) {
    expect(parseCommand('--check "true" goal', { kind }).kind).toBe('set')
    expect(parseCommand('--stop "true" goal', { kind }).kind).toBe('set')
  }
  for (const o of [{ kind: 'plugin' }, { kind: 'peer' }, { kind: 'task-notification' }, { kind: 'scheduled-trigger' }, { kind: 'other' }, {}, undefined, null]) {
    for (const flag of ['--check', '--stop']) {
      const c = parseCommand(`${flag} "true" goal`, o)
      expect(c.kind).toBe('error')
    }
    expect(parseCommand('goal without shell', o).kind).toBe('set')
  }
  expect((parseCommand('--stop "true" goal', { kind: 'plugin' }) as { message: string }).message).toContain('origin: plugin')
})

test('D9: only composer, bridge, sdk are human origins', () => {
  for (const k of ['composer', 'bridge', 'sdk']) expect(isHumanOrigin({ kind: k })).toBe(true)
  for (const k of ['plugin', 'peer', 'task-notification', 'scheduled-trigger', 'x']) expect(isHumanOrigin({ kind: k })).toBe(false)
  expect(isHumanOrigin(undefined)).toBe(false)
  expect(isHumanOrigin({})).toBe(false)
})

// ── state ───────────────────────────────────────────────────────────────────

const T0 = Date.parse('2026-10-08T21:30:00Z')
const base = (over: Partial<TackState> = {}): TackState => ({
  ...newGoal(set(parseCommand('all tests pass')), 'stoa', T0),
  ...over,
})

test('state: render then parse is the identity, including multiline and special text', () => {
  const s = base({
    condition: 'line one\n\n  indented: "quote" # not a comment\n---\nlast',
    check: 'npm test -- --grep "a b"',
    stop: "test $(wc -c < out) -gt 100",
    max: 7,
    hours: 1.5,
    iteration: 4,
    resets: 1,
    tokens: 812000,
    lastVerdict: 'continue',
    lastReason: '3 tests still failing: "a" #1\\n',
    status: 'paused',
    pauseReason: 'stalled',
    progress: [
      { i: 4, at: '2026-10-08T21:52Z', verdict: 'continue', text: 'did a — b' },
      { i: 3, at: '2026-10-08T21:40Z', verdict: 'error', text: 'x' },
    ],
    verdicts: [
      { i: 4, verdict: 'continue', source: 'judge', reason: 'say "hi"\\ there' },
      { i: 3, verdict: 'error', source: 'code', reason: 'judge reply is not valid JSON' },
    ],
  })
  const text = renderState(s)
  expect(text.startsWith('---\ntack: 1\nstream: stoa\nstatus: paused\n')).toBe(true)
  expect(parseState(text)).toEqual(s)
})

test('state: no stream, empty lists, CRLF file', () => {
  const s = base({ stream: '' })
  const text = renderState(s)
  expect(text).toContain('stream: ""')
  expect(parseState(text)).toEqual(s)
  expect(parseState(text.replace(/\n/g, '\r\n'))).toEqual(s)
})

test('state: bare and quoted scalars, trailing comments, defaults for optional keys', () => {
  const t = ['---', 'tack: 1', 'stream: stoa      # which', 'status: active   # active | paused', 'condition: |', '  do it', 'max: 9', 'set_at: 2026-10-08T21:30:00Z', '---', ''].join('\n')
  const s = parseState(t)
  expect(s).toMatchObject({ stream: 'stoa', status: 'active', condition: 'do it', max: 9, hours: 0, iteration: 0, check: '', stop: '', pauseReason: '' })
})

test('state: malformed files give null (the store copy wins)', () => {
  const ok = renderState(base())
  expect(parseState(ok)).not.toBeNull()
  expect(parseState('')).toBeNull()
  expect(parseState('no frontmatter')).toBeNull()
  expect(parseState(ok.replace('tack: 1', 'tack: 2'))).toBeNull()
  expect(parseState(ok.replace('status: active', 'status: weird'))).toBeNull()
  expect(parseState(ok.replace('max: 20', 'max: lots'))).toBeNull()
  expect(parseState(ok.replace('set_at: 2026-10-08T21:30:00Z', 'set_at: yesterday'))).toBeNull()
  expect(parseState(ok.replace('check: ""', 'check: "unclosed'))).toBeNull()
  expect(parseState(ok.replace('condition: |', 'condition: inline'))).toBeNull()
  expect(parseState(ok.replace('all tests pass', ''))).toBeNull()
  expect(parseState(ok.replace('\n---\n## progress', '\n## progress'))).toBeNull()
})

test('state: file name per stream, unsafe characters are replaced', () => {
  expect(stateFileName('stoa')).toBe('tack-stoa-llm.md')
  expect(stateFileName('')).toBe('tack-llm.md')
  expect(stateFileName('../x/y')).toBe('tack-.._x_y-llm.md')
})

// ── prompts ─────────────────────────────────────────────────────────────────

test('prompts: first carries the full condition, later ones a 500-char label', () => {
  const long = 'word '.repeat(300).trim()
  const s = { ...base({ condition: long }), iteration: 1 }
  expect(firstPrompt(s)).toContain(`tack goal (iteration 1/20):\n${long}\n`)
  expect(firstPrompt(s)).toContain('tack: blocked — <what you need>')
  expect(label(long).length).toBe(500)
  expect(label(long).endsWith('…')).toBe(true)
  expect(label('short\n goal')).toBe('short goal')
  const p = iterPrompt({ ...s, iteration: 2 }, '3 tests failing')
  expect(p.split('\n')[0]).toBe(`tack iteration 2/20 — goal: ${label(long)}`)
  expect(p).toContain('Not met yet: 3 tests failing')
  expect(p).not.toContain(long)
})

test('prompts: loop rules name the state file and the last verdict', () => {
  const r = loopRules({ ...base({ lastReason: 'tests 3 red' }), iteration: 5 })
  expect(r).toContain('tack loop active — iteration 5/20, after a fresh start.')
  expect(r).toContain('Goal:\nall tests pass')
  expect(r).toContain('Last verdict: tests 3 red')
  expect(r).toContain('tack-stoa-llm.md')
  expect(loopRules(base())).toContain('Last verdict: none yet')
})

test('prompts: judge prompt lists prior notes oldest first and tails the answer to 6000', () => {
  const s = base({
    iteration: 3,
    progress: [
      { i: 2, at: 'T2', verdict: 'continue', text: 'second' },
      { i: 1, at: 'T1', verdict: 'continue', text: 'first' },
    ],
  })
  const p = judgePrompt(s, 'A'.repeat(7000) + 'END')
  expect(p).toContain('GOAL:\nall tests pass')
  expect(p).toContain('ITERATION: 3/20')
  expect(p.indexOf('i1 T1')).toBeLessThan(p.indexOf('i2 T2'))
  const answer = p.split('LAST ANSWER (tail):\n')[1]!
  expect(answer.length).toBe(6000)
  expect(answer.endsWith('END')).toBe(true)
  expect(judgePrompt(base(), 'x')).toContain('PROGRESS (oldest first):\n(none yet)')
})

test('blocked line: code-detected, last one wins, separators tolerated', () => {
  expect(detectBlocked('done\ntack: blocked — need the API key')).toBe('need the API key')
  expect(detectBlocked('tack: blocked - need x')).toBe('need x')
  expect(detectBlocked('tack: blocked: need y\r\n')).toBe('need y')
  expect(detectBlocked('tack: blocked')).toBe('')
  expect(detectBlocked('tack: blocked — a\nmore\ntack: blocked — b')).toBe('b')
  expect(detectBlocked('I am not tack: blocked — x')).toBeNull()
  expect(detectBlocked('tack: blockedness')).toBeNull()
  expect(detectBlocked('all fine')).toBeNull()
})

// ── judge ───────────────────────────────────────────────────────────────────

test('verdict parser: JSON anywhere in the reply, braces inside strings, first block wins', () => {
  expect(parseVerdict('{"verdict":"met","reason":"ran npm test: 0 failed"}')).toEqual({ ok: true, verdict: 'met', reason: 'ran npm test: 0 failed', source: 'judge' })
  expect(parseVerdict('Sure.\n```json\n{"verdict":"continue","reason":"fix {a} and }b{"}\n```')).toMatchObject({ ok: true, verdict: 'continue', reason: 'fix {a} and }b{' })
  expect(parseVerdict('{"verdict":"blocked","reason":"need a key"} {"verdict":"met","reason":"x"}')).toMatchObject({ verdict: 'blocked' })
  expect(parseVerdict('{"verdict":"impossible","reason":" self-contradictory "}')).toMatchObject({ verdict: 'impossible', reason: 'self-contradictory' })
})

test('verdict parser: every bad shape is a judge error with a cause', () => {
  const bad = [
    '',
    'no json here',
    '{"verdict":"met"',
    '{"verdict":"met","reason":}',
    '{"verdict":"done","reason":"x"}',
    '{"verdict":1,"reason":"x"}',
    '{"verdict":"met"}',
    '{"verdict":"met","reason":"  "}',
    '{"verdict":"met","reason":3}',
    '[1]',
    'null',
  ]
  for (const t of bad) {
    const r = parseVerdict(t)
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.cause.length > 0).toBe(true)
  }
})

test('check judge: exit 0 is met, non-zero is continue with the output tail, failure is a judge error', () => {
  expect(judgeFromCheck('npm test', { code: 0, output: 'ok' })).toEqual({ ok: true, verdict: 'met', reason: 'check passed: npm test', source: 'check' })
  const f = judgeFromCheck('npm test', { code: 2, output: 'x'.repeat(2000) + 'TAIL\n' })
  expect(f).toMatchObject({ ok: true, verdict: 'continue', source: 'check' })
  expect(f.ok && f.reason.startsWith('check failed (exit 2): ')).toBe(true)
  expect(f.ok && f.reason.endsWith('TAIL')).toBe(true)
  expect(f.ok && f.reason.length).toBe('check failed (exit 2): '.length + 1500)
  expect(judgeFromCheck('c', { code: null, output: '', failure: 'timed out' })).toEqual({ ok: false, cause: 'check timed out: c' })
  expect(judgeFromCheck('c', { code: null, output: '' }).ok).toBe(false)
})

test('D17 limit runner: exit 0 = reached, otherwise not, failure is reported not fatal', () => {
  expect(limitFromRun({ code: 0, output: 'size 9 MB\n' })).toEqual({ reached: true, tail: 'size 9 MB' })
  expect(limitFromRun({ code: 1, output: '' })).toEqual({ reached: false, tail: '' })
  expect(limitFromRun({ code: null, output: '', failure: 'spawn error' })).toEqual({ reached: false, tail: '', error: 'spawn error' })
  expect(limitToast('du -s .', 'big')).toBe('tack stopped: limit reached (du -s .)\nbig')
  expect(limitToast('du -s .', '')).toBe('tack stopped: limit reached (du -s .)')
})

// ── decide ──────────────────────────────────────────────────────────────────

const facts = (over: Partial<TurnFacts> = {}): TurnFacts => ({
  now: T0 + 60_000,
  isAborted: false,
  reason: 'end_turn',
  answer: 'closing note',
  liveAgents: 0,
  counters: freshCounters(),
  humanSeqAtEnd: 0,
  humanSeqNow: 0,
  packBusy: false,
  fill: { tokens: 1000, hardAt: 100_000 },
  ...over,
})
const cont = (reason = 'fix the failing test') => ({ ok: true as const, verdict: 'continue' as const, reason, source: 'judge' as const })
const running = (over: Partial<TackState> = {}) => base({ iteration: 2, ...over })

test('decide: not active -> noop, before anything else', () => {
  for (const status of ['paused', 'met', 'impossible', 'capped', 'cleared'] as const) {
    expect(decide(running({ status }), facts({ isAborted: true }))).toMatchObject({ kind: 'noop' })
  }
})

test('decide: abort pauses, error/refusal skip, blocked line pauses before any judge', () => {
  expect(decide(running(), facts({ isAborted: true }))).toMatchObject({ kind: 'pause', reason: 'interrupted' })
  expect(decide(running(), facts({ reason: 'error' }))).toMatchObject({ kind: 'skip' })
  expect(decide(running(), facts({ reason: 'refusal' }))).toMatchObject({ kind: 'skip' })
  expect(decide(running(), facts({ answer: 'x\ntack: blocked — need the key' }))).toMatchObject({ kind: 'pause', reason: 'blocked', detail: 'need the key' })
  expect(decide(running(), facts({ answer: 'tack: blocked' }))).toMatchObject({ kind: 'pause', reason: 'blocked', detail: 'no reason given' })
})

test('decide: live agents wait without judging (D10)', () => {
  expect(decide(running(), facts({ liveAgents: 2 }))).toMatchObject({ kind: 'wait-agents', n: 2 })
})

test('decide: phase 1 asks for the judge by kind', () => {
  expect(decide(running(), facts())).toMatchObject({ kind: 'need-judge', via: 'haiku' })
  expect(decide(running({ check: 'npm test' }), facts())).toMatchObject({ kind: 'need-judge', via: 'check' })
})

test('decide: met and impossible finish, judge blocked pauses', () => {
  const met = decide(running(), facts({ judge: { ok: true, verdict: 'met', reason: 'tests green', source: 'judge' } }))
  expect(met).toMatchObject({ kind: 'finish', status: 'met', reason: 'tests green' })
  expect(met.kind === 'finish' && met.text).toBe('tack: goal met after 2 iteration(s) — tests green')
  expect(decide(running(), facts({ judge: { ok: true, verdict: 'impossible', reason: 'contradiction', source: 'judge' } }))).toMatchObject({ kind: 'finish', status: 'impossible' })
  expect(decide(running(), facts({ judge: { ok: true, verdict: 'blocked', reason: 'need token', source: 'judge' } }))).toMatchObject({ kind: 'pause', reason: 'blocked', detail: 'need token' })
})

test('decide: met wins over every guard', () => {
  const s = running({ iteration: 20, stop: 'true', hours: 0.001 })
  const d = decide(s, facts({ judge: { ok: true, verdict: 'met', reason: 'ok', source: 'check' }, now: T0 + 1e9, humanSeqNow: 5 }))
  expect(d).toMatchObject({ kind: 'finish', status: 'met' })
})

test('decide: continue relaunches with the judge reason', () => {
  const d = decide(running(), facts({ judge: cont('add the missing test') }))
  expect(d).toMatchObject({ kind: 'relaunch', reason: 'add the missing test' })
  expect(d.counters.judgeErrors).toBe(0)
  expect(d.counters.stallHashes).toHaveLength(1)
})

test('guard max: iteration >= max caps', () => {
  expect(decide(running({ max: 2 }), facts({ judge: cont() }))).toMatchObject({ kind: 'finish', status: 'capped', text: 'tack stopped: max 2 iterations reached' })
  expect(decide(running({ max: 3 }), facts({ judge: cont() })).kind).toBe('relaunch')
})

test('guard limit (D17): needs the command run, reached caps with command and tail, not reached goes on', () => {
  const s = running({ stop: 'du -s out' })
  expect(decide(s, facts({ judge: cont() }))).toMatchObject({ kind: 'need-limit-check' })
  const hit = decide(s, facts({ judge: cont(), limit: { reached: true, tail: '9 MB' } }))
  expect(hit).toMatchObject({ kind: 'finish', status: 'capped', text: 'tack stopped: limit reached (du -s out)\n9 MB' })
  expect(decide(s, facts({ judge: cont(), limit: { reached: false, tail: '' } })).kind).toBe('relaunch')
})

test('guard limit: max is checked first (no command run), a broken command warns instead of stopping', () => {
  expect(decide(running({ stop: 'x', max: 2 }), facts({ judge: cont() }))).toMatchObject({ kind: 'finish', text: 'tack stopped: max 2 iterations reached' })
  const d = decide(running({ stop: 'x' }), facts({ judge: cont(), limit: { reached: false, tail: '', error: 'timed out' } }))
  expect(d).toMatchObject({ kind: 'relaunch' })
  expect(d.kind === 'relaunch' && d.warn).toContain('timed out')
})

test('guard limit: stop command failures count in a row, third pauses, a clean run resets', () => {
  const s = running({ stop: 'du -s out' })
  const bad = { reached: false, tail: '', error: 'timed out' }
  const d1 = decide(s, facts({ judge: cont(), limit: bad }))
  expect(d1).toMatchObject({ kind: 'relaunch' })
  expect(d1.counters.stopErrors).toBe(1)
  const d2 = decide(s, facts({ judge: cont(), limit: bad, counters: d1.counters }))
  expect(d2.kind).toBe('relaunch')
  expect(d2.counters.stopErrors).toBe(2)
  const d3 = decide(s, facts({ judge: cont(), limit: bad, counters: d2.counters }))
  expect(d3).toMatchObject({ kind: 'pause', reason: 'stop-errors' })
  expect(d3.kind === 'pause' && d3.detail).toContain('timed out')
  expect(d3.kind === 'pause' && d3.detail).toContain('du -s out')
  const clean = decide(s, facts({ judge: cont('another reason'), limit: { reached: false, tail: '' }, counters: d2.counters }))
  expect(clean.kind).toBe('relaunch')
  expect(clean.counters.stopErrors).toBe(0)
  expect(decide(s, facts({ judge: cont(), limit: { reached: true, tail: 'x' }, counters: d2.counters })).counters.stopErrors).toBe(0)
  expect(settle(s, d3)).toMatchObject({ status: 'paused', pauseReason: 'stop-errors' })
})

test('guard limit: a judge error also goes through the limit and max guards', () => {
  const err = { ok: false as const, cause: 'api-error' }
  expect(decide(running({ stop: 'x' }), facts({ judge: err }))).toMatchObject({ kind: 'need-limit-check' })
  expect(decide(running({ stop: 'x' }), facts({ judge: err, limit: { reached: true, tail: '' } }))).toMatchObject({ kind: 'finish', status: 'capped' })
  expect(decide(running({ max: 2 }), facts({ judge: err }))).toMatchObject({ kind: 'finish', status: 'capped' })
})

test('guard hours: pauses once now - set_at >= hours', () => {
  const s = running({ hours: 2 })
  expect(decide(s, facts({ judge: cont(), now: T0 + 2 * 3_600_000 - 1 })).kind).toBe('relaunch')
  expect(decide(s, facts({ judge: cont(), now: T0 + 2 * 3_600_000 })).kind).toBe('pause')
  expect(decide(s, facts({ judge: cont(), now: T0 + 3 * 3_600_000 }))).toMatchObject({ reason: 'hours' })
  expect(decide(running(), facts({ judge: cont(), now: T0 + 1e12 })).kind).toBe('relaunch')
})

test('guard stall: three identical normalized reasons pause, a different one resets the run', () => {
  const s = running()
  let c: Counters = freshCounters()
  const step = (reason: string) => {
    const d = decide(s, facts({ judge: cont(reason), counters: c }))
    c = d.counters
    return d
  }
  expect(step('Tests  FAILING').kind).toBe('relaunch')
  expect(step('tests failing').kind).toBe('relaunch')
  expect(step('tests failing 2').kind).toBe('relaunch')
  expect(step('tests failing 2').kind).toBe('relaunch')
  const d = step('Tests failing 2 ')
  expect(d).toMatchObject({ kind: 'pause', reason: 'stalled' })
  expect(d.counters.stallHashes).toHaveLength(3)
})

test('guard stall: judge errors never feed it; check outputs hash like reasons', () => {
  const err = { ok: false as const, cause: 'empty-reply' }
  const d = decide(running(), facts({ judge: err, counters: { judgeErrors: 0, stallHashes: ['a', 'b'], resetFailures: 0, stopErrors: 0 } }))
  expect(d.counters.stallHashes).toEqual(['a', 'b'])
  const f = { ok: true as const, verdict: 'continue' as const, reason: 'check failed (exit 1): boom', source: 'check' as const }
  let c = freshCounters()
  let last = decide(running({ check: 'x' }), facts({ judge: f, counters: c }))
  for (let n = 0; n < 2; n++) last = decide(running({ check: 'x' }), facts({ judge: f, counters: last.counters }))
  expect(last).toMatchObject({ kind: 'pause', reason: 'stalled' })
})

test('guard judge errors: relaunch with the unavailable reason, third in a row pauses, a verdict resets', () => {
  const err = { ok: false as const, cause: 'api-error' }
  const d1 = decide(running(), facts({ judge: err }))
  expect(d1).toMatchObject({ kind: 'relaunch', reason: 'judge unavailable (api-error), continue toward the goal' })
  expect(d1.counters.judgeErrors).toBe(1)
  const d2 = decide(running(), facts({ judge: err, counters: d1.counters }))
  expect(d2.counters.judgeErrors).toBe(2)
  expect(d2.kind).toBe('relaunch')
  expect(decide(running(), facts({ judge: err, counters: d2.counters }))).toMatchObject({ kind: 'pause', reason: 'judge-errors', detail: 'api-error' })
  expect(decide(running(), facts({ judge: cont(), counters: d2.counters })).counters.judgeErrors).toBe(0)
})

test('D9 human priority: a human prompt during the judge defers, the loop resumes at the end of that turn', () => {
  expect(decide(running(), facts({ judge: cont(), humanSeqAtEnd: 1, humanSeqNow: 2 }))).toMatchObject({ kind: 'defer', why: 'human' })
  expect(decide(running(), facts({ judge: cont(), humanSeqAtEnd: 2, humanSeqNow: 2 })).kind).toBe('relaunch')
})

test('D9: a human-origin turn is just an iteration: judged, and met ends the loop (O2 = A)', () => {
  const s = recordTurn(running(), { tokens: 10, counted: false })
  expect(s.iteration).toBe(3)
  const d = decide(s, facts({ judge: { ok: true, verdict: 'met', reason: 'done by hand', source: 'judge' } }))
  expect(d).toMatchObject({ kind: 'finish', status: 'met' })
})

test('reset (5.4): at hardAt with a stream; callPack false when pack is already busy', () => {
  const f = facts({ judge: cont(), fill: { tokens: 150_000, hardAt: 140_000 } })
  expect(decide(running(), f)).toMatchObject({ kind: 'reset', callPack: true, reason: 'fix the failing test' })
  expect(decide(running(), { ...f, packBusy: true })).toMatchObject({ kind: 'reset', callPack: false })
  expect(decide(running(), { ...f, fill: { tokens: 139_999, hardAt: 140_000 } }).kind).toBe('relaunch')
})

test('reset: no stream pauses with advice (D14), three failed resets pause', () => {
  const f = facts({ judge: cont(), fill: { tokens: 9, hardAt: 5 } })
  expect(decide(running({ stream: '' }), f)).toMatchObject({ kind: 'pause', reason: 'no-stream', detail: 'no stream: /pack save <name> then /tack resume' })
  expect(decide(running(), { ...f, counters: { ...freshCounters(), resetFailures: 2 } }).kind).toBe('reset')
  expect(decide(running(), { ...f, counters: { ...freshCounters(), resetFailures: 3 } })).toMatchObject({ kind: 'pause', reason: 'reset-failed' })
})

test('pack busy without a reset: defer, no relaunch (the re-inject is the iteration)', () => {
  expect(decide(running(), facts({ judge: cont(), packBusy: true }))).toMatchObject({ kind: 'defer', why: 'pack-busy' })
})

test('decide never mutates its inputs and returns fresh counters', () => {
  const c = freshCounters()
  const s = running()
  const snapshot = JSON.stringify([s, c])
  const d = decide(s, facts({ judge: cont(), counters: c }))
  expect(JSON.stringify([s, c])).toBe(snapshot)
  expect(d.counters).not.toBe(c)
  expect(d.counters.stallHashes).not.toBe(c.stallHashes)
})

test('hashText: stable and discriminating', () => {
  expect(hashText('a')).toBe(hashText('a'))
  expect(hashText('a')).not.toBe(hashText('b'))
  expect(hashText('')).toBe('811c9dc5')
  expect(hashText('a')).toBe('e40c292c')
})

// ── transitions ─────────────────────────────────────────────────────────────

test('recordTurn: usage is summed; an iteration not started by tack is counted here', () => {
  const s = running({ tokens: 100 })
  expect(recordTurn(s, { tokens: 50, counted: true })).toMatchObject({ tokens: 150, iteration: 2 })
  expect(recordTurn(s, { tokens: 50, counted: false })).toMatchObject({ tokens: 150, iteration: 3 })
  expect(recordTurn(s, { tokens: -5, counted: true }).tokens).toBe(100)
})

test('recordVerdict: note is the answer tail on one line, lists are capped newest first', () => {
  let s = running()
  for (let n = 1; n <= 25; n++) s = recordVerdict({ ...s, iteration: n }, T0 + n * 60_000, `line a\n  line b ${'z'.repeat(700)}`, cont(`r${n}`))
  expect(s.progress).toHaveLength(5)
  expect(s.progress.map(p => p.i)).toEqual([25, 24, 23, 22, 21])
  expect(s.verdicts).toHaveLength(20)
  expect(s.verdicts[0]).toEqual({ i: 25, verdict: 'continue', source: 'judge', reason: 'r25' })
  expect(s.progress[0]!.text.length).toBe(600)
  expect(s.progress[0]!.text).not.toContain('\n')
  expect(s.progress[0]!.at).toBe('2026-10-08T21:55Z')
  expect(s).toMatchObject({ lastVerdict: 'continue', lastReason: 'r25' })
  expect(parseState(renderState(s))).toEqual(s)
})

test('recordVerdict: a judge error is logged as error/code with its cause; empty answer is marked', () => {
  const s = recordVerdict(running(), T0, '  \n ', { ok: false, cause: 'api-error' })
  expect(s).toMatchObject({ lastVerdict: 'error', lastReason: 'api-error' })
  expect(s.verdicts[0]).toMatchObject({ verdict: 'error', source: 'code', reason: 'api-error' })
  expect(s.progress[0]!.text).toBe('(empty answer)')
})

test('settle: pause and finish set the status, relaunch and reset open the next iteration', () => {
  const s = running({ stream: 'stoa' })
  const c = freshCounters()
  expect(settle(s, { kind: 'pause', reason: 'stalled', detail: '', counters: c })).toMatchObject({ status: 'paused', pauseReason: 'stalled' })
  expect(settle(s, { kind: 'finish', status: 'met', reason: '', text: '', counters: c })).toMatchObject({ status: 'met', pauseReason: '' })
  expect(settle(s, { kind: 'relaunch', reason: '', counters: c })).toMatchObject({ iteration: 3, resets: 0, status: 'active' })
  expect(settle(s, { kind: 'reset', callPack: true, reason: '', counters: c })).toMatchObject({ iteration: 3, resets: 1 })
  expect(settle(s, { kind: 'defer', why: 'human', counters: c })).toBe(s)
  expect(settle(s, { kind: 'need-judge', via: 'haiku', counters: c })).toBe(s)
})

test('full pass: a check-driven loop reaches met through the three phases', () => {
  let s = recordTurn(base({ check: 'test -f done.txt', iteration: 1 }), { tokens: 10, counted: true })
  const f0 = facts()
  expect(decide(s, f0)).toMatchObject({ kind: 'need-judge', via: 'check' })
  const j = judgeFromCheck('test -f done.txt', { code: 1, output: 'nope' })
  s = recordVerdict(s, f0.now, f0.answer, j)
  const d = decide(s, { ...f0, judge: j })
  expect(d).toMatchObject({ kind: 'relaunch', reason: 'check failed (exit 1): nope' })
  s = settle(s, d)
  expect(s.iteration).toBe(2)
  expect(iterPrompt(s, d.kind === 'relaunch' ? d.reason : '')).toContain('tack iteration 2/20')
  const ok = judgeFromCheck('test -f done.txt', { code: 0, output: '' })
  s = settle(recordTurn(s, { tokens: 5, counted: true }), decide(s, { ...f0, judge: ok }))
  expect(s.status).toBe('met')
})

// ── control commands and texts ──────────────────────────────────────────────

test('control: pause, resume, clear on every state', () => {
  const active = running()
  expect(applyControl('pause', active)).toMatchObject({ state: { status: 'paused', pauseReason: 'human' }, relaunch: false })
  const paused = { ...active, status: 'paused' as const, pauseReason: 'blocked' as const }
  expect(applyControl('pause', paused).text).toContain('already paused')
  const r = applyControl('resume', paused)
  expect(r).toMatchObject({ state: { status: 'active', pauseReason: '' }, relaunch: true })
  expect(r.text).toBe('tack: resumed (iteration 3/20).')
  expect(applyControl('resume', active)).toMatchObject({ state: active, relaunch: false, text: 'tack: nothing to resume.' })
  expect(applyControl('clear', paused)).toMatchObject({ state: { status: 'cleared' } })
  expect(applyControl('clear', active).text).toBe('tack: goal cleared.')
  for (const k of ['pause', 'clear', 'resume'] as const) {
    expect(applyControl(k, null).state).toBeNull()
    expect(applyControl(k, null).relaunch).toBe(false)
  }
  expect(applyControl('pause', null).text).toBe('tack: no active goal.')
  expect(applyControl('clear', { ...active, status: 'met' }).text).toBe('tack: no active goal.')
  expect(applyControl('resume', { ...active, status: 'capped' }).text).toBe('tack: nothing to resume.')
})

test('control: resuming from an hours pause lifts the cap so it does not pause again at once', () => {
  const s = running({ hours: 1, status: 'paused', pauseReason: 'hours' })
  const r = applyControl('resume', s)
  expect(r.state).toMatchObject({ status: 'active', hours: 0 })
  expect(r.text).toContain('wall-clock cap removed')
})

test('texts: arm reply, status text, status segment', () => {
  const s = base({ check: 'npm test', stop: 'du -s .', hours: 2, max: 9 })
  expect(armReply(s)).toBe('tack: goal set (max 9 iterations, check: npm test, stop: du -s ., hours: 2). Iteration 1 starts now. /tack pause to hold, /tack clear to stop.')
  expect(armReply(base())).toBe('tack: goal set (max 20 iterations). Iteration 1 starts now. /tack pause to hold, /tack clear to stop.')
  expect(statusText(null)).toBe(`tack: no goal. ${USAGE}`)
  const t = statusText({ ...s, status: 'paused', pauseReason: 'stalled', iteration: 4, lastVerdict: 'continue', lastReason: 'a\nb' })
  expect(t.split('\n')).toEqual([
    'tack: paused (stalled) — iteration 4/9, resets 0, tokens 0',
    'goal: all tests pass',
    'check: npm test',
    'stop: du -s .',
    'hours: 2',
    'last: continue — a b',
  ])
  expect(statusSegment(null)).toBe('')
  expect(statusSegment({ ...s, iteration: 3 })).toBe('tack 3/9')
  expect(statusSegment({ ...s, status: 'paused', pauseReason: 'blocked' })).toBe('tack paused: blocked')
  expect(statusSegment({ ...s, status: 'met' })).toBe('tack met')
  expect(statusSegment({ ...s, status: 'cleared' })).toBe('')
})
