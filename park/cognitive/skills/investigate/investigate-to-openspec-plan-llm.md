---
domain: complicated
verb: analyze
constraint-type: governing
problem: "{problem statement}"
scale: boulder
---

## Thinking Trail

- **Considered**: {investigation approaches and findings}
- **Rejected**: {approaches eliminated during investigation}
- **Surprised by**: {unexpected constraints or complexities discovered}
- **Models used**: {Issue Trees, technical analysis, codebase exploration}
- **Constraints discovered**: {governing constraints confirmed — clear path to solution}

## Decisions

1. **Investigation result**: Solution path identified
2. **Architecture**: {key architectural decisions from investigation}
3. **Rationale**: {why this solution over alternatives — evidence-based}

## Actions Taken

- Deep analysis completed: {scope of investigation}
- Constraints mapped: {what governs the solution space}
- Solution designed: {high-level approach}

## Output

Recommended solution: {approach summary}
Key constraints: {what bounds the implementation}
Risk factors: {identified risks and mitigations}

## Domain Transition

**From**: Complicated (investigate) → **To**: Complicated (openspec-plan)
No domain shift — staying in Complicated. Investigation complete, solution identified. Moving from analysis to structured planning for implementation.

## For /openspec-plan

- **Scope**: {what to plan — specific deliverables from investigation}
- **Architecture decisions**: {already decided — DO NOT re-investigate}
- **Constraints**: {governing constraints — timeline, dependencies, technical limits}
- **Risks**: {identified during investigation — plan should address mitigations}
- **Affected components**: {files, systems, interfaces touched}
- **Do NOT**: Re-investigate options — decision is made. Plan the execution.

## Accumulated Context

Token guidance: target 300 tokens inline. For depth, use **references** — point to `$PRAXIS_DIR/thinking/{type}/{date}-{slug}-llm.md` files rather than embedding full content.
Soft cap: 600 tokens inline per handoff. If you need more, move detail to a knowledge file and reference it.
Accumulated cap: 800 tokens across a chain — compress to 200 at cap (keep: decisions, constraints, rejected paths). References do NOT count toward the cap.
