# Protocol: framing

Challenge whether the right problem is being solved.

**Patterns**: Socratic · Steelman

---

## Execution

Apply BOTH patterns in sequence. Each finding becomes a queue item per `reference.md` §Queue
Schema — not a report section directly. `generated_by: protocol:framing`, `id` prefix `F`.

### Pattern 1: Socratic

`type: decision` · `recommendation_allowed: true` — EXCEPT Stage 3 (Dialectic):
`recommendation_allowed: false`. Dialectic asks the human to generate the opposing position
themselves; a divergent question — supplying a recommended answer would neutralize the exercise
it exists to produce (spec §4).

*6-stage questioning sequence to surface hidden assumptions.*

(Chang 2023 — adapted from Classical Socratic method)

**Stage 1 — Definition**: "What exactly do we mean by [key term in problem]?"
- Force precise definition of ambiguous terms
- Expose: is the problem statement actually clear?

**Stage 2 — Elenchus (Examination)**: "Is that definition consistent with how we're actually using it?"
- Test the definition against concrete examples
- Expose: hidden contradictions in the framing

**Stage 3 — Dialectic**: "What is the OPPOSITE position? Who would disagree, and why?"
- Generate the counter-position to the current framing
- Expose: what's being taken for granted

**Stage 4 — Maieutics (Midwifery)**: "What do you actually believe, stripped of the framing?"
- Remove the problem statement's language entirely
- Ask: "What is the real goal here?"

**Stage 5 — Generalization**: "Does this apply only here, or is it a symptom of a broader pattern?"
- Expose: is this a local issue or an instance of a deeper structural problem?

**Stage 6 — Counterfactual**: "If the problem didn't exist, what would be different? Is that the right thing to change?"
- Identify the actual desired end-state
- Expose: are we solving for the right outcome?

Record: key answers from each stage, assumptions surfaced.

### Pattern 2: Steelman

`type: decision` · `recommendation_allowed: false` — divergent by construction: Steelman exists to
produce the human's strongest counter-position; a recommended answer would neutralize it.

*Build the strongest possible counter-argument to current framing.*

(Opposite of strawman — give the opposition its best case)

1. State the current problem framing clearly: "We believe [X] is the problem"
2. Construct the steelmanned counter: "The strongest argument that [X] is NOT the problem is..."
   - Use the best evidence available for the counter-position
   - Assume the counter-position is correct — what would that imply?
   - Do NOT use weak objections; make it genuinely hard to dismiss
3. Stress-test current framing against the steelman:
   - "If the steelman is right, what does that mean for our current approach?"
   - "What would have to be true for the steelman to be wrong?"
4. Verdict: Does the current framing survive the steelman?

Record: steelmanned counter, stress test results, framing verdict.

---

## Output

Format of the Challenge Report emitted at the END of the walk, once all queue items from this
protocol are resolved — NOT emitted immediately after pattern execution. See ## Delivery.

```markdown
## Challenge Report: framing (Socratic · Steelman)

**Target**: [problem statement or framing challenged]
**Error type**: framing / wrong problem

### Technique Selection

- **Family**: Framing — wrong problem / framing errors
- **Patterns applied**: Socratic, Steelman
- **Why these patterns**: [what about the target suggests a framing issue — e.g., solution seems correct but goal unclear, key terms ambiguous, assumptions unstated]
- **Patterns considered but skipped**: none — full framing protocol applied

### Findings

**Socratic Questioning** *(framing family — 6-stage questioning surfaces hidden assumptions)*
- Observation: [what specifically triggered framing concern]
- Definition surfaced: [what key terms actually mean]
- Hidden contradictions: [list]
- Real goal (post-maieutics): [stripped-down actual objective]
- Broader pattern: [local issue or systemic symptom]
- Counterfactual: [what should actually change]
- Reasoning: [what the Socratic stages revealed about the framing's validity]
- Confidence: [High/Med/Low]

**Steelman Counter-Argument** *(framing family — strongest possible counter to current framing)*
- Observation: [what weakness in the framing the steelman exploits]
- Current framing: [X is the problem]
- Steelman: [strongest case that X is NOT the problem]
- Stress test: [does framing survive?]
- Reasoning: [why the steelman succeeds or fails against the framing]
- Framing verdict: [Framing holds / Framing needs revision / Wrong problem entirely]
- Confidence: [High/Med/Low]

### Verdict

- **Assessment**: [Framing holds / Needs revision / Wrong problem — reframe before proceeding]
- **Confidence**: [High / Medium / Low]
- **What would flip this**: [specific evidence that would change the verdict]
- **Strongest counter to this verdict**: [steelman the opposite conclusion]

### Recommended Action

[Proceed as-is | Reframe as: [alternative framing] | Stop and reframe before implementing]
```

## Delivery

Findings from this protocol are delivered as queue items, walked interactively — see
`reference.md` §Interactive Delivery for the full protocol (fact-first resolution, rank-ordered
decisions, cap N=5, one question per turn, plain text, hard gate). This file does not repeat it.
