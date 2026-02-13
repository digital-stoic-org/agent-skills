---
description: List all CONTEXT files across code/, projects/, and vaults/ with status and metadata
allowed-tools: Bash, Read, Edit, Glob, AskUserQuestion
argument-hint: "[--status=exploring|building|parked|done] [--area=code|projects|vaults] [--sync] [--archive <stream>]"
model: haiku
---

# List Contexts

Scan `CONTEXT-*-llm.md` files across `{repo-root}/code/`, `{repo-root}/projects/`, and `{repo-root}/vaults/` and display a cross-project context registry.

**Speed**: < 3 seconds

## ⚡ Performance Rules

**CRITICAL — follow these rules to minimize latency:**

1. **Use `rtk` for ALL shell commands** — never raw git/ls/grep (exception: `git rev-parse` in Phase 1)
2. **Parallel tool calls** — make ALL independent tool calls in a single message
3. **No unnecessary reads** — extract metadata from header only (first 15 lines)
4. **NO progress tasks** — listing is atomic, use status messages only

## Workflow

### Phase 1: Resolve Root & Scan (parallel — ONE message)

**Before tool calls, output**: `🔍 Scanning contexts...`

**IMPORTANT: Make ALL of these tool calls simultaneously in a single response.**

```
Bash: git rev-parse --show-toplevel && git ls-files --others --ignored --exclude-standard --directory -- code/ projects/ vaults/ | head -50

Glob: **/code/**/CONTEXT-*-llm.md
Glob: **/projects/**/CONTEXT-*-llm.md
Glob: **/vaults/**/CONTEXT-*-llm.md
```

Store Bash results:
- Line 1 = `$ROOT`. If git fails, use CWD and warn user.
- Remaining lines = `$IGNORED` — gitignored directories under code/, projects/, vaults/

Use `$ROOT` to validate Glob results (confirm they're under the repo root).

**Filter out gitignored projects**: Exclude any CONTEXT file whose project folder matches a path in `$IGNORED`. This prevents listing contexts from private/sensitive projects that are gitignored.

### Phase 2: Read Frontmatter (parallel — ONE message)

**Before tool calls, output**: `📋 Reading context metadata...`

For each CONTEXT file found, Read first 15 lines only (header extraction).

**Make ALL Read calls simultaneously in a single response** — one per file.

Extract from each file (key-value header format):
- `saved:` — timestamp
- `stream:` — context name
- `status:` — if present (may be missing in older files)
- `focus:` — focus statement
- `goal:` — goal statement

**Derive from file path**:
- **Area**: `code`, `projects`, or `vaults` (from path relative to `$ROOT`)
- **Project**: folder name relative to area (e.g., `agent-skills`, `homo-promptus/mazette`, `gtd-pcm`)
- **Context name**: extracted from filename (`CONTEXT-{name}-llm.md` → `{name}`, `CONTEXT-llm.md` → `default`)

### Phase 3: Format & Display

#### Argument parsing

Parse `$ARGUMENTS`:
- `--status=X` → filter to matching status only (match against normalized values)
- `--area=code` or `--area=projects` or `--area=vaults` → filter to one area
- `--sync` → after display, run Phase 4
- `--archive <stream>` → after display, run Phase 5
- `--sync` and `--archive` are **mutually exclusive** — if both present, error: `"⚠️ Cannot use --sync and --archive together. Run them separately."`
- No args → show all (display only)

**Group by area, sort by saved timestamp (most recent first) within each group.**

**Output format**:

```
# 📋 Context Registry

## code/ (N contexts)
| Project | Context | Status | Focus | Saved |
|---|---|---|---|---|
| agent-skills | session-replay | 🔍 exploring | Retrospect replay storyboards | 2026-02-10 |
| agent-skills | static-hosting | ✅ decided | Surge.sh deployment | 2026-02-08 |

## projects/ (N contexts)
| Project | Context | Status | Focus | Saved |
|---|---|---|---|---|
| homo-promptus/mazette | workshop | 🏗️ building | Mazette workshop content | 2026-02-09 |

## vaults/ (N contexts)
| Project | Context | Status | Focus | Saved |
|---|---|---|---|---|
| gtd-pcm | gtd-migration | ❓ unknown | OY2 batch migration complete | 2026-02-09 |

---
📊 Total: {N} contexts ({N} code, {N} projects, {N} vaults)
🔍 exploring: {N} | 🏗️ building: {N} | ✅ decided: {N} | ⏸️ parked: {N} | ✅ done: {N}
⚠️ No status: {N} (consider updating with /save-context)
```

### Phase 4: Sync INDEX.md (`--sync` flag)

If `--sync` in `$ARGUMENTS`:

1. Read `$ROOT/INDEX.md` (or create if missing with Active/Parked/Done/Archived headers)
2. **Regenerate Active Contexts table** from Phase 2 data. **Sort rows by Area (alphabetical), then by Saved date (descending) within each area.** Use this exact format (6 columns with Area inline):

```
## Active Contexts

| Area | Project | Context | Status | Focus | Saved |
|---|---|---|---|---|---|
| {area} | {project} | {stream} | {status emoji} | {focus ≤80 chars} | {YYYY-MM-DD} |
```

   - Use **Status Mapping** below to convert raw status → emoji form
   - This is the INDEX.md storage format (Area as column), NOT the display format (Phase 3 groups by area header)

3. **Preserve** Parked/Done/Archived sections unchanged
4. Update summary counts (`📊 **Total**:`)
5. Report: `🔄 INDEX.md synced from {N} contexts`

### Phase 5: Archive Stream (`--archive <stream>` flag)

If `--archive <stream>` in `$ARGUMENTS`:

1. Read `$ROOT/INDEX.md`
2. Search Active/Parked/Done sections for row matching **Context column** (stream name). If not found: `"⚠️ Stream '{stream}' not found in INDEX.md"`
3. AskUserQuestion: reason ("No content" | "Work completed" | "Superseded" | "Not developing")
4. Remove from source section, append to **Archived** table using this format:

```
## Archived

| Area | Folder | Contents | Why Archived |
|---|---|---|---|
| {area} | {project} | {brief contents description} | {reason from user} |
```

   - **Column transformation**: Active row `Context`/`Status`/`Focus`/`Saved` → Archived `Contents` (derive brief description from focus) + `Why Archived` (user reason)
   - `Folder` = Project column value from source row

5. Update summary counts
6. Report: `📦 Archived: {stream} ({area}/{project}) — {reason}`

## Status Mapping

Normalize existing status values to standard vocabulary:

| Raw Value | Display |
|-----------|---------|
| `exploring` | 🔍 exploring |
| `decided` | ✅ decided |
| `building`, `in_progress` | 🏗️ building |
| `parked` | ⏸️ parked |
| `operational`, `verified` | ✅ operational |
| `done`, `completed`, `closed` | ✅ done |
| missing/empty/`n/a` | ❓ unknown |

## Meta-Awareness

**Output format**: Emoji-rich markdown tables (human-friendly)
**Audience**: Human user wanting cross-project visibility
**Purpose**: Context registry + INDEX.md sync
**Default**: Read-only. With `--sync` or `--archive`: writes INDEX.md only

## Error Messages

| Condition | Message |
|-----------|---------|
| No CONTEXT files found | "No context files found under `$ROOT`. Run `/save-context` in a project to create one." |
| Not in a git repo | "⚠️ Not in a git repo. Scanning from CWD: `{cwd}`" |
| File unreadable | Skip with warning in output, don't abort |
| No frontmatter | Extract what's available, mark status as ❓ unknown |
| Nested projects (e.g., `homo-promptus/mazette/`) | Show full relative path as project name |
| Gitignored project folder | Silently exclude — do not list or mention |
| INDEX.md malformed | `"⚠️ INDEX.md appears malformed. Regenerating Active section only, preserving other content."` |
| `--sync` + `--archive` together | `"⚠️ Cannot use --sync and --archive together. Run them separately."` |
| `--archive` stream not found | `"⚠️ Stream '{stream}' not found in INDEX.md"` |
| `--archive` no changes | `"ℹ️ No changes needed — stream already archived or not found."` |

## Related

- `/save-context [stream] [description]` — Save session to named context
- `/load-context [stream] [--full]` — Load and resume a context
- `/create-context` — Create baseline from .in/ folder
