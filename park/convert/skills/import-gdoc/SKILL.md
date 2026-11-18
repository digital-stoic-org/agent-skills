---
name: import-gdoc
description: Import Google Docs from Drive into local google-in/ folder with manifest tracking. Use when importing Google documents for local analysis. Triggers include "import gdoc", "google doc", "import from drive", "google docs import".
argument-hint: "[search-query]"
allowed-tools: [mcp__google-docs__search_docs, mcp__google-docs__get_doc_content, mcp__google-docs__list_docs_in_folder, mcp__google-docs__search_drive_files, Read, Write, Bash, AskUserQuestion]
model: haiku
context: main
user-invocable: true
---

# Google Docs Import

Import Google Docs from Drive into `google-in/` with manifest tracking.

## ⚠️ AskUserQuestion Guard

**CRITICAL**: After EVERY `AskUserQuestion` call, check if answers are empty/blank. Known Claude Code bug: outside Plan Mode, AskUserQuestion silently returns empty answers without showing UI.

**If answers are empty**: DO NOT proceed with assumptions. Instead:
1. Output: "⚠️ Questions didn't display (known Claude Code bug outside Plan Mode)."
2. Present the options as a **numbered text list** and ask user to reply with their choice number.
3. WAIT for user reply before continuing.

## Steps

1. **Get user email** (required for MCP auth): AskUserQuestion
2. **Determine search**: `$ARGUMENTS` as query, or interactive if empty
3. **Search docs**: Use MCP tools, present numbered results, let user select
4. **Setup**: `mkdir -p google-in`
5. **Import each doc**:
   - Fetch via `mcp__google-docs__get_doc_content`
   - Sanitize filename (lowercase, hyphens, max 100 chars, `.md`)
   - Handle duplicates (same ID → update, different ID → suffix)
   - Write to `google-in/<name>.md`
6. **Update manifest**: `google-in/README.md` with table (Name, Last Import, Drive Link, File ID)
7. **Report**: file count, paths, suggest re-run for updates

See `reference.md` for manifest format, duplicate handling, error handling, and edge cases.
