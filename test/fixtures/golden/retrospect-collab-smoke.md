---
name: retrospect-collab
description: Analyze collaboration patterns (HOW) and compute metrics from captured sessions.
allowed-tools: [Bash, Read, Write, Grep]
model: opus
---

# Retrospect Collab

Analyze sessions for collaboration quality across two dimensions.

1. Filter sessions via `retrospect-load-sessions.sh`
2. Read sessions — extract prompts, tool calls, duration, events
3. Analyze technical effectiveness (context, guidance, critical thinking, bias)
4. Analyze cognitive posture (intentionality, agency, impact, progression)
5. Generate Start/Stop/Continue with specific examples
6. Write insights to `.retro/insights/collab/{PERIOD}.md`
