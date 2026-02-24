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

### Phase 2: Analyze & Synthesize (single pass)

From conversation (last 15-20 messages):
1. **NextTasks** — infer 3 from OpenSpec/conversation
2. **Session** — progression, decisions, thinking, unexpected (780 tokens max)
3. **Hot Files** — max 10 discussed/edited
4. **Focus & Goal** — 1-2 sentence focus + goal

### Phase 3: Write & Report

Write CONTEXT file using template, then upsert INDEX.md via `scripts/upsert-index.sh`.

**Stream naming**: `"default" → CONTEXT-llm.md`, `"{name}" → CONTEXT-{name}-llm.md`

See `reference.md` for CONTEXT file template, quality self-check, status mapping, and INDEX.md upsert logic.
