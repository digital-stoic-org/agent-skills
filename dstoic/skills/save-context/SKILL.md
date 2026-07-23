---
name: save-context
description: Save session to CONTEXT-llm.md with conversation summary. Use when saving work, checkpointing progress, preserving session state. Triggers include "save context", "save session", "checkpoint", "save my progress".
argument-hint: "[stream-name] [description]"
allowed-tools: [Bash, Read, Write, Edit, AskUserQuestion]
model: haiku
context: main
user-invocable: true
---

# Save Context

Save current session state to `CONTEXT-{stream}-llm.md` with LLM-optimized format.

**Target**: 1200-1500 tokens MAX | **Speed**: 3-5 seconds

## ⚠️ AskUserQuestion Guard

**CRITICAL**: After EVERY `AskUserQuestion` call, check if answers are empty/blank. Known Claude Code bug: outside Plan Mode, AskUserQuestion silently returns empty answers without showing UI.

**If answers are empty**: DO NOT proceed with assumptions. Instead:
1. Output: "⚠️ Questions didn't display (known Claude Code bug outside Plan Mode)."
2. Present the options as a **numbered text list** and ask user to reply with their choice number.
3. WAIT for user reply before continuing.

## Performance Rules

1. **Use `rtk` for ALL shell commands**
2. **Parallel tool calls** — ALL independent calls in one message
3. **Minimize round-trips** — gather all data phase 1, reason phase 2, write phase 3

## Workflow

### Phase 1: Gather Data (parallel)

```
Bash: rtk ls openspec/changes/ + rtk ls -t CONTEXT-*llm.md
```

**Stream resolution**: First word of `$ARGUMENTS` = stream name (`^[a-zA-Z0-9_-]{1,50}$`), rest = description. Empty → reuse prior `/load-context` stream or AskUserQuestion.

### Phase 1b: Detect Thinking Artifacts (parallel with Phase 1)

If `$PRAXIS_DIR` is set:
```
Bash: ls -t "$PRAXIS_DIR/thinking"/*/{project}/ 2>/dev/null | head -10
```
Where `{project}` = current project folder name. Collect recent artifact paths written during this session (match conversation timestamps/topics).

If `$PRAXIS_DIR` is unset or empty: skip silently — no error, no warning.

### Phase 2: Analyze & Synthesize (single pass)

From conversation (last 15-20 messages):
1. **Next** — infer 3 tasks from OpenSpec/conversation (IMPORTANT: use heading "Next" — Claude Code compaction grep-matches `next`/`todo`/`pending`/`remaining` keywords for survival priority)
2. **Session** — progression, decisions, thinking, unexpected (780 tokens max)
3. **Learnings** — non-obvious facts/gotchas discovered this session (bugs, constraints, surprises worth NOT rediscovering). Skip if none. Highest-value survival content.
4. **Hot Files** — max 10 discussed/edited. Tag survival priority: `[P1]` load-bearing (goal-critical), `[P2]` supporting. `--full` load keeps all; lean load keeps P1.
5. **Decisions** — within Session, tag key ones `[P1]`/`[P2]` for the same lean/full cut line.
6. **Focus & Goal** — 1-2 sentence focus + goal
7. **Drop** — 1-line note of noise NOT to re-chase on reload (resolved detours, verbose output). Skip if none.
8. **Thinking Artifacts** (if Phase 1b found any) — list paths only, no content
9. **Dead Ends** — approaches TRIED this session and abandoned + why, so the next session doesn't re-attempt them. Distinct from Drop: Drop = noise to ignore; Dead Ends = decisions-not-to-repeat. Skip if none.
10. **Predecessor** — if this session resumed a prior CONTEXT (via `/load-context`) or overwrites an existing stream file, record that file's path so streams chain into a walkable history. Else `none`.

### Phase 3: Write & Report

Before writing, apply two pre-write passes:
- **Reference-don't-copy** (named contract): never inline content that already lives in a spec/plan/diff/OpenSpec/thinking-artifact — reference it by path. The CONTEXT file points at sources; it does not duplicate them.
- **Scrub secrets**: strip anything key/token/credential/PII-shaped from the synthesized text (API keys, bearer tokens, `KEY=`/`PASSWORD=` values, private-key blocks) → replace with `[REDACTED]`. The resume file must never persist a secret.

Write CONTEXT file using template.

**Stream naming**: `"default" → CONTEXT-llm.md`, `"{name}" → CONTEXT-{name}-llm.md`

### Phase 3b: Auto-archive to `done/`

If status is `done` or `parked` → move file to `done/` subfolder:
```
Bash: mkdir -p done && mv CONTEXT-{stream}-llm.md done/
```
Report: `"📦 Archived to done/ (status: {status})"`

See `reference.md` for CONTEXT file template, quality self-check, and done/ archival rules.
