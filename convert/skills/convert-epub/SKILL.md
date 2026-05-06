---
name: convert-epub
description: Convert EPUB files to clean markdown for LLM context (uses epub-to-markdown). Use when converting ebooks or EPUB documents to markdown for analysis or summarization. Triggers include "convert epub", "epub to markdown", "epub file".
argument-hint: "<epub-file> [--output dir]"
allowed-tools: [Bash, Read, Write, Skill]
model: haiku
context: main
user-invocable: true
---

# Convert EPUB → Markdown

Convert the EPUB file at `$1` to clean markdown format optimized for Claude Code context.

## Steps

1. **Install dependency**: Use `toolsmith:install-dependency` skill to ensure `epub-to-markdown` is installed
2. **Parse arguments**: Input file `$1` (required), output dir `$2` (optional, defaults to `./.tmp/epub-converted/`)
3. **Convert**: Run `epub-to-markdown convert "$1"` with `--multiple-files` flag (one file per chapter)
4. **Report**: Output location, file structure, chapter count, preview of table of contents

## Goal

Extract clean, structured markdown for LLM context (analysis, summarization, Q&A) — NOT for visual rendering.

Output to `.tmp/` to keep excluded from git/searches per Praxis rules.
