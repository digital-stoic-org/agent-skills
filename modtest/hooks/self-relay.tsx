import type { EngineInterface, On } from 'claude-code'

// self-relay v2: one mod for context.
//   /self-relay save [stream]            fork -> relay-<stream>-llm.md (not awaited, no clear)
//   /self-relay [stream] [--yes|-y]      save (awaited) + review pane / arm + /clear + re-inject
//   /self-relay load <stream>            state file -> first message of this session
// Journal: every `<!-- ckpt ... -->` trailer of a main-loop answer is appended verbatim to journal/<stream>.md by code.
// The fork DESIGNATES (routing ids + fork-owned fields); code COPIES trailer text and assembles the state file.
// Plan: /praxis/repos/agent-skills/plan-self-relay-mod-llm.md

const PANE = 'self-relay'
const STORE_KEY = 'self-relay:pending'
const STALE_MS = 10 * 60 * 1000
const MARKDOWN_MAX = 10_000
// Hard cap of the state file, enforced by code (the fork prompt only asks for it).
const STATE_MAX = 8_000
const STREAM_RE = /^[a-zA-Z0-9_-]{1,50}$/
const RESERVED = ['save', 'load']
const SHRINK_LINE = 80

// Regime lines 1-4: /repos/agent-skills/team/skills/relay/SKILL.md §3 (md5 615b560cfe2e88c19763e668bf89570a at copy time).
// Line 5 (orchestrator, team-only) replaced by a solo line; line 6 added for v2 (read_first after the go).
const REGIME = `You are taking over this name. Announce [READY] on a single line and stop there.
Do nothing without my explicit go — no file read, no command, no sub-agent, no continuation of what is in progress.
Do not read the packet back to me. One line of acknowledgement is the whole answer.
You emit a message only on a state transition. The rest of the time you are silent.
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
- <path — role>   (closed list, read only after the human's go, never at [READY])
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
retire_reversed: <ids, e.g. c05>
Rules:
- Every list except read_if_needed, learnings, discarded, next and decisions is yours entirely, and for those five you give EXTRAS only: whatever the trailers below do not already say.
- Return the COMPLETE current content of every list you own: carry forward the still-valid lines of PREVIOUS STATE that have no (cNN) suffix.
- A line ending with (cNN) belongs to code: never output one.
- retire_answered: ids of open: / assumption: items (in PREVIOUS STATE or in the entries below) that are now resolved. retire_reversed: ids of decisions that were reversed. Omit a retire key when it is empty.
- A pointer (absolute path, path:line, command) replaces any explanation. Do not run commands; write them.
- Total ≤ 8,000 characters.`

type Phase = 'idle' | 'review' | 'armed'
type Pending = { packet: string; createdAt: number; cwd: string }
type Stored = Pending & { phase: Phase }

// Module scope: survives /clear (module not reloaded), lost on mod reload -> $.store backup.
let phase: Phase = 'idle'
let pending: Pending | null = null
// A save or a relay build is running (the fork is slow): refuse a second command meanwhile.
let saving = false
// Stream binding. Same session across /clear, so it survives /clear; reset on startup/resume/fork.
let boundArg: string | null = null
let titleStream: string | null = null
// Journal appends of this process, one at a time.
let journalQueue: Promise<unknown> = Promise.resolve()

// ---------- pure helpers ----------

export const pad = (n: number) => String(n).padStart(2, '0')
export const statePath = (stream: string) => `relay-${stream}-llm.md`
export const journalPath = (stream: string) => `journal/${stream}.md`
const bufferKey = (sid: string) => `self-relay:buffer:${sid}`

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

export type Verb = 'save' | 'load' | 'relay'
export type ParsedArgs = { verb: Verb; stream?: string; yes: boolean } | { error: string }

export function parseArgs(args: string): ParsedArgs {
  const tokens = args.split(/\s+/).filter(t => t !== '')
  const yes = tokens.some(t => t === '--yes' || t === '-y')
  const rest = tokens.filter(t => t !== '--yes' && t !== '-y')
  const bad = rest.find(t => t.startsWith('-'))
  if (bad) return { error: `unknown option ${bad}. Usage: /self-relay save [stream] | load <stream> | [stream] [--yes]` }
  let verb: Verb = 'relay'
  if (rest[0] === 'save' || rest[0] === 'load') verb = rest.shift() as Verb
  if (yes && verb !== 'relay') return { error: `--yes only goes with the relay form (/self-relay [stream] --yes)` }
  if (rest.length > 1) return { error: `too many arguments. Usage: /self-relay save [stream] | load <stream> | [stream] [--yes]` }
  const stream = rest[0]
  if (stream !== undefined) {
    if (RESERVED.includes(stream)) return { error: `"${stream}" is a reserved word, not a stream name` }
    if (!STREAM_RE.test(stream)) return { error: `invalid stream "${stream}": use 1-50 chars of a-z A-Z 0-9 _ -` }
  }
  return { verb, stream, yes }
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

const SCALARS_HEADER = ['stream', 'saved', 'status', 'predecessor', 'goal', 'journal', 'journal_cursor']
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
const parseState = (text: string) => parseKeyed(text, STATE_SCALARS, LISTS)

const FORK_SCALARS = ['status', 'goal', 'deliverable', 'retire_answered', 'retire_reversed']
export type ForkFields = { fields: Keyed; answered: Set<number>; reversed: Set<number> }
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
  return { fields, answered: ids(fields.scalars.retire_answered), reversed: ids(fields.scalars.retire_reversed) }
}

const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim()
const uniq = (lines: string[]) => [...new Set(lines)]

export type AssembleInput = {
  stream: string
  saved: string
  sid: string
  prev: string | null
  entries: Entry[]
  fork: ForkFields
}
export type Assembled = { kind: 'ok'; state: string; cursor: string; cut: string[] } | { kind: 'blocked'; reason: string }

// The core rule: the fork designated ids and wrote its own fields; every trailer-sourced line is copied by code.
export function assemble(input: AssembleInput): Assembled {
  const prev = input.prev ? parseState(input.prev) : null
  const { fields, answered, reversed } = input.fork

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

  // 2. retire: answered open/assumption items vanish, reversed decisions move to discarded with their id.
  const movedToDiscarded: string[] = []
  for (const sec of LISTS) {
    lists[sec] = uniq([...carried[sec], ...routed[sec]]).filter(line => {
      const id = idOf(line)
      if (id === null) return true
      if ((sec === 'next' || sec === 'unknowns') && answered.has(id)) return false
      if (sec === 'decisions' && reversed.has(id)) {
        movedToDiscarded.push(`${stripId(line)} — reversed (c${pad(id)})`)
        return false
      }
      return true
    })
  }

  // 3. fork-owned lines (id'd lines are code-owned and dropped).
  for (const sec of LISTS) {
    let own = (fields.lists[sec] ?? []).map(oneLine).filter(l => l !== '' && idOf(l) === null)
    if (sec === 'decisions') own = own.map(l => (l.includes('—') ? l : `${l} — why missing`))
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
  const predecessor = prevWriter && prevWriter !== input.sid ? prevWriter : prev?.scalars.predecessor || 'none'
  const scalars: Record<string, string> = {
    stream: input.stream,
    saved: `${input.saved} ${input.sid}`,
    status: oneLine(fields.scalars.status || prev?.scalars.status || 'unknown'),
    predecessor,
    goal: oneLine(fields.scalars.goal || prev?.scalars.goal || 'unknown'),
    journal: journalPath(input.stream),
    journal_cursor: cursor,
    deliverable: oneLine(fields.scalars.deliverable || prev?.scalars.deliverable || 'none'),
  }

  const render = () => {
    const head = SCALARS_HEADER.map(k => `${k}: ${scalars[k]}`).join('\n')
    const body = BODY_ORDER.map(k => (k === 'deliverable' ? `deliverable: ${scalars.deliverable}` : `${k}:${lists[k].map(l => `\n- ${l}`).join('')}`)).join('\n')
    return `${head}\n\n${body}\n`
  }

  // 5. hard cap, cut order: read_if_needed (compress), stale, in_progress. Never decisions, discarded, next, unknowns.
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
  if (over()) return { kind: 'blocked', reason: `state ${text.length} chars > ${STATE_MAX} after cutting ${cut.join(', ') || 'nothing cuttable'}; trim decisions/discarded/next/unknowns or prune the journal by hand. Nothing written.` }
  return { kind: 'ok', state: text, cursor, cut }
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
    return
  }
  const ids = await enqueue(() => appendEntries($, stream, items))
  if (ids) {
    if (buffered.length > 0) await $.store.delete(key)
  } else {
    await $.store.set(key, items)
    $.ui.toast(`self-relay: journal write failed, ${items.length} entr${items.length === 1 ? 'y' : 'ies'} kept in the store buffer`)
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

async function capture($: EngineInterface, answer: string) {
  const trailers = answer.match(/<!-- ckpt[\s\S]*?-->/g)
  if (!trailers) return
  const iso = new Date(await $.clock.now()).toISOString()
  const sid = await $.session.id()
  await ingest($, trailers.map(trailer => ({ trailer, iso, sid })))
}

// ---------- state build (fork + assembly + write) ----------

type Built = { kind: 'ok'; state: string; cursor: string; cut: string[] } | { kind: 'blocked'; reason: string }

function forkPrompt(prev: string | null, entries: Entry[]): string {
  const news = entries.length ? entries.map(e => `### ${e.id}\n${e.trailer}`).join('\n\n') : '(none)'
  return `${FORK_PROMPT}\n\nPREVIOUS STATE:\n${prev ?? '(none)'}\n\nJOURNAL ENTRIES TO ROUTE (after the cursor):\n${news}`
}

async function buildState($: EngineInterface, stream: string): Promise<Built> {
  try {
    const sid = await $.session.id()
    const prev = await readOptional($, statePath(stream))
    const journal = await readOptional($, journalPath(stream))
    const cursor = prev ? Number((parseState(prev).scalars.journal_cursor ?? '').replace(/^c/, '')) || 0 : 0
    const entries = parseJournal(journal ?? '').filter(e => e.n > cursor)

    const reply = await $.model.fork({ prompt: forkPrompt(prev, entries) })
    if (!reply.isAnswered) return { kind: 'blocked', reason: `fork failed (${reply.reason})` }
    const parsed = parseFork(reply.text)
    if (parsed.kind === 'blocked') return parsed
    const fork = parseForkBody(parsed.body)
    if (!fork) return { kind: 'blocked', reason: 'unparseable fork output' }

    const saved = new Date(await $.clock.now()).toISOString()
    const result = assemble({ stream, saved, sid, prev, entries, fork })
    if (result.kind === 'blocked') return result
    await $.fs.write(statePath(stream), result.state)
    return result
  } catch (err) {
    return { kind: 'blocked', reason: `error: ${String(err)}` }
  }
}

// `/self-relay save`: the command already returned; the outcome is a toast.
async function saveInBackground($: EngineInterface, stream: string) {
  try {
    const built = await buildState($, stream)
    $.ui.toast(
      built.kind === 'ok'
        ? `self-relay: ${stream} saved (${built.state.length} chars, cursor ${built.cursor}${built.cut.length ? `, cut: ${built.cut.join(', ')}` : ''})`
        : `self-relay: save blocked: ${built.reason}`,
    )
  } catch (err) {
    $.ui.toast(`self-relay: save failed: ${String(err)}`)
  } finally {
    saving = false
    $.ui.status(undefined)
  }
}

// ---------- relay flow (v1 unchanged from the packet on) ----------

async function reset($: EngineInterface) {
  phase = 'idle'
  pending = null
  await $.store.delete(STORE_KEY)
  $.ui.status(undefined)
}

async function persist($: EngineInterface) {
  if (pending) await $.store.set(STORE_KEY, { ...pending, phase } satisfies Stored)
}

async function cancel($: EngineInterface) {
  await reset($)
  await $.ui.close({ id: PANE })
  $.ui.toast('self-relay: cancelled')
}

async function clearAndRelay($: EngineInterface) {
  phase = 'armed'
  await persist($)
  await $.ui.close({ id: PANE })
  $.ui.status('self-relay: armed, clearing...')
  $.command.run({ command: 'clear' }).catch(() => {
    $.ui.status('self-relay armed: type /clear')
  })
}

// The packet to re-inject after /clear: module var first, else a fresh store entry from this cwd.
async function armedPacket($: EngineInterface): Promise<string | null> {
  if (phase === 'armed' && pending) return pending.packet
  const stored = (await $.store.get(STORE_KEY)) as Stored | undefined
  if (!stored || stored.phase !== 'armed') return null
  const now = await $.clock.now()
  if (now - stored.createdAt >= STALE_MS) return null
  if (stored.cwd !== (await $.session.cwd())) return null
  return stored.packet
}

async function relay($: EngineInterface, stream: string, yes: boolean) {
  saving = true
  $.ui.status('self-relay: writing state...')
  let built: Built
  try {
    built = await buildState($, stream)
  } finally {
    saving = false
  }
  if (built.kind === 'blocked') {
    $.ui.status(undefined)
    $.ui.toast(`self-relay: ${built.reason}`)
    return { text: `self-relay blocked: ${built.reason}` }
  }

  const packet = `${built.state.trimEnd()}\n\n${journalRule(stream)}`
  pending = { packet, createdAt: await $.clock.now(), cwd: await $.session.cwd() }

  // --yes: no pane, so every outcome goes back as {text} (visible over Remote Control, unlike status/pane).
  // The 8,000-char cap is already enforced on the state by assemble().
  if (yes) {
    // $.command.run rejects inside the hook the run waits on (d.ts: command.run), so the human types /clear.
    phase = 'armed'
    await persist($)
    $.ui.status('self-relay armed: type /clear')
    return { text: `self-relay: ${statePath(stream)} written (${built.state.length} chars), packet armed. Type /clear to relay it.` }
  }

  phase = 'review'
  await persist($)
  $.ui.status('self-relay: review the packet')
  await $.ui.open({ id: PANE, title: 'self-relay', focus: true, closeOnEscape: true })
  return {}
}

// ---------- load ----------

// Injection = $.prompt.submit({ asUser: true }): it starts a turn (so REGIME can hold the model at [READY]), while a
// {text} / {context} answer of command.run only records a transcript line and starts no turn.
// The host REFUSES prompt.submit called from inside the command.run hook ("it would wait on the turn this hook is
// holding; submit from a later event"), so the submit runs from a $.clock.after dispatch, after the hook returned.
async function load($: EngineInterface, stream: string) {
  const path = statePath(stream)
  let state: string | null
  try {
    state = await readOptional($, path)
  } catch (err) {
    return { text: `self-relay: cannot read ${path}: ${String(err)}` }
  }
  if (state === null) return { text: `self-relay: no state file ${path} in this directory. Nothing loaded.` }

  const text = `${state.trimEnd()}\n\n${journalRule(stream)}\n\n${REGIME}`
  $.clock.after(1, () => {
    $.prompt.submit({ text, asUser: true }).catch(err => {
      $.ui.toast(`self-relay: load failed: ${String(err)}`)
    })
  })
  return { text: `self-relay: loading ${path} (${state.length} chars) as the first message.` }
}

// ---------- hooks ----------

export function registerSelfRelay(on: On) {
  on('session.start', async ($, e, next) => {
    try {
      await $.command.register({
        name: 'self-relay',
        description: 'Save the session state to relay-<stream>-llm.md, relay it through /clear, or load it in a new session',
        argumentHint: 'save [stream] | load <stream> | [stream] [--yes]',
      })
    } catch (err) {
      $.ui.log(`self-relay: command not registered: ${String(err)}`)
    }
    return next(e)
  })

  on('command.run', { command: 'self-relay' }, async ($, e) => {
    const args = parseArgs(e.args)
    if ('error' in args) return { text: `self-relay: ${args.error}` }
    if (phase !== 'idle' || saving) return { text: `self-relay: already ${saving ? 'saving' : phase}` }

    // stream = explicit arg (sticky binding) > last session_title seen > refuse
    const arg = args.stream
    if (arg !== undefined) {
      try {
        await bind($, () => {
          boundArg = arg
        })
      } catch (err) {
        $.ui.log(`self-relay: buffer flush failed: ${String(err)}`)
      }
    }
    const stream = current()
    if (!stream) {
      return { text: 'self-relay: no stream. Pass one (/self-relay save <stream>) or /rename this session first.' }
    }

    if (args.verb === 'load') return load($, stream)

    if (args.verb === 'save') {
      saving = true
      $.ui.status(`self-relay: saving ${stream}...`)
      // Not awaited: the hook returns at once. Whether the fork outlives the hook is proven live (plan T14).
      saveInBackground($, stream).catch(() => {
        saving = false
      })
      return { text: `self-relay: saving ${stream}...` }
    }

    return relay($, stream, args.yes)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Markdown, Button } = $.ui.resolve(e)
    const packet = pending?.packet ?? ''
    const isCut = packet.length > MARKDOWN_MAX
    const shown = isCut ? packet.slice(0, MARKDOWN_MAX - 200) : packet

    return (
      <Box flexDirection="column">
        <Text dimColor>
          relay packet: {packet.length} chars{isCut ? ' (view truncated, full packet kept)' : ''}
        </Text>
        <Markdown text={shown} />
        <Box flexDirection="row" gap={2}>
          <Button key="relay" hotkey="c" variant="primary" onPress={() => clearAndRelay($)}>
            clear & relay
          </Button>
          <Button key="cancel" hotkey="x" role="dismiss" onPress={() => cancel($)}>
            cancel
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

  // Esc / close mark while reviewing = cancel.
  on('ui.close', async ($, e, next) => {
    if (e.id === PANE && e.origin.kind === 'person' && phase === 'review') await reset($)
    return next(e)
  })

  on('classic.UserPromptSubmit', async ($, e, next) => {
    try {
      await noteTitle($, e.session_title)
    } catch (err) {
      $.ui.log(`self-relay: title not read: ${String(err)}`)
    }
    return next(e)
  })

  on('classic.SessionStart', async ($, e, next) => {
    if (e.source !== 'clear') {
      // A new, resumed or forked session is another session: unbind and drop any armed packet.
      if (e.source === 'startup' || e.source === 'resume' || e.source === 'fork') {
        boundArg = null
        titleStream = null
        phase = 'idle'
        pending = null
        saving = false
      }
      try {
        await noteTitle($, e.session_title)
      } catch (err) {
        $.ui.log(`self-relay: title not read: ${String(err)}`)
      }
      return next(e)
    }

    try {
      await noteTitle($, e.session_title)
    } catch {
      // the binding stays as it was
    }
    const packet = await armedPacket($)
    if (phase === 'review') await $.ui.close({ id: PANE })
    await reset($)
    if (packet === null) return next(e)

    $.prompt.submit({ text: `${packet}\n\n${REGIME}`, asUser: true }).catch(err => {
      $.ui.toast(`self-relay: re-inject failed: ${String(err)}`)
    })
    $.ui.toast('self-relay: packet re-injected')
    return next(e)
  })

  // Journal capture: main loop only, completed turns only. Never throws into the engine.
  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined && !e.isAborted) {
      try {
        await capture($, e.answer)
      } catch (err) {
        try {
          $.ui.toast(`self-relay: capture failed: ${String(err)}`)
        } catch {
          // nothing left to do
        }
      }
    }
    return next(e)
  })
}
