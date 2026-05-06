---
name: convert-docx
description: Convert Word (.docx) files to clean markdown for LLM context (uses markitdown). Use when converting Word documents to markdown for analysis or summarization. Triggers include "convert docx", "word to markdown", "docx file".
argument-hint: "<docx-file> [output-dir]"
allowed-tools: [Bash, Read, Write, Skill]
model: haiku
context: main
user-invocable: true
---

# Convert DOCX → Markdown

Convert the Word document at `$1` to clean markdown format optimized for LLM context.

## Steps

1. **Install dependency**: Use `toolsmith:install-dependency` skill to ensure `markitdown` is installed
2. **Parse arguments**: Input file `$1` (required), output dir `$2` (optional, defaults to `./converted/`)
3. **Prepare output dir**: Create `$2` if it doesn't exist
4. **Convert**:
   ```bash
   source .venv/bin/activate && python -m markitdown "$1" -o "$OUTPUT_DIR/output.md"
   ```
5. **Report**: Output location, file sizes (original vs converted), structure summary (headings, tables, lists), any warnings

## Goal

Extract clean markdown for LLM context — analysis, summarization, Q&A. NOT for round-tripping back to DOCX.

No content sent to any LLM during conversion (pure script-based extraction).
