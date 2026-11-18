// tack core: pure functions, no `$`, no I/O. Spec: SPEC-tack-llm.md §3 grammar, §4 state, §5 prompts, §6 judge, §7 guards.

export const MAX_CONDITION = 4000
export const LABEL_MAX = 500
export const ANSWER_TAIL = 6000
export const NOTE_TAIL = 600
export const CHECK_TAIL = 1500
export const KEEP_PROGRESS = 5
export const KEEP_VERDICTS = 20
export const DEFAULT_MAX = 20
export const ITER_LIMIT = 200
export const STALL_RUN = 3
export const JUDGE_ERROR_LIMIT = 3
export const RESET_FAIL_LIMIT = 3
export const STOP_ERROR_LIMIT = 3
export const CHECK_TIMEOUT_MS = 120_000
export const JUDGE_TIMEOUT_MS = 30_000

// Pure spec for hooks/stoa-session.ts, which declares it at session start (one shared `session.*` glob).
export const TACK_COMMAND = {
  name: 'tack',
  description: 'Goal loop: keep working until a goal is met (pause, resume, clear)',
  argumentHint: '[--check "<cmd>"] [--stop "<cmd>"] [--max N] [--hours H] <goal> | pause | resume | clear',
}

export const USAGE ='Usage: /tack [--check "<cmd>"] [--stop "<cmd>"] [--max N] [--hours H] <condition>'

export type Verdict = 'met' | 'continue' | 'blocked' | 'impossible'
export type Status = 'active' | 'paused' | 'met' | 'impossible' | 'capped' | 'cleared'
export type PauseReason = 'blocked' | 'interrupted' | 'stalled' | 'judge-errors' | 'hours' | 'no-stream' | 'human' | 'submit-failed' | 'reset-failed' | 'stop-errors'

const STATUSES: readonly Status[] = ['active', 'paused', 'met', 'impossible', 'capped', 'cleared']
const TERMINAL: readonly Status[] = ['met', 'impossible', 'capped', 'cleared']

const tailOf = (s: string, n: number): string => (s.length > n ? s.slice(s.length - n) : s)
const oneLine = (s: string): string => s.replace(/\s+/g, ' ').trim()

// ── origin (D9, D15) ────────────────────────────────────────────────────────

export type OriginLike = { kind?: string } | null | undefined

// A person at the keyboard or an SDK caller. peer, task-notification, scheduled-trigger, plugin and anything else are not.
const HUMAN_KINDS: readonly string[] = ['composer', 'bridge', 'sdk']
export const isHumanOrigin = (origin: OriginLike): boolean => !!origin && typeof origin.kind === 'string' && HUMAN_KINDS.includes(origin.kind)

// ── grammar (§3) ────────────────────────────────────────────────────────────

export type Command =
  | { kind: 'status' }
  | { kind: 'pause' }
  | { kind: 'resume' }
  | { kind: 'clear' }
  | { kind: 'set'; condition: string; check: string; stop: string; max: number; hours: number }
  | { kind: 'error'; message: string }

const CLEAR_WORDS = ['clear', 'stop', 'off', 'reset', 'cancel']
const FLAGS = ['check', 'stop', 'max', 'hours']

// text[i] is the opening quote. Double quotes: \" and \\ are escapes, any other backslash stays literal. Single quotes: no escapes.
function readQuoted(text: string, i: number): { value: string; end: number } | null {
  const q = text[i]!
  let out = ''
  for (let j = i + 1; j < text.length; j++) {
    const ch = text[j]!
    if (ch === q) return { value: out, end: j + 1 }
    if (q === '"' && ch === '\\' && (text[j + 1] === '"' || text[j + 1] === '\\')) {
      out += text[j + 1]
      j++
    } else out += ch
  }
  return null
}

export function parseCommand(args: string, origin?: OriginLike): Command {
  const text = args.trim()
  const err = (message: string): Command => ({ kind: 'error', message })
  if (text === '') return { kind: 'status' }
  const word = text.toLowerCase()
  if (word === 'pause' || word === 'resume') return { kind: word }
  if (CLEAR_WORDS.includes(word)) return { kind: 'clear' }

  const out = { check: '', stop: '', max: DEFAULT_MAX, hours: 0 }
  const seen = new Set<string>()
  let i = 0
  for (;;) {
    while (i < text.length && /\s/.test(text[i]!)) i++
    if (!text.startsWith('--', i)) break
    const m = /^--([A-Za-z][\w-]*)/.exec(text.slice(i))
    if (!m) {
      if (/^--(\s|$)/.test(text.slice(i))) i += 2 // bare `--` ends the flags
      break
    }
    const name = m[1]!
    if (!FLAGS.includes(name)) return err(`tack: unknown flag --${name}. ${USAGE}`)
    if (seen.has(name)) return err(`tack: --${name} given twice`)
    seen.add(name)
    i += m[0].length
    while (i < text.length && /\s/.test(text[i]!)) i++
    if (name === 'check' || name === 'stop') {
      if (text[i] !== '"' && text[i] !== "'") return err(`tack: --${name} needs a quoted command, e.g. --${name} "npm test"`)
      const q = readQuoted(text, i)
      if (!q) return err(`tack: unclosed quote after --${name}`)
      if (q.end < text.length && !/\s/.test(text[q.end]!)) return err(`tack: --${name} command must be followed by a space`)
      if (q.value.trim() === '') return err(`tack: --${name} command is empty`)
      out[name as 'check' | 'stop'] = q.value
      i = q.end
      continue
    }
    const tok = /^\S+/.exec(text.slice(i))?.[0]
    if (!tok) return err(`tack: --${name} needs a value`)
    i += tok.length
    if (name === 'max') {
      const n = /^\d+$/.test(tok) ? Number(tok) : NaN
      if (!(n >= 1 && n <= ITER_LIMIT)) return err(`tack: --max must be an integer from 1 to ${ITER_LIMIT} (got ${tok})`)
      out.max = n
    } else {
      const h = /^\d+(\.\d+)?$/.test(tok) ? Number(tok) : NaN
      if (!(h > 0)) return err(`tack: --hours must be a positive number (got ${tok})`)
      out.hours = h
    }
  }
  const condition = text.slice(i).trim()
  if (condition === '') return err(USAGE)
  if (condition.length > MAX_CONDITION) return err(`tack: condition is limited to ${MAX_CONDITION} characters (got ${condition.length})`)
  // D15: --check and --stop run a shell command; only a person may set them.
  if ((out.check || out.stop) && !isHumanOrigin(origin)) {
    return err(`tack: --check and --stop are accepted only from a person (origin: ${origin?.kind ?? 'unknown'}); goal not set`)
  }
  return { kind: 'set', condition, ...out }
}

// ── state (§4) ──────────────────────────────────────────────────────────────

export interface Note {
  i: number
  at: string
  verdict: string
  text: string
}
export interface VerdictEntry {
  i: number
  verdict: string
  source: string
  reason: string
}
export interface TackState {
  stream: string // '' = no stream
  status: Status
  pauseReason: PauseReason | ''
  condition: string
  check: string
  stop: string
  max: number
  hours: number
  setAt: number // ms epoch
  iteration: number
  resets: number
  tokens: number
  lastVerdict: string // met | continue | blocked | impossible | error | ''
  lastReason: string
  progress: Note[] // newest first, KEEP_PROGRESS
  verdicts: VerdictEntry[] // newest first, KEEP_VERDICTS
}

export const stateFileName = (stream: string): string => (stream ? `tack-${stream.replace(/[^A-Za-z0-9._-]/g, '_')}-llm.md` : 'tack-llm.md')
export const storeKey = (cwd: string): string => `tack:state:${cwd}`
export const isTerminal = (s: TackState): boolean => TERMINAL.includes(s.status)

export function newGoal(cmd: Extract<Command, { kind: 'set' }>, stream: string, now: number): TackState {
  return {
    stream,
    status: 'active',
    pauseReason: '',
    condition: cmd.condition,
    check: cmd.check,
    stop: cmd.stop,
    max: cmd.max,
    hours: cmd.hours,
    setAt: now,
    iteration: 0,
    resets: 0,
    tokens: 0,
    lastVerdict: '',
    lastReason: '',
    progress: [],
    verdicts: [],
  }
}

const isoSec = (ms: number): string => new Date(ms).toISOString().replace(/\.\d+Z$/, 'Z')
const isoMin = (ms: number): string => new Date(ms).toISOString().slice(0, 16) + 'Z'

const scalar = (v: string): string => (/^[A-Za-z0-9_.-]+$/.test(v) ? v : JSON.stringify(v))

export function renderState(s: TackState): string {
  const cond = s.condition.split('\n').map(l => (l === '' ? '' : '  ' + l))
  return [
    '---',
    'tack: 1',
    `stream: ${scalar(s.stream)}`,
    `status: ${s.status}`,
    `pause_reason: ${JSON.stringify(s.pauseReason)}`,
    'condition: |',
    ...cond,
    `check: ${JSON.stringify(s.check)}`,
    `stop: ${JSON.stringify(s.stop)}`,
    `max: ${s.max}`,
    `hours: ${s.hours}`,
    `set_at: ${isoSec(s.setAt)}`,
    `iteration: ${s.iteration}`,
    `resets: ${s.resets}`,
    `tokens: ${s.tokens}`,
    `last_verdict: ${scalar(s.lastVerdict)}`,
    `last_reason: ${JSON.stringify(oneLine(s.lastReason))}`,
    '---',
    '## progress',
    ...s.progress.map(n => `- i${n.i} ${n.at} ${n.verdict} — ${oneLine(n.text)}`),
    '## verdicts',
    ...s.verdicts.map(v => `- i${v.i} ${v.verdict} ${v.source} ${JSON.stringify(oneLine(v.reason))}`),
    '',
  ].join('\n')
}

function readScalar(raw: string): string | null {
  const v = raw.trim()
  if (v.startsWith('"')) {
    const m = /^("(?:[^"\\]|\\.)*")\s*(?:#.*)?$/.exec(v)
    if (!m) return null
    try {
      const x = JSON.parse(m[1]!)
      return typeof x === 'string' ? x : null
    } catch {
      return null
    }
  }
  return v.replace(/\s+#.*$/, '')
}

// null on any malformed or missing required field (the caller falls back to the $.store copy).
export function parseState(text: string): TackState | null {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  if (lines[0] !== '---') return null
  const end = lines.indexOf('---', 1)
  if (end < 0) return null
  const kv = new Map<string, string>()
  let condition: string[] | null = null
  for (let n = 1; n < end; n++) {
    const line = lines[n]!
    const m = /^([a-z_]+):[ \t]*(.*)$/.exec(line)
    if (!m) return null
    if (m[1] === 'condition') {
      if (m[2]!.trim() !== '|') return null
      condition = []
      while (n + 1 < end && (lines[n + 1] === '' || lines[n + 1]!.startsWith('  '))) condition.push(lines[++n]!.slice(2))
      continue
    }
    kv.set(m[1]!, m[2]!)
  }
  const str = (k: string, d?: string): string | null => {
    const raw = kv.get(k)
    return raw === undefined ? (d ?? null) : readScalar(raw)
  }
  const num = (k: string, d: number): number | null => {
    const raw = kv.get(k)
    if (raw === undefined) return d
    const v = readScalar(raw)
    return v !== null && /^\d+(\.\d+)?$/.test(v) ? Number(v) : null
  }
  if (str('tack') !== '1' || condition === null) return null
  const cond = condition.join('\n').trim()
  const status = str('status') as Status | null
  const setAt = Date.parse(str('set_at') ?? '')
  const max = num('max', DEFAULT_MAX)
  const hours = num('hours', 0)
  const iteration = num('iteration', 0)
  const resets = num('resets', 0)
  const tokens = num('tokens', 0)
  const stream = str('stream', '')
  const pause = str('pause_reason', '')
  const check = str('check', '')
  const stop = str('stop', '')
  const lastVerdict = str('last_verdict', '')
  const lastReason = str('last_reason', '')
  if (!cond || !status || !STATUSES.includes(status) || Number.isNaN(setAt)) return null
  if (max === null || hours === null || iteration === null || resets === null || tokens === null) return null
  if (stream === null || pause === null || check === null || stop === null || lastVerdict === null || lastReason === null) return null

  const progress: Note[] = []
  const verdicts: VerdictEntry[] = []
  let section = ''
  for (const line of lines.slice(end + 1)) {
    if (line.startsWith('## ')) {
      section = line.slice(3).trim()
      continue
    }
    if (section === 'progress') {
      const m = /^- i(\d+) (\S+) (\S+) — (.*)$/.exec(line)
      if (m) progress.push({ i: Number(m[1]), at: m[2]!, verdict: m[3]!, text: m[4]! })
    } else if (section === 'verdicts') {
      const m = /^- i(\d+) (\S+) (\S+) ("(?:[^"\\]|\\.)*")$/.exec(line)
      if (m) {
        try {
          verdicts.push({ i: Number(m[1]), verdict: m[2]!, source: m[3]!, reason: JSON.parse(m[4]!) })
        } catch {}
      }
    }
  }
  return {
    stream,
    status,
    pauseReason: pause as PauseReason | '',
    condition: cond,
    check,
    stop,
    max,
    hours,
    setAt,
    iteration,
    resets,
    tokens,
    lastVerdict,
    lastReason,
    progress,
    verdicts,
  }
}

// ── prompts (§5.1, §5.3, §5.5) ──────────────────────────────────────────────
// `s.iteration` is the number of the iteration being started: call beginIteration / settle first.

export const beginIteration = (s: TackState): TackState => ({ ...s, iteration: s.iteration + 1 })

export function label(condition: string): string {
  const t = oneLine(condition)
  return t.length > LABEL_MAX ? t.slice(0, LABEL_MAX - 1) + '…' : t
}

export const firstPrompt = (s: TackState): string =>
  [
    `tack goal (iteration ${s.iteration}/${s.max}):`,
    s.condition,
    'Work toward this goal now. Do not ask what to do; the goal is your directive.',
    'End every turn with a short closing note: what changed, the proof (command run + result), what comes next.',
    'If you need a human decision, access or resource, end the turn with one line: tack: blocked — <what you need>',
    'The loop judges the goal after each turn and continues by itself; it stops when the goal is met.',
  ].join('\n')

export const iterPrompt = (s: TackState, reason: string): string =>
  [
    `tack iteration ${s.iteration}/${s.max} — goal: ${label(s.condition)}`,
    `Not met yet: ${reason}`,
    'Continue. End with your closing note; tack: blocked — <need> if you need me.',
  ].join('\n')

export const loopRules = (s: TackState): string =>
  [
    `tack loop active — iteration ${s.iteration}/${s.max}, after a fresh start.`,
    'Goal:',
    s.condition,
    `Last verdict: ${s.lastReason || 'none yet'}`,
    `Read the read_first files and ${stateFileName(s.stream)}, then continue working toward the goal right away. Do not wait for a go and do not ask what to do.`,
    'End every turn with your closing note (what changed, proof, next). If you need a human decision, end with: tack: blocked — <what you need>',
  ].join('\n')

// D5: code-detected, no LLM. Returns the need text ('' when the line has none), or null when no such line.
export function detectBlocked(answer: string): string | null {
  let need: string | null = null
  for (const m of answer.matchAll(/^tack: blocked\b[ \t]*(?:—|–|-{1,2}|:)?[ \t]*(.*)$/gm)) need = m[1]!.trim()
  return need
}

// ── judge (§6) ──────────────────────────────────────────────────────────────

export const JUDGE_SYSTEM = [
  'You judge whether a stated goal has been reached, from the evidence given only. You cannot run commands or read files.',
  'Answer with JSON only: {"verdict":"met|continue|blocked|impossible","reason":"..."}',
  '- met: the evidence shows the goal is reached. Quote the evidence in reason.',
  '- continue: not reached yet. reason = what is missing, phrased as the next instruction for the worker.',
  '- blocked: the worker cannot go on without a human decision, access or resource. reason = what is needed.',
  '- impossible: the goal cannot be reached in this session (self-contradictory, depends on something unavailable, all reasonable approaches exhausted). The worker saying so is evidence, not proof. When in doubt, do not use impossible.',
  'No clear evidence -> continue with reason "insufficient evidence: <what proof is missing>".',
].join('\n')

// Prior iterations only (oldest first); the current answer goes in LAST ANSWER.
export function judgePrompt(s: TackState, answer: string): string {
  const prog = [...s.progress].reverse().map(n => `i${n.i} ${n.at} ${n.verdict} — ${n.text}`)
  return [
    `GOAL:\n${s.condition}`,
    `ITERATION: ${s.iteration}/${s.max}`,
    `PROGRESS (oldest first):\n${prog.length ? prog.join('\n') : '(none yet)'}`,
    `LAST ANSWER (tail):\n${tailOf(answer, ANSWER_TAIL)}`,
  ].join('\n\n')
}

export type JudgeResult =
  | { ok: true; verdict: Verdict; reason: string; source: 'check' | 'judge' | 'code' }
  | { ok: false; cause: string }

const VERDICTS: readonly string[] = ['met', 'continue', 'blocked', 'impossible']

function firstJsonBlock(t: string): string | null {
  const a = t.indexOf('{')
  if (a < 0) return null
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = a; i < t.length; i++) {
    const ch = t[i]!
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
    } else if (ch === '"') inStr = true
    else if (ch === '{') depth++
    else if (ch === '}' && --depth === 0) return t.slice(a, i + 1)
  }
  return null
}

export function parseVerdict(text: string): JudgeResult {
  const block = firstJsonBlock(text)
  if (!block) return { ok: false, cause: 'judge reply has no JSON block' }
  let o: unknown
  try {
    o = JSON.parse(block)
  } catch {
    return { ok: false, cause: 'judge reply is not valid JSON' }
  }
  const v = (o as { verdict?: unknown } | null)?.verdict
  const r = (o as { reason?: unknown } | null)?.reason
  if (typeof v !== 'string' || !VERDICTS.includes(v)) return { ok: false, cause: 'judge verdict is not one of met|continue|blocked|impossible' }
  if (typeof r !== 'string' || r.trim() === '') return { ok: false, cause: 'judge reason is empty' }
  return { ok: true, verdict: v as Verdict, reason: r.trim(), source: 'judge' }
}

// A shell run as the shell sees it: code null + failure set = timeout or spawn error.
export interface ShellRun {
  code: number | null
  output: string
  failure?: string
}

export function judgeFromCheck(cmd: string, run: ShellRun): JudgeResult {
  if (run.failure !== undefined || run.code === null) return { ok: false, cause: `check ${run.failure ?? 'did not finish'}: ${cmd}` }
  if (run.code === 0) return { ok: true, verdict: 'met', reason: `check passed: ${cmd}`, source: 'check' }
  return { ok: true, verdict: 'continue', reason: `check failed (exit ${run.code}): ${tailOf(run.output.trim(), CHECK_TAIL)}`, source: 'check' }
}

export interface LimitFact {
  reached: boolean
  tail: string
  error?: string
}

export function limitFromRun(run: ShellRun): LimitFact {
  if (run.failure !== undefined || run.code === null) return { reached: false, tail: '', error: run.failure ?? 'did not finish' }
  return { reached: run.code === 0, tail: tailOf(run.output.trim(), CHECK_TAIL) }
}

export const limitToast = (cmd: string, tail: string): string => `tack stopped: limit reached (${cmd})${tail ? '\n' + tail : ''}`

// ── guards and decision (§5.2, §7) ──────────────────────────────────────────

export interface Counters {
  judgeErrors: number
  stallHashes: string[]
  resetFailures: number
  stopErrors: number // consecutive --stop commands that failed to run
}
export const freshCounters = (): Counters => ({ judgeErrors: 0, stallHashes: [], resetFailures: 0, stopErrors: 0 })

export interface TurnFacts {
  now: number
  isAborted: boolean
  reason: string // how the turn ended; error and refusal never relaunch
  answer: string
  liveAgents: number
  counters: Counters
  humanSeqAtEnd: number // humanSeq when this turn ended
  humanSeqNow: number // humanSeq now, after the judge await
  packBusy: boolean
  fill: { tokens: number; hardAt: number }
  judge?: JudgeResult // phase 2: after need-judge
  limit?: LimitFact // phase 3: after need-limit-check
}

export type Action =
  | { kind: 'noop'; why: string }
  | { kind: 'skip'; why: string }
  | { kind: 'wait-agents'; n: number }
  | { kind: 'need-judge'; via: 'check' | 'haiku' }
  | { kind: 'need-limit-check' }
  | { kind: 'pause'; reason: PauseReason; detail: string }
  | { kind: 'finish'; status: 'met' | 'impossible' | 'capped'; reason: string; text: string }
  | { kind: 'defer'; why: 'human' | 'pack-busy' }
  | { kind: 'reset'; callPack: boolean; reason: string; warn?: string }
  | { kind: 'relaunch'; reason: string; warn?: string }
export type Decision = Action & { counters: Counters }

export const normalizeReason = (r: string): string => r.toLowerCase().replace(/\s+/g, ' ').trim()

// FNV-1a 32-bit
export function hashText(t: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

// Pure and re-entrant by phases: call with `judge` unset, run what `need-judge` asks, call again with `judge`;
// same for `limit`. Pass the SAME incoming `counters` every phase and keep `counters` of the last call only.
export function decide(s: TackState, f: TurnFacts): Decision {
  const c: Counters = { ...f.counters, stallHashes: [...f.counters.stallHashes] }
  const out = (a: Action): Decision => ({ ...a, counters: c })
  const pause = (reason: PauseReason, detail: string): Decision => out({ kind: 'pause', reason, detail })

  if (s.status !== 'active') return out({ kind: 'noop', why: `goal is ${s.status}` })
  if (f.isAborted) return pause('interrupted', 'turn interrupted')
  if (f.reason === 'error' || f.reason === 'refusal') return out({ kind: 'skip', why: `turn ended with ${f.reason}` })
  const need = detectBlocked(f.answer)
  if (need !== null) return pause('blocked', need || 'no reason given')
  if (f.liveAgents > 0) return out({ kind: 'wait-agents', n: f.liveAgents })
  if (!f.judge) return out({ kind: 'need-judge', via: s.check ? 'check' : 'haiku' })

  const j = f.judge
  let reason: string
  let real = true // a real continue verdict feeds the stall detector, a judge error does not
  if (j.ok) {
    c.judgeErrors = 0
    if (j.verdict === 'met') return out({ kind: 'finish', status: 'met', reason: j.reason, text: `tack: goal met after ${s.iteration} iteration(s) — ${j.reason}` })
    if (j.verdict === 'impossible') return out({ kind: 'finish', status: 'impossible', reason: j.reason, text: `tack: goal judged impossible — ${j.reason}` })
    if (j.verdict === 'blocked') return pause('blocked', j.reason)
    reason = j.reason
  } else {
    c.judgeErrors += 1
    if (c.judgeErrors >= JUDGE_ERROR_LIMIT) return pause('judge-errors', j.cause)
    reason = `judge unavailable (${j.cause}), continue toward the goal`
    real = false
  }

  // guards, in table order (§7)
  if (s.iteration >= s.max) {
    const text = `tack stopped: max ${s.max} iterations reached`
    return out({ kind: 'finish', status: 'capped', reason: text, text })
  }
  if (s.stop) {
    if (!f.limit) return out({ kind: 'need-limit-check' })
    if (f.limit.error !== undefined) {
      c.stopErrors += 1
      if (c.stopErrors >= STOP_ERROR_LIMIT) return pause('stop-errors', `--stop command failed to run ${STOP_ERROR_LIMIT} times in a row (${f.limit.error}): ${s.stop}`)
    } else c.stopErrors = 0
    if (f.limit.reached) {
      const text = limitToast(s.stop, f.limit.tail)
      return out({ kind: 'finish', status: 'capped', reason: text, text })
    }
  }
  if (s.hours > 0 && f.now - s.setAt >= s.hours * 3_600_000) return pause('hours', `${s.hours} h wall-clock cap reached`)
  if (real) {
    c.stallHashes.push(hashText(normalizeReason(reason)))
    if (c.stallHashes.length > STALL_RUN) c.stallHashes.splice(0, c.stallHashes.length - STALL_RUN)
    if (c.stallHashes.length === STALL_RUN && c.stallHashes.every(h => h === c.stallHashes[0])) {
      return pause('stalled', `same result ${STALL_RUN} times in a row: ${tailOf(reason, 200)}`)
    }
  }
  if (f.humanSeqNow !== f.humanSeqAtEnd) return out({ kind: 'defer', why: 'human' })
  const warn = f.limit?.error ? `--stop command failed to run (${f.limit.error}); limit not checked` : undefined
  if (f.fill.tokens >= f.fill.hardAt) {
    if (!s.stream) return pause('no-stream', 'no stream: /pack save <name> then /tack resume')
    if (c.resetFailures >= RESET_FAIL_LIMIT) return pause('reset-failed', `${RESET_FAIL_LIMIT} failed resets in a row`)
    return out({ kind: 'reset', callPack: !f.packBusy, reason, warn })
  }
  if (f.packBusy) return out({ kind: 'defer', why: 'pack-busy' })
  return out({ kind: 'relaunch', reason, warn })
}

// ── state transitions ───────────────────────────────────────────────────────

// Turn end bookkeeping. `counted` = a tack submit or reset started this turn; otherwise (human, peer, ...) the turn is an extra iteration (O2 = A).
export function recordTurn(s: TackState, t: { tokens: number; counted: boolean }): TackState {
  return { ...s, tokens: s.tokens + Math.max(0, t.tokens), iteration: t.counted ? s.iteration : s.iteration + 1 }
}

// D8: notes are code-copied from the answer, never rewritten.
export function recordVerdict(s: TackState, now: number, answer: string, j: JudgeResult): TackState {
  const verdict = j.ok ? j.verdict : 'error'
  const reason = j.ok ? j.reason : j.cause
  const note: Note = { i: s.iteration, at: isoMin(now), verdict, text: oneLine(tailOf(answer, NOTE_TAIL)) || '(empty answer)' }
  const entry: VerdictEntry = { i: s.iteration, verdict, source: j.ok ? j.source : 'code', reason }
  return {
    ...s,
    lastVerdict: verdict,
    lastReason: reason,
    progress: [note, ...s.progress].slice(0, KEEP_PROGRESS),
    verdicts: [entry, ...s.verdicts].slice(0, KEEP_VERDICTS),
  }
}

// State after a decision: terminal/paused status, or the next iteration number (relaunch) / reset counter (reset).
export function settle(s: TackState, d: Decision): TackState {
  switch (d.kind) {
    case 'pause':
      return { ...s, status: 'paused', pauseReason: d.reason }
    case 'finish':
      return { ...s, status: d.status, pauseReason: '' }
    case 'relaunch':
      return beginIteration(s)
    case 'reset':
      return { ...beginIteration(s), resets: s.resets + 1 }
    default:
      return s
  }
}

export const pauseText = (reason: PauseReason, detail: string): string => `tack paused: ${reason}${detail ? ` — ${detail}` : ''}. /tack resume to continue`

export function statusSegment(s: TackState | null): string {
  if (!s || s.status === 'cleared') return ''
  if (s.status === 'active') return `tack ${s.iteration}/${s.max}`
  if (s.status === 'paused') return `tack paused: ${s.pauseReason}`
  return `tack ${s.status}`
}

export function armReply(s: TackState): string {
  const extra = [s.check && `check: ${s.check}`, s.stop && `stop: ${s.stop}`, s.hours > 0 && `hours: ${s.hours}`].filter(Boolean)
  return `tack: goal set (max ${s.max} iterations${extra.length ? ', ' + extra.join(', ') : ''}). Iteration 1 starts now. /tack pause to hold, /tack clear to stop.`
}

export function statusText(s: TackState | null): string {
  if (!s) return `tack: no goal. ${USAGE}`
  const head = `tack: ${s.status}${s.status === 'paused' ? ` (${s.pauseReason})` : ''} — iteration ${s.iteration}/${s.max}, resets ${s.resets}, tokens ${s.tokens}`
  const lines = [head, `goal: ${label(s.condition)}`]
  if (s.check) lines.push(`check: ${s.check}`)
  if (s.stop) lines.push(`stop: ${s.stop}`)
  if (s.hours > 0) lines.push(`hours: ${s.hours}`)
  if (s.lastVerdict) lines.push(`last: ${s.lastVerdict} — ${oneLine(s.lastReason)}`)
  return lines.join('\n')
}

export interface ControlResult {
  state: TackState | null
  text: string
  relaunch: boolean // resume: start the next iteration at once (5.3 path); reset judge-error and stall counters
}

export function applyControl(kind: 'pause' | 'resume' | 'clear', s: TackState | null): ControlResult {
  const none = (text: string): ControlResult => ({ state: s, text, relaunch: false })
  if (kind === 'resume') {
    if (!s || s.status !== 'paused') return none('tack: nothing to resume.')
    // The hours guard would pause again at the next turn end: resuming lifts the cap.
    const lifted = s.pauseReason === 'hours'
    const next: TackState = { ...s, status: 'active', pauseReason: '', hours: lifted ? 0 : s.hours }
    return { state: next, text: `tack: resumed (iteration ${next.iteration + 1}/${next.max})${lifted ? '; wall-clock cap removed' : ''}.`, relaunch: true }
  }
  if (!s || isTerminal(s)) return none('tack: no active goal.')
  if (kind === 'clear') return { state: { ...s, status: 'cleared', pauseReason: '' }, text: 'tack: goal cleared.', relaunch: false }
  if (s.status === 'paused') return none('tack: already paused. /tack resume to continue.')
  return { state: { ...s, status: 'paused', pauseReason: 'human' }, text: 'tack paused. /tack resume to continue.', relaunch: false }
}
