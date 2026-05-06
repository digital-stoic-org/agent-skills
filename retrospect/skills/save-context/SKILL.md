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
3. **Hot Files** — max 10 discussed/edited
4. **Focus & Goal** — 1-2 sentence focus + goal
5. **Thinking Artifacts** (if Phase 1b found any) — list paths only, no content

### Phase 3: Write & Report

Write CONTEXT file using template, then upsert INDEX.md via `scripts/upsert-index.sh`.

**Stream naming**: `"default" → CONTEXT-llm.md`, `"{name}" → CONTEXT-{name}-llm.md`

### Phase 3b: Auto-archive to `done/`

If status is `done` or `parked` → move file to `done/` subfolder:
```
Bash: mkdir -p done && mv CONTEXT-{stream}-llm.md done/
```
Report: `"📦 Archived to done/ (status: {status})"`

See `reference.md` for CONTEXT file template, quality self-check, status mapping, done/ archival rules, and INDEX.md upsert logic.
