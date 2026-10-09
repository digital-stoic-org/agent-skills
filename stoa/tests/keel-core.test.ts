import { expect, test } from 'claude-code/testing'
import { anchorSections, blobSha, extractSection, headings, parseChild, parseEntry, sha1Hex, stampOf, withStamp } from '../hooks/keel-core.ts'

// Vectors from `printf 'blob N\0<content>' | sha1sum` (= git hash-object).
const BLOBS: [string, string][] = [
  ['', 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391'],
  ['hello\n', 'ce013625030ba8dba906f756967f9e9ca394464a'],
  ['test content\n', 'd670460b4b4aece5915caf5c68d12f560a9fe3e4'],
  ['é\n', 'c6003325155f475bd7c87731607525dce73be9cf'],
  ['日本\n', 'cf0d293b8b179e06153ce8cce58a78f612a9f955'],
  ['a'.repeat(55), 'd1985ddc2983785702b9a90effd5aff2f7cfdca4'],
  ['a'.repeat(56), '1f973e890f52da1f22fa7e5620a628bc4ee74cb3'],
  ['a'.repeat(64), '71b7a71962774fa5c721e1163f935cb61a0e09e6'],
]

test('sha1: blob ids match git, including padding boundaries and multi-byte text', () => {
  for (const [content, id] of BLOBS) expect(blobSha(content)).toBe(id)
  expect(blobSha(new TextEncoder().encode('hello\n'))).toBe('ce013625030ba8dba906f756967f9e9ca394464a')
  expect(stampOf('hello\n')).toBe('ce013625030b')
  expect(sha1Hex(new TextEncoder().encode('abc'))).toBe('a9993e364706816aba3e25717850c26c9cd0d89d')
})

test('entry: path, anchor, stamp states', () => {
  expect(parseEntry('ref/a.md')).toEqual({ raw: 'ref/a.md', ref: 'ref/a.md', kind: 'path', stamp: { kind: 'none' } })
  expect(parseEntry('ref/a.md#Abondement @3f9a1c0e7b2d')).toEqual({
    raw: 'ref/a.md#Abondement @3f9a1c0e7b2d',
    ref: 'ref/a.md',
    kind: 'path',
    anchor: 'Abondement',
    stamp: { kind: 'hex', value: '3f9a1c0e7b2d' },
  })
  expect(parseEntry('a.md#Two words and  trailing  ')?.anchor).toBe('Two words and  trailing')
  expect(parseEntry('a.md @ok')?.stamp).toEqual({ kind: 'ok' })
  expect(parseEntry('/abs/dir/a b.md')?.ref).toBe('/abs/dir/a b.md')
})

test('entry: malformed stamps are bad, not dropped', () => {
  expect(parseEntry('a.md @3F9A1C0E7B2D')?.stamp).toEqual({ kind: 'bad', raw: '3F9A1C0E7B2D' })
  expect(parseEntry('a.md @abc')?.stamp).toEqual({ kind: 'bad', raw: 'abc' })
  expect(parseEntry('a.md @')?.stamp).toEqual({ kind: 'bad', raw: '' })
  expect(parseEntry('a.md@3f9a1c0e7b2d')?.stamp).toEqual({ kind: 'none' })
})

test('entry: wikilinks keep the bare name, urls are never split on #', () => {
  expect(parseEntry('[[note-dir]]')).toEqual({ raw: '[[note-dir]]', ref: 'note-dir', kind: 'wikilink', stamp: { kind: 'none' } })
  expect(parseEntry('[[note-dir]]#Part @ok')).toMatchObject({ ref: 'note-dir', kind: 'wikilink', anchor: 'Part', stamp: { kind: 'ok' } })
  expect(parseEntry('[[note-dir#Part|alias]]')).toMatchObject({ ref: 'note-dir', anchor: 'Part' })
  expect(parseEntry('https://www.notion.so/page#frag')).toMatchObject({ kind: 'url', ref: 'https://www.notion.so/page#frag' })
  expect(parseEntry('https://x.io/a#b')?.anchor).toBeUndefined()
})

test('entry: empty or ref-less input is null', () => {
  expect(parseEntry('')).toBeNull()
  expect(parseEntry('   ')).toBeNull()
  expect(parseEntry('#Heading')).toBeNull()
  expect(parseEntry('[[]]')).toBeNull()
})

test('withStamp: replaces an existing stamp or appends one', () => {
  expect(withStamp('a.md#H @3f9a1c0e7b2d', 'ok')).toBe('a.md#H @ok')
  expect(withStamp('a.md#H @ok', '9b2e41d7aa01')).toBe('a.md#H @9b2e41d7aa01')
  expect(withStamp('a.md', '9b2e41d7aa01')).toBe('a.md @9b2e41d7aa01')
  expect(withStamp('  a.md  ', 'ok')).toBe('a.md @ok')
})

const SRC = ['# Title', 'intro', '## Abondement', 'line a', '### Detail', 'deep', '## Other', 'tail', '#### Four', 'x', ''].join('\n')

test('headings: levels, offsets, fenced code is skipped', () => {
  const t = ['## A', '```md', '## not a heading', '```', '~~~', '## nor this', '~~~', '## B', ''].join('\n')
  expect(headings(t).map(h => [h.level, h.text, h.line])).toEqual([[2, 'A', 0], [2, 'B', 7]])
  expect(t.slice(headings(t)[1]!.start)).toBe('## B\n')
  expect(headings('#nospace\n##\n## ok')).toHaveLength(1)
  expect(headings('## Win\r\nbody\r\n')[0]?.text).toBe('Win')
})

test('anchor: section runs to the next heading of same or higher level', () => {
  expect(extractSection(SRC, 'Abondement')?.text).toBe('## Abondement\nline a\n### Detail\ndeep\n')
  expect(extractSection(SRC, 'Detail')?.text).toBe('### Detail\ndeep\n')
  expect(extractSection(SRC, 'Other')?.text).toBe('## Other\ntail\n#### Four\nx\n')
  expect(extractSection(SRC, 'Abondement   ')?.heading).toBe('Abondement')
})

test('anchor: only exact H2/H3, case-sensitive; missing -> null', () => {
  expect(extractSection(SRC, 'abondement')).toBeNull()
  expect(extractSection(SRC, 'Title')).toBeNull()
  expect(extractSection(SRC, 'Four')).toBeNull()
  expect(extractSection(SRC, 'Nope')).toBeNull()
  expect([...anchorSections(SRC).keys()]).toEqual(['Abondement', 'Detail', 'Other'])
})

test('anchor: duplicate heading resolves to the first; hash changes only when the section does', () => {
  const dup = '## A\none\n## A\ntwo\n'
  expect(extractSection(dup, 'A')?.text).toBe('## A\none\n')
  const before = stampOf(extractSection(SRC, 'Abondement')!.text)
  expect(stampOf(extractSection(SRC.replace('\ntail\n', '\nTAIL\n'), 'Abondement')!.text)).toBe(before)
  expect(stampOf(extractSection(SRC.replace('line a', 'line b'), 'Abondement')!.text)).not.toBe(before)
})

test('child: frontmatter block list, quotes, wikilink, url, stamps', () => {
  const t = [
    '---',
    'title: x',
    'sources:',
    '  - ref/02-money-flow.md#Abondement @3f9a1c0e7b2d',
    '  - in/meetings/20260616.md @9b2e41d7aa01',
    '  - "[[note-fonctionnement-dir]]"',
    "  - 'quoted/it''s.md'",
    '  - https://www.notion.so/abc',
    'other: 1',
    '---',
    '# Body',
  ].join('\n')
  const es = parseChild(t)
  expect(es.map(e => [e.kind, e.ref, e.anchor, e.stamp.kind, e.line])).toEqual([
    ['path', 'ref/02-money-flow.md', 'Abondement', 'hex', 3],
    ['path', 'in/meetings/20260616.md', undefined, 'hex', 4],
    ['wikilink', 'note-fonctionnement-dir', undefined, 'none', 5],
    ['path', "quoted/it's.md", undefined, 'none', 6],
    ['url', 'https://www.notion.so/abc', undefined, 'none', 7],
  ])
  expect(es.every(e => e.scope.type === 'file')).toBe(true)
  expect(es[0]!.raw).toBe('ref/02-money-flow.md#Abondement @3f9a1c0e7b2d')
})

test('child: legacy `source:` scalar and flow list, union with `sources:` deduped', () => {
  expect(parseChild('---\nsource: a.md\n---\n').map(e => e.ref)).toEqual(['a.md'])
  expect(parseChild('---\nsource: "a b.md"\n---\n').map(e => e.ref)).toEqual(['a b.md'])
  expect(parseChild('---\nsource: [[wiki]]\n---\n').map(e => [e.kind, e.ref])).toEqual([['wikilink', 'wiki']])
  expect(parseChild('---\nsources: [a.md, "b.md#H @ok", [[w]]]\n---\n').map(e => e.ref)).toEqual(['a.md', 'b.md', 'w'])
  const both = parseChild('---\nsource: a.md\nsources:\n- a.md\n- b.md\n---\n')
  expect(both.map(e => e.ref)).toEqual(['a.md', 'b.md'])
  expect(parseChild('---\nsources:\n  - a.md # why\n---\n')[0]?.ref).toBe('a.md')
})

test('child: no frontmatter, unclosed frontmatter, or empty sources key gives nothing', () => {
  expect(parseChild('sources:\n  - a.md\n')).toEqual([])
  expect(parseChild('---\nsources:\n  - a.md\n')).toEqual([])
  expect(parseChild('---\nsources:\n---\n')).toEqual([])
  expect(parseChild('')).toEqual([])
  expect(parseChild('---\r\nsources:\r\n  - a.md\r\n---\r\n').map(e => e.ref)).toEqual(['a.md'])
})

test('child: section comment right after a heading, `;` separated, scoped to that section', () => {
  const t = [
    '# Doc',
    '## Abondement',
    '<!-- sources: ref/02.md#Abondement @3f9a1c0e7b2d; in/x.md -->',
    'prose',
    '### Sub',
    'more',
    '## Next',
    '',
    '<!-- sources: ignored.md -->',
    '',
  ].join('\n')
  const es = parseChild(t)
  expect(es.map(e => [e.ref, e.anchor, e.stamp.kind, e.line])).toEqual([
    ['ref/02.md', 'Abondement', 'hex', 2],
    ['in/x.md', undefined, 'none', 2],
  ])
  const s = es[0]!.scope
  expect(s.type === 'section' && s.heading === 'Abondement' && s.level === 2).toBe(true)
  expect(s.type === 'section' && t.slice(s.start, s.end)).toBe('## Abondement\n<!-- sources: ref/02.md#Abondement @3f9a1c0e7b2d; in/x.md -->\nprose\n### Sub\nmore\n')
})

test('child: file-level and section-level add up; comments inside code fences are ignored', () => {
  const t = ['---', 'sources:', '  - f.md', '---', '## S', '<!-- sources: s.md -->', '```', '## Fake', '<!-- sources: fake.md -->', '```', ''].join('\n')
  expect(parseChild(t).map(e => [e.ref, e.scope.type])).toEqual([['f.md', 'file'], ['s.md', 'section']])
})
