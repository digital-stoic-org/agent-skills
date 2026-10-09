// keel core: pure functions, no `$`, no I/O. Spec: SPEC-keel-llm.md §3 (declaration format) and §5 (hashing).

export const STAMP_LEN = 12
// D13: only H2/H3 headings are valid anchors on the source side.
export const ANCHOR_LEVELS: readonly number[] = [2, 3]

// ── hashing (D6) ────────────────────────────────────────────────────────────

const ENC = new TextEncoder()

export function sha1Hex(bytes: Uint8Array): string {
  const h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0]
  const len = bytes.length
  const padded = new Uint8Array((((len + 8) >> 6) << 6) + 64)
  padded.set(bytes)
  padded[len] = 0x80
  const dv = new DataView(padded.buffer)
  dv.setUint32(padded.length - 4, (len * 8) >>> 0)
  dv.setUint32(padded.length - 8, Math.floor((len * 8) / 4294967296))
  const w = new Uint32Array(80)
  const rol = (x: number, n: number) => (x << n) | (x >>> (32 - n))
  for (let o = 0; o < padded.length; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4)
    for (let i = 16; i < 80; i++) w[i] = rol(w[i - 3]! ^ w[i - 8]! ^ w[i - 14]! ^ w[i - 16]!, 1)
    let a = h[0]!, b = h[1]!, c = h[2]!, d = h[3]!, e = h[4]!
    for (let i = 0; i < 80; i++) {
      const f = i < 20 ? (b & c) | (~b & d) : i < 40 ? b ^ c ^ d : i < 60 ? (b & c) | (b & d) | (c & d) : b ^ c ^ d
      const k = i < 20 ? 0x5a827999 : i < 40 ? 0x6ed9eba1 : i < 60 ? 0x8f1bbcdc : 0xca62c1d6
      const t = (rol(a, 5) + f + e + k + w[i]!) >>> 0
      e = d
      d = c
      c = rol(b, 30) >>> 0
      b = a
      a = t
    }
    h[0] = (h[0]! + a) >>> 0
    h[1] = (h[1]! + b) >>> 0
    h[2] = (h[2]! + c) >>> 0
    h[3] = (h[3]! + d) >>> 0
    h[4] = (h[4]! + e) >>> 0
  }
  return h.map(x => x.toString(16).padStart(8, '0')).join('')
}

// git blob id: sha1("blob " + byteLength + "\0" + content)
export function blobSha(content: string | Uint8Array): string {
  const body = typeof content === 'string' ? ENC.encode(content) : content
  const head = ENC.encode(`blob ${body.length}\0`)
  const all = new Uint8Array(head.length + body.length)
  all.set(head)
  all.set(body, head.length)
  return sha1Hex(all)
}

export const stampOf = (content: string | Uint8Array): string => blobSha(content).slice(0, STAMP_LEN)

// ── entry grammar (§3.1) ────────────────────────────────────────────────────
//   entry = ref [ "#" heading ] [ " @" stamp ]      stamp = 12 lowercase hex | "ok"

export type StampState = { kind: 'none' } | { kind: 'hex'; value: string } | { kind: 'ok' } | { kind: 'bad'; raw: string }
// wikilink: `ref` holds the bare name (no brackets); url: kept whole, never split on '#'
export type RefKind = 'path' | 'wikilink' | 'url'
export type ParsedEntry = { raw: string; ref: string; kind: RefKind; anchor?: string; stamp: StampState }

const URL_RE = /^[a-z][a-z0-9+.-]*:\/\//i
const WIKI_RE = /^\[\[([^\]]*)\]\](?:#(.*))?$/
const STAMP_TAIL = /\s@(\S*)$/
const HEX_STAMP = new RegExp(`^[0-9a-f]{${STAMP_LEN}}$`)

export function parseEntry(input: string): ParsedEntry | null {
  const raw = input.trim()
  let s = raw
  if (!s) return null
  let stamp: StampState = { kind: 'none' }
  const m = STAMP_TAIL.exec(s)
  if (m) {
    s = s.slice(0, m.index).trim()
    const v = m[1]!
    stamp = v === 'ok' ? { kind: 'ok' } : HEX_STAMP.test(v) ? { kind: 'hex', value: v } : { kind: 'bad', raw: v }
  }
  if (!s) return null
  if (URL_RE.test(s)) return { raw, ref: s, kind: 'url', stamp }
  const w = WIKI_RE.exec(s)
  if (w) {
    const inner = w[1]!.split('|')[0]!
    const hash = inner.indexOf('#')
    const name = (hash < 0 ? inner : inner.slice(0, hash)).trim()
    const anchor = (w[2] ?? (hash < 0 ? '' : inner.slice(hash + 1))).trim()
    if (!name) return null
    return anchor ? { raw, ref: name, kind: 'wikilink', anchor, stamp } : { raw, ref: name, kind: 'wikilink', stamp }
  }
  const hash = s.indexOf('#')
  const ref = (hash < 0 ? s : s.slice(0, hash)).trim()
  const anchor = hash < 0 ? '' : s.slice(hash + 1).trim()
  if (!ref) return null
  return anchor ? { raw, ref, kind: 'path', anchor, stamp } : { raw, ref, kind: 'path', stamp }
}

// Replaces (or appends) the stamp of one raw entry string. `stamp` is 12 hex or "ok".
export const withStamp = (raw: string, stamp: string): string => `${raw.trim().replace(/\s@\S*$/, '')} @${stamp}`

// ── headings and sections (§3.3) ────────────────────────────────────────────

export type Heading = { level: number; text: string; line: number; start: number }

const HEADING_RE = /^ {0,3}(#{1,6})[ \t]+(.*?)[ \t]*$/
const FENCE_RE = /^ {0,3}(`{3,}|~{3,})/

type Line = { text: string; start: number }

function linesOf(text: string): Line[] {
  const out: Line[] = []
  let start = 0
  for (const t of text.split('\n')) {
    out.push({ text: t.endsWith('\r') ? t.slice(0, -1) : t, start })
    start += t.length + 1
  }
  return out
}

// Headings outside fenced code blocks; `start` is the char offset of the heading line.
export function headings(text: string): Heading[] {
  return headingsOf(linesOf(text))
}

function headingsOf(lines: Line[]): Heading[] {
  const out: Heading[] = []
  let fence = ''
  lines.forEach((l, line) => {
    const f = FENCE_RE.exec(l.text)
    if (fence) {
      if (f && f[1]![0] === fence[0] && f[1]!.length >= fence.length && l.text.trim() === f[1]) fence = ''
      return
    }
    if (f) {
      fence = f[1]!
      return
    }
    const m = HEADING_RE.exec(l.text)
    if (m && m[2]) out.push({ level: m[1]!.length, text: m[2], line, start: l.start })
  })
  return out
}

// A section runs from its heading line to the next heading of the same or higher level (exclusive).
function sectionEnd(hs: Heading[], i: number, textLen: number): number {
  const level = hs[i]!.level
  for (let j = i + 1; j < hs.length; j++) if (hs[j]!.level <= level) return hs[j]!.start
  return textLen
}

export type Section = { heading: string; level: number; start: number; end: number; text: string }

// Source-side anchor lookup: exact, case-sensitive heading text, H2/H3 only, first match wins.
export function extractSection(text: string, heading: string): Section | null {
  const want = heading.trimEnd()
  const hs = headings(text)
  const i = hs.findIndex(h => ANCHOR_LEVELS.includes(h.level) && h.text === want)
  if (i < 0) return null
  const h = hs[i]!
  const end = sectionEnd(hs, i, text.length)
  return { heading: h.text, level: h.level, start: h.start, end, text: text.slice(h.start, end) }
}

// Every anchorable section of a source: heading -> text (first wins on duplicates).
export function anchorSections(text: string): Map<string, Section> {
  const hs = headings(text)
  const out = new Map<string, Section>()
  hs.forEach((h, i) => {
    if (!ANCHOR_LEVELS.includes(h.level) || out.has(h.text)) return
    const end = sectionEnd(hs, i, text.length)
    out.set(h.text, { heading: h.text, level: h.level, start: h.start, end, text: text.slice(h.start, end) })
  })
  return out
}

// ── declarations in a child (§3.1, §3.2) ────────────────────────────────────

export type Scope = { type: 'file' } | { type: 'section'; heading: string; level: number; start: number; end: number }
// `line` = 0-based line holding the entry (rewrite hint for stamping); `raw` is the unquoted entry text on that line.
export type Entry = ParsedEntry & { scope: Scope; line: number }

function unquote(s: string): string {
  const t = s.trim()
  if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) return t.slice(1, -1).replace(/\\(["\\])/g, '$1')
  if (t.length >= 2 && t.startsWith("'") && t.endsWith("'")) return t.slice(1, -1).replace(/''/g, "'")
  return t.replace(/\s+#(\s.*)?$/, '').trim()
}

// Splits a YAML flow list body on top-level commas, honoring quotes and nested brackets.
function splitFlow(body: string): string[] {
  const out: string[] = []
  let cur = ''
  let quote = ''
  let depth = 0
  for (const ch of body) {
    if (quote) {
      if (ch === quote) quote = ''
    } else if (ch === '"' || ch === "'") quote = ch
    else if (ch === '[') depth++
    else if (ch === ']') depth--
    else if (ch === ',' && depth === 0) {
      out.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  out.push(cur)
  return out
}

const KEY_RE = /^sources?[ \t]*:(.*)$/
const ITEM_RE = /^[ \t]*-(?:[ \t]+(.*))?$/
const SCALAR_WIKI = /^\[\[[^\]]*\]\](?:#.*?)?(?:\s+@\S*)?$/

// Raw entry strings of the frontmatter `source:` / `sources:` keys, with the line each came from.
function frontmatterEntries(lines: Line[]): { raw: string; line: number }[] {
  const first = lines[0]?.text.replace(/^\uFEFF/, '').trimEnd()
  if (first !== '---') return []
  let end = -1
  for (let j = 1; j < lines.length; j++) {
    const t = lines[j]!.text.trimEnd()
    if (t === '---' || t === '...') {
      end = j
      break
    }
  }
  if (end < 0) return []
  const out: { raw: string; line: number }[] = []
  for (let j = 1; j < end; j++) {
    const k = KEY_RE.exec(lines[j]!.text)
    if (!k) continue
    const rest = k[1]!.trim()
    if (!rest || rest.startsWith('#')) {
      for (let n = j + 1; n < end; n++) {
        const t = lines[n]!.text
        if (!t.trim()) continue
        const it = ITEM_RE.exec(t)
        if (!it) break
        if (it[1]) out.push({ raw: unquote(it[1]), line: n })
        j = n
      }
    } else if (rest.startsWith('[') && !SCALAR_WIKI.test(rest)) {
      const body = rest.replace(/\]\s*(#.*)?$/, '').slice(1)
      for (const item of splitFlow(body)) out.push({ raw: unquote(item), line: j })
    } else out.push({ raw: unquote(rest), line: j })
  }
  return out
}

const SECTION_COMMENT = /^\s*<!--\s*sources?:\s*(.*?)\s*-->\s*$/

// Section-level declarations: an HTML comment on the line right after a heading.
function sectionEntries(lines: Line[], textLen: number): { raw: string; line: number; scope: Scope }[] {
  const hs = headingsOf(lines)
  const out: { raw: string; line: number; scope: Scope }[] = []
  hs.forEach((h, i) => {
    const next = lines[h.line + 1]
    const m = next ? SECTION_COMMENT.exec(next.text) : null
    if (!m) return
    const scope: Scope = { type: 'section', heading: h.text, level: h.level, start: h.start, end: sectionEnd(hs, i, textLen) }
    for (const part of m[1]!.split(';')) if (part.trim()) out.push({ raw: part.trim(), line: h.line + 1, scope })
  })
  return out
}

// All declared edges of a child: frontmatter (source + sources, unioned and deduped by ref+anchor) then section comments.
export function parseChild(text: string): Entry[] {
  const lines = linesOf(text)
  const out: Entry[] = []
  const seen = new Set<string>()
  for (const f of frontmatterEntries(lines)) {
    const p = parseEntry(f.raw)
    if (!p) continue
    const key = `${p.kind}|${p.ref}|${p.anchor ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ ...p, scope: { type: 'file' }, line: f.line })
  }
  for (const s of sectionEntries(lines, text.length)) {
    const p = parseEntry(s.raw)
    if (p) out.push({ ...p, scope: s.scope, line: s.line })
  }
  return out
}
