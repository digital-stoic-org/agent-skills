---
name: convert-docx
description: Convert Word (.docx) files to clean markdown for LLM context (uses markitdown).
allowed-tools: [Bash, Read, Write, Skill]
model: haiku
---

# Convert DOCX → Markdown

Convert the Word document at `$1` to clean markdown optimized for LLM context.

1. Install `markitdown` via install-dependency skill
2. Run: `python -m markitdown "$1" -o "$OUTPUT_DIR/output.md"`
3. Report: output location, file sizes, structure summary (headings, tables, lists)
