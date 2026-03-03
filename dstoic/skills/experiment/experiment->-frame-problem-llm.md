---
domain: confused
verb: decompose
constraint-type: unknown
problem: "{problem statement}"
scale: "{boulder|pebble}"
---

## Thinking Trail

- **Considered**: {actions taken during experiment}
- **Rejected**: {approaches that didn't reveal structure}
- **Surprised by**: {experiment revealed problem is different than initially thought}
- **Models used**: Act-sense pattern (Chaotic domain)
- **Constraints discovered**: {problem needs re-classification — original framing was wrong}

## Decisions

1. **Experiment outcome**: Problem needs re-framing — chaos revealed misclassification
2. **Domain shift**: Chaotic → Confused (re-classify)
3. **Rationale**: {experiment revealed the problem is fundamentally different than assumed}

## Actions Taken

- Experiment actions: {list of act-gate-sense cycles}
- Re-classification trigger: {what revealed the original framing was wrong}

## Output

Re-classification needed: {why the problem must be re-framed}
New information: {what the experiment revealed about the true nature of the problem}

## Domain Transition

**From**: Chaotic (experiment) → **To**: Confused (frame-problem)
Constraint shift: absent → unknown. Experiment revealed the problem isn't what we thought. Need to re-classify with new information before proceeding.

## For /frame-problem

- **New context**: Experiment revealed {key finding that changes the framing}
- **Original classification was**: Chaotic
- **Why re-classify**: {experiment showed constraints exist but were misidentified}
- **Carry forward**: {action log and what was learned — prevents re-exploring}
- **Do NOT**: Default back to Chaotic — re-classify with fresh eyes using new evidence

## Accumulated Context

Token guidance: target 300 tokens inline. For depth, use **references** — point to `$THINKING_DIR/{type}/{date}-{slug}-llm.md` files rather than embedding full content.
Soft cap: 600 tokens inline per handoff. If you need more, move detail to a knowledge file and reference it.
Accumulated cap: 800 tokens across a chain — compress to 200 at cap (keep: decisions, constraints, rejected paths). References do NOT count toward the cap.
