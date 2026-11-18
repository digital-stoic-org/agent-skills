# Protocol: forward

Challenge an intention BEFORE any artifact exists.

**Patterns**: Socratic · Steelman · Alternative Approaches · Gatekeeper · Pre-mortem (5 of 9 — see Scope)
**Input**: a spoken intention. No file to read, no plan, no output, no claims.
**Generator**: main context, no sub-agent (see Why no fresh context).
**Output**: a challenge queue, `generated_by: protocol:forward` — schema in `reference.md` §Queue Schema.

Core insight: **the same pattern yields a FINDING backward and a QUESTION forward.** Backward, the
pattern inspects an artifact and reports what it found. Forward, there is nothing to inspect — the
pattern is run as a generator of the questions the artifact would have answered.

---

## Scope: 5 patterns of 9

| Pattern | Family | In forward | Why |
|---|---|---|---|
| Socratic | framing | yes | Questions the framing — needs no artifact, only wording |
| Steelman | framing | yes | Counter-case is built against the intention itself |
| Alternative Approaches | anchor | yes | The intention already names one mechanism — that is the anchor |
| Gatekeeper | anchor | yes | Criteria fixed BEFORE the build instead of checked after |
| Pre-mortem | anchor | yes | Failure simulated at zero cost, output = build constraint |
| Reset | anchor | **no** | Mechanism = discard the existing solution and re-derive. No solution exists to discard; a reset of nothing returns the intention unchanged |
| Proof Demand | verify | **no** | Extracts factual claims from a text. No text |
| CoVe | verify | **no** | Verifies stated claims against independent answers. No claims |
| Fact Check List | verify | **no** | Decomposes a response into atomic assertions. No response |

**The verify family is void in forward, not merely skipped.** An intention states a want, not a
fact. It has no truth value, so there is nothing to source, decompose, or contradict. Applying
verify to an intention is a category error — it would fabricate claims in order to check them.
Verification becomes available only once the build produces something asserted: that is `deep`,
not `forward`.

## Why no fresh context, no sub-agent

`deep` pays for a sub-agent because the main context CONTAINS the anchor: the artifact plus the
reasoning that produced it. Escaping that requires a context that never saw it.

Forward has no artifact and no prior reasoning to escape. The debiasing lever is **timing, not
isolation** — the questions are asked while the answers are still free to change. A sub-agent
would buy nothing and cost a round trip.

Residual anchor to guard against: the intention has already been spoken, and the main context
tends to paraphrase-and-agree with it. Countermeasures, both mandatory:
- The two divergent items (F3 Dialectic, F4 Steelman) are asked OPEN — the protocol supplies no
  candidate answer, not even as an illustration (see `reference.md` §Recommendation Guard).
- No item is emitted from what the protocol would itself have proposed; every item cites a
  fragment of the intention as its `observation`.

## Backward → forward conversion

### F1 · Socratic stage 1 — Definition
- **Backward**: what do the key terms of this artifact actually mean, and is the meaning stable?
- **Forward**: fix the meaning before it is built into something. The ambiguity is currently free.
- **Question**: *In "<intention verbatim>", what exactly counts as <key term>? Give the test that
  separates a case that counts from one that doesn't.*
- `type: decision` · `recommendation_allowed: true` — arbitration between candidate readings.
  Recommended answer = the reading that makes the rest of the intention consistent.
- **Disarms**: illusion of shared definition — ambiguity read as agreement.

### F2 · Socratic stage 4 — Maieutics
- **Backward**: what is the real goal, stripped of the problem statement's language?
- **Forward**: the intention almost always names a mechanism. Strip it and see what is left.
- **Question**: *Stated without any mention of <the mechanism you named>, what has to be true when
  this is done?*
- `type: decision` · `recommendation_allowed: true` — the protocol proposes the outcome it reads
  under the mechanism; the human confirms or corrects it.
- **Disarms**: means-end substitution — the mechanism becomes the spec, and no cheaper route to
  the same outcome is ever looked for.

### F3 · Socratic stage 3 — Dialectic  *(divergent)*
- **Backward**: what is the opposite position, and who holds it?
- **Forward**: same question, aimed at the intention to act at all.
- **Question**: *Who, competent and informed on this, would say this should not be built — and on
  what ground?*
- `type: decision` · `recommendation_allowed: **false**` — asked open, no recommended answer.
- **Hard rule**: the protocol does NOT name the objector or sketch the objection, not even as an
  example. The pattern exists to produce the human's divergence; handing over a counter-position
  converts that into a yes/no on ours.
- **Disarms**: assumed consensus — no one disagreeing yet is read as no one disagreeing.

### F4 · Steelman  *(divergent)*
- **Backward**: the protocol builds the strongest case against the artifact's framing and
  stress-tests the framing against it.
- **Forward**: the framing IS the intention, so the steelman is the case for the opposite
  intention — do nothing, or do the contrary thing. **The human builds it, not the protocol.**
  A steelman authored here and handed over is the backward form: an anchor with a question mark.
- **Question**: *Make the best case for the opposite: that <status quo / contrary option> is
  already the right answer. What is the strongest thing that case has going for it?*
- `type: decision` · `recommendation_allowed: **false**` — asked open, no recommended answer.
- **Disarms**: confirmation bias and status-quo blindness at once — forces the strongest, not the
  most dismissible, version of not doing this.

### A1 · Alternative Approaches
- **Backward**: generate ≥2 genuine alternatives to the chosen approach; for each, "why was this
  NOT chosen?" — no reason means no real evaluation.
- **Forward**: nothing is chosen yet, but the mechanism named out loud is already the front
  runner. Treat it as approach 0 and force the ruling-out before it hardens.
- **Question**: *Your intention names <mechanism>. Two others reach the same outcome: (a) <A>,
  (b) <B>. Which do you rule out, and on what ground?*
- `type: decision` · `recommendation_allowed: true` — the alternatives widen the option set; the
  question itself is an arbitration among them.
- **Constraint**: the two alternatives must be genuine (different mechanism, same outcome). A
  strawman alternative turns the recommendation into a pre-decision.
- **Disarms**: anchoring on the first mechanism named — Einstellung effect.

### A2 · Gatekeeper
- **Backward**: demand explicit pass/fail criteria for the decision, then check which remain
  unverified.
- **Forward**: no decision to accept — instead the criteria are set NOW, so the build has a
  pass/fail it can be measured against by someone other than its author.
- **Question**: *When this is done, what check — not what feeling — tells you it worked? And which
  of those checks cannot be run today?*
- `type: decision` · `recommendation_allowed: true` — recommended answer = the criteria the
  protocol would hold the build to, flagging the ones unverifiable before build (accept as a bet,
  or cut the scope that depends on them).
- **Disarms**: criteria drift — success judged after the fact by the person who built it, which
  always passes.

### A3 · Pre-mortem
- **Backward**: assume it shipped and failed; generate 3 failure scenarios; find mitigations.
- **Forward**: identical mechanism, radically cheaper — the failure is still avoidable for free,
  and the output is a build constraint rather than a retrofitted mitigation.
- **Question**: *Six months out, this shipped and it failed. The likeliest cause is <X>. What do
  you change in the plan today so that cause cannot occur?*
- `type: decision` · `recommendation_allowed: true` — the protocol generates the scenarios; the
  human arbitrates which mitigation is worth its cost.
- **Disarms**: optimism bias / planning fallacy (Klein 2007).

## Generation, order, ranking

Generation order — **frame before arbitrating**: an option is only comparable once the outcome it
serves is defined, so the framing family (F1-F4) runs before the anchor family (A1-A3).

Default candidate set: 7 items — F1, F2, F3, F4, A1, A2, A3. Cap is 5.

Ranking follows `reference.md` §Queue Schema (`rank` = impact × uncertainty), with two
forward-specific rules:
1. Tie-break by generation order above.
2. **Hard**: A1/A2/A3 never rank above F3/F4. They carry recommendations about the option space;
   delivering one before the human has diverged plants the anchor the divergent items exist to
   prevent. Rule applies to option-space recommendations only — F1's recommendation is about
   vocabulary and may be delivered first.

Items beyond the cap go to `not_walked`, listed explicitly. In practice F2 or A3 falls off on a
narrow intention; on a vague one F1 outranks everything.

**No `type: fact` items.** Nothing is asserted yet, so nothing is checkable. If a question's
answer is discoverable from the environment (prior art in the repo, an existing skill doing this
already), the protocol resolves it with Read/Glob/Grep BEFORE emitting and folds the result into
the item's `observation` — it never emits a fact item for the human to answer.

**Confidence calibration.** Forward confidence is structurally lower than backward: the only
evidence is the wording of the intention. `high` requires a verbatim fragment as trigger;
inference from what the intention does NOT say caps at `medium`.

Every item carries the full Thinking Transparency — `observation` (the fragment that triggered
it), pattern named, `reasoning` (the bias it disarms), `confidence` — and so does every question
as delivered.

## Delivery

Emit the queue per `reference.md` §Queue Schema, with:
- `generated_by: "protocol:forward"`
- `target:` the intention, verbatim as spoken
- `cap: 5`

Then walk it per `reference.md` §Interactive Delivery — one question per turn, plain numbered
text, wait for the answer. Two forward-specific deltas:
- Step 1 (resolve fact items alone) is a no-op: forward emits none.
- Step 7's hard gate reads here as: **no build starts** — no file written, no scaffolding, no
  "while we're at it" — until the queue is exhausted or the human says stop.

End of walk: Challenge Report = queue + resolution of each item, as a message. The resolutions of
A1/A2/A3 are the build constraints; the resolutions of F1-F4 are the framing the build inherits.

## Chaining

```
/frame-problem  →  /challenge forward  →  build  →  /challenge deep
```

- **Before**: `/frame-problem` produces the problem statement; `forward` challenges the intention
  to act on it. If F1 shows the key terms are undefined at all, exit early and route back to
  `/frame-problem` — walking the rest of the queue over undefined terms produces answers about
  nothing.
- **After**: `deep` runs on what got built, in fresh context, with all 9 patterns — the verify
  family included, because claims now exist. Divergence between what was decided in `forward` and
  what the artifact actually does is itself a `deep` finding.
