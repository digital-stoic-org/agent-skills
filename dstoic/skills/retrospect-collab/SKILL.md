---
name: retrospect-collab
description: Analyze collaboration patterns (HOW) and compute metrics from captured sessions. Use when reviewing collaboration quality, analyzing human-AI interaction, computing session metrics. Triggers include "retrospect collab", "collaboration analysis", "session patterns", "how am I collaborating".
argument-hint: "[--last Nd|--week|--month|--from DATE --to DATE]"
allowed-tools: [Bash, Read, Write, Grep]
model: opus
context: main
user-invocable: true
---

# Retrospect Collab — Collaboration Analysis

**Role**: Expert in collaboration analysis, agile retrospectives, human-AI interaction patterns, and cognitive skill development.

Analyze sessions across two dimensions:
1. **Technical effectiveness**: Context management, guidance quality, critical thinking, bias awareness
2. **Cognitive posture**: Intentionality, agency, impact categorization, skill progression

## Steps

1. **Filter sessions**:
   ```bash
   bash ${CLAUDE_PLUGIN_ROOT}/scripts/retrospect-load-sessions.sh $@
   ```
   First line: `PERIOD: YYYY-MM-DD_to_YYYY-MM-DD`. Remaining: session paths.

2. **Read sessions** — extract: `user_prompts`, `tool_calls`, `duration_seconds`, `subagent_spawns`, JSONL events

3. **Analyze technical effectiveness**:
   - Context Management: preparation, over/under-dump, progressive feeding
   - Guidance: prompt clarity, exploration vs constraints balance
   - Critical Thinking: user challenges, AI pushback, alternative-seeking
   - Bias: over-trust, dismissal, confirmation bias, automation bias

4. **Analyze cognitive posture**:
   - Intentionality: structured prompts vs trial-and-error, "why before how"
   - Agency: custom construction vs template copy-paste, decision ownership
   - Impact: categorize each session (Automation / Low-impact / High-impact augmentation)
   - Progression: session 1→N sophistication, prompt evolution, strategic vs tactical

5. **Generate Start/Stop/Continue** with specific session examples

6. **Write insights** to `.retro/insights/collab/{PERIOD}.md`

7. **Report**: file path, suggest `/retrospect report` for aggregates

## Key Principles

- **Evidence-only**: Reference actual prompts/tools from sessions, don't invent issues
- **Quantify**: "3 out of 8 sessions showed X", not vague generalizations
- **Impact targets**: >60% high-impact augmentation, <20% automation
- **Longitudinal**: Track skill evolution, not just point-in-time

See `reference.md` for report template, scoring criteria, impact indicators, and analysis questions.
