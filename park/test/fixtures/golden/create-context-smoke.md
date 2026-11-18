---
name: create-context
description: Create baseline context from .in/ folder with manifest-driven organization (run once per project).
allowed-tools: [Read, Write, Glob, Bash, AskUserQuestion, Task]
---

# Create Context

Bootstrap project context from `.in/` → `.ctx/` snapshot + baseline.

1. Check `.in/` exists, `.ctx/` doesn't (or `--force`)
2. Scan + prioritize files (HIGH/MEDIUM/LOW via user)
3. Create `.ctx/manifest.yaml`
4. Copy/summarize by priority + token threshold
5. Write `CONTEXT-baseline-llm.md` (≤2000 tokens)
