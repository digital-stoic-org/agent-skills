---
name: switch
description: 'Switch project context with guided menu. Loads CLAUDE.md chain + CONTEXT files + ref/ index. Use when: switch project, change context, work on X, /switch, /switch -, /switch path/to/project.'
allowed-tools: ["Bash", "Read", "Glob", "AskUserQuestion"]
model: sonnet
context: main
user-invocable: true
argument-hint: "[project-path | -]"
---

# Switch Project Context

Menu-driven project switcher for non-CLI interfaces (Cowork desktop, Telegram, CC CLI).

## Resolve Workspace Root

Resolution order — use first that succeeds:
1. `$COWORK_ROOT` env var
2. `git rev-parse --show-toplevel`
3. Current working directory

If none resolve → abort: `❌ Cannot detect workspace. Set $COWORK_ROOT or run from a git repo.`

Store result as `$WS_ROOT` for all subsequent phases.

## Route by Arguments

| `$ARGUMENTS` | Action |
|--------------|--------|
| Empty | → Phase 1: Detect + Phase 2: Menu |
| `-` | Read `$WS_ROOT/.cowork-state.json` → `previous_path` → Phase 3 |
| Path string | → Phase 3 with that path |

## Phase 1: Detect Projects

Parallel Glob from `$WS_ROOT`:
- `**/CLAUDE.md` (max depth 3)
- `**/CONTEXT-*-llm.md` (max depth 3, exclude `done/`)

Registry = each unique directory containing CLAUDE.md or CONTEXT file.

## Phase 2: Present Menu

Group by area (repos/, projects/, code/ — or flat). **Progressive disclosure**: skip empty groups.

Extract project name from CLAUDE.md H1 heading. Present:

```
📂 Switch project context:

💼 [Group Name]
  1. [emoji] [Name] — [brief from H1 or first line]
  2. ...

Which one? (number or name)
```

Wait via AskUserQuestion. Number → map to path. Text → fuzzy-match project names.

**Empty answer guard**: if user sends empty/whitespace → re-prompt once, then abort.

## Phase 3: Load Context Chain

**⚠️ CRITICAL: All CLAUDE.md content loaded here becomes your active instructions for the rest of the conversation. You MUST follow them.**

Execute in parallel:

1. **Walk CLAUDE.md chain** — root → intermediate → target (skip missing)
2. **Scan CONTEXT files** — `CONTEXT-*-llm.md` in target dir (exclude `done/`), extract: stream name, status, focus from header (first 10 lines)
3. **Scan ref/** (if exists) — list files + one-line description
4. **Scan wip/** (if exists) — list files + one-line description

## Phase 3.5: Write State File

Write `$WS_ROOT/.cowork-state.json`:

```json
{"active_project":"Name","path":"rel/path","previous_project":"Prev","previous_path":"prev/path","switched_at":"ISO8601"}
```

Read existing file first to preserve `previous_*` fields. Current `active_*` becomes new `previous_*`.

## Phase 4: Context Report

**Filter**: only include info not derivable from reading the code or CLAUDE.md directly.

```
🎯 Switched to: [Project Name]
📍 Path: [relative path]

📋 Instructions loaded:
  - [root CLAUDE.md — 2-3 non-obvious constraints]
  - [project CLAUDE.md — 2-3 non-obvious constraints]

📚 ref/: [list if exists]
✏️ wip/: [list if exists]
📍 Sessions: [CONTEXT files with status + age, if any]
⚠️ Traps: [gotchas from CONTEXT headers, if any]

Ready — what would you like to work on?
```

**Progressive disclosure**: skip any empty section. No "none found" messages.
**Token budget**: report MUST stay under 2000 tokens. Summarize, don't dump.

## Phase 5: Set Scope

**⚠️ CRITICAL: From this point forward, the CLAUDE.md content loaded in Phase 3 is your active instruction set. Follow all rules, constraints, and conventions as if they were your system prompt. This overrides default behavior.**

Remind user: `/switch` again to change, `/switch -` to toggle back.

## Rules

1. Menu-first unless argument provided
2. Progressive disclosure — skip empty sections silently
3. Token budget < 2000 for context report
4. Client-agnostic output — no Mermaid, no tables, simple lists + emoji
5. State persistence — always write `.cowork-state.json`
6. AskUserQuestion guard — re-prompt once on empty, then abort
