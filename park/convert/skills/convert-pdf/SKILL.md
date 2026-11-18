---
name: convert-pdf
description: >
  Convert PDF to clean markdown. Auto-detects backend: pdftotext (fast, text-heavy)
  or docling (complex tables, multi-column, OCR). Use when converting PDFs to markdown
  for analysis or summarization. Triggers: "convert pdf", "pdf to markdown", "pdf file",
  "pdf to text", ".pdf".
argument-hint: <pdf-file> [→ output.md] [--docling] [--complex] [--ocr]
allowed-tools: [Bash, Read, Write, Skill]
model: haiku
context: main
user-invocable: true
---

# Convert PDF → Markdown

## 1. Parse & Validate

Extract from arguments:

| Arg | Required | Default |
|-----|----------|---------|
| `$1` input PDF | ✅ | — |
| `→ path` output | No | `./converted/{kebab-basename}.md` |
| `--docling` | No | Force docling |
| `--complex` | No | Force docling |
| `--ocr` | No | Force docling + OCR |

Validate: file exists, ends `.pdf`, is readable. Create `./converted/` if missing.

## 2. Select Backend

```bash
# If --docling, --complex, or --ocr → skip to docling path
# Otherwise, probe with pdftotext:
CHARS=$(pdftotext -layout -l 3 "$INPUT" - | wc -c)
# CHARS < 100 → scanned PDF → docling path
# CHARS >= 100 → pdftotext path
```

## 3a. pdftotext Path (default — 90% of files)

```bash
pdftotext -layout "$INPUT" "${OUTPUT%.md}.txt"
```

Post-process the `.txt` → `.md` using Write tool:
- Split on `\f` → `---` page separators
- ALL CAPS lines > 20 chars → `## Header`
- Collapse 3+ blank lines → 2
- Prepend YAML frontmatter: `source`, `pages`, `backend: pdftotext`
- Write final `.md`, delete intermediate `.txt`

## 3b. docling Path (complex/OCR)

First: `toolsmith:install-dependency docling` if not available.

```bash
# Find .venv by scanning upward from CWD
source "$(find_venv)/bin/activate"
docling --to md --output ./converted/ "$INPUT"
```

If `--ocr` flag: `docling --to md --ocr --ocr-engine easyocr --output ./converted/ "$INPUT"`

⚠️ **Docling rules — violations create 0-byte files:**

| ✅ Correct | ❌ Wrong |
|-----------|---------|
| `--to md` | `--to markdown` |
| `--output DIR` | `-o DIR` |
| Writes to filesystem | NEVER `>` redirect or `\| tee` |

## 4. Verify & Report

```bash
[ -s "$OUTPUT" ] || { echo "❌ Output empty"; exit 1; }
wc -c "$OUTPUT"
```

Report: `✅ Converted {file} → {output} ({size}, {backend})`

See `reference.md` for backend comparison, advanced docling options, and troubleshooting.
