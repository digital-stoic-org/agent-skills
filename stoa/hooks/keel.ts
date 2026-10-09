// keel hooks module: L1/L3 sweeps (I/O through `$`) and the event hooks. Every helper taking `$` is a top-level function declaration
// in THIS file (plugin validate, F-a/F-e); the pure half lives in keel-index.ts and keel-core.ts.
// Spec: SPEC-keel-llm.md §5, §6, §11, §12.

import type { EngineInterface, On } from 'claude-code'
import { STAMP_LEN, anchorSections, blobSha } from './keel-core.ts'
import { BLOB_STORE_MAX, DEFAULT_ZONES, DIFF_CAP, FEEDBACK_DIFFS, FEEDBACK_DIFF_CAP, GUIDE, INJECT_CAP_PROMPT, INJECT_CAP_START, STOP_MAX, ZONES_FILE, absOf, buildChild, createdThisTurn, derivedFrom, diffable, emptyIndex, formatOverview, formatStamped, formatStopBlock, formatSuspects, formatWhy, gestureOf, hasSegment, indexKey, indexedTargets, isIdle, journalLine, manualStamps, markInjected, markReviewed, newSuspects, noteStamped, parseZones, resolveWikilink, rewriteStamps, sameStatus, stampPlan, stampedText, startTurn, statusText, suspectsOf, toTarget, touchSince, trimDiff, trimIndex, watchTargets } from './keel-index.ts'
import type { ChildRec, EntryRec, Gesture, Index, SourceRec, Suspect, Zones } from './keel-index.ts'

// ── I/O ─────────────────────────────────────────────────────────────────────

const BINARY_EXT = /\.(pdf|png|jpe?g|gif|webp|bmp|ico|docx?|xlsx?|pptx?|zip|gz|tar|7z|mp3|mp4|mov|wav)$/i
const SWEEP_BUDGET_MS = 8000

const clock = (): number => {
  try {
    return Date.now()
  } catch {
    return 0
  }
}

const fromBase64 = (b64: string): Uint8Array => {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

const ignoreGlobs = (names: readonly string[]): string[] => names.flatMap(n => ['--glob', `!**/${n}/**`])
const lines = (s: string): string[] => s.split('\n').map(l => l.trim().replace(/^\.\//, '')).filter(Boolean)

async function run($: EngineInterface, root: string, argv: string[]): Promise<{ ok: boolean; out: string[] }> {
  try {
    const r = await $.process.run(argv, { cwd: root })
    // rg and grep both exit 1 for "no match": an empty answer, not a failure
    return r.exitCode <= 1 ? { ok: true, out: lines(r.stdout) } : { ok: false, out: [] }
  } catch {
    return { ok: false, out: [] }
  }
}

export async function loadZones($: EngineInterface, root: string): Promise<Zones> {
  try {
    const text = await $.fs.read(`${root}/${ZONES_FILE}`)
    return parseZones(text)
  } catch {
    return DEFAULT_ZONES
  }
}

// Every non-ignored markdown file under root (root-relative).
export async function listMarkdown($: EngineInterface, root: string, zones: Zones): Promise<string[]> {
  let r = await run($, root, ['/usr/bin/rg', '--files', '--hidden', '--no-ignore', '--glob', '*.md', ...ignoreGlobs(zones.ignore)])
  if (!r.ok) r = await run($, root, ['/usr/bin/find', '.', '-type', 'f', '-name', '*.md'])
  return r.out.filter(f => /\.md$/i.test(f) && !hasSegment(f, zones.ignore)).sort()
}

// Markdown files declaring `sources:` / `source:` (frontmatter key) or a section comment; frozen zones are skipped.
export async function findDeclaring($: EngineInterface, root: string, zones: Zones): Promise<string[] | null> {
  const pats = ['^sources?:', '<!-- sources?:']
  let r = await run($, root, ['/usr/bin/rg', '-l', '--hidden', '--no-ignore', '--glob', '*.md', ...ignoreGlobs([...zones.ignore, ...zones.frozen]), '-e', pats[0]!, '-e', pats[1]!])
  if (!r.ok) r = await run($, root, ['/usr/bin/grep', '-rlE', '--include=*.md', `${pats[0]}|${pats[1]}`, '.'])
  if (!r.ok) return null
  return r.out.filter(f => !hasSegment(f, [...zones.ignore, ...zones.frozen])).sort()
}

type Stat = { mtime: number; size: number } | null

async function statOf($: EngineInterface, path: string): Promise<Stat> {
  try {
    const s = await $.fs.stat(path)
    return s.kind === 'file' ? { mtime: s.mtimeMs, size: s.size } : null
  } catch {
    return null
  }
}

export async function readSource($: EngineInterface, path: string, st: { mtime: number; size: number }): Promise<SourceRec> {
  try {
    if (BINARY_EXT.test(path)) {
      const { base64 } = await $.fs.read(path, { as: 'bytes' })
      return { ...st, blob: blobSha(fromBase64(base64)), sections: {} }
    }
    const text = await $.fs.read(path)
    const sections: Record<string, string> = {}
    if (/\.md$/i.test(path)) for (const [h, s] of anchorSections(text)) sections[h] = blobSha(s.text)
    return { ...st, blob: blobSha(text), sections }
  } catch (err) {
    return { ...st, blob: '', sections: {}, unreadable: String(err).slice(0, 120) }
  }
}

// Stat prefilter: re-hash only the sources whose mtime/size moved. Returns the targets whose blob changed.
export async function refreshSources($: EngineInterface, ix: Index, targets: readonly string[]): Promise<string[]> {
  const changed: string[] = []
  const t0 = clock()
  for (const t of targets) {
    if (clock() - t0 > SWEEP_BUDGET_MS) {
      if (!ix.degraded.includes('sweep incomplete')) ix.degraded.push('sweep incomplete')
      break
    }
    const prev = ix.sources[t]
    const st = await statOf($, absOf(ix.root, t))
    if (!st) {
      if (!prev?.missing) changed.push(t)
      ix.sources[t] = { mtime: 0, size: 0, blob: '', sections: {}, missing: true }
      continue
    }
    if (prev && !prev.missing && prev.mtime === st.mtime && prev.size === st.size) continue
    const rec = await readSource($, absOf(ix.root, t), st)
    if (!prev || prev.blob !== rec.blob || prev.missing || JSON.stringify(prev.sections) !== JSON.stringify(rec.sections)) changed.push(t)
    ix.sources[t] = rec
  }
  return changed
}

// L3: stat sweep of every indexed source. No rg, no child parsing.
export async function sweepSources($: EngineInterface, ix: Index): Promise<string[]> {
  const changed = await refreshSources($, ix, indexedTargets(ix))
  ix.sweptAt = clock()
  return changed
}

// Re-parses one child from disk (L2: a Write/Edit landed on it). Returns false when it no longer declares anything. `log` collects hand stamps (§3.4 `manual`).
export async function refreshChild($: EngineInterface, ix: Index, child: string, log?: Gesture[]): Promise<boolean> {
  if (hasSegment(child, [...ix.zones.ignore, ...ix.zones.frozen])) return false
  const st = await statOf($, absOf(ix.root, child))
  if (!st) {
    delete ix.children[child]
    return false
  }
  let text: string
  try {
    text = await $.fs.read(absOf(ix.root, child))
  } catch {
    return false
  }
  const rec = buildChild(text, st.mtime, st.size, ix.root, ix.md)
  if (rec.entries.length === 0) {
    delete ix.children[child]
    return false
  }
  if (log) log.push(...manualStamps(ix, child, ix.children[child], rec))
  ix.children[child] = rec
  return true
}

// L1: full sweep. Rebuilds children (stat-prefiltered against `prev`), resolves entries, refreshes every source, persists.
export async function sweepFull($: EngineInterface, root: string, prev?: Index, log?: Gesture[]): Promise<Index> {
  const zones = await loadZones($, root)
  const ix: Index = emptyIndex(root, zones)
  const t0 = clock()
  ix.md = await listMarkdown($, root, zones)
  const declaring = await findDeclaring($, root, zones)
  if (declaring === null) ix.degraded.push('child scan failed (no rg or grep)')
  const reparsed: { child: string; old: ChildRec; rec: ChildRec }[] = []
  for (const child of declaring ?? []) {
    if (clock() - t0 > SWEEP_BUDGET_MS) {
      ix.degraded.push('sweep incomplete')
      break
    }
    const st = await statOf($, `${root}/${child}`)
    if (!st) continue
    const old = prev?.children[child]
    if (old && old.mtime === st.mtime && old.size === st.size && prev && JSON.stringify(prev.zones) === JSON.stringify(zones)) {
      // unchanged on disk: keep the parse, but wikilinks may resolve differently now that the file list moved
      ix.children[child] = { ...old, entries: old.entries.map(e => (e.kind === 'wikilink' ? { ...e, target: resolveWikilink(e.ref, ix.md) } : e)) }
      continue
    }
    try {
      const text = await $.fs.read(`${root}/${child}`)
      const rec = buildChild(text, st.mtime, st.size, root, ix.md)
      if (rec.entries.length) {
        ix.children[child] = rec
        if (old) reparsed.push({ child, old, rec })
      }
    } catch {
      ix.degraded.push(`unreadable child: ${child}`)
    }
  }
  if (prev) for (const [t, s] of Object.entries(prev.sources)) if (indexedTargets(ix).includes(t)) ix.sources[t] = s
  await refreshSources($, ix, indexedTargets(ix))
  if (log) for (const f of reparsed) log.push(...manualStamps(ix, f.child, f.old, f.rec))
  ix.sweptAt = clock()
  if (prev?.injected) ix.injected = prev.injected
  if (prev?.reviewed) ix.reviewed = prev.reviewed
  if (prev?.since) ix.since = prev.since
  // the turn state survives a mid-session scan (/keel scan, /keel on): it is not a new turn
  if (prev?.turn) ix.turn = prev.turn
  if (prev?.blocked) ix.blocked = true
  if (prev?.toasted) ix.toasted = prev.toasted
  if (prev?.stamped) ix.stamped = prev.stamped
  const out = trimIndex(ix)
  try {
    await $.store.set(indexKey(root), out as never)
  } catch {
    out.degraded.push('index not persisted')
  }
  return out
}

export async function loadIndex($: EngineInterface, root: string): Promise<Index | undefined> {
  try {
    const v = (await $.store.get(indexKey(root))) as Index | undefined
    return v && v.v === 1 && v.root === root ? v : undefined
  } catch {
    return undefined
  }
}

// ── hooks ───────────────────────────────────────────────────────────────────

export const OFF_FILE = '.stoa-keel-off'

async function isOff($: EngineInterface, root: string): Promise<boolean> {
  try {
    return await $.fs.exists(`${root}/${OFF_FILE}`)
  } catch {
    return false
  }
}

async function saveIndex($: EngineInterface, ix: Index): Promise<void> {
  markInjected(ix, []) // forget what is no longer suspect
  touchSince(ix, clock())
  try {
    await $.store.set(indexKey(ix.root), trimIndex(ix) as never)
  } catch {
    if (!ix.degraded.includes('index not persisted')) ix.degraded.push('index not persisted')
  }
}

// §9: one line per gesture, appended to journal/keel.md (read + write: `$.fs` has no append). A failure is a degraded note, never an error.
async function appendJournal($: EngineInterface, ix: Index, log: readonly Gesture[]): Promise<void> {
  if (log.length === 0) return
  const path = `${ix.root}/journal/keel.md`
  try {
    let old = ''
    try {
      old = await $.fs.read(path)
    } catch {
      // first gesture: the file does not exist yet
    }
    const iso = new Date(clock()).toISOString()
    await $.fs.write(path, `${old}${old === '' || old.endsWith('\n') ? '' : '\n'}${log.map(g => journalLine(g, iso)).join('\n')}\n`)
  } catch {
    if (!ix.degraded.includes('journal not written')) ix.degraded.push('journal not written')
  }
}

// ── git blobs (§8, D9) ──────────────────────────────────────────────────────

async function git($: EngineInterface, root: string, argv: string[], stdin?: string): Promise<{ ok: boolean; out: string }> {
  try {
    const r = await $.process.run(['git', '--no-pager', ...argv], { cwd: root, ...(stdin === undefined ? {} : { stdin }) })
    return { ok: r.exitCode === 0, out: r.stdout }
  } catch {
    return { ok: false, out: '' }
  }
}

// The text a (target, anchor) stamp covers, read from disk now. Null: binary, unreadable, or heading gone.
async function stampedTextOf($: EngineInterface, ix: Index, target: string, anchor: string | undefined): Promise<string | null> {
  if (BINARY_EXT.test(target)) return null
  try {
    return stampedText(await $.fs.read(absOf(ix.root, target)), anchor)
  } catch {
    return null
  }
}

// D9: at stamp time the stamped content goes to the git object store (unreferenced loose object: no ref, no commit, no index change),
// so a later change can be diffed against it. Only content whose hash is the stamp just written is stored. Never fails: a git problem is a degraded note.
async function storeBlobs($: EngineInterface, ix: Index, ops: readonly { entry: EntryRec; stamp: string }[]): Promise<void> {
  const seen = new Set<string>()
  for (const op of ops) {
    const target = op.entry.target
    const key = `${target}|${op.entry.anchor ?? ''}|${op.stamp}`
    if (target === null || seen.has(key)) continue
    if (seen.size >= BLOB_STORE_MAX) {
      if (!ix.degraded.includes('git: blob storage capped')) ix.degraded.push('git: blob storage capped')
      return
    }
    seen.add(key)
    const text = await stampedTextOf($, ix, target, op.entry.anchor)
    if (text === null || blobSha(text).slice(0, STAMP_LEN) !== op.stamp) continue // the source moved again, or is not text: nothing to keep
    const r = await git($, ix.root, ['hash-object', '-w', '--stdin'], text)
    if (!r.ok) {
      if (!ix.degraded.includes('git: blobs not stored')) ix.degraded.push('git: blobs not stored')
      return
    }
  }
}

// §8: unified diff of the stamped content against the current one, or `unavailable: <why>`. Writes the current content as a loose object too.
async function suspectDiff($: EngineInterface, ix: Index, s: Suspect, cap: number): Promise<string> {
  const target = s.entry.target
  if (!diffable(s) || target === null) return ''
  if (BINARY_EXT.test(target)) return 'binary changed'
  if (!(await git($, ix.root, ['rev-parse', '--is-inside-work-tree'])).ok) return 'unavailable: not a git repo'
  if (!(await git($, ix.root, ['cat-file', '-e', `${s.old}^{blob}`])).ok) return 'unavailable: stamp too old'
  const text = await stampedTextOf($, ix, target, s.entry.anchor)
  if (text === null || blobSha(text).slice(0, STAMP_LEN) !== s.current) return 'unavailable: source moved again'
  const made = await git($, ix.root, ['hash-object', '-w', '--stdin'], text)
  if (!made.ok) return 'unavailable: git could not store the current content'
  const d = await git($, ix.root, ['diff', '--no-color', s.old, made.out.trim()])
  return (d.ok && trimDiff(d.out, cap)) || 'unavailable: no diff produced'
}

// D14: the only place keel writes into documents (SessionStart, Stop). Re-reads children that moved on disk (a Bash edit, `@ok` by sed, a hand stamp),
// applies the stamp plan, re-parses what it wrote (its own write is not a hand stamp), journals every gesture. Returns the children rewritten.
async function stampBoundary($: EngineInterface, ix: Index, log: Gesture[]): Promise<string[]> {
  for (const child of Object.keys(ix.children)) {
    const st = await statOf($, absOf(ix.root, child))
    const rec = ix.children[child]
    if (rec && (!st || st.mtime !== rec.mtime || st.size !== rec.size)) await refreshChild($, ix, child, log)
  }
  const rewritten: string[] = []
  const byChild = new Map<string, ReturnType<typeof stampPlan>>()
  for (const op of stampPlan(ix)) byChild.set(op.child, [...(byChild.get(op.child) ?? []), op])
  for (const [child, ops] of byChild) {
    try {
      const path = absOf(ix.root, child)
      const r = rewriteStamps(await $.fs.read(path), ops.map(o => ({ entry: o.entry, stamp: o.stamp })))
      if (r.failed.length && !ix.degraded.includes(`stamp skipped: ${child}`)) ix.degraded.push(`stamp skipped: ${child}`)
      if (r.done.length === 0) continue
      await $.fs.write(path, r.text)
      rewritten.push(child)
      for (const i of r.done) log.push(gestureOf(ops[i]!.kind, child, ops[i]!.entry, ops[i]!.stamp))
      await storeBlobs($, ix, r.done.map(i => ops[i]!))
      await refreshChild($, ix, child)
    } catch {
      if (!ix.degraded.includes(`stamp failed: ${child}`)) ix.degraded.push(`stamp failed: ${child}`)
    }
  }
  delete ix.reviewed
  await appendJournal($, ix, log)
  return rewritten
}

type Told = { context: string[]; watchPaths: string[]; block?: string }
const NOTHING: Told = { context: [], watchPaths: [] }

const names = (paths: readonly string[]): string => (paths.length > 3 ? `${paths.slice(0, 3).join(', ')} and ${paths.length - 3} more` : paths.join(', '))

// The first FEEDBACK_DIFFS `changed` suspects of a list, each with its capped diff (PostToolUse feedback and prompt.submit share the caps).
async function diffBlocks($: EngineInterface, ix: Index, list: readonly Suspect[]): Promise<string[]> {
  const diffs: string[] = []
  for (const s of list.filter(diffable).slice(0, FEEDBACK_DIFFS)) {
    const d = await suspectDiff($, ix, s, FEEDBACK_DIFF_CAP)
    if (d) diffs.push(`diff ${s.entry.ref}${s.entry.anchor ? `#${s.entry.anchor}` : ''} (for ${s.child}):\n${d}`)
  }
  return diffs
}

// Suspects hanging off the sources that just moved and not yet told: one block for the model (PostToolUse), recorded as injected.
// The first FEEDBACK_DIFFS `changed` ones carry their diff (§1: the agent is told, with the diff).
async function feedback($: EngineInterface, ix: Index, moved: readonly string[]): Promise<string[]> {
  if (moved.length === 0) return []
  const list = newSuspects(ix, derivedFrom(ix, moved))
  const text = formatSuspects(`keel: ${names(moved)} changed; derived files now suspect:`, list, INJECT_CAP_PROMPT)
  if (!text) return []
  markInjected(ix, list)
  return [[text, ...(await diffBlocks($, ix, list)), GUIDE].join('\n')]
}

// L1 at SessionStart (any source), then the stamping boundary. Tells the model every current suspect (cap 4000) and asks the host to watch the indexed sources (L4).
async function onSessionStart($: EngineInterface, root: string): Promise<Told> {
  if (await isOff($, root)) return NOTHING
  const log: Gesture[] = []
  const ix = await sweepFull($, root, await loadIndex($, root), log)
  noteStamped(ix, await stampBoundary($, ix, log))
  const all = suspectsOf(ix)
  ix.injected = []
  markInjected(ix, all)
  startTurn(ix)
  await saveIndex($, ix)
  const text = formatSuspects('keel: derived files whose sources changed, not yet reviewed:', all, INJECT_CAP_START)
  return { context: text ? [`${text}\n${GUIDE}`] : [], watchPaths: watchTargets(ix) }
}

// L2: a Write/Edit landed on `path`. A source is re-hashed; a markdown file that may declare `sources:` is re-parsed (it may be new).
// `tell` false (FileChanged): the index moves, the model is told at the next prompt.
async function onFileWritten($: EngineInterface, root: string, path: string, tell = true): Promise<string[]> {
  if (await isOff($, root)) return []
  const ix = await loadIndex($, root)
  if (!ix) return []
  const target = toTarget(root, path)
  if (!target.startsWith('/') && hasSegment(target, ix.zones.ignore)) return []
  const moved = ix.sources[target] ? await refreshSources($, ix, [target]) : []
  const log: Gesture[] = []
  if (/\.md$/i.test(target) && !target.startsWith('/')) {
    if (!ix.md.includes(target)) ix.md = [...ix.md, target].sort()
    await refreshChild($, ix, target, log)
    await refreshSources($, ix, indexedTargets(ix).filter(t => !ix.sources[t]))
    if (tell) markReviewed(ix, target) // the agent wrote this child: its changed entries are reviewed (§3.4 `updated`), stamped at the boundary
  }
  const told = tell ? await feedback($, ix, moved) : []
  await appendJournal($, ix, log)
  await saveIndex($, ix)
  return told
}

// L3: a Bash command ran, anything may have moved. Stat sweep of every indexed source.
async function onBash($: EngineInterface, root: string): Promise<string[]> {
  if (await isOff($, root)) return []
  const ix = await loadIndex($, root)
  if (!ix) return []
  const told = await feedback($, ix, await sweepSources($, ix))
  await saveIndex($, ix)
  return told
}

// §9: keel-status-llm.md at the root, rewritten at Stop while the index is non-empty (idle rule), untouched when only the sweep time moved.
async function writeStatus($: EngineInterface, ix: Index): Promise<void> {
  if (isIdle(ix)) return
  const path = `${ix.root}/keel-status-llm.md`
  try {
    const next = statusText(ix, new Date(clock()).toISOString())
    let old = ''
    try {
      old = await $.fs.read(path)
    } catch {
      // first write: the file does not exist yet
    }
    if (old === '' || !sameStatus(old, next)) await $.fs.write(path, next)
  } catch {
    if (!ix.degraded.includes('status file not written')) ix.degraded.push('status file not written')
  }
}

// The human channel: a transient toast, never an error.
function toast($: EngineInterface, text: string): void {
  try {
    $.ui.toast(text, { timeoutMs: 6000 })
  } catch {
    // nothing left to do
  }
}

// Stop: L3 final sweep, the stamping boundary, then D10: the suspects created this turn and still suspect are blocked ONCE (not again when the
// host says it is re-entering, nor once the block is spent this turn). Returns the block text, if any. The toast and the status file are written either way.
async function onStop($: EngineInterface, root: string, again: boolean): Promise<string | undefined> {
  if (await isOff($, root)) return undefined
  const ix = await loadIndex($, root)
  if (!ix) return undefined
  await sweepSources($, ix)
  const rewritten = await stampBoundary($, ix, [])
  const created = createdThisTurn(ix)
  let block: string | undefined
  if (created.length && !again && !ix.blocked) {
    const shown = created.slice(0, STOP_MAX)
    const items: { s: Suspect; diff: string }[] = []
    for (const s of shown) items.push({ s, diff: diffable(s) ? await suspectDiff($, ix, s, DIFF_CAP) : '' })
    block = formatStopBlock(items, created.length - shown.length, rewritten)
    ix.blocked = true
    markInjected(ix, shown) // the block told them: the next prompt does not repeat it
  }
  // one toast per text and turn: the Stop that re-enters after a block would stack an identical one
  const parts = [...(created.length ? [`${created.length} derived file${created.length > 1 ? 's' : ''} to review`] : []), ...(rewritten.length ? [`stamped ${names(rewritten)}`] : [])]
  const note = parts.length ? `keel: ${parts.join('; ')}` : undefined
  const fresh = note !== undefined && ix.toasted !== note
  if (fresh) ix.toasted = note
  if (!block) noteStamped(ix, rewritten) // a block already names them; otherwise the next prompt does
  await saveIndex($, ix)
  await writeStatus($, ix)
  if (fresh) toast($, note)
  return block
}

// L4 fallback: stat sweep at every prompt (a file the host does not watch may have moved), then the NEW suspects only (cap 2000).
async function onPrompt($: EngineInterface, root: string): Promise<string[]> {
  if (await isOff($, root)) return []
  const ix = await loadIndex($, root)
  if (!ix) return []
  await sweepSources($, ix)
  const notes: string[] = []
  if (ix.stamped?.length) {
    notes.push(formatStamped(ix.stamped))
    delete ix.stamped
  }
  const list = newSuspects(ix)
  const text = formatSuspects('keel: derived files whose sources changed, not yet reviewed:', list, INJECT_CAP_PROMPT)
  if (text) {
    markInjected(ix, list)
    notes.push([text, ...(await diffBlocks($, ix, list)), GUIDE].join('\n'))
  }
  startTurn(ix)
  await saveIndex($, ix)
  return notes
}

// ── /keel (§10) ─────────────────────────────────────────────────────────────

// The command is declared from keel's `session.*` glob (branch on `session.start`): pack owns the exact `session.start`, and the host throws on a duplicate
// (pattern, matcher). Declared from `classic.SessionStart` it landed too late: `claude -p "/keel"` answered "isn't installed". Also while off: `/keel on` must stay reachable.
async function declareCommand($: EngineInterface): Promise<void> {
  try {
    await $.command.register({ name: 'keel', description: 'Derived files whose sources changed: suspects, scan, why <file>, off, on', argumentHint: '[scan | why <file> | off | on]' })
  } catch (err) {
    try {
      $.ui.log(`keel: command keel not registered: ${String(err)}`, { to: 'debug' })
    } catch {
      // nothing left to do
    }
  }
}

const USAGE = 'usage: /keel | /keel scan | /keel why <file> | /keel off | /keel on'
const isoOf = (ms: number): string => new Date(ms).toISOString()

// Re-scans the chantier (L1, no stamping: stamps are written at the turn boundaries, D14) and saves the index.
async function rescan($: EngineInterface, root: string): Promise<{ ix: Index; added: string[]; removed: string[] }> {
  const prev = await loadIndex($, root)
  const log: Gesture[] = []
  const ix = await sweepFull($, root, prev, log)
  await appendJournal($, ix, log)
  await saveIndex($, ix)
  const was = Object.keys(prev?.children ?? {})
  const now = Object.keys(ix.children)
  return { ix, added: now.filter(c => !was.includes(c)), removed: was.filter(c => !now.includes(c)) }
}

const OFF_TEXT = (root: string): string => `keel: off in ${root} (${OFF_FILE} present). /keel on to resume.`

async function keelCommand($: EngineInterface, args: string): Promise<{ text: string }> {
  try {
    const root = await $.session.cwd()
    const [sub = '', ...rest] = args.trim().split(/\s+/).filter(Boolean)
    const arg = rest.join(' ')
    const off = await isOff($, root)
    if (sub === 'off') {
      if (off) return { text: `keel: already off in ${root}.` }
      await $.fs.write(`${root}/${OFF_FILE}`, 'keel is off in this directory: every keel hook is a no-op. Delete this file, or run /keel on, to resume.\n')
      return { text: `keel: off in ${root} (created ${OFF_FILE}). /keel on to resume.` }
    }
    if (sub === 'on') {
      if (!off) return { text: `keel: was not off in ${root}.` }
      await run($, root, ['/bin/rm', '-f', `${root}/${OFF_FILE}`])
      if (await isOff($, root)) return { text: `keel: could not remove ${OFF_FILE} in ${root}; delete it by hand.` }
      const { ix } = await rescan($, root) // the hooks were no-ops while off: the index may be stale
      return { text: `keel: on in ${root}; rescanned ${Object.keys(ix.children).length} derived file(s). ${suspectsOf(ix).length} suspect(s).` }
    }
    if (sub !== '' && sub !== 'scan' && sub !== 'why') return { text: `keel: unknown subcommand "${sub}". ${USAGE}` }
    if (off) return { text: OFF_TEXT(root) }
    if (sub === 'scan') {
      const { ix, added, removed } = await rescan($, root)
      const pending = stampPlan(ix).length
      const head = [`keel scan: ${Object.keys(ix.children).length} derived file(s), ${indexedTargets(ix).length} source(s).`]
      if (added.length) head.push(`found: ${names(added)}`)
      if (removed.length) head.push(`gone: ${names(removed)}`)
      if (pending) head.push(`${pending} stamp(s) pending: written at the end of the turn.`)
      return { text: `${head.join(' ')}\n${formatOverview(ix, isoOf)}` }
    }
    const ix = await loadIndex($, root)
    if (!ix) return { text: `keel: no index yet for ${root}; run /keel scan.` }
    if (sub === 'why') {
      if (!arg) return { text: `keel: why needs a file. ${USAGE}` }
      const wiki = /^\[\[(.+)\]\]$/.exec(arg)
      const target = wiki ? resolveWikilink(wiki[1]!, ix.md) : toTarget(root, arg)
      if (target === null) return { text: `keel: ${arg} is unresolved (no file, or several, with that name).` }
      await sweepSources($, ix)
      await saveIndex($, ix)
      return { text: formatWhy(ix, arg, target) }
    }
    await sweepSources($, ix)
    await saveIndex($, ix)
    return { text: formatOverview(ix, isoOf) }
  } catch (err) {
    return { text: `keel: command failed: ${String(err)}` }
  }
}

const WRITE_TOOLS = ['Write', 'Edit', 'MultiEdit', 'NotebookEdit']

const filePathOf = (input: unknown): string | null => {
  const p = typeof input === 'object' && input !== null ? (input as { file_path?: unknown; notebook_path?: unknown }).file_path ?? (input as { notebook_path?: unknown }).notebook_path : undefined
  return typeof p === 'string' && p.startsWith('/') ? p : null
}

// One glob hook on `classic.*`: the host throws on a duplicate (pattern, matcher) and pack owns `classic.SessionStart`, so keel branches on `next.is`.
// It sees every classic event: anything that is not ours returns before any `$` call. `prompt.submit` is not pack's, so it is registered on its own.
export function registerKeel(on: On): void {
  on('classic.*', async ($, e, next) => {
    let told: Told = NOTHING
    try {
      if (next.is('classic.SessionStart', e)) told = await onSessionStart($, e.cwd)
      else if (next.is('classic.PostToolUse', e)) {
        if (e.tool_name === 'Bash') told = { context: await onBash($, e.cwd), watchPaths: [] }
        else if (WRITE_TOOLS.includes(e.tool_name)) {
          const path = filePathOf(e.tool_input)
          if (path) told = { context: await onFileWritten($, e.cwd, path), watchPaths: [] }
        }
      } else if (next.is('classic.FileChanged', e)) await onFileWritten($, e.cwd, e.file_path, false)
      else if (next.is('classic.Stop', e)) {
        const block = await onStop($, e.cwd, e.stop_hook_active)
        if (block) told = { context: [], watchPaths: [], block }
      }
    } catch (err) {
      try {
        $.ui.log(`keel: ${next.event} failed: ${String(err)}`, { to: 'debug' })
      } catch {
        // nothing left to do
      }
    }
    const r = await next(e)
    if (told.context.length === 0 && told.watchPaths.length === 0 && !told.block) return r
    return {
      ...r,
      ...(told.block ? { block: r.block ? `${r.block}\n${told.block}` : told.block } : {}),
      ...(told.context.length ? { additionalContext: [...(r.additionalContext ?? []), ...told.context] } : {}),
      ...(told.watchPaths.length ? { watchPaths: [...(r.watchPaths ?? []), ...told.watchPaths] } : {}),
    }
  }).catch(($, e, next) => {
    try {
      $.ui.log(`keel: hook failed: ${String(next.error)}`, { to: 'debug' })
    } catch {
      // nothing left to do
    }
    return next(e)
  })
  on('session.*', async ($, e, next) => {
    if (next.is('session.start', e)) await declareCommand($)
    return next(e)
  }).catch(($, e, next) => {
    try {
      $.ui.log(`keel: session hook failed: ${String(next.error)}`, { to: 'debug' })
    } catch {
      // nothing left to do
    }
    return next(e)
  })
  on('command.run', { command: 'keel' }, ($, e) => keelCommand($, e.args))
  on('prompt.submit', async ($, e, next) => {
    let context: string[] = []
    try {
      context = await onPrompt($, await $.session.cwd())
    } catch (err) {
      try {
        $.ui.log(`keel: prompt.submit failed: ${String(err)}`, { to: 'debug' })
      } catch {
        // nothing left to do
      }
    }
    return next(context.length ? { ...e, context: [...(e.context ?? []), ...context] } : e)
  }).catch(($, e, next) => {
    try {
      $.ui.log(`keel: prompt.submit hook failed: ${String(next.error)}`, { to: 'debug' })
    } catch {
      // nothing left to do
    }
    return next(e)
  })
}
