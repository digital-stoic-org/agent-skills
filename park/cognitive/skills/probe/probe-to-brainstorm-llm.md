---
domain: complex
verb: probe
constraint-type: enabling
problem: "{problem statement}"
scale: "{boulder|pebble}"
---

## Thinking Trail

- **Considered**: {probe hypothesis and what was tested}
- **Rejected**: {hypothesis refuted — need new hypotheses}
- **Surprised by**: {unexpected data that invalidates original framing}
- **Models used**: Safe-to-fail experiment design
- **Constraints discovered**: {enabling constraints still present — problem remains complex}

## Decisions

1. **Probe result**: {refuted|surprise} — original hypothesis didn't hold
2. **Domain**: Staying Complex — need new hypotheses via brainstorm
3. **Rationale**: {probe eliminated one path but problem still has no clear cause-effect}

## Actions Taken

- Probe executed: {summary}
- Hypothesis refuted or surprise result
- Knowledge written: `$PRAXIS_DIR/thinking/probes/{project}/{date}-{slug}-llm.md`

## Output

Probe result: {refuted|surprise}
What was learned: {what the probe eliminated or revealed}
Why brainstorm: {need fresh hypotheses — old ones exhausted}

## Domain Transition

**From**: Complex (probe) → **To**: Complex (brainstorm)
No domain shift — staying in Complex. Probe refuted hypothesis; returning to divergent exploration with new information.

## For /brainstorm

- **Context**: Probe refuted "{hypothesis}" — see `$PRAXIS_DIR/thinking/probes/` for evidence
- **What's eliminated**: {DO NOT regenerate these hypotheses — already tested and failed}
- **New signals**: {what the probe revealed that should inform new hypotheses}
- **Constraint update**: {any new enabling constraints discovered during probe}
- **Goal**: Generate new hypotheses that account for probe findings
- **Do NOT**: Revisit refuted hypothesis or its variants

## Accumulated Context

Token guidance: target 300 tokens inline. For depth, use **references** — point to `$PRAXIS_DIR/thinking/{type}/{date}-{slug}-llm.md` files rather than embedding full content.
Soft cap: 600 tokens inline per handoff. If you need more, move detail to a knowledge file and reference it.
Accumulated cap: 800 tokens across a chain — compress to 200 at cap (keep: decisions, constraints, rejected paths). References do NOT count toward the cap.
