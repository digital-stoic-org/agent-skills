---
name: load-context
description: Resume session from CONTEXT-llm.md. Use when resuming work, loading saved context, continuing a previous session. Triggers include "load context", "resume session", "continue where I left off".
argument-hint: "[stream-name] [--full]"
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

### Phase 2: Expand Resources (if --full)

Parallel Read: OpenSpec project/proposal/tasks.md, top 3 hot files, manifest.yaml.
**DO NOT restore tasks** — informational only.

**Thinking Artifacts** (if `## Thinking Artifacts` section exists in CONTEXT file):
- Default mode: display artifact paths in resume report (no content read)
- `--full` mode: Read referenced `$THINKING_DIR` artifacts and include brief summaries in report
- If `$THINKING_DIR` is unset: display paths as-is, note `⚠️ $THINKING_DIR not set`

### Phase 3: Format Resume Report

Parse key-value header + markdown sections → human-friendly report.

See `reference.md` for section mapping, report structure, error messages, and formatting rules.
