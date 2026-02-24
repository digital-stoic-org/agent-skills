---
name: retrospect-report
description: Generate aggregate reports with trends and visualizations across sessions.
allowed-tools: [Bash, Read, Write, Grep]
model: opus
---

# Retrospect Report

Generate aggregate views across captured sessions.

1. Filter sessions by timeframe via `retrospect-load-sessions.sh`
2. Read sessions — extract prompts, tool calls, duration, subagent spawns
3. Compute metrics: total sessions, averages, date range
4. Generate Mermaid visualizations
5. Write report to `.retro/reports/{PERIOD}.md`
