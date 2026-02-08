---
description: Analyze domain insights (WHAT/WHY learned) from captured sessions
allowed-tools: Bash, Read, Write, Grep
argument-hint: [domain] [--last Nd|--week|--month|--from DATE --to DATE]
model: opus
---

# /retrospect domain - Domain Insights Analysis

Analyze captured sessions to extract domain learnings: what was learned, what worked/didn't work, decisions made, and patterns that emerged.

## Arguments

**Domain (optional first argument):**
- `technical` - Use technical domain framework (architecture, code, tools, bugs)
- `research` - Use research domain framework (hypotheses, methods, insights, sources)
- No domain arg - Use generic framework

**Timeframe filters:**
- `--last Nd` - Last N days (e.g., `--last 7d`)
- `--week` - Current week (Monday-Sunday)
- `--month` - Current month
- `--from DATE --to DATE` - Specific date range (e.g., `--from 2026-01-01 --to 2026-01-05`)
- No args - All sessions

**Examples:**
- `/retrospect domain technical --last 7d` - Technical analysis of last 7 days
- `/retrospect domain research --month` - Research analysis of current month
- `/retrospect domain --week` - Generic analysis of current week

## Instructions

1. **Parse domain argument and load framework:**
   - Check if first argument is a domain name (not starting with `--`)
   - If domain specified:
     - Check if `${CLAUDE_PLUGIN_ROOT}/reference/domain-{domain}.md` exists using Read tool
     - If exists: Read the domain framework file and use it to guide analysis
     - If not exists: Warn user "Unknown domain: {domain}, using generic framework" and continue
   - If no domain specified: Use generic framework (see step 4 below)
   - Shift remaining args (timeframe filters) for load-sessions.sh

2. **Filter sessions by timeframe:**
   ```bash
   bash ${CLAUDE_PLUGIN_ROOT}/scripts/retrospect-load-sessions.sh $@
   ```
   This returns a list of session file paths matching the timeframe.

3. **Read session files:**
   - Use Read tool to read each session YAML file
   - Extract: conversation turns (user prompts + Claude responses), tools used, git context
   - Parse JSONL events to understand the session flow

4. **Analyze domain insights:**

   **If domain framework loaded:**
   - Follow the domain-specific analysis patterns from the reference file
   - Use domain-specific questions and frameworks for insight extraction
   - Focus on domain-appropriate learnings and patterns

   **If generic framework (no domain specified):**

   **For technical sessions:**
   - What new patterns, APIs, or architectural approaches were discovered?
   - What technical decisions were made and why?
   - What implementation approaches worked well?
   - What approaches failed or would be done differently?
   - What edge cases or gotchas were encountered?
   - What technical debt was uncovered or paid down?

   **For business sessions:**
   - What strategic insights emerged about the domain?
   - What customer/user needs were clarified?
   - What business decisions were made and their rationale?
   - What trade-offs were considered?
   - What assumptions were proven wrong?
   - What analysis didn't yield expected value?

   **Look for patterns across sessions:**
   - Recurring technical patterns or anti-patterns
   - Common decision-making themes
   - Areas of consistent success or struggle

5. **Generate Start/Stop/Continue recommendations:**
   - **Start**: New domain practices to adopt based on learnings
   - **Stop**: Domain anti-patterns or ineffective approaches to eliminate
   - **Continue**: Effective domain practices to maintain

6. **Write insights:**
   Use Write tool to create `.retro/insights/domain/YYYY-MM-DD.md` with:

   ```markdown
   # Domain Retrospective: YYYY-MM-DD

   ## Sessions Reviewed
   - [List sessions with timestamps and brief summaries]

   ## Domain Learnings

   ### What I Learned
   [Key discoveries, new patterns, insights about the domain]

   ### What Worked Well
   [Successful approaches, good decisions, effective strategies]

   ### What Didn't Work
   [Failed approaches, mistakes, what would be done differently]

   ### Decisions Made
   [Key decisions and their rationale, trade-offs considered]

   ### Patterns Emerged
   [Recurring patterns noticed across sessions]

   ## Start/Stop/Continue

   ### Start (Begin Doing)
   [New practices to adopt]

   ### Stop (Avoid)
   [Anti-patterns to eliminate]

   ### Continue (Maintain)
   [Effective practices to keep]

   ## Action Items
   - [ ] [Specific actions based on insights]

   ## Metrics Summary
   - **Sessions**: N (technical/business/mixed breakdown)
   - **Period**: [start date] to [end date]

   ---
   Generated: [timestamp]
   ```

7. **Report completion:**
   Tell user the file path and suggest next steps (run `/retrospect collab` or `/retrospect report`).

## Key Principles

- **Extract, don't invent**: Base insights on actual session content, not generic advice
- **Be specific**: Reference actual conversations, tools used, decisions visible in sessions
- **Detect patterns**: Look for themes across multiple sessions, not just one-offs
- **Domain-appropriate**: Use domain frameworks when specified for deeper, more relevant insights
- **Framework flexibility**: Technical sessions → code/architecture insights; Research sessions → hypothesis/method insights; Generic → adapt to session content
