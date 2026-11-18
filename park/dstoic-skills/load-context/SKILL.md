---
name: load-context
description: Resume session from CONTEXT-llm.md. Use when resuming work, loading saved context, continuing a previous session. Triggers include "load context", "resume session", "continue where I left off".
argument-hint: "[stream-name] [--as <role>] [--full]"
allowed-tools: [Bash, Read, AskUserQuestion]
model: haiku
context: main
user-invocable: true
---

# Load Context

Load session state from `CONTEXT-{stream}-llm.md` and optionally expand full resources.

**Speed**: < 3 seconds (default), 5-8 seconds (--full)

## ⚠️ AskUserQuestion Guard

**CRITICAL**: After EVERY `AskUserQuestion` call, check if answers are empty/blank. Known Claude Code bug: outside Plan Mode, AskUserQuestion silently returns empty answers without showing UI.

**If answers are empty**: DO NOT proceed with assumptions. Instead:
1. Output: "⚠️ Questions didn't display (known Claude Code bug outside Plan Mode)."
2. Present the options as a **numbered text list** and ask user to reply with their choice number.
3. WAIT for user reply before continuing.

## Performance Rules

1. **Use `rtk` for ALL shell commands**
2. **Parallel tool calls** — ALL independent calls in one message
3. **Minimize round-trips**
4. **No unnecessary synthesis** — present parsed data directly

## Workflow

### Phase 1: Detect & Read (parallel)

```
Bash: rtk ls -t CONTEXT-*llm.md done/CONTEXT-*llm.md 2>/dev/null || true
Read: CONTEXT-{stream}-llm.md (if stream known from $ARGUMENTS)
```

If not found in project root, check `done/` subfolder. If found there, note `📦 (from done/)` in report.

If multiple streams and no selection → AskUserQuestion with options (mark done/ files with 📦).

**Filename**: `"default" → CONTEXT-llm.md`, `"{name}" → CONTEXT-{name}-llm.md`

**Role**: if `--as <role>` is passed, record it as this session's active role. A later `/save-context` call in the same session reuses it without needing `--as` again.

### Phase 2: Expand Resources (if --full)

Parallel Read: OpenSpec project/proposal/tasks.md, hot files, manifest.yaml.
**Hot file selection**: `--full` reads all hot files (all roles); default (lean) reads `[P1]`-tagged only, across ALL roles, not just mine (untagged = P2 = lean-skip). Fallback if no tags present: top 3.
**DO NOT restore tasks** — informational only.

**Thinking Artifacts** (if `## Thinking Artifacts` section exists in CONTEXT file):
- Default mode: display artifact paths in resume report (no content read)
- `--full` mode: Read referenced `$PRAXIS_DIR/thinking` artifacts and include brief summaries in report
- If `$PRAXIS_DIR` is unset: display paths as-is, note `⚠️ $PRAXIS_DIR not set`

### Phase 3: Resume Report

Phase 1's Read already put the whole file in context — re-rendering it would pay those tokens twice and risk a paraphrase drifting from the source. The report **orients, never re-explains**.

Output exactly 4 lines — no section blocks, no re-synthesis:

```
🔄 {stream} · {status} · saved {relative time} by [{role}]
🎯 {goal, one line}
▶️  {Next[0]}
⚠️  {N} new lines from [{other role}] since my last save   ← omit if none
```

Solo session (no role recorded) → drop ` par [{role}]` from line 1; line 4 never applies.

**`## Standing` lines**: render as rules in force for THIS resumed session, not informational bullets.
- `[constraint]` → active rule the model must honour now
- `[assumption]` → premise to re-verify before relying on it
- `[definition]` → term binding for this session

See `reference.md` for section mapping, delta-line computation, error messages, and role resolution.
