# save-context Reference

## CONTEXT File Template

```markdown
# Session Context: {title}

saved: YYYY-MM-DDTHH:MM:SSZ
stream: {name}
status: {exploring|building|decided|parked|done}
focus: {1-2 sentences}
goal: {1 sentence}

---

## Project

ref: {openspec project.md path | n/a}
type: {project type}

## Tasks

{in_progress + pending + 3 recent completed only, inline objects}

## Next Tasks

- {task 1}
- {task 2}
- {task 3}

## Session

progression:
  - {aggregated timeline steps}
decisions:
  - {key choice}: {rationale}
thinking:
  - {reasoning, trade-offs, insights}
unexpected:
  - {pivots, corrections, surprises}

## Hot Files

- {path}: {brief role}

## Refs

- {external references if any}
```

## Context Quality Self-Check

- ✅ **Save**: non-trivial work (>1 file, decisions made), mid-stream checkpoint, learning/insights
- ⚠️ **Ask user**: quick fix (1-2 files, obvious), exploration with no conclusions
- ❌ **Suggest skip**: greeting/chat only, single read/question, unresolved troubleshooting

If marginal: `"📊 Session appears brief. Save context anyway?"` — wait for confirmation.

## Status Mapping (for INDEX.md)

| Raw Value | Display |
|-----------|---------|
| `exploring` | 🔍 exploring |
| `decided` | ✅ decided |
| `building`, `in_progress` | 🏗️ building |
| `parked` | ⏸️ parked |
| `operational`, `verified` | ✅ operational |
| `done`, `completed`, `closed` | ✅ done |
| missing/empty/`n/a` | ❓ unknown |

## INDEX.md Upsert (Phase 3b)

Path: `$(git rev-parse --show-toplevel)/INDEX.md`. Skip if missing or CWD not in `code/`, `projects/`, or `vaults/`.

1. Read INDEX.md
2. Derive row: Area, Project, Context (stream), Status (emoji), Focus (≤80 chars), Saved (YYYY-MM-DD)
3. Match `| {Area} | {Project} | {Context} |`: found → Edit replace, not found → Edit append
4. Update summary counts
5. Preserve Parked/Done/Archived unchanged

## Stream Naming

- **Reserved**: `default` → `CONTEXT-llm.md`, `baseline` → fork point from `/create-context`
- **Pattern**: `^[a-zA-Z0-9_-]{1,50}$`

## Token Budget

- Session section: 780 tokens max
- Total: 1200-1500 tokens MAX
- Tasks: in_progress + pending + 3 recent completed only
- Hot Files: max 10 with brief roles
- Use YAML inline objects: `{done: 5, active: 2, pending: 3}`

## Related

- `/load-context [stream] [--full]` - Load saved stream
- `/list-contexts [--sync] [--archive <stream>]` - List/sync all contexts
- `/create-context` - Create baseline from .in/ folder
