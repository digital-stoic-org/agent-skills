---
domain: complex
verb: probe
constraint-type: enabling
problem: "{problem statement}"
scale: "{boulder|pebble}"
---

## Thinking Trail

- **Considered**: {actions taken during experiment — what was tried}
- **Rejected**: {actions that didn't work or made things worse}
- **Surprised by**: {structure that emerged from chaos — the key finding}
- **Models used**: Act-sense pattern (Chaotic domain)
- **Constraints discovered**: {enabling constraints that emerged — the chaos is resolving}

## Decisions

1. **Experiment outcome**: Structure emerged — constraints shifting from absent to enabling
2. **Domain shift**: Chaotic → Complex
3. **Rationale**: {minimal structure now exists — safe-to-fail probing is possible}

## Actions Taken

- Experiment actions: {list of act-gate-sense cycles}
- Structure emerged at action {N}: {what pattern appeared}
- Gate decisions: {human decisions at each gate}

## Output

Emerged structure: {what constraints now exist}
Hypothesis candidate: {testable hypothesis from emerged patterns}
Transition trigger: {what signaled "enough structure to probe"}

## Domain Transition

**From**: Chaotic (experiment) → **To**: Complex (probe)
Constraint shift: absent → enabling. Actions imposed enough structure for patterns to emerge. Safe-to-fail experimentation now possible — move from acting blindly to probing with hypotheses.

## For /probe

- **Emerged hypothesis**: {hypothesis derived from experimental observations}
- **New enabling constraints**: {constraints that emerged during experiment — use as probe bounds}
- **Action log**: {what was tried and what happened — prevents probe repeating failed actions}
- **Stability assessment**: {how stable is the emerged structure — probe should test this}
- **Fallback**: If probe reveals structure was illusory, return to `/experiment`
- **Do NOT**: Assume stability — the emerged structure needs validation via probe

## Accumulated Context

Token guidance: target 300 tokens inline. For depth, use **references** — point to `$THINKING_DIR/{type}/{date}-{slug}-llm.md` files rather than embedding full content.
Soft cap: 600 tokens inline per handoff. If you need more, move detail to a knowledge file and reference it.
Accumulated cap: 800 tokens across a chain — compress to 200 at cap (keep: decisions, constraints, rejected paths). References do NOT count toward the cap.
