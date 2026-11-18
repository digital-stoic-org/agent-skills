---
name: retrospect-domain
description: Analyze domain insights (WHAT/WHY learned) from captured sessions. Use when reviewing learnings, extracting patterns, analyzing decisions. Triggers include "retrospect domain", "domain analysis", "what did I learn", "session insights".
argument-hint: "[domain] [--last Nd|--week|--month|--from DATE --to DATE]"
allowed-tools: [Bash, Read, Write, Grep]
model: opus
context: main
user-invocable: true
cynefin-domain: clear
cynefin-verb: execute
---

# Retrospect Domain — Domain Insights Analysis

Analyze captured sessions to extract domain learnings: what worked, decisions made, patterns emerged.

## Arguments

- **Domain** (optional first arg): `technical` | `research` | generic (default)
- **Timeframe**: `--last Nd` | `--week` | `--month` | `--from DATE --to DATE` | all

## Steps

1. **Load domain framework** (if specified):
   - Check `${CLAUDE_PLUGIN_ROOT}/reference/domain-{domain}.md`
   - If missing: warn, use generic framework

2. **Filter sessions**:
   ```bash
   bash ${CLAUDE_PLUGIN_ROOT}/scripts/retrospect-load-sessions.sh $@
   ```
   First line: `PERIOD: YYYY-MM-DD_to_YYYY-MM-DD`. Remaining: session paths.

3. **Read session files** — extract conversation turns, tools used, git context

4. **Analyze domain insights** using framework:
   - What new patterns/approaches discovered?
   - What decisions were made and why?
   - What worked well / what failed?
   - What patterns recur across sessions?

5. **Generate Start/Stop/Continue** recommendations

6. **Write insights** to `.retro/insights/domain/{PERIOD}.md`

7. **Report**: file path, suggest `/retrospect collab` or `/retrospect report`

See `reference.md` for domain frameworks, report template, and analysis questions.
