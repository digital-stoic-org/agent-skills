---
domain: complex
verb: probe
constraint-type: enabling
problem: "{problem statement}"
scale: "{boulder|pebble}"
---

## Thinking Trail

- **Considered**: {hypotheses generated during brainstorm — ranked list}
- **Rejected**: {hypotheses eliminated and why — prevents probe re-exploring dead ends}
- **Surprised by**: {unexpected connections or framings discovered}
- **Models used**: {SCAMPER, Issue Trees, Morphological Analysis, etc.}
- **Constraints discovered**: {enabling constraints surfaced during divergent exploration}

## Decisions

1. **Selected hypothesis**: {top-ranked hypothesis to probe}
2. **Confidence**: {why this hypothesis over others}
3. **Rationale**: {what evidence supports testing this first}

## Actions Taken

- Divergent brainstorm: {N} hypotheses generated
- Convergent filter: {N} eliminated, {N} viable
- Top hypothesis selected for probe

## Output

Selected hypothesis: {hypothesis statement}
Alternatives: {2nd and 3rd ranked, in case probe refutes primary}

## Domain Transition

**From**: Complex (brainstorm) → **To**: Complex (probe)
No domain shift — staying in Complex. Moving from divergent exploration to focused safe-to-fail experiment.

## For /probe

- **Hypothesis to test**: {specific, falsifiable hypothesis from brainstorm}
- **Enabling constraints**: {what bounds the probe — from brainstorm's constraint discovery}
- **Suggested confirm/refute criteria**: {what would confirm or refute — brainstorm should propose}
- **Rejected hypotheses**: {DO NOT re-explore these — already eliminated with rationale above}
- **Fallback hypotheses**: {if primary is refuted, try 2nd/3rd ranked}
- **Do NOT**: Re-brainstorm — hypotheses are ready. Qualify and probe.

## Accumulated Context

Token guidance: target 300 tokens inline. For depth, use **references** — point to `$THINKING_DIR/{type}/{date}-{slug}-llm.md` files rather than embedding full content.
Soft cap: 600 tokens inline per handoff. If you need more, move detail to a knowledge file and reference it.
Accumulated cap: 800 tokens across a chain — compress to 200 at cap (keep: decisions, constraints, rejected paths). References do NOT count toward the cap.
