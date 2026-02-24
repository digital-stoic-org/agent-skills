---
name: save-context
description: Save session to CONTEXT-llm.md with conversation summary.
allowed-tools: [Bash, Read, Write, Edit, AskUserQuestion, TaskList]
model: haiku
---

# Save Context

Save current session to `CONTEXT-{stream}-llm.md`. Target: 1200-1500 tokens.

1. Gather: scan openspec, list streams, get task state (parallel)
2. Synthesize: NextTasks, session progression, hot files, focus/goal
3. Write CONTEXT file + upsert INDEX.md
