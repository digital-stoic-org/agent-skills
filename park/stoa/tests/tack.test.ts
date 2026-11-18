import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { AgentInfo, On } from 'claude-code'
import { newGoal, parseCommand, renderState } from '../hooks/tack-core.ts'
import type { TackState } from '../hooks/tack-core.ts'

const CWD = '/work'
const FILE = 'tack-llm.md'
const STORE = `tack:state:${CWD}`

type Run = { exitCode: number; stdout?: string; stderr?: string } | 'spawn-fails'
type Judged = string | 'api-error'

type World = {
  submits: string[]
  toasts: string[]
  store: Map<string, unknown>
  files: Map<string, string>
  procs: string[]
  // what the shell command `cmd` exits with; default: exit 1
  run: (cmd: string) => Run
  // answers of the next $.model.complete calls, in order
  judged: Judged[]
  judgeCalls: number
  // holds each $.model.complete until released
  gate: Promise<void> | null
  agents: AgentInfo[]
  submitFails: boolean
  clock: { advance: (ms: number) => Promise<void> }
}

// The engine resolves a relative path against the session cwd: key the files by their last segment.
const base = (path: string) => path.slice(path.lastIndexOf('/') + 1)

// Stubs the engine beneath the plugin (the pack and keel hooks are registered too: they find nothing to do without a stream or a chantier).
function world(on: On, now = 1_000_000): World {
  const w: World = {
    submits: [],
    toasts: [],
    store: new Map(),
    files: new Map(),
    procs: [],
    run: () => ({ exitCode: 1 }),
    judged: [],
    judgeCalls: 0,
    gate: null,
    agents: [],
    submitFails: false,
    clock: { advance: async () => undefined },
  }
  on('store.get', (_$, e) => ({ value: w.store.get(e.key) }))
  on('store.set', (_$, e) => (w.store.set(e.key, e.value), { value: undefined }))
  on('store.delete', (_$, e) => (w.store.delete(e.key), { value: undefined }))
  w.clock = mock.clock(on, { now })
  on('session.cwd', () => ({ value: CWD }))
  on('session.id', () => ({ value: 'sess-1' }))
  on('agent.list', () => ({ value: w.agents }))
  on('fs.exists', (_$, e) => ({ value: w.files.has(base(e.path)) }))
  on('fs.read', (_$, e) => {
    const text = w.files.get(base(e.path))
    return text === undefined ? { deny: 'ENOENT' } : { value: text }
  })
  on('fs.stat', (_$, e) => {
    const text = w.files.get(base(e.path))
    return text === undefined ? { deny: 'ENOENT' } : { value: { kind: 'file', size: text.length, mtimeMs: 0, isLink: false } }
  })
  on('fs.write', async (_$, e) => {
    // a write takes real time: the 1 ms timer of a submit scheduled before it fires while the command hook is still pending
    if (commandPending) await w.clock.advance(2)
    w.files.set(base(e.path), e.text)
    return { value: undefined }
  })
  on('process.run', (_$, e) => {
    const cmd = e.argv[e.argv.length - 1] as string
    w.procs.push(cmd)
    const r = w.run(cmd)
    if (r === 'spawn-fails') return { deny: 'spawn failed' }
    return { value: { exitCode: r.exitCode, stdout: r.stdout ?? '', stderr: r.stderr ?? '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('model.complete', async () => {
    w.judgeCalls++
    if (w.gate) await w.gate
    const next = w.judged.shift() ?? 'api-error'
    if (next === 'api-error') return { value: { isAnswered: false, reason: 'api-error', status: 529 } } as never
    return { value: { isAnswered: true, text: next, usage: { input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } } } as never
  })
  on('ui.toast', (_$, e) => (w.toasts.push(e.text), { value: undefined }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  on('turn.start', (_$, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_$, e) => ({ text: e.answer }))
  on('session.measure', (_$, e) => ({ changed: e.changed }))
  on('prompt.submit', (_$, e) => {
    // host rule (live-verified): a submit from a command.run hook still pending would wait on the turn the hook holds
    if (commandPending) throw new Error('prompt.submit: called from a command.run hook, it would wait on the turn this hook is holding')
    if (w.submitFails) throw new Error('host refuses')
    w.submits.push(e.text)
    return { text: e.text }
  })
  return w
}

let commandPending = false
const tack = async ($: Engine, args = '', origin: { kind: string; name?: string } = { kind: 'composer' }) => {
  commandPending = true
  try {
    return (await $.command.run({ command: 'tack', args, origin, presentation: { isFullscreen: false, columns: 120 } } as never)) as { text?: string }
  } finally {
    commandPending = false
  }
}

const USAGE = { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, model: 'm' }
const complete = ($: Engine, answer: string, extra: Record<string, unknown> = {}) =>
  $.turn.complete({ answer, durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer', usage: USAGE, ...extra } as never)

// The turn-end work is detached from the hook: wait for its effect, moving the mock clock so a clock.after(1) fires.
const until = async (w: World, done: () => boolean) => {
  for (let i = 0; i < 200 && !done(); i++) {
    await new Promise(r => setTimeout(r, 5))
    await w.clock.advance(2)
  }
}
// Time for detached work that must NOT act.
const quiet = async (w: World) => {
  for (let i = 0; i < 8; i++) {
    await new Promise(r => setTimeout(r, 5))
    await w.clock.advance(2)
  }
}

const state = (w: World) => w.files.get(FILE) ?? ''
const field = (w: World, key: string) => new RegExp(`^${key}: (.*)$`, 'm').exec(state(w))?.[1]

// An active goal as the state file would hold it.
const goalOf = (args: string, over: Partial<TackState> = {}): TackState => {
  const cmd = parseCommand(args, { kind: 'composer' })
  if (cmd.kind !== 'set') throw new Error('not a goal')
  return { ...newGoal(cmd, '', 1_000_000), iteration: 1, ...over }
}

/** Arms a goal and lets the first iteration prompt go out. */
async function armed($: Engine, w: World, args: string) {
  const out = await tack($, args)
  await until(w, () => w.submits.length === 1)
  return out
}

// ---------- /tack: arming and control ----------

test('no goal: /tack answers with the usage', async ($, on) => {
  world(on)
  const out = await tack($)
  expect(out.text).toContain('tack: no goal.')
  expect(out.text).toContain('Usage: /tack')
})

test('set: reply, state file + store backup, first iteration prompt once', async ($, on) => {
  const w = world(on)
  const out = await tack($, '--max 5 make the tests pass')
  expect(out.text).toBe('tack: goal set (max 5 iterations). Iteration 1 starts now. /tack pause to hold, /tack clear to stop.')
  await until(w, () => w.submits.length === 1)
  expect(w.submits[0]).toContain('tack goal (iteration 1/5):\nmake the tests pass\n')
  expect(field(w, 'status')).toBe('active')
  expect(field(w, 'iteration')).toBe('1')
  expect(state(w)).toContain('make the tests pass')
  expect(w.store.get(STORE)).toBe(state(w))
  await quiet(w)
  expect(w.submits).toHaveLength(1)
})

test('D15: --check and --stop are refused from a plugin origin, nothing is set', async ($, on) => {
  const w = world(on)
  const out = await tack($, '--check "true" do it', { kind: 'plugin', name: 'other' })
  expect(out.text).toContain('accepted only from a person')
  await quiet(w)
  expect(w.submits).toHaveLength(0)
  expect(w.files.has(FILE)).toBe(false)
})

test('a usage error sets nothing', async ($, on) => {
  const w = world(on)
  expect((await tack($, '--max')).text).toContain('--max needs a value')
  await quiet(w)
  expect(w.submits).toHaveLength(0)
  expect(w.files.has(FILE)).toBe(false)
})

test('pause holds a turn end; resume starts the next iteration at once; clear ends it', async ($, on) => {
  const w = world(on)
  await armed($, w, 'ship it')
  expect((await tack($, 'pause')).text).toBe('tack paused. /tack resume to continue.')
  expect(field(w, 'status')).toBe('paused')
  expect(field(w, 'pause_reason')).toBe('"human"')
  await complete($, 'did a bit')
  await quiet(w)
  expect(w.judgeCalls).toBe(0)
  expect(w.submits).toHaveLength(1)
  expect((await tack($, 'resume')).text).toBe('tack: resumed (iteration 2/20).')
  await until(w, () => w.submits.length === 2)
  expect(w.submits[1]).toContain('tack iteration 2/20 — goal: ship it')
  expect(field(w, 'status')).toBe('active')
  expect((await tack($, 'clear')).text).toBe('tack: goal cleared.')
  expect(field(w, 'status')).toBe('cleared')
  await complete($, 'more')
  await quiet(w)
  expect(w.submits).toHaveLength(2)
})

test('clear during the judge drops the relaunch', async ($, on) => {
  const w = world(on)
  await armed($, w, 'ship it')
  let release: () => void = () => undefined
  w.gate = new Promise<void>(r => (release = r))
  w.judged.push('{"verdict":"continue","reason":"tests missing"}')
  await complete($, 'wrote code')
  await until(w, () => w.judgeCalls === 1)
  await tack($, 'clear')
  release()
  await quiet(w)
  expect(w.submits).toHaveLength(1)
  expect(field(w, 'status')).toBe('cleared')
})

// ---------- the loop with a check command ----------

test('check passes: goal met, file says so, no more prompt', async ($, on) => {
  const w = world(on)
  w.run = cmd => (cmd === 'test -f done.txt' ? { exitCode: 0 } : { exitCode: 1 })
  await armed($, w, '--check "test -f done.txt" create done.txt')
  await complete($, 'created done.txt')
  await until(w, () => field(w, 'status') === 'met')
  expect(w.procs).toEqual(['test -f done.txt'])
  expect(w.judgeCalls).toBe(0)
  expect(w.toasts.at(-1)).toBe('tack: goal met after 1 iteration(s) — check passed: test -f done.txt')
  expect(field(w, 'last_verdict')).toBe('met')
  expect(field(w, 'tokens')).toBe('15')
  expect(state(w)).toMatch(/- i1 \S+ met — created done\.txt/)
  await quiet(w)
  expect(w.submits).toHaveLength(1)
})

test('check fails: next iteration prompt carries the output, counted once', async ($, on) => {
  const w = world(on)
  w.run = () => ({ exitCode: 2, stdout: '1 test failing' })
  await armed($, w, '--check "npm test" fix the build')
  await complete($, 'tried')
  await until(w, () => w.submits.length === 2)
  expect(w.submits[1]).toBe('tack iteration 2/20 — goal: fix the build\nNot met yet: check failed (exit 2): 1 test failing\nContinue. End with your closing note; tack: blocked — <need> if you need me.')
  expect(field(w, 'iteration')).toBe('2')
  expect(field(w, 'last_verdict')).toBe('continue')
  // the tack-started turn is not counted again
  w.run = () => ({ exitCode: 2, stdout: '0 test failing?' })
  await complete($, 'tried again')
  await until(w, () => w.submits.length === 3)
  expect(field(w, 'iteration')).toBe('3')
})

test('three identical check outputs: stalled', async ($, on) => {
  const w = world(on)
  w.run = () => ({ exitCode: 1, stdout: 'same failure' })
  await armed($, w, '--check "npm test" fix it')
  for (let i = 1; i <= 2; i++) {
    await complete($, `try ${i}`)
    await until(w, () => w.submits.length === i + 1)
  }
  await complete($, 'try 3')
  await until(w, () => field(w, 'status') === 'paused')
  expect(field(w, 'pause_reason')).toBe('"stalled"')
  expect(w.toasts.at(-1)).toContain('tack paused: stalled')
  expect(w.submits).toHaveLength(3)
})

test('--max: the cap ends the loop, the check is not rerun beyond it', async ($, on) => {
  const w = world(on)
  await armed($, w, '--max 1 --check "npm test" fix it')
  await complete($, 'tried')
  await until(w, () => field(w, 'status') === 'capped')
  expect(w.toasts.at(-1)).toBe('tack stopped: max 1 iterations reached')
  await quiet(w)
  expect(w.submits).toHaveLength(1)
})

test('--stop: a limit command that exits 0 ends the loop with its output', async ($, on) => {
  const w = world(on)
  w.run = cmd => (cmd === 'du -s out' ? { exitCode: 0, stdout: '999 out' } : { exitCode: 1 })
  await armed($, w, '--stop "du -s out" --check "npm test" fix it')
  await complete($, 'tried')
  await until(w, () => field(w, 'status') === 'capped')
  expect(w.procs).toEqual(['npm test', 'du -s out'])
  expect(w.toasts.at(-1)).toBe('tack stopped: limit reached (du -s out)\n999 out')
  await quiet(w)
  expect(w.submits).toHaveLength(1)
})

test('--stop below the limit: the loop goes on; 3 failures to run: pause stop-errors', async ($, on) => {
  const w = world(on)
  w.run = cmd => (cmd === 'du -s out' ? 'spawn-fails' : { exitCode: 1, stdout: `run ${w.procs.length}` })
  await armed($, w, '--stop "du -s out" --check "npm test" fix it')
  for (let i = 1; i <= 2; i++) {
    await complete($, `try ${i}`)
    await until(w, () => w.submits.length === i + 1)
    expect(w.toasts.at(-1)).toContain('--stop command failed to run')
  }
  await complete($, 'try 3')
  await until(w, () => field(w, 'status') === 'paused')
  expect(field(w, 'pause_reason')).toBe('"stop-errors"')
})

test('check that cannot run: judge error, relaunch, 3 in a row pause', async ($, on) => {
  const w = world(on)
  w.run = () => 'spawn-fails'
  await armed($, w, '--check "npm test" fix it')
  for (let i = 1; i <= 2; i++) {
    await complete($, `try ${i}`)
    await until(w, () => w.submits.length === i + 1)
    expect(w.submits[i]).toContain('judge unavailable (check')
    expect(field(w, 'last_verdict')).toBe('error')
  }
  await complete($, 'try 3')
  await until(w, () => field(w, 'status') === 'paused')
  expect(field(w, 'pause_reason')).toBe('"judge-errors"')
})

// ---------- the Haiku judge ----------

test('judge continue then met: reason goes into the next prompt, goal ends met', async ($, on) => {
  const w = world(on)
  await armed($, w, 'write the report')
  w.judged.push('{"verdict":"continue","reason":"section 2 is missing"}')
  await complete($, 'wrote section 1')
  await until(w, () => w.submits.length === 2)
  expect(w.submits[1]).toContain('Not met yet: section 2 is missing')
  expect(w.judgeCalls).toBe(1)
  w.judged.push('{"verdict":"met","reason":"both sections are in the answer"}')
  await complete($, 'wrote section 2')
  await until(w, () => field(w, 'status') === 'met')
  expect(w.toasts.at(-1)).toBe('tack: goal met after 2 iteration(s) — both sections are in the answer')
  expect(state(w)).toContain('- i2 met judge "both sections are in the answer"')
})

test('judge impossible ends the loop; judge blocked pauses it', async ($, on) => {
  const w = world(on)
  await armed($, w, 'do it')
  w.judged.push('{"verdict":"impossible","reason":"contradictory"}')
  await complete($, 'cannot')
  await until(w, () => field(w, 'status') === 'impossible')
  expect(w.toasts.at(-1)).toBe('tack: goal judged impossible — contradictory')
  await tack($, 'do it again')
  await until(w, () => w.submits.length === 2)
  w.judged.push('{"verdict":"blocked","reason":"needs the API key"}')
  await complete($, 'stuck')
  await until(w, () => field(w, 'status') === 'paused')
  expect(field(w, 'pause_reason')).toBe('"blocked"')
  expect(w.toasts.at(-1)).toBe('tack paused: blocked — needs the API key. /tack resume to continue')
})

test('judge errors: relaunch with a note, never cleared, 3 in a row pause', async ($, on) => {
  const w = world(on)
  await armed($, w, 'write the report')
  w.judged.push('not json at all', 'api-error')
  await complete($, 'one')
  await until(w, () => w.submits.length === 2)
  expect(w.submits[1]).toContain('judge unavailable (judge reply has no JSON block), continue toward the goal')
  await complete($, 'two')
  await until(w, () => w.submits.length === 3)
  expect(w.submits[2]).toContain('judge unavailable (judge not answered (api-error))')
  await complete($, 'three')
  await until(w, () => field(w, 'status') === 'paused')
  expect(field(w, 'pause_reason')).toBe('"judge-errors"')
  expect(w.submits).toHaveLength(3)
})

// ---------- turn-end rules ----------

test('a line "tack: blocked — need" pauses without calling the judge', async ($, on) => {
  const w = world(on)
  await armed($, w, 'deploy')
  await complete($, 'Tried everything.\ntack: blocked — need the prod credentials')
  await until(w, () => field(w, 'status') === 'paused')
  expect(w.judgeCalls).toBe(0)
  expect(w.toasts.at(-1)).toBe('tack paused: blocked — need the prod credentials. /tack resume to continue')
  expect(state(w)).toContain('blocked — Tried everything. tack: blocked — need the prod credentials')
})

test('Esc (isAborted) pauses with interrupted', async ($, on) => {
  const w = world(on)
  await armed($, w, 'deploy')
  await complete($, '', { isAborted: true, reason: 'aborted', usage: undefined })
  await until(w, () => field(w, 'status') === 'paused')
  expect(field(w, 'pause_reason')).toBe('"interrupted"')
  expect(w.judgeCalls).toBe(0)
})

test('a background agent\'s own turn.complete is ignored', async ($, on) => {
  const w = world(on)
  await armed($, w, 'deploy')
  await complete($, 'agent report', { agentId: 'af34' })
  await quiet(w)
  expect(w.judgeCalls).toBe(0)
  expect(w.submits).toHaveLength(1)
  expect(field(w, 'iteration')).toBe('1')
})

test('live agents: no judge, no relaunch; the next main turn end is judged', async ($, on) => {
  const w = world(on)
  await armed($, w, 'deploy')
  w.agents = [{ id: 'a1', description: 'writer', type: 'general-purpose', status: 'running' } as AgentInfo]
  await complete($, 'started an agent')
  await until(w, () => w.toasts.some(t => t.startsWith('tack: waiting on 1 agent')))
  expect(w.judgeCalls).toBe(0)
  expect(w.submits).toHaveLength(1)
  w.agents = [{ id: 'a1', description: 'writer', type: 'general-purpose', status: 'idle' } as AgentInfo]
  w.judged.push('{"verdict":"continue","reason":"agent output not merged"}')
  await complete($, 'agent handed back')
  await until(w, () => w.submits.length === 2)
  expect(w.submits[1]).toContain('Not met yet: agent output not merged')
})

test('a turn that ended with an error is not judged and not relaunched', async ($, on) => {
  const w = world(on)
  await armed($, w, 'deploy')
  await complete($, '', { reason: 'error' })
  await until(w, () => w.toasts.some(t => t.includes('turn ended with error')))
  expect(w.judgeCalls).toBe(0)
  await quiet(w)
  expect(w.submits).toHaveLength(1)
})

test('D9: a person\'s prompt during the judge defers the relaunch; its turn is judged and counted', async ($, on) => {
  const w = world(on)
  await armed($, w, 'write the report')
  let release: () => void = () => undefined
  w.gate = new Promise<void>(r => (release = r))
  w.judged.push('{"verdict":"continue","reason":"section 2 is missing"}')
  await complete($, 'wrote section 1')
  await until(w, () => w.judgeCalls === 1)
  await $.prompt.submit({ text: 'wait, use French', origin: { kind: 'composer' } } as never)
  release()
  await quiet(w)
  expect(w.submits).toHaveLength(2) // the person's own prompt only; tack did not relaunch
  expect(w.submits[1]).toBe('wait, use French')
  expect(field(w, 'iteration')).toBe('1')
  // the person's turn is judged and counts as an iteration (O2 = A)
  w.gate = null
  w.judged.push('{"verdict":"continue","reason":"still no section 2"}')
  await complete($, 'in French now')
  await until(w, () => w.submits.length === 3)
  expect(w.submits[2]).toContain('tack iteration 3/20')
  expect(field(w, 'iteration')).toBe('3')
})

test('a peer\'s prompt does not preempt: its turn is an ordinary iteration', async ($, on) => {
  const w = world(on)
  await armed($, w, 'write the report')
  let release: () => void = () => undefined
  w.gate = new Promise<void>(r => (release = r))
  w.judged.push('{"verdict":"continue","reason":"section 2 is missing"}')
  await complete($, 'wrote section 1')
  await until(w, () => w.judgeCalls === 1)
  await $.prompt.submit({ text: 'agent hand-back', origin: { kind: 'peer' } } as never)
  release()
  await until(w, () => w.submits.length === 3)
  expect(w.submits[2]).toContain('tack iteration 2/20')
})

test('a submit the host refuses pauses with submit-failed and keeps the iteration number', async ($, on) => {
  const w = world(on)
  await armed($, w, '--check "npm test" fix it')
  w.submitFails = true
  await complete($, 'tried')
  await until(w, () => field(w, 'status') === 'paused')
  expect(field(w, 'pause_reason')).toBe('"submit-failed"')
  expect(field(w, 'iteration')).toBe('1')
  expect(w.toasts.at(-1)).toContain('tack paused: submit-failed')
  w.submitFails = false
  await tack($, 'resume')
  await until(w, () => w.submits.length === 2)
  expect(w.submits[1]).toContain('tack iteration 2/20')
})

// ---------- reload ----------

test('an active goal found on disk comes back paused, never resumed by itself', async ($, on) => {
  const w = world(on)
  w.files.set(FILE, renderState(goalOf('--check "npm test" fix it')))
  await complete($, 'an unrelated turn')
  await until(w, () => w.toasts.some(t => t.includes('found an active goal from an earlier run')))
  expect(w.judgeCalls).toBe(0)
  await quiet(w)
  expect(w.submits).toHaveLength(0)
  expect(field(w, 'status')).toBe('paused')
  expect((await tack($)).text).toContain('tack: paused (human) — iteration 1/20')
  expect((await tack($, 'resume')).text).toBe('tack: resumed (iteration 2/20).')
})

test('the $.store copy is the fallback when the file is gone', async ($, on) => {
  const w = world(on)
  w.store.set(STORE, renderState(goalOf('fix it', { status: 'met', lastVerdict: 'met', lastReason: 'done' })))
  const out = await tack($)
  expect(out.text).toContain('tack: met — iteration 1/20')
})
