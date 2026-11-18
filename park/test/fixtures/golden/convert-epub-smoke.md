---
name: convert-epub
description: Convert EPUB files to clean markdown for LLM context (uses epub-to-markdown).
allowed-tools: [Bash, Read, Write, Skill]
model: haiku
---

# Convert EPUB → Markdown

Convert the EPUB file at `$1` to clean markdown optimized for LLM context.

1. Install `epub-to-markdown` via install-dependency skill
2. Convert with `--multiple-files` flag to `.tmp/epub-converted/`
3. Report: output location, chapter count, table of contents preview
