---
description: List all CONTEXT files across code/ and projects/ with status and metadata
allowed-tools: Bash, Read, Glob
argument-hint: "[--status=exploring|building|parked|done] [--area=code|projects]"
model: haiku
---

# List Contexts

Scan `CONTEXT-*-llm.md` files across `{repo-root}/code/` and `{repo-root}/projects/` and display a cross-project context registry.

**Speed**: < 3 seconds

## ⚡ Performance Rules

**CRITICAL — follow these rules to minimize latency:**

1. **Use `rtk` for ALL shell commands** — never raw git/ls/grep (exception: `git rev-parse` in Phase 1)
2. **Parallel tool calls** — make ALL independent tool calls in a single message
3. **No unnecessary reads** — extract metadata from frontmatter only (first 15 lines)
4. **NO progress tasks** — listing is atomic, use status messages only

## Workflow

### Phase 1: Resolve Root & Scan (parallel — ONE message)

**Before tool calls, output**: `🔍 Scanning contexts...`

**IMPORTANT: Make ALL of these tool calls simultaneously in a single response.**

```
Bash: git rev-parse --show-toplevel && git ls-files --others --ignored --exclude-standard --directory -- code/ projects/ | head -50

Glob: **/code/**/CONTEXT-*-llm.md
Glob: **/projects/**/CONTEXT-*-llm.md
```

Store Bash results:
- Line 1 = `$ROOT`. If git fails, use CWD and warn user.
- Remaining lines = `$IGNORED` — gitignored directories under code/ and projects/

Use `$ROOT` to validate Glob results (confirm they're under the repo root).

**Filter out gitignored projects**: Exclude any CONTEXT file whose project folder matches a path in `$IGNORED`. This prevents listing contexts from private/sensitive projects that are gitignored.

### Phase 2: Read Frontmatter (parallel — ONE message)

**Before tool calls, output**: `📋 Reading context metadata...`

For each CONTEXT file found, Read first 15 lines only (frontmatter extraction).

**Make ALL Read calls simultaneously in a single response** — one per file.

Extract from each file:
- `saved:` — timestamp (ISO 8601)
- `stream:` — context name
- `status:` — if present (may be missing in older files)
- `focus:` — focus statement
- `goal:` — goal statement

**Derive from file path**:
- **Area**: `code` or `projects` (from path relative to `$ROOT`)
- **Project**: folder name relative to area (e.g., `agent-skills`, `homo-promptus/mazette`)
- **Context name**: extracted from filename (`CONTEXT-{name}-llm.md` → `{name}`, `CONTEXT-llm.md` → `default`)

### Phase 3: Format & Display

#### Argument parsing

Parse `$ARGUMENTS`:
- `--status=X` → filter to matching status only (match against normalized values)
- `--area=code` or `--area=projects` → filter to one area
- No args → show all

**Group by area, sort by saved timestamp (most recent first) within each group.**

**Output format**:

```
# 📋 Context Registry

## code/ (N contexts)
| Project | Context | Status | Focus | Saved |
|---|---|---|---|---|
| agent-skills | session-replay | 🔍 exploring | Retrospect replay storyboards | 2026-02-10 |
| agent-skills | static-hosting | ✅ decided | Surge.sh deployment | 2026-02-08 |
| context-management | baseline | 🏗️ building | Context system v2 | 2026-02-05 |

## projects/ (N contexts)
| Project | Context | Status | Focus | Saved |
|---|---|---|---|---|
| homo-promptus/mazette | workshop | 🏗️ building | Mazette workshop content | 2026-02-09 |
| financial-strategy/toshl | toshl-sync | ✅ done | Bulk sync complete | 2026-02-10 |

---
📊 Total: {N} contexts ({N} code, {N} projects)
🔍 exploring: {N} | 🏗️ building: {N} | ✅ decided: {N} | ⏸️ parked: {N} | ✅ done: {N}
⚠️ No status: {N} (consider updating with /save-context)
```

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

## Meta-Awareness: What This Command Produces

**Output format**: Emoji-rich markdown tables (human-friendly)
**Audience**: Human user wanting cross-project visibility
**Purpose**: Context registry — answer "what are all my active/parked contexts?"

**Data flow**:
- Reads token-optimized YAML frontmatter from `/save-context` output
- Transforms to human-friendly table (same pattern as `/load-context`)
- Does NOT modify any files — read-only command

## Error Messages

| Condition | Message |
|-----------|---------|
| No CONTEXT files found | "No context files found under `$ROOT`. Run `/save-context` in a project to create one." |
| Not in a git repo | "⚠️ Not in a git repo. Scanning from CWD: `{cwd}`" |
| File unreadable | Skip with warning in output, don't abort |
| No frontmatter | Extract what's available, mark status as ❓ unknown |
| Nested projects (e.g., `homo-promptus/mazette/`) | Show full relative path as project name |
| Gitignored project folder | Silently exclude — do not list or mention |

## Related

- `/save-context [stream] [description]` — Save session to named context
- `/load-context [stream] [--full]` — Load and resume a context
- `/create-context` — Create baseline from .in/ folder
