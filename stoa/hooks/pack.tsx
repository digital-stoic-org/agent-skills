import type { EngineInterface, On } from 'claude-code'

// pack (stoa), ported from the modtest prototype: one mod for context.
//   /pack save [stream]            fork -> pack-<stream>-llm.md (not awaited, no clear)
//   /pack [stream] [--yes|-y]      save (awaited) + review pane / --yes: arm + /clear (automatic) + re-inject
//   /pack cancel                   leave the review or the armed state (the saved file stays)
//   /unpack <stream>               state file -> first message of this session
// Journal: every `<!-- ckpt ... -->` trailer of a main-loop answer is appended verbatim to journal/<stream>.md by code.
// The fork DESIGNATES (routing ids + fork-owned fields); code COPIES trailer text and assembles the state file.
// Plan: /praxis/repos/agent-skills/plan-self-relay-mod-llm.md

const PANE = 'pack'
const STORE_KEY = 'pack:pending'
const STALE_MS = 10 * 60 * 1000
const MARKDOWN_MAX = 10_000
// Hard cap of the state file, enforced by code: the fork is told the ceiling and the room left (forkPrompt), assemble() cuts what still overflows.
const STATE_MAX = 8_000
// Below this much room under STATE_MAX, the fork is told to designate retire_* ids first.
const ROOM_TIGHT = 1_500
const STREAM_RE = /^[a-zA-Z0-9_-]{1,50}$/
const RESERVED = ['save', 'load', 'cancel']
const SHRINK_LINE = 80
// Feedback channels. Status line = the present state; a toast = an event; a {text} reply = the record (past tense).
// A "..." on the status always ends in an outcome on the status. Errors stay on the status and toast for ERROR_TOAST_MS.
const ERROR_TOAST_MS = 12_000
// A flow line older than this says it may be stuck ($.model.fork cannot be cancelled).
export const SLOW_MS = 3 * 60 * 1000
// Context-fill floors (T19, T21, T22), as a share of the model's context window (e.context.window), the same figure as the
// status line. To calibrate live from the `pack: ctx` log lines.
// STRONG: floor for a strong seam (a task closed, a pivot). SOFT: floor for a simple seam (a decision). HARD: auto pre-save.
export const STRONG = 0.3
export const SOFT = 0.5
export const HARD = 0.7
// Safety cap on HARD: the pre-save must happen before auto-compaction (the fork is refused at the wall), so the hard zone
// starts at min(HARD * window, WALL_CAP * wall).
export const WALL_CAP = 0.95
// usage() (the wall) is only asked once tokens / window reaches this, then cached. Under it a strong seam at STRONG needs no call, and a
// wall of at least 0.35 / WALL_CAP = 37% of the window is still seen before the cap bites.
const USAGE_FROM = 0.35

// UNPACK_RULES lines 1-4: /repos/agent-skills/team/skills/relay/SKILL.md §3 (md5 615b560cfe2e88c19763e668bf89570a at copy time).
// Line 5 (orchestrator, team-only) replaced by a solo line; line 6 added for v2 (read_first after the go).
const UNPACK_RULES = `Reply with one line saying you are ready, then stop there.
Do nothing without my explicit go — no file read, no command, no sub-agent, no continuation of what is in progress.
Do not read the pack back to me. One line of acknowledgement is the whole answer.
Write a message only when something changes. The rest of the time stay silent.
Questions go to me, in this window.
After my go, read the \`read_first\` files before acting.`

const FORK_PROMPT = `You are writing the state of this work stream for yourself. After a /clear the state file is the ONLY thing the fresh context receives. Code assembles the file: you DESIGNATE, you never copy. Lines coming from ckpt trailers are routed and copied verbatim by code.
First line, exactly one of:
GATE: ok
GATE: blocked - <one-line reason>
Blocked = you are in the middle of a cross-item step (synthesis, deduplication, global arbitration across all units). Then output nothing else.
If ok, from line 2 output ONLY the block below, keys in this order, no markdown, no prose, no blank line. Scalar = one line \`key: value\`. List = \`key:\` then one \`- item\` line per item; a missing list = empty.
status: <one word or short phrase: building | blocked | review ...>
goal: <1 sentence, carried from PREVIOUS STATE unless it changed>
read_first:
- <path — role>   (closed list, read only after the human's go, never before the go)
read_if_needed:
- <path or URL — when to read it>   (extras only)
deliverable: <path where the written work lives>
decisions:
- <choice — why>   (ONLY decisions no trailer covers; the why is mandatory; do not reopen)
learnings:
- <non-obvious fact — command or path that proves it>   (extras only)
discarded:
- <path tried — why rejected>   (extras only)
in_progress:
- <half-done item — where it stands>
next:
- <action>   (2-4 actions, extras only)
unknowns:
- <what is not known>   (never empty)
stale:
- <path — replaced by X; do not reload>
retire_answered: <ids, e.g. c03, c07>
retire_done: <ids>
retire_learned: <ids>
retire_reversed: <ids, e.g. c05>
retire_superseded: <ids>
Rules:
- Every list except read_if_needed, learnings, discarded, next and decisions is yours entirely, and for those five you give EXTRAS only: whatever the trailers below do not already say.
- Return the COMPLETE current content of every list you own: carry forward the still-valid lines of PREVIOUS STATE that have no (cNN) suffix.
- A line ending with (cNN) belongs to code: never output one.
- Retire keys take ids from PREVIOUS STATE or from the entries below. retire_answered: open: / assumption: items now resolved. retire_done: next items now done. retire_learned: learnings now obsolete (a bug since fixed, a fact replaced by a later one). retire_reversed: decisions proved wrong and reversed. retire_superseded: decisions overtaken by a later decision without being wrong. Omit a retire key when it is empty.
- A pointer (absolute path, path:line, command) replaces any explanation. Do not run commands; write them.`

type Phase = 'idle' | 'review' | 'armed'
type Pending = { pack: string; createdAt: number; cwd: string; stream?: string }
type Stored = Pending & { phase: Phase }

// Module scope: survives /clear (module not reloaded), lost on mod reload -> $.store backup.
let phase: Phase = 'idle'
let pending: Pending | null = null
// A save or a pack build is running (the fork is slow): refuse a second command meanwhile.
let saving = false
// Stream binding. Same session across /clear, so it survives /clear; reset on startup/resume/fork.
let boundArg: string | null = null
let titleStream: string | null = null
// Journal appends of this process, one at a time.
let journalQueue: Promise<unknown> = Promise.resolve()
// T19 context zones. Module scope like the rest: survives /clear (reset by hand there), lost on mod reload.
let wallCache: number | null = null
let lastM: Measure | null = null
let seam: Seam = { level: 'none' }
// softDone: the advice toast was shown in this cycle. hardDone: the hard zone acted in this cycle.
let softDone = false
let hardDone = false
// The persistent advice line (T21) and the line of the active save/pack flow: one `$.ui.status` per plugin, see paint().
let advice: Advice | null = null
let flowLine: string | undefined
// Ticks the elapsed time on the flow line; any other flow line stops it.
let ticker: { cancel: () => void } | null = null
// Last outcome of a command, under the flow line. ok: goes at the end of the next prompted turn. sticky (warning, error): until the next command.
type Outcome = { text: string; sticky: boolean; prompted: boolean }
let outcome: Outcome | null = null
// Checkpoints kept in the store and not yet in a journal (no stream, or a failed write).
type Waiting = { count: number; stream: string | null }
let waiting: Waiting | null = null
// Bumped at every re-arm: a hard save finishing in an older cycle must not set a stale advice.
let cycle = 0

// ---------- pure helpers ----------

export const pad = (n: number) => String(n).padStart(2, '0')
export const statePath = (stream: string) => `pack-${stream}-llm.md`
// stoa 0.1.0 and modtest saved the state under this name (header field `predecessor` for previous_session): read on a miss, written forward.
export const legacyStatePath = (stream: string) => `relay-${stream}-llm.md`
// Outcome of the last save, rewritten at every save: the toast reaches the human only, this file the model too.
export const statusPath = (stream: string) => `pack-${stream}-status-llm.md`
export const journalPath = (stream: string) => `journal/${stream}.md`
const bufferKey = (sid: string) => `pack:buffer:${sid}`

export function journalRule(stream: string): string {
  return `Journal ${journalPath(stream)}: never read it whole; to see an entry, grep by id: grep -A8 '^### cNN' ${journalPath(stream)}`
}

// A /rename title that is not a valid stream name becomes one; empty = no stream.
export function slugify(title: string): string | null {
  if (STREAM_RE.test(title)) return title
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/, '')
  return slug === '' ? null : slug
}

export type Verb = 'save' | 'load' | 'pack' | 'cancel'
export type ParsedArgs = { verb: Verb; stream?: string; yes: boolean } | { error: string }

export function parseArgs(args: string): ParsedArgs {
  const tokens = args.split(/\s+/).filter(t => t !== '')
  const yes = tokens.some(t => t === '--yes' || t === '-y')
  const rest = tokens.filter(t => t !== '--yes' && t !== '-y')
  const bad = rest.find(t => t.startsWith('-'))
  if (bad) return { error: `unknown option ${bad}. Usage: /pack save [stream] | cancel | [stream] [--yes]` }
  let verb: Verb = 'pack'
  if (rest[0] === 'load') return { error: 'load moved: type /unpack <stream>' }
  if (rest[0] === 'cancel') return yes || rest.length > 1 ? { error: 'cancel takes nothing else. Usage: /pack cancel' } : { verb: 'cancel', yes: false }
  if (rest[0] === 'save') verb = rest.shift() as Verb
  if (yes && verb !== 'pack') return { error: `--yes only goes with the full form (/pack [stream] --yes), not /pack save` }
  if (rest.length > 1) return { error: `too many arguments. Usage: /pack save [stream] | cancel | [stream] [--yes]` }
  const stream = rest[0]
  if (stream !== undefined) {
    if (RESERVED.includes(stream)) return { error: `"${stream}" is a reserved word, not a stream name` }
    if (!STREAM_RE.test(stream)) return { error: `invalid stream "${stream}": use 1-50 chars of a-z A-Z 0-9 _ -` }
  }
  return { verb, stream, yes }
}

// `/unpack <stream>`: the stream is required; the load verb is the same one /pack used to carry.
export function parseUnpackArgs(args: string): ParsedArgs {
  const tokens = args.split(/\s+/).filter(t => t !== '')
  const bad = tokens.find(t => t.startsWith('-'))
  if (bad) return { error: `unknown option ${bad}. Usage: /unpack <stream>` }
  if (tokens.length === 0) return { error: 'no stream given. Usage: /unpack <stream>' }
  if (tokens.length > 1) return { error: `too many arguments. Usage: /unpack <stream>` }
  const stream = tokens[0] as string
  if (RESERVED.includes(stream)) return { error: `"${stream}" is a reserved word, not a stream name` }
  if (!STREAM_RE.test(stream)) return { error: `invalid stream "${stream}": use 1-50 chars of a-z A-Z 0-9 _ -` }
  return { verb: 'load', stream, yes: false }
}

export type Clause = 'decision' | 'reasoning' | 'learning' | 'pivot' | 'rejected' | 'constraint' | 'assumption' | 'open' | 'definition' | 'refs'
export type Section = 'read_first' | 'read_if_needed' | 'decisions' | 'learnings' | 'discarded' | 'in_progress' | 'next' | 'unknowns' | 'stale'

const CLAUSES: Clause[] = ['decision', 'reasoning', 'learning', 'pivot', 'rejected', 'constraint', 'assumption', 'open', 'definition', 'refs']
// null = journal only (addressable by id, never in the state).
export const ROUTE: Record<Clause, Section | null> = {
  decision: 'decisions',
  constraint: 'decisions',
  learning: 'learnings',
  definition: 'learnings',
  rejected: 'discarded',
  open: 'next',
  assumption: 'unknowns',
  refs: 'read_if_needed',
  reasoning: null,
  pivot: null,
}

// Splits a trailer body on its clause keywords; separators (` · `, `|`, `;`, newlines) are stripped.
export function parseTrailer(trailer: string): { type: Clause; text: string }[] {
  const body = trailer.replace(/^\s*<!--\s*ckpt/, '').replace(/-->\s*$/, '')
  const re = new RegExp(`(?:^|[·|;\\n])\\s*(${CLAUSES.join('|')}):\\s*`, 'g')
  const hits = [...body.matchAll(re)]
  const out: { type: Clause; text: string }[] = []
  hits.forEach((hit, i) => {
    const start = (hit.index ?? 0) + hit[0].length
    const end = i + 1 < hits.length ? (hits[i + 1].index ?? body.length) : body.length
    const text = body.slice(start, end).replace(/[\s·|;]+$/, '').replace(/\s+/g, ' ').trim()
    if (text) out.push({ type: hit[1] as Clause, text })
  })
  return out
}

export type Entry = { n: number; id: string; trailer: string }

export function parseJournal(text: string): Entry[] {
  const heads = [...text.matchAll(/^### c(\d+) .*$/gm)]
  return heads.map((h, i) => {
    const from = (h.index ?? 0) + h[0].length
    const to = i + 1 < heads.length ? (heads[i + 1].index ?? text.length) : text.length
    return { n: Number(h[1]), id: `c${h[1]}`, trailer: text.slice(from, to).trim() }
  })
}

const maxId = (text: string) => parseJournal(text).reduce((m, e) => Math.max(m, e.n), 0)

const ID_END = /\s\(c(\d+)\)\s*$/
const idOf = (line: string): number | null => {
  const m = line.match(ID_END)
  return m ? Number(m[1]) : null
}
const stripId = (line: string) => line.replace(ID_END, '')

const SCALARS_HEADER = ['stream', 'saved', 'status', 'previous_session', 'goal', 'journal', 'journal_cursor']
const LISTS: Section[] = ['read_first', 'read_if_needed', 'decisions', 'learnings', 'discarded', 'in_progress', 'next', 'unknowns', 'stale']
// Body order of the state file (deliverable is the only scalar among them).
const BODY_ORDER = ['read_first', 'read_if_needed', 'deliverable', 'decisions', 'learnings', 'discarded', 'in_progress', 'next', 'unknowns', 'stale']

export type Keyed = { scalars: Record<string, string>; lists: Record<string, string[]> }

// `key: value` scalars and `key:` + `- item` lists; unknown lines are ignored.
export function parseKeyed(text: string, scalarKeys: string[], listKeys: string[]): Keyed {
  const out: Keyed = { scalars: {}, lists: {} }
  let current: string | null = null
  for (const raw of text.split('\n')) {
    const line = raw.trimEnd()
    const key = line.match(/^([a-z_]+):\s*(.*)$/)
    if (key && scalarKeys.includes(key[1])) {
      out.scalars[key[1]] = key[2].trim()
      current = null
    } else if (key && listKeys.includes(key[1])) {
      out.lists[key[1]] = out.lists[key[1]] ?? []
      current = key[1]
      if (key[2].trim()) out.lists[current].push(key[2].trim())
    } else if (current && line.startsWith('- ')) {
      out.lists[current].push(line.slice(2).trim())
    }
  }
  return out
}

const STATE_SCALARS = [...SCALARS_HEADER, 'deliverable']
// `predecessor`: previous_session in a legacy state file, parsed so the migration keeps it.
const parseState = (text: string) => parseKeyed(text, [...STATE_SCALARS, 'predecessor'], LISTS)

const RETIRE_KEYS = ['retire_answered', 'retire_done', 'retire_learned', 'retire_reversed', 'retire_superseded'] as const
const FORK_SCALARS = ['status', 'goal', 'deliverable', ...RETIRE_KEYS]
export type ForkFields = {
  fields: Keyed
  answered: Set<number>
  done: Set<number>
  learned: Set<number>
  reversed: Set<number>
  superseded: Set<number>
}
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

export function parseForkBody(body: string): ForkFields | null {
  const fields = parseKeyed(body, FORK_SCALARS, LISTS)
  if (Object.keys(fields.scalars).length === 0 && Object.keys(fields.lists).length === 0) return null
  const ids = (s: string | undefined) => new Set([...(s ?? '').matchAll(/c(\d+)/g)].map(m => Number(m[1])))
  return {
    fields,
    answered: ids(fields.scalars.retire_answered),
    done: ids(fields.scalars.retire_done),
    learned: ids(fields.scalars.retire_learned),
    reversed: ids(fields.scalars.retire_reversed),
    superseded: ids(fields.scalars.retire_superseded),
  }
}

const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim()
const AGENT_LINE = 'agent in flight:'
const AGENTS_MAX = 10
const AGENT_DESC_MAX = 100
const LIVE_STATUS = ['pending', 'running', 'waiting', 'idle']
// One code-written line per live background agent, so the fresh context after /clear knows whom it can still SendMessage.
// Agents of a Workflow are not in $.agent.list (a forked skill is). Called BEFORE the save fork starts, so the fork never
// lists itself. Any failure -> no lines: the save must never fail because of this.
async function agentLines($: EngineInterface): Promise<string[]> {
  try {
    const live = (await $.agent.list()).filter(a => LIVE_STATUS.includes(a.status))
    const lines = live.slice(0, AGENTS_MAX).map(a => {
      const desc = oneLine(a.description ?? '')
      return `${AGENT_LINE} ${oneLine(a.name || a.type)} [${a.id}] ${a.status}${desc ? ` — ${desc.slice(0, AGENT_DESC_MAX)}` : ''}`
    })
    if (live.length > AGENTS_MAX) lines.push(`${AGENT_LINE} +${live.length - AGENTS_MAX} more, not listed`)
    return lines
  } catch {
    return []
  }
}
const uniq = (lines: string[]) => [...new Set(lines)]

export type AssembleInput = {
  stream: string
  saved: string
  sid: string
  prev: string | null
  entries: Entry[]
  fork: ForkFields
  // In-flight agent lines (agentLines()), written by code; rendered first in in_progress and never cut.
  agents?: string[]
}
export type Assembled =
  | { kind: 'ok'; state: string; cursor: string; cut: string[]; degraded: boolean }
  | { kind: 'blocked'; reason: string }

// The core rule: the fork designated ids and wrote its own fields; every trailer-sourced line is copied by code.
export function assemble(input: AssembleInput): Assembled {
  const prev = input.prev ? parseState(input.prev) : null
  const { fields, answered, done, learned, reversed, superseded } = input.fork

  const lists: Record<string, string[]> = {}
  for (const sec of LISTS) lists[sec] = []

  // 1. carried id'd lines of the previous state + new trailer clauses, routed by clause type.
  const carried: Record<string, string[]> = {}
  for (const sec of LISTS) carried[sec] = (prev?.lists[sec] ?? []).filter(l => idOf(l) !== null)
  const routed: Record<string, string[]> = {}
  for (const sec of LISTS) routed[sec] = []
  for (const entry of input.entries) {
    for (const clause of parseTrailer(entry.trailer)) {
      const sec = ROUTE[clause.type]
      if (sec) routed[sec].push(`${clause.text} (${entry.id})`)
    }
  }

  // 2. retire: answered open/assumption items, done next items and obsolete learnings vanish; reversed or superseded
  // decisions move to discarded with their id.
  const movedToDiscarded: string[] = []
  for (const sec of LISTS) {
    lists[sec] = uniq([...carried[sec], ...routed[sec]]).filter(line => {
      const id = idOf(line)
      if (id === null) return true
      if ((sec === 'next' || sec === 'unknowns') && answered.has(id)) return false
      if (sec === 'next' && done.has(id)) return false
      if (sec === 'learnings' && learned.has(id)) return false
      if (sec === 'decisions' && (reversed.has(id) || superseded.has(id))) {
        movedToDiscarded.push(`${stripId(line)} — ${reversed.has(id) ? 'reversed' : 'superseded'} (c${pad(id)})`)
        return false
      }
      return true
    })
  }

  // 3. fork-owned lines (id'd lines are code-owned and dropped).
  for (const sec of LISTS) {
    let own = (fields.lists[sec] ?? []).map(oneLine).filter(l => l !== '' && idOf(l) === null)
    if (sec === 'decisions') own = own.map(l => (l.includes('—') ? l : `${l} — why missing`))
    if (sec === 'in_progress') own = own.filter(l => !l.startsWith(AGENT_LINE)) // code writes those, never the fork
    if (sec === 'read_first' || sec === 'in_progress' || sec === 'stale') lists[sec] = own
    else lists[sec] = uniq([...lists[sec], ...own])
  }
  lists.discarded = uniq([...lists.discarded, ...movedToDiscarded])
  if (lists.unknowns.length === 0) lists.unknowns = ['nothing recorded — treat every fact as unverified']

  // 4. header.
  const allNs = input.entries.map(e => e.n)
  const prevCursor = Number((prev?.scalars.journal_cursor ?? '').replace(/^c/, '')) || 0
  const cursor = `c${pad(Math.max(prevCursor, ...allNs))}`
  const prevSaved = (prev?.scalars.saved ?? '').split(/\s+/)
  const prevWriter = prevSaved[1]
  const previousSession =
    prevWriter && prevWriter !== input.sid ? prevWriter : prev?.scalars.previous_session || prev?.scalars.predecessor || 'none'
  const scalars: Record<string, string> = {
    stream: input.stream,
    saved: `${input.saved} ${input.sid}`,
    status: oneLine(fields.scalars.status || prev?.scalars.status || 'unknown'),
    previous_session: previousSession,
    goal: oneLine(fields.scalars.goal || prev?.scalars.goal || 'unknown'),
    journal: journalPath(input.stream),
    journal_cursor: cursor,
    deliverable: oneLine(fields.scalars.deliverable || prev?.scalars.deliverable || 'none'),
  }

  // The overflow line (set by the last-resort cut) is the last line of stale, outside `lists` so no cut step can drop it.
  // The agent lines (input.agents, <= 11 short lines) sit the same way in front of in_progress: counted in the cap, never cut.
  let overflowLine: string | null = null
  const render = () => {
    const head = SCALARS_HEADER.map(k => `${k}: ${scalars[k]}`).join('\n')
    const agents = input.agents ?? []
    const shown = (k: string) => (k === 'stale' && overflowLine ? [...lists.stale, overflowLine] : k === 'in_progress' ? [...agents, ...lists.in_progress] : lists[k])
    const body = BODY_ORDER.map(k => (k === 'deliverable' ? `deliverable: ${scalars.deliverable}` : `${k}:${shown(k).map(l => `\n- ${l}`).join('')}`)).join('\n')
    return `${head}\n\n${body}\n`
  }

  // 5. hard cap, enforced here whatever the fork wrote. Cut order: read_if_needed (compress), stale, in_progress, discarded,
  // learnings (each oldest first). Still over: id'd lines (cNN) of every body section but read_first, lowest cNN first, then the
  // un-id'd lines (the fork's own, the newest). Every dropped id is named by an overflow line in stale (the journal keeps them).
  // Never cut: header scalars, read_first, deliverable, the agent lines. 'blocked' only when those plus the overflow line exceed the cap alone.
  const cut: string[] = []
  let text = render()
  const over = () => text.length > STATE_MAX
  for (const sec of ['read_if_needed', 'stale', 'in_progress'] as const) {
    if (!over()) break
    if (sec === 'read_if_needed') {
      lists[sec] = lists[sec].map(l => {
        if (l.length <= SHRINK_LINE) return l
        const id = l.match(ID_END)
        const head = stripId(l).slice(0, SHRINK_LINE - 1) + '…'
        return id ? `${head} (c${id[1]})` : head
      })
      text = render()
      cut.push('read_if_needed compressed')
    }
    let dropped = 0
    while (over() && lists[sec].length > 0) {
      lists[sec].shift()
      dropped++
      text = render()
    }
    if (dropped) cut.push(`${sec} -${dropped}`)
  }
  const droppedIds = new Set<number>()
  let plain = 0
  if (over()) {
    const overflow = () =>
      `overflow: dropped to fit ${STATE_MAX} chars: ${[...droppedIds].sort((a, b) => a - b).map(n => `c${pad(n)}`).join(', ') || 'no journal line'}${plain ? ` + ${plain} unnumbered` : ''} — grep the journal by id`
    // One line dropped: its id (or the unnumbered count) goes on the overflow line, which is part of the measured text.
    const drop = (line: string) => {
      const id = idOf(line)
      if (id === null) plain++
      else droppedIds.add(id)
      overflowLine = overflow()
      text = render()
    }
    overflowLine = overflow()
    text = render()
    for (const sec of ['discarded', 'learnings'] as const) {
      let dropped = 0
      while (over() && lists[sec].length > 0) {
        drop(lists[sec].shift() as string)
        dropped++
      }
      if (dropped) cut.push(`${sec} -${dropped}`)
    }
    // Oldest id'd line across all remaining body sections (a same id in two sections goes one line at a time).
    const perSection: Record<string, number> = {}
    while (over()) {
      let best: { sec: string; i: number; n: number } | null = null
      for (const sec of BODY_ORDER) {
        if (sec === 'deliverable' || sec === 'read_first') continue
        for (let i = 0; i < lists[sec].length; i++) {
          const n = idOf(lists[sec][i])
          if (n !== null && (!best || n < best.n)) best = { sec, i, n }
        }
      }
      if (!best) break
      const found: { sec: string; i: number } = best
      drop(lists[found.sec].splice(found.i, 1)[0])
      perSection[found.sec] = (perSection[found.sec] ?? 0) + 1
    }
    // Only un-id'd lines left: the most expendable section first, oldest first inside it.
    for (const sec of ['stale', 'in_progress', 'discarded', 'learnings', 'read_if_needed', 'next', 'unknowns', 'decisions']) {
      while (over() && lists[sec].length > 0) {
        drop(lists[sec].shift() as string)
        perSection[sec] = (perSection[sec] ?? 0) + 1
      }
    }
    for (const sec of BODY_ORDER) if (perSection[sec]) cut.push(`${sec} -${perSection[sec]}`)
  }
  if (over()) return { kind: 'blocked', reason: `state ${text.length} chars > ${STATE_MAX} after cutting ${cut.join(', ') || 'nothing cuttable'}; the header, read_first, the agent lines and the overflow line alone exceed the cap: shorten read_first by hand. Nothing written.` }
  return { kind: 'ok', state: text, cursor, cut, degraded: overflowLine !== null }
}

// ---------- journal (all disk access of the mod goes through these three functions) ----------

type Item = { trailer: string; iso: string; sid: string }

// One write = read + size check + write(old + entries). No append in $.fs, so a size change between read and write
// (another session wrote) re-reads and retries once; still failing -> null and the caller keeps the items in the store.
async function appendEntries($: EngineInterface, stream: string, items: Item[]): Promise<string[] | null> {
  const path = journalPath(stream)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const before = await $.fs.stat(path).catch(() => null)
      const old = before ? await $.fs.read(path) : ''
      const after = await $.fs.stat(path).catch(() => null)
      if ((before?.size ?? -1) !== (after?.size ?? -1)) continue
      let n = maxId(old)
      const ids: string[] = []
      let add = ''
      for (const item of items) {
        n++
        const id = `c${pad(n)}`
        ids.push(id)
        add += `### ${id} ${item.iso} ${item.sid}\n${item.trailer}\n\n`
      }
      await $.fs.write(path, `${old}${old === '' || old.endsWith('\n') ? '' : '\n'}${add}`)
      return ids
    } catch {
      // retry once, then give up
    }
  }
  return null
}

async function readOptional($: EngineInterface, path: string): Promise<string | null> {
  return (await $.fs.exists(path)) ? await $.fs.read(path) : null
}

function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = journalQueue.then(job, job)
  journalQueue = run.catch(() => undefined)
  return run
}

// ---------- stream binding + capture ----------

const current = () => boundArg ?? titleStream

// Buffered items (no stream yet, or a failed append) + new ones: appended in order once a stream is bound.
async function ingest($: EngineInterface, fresh: Item[]) {
  const sid = await $.session.id()
  const key = bufferKey(sid)
  const buffered = ((await $.store.get(key)) as Item[] | undefined) ?? []
  const items = [...buffered, ...fresh]
  if (items.length === 0) return
  const stream = current()
  if (!stream) {
    await $.store.set(key, items)
    setWaiting($, { count: items.length, stream: null })
    return
  }
  const ids = await enqueue(() => appendEntries($, stream, items))
  if (ids) {
    if (buffered.length > 0) await $.store.delete(key)
    setWaiting($, null)
  } else {
    await $.store.set(key, items)
    setWaiting($, { count: items.length, stream })
    $.ui.toast(`Could not write the journal of stream "${stream}"; ${items.length} ${items.length === 1 ? 'entry' : 'entries'} kept for later`, { timeoutMs: ERROR_TOAST_MS })
  }
}

async function bind($: EngineInterface, apply: () => void) {
  const before = current()
  apply()
  if (!before && current()) await ingest($, [])
}

async function noteTitle($: EngineInterface, title: string | undefined) {
  if (title === undefined) return
  const slug = slugify(title)
  if (slug === null) return
  await bind($, () => {
    titleStream = slug
  })
}

// ---------- on-screen trailer hiding (drawing only; the stored message and the journal capture keep the trailer) ----------

const TRAILER_OPEN = '<!-- ckpt'

// Closed trailers cut out of one AssistantMessage block's text, the text kept byte for byte up to them.
// `unclosed`: a trailer is still streaming (no `-->` yet); its tail is cut too.
export function splitTrailer(text: string): { body: string; trailers: string[]; kinds: string[]; unclosed: boolean } {
  const kinds: string[] = []
  const trailers: string[] = []
  let body = text.replace(/\s*<!-- ckpt[\s\S]*?-->/g, raw => {
    const trailer = raw.trim()
    trailers.push(trailer)
    for (const c of parseTrailer(trailer)) if (!kinds.includes(c.type)) kinds.push(c.type)
    return ''
  })
  const open = body.indexOf(TRAILER_OPEN)
  const unclosed = open >= 0
  if (unclosed) body = body.slice(0, open)
  return { body: body.trimEnd(), trailers, kinds, unclosed }
}

const clauseList = (kinds: string[]) => (kinds.length ? `: ${kinds.join(', ')}` : '')

// Pure text rewrite: closed trailers and an unclosed streaming tail are cut; a closed one leaves one italic marker naming the clauses.
// Used while a trailer streams (no marker) and as the fallback when the tree cannot be drawn (text too long).
export function hideTrailer(text: string): string {
  if (!text.includes(TRAILER_OPEN)) return text
  const { body, kinds, unclosed } = splitTrailer(text)
  if (unclosed) return body
  const marker = `_ckpt${clauseList(kinds)}_`
  return body ? `${body}\n\n${marker}` : marker
}

// Message ids (e.requestId) whose trailer is expanded on screen. Module scope: a press flips it and redraws; lost on mod reload (all collapsed again).
const expanded = new Set<string>()

// A seam = the answer holds a ckpt trailer with a `decision` clause.
export function hasDecisionSeam(answer: string): boolean {
  const trailers = answer.match(/<!-- ckpt[\s\S]*?-->/g)
  return !!trailers && trailers.some(t => parseTrailer(t).some(c => c.type === 'decision'))
}

// Seam strength of the answer, by code from its ckpt trailers. strong = a `pivot` clause, or a clause naming a task id T<n>
// together with done / closed / closes / a check mark. simple = a `decision` clause. A closed task wins over a pivot (more specific message).
export type Seam = { level: 'none' } | { level: 'simple' } | { level: 'strong'; task?: string }

const DONE_RE = /\b(?:done|clos(?:e|es|ed|ing))\b|\u2705/gi

// The task id nearest to a done word in one clause text, or null.
function closedTask(text: string): string | null {
  const ids = [...text.matchAll(/\bT(\d+)\b/g)]
  const dones = [...text.matchAll(DONE_RE)]
  if (ids.length === 0 || dones.length === 0) return null
  let best: { n: string; d: number } | null = null
  for (const id of ids) for (const done of dones) {
    const d = Math.abs((id.index ?? 0) - (done.index ?? 0))
    if (!best || d < best.d) best = { n: id[1] ?? '', d }
  }
  return best ? `T${best.n}` : null
}

export function seamOf(answer: string): Seam {
  const trailers = answer.match(/<!-- ckpt[\s\S]*?-->/g) ?? []
  let pivot = false
  let simple = false
  let task: string | null = null
  for (const t of trailers) {
    for (const c of parseTrailer(t)) {
      if (c.type === 'pivot') pivot = true
      if (c.type === 'decision') simple = true
      task = closedTask(c.text) ?? task
    }
  }
  if (task) return { level: 'strong', task }
  if (pivot) return { level: 'strong' }
  return simple ? { level: 'simple' } : { level: 'none' }
}

async function capture($: EngineInterface, answer: string) {
  const trailers = answer.match(/<!-- ckpt[\s\S]*?-->/g)
  if (!trailers) return
  const iso = new Date(await $.clock.now()).toISOString()
  const sid = await $.session.id()
  await ingest($, trailers.map(trailer => ({ trailer, iso, sid })))
}

// ---------- state build (fork + assembly + write) ----------

type Built =
  | { kind: 'ok'; state: string; cursor: string; cut: string[]; degraded: boolean; migrated: boolean }
  | { kind: 'blocked'; reason: string }

function forkPrompt(prev: string | null, entries: Entry[]): string {
  const news = entries.length ? entries.map(e => `### ${e.id}\n${e.trailer}`).join('\n\n') : '(none)'
  const n = (v: number) => v.toLocaleString('en-US')
  // The ceiling is enforced by code (assemble); the fork is told the room so it can retire ids before code has to cut.
  const room = STATE_MAX - (prev?.length ?? 0)
  const budget = `SIZE: the state file may not exceed ${n(STATE_MAX)} characters; past it code drops the oldest (cNN) lines. PREVIOUS STATE is ${n(prev?.length ?? 0)} characters: ${room >= 0 ? `${n(room)} left` : `${n(-room)} over`} for what the new entries and your lines add.${room < ROOM_TIGHT ? ' Room is tight: designate retire_* ids first (obsolete learnings, done next items, superseded decisions), then shorten the lines you own.' : ''}`
  return `${FORK_PROMPT}\n\n${budget}\n\nPREVIOUS STATE:\n${prev ?? '(none)'}\n\nJOURNAL ENTRIES TO ROUTE (after the cursor):\n${news}`
}

type Asked = { kind: 'ok'; fork: ForkFields } | { kind: 'blocked'; reason: string }

async function askFork($: EngineInterface, prompt: string): Promise<Asked> {
  const reply = await $.model.fork({ prompt })
  if (!reply.isAnswered) return { kind: 'blocked', reason: `fork failed (${reply.reason})` }
  const parsed = parseFork(reply.text)
  if (parsed.kind === 'blocked') return parsed
  const fork = parseForkBody(parsed.body)
  return fork ? { kind: 'ok', fork } : { kind: 'blocked', reason: 'unparseable fork output' }
}

async function assembleAndWrite($: EngineInterface, stream: string): Promise<Built> {
  try {
    const sid = await $.session.id()
    let prev = await readOptional($, statePath(stream))
    let migrated = false
    if (prev === null) {
      prev = await readOptional($, legacyStatePath(stream))
      migrated = prev !== null
    }
    const journal = await readOptional($, journalPath(stream))
    const cursor = prev ? Number((parseState(prev).scalars.journal_cursor ?? '').replace(/^c/, '')) || 0 : 0
    const entries = parseJournal(journal ?? '').filter(e => e.n > cursor)

    // Listed before the fork starts: agent.list includes forked skills, so the save fork is not yet there to filter out.
    const agents = await agentLines($)
    // One fork per save: an over-cap answer is cut by assemble(), never re-asked.
    const first = await askFork($, forkPrompt(prev, entries))
    if (first.kind === 'blocked') return first
    const result = assemble({ stream, saved: new Date(await $.clock.now()).toISOString(), sid, prev, entries, fork: first.fork, agents })
    if (result.kind === 'blocked') return result
    await $.fs.write(statePath(stream), result.state)
    return { ...result, migrated }
  } catch (err) {
    return { kind: 'blocked', reason: `error: ${String(err)}` }
  }
}

// What a save did beyond writing the state, for the toast and the {text} replies.
// `brief`: the toast and the status line leave out the cut details (kept in the status file and the {text} replies).
function savedNotes(stream: string, built: Extract<Built, { kind: 'ok' }>, brief = false): string {
  const notes = [`${built.state.length.toLocaleString('en-US')} chars`]
  if (built.migrated) notes.push(`migrated from ${legacyStatePath(stream)}`)
  if (built.cut.length && !brief) notes.push(`${built.degraded ? 'over the cap, dropped' : 'trimmed'}: ${built.cut.join(', ')}`)
  return notes.join(', ')
}

async function buildState($: EngineInterface, stream: string): Promise<Built> {
  const built = await assembleAndWrite($, stream)
  try {
    const at = new Date(await $.clock.now()).toISOString()
    const outcome = built.kind === 'blocked' ? 'blocked' : built.degraded ? 'degraded' : 'ok'
    const detail = built.kind === 'blocked' ? `reason: ${built.reason}` : `detail: ${savedNotes(stream, built)}`
    await $.fs.write(statusPath(stream), `stream: ${stream}\nat: ${at}\noutcome: ${outcome}\n${detail}\n`)
  } catch (err) {
    $.ui.log(`pack: status file not written: ${String(err)}`)
  }
  return built
}

// `/pack save`: the command already returned; the outcome is a toast.
// `auto` = the hard zone (T19): the outcome becomes the persistent advice line + a toast, and the zone flags are not re-armed
// (the fill is still high: re-arming would save again at every measure).
async function saveInBackground($: EngineInterface, stream: string, auto?: { pct: number; cycle: number }) {
  let failure: string | null = null
  try {
    const built = await buildState($, stream)
    if (auto) {
      failure = built.kind === 'ok' ? null : built.reason
    } else if (built.kind === 'ok') {
      const line = await savedLine($, stream, built)
      // The toast is the event, the status line the state (with the time, so a later glance tells which save it was).
      if (line.sticky) $.ui.toast(line.text, { timeoutMs: ERROR_TOAST_MS })
      else $.ui.toast(`Stream "${stream}" saved (${savedNotes(stream, built, true)})`)
      outcome = line
    } else {
      $.ui.toast(`Could not save stream "${stream}": ${built.reason} (also in ${statusPath(stream)})`, { timeoutMs: ERROR_TOAST_MS })
      outcome = failedLine(stream, built.reason)
    }
  } catch (err) {
    if (auto) failure = `error: ${String(err)}`
    else {
      $.ui.toast(`Saving stream "${stream}" failed: ${String(err)}. Try /pack save again`, { timeoutMs: ERROR_TOAST_MS })
      outcome = failedLine(stream, `error: ${String(err)}`)
    }
  } finally {
    saving = false
    if (!auto) rearmZones()
    if (auto) hardOutcome($, auto, failure)
    else flowStatus($, undefined)
  }
}

const hhmm = (ms: number) => new Date(ms).toTimeString().slice(0, 5)

// The outcome line of a save: ok (goes after the next turn) or, over the cap, a sticky warning.
async function savedLine($: EngineInterface, stream: string, built: Extract<Built, { kind: 'ok' }>): Promise<Outcome> {
  if (built.degraded) {
    return { text: `\u26A0 Stream "${stream}" saved over the size cap: old entries dropped, see ${statusPath(stream)}`, sticky: true, prompted: false }
  }
  const at = hhmm(await $.clock.now())
  return { text: `\u2713 Stream "${stream}" saved at ${at} (${savedNotes(stream, built, true)})`, sticky: false, prompted: false }
}

const failedLine = (stream: string, reason: string): Outcome => ({
  text: `\u26A0 Could not save stream "${stream}": ${shortReason(reason)} (see ${statusPath(stream)})`,
  sticky: true,
  prompted: false,
})

const keptText = (stream: string | null | undefined) =>
  stream ? `staying in this session; stream "${stream}" stays saved in ${statePath(stream)}` : 'staying in this session; the saved stream stays on disk'

// ---------- context zones (T19, T21) ----------

// Re-arm: the toast may fire again, the advice line goes (callers repaint).
function rearmZones() {
  softDone = false
  hardDone = false
  advice = null
  cycle++
}

// A gating hook that failed: logged for diagnosis; its `.catch` then passes the event on unchanged (a stoa failure never blocks the user).
function noteCaught($: EngineInterface, hook: string, error: { kind: string; message?: string }) {
  try {
    $.ui.log(`pack: ${hook} hook ${error.kind}${error.message ? `: ${error.message}` : ''}`, { to: 'debug' })
  } catch {
    // nothing left to do
  }
}

// Full session reset (/clear, new/resumed/forked session): flags, seam, last fill and the cached wall.
function resetZones() {
  rearmZones()
  seam = { level: 'none' }
  lastM = null
  wallCache = null
}

// ---------- the one status line ----------
// A plugin has ONE `$.ui.status`. Precedence: an active save/pack flow (flowLine) wins; when it clears, the advice line
// (if still valid) is drawn again. Every status of the mod goes through flowStatus() / paint(), never `$.ui.status` directly.

// Precedence: the active flow, the last outcome, a failed journal write, the advice, then checkpoints waiting for a stream.
function paint($: EngineInterface) {
  const journalFailed = waiting && waiting.stream !== null ? waitingText(waiting) : undefined
  const noStream = waiting && waiting.stream === null ? waitingText(waiting) : undefined
  $.ui.status(flowLine ?? outcome?.text ?? journalFailed ?? (advice ? adviceText(advice) : undefined) ?? noStream)
}

function flowStatus($: EngineInterface, text: string | undefined) {
  stopProgress()
  flowLine = text
  paint($)
}

export const elapsed = (ms: number) => {
  const s = Math.floor(ms / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${pad(s % 60)}s`
}

export function progressText(label: string, ms: number): string {
  if (ms >= SLOW_MS) return `${label}: still running after ${elapsed(ms)}, slow or stuck; the outcome will show here`
  return ms < 1000 ? `${label}...` : `${label}... ${elapsed(ms)}`
}

// A flow line with its elapsed time, ticking every second until the next flowStatus(). `label` is read at each tick.
function startProgress($: EngineInterface, label: () => string) {
  flowStatus($, progressText(label(), 0))
  let ms = 0
  ticker = $.clock.every(1000, () => {
    ms += 1000
    flowLine = progressText(label(), ms)
    paint($)
  })
}

function stopProgress() {
  ticker?.cancel()
  ticker = null
}

export function waitingText(w: Waiting): string {
  const n = `${w.count} checkpoint${w.count === 1 ? '' : 's'}`
  return w.stream === null
    ? `${n} waiting for a stream: /rename the session or type /pack save <name>`
    : `\u26A0 Journal of stream "${w.stream}" not written: ${n} kept, retried at the next checkpoint`
}

function setWaiting($: EngineInterface, next: Waiting | null) {
  if (next === null && waiting === null) return
  if (next && waiting && next.count === waiting.count && next.stream === waiting.stream) return
  waiting = next
  paint($)
}

// An ok outcome goes at the end of the first turn prompted after it.
function outcomeTurnDone($: EngineInterface) {
  if (outcome && !outcome.sticky && outcome.prompted) {
    outcome = null
    paint($)
  }
}

// ---------- advice wording (plain words, each says what happened and what to type) ----------

export type Advice = {
  kind: 'task' | 'pivot' | 'decision' | 'saved' | 'failed' | 'nostream'
  // 1 simple seam, 2 strong seam, 3 hard zone: a higher rank replaces a lower one, never the other way round.
  rank: 1 | 2 | 3
  // The advice is dropped when the fill falls under this.
  floor: number
  pct: number
  task?: string
  reason?: string
}

const SHORT_REASON = 80

const shortReason = (reason: string) => {
  const one = reason.replace(/\s+/g, ' ').trim()
  return one.length > SHORT_REASON ? `${one.slice(0, SHORT_REASON - 1)}…` : one
}

export function adviceText(a: Advice): string {
  switch (a.kind) {
    case 'task':
      return `Good moment for a fresh start: ${a.task} just closed (context ${a.pct}%). Type /pack --yes`
    case 'pivot':
      return `Good moment for a fresh start: the direction just changed (context ${a.pct}%). Type /pack --yes`
    case 'decision':
      return `Good moment for a fresh start: a decision just landed (context ${a.pct}%). Type /pack --yes`
    case 'saved':
      return `Progress saved automatically (context ${a.pct}%). Type /pack --yes to continue in a fresh session`
    case 'failed':
      return `Context almost full (${a.pct}%) and the automatic save failed (${shortReason(a.reason ?? 'unknown')}). Type /pack --yes to continue in a fresh session`
    case 'nostream':
      return `Context almost full (${a.pct}%) but no stream is set, so nothing was saved. Type /pack save <name>`
  }
}

const savingText = (pct: number) => `Context almost full (${pct}%): automatically saving your progress`

const seamName = (s: Seam) => (s.level === 'strong' ? `strong:${s.task ?? 'pivot'}` : s.level)

// fill = tokens / window; pct = the figure shown (status-line percent when present, else the rounded fill); hardAt = tokens at which the hard zone starts.
type Measure = { fill: number; pct: number; tokens: number; window: number; wall: number | null; hardAt: number }

// One line per measure, silent ones included, to the debug log (nothing on screen).
function ctxLog($: EngineInterface, src: 'measure' | 'turn', m: Measure, action: string) {
  $.ui.log(
    `pack: ctx pct=${m.pct}% tokens=${m.tokens} window=${m.window} wall=${m.wall ?? 'none'} hard=${m.hardAt} seam=${seamName(seam)} action=${action} src=${src}`,
    { to: 'debug' },
  )
}

// The wall = the token count where auto-compaction fires: auto-compact threshold, else the compaction window, else unknown (null).
async function wallOf($: EngineInterface): Promise<number | null> {
  if (wallCache !== null) return wallCache
  try {
    const breakdown = (await $.session.usage({ breakdown: 'summary' })).context.breakdown
    const wall = breakdown?.autoCompactThreshold ?? breakdown?.rawMaxTokens
    if (wall !== undefined && wall > 0) {
      wallCache = wall
      return wall
    }
  } catch (err) {
    $.ui.log(`pack: ctx usage unavailable, hard = HARD * window: ${String(err)}`, { to: 'debug' })
  }
  return null
}

// Tokens at which the hard pre-save starts: HARD * window, capped at WALL_CAP * wall when the wall is known.
export function hardAtOf(window: number, wall: number | null): number {
  const byWindow = HARD * window
  return Math.round(wall === null ? byWindow : Math.min(byWindow, WALL_CAP * wall))
}

// Seam advice. Runs from session.measure (fill moved) and from turn.complete (seam moved), so the order of the two events does not matter.
// strong seam + fill >= STRONG, or simple seam + fill >= SOFT: the advice line is drawn and the toast shown once per cycle.
// A stronger seam later upgrades the line without a second toast; the percentage on the line follows the fill.
// Returns the action for the log line.
function adviceStep($: EngineInterface, fill: number, pct: number): string {
  if (phase === 'armed') return 'skip-armed'
  const eligible = seam.level === 'strong' ? fill >= STRONG : seam.level === 'simple' ? fill >= SOFT : false
  if (!eligible) {
    if (!advice) return seam.level === 'none' ? 'no-seam' : 'below-floor'
    advice.pct = pct
    paint($)
    return 'advice-keep'
  }
  const next: Advice =
    seam.level === 'strong'
      ? seam.task
        ? { kind: 'task', rank: 2, floor: STRONG, pct, task: seam.task }
        : { kind: 'pivot', rank: 2, floor: STRONG, pct }
      : { kind: 'decision', rank: 1, floor: SOFT, pct }
  if (!advice) {
    advice = next
    if (outcome && !outcome.sticky) outcome = null
    paint($)
    if (!softDone) {
      softDone = true
      $.ui.toast(adviceText(next))
    }
    return 'advice'
  }
  if (next.rank > advice.rank) {
    advice = next
    if (outcome && !outcome.sticky) outcome = null
    paint($)
    return 'advice-upgrade'
  }
  advice.pct = pct
  paint($)
  return 'advice-keep'
}

// Hard: the existing save path, once per cycle, never a clear, never an arm. Returns the action for the log line.
function hardSave($: EngineInterface, pct: number): string {
  if (hardDone) {
    if (advice) {
      advice.pct = pct
      paint($)
    }
    return 'hard-done'
  }
  hardDone = true
  softDone = true
  const stream = current()
  if (!stream) {
    advice = { kind: 'nostream', rank: 3, floor: SOFT, pct }
    paint($)
    $.ui.toast(adviceText(advice))
    return 'hard-nostream'
  }
  if (saving || phase !== 'idle') return saving ? 'hard-skip-saving' : `hard-skip-${phase}`
  saving = true
  startProgress($, () => savingText(pct))
  saveInBackground($, stream, { pct, cycle }).catch(() => {
    saving = false
  })
  return 'hard-save'
}

// The hard save finished: its outcome is the advice line (the flow line goes) and one toast. Stale (re-armed meanwhile): log only.
function hardOutcome($: EngineInterface, auto: { pct: number; cycle: number }, failure: string | null) {
  stopProgress()
  flowLine = undefined
  // Newer than any ok outcome still shown.
  if (outcome && !outcome.sticky) outcome = null
  if (auto.cycle !== cycle) {
    paint($)
    return
  }
  const pct = lastM ? lastM.pct : auto.pct
  advice = failure === null ? { kind: 'saved', rank: 3, floor: SOFT, pct } : { kind: 'failed', rank: 3, floor: SOFT, pct, reason: failure }
  paint($)
  $.ui.toast(adviceText(advice), failure === null ? undefined : { timeoutMs: ERROR_TOAST_MS })
}

async function onMeasure($: EngineInterface, tokens: number, window: number, percent: number | undefined) {
  const fill = tokens / window
  const pct = percent !== undefined ? Math.round(percent) : Math.round(fill * 100)
  // The wall only matters for the hard cap: not asked far below the window, then cached.
  const wall = wallCache !== null || fill >= USAGE_FROM ? await wallOf($) : null
  const hardAt = hardAtOf(window, wall)
  const m: Measure = { fill, pct, tokens, window, wall, hardAt }
  lastM = m
  let action: string
  // The floor the current advice holds to: its own, or after the hard zone the lower of SOFT and 90% of where it started
  // (a low cap must not re-arm at once and save again), else the lowest one.
  const floor = hardDone ? Math.min(SOFT, (0.9 * hardAt) / window) : (advice?.floor ?? STRONG)
  if ((advice || softDone || hardDone) && fill < floor) {
    rearmZones()
    paint($)
    action = 'rearm'
  } else if (tokens >= hardAt) action = hardSave($, pct)
  else action = adviceStep($, fill, pct)
  ctxLog($, 'measure', m, action)
}

// ---------- pack flow (v1 unchanged from the pack on) ----------

async function reset($: EngineInterface) {
  phase = 'idle'
  pending = null
  await $.store.delete(STORE_KEY)
  flowStatus($, undefined)
}

async function persist($: EngineInterface) {
  if (pending) await $.store.set(STORE_KEY, { ...pending, phase } satisfies Stored)
}

// [x] in the pane, Esc on it, or /pack cancel: the save is already written, only the fresh start is dropped.
async function cancel($: EngineInterface, closePane: boolean): Promise<string> {
  const stream = pending?.stream ?? current()
  await reset($)
  if (closePane) await $.ui.close({ id: PANE })
  const text = keptText(stream)
  $.ui.toast(text.charAt(0).toUpperCase() + text.slice(1))
  return text
}

const READY = 'Ready: type /clear to continue in a fresh session, or /pack cancel to stay'

async function clearAndContinue($: EngineInterface) {
  phase = 'armed'
  // Armed: the advice has done its job. Re-arm the zones (advice line off) before the flow line is drawn.
  rearmZones()
  await persist($)
  await $.ui.close({ id: PANE })
  flowStatus($, 'Starting a fresh session...')
  $.command.run({ command: 'clear' }).catch(() => {
    flowStatus($, READY)
  })
}

// The pack to re-inject after /clear: module var first, else a fresh store entry from this cwd.
async function armedPack($: EngineInterface): Promise<string | null> {
  if (phase === 'armed' && pending) return pending.pack
  const stored = (await $.store.get(STORE_KEY)) as Stored | undefined
  if (!stored || stored.phase !== 'armed') return null
  const now = await $.clock.now()
  if (now - stored.createdAt >= STALE_MS) return null
  if (stored.cwd !== (await $.session.cwd())) return null
  return stored.pack
}

async function packStream($: EngineInterface, stream: string, yes: boolean) {
  saving = true
  startProgress($, () => `Saving stream "${stream}" before the fresh start`)
  let built: Built
  try {
    built = await buildState($, stream)
  } finally {
    saving = false
  }
  if (built.kind === 'blocked') {
    // Nothing armed: the failure stays on the status line; the {text} reply is the record, no toast.
    outcome = failedLine(stream, built.reason)
    flowStatus($, undefined)
    return { text: `pack: could not save stream "${stream}": ${built.reason.replace(/\.$/, '')}. No fresh start armed.` }
  }

  const pack = `${built.state.trimEnd()}\n\n${journalRule(stream)}`
  pending = { pack, createdAt: await $.clock.now(), cwd: await $.session.cwd(), stream }

  // --yes: no pane, so every outcome goes back as {text} (visible over Remote Control, unlike status/pane).
  // The 8,000-char cap is already enforced on the state by assemble().
  if (yes) {
    // $.command.run rejects inside the hook the run waits on (d.ts: command.run), so the /clear runs from a
    // $.clock.after dispatch, after the hook returned (same seam as load()). If the host still refuses, the human types /clear.
    phase = 'armed'
    rearmZones()
    await persist($)
    flowStatus($, 'Starting a fresh session...')
    $.clock.after(1, () => {
      $.command.run({ command: 'clear' }).catch(() => flowStatus($, READY))
    })
    return { text: `pack: stream "${stream}" saved (${savedNotes(stream, built)}). Starting a fresh session; if nothing happens, type /clear, or /pack cancel to stay.` }
  }

  phase = 'review'
  await persist($)
  flowStatus($, 'Saved. Check the pack, then clear & continue [c] or keep working [x]')
  await $.ui.open({ id: PANE, title: 'pack', focus: true, closeOnEscape: true })
  return {}
}

// ---------- load ----------

// Injection = $.prompt.submit({ asUser: true }): it starts a turn (so UNPACK_RULES can hold the model at its acknowledgement line), while a
// {text} / {context} answer of command.run only records a transcript line and starts no turn.
// The host REFUSES prompt.submit called from inside the command.run hook ("it would wait on the turn this hook is
// holding; submit from a later event"), so the submit runs from a $.clock.after dispatch, after the hook returned.
async function load($: EngineInterface, stream: string) {
  const path = statePath(stream)
  let state: string | null
  try {
    state = await readOptional($, path)
  } catch (err) {
    return { text: `unpack: cannot read the saved stream "${stream}": ${String(err)}` }
  }
  if (state === null) return { text: `unpack: no saved stream "${stream}" in this folder. Nothing loaded.` }

  const text = `${state.trimEnd()}\n\n${journalRule(stream)}\n\n${UNPACK_RULES}`
  $.clock.after(1, () => {
    $.prompt.submit({ text, asUser: true }).catch(err => {
      loadFailed($, `Loading stream "${stream}" failed: ${String(err)}. Try /unpack ${stream} again`)
    })
  })
  return { text: `unpack: loading stream "${stream}" as the first message.` }
}

// A failed injection: toast + sticky status line (the {text} reply already said "loading").
function loadFailed($: EngineInterface, text: string) {
  $.ui.toast(text, { timeoutMs: ERROR_TOAST_MS })
  outcome = { text: `\u26A0 ${shortReason(text)}`, sticky: true, prompted: false }
  paint($)
}

// ---------- hooks ----------

// Shared by /pack and /unpack: `prefix` names the command in the replies.
async function handle($: EngineInterface, args: ParsedArgs, prefix: 'pack' | 'unpack') {
  if ('error' in args) return { text: `${prefix}: ${args.error}` }
  if (args.verb === 'cancel') {
    if (saving) return { text: `${prefix}: a save is running and cannot be stopped; its outcome will show in the status line` }
    if (phase === 'idle') return { text: `${prefix}: nothing to cancel` }
    const text = await cancel($, phase === 'review')
    outcome = null
    paint($)
    return { text: `${prefix}: ${text}` }
  }
  if (phase !== 'idle' || saving) return {
      text: saving
        ? `${prefix}: a save is running, its outcome will show in the status line`
        : phase === 'review'
          ? `${prefix}: a pack is waiting for your review: clear & continue [c] or keep working [x]`
          : `${prefix}: ready for a fresh start: type /clear, or /pack cancel to stay`,
    }
  // A new command replaces the last outcome.
  if (outcome) {
    outcome = null
    paint($)
  }

  // stream = explicit arg (sticky binding) > last session_title seen > refuse
  const arg = args.stream
  if (arg !== undefined) {
    try {
      await bind($, () => {
        boundArg = arg
      })
    } catch (err) {
      $.ui.log(`pack: buffer flush failed: ${String(err)}`)
    }
  }
  const stream = current()
  if (!stream) {
    return { text: `${prefix}: no stream for this session. Type /pack save <name>, or /rename the session first.` }
  }

  if (args.verb === 'load') return load($, stream)

  if (args.verb === 'save') {
    saving = true
    startProgress($, () => `Saving stream "${stream}"`)
    // Not awaited: the hook returns at once. Whether the fork outlives the hook is proven live (plan T14).
    saveInBackground($, stream).catch(() => {
      saving = false
    })
    return { text: `${prefix}: save of stream "${stream}" started; the outcome will show in the status line` }
  }

  return packStream($, stream, args.yes)
}

export function registerPack(on: On) {
  on('session.start', async ($, e, next) => {
    const commands = [
      {
        name: 'pack',
        description: 'Save the progress of a stream, then continue it in a fresh session after /clear',
        argumentHint: 'save [stream] | cancel | [stream] [--yes]',
      },
      {
        name: 'unpack',
        description: 'Load a saved stream as the first message of this session',
        argumentHint: '<stream>',
      },
    ]
    for (const command of commands) {
      try {
        await $.command.register(command)
      } catch (err) {
        $.ui.log(`pack: command ${command.name} not registered: ${String(err)}`)
      }
    }
    return next(e)
  })

  on('command.run', { command: 'pack' }, ($, e) => handle($, parseArgs(e.args), 'pack'))
  on('command.run', { command: 'unpack' }, ($, e) => handle($, parseUnpackArgs(e.args), 'unpack'))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Markdown, Button } = $.ui.resolve(e)
    const pack = pending?.pack ?? ''
    const stream = pending?.stream ?? current()
    const isCut = pack.length > MARKDOWN_MAX
    const shown = isCut ? pack.slice(0, MARKDOWN_MAX - 200) : pack

    return (
      <Box flexDirection="column">
        <Text dimColor>
          {stream ? `Saved to ${statePath(stream)}` : 'Saved'}, {pack.length} chars{isCut ? ' (view truncated, full pack kept)' : ''}. Clear now to continue in a fresh session?
        </Text>
        <Markdown text={shown} />
        <Box flexDirection="row" gap={2}>
          <Button key="continue" hotkey="c" variant="primary" onPress={() => clearAndContinue($)}>
            clear & continue
          </Button>
          <Button key="cancel" hotkey="x" role="dismiss" onPress={() => cancel($, true)}>
            keep working
          </Button>
        </Box>
      </Box>
    )
  })

  // Trailer on screen. Closed: a tree in place of the row (reply without trailer + a pressable marker, trailer dim under it when expanded).
  // Streaming (unclosed): cheap text rewrite. Else untouched. Runs per distinct text while a reply streams: one includes() first.
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    try {
      const text = e.props.text
      if (typeof text !== 'string' || !text.includes(TRAILER_OPEN)) return next(e)
      const { body, trailers, kinds, unclosed } = splitTrailer(text)
      if (unclosed) return next({ ...e, props: { ...e.props, text: hideTrailer(text) } })
      if (trailers.length === 0) return next(e)
      // Markdown holds 10,000 chars at most; a longer body would be refused whole and draw the trailer: rewrite as text instead.
      if (body.length > MARKDOWN_MAX) return next({ ...e, props: { ...e.props, text: hideTrailer(text) } })

      const id = e.requestId
      const isOpen = expanded.has(id)
      const full = trailers.join('\n')
      const { Box, Text, Markdown, Button } = $.ui.resolve(e)
      return (
        <Box flexDirection="column">
          {body === '' ? null : <Markdown text={body} />}
          <Button
            key="ckpt-toggle"
            plain
            dimColor
            onPress={() => {
              if (expanded.has(id)) expanded.delete(id)
              else expanded.add(id)
              $.ui.invalidate('ui.render')
            }}
          >
            {`${isOpen ? '\u25BE' : '\u25B8'} ckpt${clauseList(kinds)}`}
          </Button>
          {isOpen ? <Text dimColor>{full.length > MARKDOWN_MAX ? `${full.slice(0, MARKDOWN_MAX - 1)}\u2026` : full}</Text> : null}
        </Box>
      )
    } catch {
      return next(e)
    }
  })

  // The three gating hooks below carry a `.catch`: a hook that fails is silently absent, so the handler lets the close, the prompt and the session through unchanged.
  // Esc / close mark while reviewing = cancel.
  on('ui.close', async ($, e, next) => {
    if (e.id === PANE && e.origin.kind === 'person' && phase === 'review') await cancel($, false)
    return next(e)
  }).catch(($, e, next) => {
    noteCaught($, 'ui.close', next.error)
    return next(e)
  })

  on('classic.UserPromptSubmit', async ($, e, next) => {
    if (outcome && !outcome.sticky) outcome.prompted = true
    try {
      await noteTitle($, e.session_title)
    } catch (err) {
      $.ui.log(`pack: title not read: ${String(err)}`)
    }
    return next(e)
  }).catch(($, e, next) => {
    noteCaught($, 'classic.UserPromptSubmit', next.error)
    return next(e)
  })

  on('classic.SessionStart', async ($, e, next) => {
    // Any source: the wall may differ (model), the fill starts over; seam, flags and the advice line re-arm. The last outcome goes.
    resetZones()
    outcome = null
    if (e.source !== 'clear') {
      // A new, resumed or forked session is another session: unbind and drop any armed pack.
      if (e.source === 'startup' || e.source === 'resume' || e.source === 'fork') {
        boundArg = null
        titleStream = null
        phase = 'idle'
        pending = null
        saving = false
        stopProgress()
        flowLine = undefined
        waiting = null
      }
      paint($)
      try {
        await noteTitle($, e.session_title)
      } catch (err) {
        $.ui.log(`pack: title not read: ${String(err)}`)
      }
      return next(e)
    }

    try {
      await noteTitle($, e.session_title)
    } catch {
      // the binding stays as it was
    }
    const pack = await armedPack($)
    if (phase === 'review') await $.ui.close({ id: PANE })
    await reset($)
    if (pack === null) return next(e)

    const restored = current()
    $.prompt.submit({ text: `${pack}\n\n${UNPACK_RULES}`, asUser: true }).catch(err => {
      loadFailed($, `Could not load the saved notes: ${String(err)}. Type /unpack ${restored ?? '<stream>'}`)
    })
    $.ui.toast(restored ? `Fresh session started with the saved notes of stream "${restored}"` : 'Fresh session started with the saved notes')
    return next(e)
  }).catch(($, e, next) => {
    noteCaught($, 'classic.SessionStart', next.error)
    return next(e)
  })

  // Context zones (T19): observe only. Acts when the context fill moved and a token count exists (absent right after /clear or a compact).
  on('session.measure', async ($, e, next) => {
    try {
      const tokens = e.context.tokens
      if (e.changed.includes('context') && tokens !== undefined && e.context.window > 0) await onMeasure($, tokens, e.context.window, e.context.percent)
    } catch (err) {
      try {
        $.ui.log(`pack: ctx measure failed: ${String(err)}`, { to: 'debug' })
      } catch {
        // nothing left to do
      }
    }
    return next(e)
  })

  // Journal capture: main loop only, completed turns only. Never throws into the engine.
  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined && !e.isAborted) {
      // Seam of the last main turn, for the advice. The d.ts does not order turn.complete against session.measure:
      // re-check the soft advice here with the last known fill, so either order works.
      try {
        outcomeTurnDone($)
        seam = seamOf(e.answer)
        if (lastM !== null && lastM.tokens < lastM.hardAt) {
          const action = adviceStep($, lastM.fill, lastM.pct)
          if (action.startsWith('advice')) ctxLog($, 'turn', lastM, action)
        }
      } catch {
        // observe only
      }
      try {
        await capture($, e.answer)
      } catch (err) {
        try {
          $.ui.toast(`Could not record this turn's checkpoint: ${String(err)}`, { timeoutMs: ERROR_TOAST_MS })
        } catch {
          // nothing left to do
        }
      }
    }
    return next(e)
  })
}
