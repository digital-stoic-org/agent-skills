---
name: retrospect-report
description: Generate aggregate reports with trends and visualizations across sessions. Use when reviewing activity patterns, generating retrospective summaries. Triggers include "retrospect report", "aggregate report", "activity summary", "session trends".
argument-hint: "[--last Nd|--week|--month|--from DATE --to DATE]"
allowed-tools: [Bash, Read, Write, Grep]
model: opus
context: main
user-invocable: true
---

# Retrospect Report — Aggregate Analysis

Generate aggregate views across captured sessions: compute trends, identify patterns, create Mermaid visualizations.

## Steps

1. **Filter sessions by timeframe**:
   ```bash
   bash ${CLAUDE_PLUGIN_ROOT}/scripts/retrospect-load-sessions.sh $@
   ```
   First line: `PERIOD: YYYY-MM-DD_to_YYYY-MM-DD` (use for output filename). Remaining: session file paths.

2. **Read session files** — extract: `user_prompts`, `tool_calls`, `duration_seconds`, `subagent_spawns`, `started_at`

3. **Compute metrics**: total sessions, avg prompts/session, avg tool calls, total duration, date range

4. **Check collaboration insights**: list `.retro/insights/collab/` for scores (Context quality, Guidance clarity, Critical thinking, Bias awareness)

5. **Identify activity patterns**: sessions per day/week, high prompt counts (>15), subagent usage, tool patterns

6. **Generate Mermaid visualizations** (xychart-beta for collaboration scores if available)

7. **Write report** to `.retro/reports/{PERIOD}.md`

8. **Report completion**: file path, summary stats, suggest reviewing domain/collab insights

See `reference.md` for report template, Mermaid chart syntax, and metric computation details.
