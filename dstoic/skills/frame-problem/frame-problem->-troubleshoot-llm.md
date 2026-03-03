---
domain: complicated
verb: analyze
constraint-type: governing
problem: "{problem statement from classification}"
scale: "{boulder|pebble}"
---

## Thinking Trail

- **Considered**: {what approaches were weighed during framing}
- **Rejected**: {why complex/chaotic didn't fit — governing constraints exist}
- **Surprised by**: {degradation signals — errors, declining quality}
- **Models used**: Cynefin constraint classification + Q1.1 sub-question
- **Constraints discovered**: {governing constraints — known system, degrading behavior}

## Decisions

1. **Domain**: Complicated (governing constraints, degraded system)
2. **Route**: troubleshoot → stabilize → re-frame
3. **Rationale**: {system was working, now failing — diagnostic expertise applies}

## Actions Taken

- Classified via Q1: governing constraints identified
- Q1.1: degraded (quality declining, system failing)
- Scale determined: {boulder|pebble}

## Output

🎯 Complicated → Analyze → /troubleshoot → stabilize → re-frame | OpenSpec: no | Scale: {scale}

## Domain Transition

**From**: Confused → **To**: Complicated
Constraint shift: unknown → governing. System has known good state — it's degrading from that state. Diagnostic expertise applies.

## For /troubleshoot

- **Symptom**: {what's broken or degrading}
- **Known good state**: {what it looked like when working}
- **Recent changes**: {what changed before degradation started}
- **Diagnostic approach**: Search-first — check learnings database, then systematic diagnosis
- **Do NOT**: Redesign — stabilize first, then re-frame if deeper changes needed

## Accumulated Context

Token guidance: target 300 tokens inline. For depth, use **references** — point to `$THINKING_DIR/{type}/{date}-{slug}-llm.md` files rather than embedding full content.
Soft cap: 600 tokens inline per handoff. If you need more, move detail to a knowledge file and reference it.
Accumulated cap: 800 tokens across a chain — compress to 200 at cap (keep: decisions, constraints, rejected paths). References do NOT count toward the cap.
