# Protocol: anchor

Challenge premature commitment and anchoring bias.

**Patterns**: Gatekeeper · Reset · Alternative Approaches · Pre-mortem

---

## Execution

Apply ALL 4 patterns in sequence. Each finding becomes a queue item per `reference.md` §Queue
Schema — not a report section directly. `generated_by: protocol:anchor`, `id` prefix `A`.

### Pattern 1: Gatekeeper

`type: decision` · `recommendation_allowed: true`

*Force justification before accepting the current decision.*

1. State the decision or approach under review
2. Ask: "What criteria MUST this decision satisfy to be valid?"
3. Ask: "Which of these criteria has NOT been verified yet?"
4. Ask: "What would have to be true for this to be the WRONG choice?"

Record: unverified criteria, conditions for failure.

### Pattern 2: Reset

`type: decision` · `recommendation_allowed: false` — divergent by construction: Reset exists to
surface the human's own fresh answer; handing back a recommended one would just re-anchor it.

*Wipe the slate — re-approach from scratch without prior framing.*

1. Set aside the current solution entirely
2. Re-read only the original problem statement (not the proposed solution)
3. Generate a fresh first-principles answer: "If I were starting from zero, what would I do?"
4. Compare fresh answer to current approach: where do they diverge?

Record: divergence points, new options surfaced by reset.

### Pattern 3: Alternative Approaches

`type: decision` · `recommendation_allowed: true`

*Ensure at least 2 alternatives were considered before committing.*

1. List the current approach
2. Generate 2 genuine alternatives (not strawmen):
   - Alternative A: [different mechanism, same goal]
   - Alternative B: [different goal framing or scope]
3. For each alternative: "Why was this NOT chosen?" (if no reason exists, it wasn't genuinely considered)

Record: alternatives generated, reasons for/against each.

### Pattern 4: Pre-mortem

`type: decision` · `recommendation_allowed: true`

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

Format of the Challenge Report emitted at the END of the walk, once all queue items from this
protocol are resolved — NOT emitted immediately after pattern execution. See ## Delivery.

```markdown
## Challenge Report: anchor (Gatekeeper · Reset · Alt Approaches · Pre-mortem)

**Target**: [decision or approach challenged]
**Error type**: anchoring / premature commitment

### Technique Selection

- **Family**: Anchor — premature commitment / anchoring bias
- **Patterns applied**: Gatekeeper, Reset, Alternative Approaches, Pre-mortem
- **Why these patterns**: [what in the target suggests premature commitment — e.g., single option considered, no alternatives listed, early convergence]
- **Patterns considered but skipped**: none — full anchor protocol applied

### Findings

**Gatekeeper** *(anchor family — blocks premature acceptance by demanding pass/fail criteria)*
- Observation: [what specifically triggered this — e.g., "decision accepted without listing success criteria"]
- Unverified criteria: [list]
- Conditions for failure: [list]
- Reasoning: [why these gaps matter]
- Confidence: [High/Med/Low]

**Reset** *(anchor family — reveals anchoring by comparing fresh first-principles answer)*
- Observation: [what about the current approach suggested anchoring]
- Fresh first-principles answer: [brief]
- Divergence from current approach: [list]
- Reasoning: [what the divergences reveal about the original thinking]
- Confidence: [High/Med/Low]

**Alternative Approaches** *(anchor family — tests whether alternatives were genuinely evaluated)*
- Observation: [were alternatives mentioned? dismissed too quickly?]
- Alt A: [description] — Reason not chosen: [or "not considered"]
- Alt B: [description] — Reason not chosen: [or "not considered"]
- Reasoning: [what missing consideration reveals]
- Confidence: [High/Med/Low]

**Pre-mortem** *(anchor family — surfaces failure modes before commitment)*
- Observation: [what risk signals exist in the target]
- Failure 1 (likely): [scenario] → Mitigation: [action]
- Failure 2 (indirect): [scenario] → Mitigation: [action]
- Failure 3 (black swan): [scenario] → Mitigation: [action]
- Reasoning: [why these failure modes are plausible given the target]
- Confidence: [High/Med/Low]

### Verdict

- **Assessment**: [Decision holds / Needs revision / Needs rejection]
- **Confidence**: [High / Medium / Low]
- **What would flip this**: [specific evidence that would change the verdict]
- **Strongest counter to this verdict**: [steelman the opposite conclusion]

### Recommended Action

[Proceed as-is | Proceed with modifications: X | Reconsider: Y]
```

## Delivery

Findings from this protocol are delivered as queue items, walked interactively — see
`reference.md` §Interactive Delivery for the full protocol (fact-first resolution, rank-ordered
decisions, cap N=5, one question per turn, plain text, hard gate). This file does not repeat it.
