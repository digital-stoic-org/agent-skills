---
name: retrospect-domain
description: Analyze domain insights (WHAT/WHY learned) from captured sessions.
allowed-tools: [Bash, Read, Write, Grep]
model: opus
---

# Retrospect Domain

Analyze sessions to extract domain learnings.

1. Load domain framework (technical/research/generic)
2. Filter sessions via `retrospect-load-sessions.sh`
3. Analyze: patterns discovered, decisions made, what worked/failed
4. Generate Start/Stop/Continue recommendations
5. Write insights to `.retro/insights/domain/{PERIOD}.md`
