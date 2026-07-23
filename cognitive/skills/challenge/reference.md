# Challenge — Reference

> **CRITICAL CONSTRAINT**: the interviewer (main context) DELIVERS the queue. It never
> REGENERATES findings in the main context. Regenerating reopens the anchoring door the
> fresh-context generator (sub-agent or protocol) just closed — the whole benefit of a fresh
> context is lost. See `## Queue Schema` and `## Interactive Delivery` below.

## Pattern Catalog (9 patterns)

| # | Pattern | Subcommand | Error Type | Source | Mechanism | forward_capable | type (default) | recommendation_allowed |
|---|---------|-----------|------------|--------|-----------|------------------|-----------------|------------------------|
| 1 | Gatekeeper | anchor | Premature commitment | Florian WP01 §4.5 | Demand explicit pass/fail criteria for the decision BEFORE accepting it. Ask: "What must be true for this to be correct?" then check which criteria remain unverified. Blocks premature acceptance. | yes | decision | true |
| 2 | Reset | anchor | Premature commitment | Florian WP01 §4.5 | Discard the current solution entirely. Re-read ONLY the original problem. Generate a fresh answer from first principles. Compare with original — divergences reveal anchoring. | no (requires an existing solution) | decision | **false** |
| 3 | Alternative Approaches | anchor | Premature commitment | White et al. 2023 (Vanderbilt) | Force generation of ≥2 genuine alternatives (different mechanisms, not strawmen). For each: "Why was this NOT chosen?" — if no reason exists, the original wasn't properly evaluated. | yes | decision | true |
| 4 | Pre-mortem | anchor | Premature commitment | Klein 2007; EMNLP 2024 (Wang) | Assume the decision was implemented and FAILED. Generate 3 failure scenarios (most likely, second-order, black swan). For each: identify early warning signs and mitigation actions available NOW. | yes | decision | true |
| 5 | Proof Demand | verify | Factual errors | Florian WP01 §4.5 | Extract every factual claim. For each, classify: ✅ Sourced (citation exists), ⚠️ Unsourced (stated as fact without evidence), ❌ Contradicted (evidence disagrees). Flag ⚠️/❌ as untrustworthy until verified. | no (requires existing claims) | fact | false |
| 6 | CoVe | verify | Factual errors | Dhuliawala et al. 2023 (Meta) | 4-step Chain-of-Verification: (1) state the claim, (2) write specific verification questions, (3) answer each question INDEPENDENTLY without looking at the original claim, (4) compare independent answers to original — discrepancies = errors. | no | fact | false |
| 7 | Fact Check List | verify | Factual errors | White et al. 2023 (Vanderbilt) | Decompose response into atomic checkable assertions (one fact per line). Rate confidence: High/Medium/Low/Unknown. For Low/Unknown: write a concrete verification action (search query, doc to read, test to run). Priority-order by impact × uncertainty. | no | fact | false |
| 8 | Socratic | framing | Framing errors | Chang 2023 | 6-stage questioning: (1) Definition — what do key terms actually mean? (2) Elenchus — is the definition consistent with usage? (3) Dialectic — what's the opposite position? (4) Maieutics — what's the real goal, stripped of framing? (5) Generalization — local issue or systemic pattern? (6) Counterfactual — if the problem didn't exist, what changes? | yes | decision | true, EXCEPT stage 3 Dialectic -> **false** |
| 9 | Steelman | framing | Framing errors | Rationalist tradition | Build the STRONGEST possible counter-argument to the current framing (opposite of strawman). Use best available evidence for the counter-position. Assume it's correct — what would that imply? Stress-test: "What must be true for the steelman to be wrong?" If no clear answer, the framing is weak. | yes | decision | **false** |

`type: fact` -> always `false`: the item is never posed to the human, so the question of a
recommendation doesn't arise.

Same pattern, two shapes: in backward mode it produces a FINDING (something already exists to
challenge); in forward mode it produces a QUESTION (nothing exists yet — the pattern probes an
intention before it becomes an artifact). `forward` mode = exactly the 5 `forward_capable: yes`
patterns (Gatekeeper, Alternative Approaches, Pre-mortem, Socratic, Steelman). The `verify` family
is out of scope in forward — no claim exists yet to verify.

## Modes

| Mode | Invocation | Generator | Delivery |
|---|---|---|---|
| `route` | `/challenge <free description>` (DEFAULT) or `/challenge route <desc>` | none | <=5 lines, 0 sub-agent |
| `forward` | `/challenge forward <intention>` | main context, 5 patterns | interactive walk |
| `anchor` | `/challenge anchor <target>` | main context, 4 patterns | interactive walk |
| `verify` | `/challenge verify <target>` | main context, 3 patterns | interactive walk |
| `framing` | `/challenge framing <target>` | main context, 2 patterns | interactive walk |
| `deep` | `/challenge deep <target>` | fresh sub-agent, 9 patterns (sequential, not parallel) | interactive walk, top-N |
| `deep --report` | `/challenge deep --report <target>` | fresh sub-agent, 9 patterns (sequential, not parallel) | batch report (legacy, fire-and-forget escape hatch) |

`no-op` is a possible router verdict only — never an invocable mode.

`deep` runs ONE sub-agent that executes the 9 patterns in sequence inside a single fresh context.
It is not 9 parallel agents and no wording anywhere in this skill should suggest fan-out.

## Recommendation Guard

`recommendation_allowed` is the anti-anchoring guard on the `recommended_answer` field.

grill-me's "recommended answer" is, by construction, an anchor. In a debiasing skill, applying it
everywhere defeats the skill's own purpose.

- **Convergent question** (tradeoff between criteria, choice of mitigation, selection among
  alternatives) → `recommendation_allowed: true`. A recommendation is provided; the human can
  reply "ok". No risk here — the divergence already happened upstream, in the fresh-context
  generator, before this question was ever asked.
- **Divergent question** (Reset, Steelman, Socratic stage 3 Dialectic) → `recommendation_allowed:
  false`. The question is asked OPEN, with no recommendation attached. The pattern's entire job is
  to produce the human's own divergence — attaching an answer to it neutralizes the pattern.

`recommended_answer` and `recommendation_rationale` are required IF AND ONLY IF
`recommendation_allowed: true` AND `type: decision`. They are FORBIDDEN otherwise. See the Pattern
Catalog table above for the per-pattern default.

## Queue Schema

Canonical location. `SKILL.md`, the protocol files, and `devil-advocate/agent.md` CITE this
section — they do not copy it. `devil-advocate/agent.md` MUST read this section (it has the Read
tool) before emitting a queue. If any other file's description of the schema diverges from what
follows, this section is authoritative.

```yaml
challenge_queue:
  target: "<what is being challenged>"
  generated_by: "devil-advocate | protocol:anchor | protocol:verify | protocol:framing | protocol:forward"
  cap: 5
  items:
    - id: A1                 # family prefix: A=anchor V=verify F=framing, + index
      family: anchor|verify|framing
      pattern: "Gatekeeper"  # exact name from the catalog
      type: fact|decision
      observation: "what, specifically, triggered this item"
      reasoning: "which bias/error this reveals"
      confidence: high|medium|low
      impact: high|medium|low
      rank: 1                # 1 = highest. sort = impact x uncertainty
      recommendation_allowed: true|false   # always false if type:fact
      recommended_answer: "..."   # required iff recommendation_allowed:true AND type:decision
      recommendation_rationale: "<=1 line"   # required iff recommendation_allowed:true AND type:decision; forbidden otherwise
      cost_if_wrong: "<=1 line"
      resolution_action: "..."    # required iff type:fact — how the interviewer resolves it ALONE
      blocks: [A4, A7]            # ids pruned if this item resolves per the recommendation
  not_walked: []             # ids beyond the cap — LISTED, never silently truncated
  verdict_candidate: "..."            # optionnel — proposition de l'agent, PAS une conclusion imposee
  strongest_counter_candidate: "..."  # optionnel — idem
```

These two fields are candidates only; the final verdict remains a disposition of the interviewer and
the human.

## Interactive Delivery

Canonical location. `SKILL.md` and the four protocol files CITE this section — they do not copy
it.

1. Resolve ALL `type: fact` items alone first (Read/Glob/Grep). NEVER ask the human about them. A
   fact that cannot be resolved from the environment converts to `type: decision` with
   `recommendation_allowed: true` ("I can't verify X — do we assume it or cut it?").
2. Sort `type: decision` items by `rank`.
3. Cap N=5 by default. The rest goes into `not_walked` and is listed explicitly at the end.
4. ONE question per turn. Never a batch. Wait for the reply.
5. Question format, <=5 lines:
   ```
   Q<i>/<n> · <Pattern> — confidence <high|medium|low>
   <observation, 1 line>
   <the question>
   My recommendation: <answer> — <rationale>          # omitted if recommendation_allowed:false
   Cost if wrong: <1 line>
   -> "ok" · your correction · "skip" · "batch the rest" · "stop"
   ```
6. After each reply: mark resolved, prune the ids listed in `blocks`, move to the next item.
7. HARD GATE: no write, no action, until the queue is exhausted or the human says "stop".
8. End: emit the Challenge Report = queue + resolution of each item. IN THE MESSAGE, not a file.

## When-To-Use Guide

| Symptom | Error Type | Subcommand |
|---------|-----------|-----------|
| Not sure which mode fits, or default entry point | n/a | `/challenge <description>` (default, routes) |
| AI picked one solution without exploring options | Anchoring bias | `/challenge anchor` |
| AI committed to approach too quickly | Premature commitment | `/challenge anchor` |
| Specific facts, numbers, or claims feel uncertain | Factual error | `/challenge verify` |
| AI cited something that can't be verified | Hallucination | `/challenge verify` |
| The answer is correct but might be solving the wrong problem | Framing error | `/challenge framing` |
| The question itself seems wrong | Wrong problem | `/challenge framing` |
| High-stakes decision, want genuine debiasing in fresh context | All error types | `/challenge deep` |
| Forward-looking intention, nothing built yet ("I'm about to...") | Pre-emptive anchoring | `/challenge forward` |
| Reversible, single file, ~10 min of work | n/a | no-op (router verdict, not directly invocable) |

## Challenge Report Format

All modes EXCEPT `route` produce this Challenge Report at the end of the walk. `route` has its own
output format (≤5 lines), defined in `protocols/route.md` — it never produces a Challenge Report.

```markdown
## Challenge Report: [Pattern(s) Applied]

**Target**: [what was challenged]
**Error type**: [anchoring | factual | framing | high-stakes]

### Technique Selection

- **Family**: [anchor (premature commitment) | verify (factual errors) | framing (wrong problem)]
- **Patterns applied**: [named patterns, e.g., Gatekeeper, Pre-mortem, CoVe]
- **Why these patterns**: [what about the target triggered this selection — specific observations]
- **Patterns considered but skipped**: [and why, or "none — full protocol applied"]

### Findings

[Pattern-specific structured output — see protocol files.
For each finding include: Observation → Technique (family + pattern) → Reasoning → Confidence]

### Verdict

- **Assessment**: [Decision holds / Needs revision / Needs rejection]
- **Confidence**: [High / Medium / Low]
- **What would flip this**: [specific evidence or condition that would change the verdict]
- **Strongest counter to this verdict**: [steelman the opposite conclusion]

### Recommended Action

[Proceed as-is | Proceed with modifications: X | Reconsider: Y]
```

## Sources

- Florian WP01 §4.5 — Gatekeeper, Proof Demand, Reset (practitioner patterns)
- White et al. 2023 — Vanderbilt Prompt Pattern Catalog (https://arxiv.org/abs/2302.11382)
- Dhuliawala et al. 2023 — Chain-of-Verification (CoVe), Meta AI (https://arxiv.org/abs/2309.11495)
- Wang et al. 2024 — Devil's Advocate, EMNLP (https://arxiv.org/abs/2405.16334)
- Chang 2023 — Socratic Method prompting (https://arxiv.org/abs/2303.08769)
- Klein 2007 — Pre-mortem analysis (Harvard Business Review)
- Matt Pocock — grill-me / grilling (https://github.com/mattpocock/skills) — forward interview
  protocol and recommended-answer pattern, source for the forward mode and the queue's
  `recommended_answer` / `recommendation_allowed` mechanism
