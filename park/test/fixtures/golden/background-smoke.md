---
name: background
description: Run a task in the background. Use when user wants to start a long-running task without blocking.
---

# Background Task Runner

Execute the following task in the background:

$ARGUMENTS

- For agent tasks: Use Task tool with `run_in_background=true`
- For shell commands: Use Bash tool with `run_in_background=true`

Return immediately. Inform the user the task is running and how to check its status (TaskOutput tool or /tasks).
