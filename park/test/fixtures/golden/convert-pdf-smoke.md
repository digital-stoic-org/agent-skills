---
name: convert-pdf
description: Convert PDF files to LLM-ready formats using Docling (markdown/DocTags/JSON).
allowed-tools: [Bash, Read, Write, Skill]
model: haiku
---

# Convert PDF → LLM-Ready Format

Convert PDF at `$1` using IBM Docling toolkit.

1. Install `docling` via install-dependency skill
2. Run: `docling --to markdown --image-export-mode placeholder input.pdf -o converted/`
3. Report: output location, file sizes, token savings estimate
