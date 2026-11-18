// tack: goal loop. The pure half (grammar, state file, prompts, judge parser, guards, `decide`) is tack-core.ts; this file holds every `$` call.
// Spec: SPEC-tack-llm.md §5 (loop), §6 (judge), §7 (guards), §9 (failure policy). T2 = no reset yet (no seam with pack): the core is fed an infinite hardAt.
import type { EngineInterface, On } from 'claude-code'
import {
  CHECK_TIMEOUT_MS,
  JUDGE_SYSTEM,
  JUDGE_TIMEOUT_MS,
  applyControl,
  armReply,
  beginIteration,
  decide,
  firstPrompt,
  freshCounters,
  isHumanOrigin,
  iterPrompt,
  judgeFromCheck,
  judgePrompt,
  limitFromRun,
  newGoal,
  parseCommand,
  parseState,
  parseVerdict,
  pauseText,
  recordTurn,
  recordVerdict,
  renderState,
  settle,
  stateFileName,
  statusText,
  storeKey,
} from './tack-core.ts'
import type { Counters, Decision, JudgeResult, OriginLike, ShellRun, TackState, TurnFacts } from './tack-core.ts'

const ERROR_TOAST_MS = 10_000
// $.agent.list() is raced against this: a hang must not freeze the loop (same guard as pack).
const AGENT_LIST_MS = 5_000
// Agents that still work. `idle` and `waiting` ones may never finish: counting them would stall the loop for good.
const BUSY_AGENT = ['pending', 'running']

// What this file reads of a main `turn.complete`.
interface TurnEnd {
  answer: string
  isAborted: boolean
  reason: string
  usage?: { input_tokens: number; output_tokens: number }
}

// Module scope: survives /clear (module not reloaded), lost on mod reload -> file / $.store backup (ensureLoaded). Re-created by registerTack.
interface Shell {
  goal: TackState | null
  cwd: string
  loading: Promise<void> | null
  humanSeq: number // bumped by each human prompt (D9)
  iterSeq: number // bumped by each turn end and each command that changes the goal: older detached work sees it moved and drops its action
  counted: boolean // tack itself started the turn that is running (its iteration is already counted)
  counters: Counters
  chain: Promise<void> // serialises the state file writes
}
const newShell = (): Shell => ({ goal: null, cwd: '', loading: null, humanSeq: 0, iterSeq: 0, counted: false, counters: freshCounters(), chain: Promise.resolve() })
let M: Shell = newShell()

const NO_STREAM = '' // T2: no pack seam yet, so no stream and no reset (D14); tack-llm.md

// ── small $ helpers (top-level declarations: the validator follows `$` only into these) ──

function notify($: EngineInterface, text: string, timeoutMs?: number): void {
  try {
    $.ui.toast(text, timeoutMs === undefined ? undefined : { timeoutMs })
  } catch {
    // nothing left to do
  }
}

function debugLog($: EngineInterface, text: string): void {
  try {
    $.ui.log(`tack: ${text}`, { to: 'debug' })
  } catch {
    // nothing left to do
  }
}

async function writeState($: EngineInterface, cwd: string, stream: string, text: string): Promise<void> {
  try {
    await $.fs.write(`${cwd}/${stateFileName(stream)}`, text)
  } catch (err) {
    notify($, `tack: could not write ${stateFileName(stream)}: ${String(err)}`, ERROR_TOAST_MS)
  }
  try {
    await $.store.set(storeKey(cwd), text)
  } catch (err) {
    debugLog($, `store backup failed: ${String(err)}`)
  }
}

// Renders the state NOW (so writes land in state order) and writes it in its turn. Never throws.
async function persist($: EngineInterface): Promise<void> {
  const g = M.goal
  if (!g) return
  const text = renderState(g)
  const { cwd } = M
  const prev = M.chain
  let release: () => void = () => undefined
  M.chain = new Promise<void>(resolve => {
    release = resolve
  })
  try {
    await prev
    await writeState($, cwd, g.stream, text)
  } finally {
    release()
  }
}

// First event after a (re)load: the file wins, the $.store copy is the fallback (§4.1). An `active` goal found on disk is NOT resumed on its own: a goal
// left by an earlier run would otherwise judge the next unrelated turn. It comes back paused; /tack resume continues it.
async function load($: EngineInterface): Promise<void> {
  try {
    M.cwd = await $.session.cwd()
    let g: TackState | null = null
    try {
      const path = `${M.cwd}/${stateFileName(NO_STREAM)}`
      if (await $.fs.exists(path)) g = parseState(await $.fs.read(path))
    } catch (err) {
      debugLog($, `state file unreadable: ${String(err)}`)
    }
    if (!g) {
      const kept = await $.store.get(storeKey(M.cwd))
      if (typeof kept === 'string') g = parseState(kept)
    }
    if (g && g.status === 'active') {
      g = { ...g, status: 'paused', pauseReason: 'human' }
      M.goal = g
      notify($, 'tack: found an active goal from an earlier run; it is paused. /tack resume to continue, /tack clear to drop it', ERROR_TOAST_MS)
      await persist($)
    }
    M.goal = g
  } catch (err) {
    debugLog($, `load failed: ${String(err)}`)
  }
}

function ensureLoaded($: EngineInterface): Promise<void> {
  M.loading ??= load($)
  return M.loading
}

async function shell($: EngineInterface, command: string, timeoutMs: number): Promise<ShellRun> {
  try {
    const r = await $.process.run(['/bin/sh', '-c', command], { timeoutMs })
    return { code: r.exitCode, output: r.stderr ? `${r.stdout}\n${r.stderr}` : r.stdout }
  } catch (err) {
    return { code: null, output: '', failure: String(err) }
  }
}

// D10: a failure or a slow list counts as none (the loop must not freeze on it).
async function busyAgents($: EngineInterface): Promise<number> {
  let timer: { cancel: () => void } | null = null
  try {
    const timeout = new Promise<'timeout'>(resolve => {
      timer = $.clock.after(AGENT_LIST_MS, () => resolve('timeout'))
    })
    const listed = await Promise.race([$.agent.list(), timeout])
    if (listed === 'timeout') return 0
    return listed.filter(a => BUSY_AGENT.includes(a.status)).length
  } catch {
    return 0
  } finally {
    ;(timer as { cancel: () => void } | null)?.cancel()
  }
}

// §6: the check command when set, else Haiku. Never throws: a failure is a judge error (the goal is never cleared on one).
async function runJudge($: EngineInterface, g: TackState, answer: string, via: 'check' | 'haiku'): Promise<JudgeResult> {
  if (via === 'check') return judgeFromCheck(g.check, await shell($, g.check, CHECK_TIMEOUT_MS))
  try {
    const r = await $.model.complete({ model: 'haiku', system: JUDGE_SYSTEM, prompt: judgePrompt(g, answer), effort: 'low', timeoutMs: JUDGE_TIMEOUT_MS })
    if (!r.isAnswered) return { ok: false, cause: `judge not answered (${r.reason})` }
    return parseVerdict(r.text)
  } catch (err) {
    return { ok: false, cause: `judge call failed: ${String(err)}` }
  }
}

// ── relaunch (§5.3) ─────────────────────────────────────────────────────────

// The host refuses prompt.submit inside a hook the submit would wait on: it runs from a clock.after dispatch, after the hook returned.
// The goal is re-checked at dispatch: a pause, clear or new goal in between drops the submit.
// ORDERING RULE: from a command.run hook, call this as the last statement before the return, with no await after it.
// The 1 ms timer fires while the hook is still pending otherwise, and the host rejects the submit (live-verified, T2).
function submitLater($: EngineInterface, seq: number, text: string): void {
  M.counted = true
  $.clock.after(1, () => {
    if (M.iterSeq !== seq || M.goal?.status !== 'active') {
      M.counted = false
      return
    }
    $.prompt.submit({ text }).catch(err => {
      submitFailed($, err)
    })
  })
}

// The iteration was already opened by settle / beginIteration: step it back so /tack resume opens the same number again.
function submitFailed($: EngineInterface, err: unknown): void {
  M.counted = false
  const g = M.goal
  if (!g || g.status !== 'active') return
  M.iterSeq += 1
  M.goal = { ...g, status: 'paused', pauseReason: 'submit-failed', iteration: Math.max(0, g.iteration - 1) }
  persist($).catch(() => undefined)
  notify($, pauseText('submit-failed', String(err)), ERROR_TOAST_MS)
}

// ── turn end (§5.2) ─────────────────────────────────────────────────────────

const tokensOf = (u: TurnEnd['usage']): number => (u ? u.input_tokens + u.output_tokens : 0)

// Runs detached from the hook (never awaited by it). Every await is followed by a staleness check; the last `decide` is followed by synchronous work only.
async function onTurnComplete($: EngineInterface, e: TurnEnd): Promise<void> {
  await ensureLoaded($)
  const start = M.goal
  if (!start || start.status !== 'active') return
  const seq = ++M.iterSeq
  const counted = M.counted
  M.counted = false
  const humanSeqAtEnd = M.humanSeq
  const g = recordTurn(start, { tokens: tokensOf(e.usage), counted })
  M.goal = g
  const stale = (): boolean => M.iterSeq !== seq || M.goal?.status !== 'active'

  const liveAgents = await busyAgents($)
  if (stale()) return
  // T2: no seam with pack, so no fill figure and no busy flag (a reset never comes out of decide).
  const facts = async (extra: Partial<TurnFacts>): Promise<TurnFacts> => ({
    now: await $.clock.now(),
    isAborted: e.isAborted,
    reason: e.reason,
    answer: e.answer,
    liveAgents,
    counters: M.counters,
    humanSeqAtEnd,
    humanSeqNow: M.humanSeq,
    packBusy: false,
    fill: { tokens: 0, hardAt: Infinity },
    ...extra,
  })

  let f = await facts({})
  let d: Decision = decide(g, f)
  let j: JudgeResult | undefined
  if (d.kind === 'need-judge') {
    j = await runJudge($, g, e.answer, d.via)
    if (stale()) return
    f = await facts({ judge: j })
    d = decide(g, f)
    if (d.kind === 'need-limit-check') {
      const limit = limitFromRun(await shell($, g.stop, CHECK_TIMEOUT_MS))
      if (stale()) return
      f = await facts({ judge: j, limit })
      d = decide(g, f)
    }
  }
  if (stale()) return

  // From here to the end of the switch: no await before the state is set and the relaunch is scheduled.
  if (!j && d.kind === 'pause' && d.reason === 'blocked') j = { ok: true, verdict: 'blocked', reason: d.detail, source: 'code' }
  const next = settle(j ? recordVerdict(g, f.now, e.answer, j) : g, d)
  M.goal = next
  M.counters = d.counters
  const saved = persist($)
  switch (d.kind) {
    case 'relaunch':
    case 'reset': // not reachable in T2 (hardAt is Infinity); kept as a plain relaunch rather than a dead loop
      if (d.warn) notify($, `tack: ${d.warn}`)
      submitLater($, seq, iterPrompt(next, d.reason))
      break
    case 'pause':
      notify($, pauseText(d.reason, d.detail), ERROR_TOAST_MS)
      break
    case 'finish':
      notify($, d.text, d.status === 'met' ? undefined : ERROR_TOAST_MS)
      break
    case 'wait-agents':
      notify($, `tack: waiting on ${d.n} agent${d.n === 1 ? '' : 's'}; the next turn end is judged`)
      break
    case 'skip':
      notify($, `tack: ${d.why}; no relaunch. The next turn end is judged`, ERROR_TOAST_MS)
      break
    default:
      break // defer (a human prompt came in: its turn is judged next) and noop
  }
  await saved
}

// ── /tack ───────────────────────────────────────────────────────────────────

async function tackCommand($: EngineInterface, args: string, origin: OriginLike): Promise<{ text: string }> {
  await ensureLoaded($)
  const cmd = parseCommand(args, origin)
  if (cmd.kind === 'error') return { text: cmd.message }
  if (cmd.kind === 'status') return { text: statusText(M.goal) }
  if (cmd.kind === 'set') {
    const g = beginIteration(newGoal(cmd, NO_STREAM, await $.clock.now()))
    M.goal = g
    M.counters = freshCounters()
    const seq = ++M.iterSeq
    await persist($)
    // last statement before the return: no await after it (see submitLater)
    submitLater($, seq, firstPrompt(g))
    return { text: armReply(g) }
  }
  const r = applyControl(cmd.kind, M.goal)
  if (r.state !== M.goal) {
    M.iterSeq += 1
    M.counted = false
    M.goal = r.state
  }
  let launch: { seq: number; text: string } | undefined
  if (r.relaunch && r.state) {
    // resume: counters back to zero (judge errors, stall, stop errors), the next iteration starts at once
    M.counters = freshCounters()
    const g = beginIteration(r.state)
    M.goal = g
    launch = { seq: M.iterSeq, text: g.iteration === 1 ? firstPrompt(g) : iterPrompt(g, `resumed by the human. Last verdict: ${g.lastReason || 'none yet'}`) }
  }
  await persist($)
  // last statement before the return: no await after it (see submitLater)
  if (launch) submitLater($, launch.seq, launch.text)
  return { text: r.text }
}

// ── registration ────────────────────────────────────────────────────────────
// `/tack` is declared by hooks/stoa-session.ts (shared `session.*` glob). The hooks return at once: `next(e)` first, work detached, `.catch` on every path (§9).

export function registerTack(on: On): void {
  M = newShell()
  on('command.run', { command: 'tack' }, ($, e) => tackCommand($, e.args, e.origin))
  on('turn.*', async ($, e, next) => {
    if (!next.is('turn.complete', e)) return next(e)
    const r = await next(e)
    // main loop only: a background agent's own completion carries its agentId
    if (e.agentId === undefined) {
      onTurnComplete($, e).catch(err => {
        debugLog($, `turn end failed: ${String(err)}`)
      })
    }
    return r
  }).catch(($, e, next) => {
    debugLog($, `turn hook failed: ${String(next.error)}`)
    return next(e)
  })
  // D9: a person's prompt (composer, bridge, sdk) preempts the next iteration. The glob sees every prompt.* event: only prompt.submit counts.
  on('prompt.*', (_$, e, next) => {
    if (next.is('prompt.submit', e) && isHumanOrigin(e.origin)) M.humanSeq += 1
    return next(e)
  }).catch(($, e, next) => {
    debugLog($, `prompt hook failed: ${String(next.error)}`)
    return next(e)
  })
}
