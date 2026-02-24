---
name: convert-pptx
description: Convert PowerPoint (.pptx) files to clean markdown for LLM context (uses markitdown). Use when converting presentations to markdown for analysis or summarization. Triggers include "convert pptx", "powerpoint to markdown", "pptx file", "slides to markdown".
argument-hint: "<pptx-file> [output-dir]"
allowed-tools: [Bash, Read, Write, Skill]
model: haiku
context: main
user-invocable: true
---

# Convert PPTX → Markdown

Convert the PowerPoint file at `$1` to clean markdown format optimized for LLM context.

## Steps

1. **Install dependency**: Use `dstoic:install-dependency` skill to ensure `markitdown` is installed
2. **Parse arguments**: Input file `$1` (required), output dir `$2` (optional, defaults to `./converted/`)
3. **Prepare output dir**: Create `$2` if it doesn't exist
4. **Convert**:
   ```bash
   source .venv/bin/activate && python -m markitdown "$1" -o "$OUTPUT_DIR/output.md"
   ```
5. **Report**: Output location, file sizes, structure summary (slide count, headings, tables, images), any warnings

## Goal

Extract clean markdown for LLM context — analysis, summarization, Q&A. NOT for round-tripping back to PPTX.

No content sent to any LLM during conversion (pure script-based extraction).
