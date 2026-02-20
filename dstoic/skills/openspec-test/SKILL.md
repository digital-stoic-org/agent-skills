---
name: openspec-test
description: "Generic test executor for OpenSpec changes. Use when: running checkpoint verification at gates, executing test.md strategies."
model: sonnet
allowed-tools: [Glob, Grep, Read, Edit, Bash]
---

# OpenSpec Test

Generic verification executor for OpenSpec gates. Follows test.md strategy literally — no improvisation.

```mermaid
flowchart LR
    A["Read test.md"] --> B["Validate quality"]
    B --> C{"Lazy patterns?"}
    C -->|Yes| X["BLOCKED"]
    C -->|No| D["Execute verification"]
    D --> E["Write logs"]
    E --> F["Report result"]

    classDef action fill:#C8E6C9,stroke:#388E3C,color:#000
    classDef decision fill:#FFF9C4,stroke:#FBC02D,color:#000
    classDef fail fill:#FFCDD2,stroke:#D32F2F,color:#000
    class A,B,D,E,F action
    class C decision
    class X fail
```

## checkpoint

**Input**: `$ARGUMENTS` = `change-id section-number` (e.g., `add-feature 3`)

**Workflow**:
1. Read `openspec/changes/{change-id}/tasks.md` → find `## {section-number}. ...`
2. Read `openspec/changes/{change-id}/test.md` → verification strategy. If missing: warn + offer `/openspec-plan tasks {change-id}` or skip (garage only).
3. **Validate**: Scan for lazy patterns (`grep "keyword"`, `[ -f file ]`, `wc -l`, `echo`). If found → BLOCKED with suggestion for functional verification.
4. **Init logs**: Create `test-logs/gate-{n}-raw.json` (source of truth) + `test-logs/gate-{n}.md` (rendered summary). See reference.md §Log Formats.
5. **Execute** by type tag (default `[auto]`):

| Tag | Action | Evaluator |
|-----|--------|-----------|
| `[auto]` | Run command, assert exit+output | Agent |
| `[smoke]` | Run command, display output | Agent + human glance |
| `[manual]` | Display instructions, AskUserQuestion (PASS/FAIL/SKIP) | Human |

   - Order: `[auto]` + `[smoke]` first, group `[manual]` at end
   - **Per step**: Append raw capture to `gate-{n}-raw.json` immediately after execution

6. **Write summary** to `gate-{n}.md` — rendered from raw JSON, not memory. See reference.md §Test Log Format.
7. **Display** gate summary inline to user.
8. **Evaluate**:
   - PASS → mark `### GATE {n}: desc [PASS]` in tasks.md
   - PARTIAL → report failures with per-step diagnostics
   - BLOCKED → report blockers, suggest options

## Log Strategy

Two artifacts per gate in `openspec/changes/{change-id}/test-logs/`:

| File | Format | Purpose |
|------|--------|---------|
| `gate-{n}-raw.json` | JSON | Source of truth — full stdout/stderr, no truncation (mask secrets) |
| `gate-{n}.md` | Markdown | Human summary — truncated output, rendered from raw JSON |

- On re-run: append to `runs[]` array (JSON) / append timestamped section (markdown)
- Markdown truncation: stdout >50 lines → first 30 + last 10; stderr >20 lines → first 15

See reference.md §Raw Log Format for JSON schema, §Test Log Format for markdown template.

## Mode Behavior

Read `openspec/project.md` → `mode`:
- **garage**: Warn if test.md missing, allow skip
- **scale/maintenance**: Block until test.md exists + passes

## References

See reference.md for: log format templates, JSON schema, test progression strategy, framework-specific patterns, execution tracing, failure diagnostics.
