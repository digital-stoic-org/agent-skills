# save Reference

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

## Next

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

## Status Mapping

| Raw Value | Display | Menu Choice |
|-----------|---------|-------------|
| `building` | 🔄 building | 1. Checkpoint |
| `done` | ✅ done | 2. Done |
| `parked` | 🅿️ parked | 3. Parking |

Cowork uses 3 core statuses. Other statuses (`exploring`, `decided`, `in_progress`) are dstoic-specific — preserved on load but overwritten on save.

## Auto-Archive Rules

When status is `done` or `parked`:
1. `mkdir -p done/` in the project folder
2. `mv CONTEXT-{stream}-llm.md done/`
3. Confirm: `"📦 Archived to done/ (status: {status})"`

**Exceptions** — do NOT move:
- `CONTEXT-llm.md` (default stream)
- `CONTEXT-baseline-llm.md`
- If user explicitly says "keep here" or "don't move"

## Token Budget

- Session section: 780 tokens max
- Total: 1200-1500 tokens MAX
- Hot Files: max 10 with brief roles
- Use YAML inline objects: `{done: 5, active: 2, pending: 3}`
