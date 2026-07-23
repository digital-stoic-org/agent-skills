# save-context Reference

## CONTEXT File Template

```markdown
# Session Context: {title}

saved: YYYY-MM-DDTHH:MM:SSZ
stream: {name}
status: {exploring|building|decided|parked|done}
predecessor: {path to prior CONTEXT-*-llm.md this session continues | none}
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
  - {[P1|P2]} {key choice}: {rationale}
thinking:
  - {reasoning, trade-offs, insights}
unexpected:
  - {pivots, corrections, surprises}

## Learnings

{Optional — omit if none. Non-obvious facts/gotchas found this session, costly to rediscover.}

- {bug / constraint / surprise}: {what to remember}

## Hot Files

- {[P1|P2]} {path}: {brief role}

## Drop

{Optional — omit if none. Noise NOT to re-chase on reload.}

- {resolved detour | verbose output to ignore}

## Dead Ends

{Optional — omit if none. Approaches TRIED and abandoned — don't re-attempt (distinct from Drop: this is negative knowledge to keep, not noise to discard).}

- {approach}: {why it failed / was rejected}

## Thinking Artifacts

{Optional — only include if $PRAXIS_DIR/thinking is set and artifacts were written during session}

- {$PRAXIS_DIR/thinking/type/project/filename.md}: {brief description}

## Refs

- {external references if any}
```

## Context Quality Self-Check

- ✅ **Save**: non-trivial work (>1 file, decisions made), mid-stream checkpoint, learning/insights
- ⚠️ **Ask user**: quick fix (1-2 files, obvious), exploration with no conclusions
- ❌ **Suggest skip**: greeting/chat only, single read/question, unresolved troubleshooting

If marginal: `"📊 Session appears brief. Save context anyway?"` — wait for confirmation.

## Auto-Archive to `done/` (Phase 3b)

When status is `done` or `parked`:
1. `mkdir -p done/` in the project folder
2. `mv CONTEXT-{stream}-llm.md done/`
3. Confirm: `"📦 Archived to done/ (status: {status})"`

**Exceptions** — do NOT move:
- `CONTEXT-llm.md` (default stream) — always stays in project root
- `CONTEXT-baseline-llm.md` — always stays in project root
- If user explicitly says "keep here" or "don't move"

## Stream Naming

- **Reserved**: `default` → `CONTEXT-llm.md`, `baseline` → fork point from `/create-context`
- **Pattern**: `^[a-zA-Z0-9_-]{1,50}$`

## Token Budget

- Session section: 780 tokens max
- Total: 1200-1500 tokens MAX
- Hot Files: max 10 with brief roles
- Learnings + Drop + Dead Ends: ≤4 bullets each, omit when empty (don't pad)
- Use YAML inline objects: `{done: 5, active: 2, pending: 3}`

## Priority Tags (P1/P2)

- `[P1]` = load-bearing (goal-critical); `[P2]` = supporting context
- Applies to **Hot Files** and key **decisions**
- `/load-context --full` keeps all; lean load keeps P1 only
- Untagged = treated as P2

## Related

- `/load-context [stream] [--full]` - Load saved stream
- `/list-contexts [--sync] [--archive <stream>]` - List/sync all contexts
- `/create-context` - Create baseline from .in/ folder
