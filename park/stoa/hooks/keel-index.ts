// keel index: zones, reference resolution, per-entry assessment. Pure: no `$` here (plugin validate follows `$` only inside one file, F-e); the I/O half is in keel.ts.
// Spec: SPEC-keel-llm.md §3.4, §4, §5.

import { anchorSections, parseChild, STAMP_LEN, withStamp } from './keel-core.ts'
import type { Entry, RefKind, StampState } from './keel-core.ts'

// ── zones (§4) ──────────────────────────────────────────────────────────────

export type Zones = { ignore: string[]; frozen: string[] }
export const DEFAULT_ZONES: Zones = { ignore: ['park', 'archive', 'node_modules', '.git', '.tmp', '.dump', 'build'], frozen: ['in', '.in'] }
export const ZONES_FILE = '.stoa-keel.yml'

function listValue(rest: string): string[] {
  const body = rest.trim().replace(/^\[/, '').replace(/\]\s*(#.*)?$/, '')
  return body
    .split(',')
    .map(s => s.trim().replace(/^(["'])(.*)\1$/, '$2'))
    .filter(Boolean)
}

// Minimal YAML subset: `ignore:` / `frozen:` as a flow list or a block list. A key it does not set keeps the default.
export function parseZones(yml: string): Zones {
  const out: Zones = { ignore: [...DEFAULT_ZONES.ignore], frozen: [...DEFAULT_ZONES.frozen] }
  const lines = yml.split('\n').map(l => l.replace(/\r$/, ''))
  for (let i = 0; i < lines.length; i++) {
    const m = /^(ignore|frozen)[ \t]*:(.*)$/.exec(lines[i]!)
    if (!m) continue
    const key = m[1] as keyof Zones
    const rest = m[2]!.trim()
    if (rest && !rest.startsWith('#')) {
      out[key] = listValue(rest)
      continue
    }
    const items: string[] = []
    for (let n = i + 1; n < lines.length; n++) {
      const it = /^[ \t]*-[ \t]+(.*)$/.exec(lines[n]!)
      if (!it) {
        if (lines[n]!.trim()) break
        continue
      }
      items.push(it[1]!.trim().replace(/\s+#.*$/, '').replace(/^(["'])(.*)\1$/, '$2'))
      i = n
    }
    out[key] = items.filter(Boolean)
  }
  return out
}

export const hasSegment = (path: string, names: readonly string[]): boolean => path.split('/').some(s => names.includes(s))

// ── paths ───────────────────────────────────────────────────────────────────

export function normalizePath(path: string): string {
  const abs = path.startsWith('/')
  const out: string[] = []
  for (const seg of path.split('/')) {
    if (!seg || seg === '.') continue
    if (seg === '..') {
      if (out.length && out[out.length - 1] !== '..') out.pop()
      else if (!abs) out.push('..')
    } else out.push(seg)
  }
  return (abs ? '/' : '') + out.join('/')
}

// Root-relative when the target is inside the chantier root, absolute otherwise.
export function toTarget(root: string, ref: string): string {
  const full = normalizePath(ref.startsWith('/') ? ref : `${root}/${ref}`)
  return full === root ? '' : full.startsWith(`${root}/`) ? full.slice(root.length + 1) : full
}

export const absOf = (root: string, target: string): string => (target.startsWith('/') ? target : `${root}/${target}`)

const baseKey = (path: string): string => (path.split('/').pop() ?? path).replace(/\.md$/i, '').toLowerCase()

// Obsidian-style: unique basename (case-insensitive); a name with '/' matches by path suffix. 0 or >1 hits -> null.
export function resolveWikilink(name: string, mdFiles: readonly string[]): string | null {
  const want = name.replace(/\.md$/i, '').toLowerCase()
  const hits = want.includes('/')
    ? mdFiles.filter(f => f.replace(/\.md$/i, '').toLowerCase().endsWith(`/${want}`) || f.replace(/\.md$/i, '').toLowerCase() === want)
    : mdFiles.filter(f => baseKey(f) === want)
  return hits.length === 1 ? hits[0]! : null
}

// ── index ───────────────────────────────────────────────────────────────────

export type EntryRec = {
  raw: string
  ref: string
  kind: RefKind
  anchor?: string
  stamp: StampState
  scope: 'file' | string // 'file' or the heading of the section holding the declaration
  // root-relative path, absolute path outside root, or null when opaque (url) or unresolved (wikilink 0 / >1 hit)
  target: string | null
  line: number
}
export type ChildRec = { mtime: number; size: number; entries: EntryRec[] }
export type SourceRec = {
  mtime: number
  size: number
  blob: string // full 40 hex git blob id of the whole content
  sections: Record<string, string> // H2/H3 heading -> blob id of the section text
  missing?: boolean
  unreadable?: string // e.g. over the 4 MiB read cap
}
export type Index = {
  v: 1
  root: string
  zones: Zones
  children: Record<string, ChildRec>
  sources: Record<string, SourceRec>
  md: string[] // every non-ignored markdown file (wikilink resolution)
  sweptAt: number
  degraded: string[]
  injected?: string[] // suspectKey()s already handed to the model (SessionStart, prompt.submit, PostToolUse): only new ones go out next
  reviewed?: Record<string, Record<string, string>> // §3.4 `updated`: child -> entryId -> source stamp the agent saw when it wrote the child; consumed at the next boundary
  turn?: string[] // D10: suspectKey()s alive when the turn began (SessionStart, prompt.submit): a suspect outside it was created this turn
  blocked?: true // D10: the Stop block was spent this turn; reset when the next turn begins
  since?: Record<string, number> // suspectKey -> epoch ms it was first seen, for keel-status-llm.md; pruned with the suspects
  toasted?: string // text of the toast already shown this turn (a Stop re-entry does not repeat it); reset when the next turn begins
  stamped?: string[] // children keel re-stamped at a boundary and has not told the model about yet (the host reports them as edited)
}

export const indexKey = (root: string): string => `keel:${root}`

export const emptyIndex = (root: string, zones: Zones = DEFAULT_ZONES): Index => ({ v: 1, root, zones, children: {}, sources: {}, md: [], sweptAt: 0, degraded: [] })

export const isIdle = (ix: Index): boolean => Object.keys(ix.children).length === 0

// children -> sources. Computed, never persisted (D5).
export function reverseOf(ix: Index): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const [child, rec] of Object.entries(ix.children))
    for (const e of rec.entries) {
      if (e.target === null) continue
      const list = (out[e.target] ??= [])
      if (!list.includes(child)) list.push(child)
    }
  return out
}

function toRec(e: Entry, root: string, md: readonly string[]): EntryRec {
  const rec: EntryRec = {
    raw: e.raw,
    ref: e.ref,
    kind: e.kind,
    stamp: e.stamp,
    scope: e.scope.type === 'file' ? 'file' : e.scope.heading,
    target: null,
    line: e.line,
  }
  if (e.anchor) rec.anchor = e.anchor
  if (e.kind === 'path') rec.target = toTarget(root, e.ref)
  else if (e.kind === 'wikilink') rec.target = resolveWikilink(e.ref, md)
  return rec
}

export function buildChild(text: string, mtime: number, size: number, root: string, md: readonly string[]): ChildRec {
  return { mtime, size, entries: parseChild(text).map(e => toRec(e, root, md)) }
}

// ── assessment (§3.4), pure ─────────────────────────────────────────────────

export type Reason = 'changed' | 'anchor-missing' | 'source-missing' | 'source-parked' | 'bad-stamp'
export type EntryState =
  | { kind: 'clean' }
  | { kind: 'pending-stamp'; current: string } // no stamp yet: code stamps at the next boundary
  | { kind: 'ok-requested'; current: string } // `@ok`: code re-stamps at the next boundary
  | { kind: 'suspect'; reason: Reason; old?: string; current?: string }
  | { kind: 'opaque' } // url, or any ref that is not a file
  | { kind: 'unresolved' } // wikilink with 0 or >1 hits: listed, never checked, never suspect
  | { kind: 'unreadable'; why: string } // source could not be hashed (e.g. over the read cap): never suspect

// The first 12 hex of the blob the entry currently points at, or the reason it points at nothing.
export function currentStamp(ix: Index, e: EntryRec): { stamp: string } | { reason: Reason } | { unreadable: string } {
  if (e.target === null) throw new Error('currentStamp needs a resolved target')
  // zone names match segments of root-relative paths only; an absolute path outside root is never parked
  if (!e.target.startsWith('/') && hasSegment(e.target, ix.zones.ignore)) return { reason: 'source-parked' }
  const s = ix.sources[e.target]
  if (!s || s.missing) return { reason: 'source-missing' }
  if (s.unreadable) return { unreadable: s.unreadable }
  if (!e.anchor) return { stamp: s.blob.slice(0, STAMP_LEN) }
  const sec = s.sections[e.anchor.trimEnd()]
  return sec ? { stamp: sec.slice(0, STAMP_LEN) } : { reason: 'anchor-missing' }
}

export function assessEntry(ix: Index, e: EntryRec): EntryState {
  if (e.kind === 'url') return { kind: 'opaque' }
  if (e.target === null) return { kind: 'unresolved' }
  const cur = currentStamp(ix, e)
  if ('reason' in cur) return { kind: 'suspect', reason: cur.reason }
  if ('unreadable' in cur) return { kind: 'unreadable', why: cur.unreadable }
  switch (e.stamp.kind) {
    case 'none':
      return { kind: 'pending-stamp', current: cur.stamp }
    case 'ok':
      return { kind: 'ok-requested', current: cur.stamp }
    case 'bad':
      return { kind: 'suspect', reason: 'bad-stamp', old: e.stamp.raw, current: cur.stamp }
    case 'hex':
      return e.stamp.value === cur.stamp ? { kind: 'clean' } : { kind: 'suspect', reason: 'changed', old: e.stamp.value, current: cur.stamp }
  }
}

export type Suspect = { child: string; entry: EntryRec; reason: Reason; old?: string; current?: string }

export function suspectsOf(ix: Index): Suspect[] {
  const out: Suspect[] = []
  for (const child of Object.keys(ix.children).sort())
    for (const entry of ix.children[child]!.entries) {
      const st = assessEntry(ix, entry)
      if (st.kind === 'suspect') out.push({ child, entry, reason: st.reason, ...(st.old ? { old: st.old } : {}), ...(st.current ? { current: st.current } : {}) })
    }
  return out
}

// ── injection (§6, §12), pure ───────────────────────────────────────────────

export const INJECT_CAP_START = 4000
export const INJECT_CAP_PROMPT = 2000
export const INJECT_MAX_ENTRIES = 20
export const WATCH_CAP = 200

export const suspectKey = (s: Suspect): string => `${s.child}|${s.entry.ref}|${s.entry.anchor ?? ''}|${s.reason}|${s.current ?? ''}`

// Suspects the model has not been told about yet.
export function newSuspects(ix: Index, all: readonly Suspect[] = suspectsOf(ix)): Suspect[] {
  const seen = new Set(ix.injected ?? [])
  return all.filter(s => !seen.has(suspectKey(s)))
}

// Records `told` as injected and forgets keys that are no longer suspect, so a suspect that clears and comes back is told again.
export function markInjected(ix: Index, told: readonly Suspect[]): void {
  const live = new Set(suspectsOf(ix).map(suspectKey))
  const keep = new Set([...(ix.injected ?? []), ...told.map(suspectKey)])
  ix.injected = [...keep].filter(k => live.has(k)).sort()
}

const line = (s: Suspect): string => `- ${s.child} <- ${s.entry.ref}${s.entry.anchor ? `#${s.entry.anchor}` : ''} (${s.reason})`

// One block for the model: at most INJECT_MAX_ENTRIES lines then "N more", at most `cap` chars. Null when there is nothing to say.
export function formatSuspects(head: string, list: readonly Suspect[], cap: number): string | null {
  if (list.length === 0) return null
  const shown = list.slice(0, INJECT_MAX_ENTRIES).map(line)
  let more = list.length - shown.length
  let body = `${head}\n${shown.join('\n')}`
  while (shown.length > 1 && body.length + (more ? 20 : 0) > cap) {
    shown.pop()
    more++
    body = `${head}\n${shown.join('\n')}`
  }
  return more ? `${body}\n- ${more} more (see /keel)` : body
}

export const GUIDE = 'For each: update the derived file, OR if its content still holds replace the stamp with @ok.'

// ── turn, Stop block (§7, D10), pure ────────────────────────────────────────

export const STOP_CAP = 10000
export const STOP_MAX = 10

// A turn begins (SessionStart, prompt.submit): what is suspect now is old news, the Stop block is available again.
export function startTurn(ix: Index): void {
  ix.turn = suspectsOf(ix).map(suspectKey).sort()
  delete ix.blocked
  delete ix.toasted
}

// The host reports a file keel rewrote as "edited"; the agent must be told that edit is keel's stamp, not someone else's.
export function noteStamped(ix: Index, files: readonly string[]): void {
  if (files.length) ix.stamped = [...new Set([...(ix.stamped ?? []), ...files])].sort()
}

export function formatStamped(files: readonly string[]): string {
  const shown = files.length > STOP_MAX ? `${files.slice(0, STOP_MAX).join(', ')} and ${files.length - STOP_MAX} more` : files.join(', ')
  return `keel re-stamped ${shown} (stamp lines only). A notice that ${files.length > 1 ? 'these files were' : 'this file was'} edited is keel's own write, not someone else's edit.`
}

// Suspects that did not exist when the turn began. Without a turn base nothing is "created this turn": no base, no block.
export function createdThisTurn(ix: Index): Suspect[] {
  if (!ix.turn) return []
  const base = new Set(ix.turn)
  return suspectsOf(ix).filter(s => !base.has(suspectKey(s)))
}

// Stamps the first sighting of each live suspect and forgets the cleared ones.
export function touchSince(ix: Index, now: number): void {
  const live = suspectsOf(ix).map(suspectKey)
  const next: Record<string, number> = {}
  for (const k of live) next[k] = ix.since?.[k] ?? now
  ix.since = next
}

const OMITTED = '  diff: omitted (message cap)'

export type StopItem = { s: Suspect; diff: string }

// §7: the message of the one Stop block per turn. At most STOP_CAP chars: the diffs share what the list and the footer leave (each is already capped by DIFF_CAP).
export function formatStopBlock(items: readonly StopItem[], more: number, rewritten: readonly string[], cap = STOP_CAP): string {
  const head = 'keel: sources changed this turn, derived files not reviewed:'
  const tail = [GUIDE, ...(rewritten.length ? [`keel rewrote stamps in: ${rewritten.join(', ')} (re-read before editing).`] : [])]
  const moreLine = more > 0 ? [`- ${more} more (see /keel)`] : []
  // each item may end up with the 'omitted' line instead of a diff: reserve it up front so the cap holds
  let room = cap - [head, ...moreLine, ...tail].join('\n').length - items.reduce((n, i) => n + line(i.s).length + 1 + OMITTED.length + 1, 0) - 1
  const out = [head]
  for (const it of items) {
    out.push(line(it.s))
    if (!it.diff) continue
    const body = it.diff.split('\n').map(l => `    ${l}`).join('\n')
    const cost = body.length + '\n  diff:'.length
    if (cost <= room) {
      out.push('  diff:', body)
      room -= cost
    } else if (room > 200) {
      out.push('  diff:', `${body.slice(0, room - 60).trimEnd()}\n    ... diff truncated (message cap)`)
      room = 0
    } else out.push(OMITTED)
  }
  return [...out, ...moreLine, ...tail].join('\n')
}

// §9: keel-status-llm.md. Rewritten at Stop while the index is non-empty. The `swept:` line is the only one that moves on its own (see sameStatus).
export function statusText(ix: Index, iso: string): string {
  const list = suspectsOf(ix)
  const rows = list.map(s => {
    const t = ix.since?.[suspectKey(s)]
    return `- ${s.child} <- ${s.entry.ref}${s.entry.anchor ? `#${s.entry.anchor}` : ''} (${s.reason})${t === undefined ? '' : ` since ${new Date(t).toISOString()}`}`
  })
  return ['---', 'type: keel-status', `swept: ${iso}`, '---', `suspects: ${list.length ? list.length : 'none'}`, ...rows, ...(ix.degraded.length ? ['degraded:', ...ix.degraded.map(d => `- ${d}`)] : []), ''].join('\n')
}

export const sameStatus = (a: string, b: string): boolean => a.replace(/^swept: .*$/m, '') === b.replace(/^swept: .*$/m, '')

// Suspects that hang off one of `targets` (sources that just moved).
export const derivedFrom = (ix: Index, targets: readonly string[]): Suspect[] => suspectsOf(ix).filter(s => s.entry.target !== null && targets.includes(s.entry.target))

// Absolute paths of the indexed sources that exist, for the host's file watcher (classic.SessionStart watchPaths).
export const watchTargets = (ix: Index): string[] =>
  indexedTargets(ix)
    .filter(t => ix.sources[t] && !ix.sources[t]!.missing)
    .map(t => absOf(ix.root, t))
    .slice(0, WATCH_CAP)

// ── command replies (§10), pure ────────────────────────────────────────────

export const REPLY_MAX = 50

export function stateLabel(ix: Index, e: EntryRec): string {
  const st = assessEntry(ix, e)
  switch (st.kind) {
    case 'clean':
      return 'clean'
    case 'pending-stamp':
      return 'no stamp yet (written at the next turn end)'
    case 'ok-requested':
      return '@ok (re-stamped at the next turn end)'
    case 'suspect':
      return `suspect: ${st.reason}`
    case 'opaque':
      return 'opaque (never checked)'
    case 'unresolved':
      return 'unresolved (never checked)'
    case 'unreadable':
      return `unreadable: ${st.why}`
  }
}

const stampLabel = (e: EntryRec): string => (e.stamp.kind === 'none' ? 'no stamp' : e.stamp.kind === 'ok' ? '@ok' : e.stamp.kind === 'hex' ? `@${e.stamp.value}` : `@${e.stamp.raw} (bad)`)

// `/keel`: the suspects with reason and age, then the size of the index and what is degraded.
export function formatOverview(ix: Index, iso: (ms: number) => string): string {
  const children = Object.keys(ix.children).length
  if (children === 0) return `keel: nothing declared under ${ix.root} (no sources: found). A derived file created outside the agent's tools is only seen by /keel scan.${ix.degraded.length ? `\ndegraded: ${ix.degraded.join('; ')}` : ''}`
  const list = suspectsOf(ix)
  const rows = list.slice(0, REPLY_MAX).map(s => {
    const t = ix.since?.[suspectKey(s)]
    return `${line(s)}${t === undefined ? '' : ` since ${iso(t)}`}`
  })
  const out = [list.length ? `keel: ${list.length} suspect${list.length > 1 ? 's' : ''}` : 'keel: no suspect', ...rows]
  if (list.length > rows.length) out.push(`- ${list.length - rows.length} more (see keel-status-llm.md)`)
  out.push(`${children} derived file${children > 1 ? 's' : ''}, ${indexedTargets(ix).length} source${indexedTargets(ix).length > 1 ? 's' : ''}${ix.sweptAt ? `; swept ${iso(ix.sweptAt)}` : ''}`)
  if (ix.degraded.length) out.push(`degraded: ${ix.degraded.join('; ')}`)
  return out.join('\n')
}

// `/keel why <file>`: what the file derives from (with the state of each entry) and what derives from it.
export function formatWhy(ix: Index, arg: string, target: string): string {
  const own = ix.children[target]
  const inbound = reverseOf(ix)[target] ?? []
  if (!own && inbound.length === 0) return `keel: ${arg} is neither a derived file nor an indexed source.`
  const out = [`keel why ${target}`]
  if (own) {
    out.push('derives from:')
    for (const e of own.entries) out.push(`- ${sourceName(e)} ${stampLabel(e)} - ${stateLabel(ix, e)}`)
  }
  if (inbound.length) {
    out.push('derived files:')
    for (const child of inbound)
      for (const e of ix.children[child]!.entries.filter(x => x.target === target)) out.push(`- ${child} (${sourceName(e)} ${stampLabel(e)} - ${stateLabel(ix, e)})`)
  }
  return out.join('\n')
}

// ── stamping (§3.4, D14), pure ──────────────────────────────────────────────

// §3.4 `updated`: a suspect child written by the agent during the turn counts as reviewed for its changed entries. Not confirmed by Mat: one constant.
export const UPDATED_RULE = true

export type GestureKind = 'stamp' | 'ok' | 'updated' | 'manual'
export type Gesture = { kind: GestureKind; child: string; source: string; old: string; stamp: string }
export type StampOp = { child: string; entry: EntryRec; kind: 'stamp' | 'ok' | 'updated'; stamp: string }

const WHO: Record<GestureKind, string> = { stamp: 'keel', ok: 'agent', updated: 'keel', manual: 'hand' }

export const entryId = (e: EntryRec): string => `${e.kind}|${e.ref}|${e.anchor ?? ''}|${e.scope}`

export const sourceName = (e: EntryRec): string => `${e.kind === 'wikilink' ? `[[${e.ref}]]` : e.ref}${e.anchor ? `#${e.anchor}` : ''}`

const oldStamp = (e: EntryRec): string => (e.stamp.kind === 'none' ? 'none' : e.stamp.kind === 'ok' ? 'ok' : e.stamp.kind === 'hex' ? e.stamp.value : e.stamp.raw)

export const gestureOf = (kind: GestureKind, child: string, e: EntryRec, stamp: string): Gesture => ({ kind, child, source: sourceName(e), old: oldStamp(e), stamp })

// §9: `<iso> <stamp|ok|updated|manual> <child> <- <source>[#a] <old>-><new> (<who>)`
export const journalLine = (g: Gesture, iso: string): string => `${iso} ${g.kind} ${g.child} <- ${g.source} ${g.old}->${g.stamp} (${WHO[g.kind]})`

// What the next boundary writes: absent stamps, `@ok`, and (UPDATED_RULE) changed entries of a child written since the source moved last.
export function stampPlan(ix: Index): StampOp[] {
  const out: StampOp[] = []
  for (const child of Object.keys(ix.children).sort())
    for (const entry of ix.children[child]!.entries) {
      const st = assessEntry(ix, entry)
      if (st.kind === 'pending-stamp') out.push({ child, entry, kind: 'stamp', stamp: st.current })
      else if (st.kind === 'ok-requested') out.push({ child, entry, kind: 'ok', stamp: st.current })
      else if (UPDATED_RULE && st.kind === 'suspect' && st.reason === 'changed' && st.current && ix.reviewed?.[child]?.[entryId(entry)] === st.current) out.push({ child, entry, kind: 'updated', stamp: st.current })
    }
  return out
}

// The agent wrote `child`: remember, per changed entry, the source stamp it was written against. A later source move leaves the entry suspect.
export function markReviewed(ix: Index, child: string): void {
  if (!UPDATED_RULE) return
  const rec = ix.children[child]
  if (!rec) return
  const seen: Record<string, string> = {}
  for (const e of rec.entries) {
    const st = assessEntry(ix, e)
    if (st.kind === 'suspect' && st.reason === 'changed' && st.current) seen[entryId(e)] = st.current
  }
  if (Object.keys(seen).length) (ix.reviewed ??= {})[child] = { ...(ix.reviewed?.[child] ?? {}), ...seen }
}

// Entries whose stamp was changed by hand to the current hash (§3.4 `manual`): was a stale/bad stamp in `prev`, is now the current one.
export function manualStamps(ix: Index, child: string, prev: ChildRec | undefined, next: ChildRec): Gesture[] {
  if (!prev) return []
  const out: Gesture[] = []
  for (const e of next.entries) {
    if (e.stamp.kind !== 'hex') continue
    const was = prev.entries.find(p => entryId(p) === entryId(e))
    if (!was || (was.stamp.kind !== 'hex' && was.stamp.kind !== 'bad') || oldStamp(was) === e.stamp.value) continue
    if (assessEntry(ix, e).kind === 'clean') out.push(gestureOf('manual', child, was, e.stamp.value))
  }
  return out
}

// ── diff (§8, D9), pure ─────────────────────────────────────────────────────

export const DIFF_CAP = 3000 // per diff, in the Stop block (K7)
export const FEEDBACK_DIFF_CAP = 1200 // per diff, in the PostToolUse feedback
export const FEEDBACK_DIFFS = 3 // diffs shown in one feedback block, the others are only listed
export const BLOB_STORE_MAX = 50 // `git hash-object -w` calls per boundary

// The text a stamp covers: the whole source, or the anchored section (same lookup as the index hash). Null when the heading is gone.
export function stampedText(text: string, anchor: string | undefined): string | null {
  if (!anchor) return text
  return anchorSections(text).get(anchor.trimEnd())?.text ?? null
}

// `git diff` of two blobs starts with `diff --git a/<sha> b/<sha>`, `index ...`, `--- a/<sha>`, `+++ b/<sha>`: only the hunks mean something.
export function trimDiff(out: string, cap: number): string | null {
  const at = out.indexOf('@@')
  const body = (at < 0 ? out : out.slice(at)).trimEnd()
  if (!body) return null
  return body.length <= cap ? body : `${body.slice(0, cap).trimEnd()}\n... diff truncated (${body.length - cap} more chars)`
}

// Only a `changed` entry with a hex stamp has an old blob to compare with.
export const diffable = (s: Suspect): s is Suspect & { old: string; current: string } => s.reason === 'changed' && /^[0-9a-f]{12}$/.test(s.old ?? '') && !!s.current

const BEFORE = new Set([' ', '\t', '"', "'", '[', ',', ';', ':'])
const AFTER = new Set([' ', '\t', '"', "'", ']', ',', ';', '#', '\r'])

// First occurrence of `raw` delimited like a list item / flow item / `;` item (so `a.md` never matches inside `data.md`).
function findBounded(line: string, raw: string): number {
  for (let i = line.indexOf(raw); i >= 0; i = line.indexOf(raw, i + 1)) {
    const before = i === 0 ? ' ' : line[i - 1]!
    const after = i + raw.length >= line.length ? ' ' : line[i + raw.length]!
    if (BEFORE.has(before) && AFTER.has(after)) return i
  }
  return -1
}

// Replaces the stamp of each op's entry in place (the entry's line, its raw text). `failed` = ops whose raw text was not found where the parse saw it.
export function rewriteStamps(text: string, ops: readonly { entry: EntryRec; stamp: string }[]): { text: string; done: number[]; failed: number[] } {
  const lines = text.split('\n')
  const done: number[] = []
  const failed: number[] = []
  ops.forEach((op, i) => {
    const l = lines[op.entry.line]
    const pos = l === undefined ? -1 : findBounded(l, op.entry.raw)
    if (l === undefined || pos < 0) return void failed.push(i)
    lines[op.entry.line] = l.slice(0, pos) + withStamp(op.entry.raw, op.stamp) + l.slice(pos + op.entry.raw.length)
    done.push(i)
  })
  return { text: lines.join('\n'), done, failed }
}

const STORE_CAP = 4 * 1024 * 1024

export const indexedTargets = (ix: Index): string[] => [...new Set(Object.values(ix.children).flatMap(c => c.entries.flatMap(e => (e.target === null ? [] : [e.target]))))].sort()

// Drops section blobs first, then sources entirely, when the serialized index passes the store cap (§12).
export function trimIndex(ix: Index): Index {
  if (JSON.stringify(ix).length <= STORE_CAP) return ix
  const lean: Index = { ...ix, sources: Object.fromEntries(Object.entries(ix.sources).map(([k, v]) => [k, { ...v, sections: {} }])), degraded: [...ix.degraded, 'section blobs dropped (index too large)'] }
  return JSON.stringify(lean).length <= STORE_CAP ? lean : { ...lean, md: [], degraded: [...lean.degraded, 'index too large'] }
}
