---
name: list-contexts
description: List all CONTEXT files across code/, projects/, and vaults/ with status and metadata. Use when viewing context registry, checking saved sessions, or syncing INDEX.md. Triggers include "list contexts", "show contexts", "context registry", "sync index".
argument-hint: "[--status=exploring|building|parked|done] [--area=code|projects|vaults] [--sync] [--archive <stream>]"
allowed-tools: [Bash, Read, Edit, Glob, AskUserQuestion]
model: haiku
context: main
user-invocable: true
---

# List Contexts

Scan `CONTEXT-*-llm.md` files across `{repo-root}/code/`, `projects/`, and `vaults/` — display cross-project context registry.

**Speed**: < 3 seconds

## Performance Rules

1. **Use `rtk` for ALL shell commands** (exception: `git rev-parse` in Phase 1)
2. **Parallel tool calls** — ALL independent calls in one message
3. **No unnecessary reads** — extract metadata from header only (first 15 lines)

## Workflow

### Phase 1: Resolve Root & Scan (parallel)

```
Bash: git rev-parse --show-toplevel && git ls-files --others --ignored --exclude-standard --directory -- code/ projects/ vaults/ | head -50
Glob: **/code/**/CONTEXT-*-llm.md
Glob: **/projects/**/CONTEXT-*-llm.md
Glob: **/vaults/**/CONTEXT-*-llm.md
```

Filter out gitignored project folders silently.

### Phase 2: Read Frontmatter (parallel)

Read first 15 lines per file. Extract: `saved`, `stream`, `status`, `focus`, `goal`.
Derive from path: Area, Project, Context name.

### Phase 3: Format & Display

Parse `$ARGUMENTS` for filters (`--status`, `--area`), actions (`--sync`, `--archive`).
Group by area, sort by saved timestamp (most recent first).
Output emoji-rich markdown table.

### Phase 4-5: Sync/Archive (if flagged)

- `--sync` → regenerate Active Contexts in INDEX.md
- `--archive <stream>` → move to Archived section with user reason

`--sync` and `--archive` are mutually exclusive.

See `reference.md` for output template, status mapping, sync/archive format, and error messages.
