---
name: load-context
description: Resume session from CONTEXT-llm.md.
allowed-tools: [Bash, Read, AskUserQuestion]
model: haiku
---

# Load Context

Load session state from `CONTEXT-{stream}-llm.md`.

1. Detect streams: `rtk ls -t CONTEXT-*llm.md`
2. Read selected stream (or ask user if multiple)
3. Expand resources if `--full` flag
4. Format human-friendly resume report with sections mapped from context file
