---
name: convert-pdf
description: Convert PDF files to LLM-ready formats using Docling (markdown/DocTags/JSON). Use when converting PDFs to markdown for analysis or summarization. Triggers include "convert pdf", "pdf to markdown", "pdf file", "docling".
argument-hint: <pdf-file(s)> [--format markdown|doctags|json] [--ocr]
allowed-tools: [Bash, Read, Write, Skill]
model: haiku
context: main
user-invocable: true
---

# Convert PDF → LLM-Ready Format

Convert PDF files using IBM's Docling toolkit.

## Steps

1. **Install dependency**: Use `dstoic:install-dependency` skill to ensure `docling` is installed
2. **Parse arguments**: Input file(s) `$1` (required), format (default: markdown), OCR flag
3. **Prepare output**: Create `./converted/` if missing
4. **Convert**:
   ```bash
   source .venv/bin/activate
   docling --to markdown --image-export-mode placeholder input.pdf -o converted/
   ```
5. **Report**: Output location, file sizes (original vs converted), token savings estimate

## Defaults

- **Format**: markdown (token-efficient, human-readable)
- **Image mode**: placeholder (minimal tokens)
- **Output**: `./converted/`

See `reference.md` for format selection guide, batch processing, VLM pipeline, and OCR options.
