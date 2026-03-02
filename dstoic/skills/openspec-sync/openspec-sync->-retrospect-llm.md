---
domain: clear
verb: execute
constraint-type: rigid
problem: "{change-id sync completed}"
scale: pebble
---

## Thinking Trail

- **Considered**: {what was synced — docs, status, context}
- **Rejected**: N/A — sync is mechanical
- **Surprised by**: {any drift or inconsistencies found during sync}
- **Models used**: OpenSpec sync protocol
- **Constraints discovered**: {rigid — sync follows fixed process}

## Decisions

1. **Sync result**: Change {change-id} synced
2. **Status**: {current change status after sync}
3. **Rationale**: Sync complete — retrospect captures learnings

## Actions Taken

- Docs updated: {what was synced}
- Status refreshed: {new status}
- Context saved: {CONTEXT file updated}

## Output

Change {change-id} synced. Status: {status}.
Ready for retrospective analysis.

## Domain Transition

**From**: Clear (openspec-sync) → **To**: Clear (retrospect)
No domain shift. Mechanical handoff from sync completion to learning extraction. Both are rigid-constraint processes.

## For /retrospect-domain

- **Change completed**: {change-id}
- **Key decisions made**: {summary of architectural/design decisions worth capturing}
- **Patterns observed**: {what worked well, what was friction}
- **Learnings to extract**: {domain insights from this change — WHAT/WHY}
- **Do NOT**: Re-analyze the implementation — extract learnings from what happened

## Accumulated Context

Token guidance: target 300 tokens inline. For depth, use **references** — point to `$KNOWLEDGE_DIR/{type}/{date}-{slug}-llm.md` files rather than embedding full content.
Soft cap: 600 tokens inline per handoff. If you need more, move detail to a knowledge file and reference it.
Accumulated cap: 800 tokens across a chain — compress to 200 at cap (keep: decisions, constraints, rejected paths). References do NOT count toward the cap.
