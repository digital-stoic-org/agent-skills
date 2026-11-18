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
sessions:
  {role}: {last_save: YYYY-MM-DDTHH:MM:SSZ, status: {status}}
lines: {total} ({role} {n}, {role} {n})

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
  - [{role} {MM-DD}] [P1|P2] {key choice}: {rationale}
thinking:
  - [{role} {MM-DD}] {reasoning, trade-offs, insights}
unexpected:
  - [{role} {MM-DD}] {pivots, corrections, surprises}

## Learnings

{Optional — omit if none. Non-obvious facts/gotchas found this session, costly to rediscover.}

- [{role} {MM-DD}] {bug / constraint / surprise}: {what to remember}

## Standing

{Optional — omit entirely if empty. Hard rules, unverified premises, and definitions that hold across the whole stream, not just this save.}

- [{role} {MM-DD}] [constraint] {hard rule in force}
- [{role} {MM-DD}] [assumption] {unverified premise the work rests on}
- [{role} {MM-DD}] [definition] {term} = {meaning}

## Hot Files

- [{role}] [P1|P2] {path}: {brief role}

## Drop

{Optional — omit if none. Noise NOT to re-chase on reload.}

- {resolved detour | verbose output to ignore}

## Dead Ends

{Optional — omit if none. Approaches TRIED and abandoned — don't re-attempt (distinct from Drop: this is negative knowledge to keep, not noise to discard).}

- [{role} {MM-DD}] {approach}: {why it failed / was rejected}

## Thinking Artifacts

{Optional — only include if $PRAXIS_DIR/thinking is set and artifacts were written during session}

- {$PRAXIS_DIR/thinking/type/project/filename.md}: {brief description}

## Refs

- {external references if any}
```

**Solo session, no role in use**: keep today's untagged format unchanged — no `[{role} {MM-DD}]` prefix, no `sessions:`/`lines:` header fields.

## Clause → Section Routing

Trailers are collected verbatim from `<!-- ckpt s={role} ... -->` blocks already in the session's own conversation (the opening line's `s=<role>` attribute is skipped by the parser, which only reads lines containing a colon). Each clause routes mechanically — no rewording:

| Clause | Target section |
|---|---|
| `decision` | `## Session > decisions` |
| `reasoning` | `## Session > thinking` |
| `pivot` | `## Session > unexpected` |
| `learning` | `## Learnings` |
| `rejected` | `## Dead Ends` |
| `open` | `## Next` |
| `refs` | `## Refs` |
| `constraint` | `## Standing` [constraint] |
| `assumption` | `## Standing` [assumption] |
| `definition` | `## Standing` [definition] |

## Owned-Line Format

Lines in `## Session > decisions/thinking/unexpected`, `## Learnings`, `## Dead Ends`, and `## Standing` carry a role + first-appearance date:

```
- [<role> <MM-DD>] [tag] <text>
```

- `<role>` — role slug (`api`, `ui`, `docs`, …), set by the human via `--as <role>`. A stable **function** reused day to day, never a session UUID — that is what keeps the file flat: a role's lines get *replaced* on each of its saves instead of accumulating under a fresh identity every time. Resolution: `--as <role>` > role recorded by the last `/load-context` for this stream > none (solo, untagged).
- `<MM-DD>` — date the line FIRST appeared. Preserved verbatim on every rewrite, never restamped.
- `[tag]` — `P1`/`P2` for decisions; `constraint`/`assumption`/`definition` for Standing; omitted for Learnings/Dead Ends (or `P1`/`P2` if already in use there).
- Each session rewrites only ITS OWN tagged lines (carry-by-copy + new trailers this save). Every other role's lines are copied byte-for-byte — never edited, reordered, reworded, or reflowed.

`## Hot Files` is owned too, but deliberately **dateless**: `- [<role>] [P1|P2] <path>: <brief role>`. A first-appearance date exists to reason about *age*, and this whole list is regenerated from scratch every save (a stale hot-file list is noise, not signal) — so a date here would be churn with no meaning; don't "fix" it back to match the other owned sections. Owned and fresh-each-save are orthogonal: each role re-derives ITS OWN rows every save, every other role's rows still pass through byte-for-byte. Cap is **10 per role**, not 10 globally, so roles don't compete for slots.

## Context Quality Self-Check

- ✅ **Save**: non-trivial work (>1 file, decisions made), mid-stream checkpoint, learning/insights
- ⚠️ **Ask user**: quick fix (1-2 files, obvious), exploration with no conclusions
- ❌ **Suggest skip**: greeting/chat only, single read/question, unresolved troubleshooting

If marginal: `"📊 Session appears brief. Save context anyway?"` — wait for confirmation.

## Auto-Archive to `done/` (Phase 3b)

**Exceptions** — status is `done`/`parked` but do NOT move:
- `CONTEXT-llm.md` (default stream) — always stays in project root
- `CONTEXT-baseline-llm.md` — always stays in project root
- If user explicitly says "keep here" or "don't move"

## Stream Naming

- **Reserved**: `default` → `CONTEXT-llm.md`, `baseline` → fork point from `/create-context`
- **Pattern**: `^[a-zA-Z0-9_-]{1,50}$`

## Token Budget

- Session section: 780 tokens max
- Total: 2500-3000 tokens MAX
- Hot Files: max 10 per role, brief role note each
- Learnings + Drop + Dead Ends: ≤4 NEW bullets per role per save; no global cap for now — growth is being measured before any pruning mechanism is designed.
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
