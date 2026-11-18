---
domain: complex
verb: probe
constraint-type: enabling
problem: "{problem statement}"
scale: "{boulder|pebble}"
---

## Thinking Trail

- **Considered**: {prior probe hypothesis and what was tested}
- **Rejected**: {interpretations eliminated by prior probe}
- **Surprised by**: {unexpected patterns — partial result needs different angle}
- **Models used**: Safe-to-fail experiment design
- **Constraints discovered**: {enabling constraints — updated from prior probe cycle}

## Decisions

1. **Probe result**: {partial} — some signal, need different angle
2. **Domain**: Staying Complex — not enough structure for Complicated yet
3. **Rationale**: {partial result suggests refined hypothesis worth testing}
4. **Refined hypothesis**: {new or sharpened hypothesis based on prior probe}

## Actions Taken

- Prior probe executed: {summary of cycle N}
- Partial result: {what was confirmed, what remains uncertain}
- Knowledge written: `$PRAXIS_DIR/thinking/probes/{project}/{date}-{slug}-llm.md`

## Output

Prior probe result: {partial}
Confirmed so far: {what holds}
Still uncertain: {what needs another probe cycle}
Refined hypothesis: {sharpened for next cycle}

## Domain Transition

**From**: Complex (probe cycle N) → **To**: Complex (probe cycle N+1)
Self-transition — staying in Complex. Prior probe produced partial result. Refining hypothesis and probing again with accumulated knowledge.

## For /probe

- **Refined hypothesis**: {sharpened hypothesis accounting for prior cycle findings}
- **Prior enabling constraints**: {carry forward — do NOT rediscover}
- **Prior confirm/refute criteria**: {carry forward, update if refined}
- **What's confirmed**: {from prior cycle — do NOT re-test}
- **What's refuted**: {from prior cycle — do NOT retry}
- **New angle**: {what to test differently this cycle}
- **Accumulated probe history**: Cycle {N} → partial. See `$PRAXIS_DIR/thinking/probes/` for full trail.
- **Do NOT**: Re-qualify from scratch — Phase 1 should be faster with carried context

## Accumulated Context

Token guidance: target 300 tokens inline. For depth, use **references** — point to `$PRAXIS_DIR/thinking/{type}/{date}-{slug}-llm.md` files rather than embedding full content.
Soft cap: 600 tokens inline per handoff. If you need more, move detail to a knowledge file and reference it.
Accumulated cap: 800 tokens across a chain — compress to 200 at cap (keep: decisions, constraints, rejected paths). References do NOT count toward the cap.
Prior cycles: {count}. If total accumulated > 800 tokens, compress prior trails to 200 tokens (keep: confirmed facts, active constraints, rejected paths only).
