# Protocol: anchor

Challenge premature commitment and anchoring bias.

**Patterns**: Gatekeeper · Reset · Alternative Approaches · Pre-mortem

---

## Execution

Apply ALL 4 patterns in sequence. For each finding, populate the Challenge Report section.

### Pattern 1: Gatekeeper

*Force justification before accepting the current decision.*

1. State the decision or approach under review
2. Ask: "What criteria MUST this decision satisfy to be valid?"
3. Ask: "Which of these criteria has NOT been verified yet?"
4. Ask: "What would have to be true for this to be the WRONG choice?"

Record: unverified criteria, conditions for failure.

### Pattern 2: Reset

*Wipe the slate — re-approach from scratch without prior framing.*

1. Set aside the current solution entirely
2. Re-read only the original problem statement (not the proposed solution)
3. Generate a fresh first-principles answer: "If I were starting from zero, what would I do?"
4. Compare fresh answer to current approach: where do they diverge?

Record: divergence points, new options surfaced by reset.

### Pattern 3: Alternative Approaches

*Ensure at least 2 alternatives were considered before committing.*

1. List the current approach
2. Generate 2 genuine alternatives (not strawmen):
   - Alternative A: [different mechanism, same goal]
   - Alternative B: [different goal framing or scope]
3. For each alternative: "Why was this NOT chosen?" (if no reason exists, it wasn't genuinely considered)

Record: alternatives generated, reasons for/against each.

### Pattern 4: Pre-mortem

*Simulate failure before it happens.*

1. Assume: "It is 6 months from now. This decision was implemented and it FAILED."
2. Generate 3 distinct failure scenarios:
   - Failure 1: [most likely — what's the obvious way this goes wrong?]
   - Failure 2: [second-order — what indirect consequence wasn't considered?]
   - Failure 3: [black swan — what low-probability, high-impact failure is possible?]
3. For each: "What would have to be true RIGHT NOW for this failure to be avoidable?"

Record: failure scenarios, early warning signals, mitigation actions.

---

## Output

```markdown
## Challenge Report: anchor (Gatekeeper · Reset · Alt Approaches · Pre-mortem)

**Target**: [decision or approach challenged]
**Error type**: anchoring / premature commitment

### Findings

**Gatekeeper**
- Unverified criteria: [list]
- Conditions for failure: [list]

**Reset**
- Fresh first-principles answer: [brief]
- Divergence from current approach: [list]

**Alternative Approaches**
- Alt A: [description] — Reason not chosen: [or "not considered"]
- Alt B: [description] — Reason not chosen: [or "not considered"]

**Pre-mortem**
- Failure 1 (likely): [scenario] → Mitigation: [action]
- Failure 2 (indirect): [scenario] → Mitigation: [action]
- Failure 3 (black swan): [scenario] → Mitigation: [action]

### Verdict

[Decision holds / Needs revision / Needs rejection]

### Recommended Action

[Proceed as-is | Proceed with modifications: X | Reconsider: Y]
```
