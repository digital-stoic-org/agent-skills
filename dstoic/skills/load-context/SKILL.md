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

## Performance Rules

1. **Use `rtk` for ALL shell commands**
2. **Parallel tool calls** — ALL independent calls in one message
3. **Minimize round-trips**
4. **No unnecessary synthesis** — present parsed data directly

## Workflow

### Phase 1: Detect & Read (parallel)

```
Bash: rtk ls -t CONTEXT-*llm.md || true
Read: CONTEXT-{stream}-llm.md (if stream known from $ARGUMENTS)
```

If multiple streams and no selection → AskUserQuestion with options.

**Filename**: `"default" → CONTEXT-llm.md`, `"{name}" → CONTEXT-{name}-llm.md`

### Phase 2: Expand Resources (if --full)

Parallel Read: OpenSpec project/proposal/tasks.md, top 3 hot files, manifest.yaml.
**DO NOT restore tasks** — informational only.

### Phase 3: Format Resume Report

Parse key-value header + markdown sections → human-friendly report.

See `reference.md` for section mapping, report structure, error messages, and formatting rules.
