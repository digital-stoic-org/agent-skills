---
name: list-contexts
description: List all CONTEXT files across code/, projects/, repos/, and vaults/ with status and metadata. Use when viewing context registry, checking saved sessions, or syncing INDEX.md. Triggers include "list contexts", "show contexts", "context registry", "sync index".
argument-hint: "[--status=exploring|building|parked|done] [--area=code|projects|repos|vaults] [--sync] [--archive <stream>]"
allowed-tools: [Bash, Read, Edit, Write, Glob, AskUserQuestion]
model: haiku
context: main
user-invocable: true
---

# List Contexts

Scan `CONTEXT-*-llm.md` files across `{repo-root}/code/`, `projects/`, `repos/`, and `vaults/` — display cross-project context registry.

**Speed**: < 3 seconds

## Performance Rules

1. **Use `rtk` for ALL shell commands** (exception: `git rev-parse` in Phase 1)
2. **Parallel tool calls** — ALL independent calls in one message
3. **No unnecessary reads** — extract metadata from header only (first 15 lines)

## Workflow

### Phase 1: Resolve Root & Scan (parallel)

```
Bash: git rev-parse --show-toplevel && git ls-files --others --ignored --exclude-standard --directory -- code/ projects/ repos/ vaults/ | head -50
Glob: **/code/**/CONTEXT-*-llm.md
Glob: **/projects/**/CONTEXT-*-llm.md
Glob: **/repos/**/CONTEXT-*-llm.md
Glob: **/vaults/**/CONTEXT-*-llm.md
Glob: **/code/**/done/CONTEXT-*-llm.md
Glob: **/projects/**/done/CONTEXT-*-llm.md
Glob: **/repos/**/done/CONTEXT-*-llm.md
Glob: **/vaults/**/done/CONTEXT-*-llm.md
```

Filter out gitignored project folders silently.
Files in `done/` subfolders are tagged as archived in display.

### Phase 2: Read Frontmatter (parallel)

Read first 15 lines per file. Extract: `saved`, `stream`, `status`, `focus`, `goal`.
Derive from path: Area, Project, Context name.

### Phase 3: Format & Display

Parse `$ARGUMENTS` for filters (`--status`, `--area`), actions (`--sync`, `--archive`).
Group by area, sort by saved timestamp (most recent first).
Output emoji-rich markdown table.

**Active vs Archived split**: Files in project root → Active table. Files in `done/` → separate `### 📦 Done` section per area (collapsed, shown after active).

**Staleness**: Active contexts with `saved` >30 days ago → append `⚠️ stale` to status.

**CHECKPOINT**: If `--sync` or `--archive` was passed, you MUST proceed to Phase 4-5. Do NOT stop here.

### Phase 4-5: Sync/Archive

**MANDATORY when `--sync` or `--archive` is passed. Do NOT skip.**

- `--sync` → Read INDEX.md (or create if missing via Write). Regenerate Active Contexts table from Phase 2 data. Preserve other sections. Update summary counts. Confirm to user what changed.
- `--archive <stream>` → move to Archived section with user reason

`--sync` and `--archive` are mutually exclusive.

See `reference.md` for output template, status mapping, sync/archive format, and error messages.
