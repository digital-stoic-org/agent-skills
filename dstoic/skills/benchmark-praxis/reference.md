# Benchmark Praxis — Scoring Reference

## 4-Layer Taxonomy

Beliefs (4) → Principles (7) → Practices → Observables. Benchmarking lives at Observable layer only.

**Context paragraph** (include in every benchmark intro, not scored):
Praxis is grounded in 4 beliefs: AI and human sharpen each other (mutual augmentation), cognitive depth+breadth > automation speed, meta-cognition is personal discipline, prior knowledge must be re-examined not preserved. These beliefs drive 7 principles that generate practices. Observables measure the practices.

## Scoring System

| Score | Meaning |
|---|---|
| 🟢🟢🟢 | Clear lead (well ahead, mature) |
| 🟢🟢 | Ahead (functional advantage) |
| 🟢 | Slight edge |
| 🟡 | Parity or mixed |
| 🔴 | Behind or absent |
| ⬜ | N/A (dimension not relevant) |

## Set 1 — External Benchmarking (8 Observables)

Used by full and quick modes. Score both Praxis and the compared subject.

### 1. Cognitive ROI

**Measures**: Token allocation — what % to automation vs. assisted vs. amplified thinking?
**Comparable**: Token tier distribution across frameworks.
**Scoring**: 🟢🟢🟢 = 60%+ amplified | 🟡 = balanced | 🔴 = automation-heavy

### 2. Context Efficiency

**Measures**: Token waste reduction — session persistence, compression, filtering, documentation layering.
**Comparable**: Token budget per session, context reuse, noise filtering.
**Scoring**: 🟢🟢🟢 = <1500 tokens/session + reuse | 🟡 = ~2000 | 🔴 = unbounded

### 3. Compounding

**Measures**: Session-over-session improvement — learnings DB, retrospective coverage, pattern reuse.
**Comparable**: Does system feed learnings forward? Learning velocity.
**Scoring**: 🟢🟢🟢 = structured retrospect + learnings DB | 🟡 = basic logs | 🔴 = no feedback

### 4. Skill Coverage

**Measures**: Workflow phases automated/augmented — Frame/Think/Build/Debug/Learn. Sub-dim: boulder/pebble scale handling.
**Comparable**: Which phases have dedicated skills? Full lifecycle or partial?
**Scoring**: 🟢🟢🟢 = all 5 phases + scale sensitivity | 🟡 = 3-4 phases | 🔴 = 1-2 phases

### 5. Domain Breadth

**Measures**: Universal to personal spectrum — domain-agnostic → tech-agnostic → stack-specific → personal. Count skills per tier.
**Comparable**: How many domains can the framework serve?
**Scoring**: 🟢🟢🟢 = all 4 tiers | 🟡 = 2-3 tiers | 🔴 = single tier

### 6. Human-AI Governance

**Measures**: Autonomy spectrum (5 levels) + execution model + learning loop closure.
**Comparable**: What autonomy levels available? Gate strength? Who closes learning loops?
**Scoring**: 🟢🟢🟢 = all 5 levels + hard gates + human learning closure | 🟡 = 3 levels + soft gates | 🔴 = 1 level + no gates

**Sub-dimensions** (score each separately):

| Sub-dim | What to evaluate |
|---|---|
| Autonomy spectrum | human-drives, mutual sharpening, gated, supervised, fire-and-forget? |
| Gate strength | hard (deny-first) vs advisory (warn-first) vs none |
| Learning autonomy | who closes feedback loops — human, hybrid, fully autonomous? |

### 7. Safety & Containment

**Measures**: Permission architecture + blast radius controls + secret exfiltration prevention.
**Comparable**: What prevents irreversible or high-damage actions?
**Scoring**: 🟢🟢🟢 = multi-layer (deny lists, hooks, sandboxing) | 🟡 = single layer | 🔴 = none/advisory only

### 8. Adaptability

**Measures**: Fork-ability + customization depth + configuration scope. Toothbrush principle.
**Comparable**: How easy to modify for personal use?
**Scoring**: 🟢🟢🟢 = modular, swap frameworks, deep customization | 🟡 = basic config | 🔴 = rigid

## Set 2 — Self-Assessment (4 Aspirational Dimensions)

Used by gap mode. Measures distance to holy grail. Most external frameworks score 🔴 or ⬜ — expected.

### 1. Frontier Autonomy

**Measures**: How far toward full agentic loops? Scheduling, self-healing, autonomous decisions.
**Current**: Mostly gated delegation. Some fire-and-forget (hooks, RTK). No autonomous scheduling or self-healing.
**Scoring**: 🟢🟢🟢 = autonomous scheduling + self-healing + adaptive decisions | 🟡 = supervised automation + some autonomous | 🔴 = human-triggered only

### 2. Meta-Cognitive Depth

**Measures**: Does the system think about its own thinking? Self-assessment, calibration, self-improvement.
**Current**: Retrospect suite exists but human-triggered. No autonomous self-assessment or calibration.
**Scoring**: 🟢🟢🟢 = autonomous self-assessment + calibration + self-improvement | 🟡 = human-triggered retrospect + manual calibration | 🔴 = no reflection

### 3. Epistemic Rigor

**Measures**: Knowledge quality — debiasing, falsifiability, source verification, knowledge decay detection.
**Current**: Devil's advocate + challenge exist. No knowledge decay detection or source verification.
**Scoring**: 🟢🟢🟢 = active debiasing + decay detection + source verification + falsifiability | 🟡 = debiasing only | 🔴 = no epistemic controls

### 4. Emergence Capacity

**Measures**: Outcomes greater than sum of parts — cross-session insights, unexpected connections, bridge captures.
**Current**: Bridge captures exist but manual. No autonomous cross-domain discovery.
**Scoring**: 🟢🟢🟢 = autonomous cross-domain insight discovery + serendipity engine | 🟡 = manual bridges + structured cross-pollination | 🔴 = siloed sessions

## Actions Template

Used by full mode (step 4). Produce YAML with applicable categories:

```yaml
actions:
  import:       # Adopt into Praxis immediately
    - item: "description"
      effort: low|medium|high
      target: "which skill/file/component"
  cherry_pick:  # Adapt the idea, not the implementation
    - item: "description"
      inspiration: "what specifically to study"
  watch:        # Monitor for maturity/relevance
    - item: "description"
      trigger: "when to re-evaluate"
  reject:       # Deliberately not adopting (with reason)
    - item: "description"
      reason: "why"
  security:     # Security-relevant findings
    - item: "description"
      status: implemented|gap|not-applicable
```

## Feature Ledger Schema (track mode)

Per-subject feature ledger lives at `$PRAXIS_DIR/thinking/benchmarks/features/{subject}.yaml`. Durable across runs.

```yaml
subject: claude-code
canonical_changelog: https://docs.claude.com/en/release-notes/claude-code
last_reviewed: 2026-04-13
features:
  - name: "Shell exec in skills (!command)"
    version_first_seen: "v2.1.40"
    description: "Inline shell that preprocesses skill content before LLM sees it"
    source: "https://docs.claude.com/..."
    status: cherry-pick     # adopt | cherry-pick | watch | reject | new | review
    why: "200-500 tokens saved per invocation, eliminates 1-2 tool round-trips"
    target: "/load-context, /gtd:focus, /save-context"
    last_status_change: 2026-04-09
  - name: "ultrathink keyword"
    version_first_seen: "v2.0.x"
    description: "Extended thinking for skill execution"
    source: "..."
    status: adopt
    why: "Better reasoning quality on /challenge, /investigate, /council"
    target: "6 reasoning skills"
    last_status_change: 2026-04-09
```

**Status semantics**:
- `new` — appeared in changelog, not yet triaged (human review needed)
- `review` — was watching, now changed — re-evaluate
- `adopt` — committed to import, awaiting implementation
- `cherry-pick` — adapt the idea, not the implementation
- `watch` — monitor for maturity / re-evaluate trigger
- `reject` — deliberately not adopting (record `why`)

**Append-only at entry level**: never delete entries. Status changes are normal; deletions lose history.

## Feature Triage Rubric (track mode step 1b)

For each new feature in the changelog, classify using these prompts:

| Question | If yes... |
|---|---|
| Does it replace an existing Praxis hack with a platform-native solution? | `adopt` |
| Does it unlock a capability Praxis can't currently do? | `adopt` or `cherry-pick` |
| Does it save tokens / reduce friction without changing capabilities? | `cherry-pick` (low effort) or `watch` (high effort) |
| Is it experimental / unstable / behind a flag? | `watch` with trigger = "GA" |
| Does it contradict a Praxis principle (e.g., never-auto-commit)? | `reject` with reason |
| Is it irrelevant to Praxis's domain (e.g., enterprise SSO, IDE integrations)? | `reject` with reason |
| Unclear value, needs human judgment? | `new` (flag for review) |

Default to `watch` when in doubt — cheaper to revisit later than to misclassify as `reject`.

## Investigation Artifact Template

```markdown
# Benchmark: {Name} vs Praxis

**Date:** {YYYY-MM-DD} | **Mode:** full|quick|gap|track | **Verdict:** adopt|cherry-pick|watch|reject|complement

## What It Is

{2-5 sentences}

## Comparison Table

| Dimension | Praxis | {Subject} | Notes |
|---|---|---|---|
| 1. Cognitive ROI | {score} | {score} | {note} |
| ... | | | |

## Verdict

{One paragraph}

## Actions

{YAML block from workflow step 4}

## Sources

- {URL or reference}
```
