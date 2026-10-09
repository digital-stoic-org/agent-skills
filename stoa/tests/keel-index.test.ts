import { expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'
import { blobSha, stampOf } from '../hooks/keel-core.ts'
import {
  DEFAULT_ZONES,
  GUIDE,
  assessEntry,
  formatSuspects,
  journalLine,
  rewriteStamps,
  markInjected,
  newSuspects,
  watchTargets,
  emptyIndex,
  indexKey,
  parseZones,
  resolveWikilink,
  reverseOf,
  suspectsOf,
  toTarget,
  trimIndex,
} from '../hooks/keel-index.ts'
import type { EntryRec, Index } from '../hooks/keel-index.ts'

const ROOT = '/work'

// ── pure ────────────────────────────────────────────────────────────────────

test('zones: defaults, flow list, block list, a key not set keeps its default', () => {
  expect(parseZones('')).toEqual(DEFAULT_ZONES)
  expect(parseZones('ignore: [old, "tmp dir"]\n')).toEqual({ ignore: ['old', 'tmp dir'], frozen: DEFAULT_ZONES.frozen })
  expect(parseZones('frozen:\n  - in\n  - raw # inputs\nignore: []\n')).toEqual({ ignore: [], frozen: ['in', 'raw'] })
  expect(parseZones('# comment\nother: x\n')).toEqual(DEFAULT_ZONES)
})

test('paths: root-relative inside the root, absolute outside, .. folded', () => {
  expect(toTarget(ROOT, 'ref/a.md')).toBe('ref/a.md')
  expect(toTarget(ROOT, './ref/../ref/a.md')).toBe('ref/a.md')
  expect(toTarget(ROOT, '/work/ref/a.md')).toBe('ref/a.md')
  expect(toTarget(ROOT, '/other/a.md')).toBe('/other/a.md')
  expect(toTarget(ROOT, '../sib/a.md')).toBe('/sib/a.md')
})

test('wikilink: unique basename, case-insensitive, optional .md, path suffix; 0 or >1 hits -> null', () => {
  const md = ['ref/Note-Dir.md', 'wip/a.md', 'wip/sub/a.md', 'x/dir/z.md', 'y/other/z.md']
  expect(resolveWikilink('note-dir', md)).toBe('ref/Note-Dir.md')
  expect(resolveWikilink('Note-Dir.md', md)).toBe('ref/Note-Dir.md')
  expect(resolveWikilink('a', md)).toBeNull()
  expect(resolveWikilink('missing', md)).toBeNull()
  expect(resolveWikilink('dir/z', md)).toBe('x/dir/z.md')
  expect(resolveWikilink('z', md)).toBeNull()
})

const rec = (over: Partial<EntryRec>): EntryRec => ({ raw: 'x', ref: 'src.md', kind: 'path', stamp: { kind: 'none' }, scope: 'file', target: 'src.md', line: 2, ...over })

function indexWith(entries: EntryRec[], sources: Index['sources']): Index {
  return { ...emptyIndex(ROOT), children: { 'wip/c.md': { mtime: 1, size: 1, entries } }, sources }
}

const SRC_TEXT = '## A\none\n## B\ntwo\n'
const srcRec = (text = SRC_TEXT): Index['sources'][string] => ({
  mtime: 1,
  size: text.length,
  blob: blobSha(text),
  sections: { A: blobSha('## A\none\n'), B: blobSha('## B\ntwo\n') },
})

test('assess: every state of the stamp lifecycle', () => {
  const cur = stampOf(SRC_TEXT)
  const ix = indexWith([], { 'src.md': srcRec() })
  expect(assessEntry(ix, rec({}))).toEqual({ kind: 'pending-stamp', current: cur })
  expect(assessEntry(ix, rec({ stamp: { kind: 'ok' } }))).toEqual({ kind: 'ok-requested', current: cur })
  expect(assessEntry(ix, rec({ stamp: { kind: 'hex', value: cur } }))).toEqual({ kind: 'clean' })
  expect(assessEntry(ix, rec({ stamp: { kind: 'hex', value: '000000000000' } }))).toEqual({ kind: 'suspect', reason: 'changed', old: '000000000000', current: cur })
  expect(assessEntry(ix, rec({ stamp: { kind: 'bad', raw: 'zz' } }))).toEqual({ kind: 'suspect', reason: 'bad-stamp', old: 'zz', current: cur })
})

test('assess: section anchors hash the section only', () => {
  const secA = stampOf('## A\none\n')
  const ix = indexWith([], { 'src.md': srcRec() })
  expect(assessEntry(ix, rec({ anchor: 'A', stamp: { kind: 'hex', value: secA } }))).toEqual({ kind: 'clean' })
  expect(assessEntry(ix, rec({ anchor: 'Gone' }))).toEqual({ kind: 'suspect', reason: 'anchor-missing' })
})

test('assess: missing, parked, opaque, unresolved, unreadable sources', () => {
  const ix = indexWith([], { 'src.md': srcRec(), 'gone.md': { mtime: 0, size: 0, blob: '', sections: {}, missing: true }, 'park/p.md': srcRec(), 'big.md': { mtime: 1, size: 9, blob: '', sections: {}, unreadable: 'too big' } })
  expect(assessEntry(ix, rec({ target: 'gone.md' }))).toEqual({ kind: 'suspect', reason: 'source-missing' })
  expect(assessEntry(ix, rec({ target: 'never-indexed.md' }))).toEqual({ kind: 'suspect', reason: 'source-missing' })
  expect(assessEntry(ix, rec({ target: 'park/p.md' }))).toEqual({ kind: 'suspect', reason: 'source-parked' })
  expect(assessEntry(ix, rec({ target: '/abs/park/p.md' }))).toMatchObject({ kind: 'suspect', reason: 'source-missing' })
  expect(assessEntry(ix, rec({ kind: 'url', ref: 'https://x.io', target: null }))).toEqual({ kind: 'opaque' })
  expect(assessEntry(ix, rec({ kind: 'wikilink', target: null }))).toEqual({ kind: 'unresolved' })
  expect(assessEntry(ix, rec({ target: 'big.md' }))).toEqual({ kind: 'unreadable', why: 'too big' })
})

test('reverse: sources -> children, computed from the children', () => {
  const ix = indexWith([rec({ target: 'a.md' }), rec({ target: 'a.md', anchor: 'H' }), rec({ target: 'b.md' }), rec({ kind: 'url', target: null })], {})
  expect(reverseOf(ix)).toEqual({ 'a.md': ['wip/c.md'], 'b.md': ['wip/c.md'] })
  expect(suspectsOf(ix).map(s => s.reason)).toEqual(['source-missing', 'source-missing', 'source-missing'])
})

test('trim: under the cap nothing moves', () => {
  const ix = indexWith([rec({})], { 'src.md': srcRec() })
  expect(trimIndex(ix)).toBe(ix)
})

// ── I/O against a stubbed engine ────────────────────────────────────────────

type Disk = Map<string, { text?: string; bytes?: string; mtime: number; unreadable?: boolean }>
type World = {
  disk: Disk
  store: Map<string, unknown>
  reads: string[]
  procs: string[][]
  rgDown: boolean
  grepDown: boolean
  start: () => Promise<Index>
  wrote: (rel: string) => Promise<Index>
  bash: () => Promise<Index>
  index: () => Index
  last: { start?: Told; tool?: Told; stop?: Told & { block?: string } }
  toasts: string[]
  prompt: () => Promise<readonly string[]>
  fileChanged: (rel: string) => Promise<Index>
  writes: string[]
  tick: number
  stop: (again?: boolean) => Promise<Index>
  journal: () => string[]
  text: (rel: string) => string
  objects: Map<string, string>
  noGit: boolean
  gitFails: boolean
  registered: string[]
  cmd: (args?: string) => Promise<string>
}
type Told = { additionalContext?: string[]; watchPaths?: string[] }

const globToRe = (g: string): RegExp => new RegExp(`^${g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*\//g, '(?:.*/)?').replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')}$`)

// A fake rg/grep/find over the in-memory disk: honors --glob negations, -l with -e patterns, exit 1 on no match.
function fakeProc(w: World, argv: readonly string[], stdin?: string): { exitCode: number; stdout: string; stderr: string } {
  w.procs.push([...argv])
  const files = [...w.disk.keys()].filter(p => p.startsWith(`${ROOT}/`)).map(p => p.slice(ROOT.length + 1))
  const done = (out: string[]) => ({ exitCode: out.length ? 0 : 1, stdout: out.join('\n'), stderr: '' })
  if (argv[0] === '/usr/bin/rg') {
    if (w.rgDown) return { exitCode: 127, stdout: '', stderr: 'rg: not found' }
    const globs: string[] = []
    const pats: string[] = []
    for (let i = 1; i < argv.length; i++) {
      if (argv[i] === '--glob') globs.push(argv[++i]!)
      else if (argv[i] === '-e') pats.push(argv[++i]!)
    }
    const inc = globs.filter(g => !g.startsWith('!')).map(globToRe)
    const exc = globs.filter(g => g.startsWith('!')).map(g => globToRe(g.slice(1)))
    const ok = files.filter(f => inc.every(r => r.test(f.split('/').pop()!)) && !exc.some(r => r.test(f)))
    if (argv.includes('--files')) return done(ok)
    return done(ok.filter(f => pats.some(p => new RegExp(p, 'm').test(w.disk.get(`${ROOT}/${f}`)?.text ?? ''))))
  }
  if (argv[0] === '/usr/bin/grep') {
    if (w.grepDown) return { exitCode: 2, stdout: '', stderr: 'grep: error' }
    const pat = new RegExp(argv[argv.length - 2]!, 'm')
    return done(files.filter(f => f.endsWith('.md') && pat.test(w.disk.get(`${ROOT}/${f}`)?.text ?? '')).map(f => `./${f}`))
  }
  if (argv[0] === 'git') return fakeGit(w, argv.slice(argv[1] === '--no-pager' ? 2 : 1), stdin)
  if (argv[0] === '/bin/rm') {
    for (const p of argv.slice(2)) w.disk.delete(p)
    return gitOut(0)
  }
  if (argv[0] === '/usr/bin/find') return done(files.filter(f => f.endsWith('.md')).map(f => `./${f}`))
  return { exitCode: 127, stdout: '', stderr: 'unknown' }
}

const gitOut = (exitCode: number, stdout = '') => ({ exitCode, stdout, stderr: '' })

// A fake git over an in-memory object store: rev-parse, hash-object -w --stdin, cat-file -e <abbrev>^{blob}, diff <a> <b> (line-by-line, hunks only).
function fakeGit(w: World, args: readonly string[], stdin?: string): { exitCode: number; stdout: string; stderr: string } {
  if (w.noGit) return { exitCode: 128, stdout: '', stderr: 'fatal: not a git repository' }
  if (w.gitFails && args[0] === 'hash-object') return { exitCode: 1, stdout: '', stderr: 'fatal: cannot write' }
  const find = (id: string): string | undefined => [...w.objects].find(([k]) => k.startsWith(id))?.[1]
  if (args[0] === 'rev-parse') return gitOut(0, 'true\n')
  if (args[0] === 'hash-object') {
    const sha = blobSha(stdin ?? '')
    w.objects.set(sha, stdin ?? '')
    return gitOut(0, `${sha}\n`)
  }
  if (args[0] === 'cat-file') return find(args[2]!.replace('^{blob}', '')) === undefined ? gitOut(128) : gitOut(0)
  if (args[0] === 'diff') {
    const a = find(args[2]!)?.split('\n')
    const b = find(args[3]!)?.split('\n')
    if (!a || !b) return gitOut(128)
    return gitOut(0, `diff --git a/x b/x\nindex 1..2 100644\n--- a/x\n+++ b/x\n@@ -1 +1 @@\n${a.map(l => `-${l}`).join('\n')}\n${b.map(l => `+${l}`).join('\n')}\n`)
  }
  return { exitCode: 127, stdout: '', stderr: 'unknown git verb' }
}

// Every call goes through a real event: the host refuses a `$` call from code its scan cannot trace to the plugin's hooks.
function world(on: On, $: Engine): World {
  const w: World = {
    disk: new Map(),
    store: new Map(),
    reads: [],
    procs: [],
    rgDown: false,
    grepDown: false,
    index: () => w.store.get(indexKey(ROOT)) as Index,
    last: {},
    start: async () => {
      w.last.start = (await $.classic.SessionStart({ source: 'startup', cwd: ROOT })) as Told
      return w.index()
    },
    wrote: async rel => {
      w.last.tool = (await $.classic.PostToolUse({ tool_name: 'Write', tool_input: { file_path: rel.startsWith('/') ? rel : `${ROOT}/${rel}` }, cwd: ROOT })) as Told
      return w.index()
    },
    bash: async () => {
      w.last.tool = (await $.classic.PostToolUse({ tool_name: 'Bash', tool_input: { command: 'make' }, cwd: ROOT })) as Told
      return w.index()
    },
    writes: [],
    tick: 1000,
    stop: async (again = false) => {
      w.last.stop = (await $.classic.Stop({ stop_hook_active: again, cwd: ROOT })) as Told & { block?: string }
      return w.index()
    },
    toasts: [],
    journal: () => (w.disk.get(`${ROOT}/journal/keel.md`)?.text ?? '').split('\n').filter(Boolean).map(l => l.replace(/^\S+ /, '')),
    text: rel => w.disk.get(`${ROOT}/${rel}`)?.text ?? '',
    objects: new Map(),
    noGit: false,
    gitFails: false,
    registered: [],
    cmd: async (args = '') => ((await $.command.run({ command: 'keel', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 120 } })) as { text?: string }).text ?? '',
    fileChanged: async rel => {
      await $.classic.FileChanged({ file_path: `${ROOT}/${rel}`, event: 'change', cwd: ROOT })
      return w.index()
    },
    prompt: async () => {
      const r = await $.prompt.submit({ text: 'next' })
      return ('context' in r && r.context) || []
    },
  }
  // the end of the chain: nothing below the plugin's hooks answers these events in the test engine
  on('classic.SessionStart', () => ({}))
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('classic.PostToolUse', () => ({}))
  on('classic.FileChanged', () => ({}))
  on('classic.Stop', () => ({}))
  on('prompt.submit', (_$, e) => ({ text: e.text, ...(e.context ? { context: e.context } : {}) }))
  on('session.cwd', () => ({ value: ROOT }))
  on('ui.toast', (_$, e) => (w.toasts.push(e.text), { value: undefined }))
  on('command.register', (_$, e) => (w.registered.push((e as { name: string }).name), { value: { command: (e as { name: string }).name } }) as never)
  on('store.get', (_$, e) => ({ value: w.store.get(e.key) }))
  on('store.set', (_$, e) => (w.store.set(e.key, JSON.parse(JSON.stringify(e.value))), { value: undefined }))
  on('fs.read', (_$, e) => {
    const f = w.disk.get(e.path)
    if (!f || f.unreadable) return { deny: f ? 'EFBIG' : 'ENOENT' }
    w.reads.push(e.path)
    return { value: e.as === 'bytes' ? { base64: f.bytes ?? btoa(f.text ?? '') } : (f.text ?? '') }
  })
  on('fs.write', (_$, e) => (w.writes.push(e.path), w.disk.set(e.path, { text: e.text, mtime: ++w.tick }), { value: undefined }))
  on('fs.exists', (_$, e) => ({ value: w.disk.has(e.path) }))
  on('fs.stat', (_$, e) => {
    const f = w.disk.get(e.path)
    return f ? { value: { kind: 'file', size: (f.text ?? f.bytes ?? '').length, mtimeMs: f.mtime, isLink: false } } : { deny: 'ENOENT' }
  })
  on('process.run', (_$, e) => ({ value: { ...fakeProc(w, e.argv, e.init?.stdin), isStdoutTruncated: false, isStderrTruncated: false } }))
  return w
}

// the status file (K7) is written at Stop by design; these assertions are about documents
const docWrites = (w: World): string[] => w.writes.filter(p => !p.endsWith('keel-status-llm.md'))

const put = (w: World, rel: string, text: string, mtime = 1) => w.disk.set(`${ROOT}/${rel}`, { text, mtime })

const SRC = '## Abondement\nrate 5\n## Other\nx\n'

function fixture(w: World) {
  put(w, 'ref/src.md', SRC)
  put(w, 'in/meeting.md', '# raw meeting\n')
  put(w, 'in/frozen-child.md', '---\nsources:\n  - ref/src.md\n---\n')
  put(w, 'park/old.md', '---\nsources:\n  - ref/src.md\n---\n')
  put(w, 'wip/child.md', `---\nsources:\n  - ref/src.md#Abondement @${stampOf('## Abondement\nrate 5\n')}\n  - in/meeting.md\n  - "[[Meeting]]"\n  - https://notion.so/x\n---\nbody\n`)
  put(w, 'wip/section.md', '# Doc\n## Part\n<!-- sources: ref/src.md#Other -->\ntext\n')
  put(w, 'wip/plain.md', '# no declaration\n')
}

test('L1: finds children outside ignore and frozen zones, indexes their sources', async ($, on) => {
  const w = world(on, $)
  fixture(w)
  const ix = await w.start()
  expect(Object.keys(ix.children).sort()).toEqual(['wip/child.md', 'wip/section.md'])
  expect(ix.md).toEqual(['in/frozen-child.md', 'in/meeting.md', 'ref/src.md', 'wip/child.md', 'wip/plain.md', 'wip/section.md'])
  const child = ix.children['wip/child.md']!
  expect(child.entries.map(e => [e.ref, e.target, e.kind])).toEqual([
    ['ref/src.md', 'ref/src.md', 'path'],
    ['in/meeting.md', 'in/meeting.md', 'path'],
    ['Meeting', 'in/meeting.md', 'wikilink'],
    ['https://notion.so/x', null, 'url'],
  ])
  expect(Object.keys(ix.sources).sort()).toEqual(['in/meeting.md', 'ref/src.md'])
  expect(ix.sources['ref/src.md']!.blob).toBe(blobSha(SRC))
  expect(ix.sources['ref/src.md']!.sections).toEqual({ Abondement: blobSha('## Abondement\nrate 5\n'), Other: blobSha('## Other\nx\n') })
  expect(reverseOf(ix)['ref/src.md']).toEqual(['wip/child.md', 'wip/section.md'])
  expect(suspectsOf(ix)).toEqual([])
  expect(w.store.get(indexKey(ROOT))).toEqual(ix)
})

test('L1: the section-level declaration is scoped and assessed; the absent stamp is written at SessionStart (K5)', async ($, on) => {
  const w = world(on, $)
  fixture(w)
  const ix = await w.start()
  const e = ix.children['wip/section.md']!.entries[0]!
  expect(e).toMatchObject({ scope: 'Part', anchor: 'Other', target: 'ref/src.md', stamp: { kind: 'hex', value: stampOf('## Other\nx\n') } })
  expect(assessEntry(ix, e)).toEqual({ kind: 'clean' })
  expect(w.text('wip/section.md')).toBe(`# Doc\n## Part\n<!-- sources: ref/src.md#Other @${stampOf('## Other\nx\n')} -->\ntext\n`)
})

test('L1: rg gets the zone globs; frozen names are excluded from the child scan only', async ($, on) => {
  const w = world(on, $)
  fixture(w)
  await w.start()
  const files = w.procs.find(a => a.includes('--files'))!
  const scan = w.procs.find(a => a.includes('-l'))!
  expect(files).toContain('!**/park/**')
  expect(files).not.toContain('!**/in/**')
  expect(scan).toContain('!**/in/**')
  expect(scan).toContain('!**/.in/**')
  expect(files.slice(0, 5)).toEqual(['/usr/bin/rg', '--files', '--hidden', '--no-ignore', '--glob'])
})

test('L1: .stoa-keel.yml replaces the lists it sets', async ($, on) => {
  const w = world(on, $)
  fixture(w)
  put(w, '.stoa-keel.yml', 'ignore: [wip]\nfrozen: [in]\n')
  const ix = await w.start()
  expect(ix.zones).toEqual({ ignore: ['wip'], frozen: ['in'] })
  expect(Object.keys(ix.children)).toEqual(['park/old.md'])
})

test('L1: rg missing -> grep fallback; both missing -> degraded, nothing thrown', async ($, on) => {
  const w = world(on, $)
  fixture(w)
  w.rgDown = true
  const a = await w.start()
  expect(Object.keys(a.children).sort()).toEqual(['wip/child.md', 'wip/section.md'])
  expect(a.md).toContain('ref/src.md')
  w.grepDown = true
  const b = await w.start()
  expect(b.children).toEqual({})
  expect(b.degraded).toContain('child scan failed (no rg or grep)')
})

test('stat prefilter: an unchanged mtime/size is not re-read; a moved one is re-hashed', async ($, on) => {
  const w = world(on, $)
  fixture(w)
  const first = await w.start()
  w.reads.length = 0
  const second = await w.start()
  expect(w.reads).toEqual([`${ROOT}/.stoa-keel.yml`].filter(p => w.disk.has(p)))
  expect(second.sources).toEqual(first.sources)
  expect(second.children).toEqual(first.children)
  put(w, 'ref/src.md', SRC.replace('rate 5', 'rate 6'), 2)
  w.reads.length = 0
  const third = await w.bash()
  expect(w.reads).toEqual([`${ROOT}/ref/src.md`])
  expect(suspectsOf(third).map(s => [s.child, s.reason, s.old, s.current])).toEqual([
    ['wip/child.md', 'changed', stampOf('## Abondement\nrate 5\n'), stampOf('## Abondement\nrate 6\n')],
  ])
})

test('L3: a change outside the anchored section does not make the child suspect', async ($, on) => {
  const w = world(on, $)
  fixture(w)
  const before = await w.start()
  put(w, 'ref/src.md', `${SRC}## Third\nz\n`, 2)
  const ix = await w.bash()
  expect(ix.sources['ref/src.md']!.blob).not.toBe(before.sources['ref/src.md']!.blob)
  expect(ix.sources['ref/src.md']!.sections['Third']).toBeTruthy()
  expect(ix.sources['ref/src.md']!.sections['Other']).toBe(before.sources['ref/src.md']!.sections['Other'])
  expect(suspectsOf(ix)).toEqual([])
})

test('L3: deleted source, renamed heading, parked source', async ($, on) => {
  const w = world(on, $)
  fixture(w)
  await w.start()
  put(w, 'ref/src.md', SRC.replace('## Abondement', '## Renamed'), 2)
  w.disk.delete(`${ROOT}/in/meeting.md`)
  const ix = await w.bash()
  const byReason = suspectsOf(ix).map(s => `${s.child}:${s.entry.ref}:${s.reason}`)
  expect(byReason).toContain('wip/child.md:ref/src.md:anchor-missing')
  expect(byReason).toContain('wip/child.md:in/meeting.md:source-missing')
  expect(byReason).toContain('wip/child.md:Meeting:source-missing')
  const parked = indexWith([rec({ target: 'park/old.md', stamp: { kind: 'hex', value: '000000000000' } })], { 'park/old.md': srcRec() })
  expect(suspectsOf(parked)[0]!.reason).toBe('source-parked')
})

test('sources: a binary source hashes its bytes, a read failure is unreadable, not suspect', async ($, on) => {
  const w = world(on, $)
  put(w, 'wip/c.md', '---\nsources:\n  - in/doc.pdf\n  - ref/huge.md\n---\n')
  w.disk.set(`${ROOT}/in/doc.pdf`, { bytes: btoa('%PDF-1.7 bytes'), mtime: 1 })
  put(w, 'ref/huge.md', 'x')
  const ix = await w.start()
  expect(ix.sources['in/doc.pdf']!.blob).toBe(blobSha(new TextEncoder().encode('%PDF-1.7 bytes')))
  expect(ix.sources['in/doc.pdf']!.sections).toEqual({})
  expect(assessEntry(ix, ix.children['wip/c.md']!.entries[0]!)).toEqual({ kind: 'clean' })
  // the next hash cannot read the file (e.g. over the 4 MiB cap): unreadable, never suspect
  w.disk.set(`${ROOT}/ref/huge.md`, { text: 'xx', mtime: 5, unreadable: true })
  const after = await w.bash()
  expect(after.sources['ref/huge.md']!.unreadable).toBeTruthy()
  expect(assessEntry(after, after.children['wip/c.md']!.entries[1]!)).toMatchObject({ kind: 'unreadable' })
  expect(suspectsOf(after)).toEqual([])
})

test('a Write on a child re-parses it, drops it when it declares nothing or is gone, ignores frozen zones', async ($, on) => {
  const w = world(on, $)
  fixture(w)
  await w.start()
  put(w, 'wip/section.md', '# Doc\n## Part\n<!-- sources: ref/src.md#Abondement @ok -->\n', 3)
  let ix = await w.wrote('wip/section.md')
  expect(ix.children['wip/section.md']!.entries[0]).toMatchObject({ anchor: 'Abondement', stamp: { kind: 'ok' } })
  put(w, 'wip/section.md', '# no more\n', 4)
  ix = await w.wrote('wip/section.md')
  expect(ix.children['wip/section.md']).toBeUndefined()
  w.disk.delete(`${ROOT}/wip/child.md`)
  ix = await w.wrote('wip/child.md')
  expect(ix.children['wip/child.md']).toBeUndefined()
  ix = await w.wrote('in/frozen-child.md')
  expect(ix.children['in/frozen-child.md']).toBeUndefined()
})

test('a Write that creates a child, or moves a source, updates the index', async ($, on) => {
  const w = world(on, $)
  fixture(w)
  await w.start()
  put(w, 'wip/new.md', '---\nsources:\n  - ref/other.md\n---\n', 5)
  put(w, 'ref/other.md', 'o\n', 5)
  let ix = await w.wrote('wip/new.md')
  expect(Object.keys(ix.children)).toContain('wip/new.md')
  expect(ix.md).toContain('wip/new.md')
  expect(ix.sources['ref/other.md']!.blob).toBe(blobSha('o\n'))
  put(w, 'ref/other.md', 'o2\n', 6)
  ix = await w.wrote('ref/other.md')
  expect(ix.sources['ref/other.md']!.blob).toBe(blobSha('o2\n'))
  expect(suspectsOf(ix)).toEqual([])
})

test('off file: no sweep, no index, no write to the store', async ($, on) => {
  const w = world(on, $)
  fixture(w)
  put(w, '.stoa-keel-off', '')
  await w.start()
  expect(w.store.size).toBe(0)
  expect(w.procs).toEqual([])
})

test('idle: no declaration under root -> empty index', async ($, on) => {
  const w = world(on, $)
  put(w, 'a.md', '# nothing\n')
  const ix = await w.start()
  expect(ix.children).toEqual({})
  expect(ix.sources).toEqual({})
  expect(suspectsOf(ix)).toEqual([])
})

// ── K4: watchPaths, injection ───────────────────────────────────────────────

const stamped = (w: World, rel: string, text: string, anchor = ''): void => put(w, rel, `---\nsources:\n  - ref/src.md${anchor} @${stampOf(anchor ? '## Abondement\nrate 5\n' : SRC)}\n---\n${text}`)

test('SessionStart: watchPaths = indexed existing sources, absolute; nothing told when clean', async ($, on) => {
  const w = world(on, $)
  fixture(w)
  const ix = await w.start()
  expect(w.last.start?.watchPaths?.sort()).toEqual([`${ROOT}/in/meeting.md`, `${ROOT}/ref/src.md`])
  expect(w.last.start?.additionalContext).toBeUndefined()
  expect(watchTargets(ix).sort()).toEqual(w.last.start?.watchPaths?.sort())
})

test('SessionStart: idle or off -> no watchPaths, no context', async ($, on) => {
  const w = world(on, $)
  put(w, 'a.md', '# nothing\n')
  await w.start()
  expect(w.last.start).toEqual({})
  put(w, '.stoa-keel-off', '')
  fixture(w)
  await w.start()
  expect(w.last.start).toEqual({})
})

test('SessionStart: current suspects go to the model once, then only new ones at the next prompt', async ($, on) => {
  const w = world(on, $)
  stamped(w, 'wip/c.md', 'body')
  put(w, 'ref/src.md', SRC.replace('rate 5', 'rate 9'), 2)
  const ix = await w.start()
  expect(suspectsOf(ix).map(s => s.reason)).toEqual(['changed'])
  expect(w.last.start?.additionalContext?.[0]).toContain('wip/c.md <- ref/src.md (changed)')
  expect(w.last.start?.additionalContext?.[0]).toContain('@ok')
  expect(await w.prompt()).toEqual([])
})

test('PostToolUse: a Write on a source tells the model which derived files became suspect, once', async ($, on) => {
  const w = world(on, $)
  stamped(w, 'wip/c.md', 'body')
  await w.start()
  put(w, 'ref/src.md', SRC.replace('rate 5', 'rate 9'), 2)
  const ix = await w.wrote('ref/src.md')
  expect(w.last.tool?.additionalContext?.[0]).toContain('ref/src.md changed')
  expect(w.last.tool?.additionalContext?.[0]).toContain('- wip/c.md <- ref/src.md (changed)')
  expect(ix.injected).toHaveLength(1)
  expect(await w.prompt()).toEqual([])
  put(w, 'ref/src.md', SRC.replace('rate 5', 'rate 10'), 3)
  await w.wrote('ref/src.md')
  expect(w.last.tool?.additionalContext?.[0]).toContain('(changed)')
})

test('PostToolUse: Bash moving a source is told; a change outside the anchored section is not', async ($, on) => {
  const w = world(on, $)
  stamped(w, 'wip/c.md', 'body', '#Abondement')
  await w.start()
  put(w, 'ref/src.md', SRC.replace('x\n', 'y\n'), 2)
  await w.bash()
  expect(w.last.tool).toEqual({})
  put(w, 'ref/src.md', SRC.replace('rate 5', 'rate 7'), 3)
  await w.bash()
  expect(w.last.tool?.additionalContext?.[0]).toContain('wip/c.md <- ref/src.md#Abondement (changed)')
})

test('FileChanged: the index moves, the model is told at the next prompt, once', async ($, on) => {
  const w = world(on, $)
  stamped(w, 'wip/c.md', 'body')
  await w.start()
  put(w, 'ref/src.md', SRC.replace('rate 5', 'rate 9'), 2)
  const ix = await w.fileChanged('ref/src.md')
  expect(suspectsOf(ix)).toHaveLength(1)
  expect(ix.injected ?? []).toEqual([])
  const told = await w.prompt()
  expect(told).toHaveLength(1)
  expect(told[0]).toContain('wip/c.md <- ref/src.md (changed)')
  expect(await w.prompt()).toEqual([])
})

test('prompt.submit: a stat sweep finds what the host did not watch; a cleared suspect comes back as new', async ($, on) => {
  const w = world(on, $)
  stamped(w, 'wip/c.md', 'body')
  await w.start()
  put(w, 'ref/src.md', SRC.replace('rate 5', 'rate 9'), 2)
  expect(await w.prompt()).toHaveLength(1)
  put(w, 'ref/src.md', SRC, 3)
  expect(await w.prompt()).toEqual([])
  expect(w.index().injected).toEqual([])
  put(w, 'ref/src.md', SRC.replace('rate 5', 'rate 9'), 4)
  expect(await w.prompt()).toHaveLength(1)
})

test('prompt.submit: off file or no index -> prompt untouched', async ($, on) => {
  const w = world(on, $)
  expect(await w.prompt()).toEqual([])
  fixture(w)
  await w.start()
  put(w, '.stoa-keel-off', '')
  put(w, 'ref/src.md', SRC.replace('rate 5', 'rate 9'), 2)
  expect(await w.prompt()).toEqual([])
})

const fake = (n: number, over: Partial<EntryRec> = {}): Index => ({
  ...emptyIndex(ROOT),
  children: Object.fromEntries(Array.from({ length: n }, (_, i) => [`wip/c${String(i).padStart(2, '0')}.md`, { mtime: 1, size: 1, entries: [rec({ stamp: { kind: 'hex', value: '000000000000' }, ...over })] }])),
  sources: { 'src.md': srcRec() },
})

test('format: 20 entries then "N more"; char cap drops entries; empty -> null', () => {
  const ix = fake(25)
  const all = suspectsOf(ix)
  const text = formatSuspects('head', all, 100000)!
  expect(text.split('\n').filter(l => l.startsWith('- wip/'))).toHaveLength(20)
  expect(text).toContain('- 5 more')
  const capped = formatSuspects('head', all, 300)!
  expect(capped.length).toBeLessThanOrEqual(300)
  expect(capped).toMatch(/- \d+ more/)
  expect(formatSuspects('head', [], 100)).toBeNull()
})

test('injected: markInjected keeps only live keys; newSuspects filters them', () => {
  const ix = fake(2)
  const [a, b] = suspectsOf(ix)
  markInjected(ix, [a!])
  expect(newSuspects(ix).map(s => s.child)).toEqual([b!.child])
  ix.children = { [b!.child]: ix.children[b!.child]! }
  markInjected(ix, [])
  expect(ix.injected).toEqual([])
})

// ── K5: stamping at boundaries, @ok, updated, manual, journal ───────────────

test('rewriteStamps: quoted, flow, multi-entry comment, bounded match, missing raw', () => {
  const e = (raw: string, line: number): EntryRec => rec({ raw, ref: raw.split(/[#\s]/)[0]!, line })
  const text = '---\nsources:\n  - "a.md#H @ok"\n  - data.md\nsource: [a.md, b.md @ok]\n---\n## S\n<!-- sources: a.md; x.md#Y @ok -->\n'
  const r = rewriteStamps(text, [
    { entry: e('a.md#H @ok', 2), stamp: '111111111111' },
    { entry: e('a.md', 3), stamp: '222222222222' }, // only "data.md" on that line: "a.md" inside it is not an entry
    { entry: e('b.md @ok', 4), stamp: '333333333333' },
    { entry: e('a.md', 4), stamp: '444444444444' },
    { entry: e('x.md#Y @ok', 7), stamp: '555555555555' },
    { entry: e('a.md', 7), stamp: '666666666666' },
  ])
  expect(r.failed).toEqual([1])
  expect(r.text.split('\n')).toEqual([
    '---',
    'sources:',
    '  - "a.md#H @111111111111"',
    '  - data.md',
    'source: [a.md @444444444444, b.md @333333333333]',
    '---',
    '## S',
    '<!-- sources: a.md @666666666666; x.md#Y @555555555555 -->',
    '',
  ])
  expect(rewriteStamps('x\n', [{ entry: e('a.md', 9), stamp: '1' }]).failed).toEqual([0])
})

test('journal line: iso kind child <- source[#a] old->new (who)', () => {
  const g = { kind: 'ok' as const, child: 'wip/c.md', source: 'ref/src.md#A', old: 'ok', stamp: 'abc' }
  expect(journalLine(g, '2026-10-08T10:00:00.000Z')).toBe('2026-10-08T10:00:00.000Z ok wip/c.md <- ref/src.md#A ok->abc (agent)')
})

const A5 = stampOf('## Abondement\nrate 5\n')
const A9 = stampOf('## Abondement\nrate 9\n')
const SRC9 = SRC.replace('rate 5', 'rate 9')
const childWith = (entry: string, body = 'body\n'): string => `---\nsources:\n  - ${entry}\n---\n${body}`

test('K5: SessionStart writes absent stamps once, journals them, and a second start writes nothing', async ($, on) => {
  const w = world(on, $)
  put(w, 'ref/src.md', SRC)
  put(w, 'wip/c.md', childWith('ref/src.md#Abondement'))
  const ix = await w.start()
  expect(w.text('wip/c.md')).toBe(childWith(`ref/src.md#Abondement @${A5}`))
  expect(w.journal()).toEqual([`stamp wip/c.md <- ref/src.md#Abondement none->${A5} (keel)`])
  expect(suspectsOf(ix)).toEqual([])
  expect(ix.children['wip/c.md']!.entries[0]!.stamp).toEqual({ kind: 'hex', value: A5 })
  w.writes.length = 0
  await w.start()
  expect(docWrites(w)).toEqual([])
  expect(w.journal()).toHaveLength(1)
})

test('K5: D14 - nothing is written mid-turn; the Stop boundary stamps a child created during the turn', async ($, on) => {
  const w = world(on, $)
  put(w, 'ref/src.md', SRC)
  await w.start()
  put(w, 'wip/new.md', childWith('ref/src.md#Abondement'), 5)
  await w.wrote('wip/new.md')
  await w.bash()
  expect(docWrites(w)).toEqual([])
  expect(w.text('wip/new.md')).toBe(childWith('ref/src.md#Abondement'))
  await w.stop()
  expect(docWrites(w)).toEqual([`${ROOT}/wip/new.md`, `${ROOT}/journal/keel.md`])
  expect(w.text('wip/new.md')).toBe(childWith(`ref/src.md#Abondement @${A5}`))
})

test('K5: @ok re-stamps to the current hash at Stop, journaled as ok; the child leaves the suspects', async ($, on) => {
  const w = world(on, $)
  put(w, 'ref/src.md', SRC)
  put(w, 'wip/c.md', childWith(`ref/src.md#Abondement @${A5}`))
  await w.start()
  put(w, 'ref/src.md', SRC9, 2)
  await w.wrote('ref/src.md')
  expect(suspectsOf(w.index())).toHaveLength(1)
  put(w, 'wip/c.md', childWith(`ref/src.md#Abondement @ok`), 3)
  await w.wrote('wip/c.md')
  expect(w.text('wip/c.md')).toContain('@ok')
  const ix = await w.stop()
  expect(w.text('wip/c.md')).toBe(childWith(`ref/src.md#Abondement @${A9}`))
  expect(suspectsOf(ix)).toEqual([])
  expect(w.journal()).toEqual([`ok wip/c.md <- ref/src.md#Abondement ok->${A9} (agent)`])
})

test('K5: @ok written by a Bash edit is seen at Stop (the child moved on disk)', async ($, on) => {
  const w = world(on, $)
  put(w, 'ref/src.md', SRC)
  put(w, 'wip/c.md', childWith(`ref/src.md @${stampOf(SRC)}`))
  await w.start()
  put(w, 'ref/src.md', SRC9, 2)
  await w.bash()
  put(w, 'wip/c.md', childWith('ref/src.md @ok'), 3)
  await w.stop()
  expect(w.text('wip/c.md')).toBe(childWith(`ref/src.md @${stampOf(SRC9)}`))
  expect(w.journal()[0]).toMatch(/^ok wip\/c.md <- ref\/src.md ok->/)
})

test('K5: updated - the agent wrote the suspect child after the source moved: re-stamped at Stop, journaled', async ($, on) => {
  const w = world(on, $)
  put(w, 'ref/src.md', SRC)
  put(w, 'wip/c.md', childWith(`ref/src.md#Abondement @${A5}`))
  await w.start()
  put(w, 'ref/src.md', SRC9, 2)
  await w.wrote('ref/src.md')
  put(w, 'wip/c.md', childWith(`ref/src.md#Abondement @${A5}`, 'body, now with rate 9\n'), 3)
  await w.wrote('wip/c.md')
  expect(w.text('wip/c.md')).toContain(`@${A5}`)
  const ix = await w.stop()
  expect(w.text('wip/c.md')).toBe(childWith(`ref/src.md#Abondement @${A9}`, 'body, now with rate 9\n'))
  expect(suspectsOf(ix)).toEqual([])
  expect(ix.reviewed).toBeUndefined()
  expect(w.journal()).toEqual([`updated wip/c.md <- ref/src.md#Abondement ${A5}->${A9} (keel)`])
})

test('K5: updated does not apply when the child was written before the source moved, or the source moved again after', async ($, on) => {
  const w = world(on, $)
  put(w, 'ref/src.md', SRC)
  put(w, 'wip/c.md', childWith(`ref/src.md#Abondement @${A5}`))
  await w.start()
  put(w, 'wip/c.md', childWith(`ref/src.md#Abondement @${A5}`, 'edited while clean\n'), 2)
  await w.wrote('wip/c.md')
  put(w, 'ref/src.md', SRC9, 3)
  await w.wrote('ref/src.md')
  let ix = await w.stop()
  expect(suspectsOf(ix).map(s => s.reason)).toEqual(['changed'])
  expect(w.journal()).toEqual([])
  // written against rate 9, then the source moves again: still suspect
  put(w, 'wip/c.md', childWith(`ref/src.md#Abondement @${A5}`, 'edited for 9\n'), 4)
  await w.wrote('wip/c.md')
  put(w, 'ref/src.md', SRC.replace('rate 5', 'rate 11'), 5)
  await w.wrote('ref/src.md')
  ix = await w.stop()
  expect(suspectsOf(ix).map(s => s.reason)).toEqual(['changed'])
  expect(w.text('wip/c.md')).toContain(`@${A5}`)
  expect(w.journal()).toEqual([])
})

test('K5: manual - a stamp changed by hand to the current hash is accepted and journaled, not rewritten', async ($, on) => {
  const w = world(on, $)
  put(w, 'ref/src.md', SRC)
  put(w, 'wip/c.md', childWith(`ref/src.md#Abondement @${A5}`))
  await w.start()
  put(w, 'ref/src.md', SRC9, 2)
  await w.wrote('ref/src.md')
  put(w, 'wip/c.md', childWith(`ref/src.md#Abondement @${A9}`), 3)
  const ix = await w.wrote('wip/c.md')
  expect(suspectsOf(ix)).toEqual([])
  expect(w.journal()).toEqual([`manual wip/c.md <- ref/src.md#Abondement ${A5}->${A9} (hand)`])
  w.writes.length = 0
  await w.stop()
  expect(docWrites(w)).toEqual([])
  expect(w.journal()).toHaveLength(1)
})

test('K5: a bad stamp and an unresolved or opaque entry are never rewritten', async ($, on) => {
  const w = world(on, $)
  put(w, 'ref/src.md', SRC)
  put(w, 'wip/c.md', '---\nsources:\n  - ref/src.md @zzz\n  - https://x.io/a\n  - "[[Nowhere]]"\n---\n')
  const ix = await w.start()
  expect(docWrites(w)).toEqual([])
  expect(suspectsOf(ix).map(s => s.reason)).toEqual(['bad-stamp'])
})

test('K5: off file or idle index -> no write at Stop', async ($, on) => {
  const w = world(on, $)
  put(w, 'a.md', '# nothing\n')
  await w.start()
  await w.stop()
  put(w, 'ref/src.md', SRC)
  put(w, 'wip/c.md', childWith('ref/src.md'))
  put(w, '.stoa-keel-off', '')
  await w.start()
  await w.stop()
  expect(docWrites(w)).toEqual([])
})

// ── K6: git blobs and diffs (D9, §8) ────────────────────────────────────────

test('K6: stamping stores the stamped section as a git blob, once per (source, anchor, stamp)', async ($, on) => {
  const w = world(on, $)
  put(w, 'ref/src.md', SRC)
  put(w, 'wip/c.md', '---\nsources:\n  - ref/src.md#Abondement\n  - ref/src.md#Abondement\n---\n')
  await w.start()
  expect([...w.objects.values()]).toEqual(['## Abondement\nrate 5\n'])
  expect([...w.objects.keys()][0]!.slice(0, 12)).toBe(A5)
  expect(w.procs.filter(a => a[0] === 'git' && a.includes('hash-object'))).toHaveLength(1)
})

test('K6: a whole-file stamp stores the whole source; an old hand-written stamp stores nothing', async ($, on) => {
  const w = world(on, $)
  put(w, 'ref/src.md', SRC)
  put(w, 'wip/c.md', childWith('ref/src.md'))
  put(w, 'wip/old.md', childWith('ref/src.md @000000000000'))
  await w.start()
  expect([...w.objects.values()]).toEqual([SRC])
})

test('K6: PostToolUse feedback carries the diff of a changed source against the stamped content', async ($, on) => {
  const w = world(on, $)
  put(w, 'ref/src.md', SRC)
  put(w, 'wip/c.md', childWith('ref/src.md#Abondement'))
  await w.start()
  put(w, 'ref/src.md', SRC9, 2)
  await w.wrote('ref/src.md')
  const text = w.last.tool?.additionalContext?.[0] ?? ''
  expect(text).toContain('diff ref/src.md#Abondement (for wip/c.md):')
  expect(text).toContain('@@ -1 +1 @@\n-## Abondement\n-rate 5\n-\n+## Abondement\n+rate 9\n+')
  expect(text).not.toContain('diff --git')
  expect(text.indexOf('(changed)')).toBeLessThan(text.indexOf('diff ref/src.md'))
  expect(text.endsWith('@ok.')).toBe(true)
})

test('K6: diff cap truncates and says so', async ($, on) => {
  const w = world(on, $)
  const big = `## Abondement\n${'a long line of the section\n'.repeat(200)}`
  put(w, 'ref/src.md', big)
  put(w, 'wip/c.md', childWith('ref/src.md#Abondement'))
  await w.start()
  put(w, 'ref/src.md', big.replace('a long', 'A long'), 2)
  await w.wrote('ref/src.md')
  const text = w.last.tool?.additionalContext?.[0] ?? ''
  expect(text).toContain('... diff truncated (')
  expect(text.length).toBeLessThan(2500)
})

test('K6: degraded - stamp too old, not a git repo', async ($, on) => {
  const w = world(on, $)
  put(w, 'ref/src.md', SRC)
  put(w, 'wip/c.md', childWith(`ref/src.md#Abondement @${A5}`))
  await w.start() // clean stamp written by a previous life: no blob
  put(w, 'ref/src.md', SRC9, 2)
  await w.wrote('ref/src.md')
  expect(w.last.tool?.additionalContext?.[0]).toContain('diff ref/src.md#Abondement (for wip/c.md):\nunavailable: stamp too old')
  put(w, 'ref/src.md', SRC.replace('rate 5', 'rate 10'), 3)
  w.noGit = true
  await w.wrote('ref/src.md')
  expect(w.last.tool?.additionalContext?.[0]).toContain('unavailable: not a git repo')
})

test('K6: git failing at stamp time -> stamp still written, degraded note, nothing thrown', async ($, on) => {
  const w = world(on, $)
  w.gitFails = true
  put(w, 'ref/src.md', SRC)
  put(w, 'wip/c.md', childWith('ref/src.md#Abondement'))
  const ix = await w.start()
  expect(w.text('wip/c.md')).toContain(`@${A5}`)
  expect(ix.degraded).toContain('git: blobs not stored')
})

test('K6: a binary source says "binary changed"; other reasons carry no diff', async ($, on) => {
  const w = world(on, $)
  w.disk.set(`${ROOT}/in/doc.pdf`, { bytes: btoa('v1'), mtime: 1 })
  put(w, 'wip/c.md', childWith('in/doc.pdf'))
  put(w, 'ref/src.md', SRC)
  put(w, 'wip/d.md', childWith('ref/src.md#Abondement'))
  await w.start()
  w.disk.set(`${ROOT}/in/doc.pdf`, { bytes: btoa('v2!'), mtime: 2 })
  put(w, 'ref/src.md', SRC.replace('## Abondement', '## Renamed'), 2)
  await w.bash()
  const text = w.last.tool?.additionalContext?.[0] ?? ''
  expect(text).toContain('(for wip/c.md):\nbinary changed')
  expect(text).toContain('wip/d.md <- ref/src.md#Abondement (anchor-missing)')
  expect(text).not.toContain('(for wip/d.md)')
})

// ── K7: Stop block (D10), toast, status file ───────────────────────────────

const stopWorld = async ($: Engine, on: On) => {
  const w = world(on, $)
  put(w, 'ref/src.md', SRC)
  put(w, 'wip/c.md', childWith('ref/src.md#Abondement'))
  await w.start()
  await w.prompt() // the turn begins
  return w
}

test('K7: a suspect created this turn blocks Stop once, with the diff; the re-entry Stop does not block', async ($, on) => {
  const w = await stopWorld($, on)
  put(w, 'ref/src.md', SRC9, 2)
  await w.wrote('ref/src.md')
  await w.stop()
  const block = w.last.stop?.block ?? ''
  expect(block.startsWith('keel: sources changed this turn, derived files not reviewed:\n- wip/c.md <- ref/src.md#Abondement (changed)\n  diff:\n    @@ -1 +1 @@')).toBe(true)
  expect(block).toContain('-rate 5')
  expect(block).toContain('+rate 9')
  expect(block).toContain(GUIDE)
  expect(block).not.toContain('keel rewrote stamps')
  await w.stop(true) // the host re-enters after the block
  expect(w.last.stop?.block).toBeUndefined()
  await w.stop() // even without the host flag: the block is spent for this turn
  expect(w.last.stop?.block).toBeUndefined()
})

test('K7: the agent fixes the child after the block -> stamped `updated`, nothing left to block', async ($, on) => {
  const w = await stopWorld($, on)
  put(w, 'ref/src.md', SRC9, 2)
  await w.wrote('ref/src.md')
  await w.stop()
  put(w, 'wip/c.md', w.text('wip/c.md').replace('body', 'body, rate 9'), 3)
  await w.wrote('wip/c.md')
  const ix = await w.stop(true)
  expect(w.last.stop?.block).toBeUndefined()
  expect(suspectsOf(ix)).toEqual([])
  expect(w.journal().some(l => l.startsWith('updated wip/c.md'))).toBe(true)
})

test('K7: a suspect that predates the turn never blocks, and a new turn re-arms the block', async ($, on) => {
  const w = world(on, $)
  put(w, 'ref/src.md', SRC)
  put(w, 'wip/c.md', childWith('ref/src.md#Abondement'))
  await w.start()
  put(w, 'ref/src.md', SRC9, 2) // moved between sessions
  await w.start() // resume: the suspect is told at SessionStart
  await w.prompt()
  await w.stop()
  expect(w.last.stop?.block).toBeUndefined()
  put(w, 'ref/src.md', SRC.replace('rate 5', 'rate 12'), 3) // moves again during the turn: a new suspect
  await w.bash()
  await w.stop()
  expect(w.last.stop?.block).toContain('wip/c.md <- ref/src.md#Abondement (changed)')
  await w.prompt() // next turn
  put(w, 'ref/src.md', SRC.replace('rate 5', 'rate 13'), 4)
  await w.bash()
  await w.stop()
  expect(w.last.stop?.block).toContain('(changed)')
})

test('K7: `@ok` written in the turn clears the suspect before the block is computed', async ($, on) => {
  const w = await stopWorld($, on)
  put(w, 'ref/src.md', SRC9, 2)
  await w.wrote('ref/src.md')
  put(w, 'wip/c.md', w.text('wip/c.md').replace(/@[0-9a-f]{12}/, '@ok'), 3)
  const ix = await w.stop()
  expect(w.last.stop?.block).toBeUndefined()
  expect(suspectsOf(ix)).toEqual([])
  expect(w.text('wip/c.md')).toContain(`@${stampOf('## Abondement\nrate 9\n')}`)
})

test('K7: the block caps at 10 children then "N more", and stays under its char cap', async ($, on) => {
  const w = world(on, $)
  const big = `## Abondement\n${'a long line of the section\n'.repeat(300)}`
  put(w, 'ref/src.md', big)
  for (let i = 0; i < 12; i++) put(w, `wip/c${String(i).padStart(2, '0')}.md`, childWith('ref/src.md#Abondement'))
  await w.start()
  await w.prompt()
  put(w, 'ref/src.md', big.replace('a long', 'A long'), 2)
  await w.bash()
  await w.stop()
  const block = w.last.stop?.block ?? ''
  expect(block.match(/^- wip\//gm)).toHaveLength(10)
  expect(block).toContain('- 2 more (see /keel)')
  expect(block.length).toBeLessThanOrEqual(10000)
  expect(block.endsWith(GUIDE)).toBe(true)
})

test('K7: the block lists stamps keel rewrote at the boundary', async ($, on) => {
  const w = await stopWorld($, on)
  put(w, 'wip/new.md', childWith('ref/src.md#Abondement').replace(/ @[0-9a-f]{12}/, ''), 5) // a child without stamp: keel stamps it at Stop
  put(w, 'ref/src.md', SRC9, 6)
  await w.wrote('wip/new.md')
  await w.wrote('ref/src.md')
  await w.stop()
  expect(w.last.stop?.block).toContain('keel rewrote stamps in: wip/new.md (re-read before editing).')
})

test('K7: idle or off -> no block, no toast, no status file', async ($, on) => {
  const w = world(on, $)
  put(w, 'ref/src.md', SRC)
  put(w, 'wip/plain.md', '# nothing declared\n')
  await w.start()
  await w.prompt()
  await w.stop()
  expect(w.last.stop?.block).toBeUndefined()
  expect(w.toasts).toEqual([])
  expect(w.disk.has(`${ROOT}/keel-status-llm.md`)).toBe(false)
  put(w, 'wip/c.md', childWith('ref/src.md#Abondement'))
  await w.start()
  put(w, '.stoa-keel-off', '')
  put(w, 'ref/src.md', SRC9, 2)
  await w.stop()
  expect(w.last.stop?.block).toBeUndefined()
  expect(w.toasts).toEqual([])
})

test('K7: toast at Stop says what is left to review and what was stamped', async ($, on) => {
  const w = await stopWorld($, on)
  put(w, 'ref/src.md', SRC9, 2)
  await w.wrote('ref/src.md')
  await w.stop()
  expect(w.toasts).toEqual(['keel: 1 derived file to review'])
  await w.stop(true) // the re-entry Stop after a block: the same text is not stacked a second time
  expect(w.toasts).toEqual(['keel: 1 derived file to review'])
  put(w, 'wip/c.md', w.text('wip/c.md').replace('body', 'body, rate 9'), 3)
  await w.wrote('wip/c.md')
  await w.stop(true)
  expect(w.toasts.at(-1)).toBe('keel: stamped wip/c.md')
})

test('K7: keel-status-llm.md lists suspects with reason and since, and is not rewritten when only the sweep time moved', async ($, on) => {
  const w = await stopWorld($, on)
  await w.stop()
  expect(w.text('keel-status-llm.md')).toContain('suspects: none')
  const writes = () => w.writes.filter(p => p.endsWith('keel-status-llm.md')).length
  const before = writes()
  await w.stop()
  expect(writes()).toBe(before) // same content, no rewrite
  put(w, 'ref/src.md', SRC9, 2)
  await w.wrote('ref/src.md')
  await w.stop()
  const status = w.text('keel-status-llm.md')
  expect(status).toContain('suspects: 1')
  expect(status).toMatch(/- wip\/c\.md <- ref\/src\.md#Abondement \(changed\) since \d{4}-\d\d-\d\dT/)
  expect(writes()).toBe(before + 1)
})

// ── live defects D-k1..D-k3 ─────────────────────────────────────────────────

test('D-k1: the same toast is not repeated within a turn, and is available again in the next one', async ($, on) => {
  const w = await stopWorld($, on)
  put(w, 'ref/src.md', SRC9, 2)
  await w.wrote('ref/src.md')
  await w.stop()
  await w.stop(true)
  await w.stop(true)
  expect(w.toasts).toEqual(['keel: 1 derived file to review'])
  await w.prompt() // next turn: the suspect is old news now
  put(w, 'ref/src.md', SRC.replace('rate 5', 'rate 12'), 3)
  await w.wrote('ref/src.md')
  await w.stop()
  expect(w.toasts).toEqual(['keel: 1 derived file to review', 'keel: 1 derived file to review'])
})

test('D-k2: a source edited by hand reaches the next prompt with its capped diff', async ($, on) => {
  const w = await stopWorld($, on)
  put(w, 'ref/src.md', SRC9, 2) // no tool call: only the prompt sweep sees it
  const ctx = await w.prompt()
  expect(ctx).toHaveLength(1)
  expect(ctx[0]).toContain('wip/c.md <- ref/src.md#Abondement (changed)')
  expect(ctx[0]).toContain('diff ref/src.md#Abondement (for wip/c.md):\n@@ -1 +1 @@')
  expect(ctx[0]).toContain('-rate 5')
  expect(ctx[0]).toContain('+rate 9')
  expect(ctx[0]!.endsWith(GUIDE)).toBe(true)
  expect(await w.prompt()).toEqual([]) // told once
})

test('D-k2: the prompt diff keeps the feedback caps (3 diffs, 1200 chars each)', async ($, on) => {
  const w = world(on, $)
  const big = `## Abondement\n${'a long line of the section\n'.repeat(300)}`
  put(w, 'ref/src.md', big)
  for (let i = 0; i < 5; i++) put(w, `wip/c${i}.md`, childWith('ref/src.md#Abondement'))
  await w.start()
  await w.prompt() // the SessionStart stamps are named here
  put(w, 'ref/src.md', big.replace('a long', 'A long'), 2)
  const text = (await w.prompt())[0]!
  expect(text.match(/^diff ref\/src\.md#Abondement/gm)).toHaveLength(3)
  expect(text).toContain('... diff truncated')
})

test('D-k3: stamps keel wrote at Stop are named at the next prompt, once', async ($, on) => {
  const w = await stopWorld($, on)
  put(w, 'wip/new.md', childWith('ref/src.md#Abondement'), 5) // no stamp: keel writes it at Stop
  await w.wrote('wip/new.md')
  await w.stop()
  expect(w.last.stop?.block).toBeUndefined()
  expect(w.text('wip/new.md')).toMatch(/@[0-9a-f]{12}/)
  const ctx = await w.prompt()
  expect(ctx).toHaveLength(1)
  expect(ctx[0]).toContain('keel re-stamped wip/new.md (stamp lines only)')
  expect(ctx[0]).toContain("keel's own write, not someone else's edit")
  expect(await w.prompt()).toEqual([])
})

test('D-k3: stamps written at SessionStart are named at the first prompt; a block that named them does not repeat it', async ($, on) => {
  const w = world(on, $)
  put(w, 'ref/src.md', SRC)
  put(w, 'wip/c.md', childWith('ref/src.md#Abondement'))
  await w.start()
  expect((await w.prompt())[0]).toContain('keel re-stamped wip/c.md')
  put(w, 'wip/new.md', childWith('ref/src.md#Abondement'), 5)
  put(w, 'ref/src.md', SRC9, 6)
  await w.wrote('wip/new.md')
  await w.wrote('ref/src.md')
  await w.stop()
  expect(w.last.stop?.block).toContain('keel rewrote stamps in: wip/new.md')
  expect(await w.prompt()).toEqual([])
})

// ── K8: /keel ───────────────────────────────────────────────────────────────

test('K8: /keel is declared by the session.start branch of the session.* glob, also while off', async ($, on) => {
  const w = world(on, $)
  put(w, 'ref/src.md', SRC)
  await $.session.start({ cwd: ROOT, surface: 'terminal', isInteractive: true })
  await $.session.start({ cwd: ROOT, surface: 'terminal', isInteractive: true })
  expect(w.registered.filter(n => n === 'keel')).toHaveLength(2)
  put(w, '.stoa-keel-off', '')
  await $.session.start({ cwd: ROOT, surface: 'terminal', isInteractive: true })
  expect(w.registered.filter(n => n === 'keel')).toHaveLength(3)
  await w.start()
  expect(w.registered.filter(n => n === 'keel')).toHaveLength(3)
})

test('K8: /keel lists the suspects with reason and age, then the size of the index', async ($, on) => {
  const w = await stopWorld($, on)
  expect(await w.cmd()).toMatch(/^keel: no suspect\n1 derived file, 1 source; swept \d{4}-/)
  put(w, 'ref/src.md', SRC9, 2) // moved by hand: /keel sweeps first
  const text = await w.cmd()
  expect(text).toMatch(/^keel: 1 suspect\n- wip\/c\.md <- ref\/src\.md#Abondement \(changed\) since \d{4}-/)
})

test('K8: /keel on a root with nothing declared says so and points at scan', async ($, on) => {
  const w = world(on, $)
  put(w, 'ref/src.md', SRC)
  await w.start()
  expect(await w.cmd()).toContain('nothing declared under /work')
  expect(await w.cmd()).toContain('/keel scan')
})

test('K8: /keel scan finds a derived file created by hand, indexes it, stamps nothing before the turn end', async ($, on) => {
  const w = await stopWorld($, on)
  put(w, 'wip/hand.md', childWith('ref/src.md#Abondement'), 5)
  expect(Object.keys(w.index().children)).toEqual(['wip/c.md']) // invisible until a scan
  const text = await w.cmd('scan')
  expect(text).toContain('keel scan: 2 derived file(s), 1 source(s).')
  expect(text).toContain('found: wip/hand.md')
  expect(text).toContain('1 stamp(s) pending')
  expect(Object.keys(w.index().children).sort()).toEqual(['wip/c.md', 'wip/hand.md'])
  expect(w.text('wip/hand.md')).not.toMatch(/@[0-9a-f]{12}/)
  await w.stop()
  expect(w.text('wip/hand.md')).toMatch(/@[0-9a-f]{12}/) // the boundary stamps it
})

test('K8: /keel scan keeps the turn state: a suspect created before the scan still blocks Stop', async ($, on) => {
  const w = await stopWorld($, on)
  put(w, 'ref/src.md', SRC9, 2)
  await w.wrote('ref/src.md')
  await w.cmd('scan')
  await w.stop()
  expect(w.last.stop?.block).toContain('wip/c.md <- ref/src.md#Abondement (changed)')
})

test('K8: /keel why lists outbound entries with their state and inbound children', async ($, on) => {
  const w = await stopWorld($, on)
  put(w, 'wip/d.md', childWith('ref/src.md#Other'), 5)
  await w.cmd('scan')
  const child = await w.cmd('why wip/c.md')
  expect(child).toMatch(/^keel why wip\/c\.md\nderives from:\n- ref\/src\.md#Abondement @[0-9a-f]{12} - clean$/)
  const src = await w.cmd('why ref/src.md')
  expect(src).toContain('derived files:')
  expect(src).toContain('- wip/c.md (ref/src.md#Abondement @')
  expect(src).toContain('- wip/d.md (ref/src.md#Other no stamp - no stamp yet')
  put(w, 'ref/src.md', SRC9, 2)
  expect(await w.cmd('why /work/wip/c.md')).toContain('suspect: changed')
  expect(await w.cmd('why nowhere.md')).toBe('keel: nowhere.md is neither a derived file nor an indexed source.')
  expect(await w.cmd('why')).toContain('why needs a file')
})

test('K8: /keel off creates the file and every hook becomes a no-op; /keel on removes it and rescans', async ($, on) => {
  const w = await stopWorld($, on)
  expect(await w.cmd('off')).toContain('off in /work (created .stoa-keel-off)')
  expect(w.disk.has(`${ROOT}/.stoa-keel-off`)).toBe(true)
  expect(await w.cmd('off')).toContain('already off')
  expect(await w.cmd()).toBe('keel: off in /work (.stoa-keel-off present). /keel on to resume.')
  expect(await w.cmd('scan')).toContain('off in /work')
  put(w, 'ref/src.md', SRC9, 2)
  await w.stop()
  expect(w.last.stop?.block).toBeUndefined()
  expect(await w.prompt()).toEqual([])
  put(w, 'wip/late.md', childWith('ref/src.md#Other'), 5) // created while off
  expect(await w.cmd('on')).toBe('keel: on in /work; rescanned 2 derived file(s). 1 suspect(s).')
  expect(w.disk.has(`${ROOT}/.stoa-keel-off`)).toBe(false)
  expect(await w.cmd('on')).toContain('was not off')
  expect((await w.prompt())[0]).toContain('wip/c.md <- ref/src.md#Abondement (changed)')
})

test('K8: an unknown subcommand gets the usage, nothing is touched', async ($, on) => {
  const w = await stopWorld($, on)
  const before = w.writes.length
  expect(await w.cmd('frobnicate')).toBe('keel: unknown subcommand "frobnicate". usage: /keel | /keel scan | /keel why <file> | /keel off | /keel on')
  expect(w.writes.length).toBe(before)
})
