---
description: Convert EPUB files to clean markdown for LLM context (uses epub-to-markdown)
argument-hint: <epub-file> [--output dir]
allowed-tools: Bash, Read, Write, Skill
model: claude-3-5-haiku-20241022
# ⚠️ STATUS: needs-review (migrated from v0.1)
---

Convert the EPUB file at $1 to clean markdown format optimized for Claude Code context.

## Steps

1. **Install dependency**: Use the `dstoic:install-dependency` skill to ensure `epub-to-markdown` Python package is installed in the project venv
2. **Parse arguments**:
   - Input file: $1 (required)
   - Output directory: $2 (optional, defaults to `./.tmp/epub-converted/`)
3. **Convert EPUB**: Run `epub-to-markdown convert "$1"` with appropriate output settings
4. **Report results**:
   - Output location and file structure
   - File sizes and chapter count
   - Optionally preview first chapter or table of contents

## Goal

Extract clean, structured markdown suitable for feeding into Claude's context for analysis, summarization, or question-answering - NOT for visual rendering.

## Usage Examples

```bash
/convert-epub path/to/book.epub
/convert-epub book.epub ./.tmp/my-book/
```

## Output Format

Use `--multiple-files` flag to create one markdown file per chapter for easier context management. Output to `.tmp/` directory to keep it excluded from git/searches per Praxis rules.
