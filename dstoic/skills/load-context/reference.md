# load-context Reference

## Section Mapping

**Every** section is loaded into context by the Phase 1 Read and **not printed**. This table lists only what happens *beyond* that.

| CONTEXT Section | Beyond the Read | Fallback names |
|---|---|---|
| Header (saved/stream/status/focus/goal) | status/goal → report lines 1-2 | — |
| `## Next Tasks` | `Next[0]` → report line 3 (▶️) | `## NextTasks` |
| `## Hot Files` | expanded per Phase 2 selection | `## Files` |
| `## Drop` | explicitly not re-chased | — |
| `## Dead Ends` | surfaced only on `--full` or on demand | — |
| `## Standing` | rendered as rules in force (SKILL.md Phase 3) | — |
| `## Thinking Artifacts` | paths only (Phase 2) | — |
| Owned lines, any section | other-role lines → line-4 delta count | — |
| `## Session` · `## Learnings` · `## Project` · `## Refs` · `## Tasks` | nothing | `## Session Progression`, `## References` |

Owned-line prefixes (`[<role> <MM-DD>]`) are parsed for the delta count, never printed raw. `## Hot Files` is owned but **dateless** — `[<role>] [P1|P2] <path>: <brief role>`, max 10 per role — because the list is regenerated every save. Solo session → untagged.

**Graceful degradation**: Missing/malformed sections → skip (don't error). Only Header + `## Next Tasks` required.

## Roles

- **Resolution**: `--as <role>` argument > none (untagged/solo session). Once resolved, the role is recorded for the session so a later `/save-context` reuses it without `--as`.
- **Delta line** (line 4, `⚠️`): count owned lines (see Section Mapping note above) whose `[<role> <MM-DD>]` names a role other than mine, AND whose date is later than my own `last_save` in the `sessions:` header. Omit the line if the count is 0 or no other role exists.

## Formatting Principles

- Parse key-value header + markdown sections directly, don't re-synthesize into prose
- Relative time: humanize the `saved`/`last_save` timestamp (e.g. "il y a 2h")
- `▶️` line is `Next[0]` verbatim, not reworded
- Fixed emoji markers only (🔄 🎯 ▶️ ⚠️) — no added decoration

## Meta-Awareness

**Input**: Key-value header + markdown sections from `/save-context` (token-optimized)
**Audience**: Human user resuming work
**Purpose**: Place the context in memory via the Read; orient the human in 4 lines

## Error Messages

| Condition | Message |
|-----------|---------|
| No context files | "No context files found. Run `/save-context` to create one." |
| Stream not found | "Stream '{name}' not found. Available: {list}" (also check `done/` subfolder) |
| Stream in done/ | Load normally, prefix report with "📦 Loaded from done/ — this context is archived ({status})" |
| File read error | "Could not read {filename}. Check file permissions." |
| Malformed file | Parse what's available, skip unparseable sections |

## Related

- `/save-context [stream] [description]` - Save session to named stream
- `/list-contexts [--sync] [--archive <stream>]` - List/sync all contexts
- `/create-context` - Create baseline from .in/ folder
