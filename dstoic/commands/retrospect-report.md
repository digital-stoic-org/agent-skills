---
description: Generate aggregate reports with trends and visualizations across sessions
allowed-tools: Bash, Read, Write, Grep
argument-hint: [--last Nd|--week|--month|--from DATE --to DATE]
model: opus
---

# /retrospect report - Aggregate Reports

Generate aggregate views across multiple sessions: compute trends, identify patterns, create Mermaid visualizations, and provide recommendations.

## Arguments

- `--last Nd` - Last N days (e.g., `--last 7d`)
- `--week` - Current week (Monday-Sunday)
- `--month` - Current month
- `--from DATE --to DATE` - Specific date range
- No args - All sessions

## Instructions

1. **Filter sessions by timeframe:**
   ```bash
   bash ${CLAUDE_PLUGIN_ROOT}/scripts/retrospect-load-sessions.sh $@
   ```
   The first line of output is `PERIOD: YYYY-MM-DD_to_YYYY-MM-DD` — extract this for the output filename. Remaining lines are session file paths.

2. **Read all session files and compute aggregate metrics:**
   - Use Read tool to read each session YAML file
   - Extract from frontmatter: `user_prompts`, `tool_calls`, `duration_seconds`, `subagent_spawns`, `started_at`
   - Compute:
     - Total sessions
     - Total/average prompts per session
     - Total/average tool calls per session
     - Total duration (convert to hours/minutes)
     - Date range (first to last session)

3. **Check for recent collaboration insights:**
   - List files in `.retro/insights/collab/` (filenames are `YYYY-MM-DD_to_YYYY-MM-DD.md`, sort descending to find most recent)
   - If found, extract collaboration scores for visualization
   - Scores to extract: Context quality, Guidance clarity, Critical thinking, Bias awareness

4. **Identify activity patterns:**
   - Sessions per day/week (if enough data)
   - High prompt count sessions (flag if >15 prompts)
   - Subagent usage patterns
   - Tool usage patterns (most common tools)

5. **Generate Mermaid visualizations:**

   **If collaboration scores available:**
   ```mermaid
   %%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#e3f2fd','primaryTextColor':'#1565c0','primaryBorderColor':'#1976d2','lineColor':'#43a047'}}}%%
   xychart-beta
       title "Collaboration Scores (1-5)"
       x-axis [Context, Guidance, Thinking, Bias]
       y-axis "Score" 0 --> 5
       bar [4, 3, 4, 3]
   ```

6. **Write report:**
   Use Write tool to create `.retro/reports/{PERIOD}.md` where `{PERIOD}` is the `YYYY-MM-DD_to_YYYY-MM-DD` value from step 1:

   ```markdown
   # Retrospective Report: YYYY-MM-DD to YYYY-MM-DD

   ## Summary
   **Period:** [start date] to [end date]
   **Sessions:** N total
   **Total time:** Xh Ym

   ## Activity Metrics

   **Computed from raw session data:**
   - **Total prompts**: X (avg: Y per session)
   - **Total tool calls**: X (avg: Y per session)
   - **Subagents spawned**: X
   - **Duration**: Xh Ym (avg: Ys per session)

   ## Collaboration Effectiveness

   [Mermaid bar chart if scores available]

   **Latest collaboration metrics** (from most recent collab insight):
   - **Context quality**: X/5
   - **Guidance clarity**: X/5
   - **Critical thinking**: X/5
   - **Bias awareness**: X/5

   [Or: "*No collaboration insights available. Run `/retrospect collab` to generate scores.*"]

   ## Session Breakdown

   - **[timestamp]** (`session-id`) - Xm, Y prompts, Z tools
     - [First user prompt excerpt...]

   ## Recommendations

   ### Activity Patterns
   - Average session duration: Xm
   - Average prompts per session: Y
   - [Flag high prompt counts if applicable]
   - [Highlight subagent usage if applicable]

   ### Next Steps
   - [ ] Review domain insights in `.retro/insights/domain/`
   - [ ] Review collaboration insights in `.retro/insights/collab/`
   - [ ] Implement action items from Start/Stop/Continue frameworks
   - [ ] Run retrospective again next week/month to track trends

   ---
   Generated: [timestamp]
   Data source: N sessions from [start] to [end]
   ```

7. **Report completion:**
   Tell user:
   - File path
   - Summary: N sessions, Xh Ym total time, Y prompts, Z tool calls
   - Collaboration scores if available
   - Suggest reviewing domain/collab insights and implementing action items

## Key Principles

- **Aggregate accurately**: Compute totals and averages correctly from session data
- **Visualize trends**: Use Mermaid charts when data is available
- **Identify patterns**: Look for high-level trends across sessions
- **Actionable recommendations**: Suggest concrete next steps based on patterns
- **Data integrity**: Only include metrics that can be computed from session files
