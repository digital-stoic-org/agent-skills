---
name: challenge
description: "Challenge, push back, play devil's advocate on AI output or intentions. Use when: challenge this, are you sure, push back, prove it, what if you're wrong, devil's advocate, stress test, poke holes, second opinion, sanity check, too confident, really?, question this decision, avant de commencer, je veux faire X, aide-moi à décider. Modes: route (default — any invocation whose first word isn't a recognized subcommand, including a free-text description), forward (before starting), anchor (committed too fast), verify (facts wrong?), framing (wrong problem?), deep (full devil's advocate in fresh context)."
allowed-tools: [Read, Glob, Grep, Agent]
model: opus
context: main
argument-hint: "[route|forward|anchor|verify|framing|deep] <target>"
user-invocable: true
cynefin-domain: complicated
cynefin-verb: analyze
---

# Challenge

Apply structured provocation patterns to force reconsideration of current work or upcoming intentions.

**Target:** **$ARGUMENTS**

## Critical constraint

The interviewer (this skill, running in the main conversation) DELIVERS the queue. It NEVER
regenerates findings in the main context. Regenerating brings anchoring back through the side
door and destroys the benefit of the fresh-context generator. All finding generation happens in
`deep`'s sub-agent or, for `forward`/`anchor`/`verify`/`framing`, in the protocol execution itself
— never re-derived afterward from parent-conversation reasoning.

## Dispatch

Parse first word of $ARGUMENTS as subcommand. No recognized subcommand → `route`.

| Subcommand | Generator | Delivery | Protocol |
|---|---|---|---|
| `route` (default) | none | ≤5 lines, 0 sub-agent | Read `protocols/route.md` → execute |
| `forward` | main context, 5 patterns | interactive walk | Read `protocols/forward.md` → execute |
| `anchor` | main context, 4 patterns | interactive walk | Read `protocols/anchor.md` → execute |
| `verify` | main context, 3 patterns | interactive walk | Read `protocols/verify.md` → execute |
| `framing` | main context, 2 patterns | interactive walk | Read `protocols/framing.md` → execute |
| `deep` | fresh sub-agent, 9 patterns | interactive walk, top-N | see below |
| `deep --report` | fresh sub-agent, 9 patterns | batch report (legacy escape hatch) | see below |

`/challenge <free-text description>` with no matching subcommand keyword is `route`, not an error
and not a menu — `route` is the default entry point.

## Deep Subcommand

Spawn ONE sub-agent via the Agent tool:
- subagent_type: `dstoic:devil-advocate:devil-advocate`
- prompt: target description + relevant file paths to read
- The agent executes all 9 patterns IN SEQUENCE (anchor: Gatekeeper, Reset, Alternative
  Approaches, Pre-mortem · verify: Proof Demand, CoVe, Fact Check List · framing: Socratic,
  Steelman) inside its own fresh context — not 9 parallel agents, one agent running 9 steps.
- It returns a structured queue (`reference.md` §Queue Schema), not a batch report.
- DO NOT pass parent conversation reasoning into the prompt — fresh context, uncontaminated by
  the anchoring already present in the main conversation, is the entire point.

`deep` (no flag): walk the returned queue per `reference.md` §Interactive Delivery.
`deep --report`: skip the walk, emit the queue as a batch Challenge Report instead — legacy
fire-and-forget escape hatch for callers who cannot sustain a turn-by-turn exchange.

## Thinking Transparency (applies to all subcommands)

For every item, make reasoning explicit:

1. **Observation**: What specifically in the target triggered this item
2. **Technique**: Named pattern (e.g., Gatekeeper, CoVe, Steelman) and family
   (anchor/verify/framing) — cite mechanism from `reference.md` pattern catalog
3. **Reasoning**: Why this observation matters — what cognitive bias or error it reveals
4. **Confidence**: High/Medium/Low, and what evidence supports that rating

## Output

Delivery mechanics (fact-resolution order, ranking, cap, one-question-per-turn format, gate,
final report) are canonical in `reference.md` §Interactive Delivery. Queue shape is canonical in
`reference.md` §Queue Schema. Pattern catalog and Challenge Report format also live in
`reference.md`. All subcommands cite these, none redefine them.
