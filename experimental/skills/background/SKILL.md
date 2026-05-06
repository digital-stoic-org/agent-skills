---
name: background
description: Run a task in the background. Use when user wants to start a long-running task without blocking, run agent tasks or shell commands asynchronously. Triggers include "background", "run in background", "async", "non-blocking".
argument-hint: "[task description]"
context: main
user-invocable: true
---

# Background Task Runner

Execute the following task in the background:

$ARGUMENTS

Use the appropriate background execution method:
- For agent tasks: Use Task tool with `run_in_background=true`
- For shell commands: Use Bash tool with `run_in_background=true`

Return immediately after starting the background task. Inform the user:
1. That the task is running in background
2. How to check its status or output later (using TaskOutput tool or /tasks command)
