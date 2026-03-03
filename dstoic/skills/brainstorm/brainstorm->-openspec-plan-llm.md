---
domain: complicated
verb: analyze
constraint-type: governing
problem: "{problem statement}"
scale: boulder
---

## Thinking Trail

- **Considered**: {options explored during brainstorm}
- **Rejected**: {options eliminated and why}
- **Surprised by**: {unexpected findings}
- **Models used**: {SCAMPER, Issue Trees, Morphological Analysis, etc.}
- **Constraints discovered**: {governing constraints — best practices, patterns identified}

## Decisions

1. **Selected approach**: {chosen option from brainstorm}
2. **Confidence**: High — governing constraints clear, expertise applies
3. **Rationale**: {why this approach won — trade-off analysis summary}

## Actions Taken

- Divergent brainstorm: {N} options generated
- Trade-off analysis completed
- Approach selected, ready for planning

## Output

Selected approach: {approach summary}
Key trade-offs: {what was sacrificed for what}

## Domain Transition

**From**: Complex (brainstorm) → **To**: Complicated (openspec-plan)
Constraint shift: enabling → governing. Brainstorm resolved ambiguity — now the problem has known good approaches. Expert analysis (planning) is the right next step.

## For /openspec-plan

- **Scope**: {what to plan — from brainstorm's selected approach}
- **Constraints**: {governing constraints discovered — budget, timeline, dependencies}
- **Architecture decisions**: {key choices already made during brainstorm — do not re-decide}
- **Rejected approaches**: {DO NOT revisit — already eliminated with rationale}
- **Scale**: Boulder — requires full OpenSpec workflow
- **Do NOT**: Re-brainstorm options — decision is made. Plan the execution.

## Accumulated Context

Token guidance: target 300 tokens inline. For depth, use **references** — point to `$THINKING_DIR/{type}/{date}-{slug}-llm.md` files rather than embedding full content.
Soft cap: 600 tokens inline per handoff. If you need more, move detail to a knowledge file and reference it.
Accumulated cap: 800 tokens across a chain — compress to 200 at cap (keep: decisions, constraints, rejected paths). References do NOT count toward the cap.
