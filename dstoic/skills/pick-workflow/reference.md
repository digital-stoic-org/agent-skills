# Pick Workflow — Extended Reference

Companion to SKILL.md. Distilled from `META-PROMPT-execution-architecture` (2026-06-26).

## Contents

- Why this exists · Pattern catalog (Anthropic) + economics + delegation contract
- Relationship to /pick-model · The two correctness gates
- Mechanism choice (sub-agents vs Workflow) · Thresholds · Caching/memoization
- Effort lever · Default decision order · Worked seed · Override

## Why this exists

Every new skill defaults to **linear + single model**. That is often wrong in *both* directions:
- it leaves token savings on the table (judgment-light steps run on an expensive model),
- and naive "parallelize everything" silently **breaks correctness** (cross-item checks lose global context).

This skill forces a deliberate per-step decision grounded in the *shape* of the work — not instinct.
It owns the **parallelism** axis; it delegates model+effort to `/pick-model` (single source of truth).

## Pattern catalog (Anthropic)

Source: [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) +
[Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system). Map the
target's shape onto one of these before picking a mechanism.

| Pattern | Use when | Maps to |
|---|---|---|
| **Prompt chaining** | task decomposes into *fixed sequential* subtasks | 🟢 linear single pass |
| **Routing** | distinct input *kinds* better handled separately | front-door branch (Step 3) |
| **Parallelization — sectioning** | independent subtasks, parallel for speed | 🔵/🟣 fan-out |
| **Parallelization — voting** | same task N× for confidence / diverse outputs | 🟣 adversarial-verify / judge panel |
| **Orchestrator-workers** | can't *predict* the subtasks (dynamic decomposition) | 🟣 Workflow (lead spawns workers) |
| **Evaluator-optimizer** | clear eval criteria + iterative refinement pays | 🟣 generate→critique→refine loop |
| **Autonomous agent** | open-ended, step count unpredictable | 🟣 Workflow loop-until-dry |

> Anthropic's first rule: *"add multi-step agentic systems only when simpler solutions fall short."*
> Start linear; make fan-out earn it.

### Token economics (hard numbers)

- Single agent ≈ **4× a chat's tokens**; multi-agent ≈ **15×**. Fan-out only pays when **task value is high
  AND work is heavily parallelizable / exceeds one context window**.
- **Explicit poor fit: most coding tasks, and anything needing shared context across agents** — the
  authoritative restatement of the cross-item correctness gate below.
- **Scaling rule** (size the fan-out to query complexity): simple fact-find → **1 agent**, 3–10 tool calls ·
  direct comparison → **2–4 subagents**, 10–15 calls each · complex → **10+ subagents**, clearly divided.
- Failure modes to avoid: **"50 subagents for a simple query"**, endless searching, agents distracting each
  other with updates, duplication/gaps from vague delegation.

### Delegation contract (every worker)

Anthropic's hard rule — each delegated worker needs **objective · output format · tool/source guidance ·
explicit boundaries**. Miss any and workers misinterpret, duplicate, or leave gaps (their example: three
subagents independently re-researching the same supply chain). "structured facts only" covers *output
format*; state the other three in the worker prompt.

## Relationship to /pick-model

```
/pick-workflow   authoring-time · topology + seam across steps · this skill
   └─ /pick-model   per step · model + effort · the roster, tiers, switch-vs-cache cost
```

- `/pick-model` answers "which model for THIS step". `/pick-workflow` answers "how many steps, which
  run in parallel, by what mechanism, and where's the seam".
- Do **not** copy pick-model's tier/routing table here — it drifts. Call the skill per step instead.
  (Same composition `meta-prompt` uses at RAIL boundaries.)

## The two correctness gates

1. **Cross-item dependency** — a step that compares across units or needs the global graph must NOT be
   sharded. Shard it and each worker sees a slice → comparisons, dedup, ordering, whole-graph checks fail.
2. **Cross-worker blindness** — even when sharding IS valid, workers can't see each other's findings.
   Anything needing **dedup/merge across workers** (the multi-modal-sweep blind-spot problem) must surface
   at the orchestrator, which holds all worker outputs at once. Don't let a worker decide "is this a dup".

Workers extract **structured facts only** (detected attributes, presence/absence, raw values, link targets).
**No dispositions, no severity, no decisions** — those live on the orchestrator with full context.

## Mechanism choice — sub-agents vs dynamic Workflow

|  | **Sub-agents** (`Agent` / `parallel`) | **Dynamic Workflow** (`Workflow`) |
|---|---|---|
| Control flow | model-driven (you decide each spawn) | **deterministic** JS — loops, conditionals, fan-out |
| Sweet spot | a *few* (2–6) independent ad-hoc tasks | fan-out **over a list**, esp. variable-size; repeated/structured |
| Structured output | manual | native `schema:` → validated objects, model retries on mismatch |
| Threshold switch | hand-coded each time | native `if (items < N) linear else pipeline()` |
| Per-step model | `model:` per Agent | `model:` / `effort:` per `agent()` call |
| Loop-until-dry / count | manual | natural (`while`) |
| Cost ceiling | none | `budget.total` hard cap, `budget.remaining()` |
| Resume | no | journaled; cache-hit on unchanged prefix |
| Overhead | lower for 1–3 tasks | higher fixed cost; earns it at scale |
| **Availability** | always | **explicit user opt-in required** (ultracode / "use a workflow") |

**Decision rule:**
- Below threshold → **linear**.
- Fixed small independent set, no loop → **sub-agents** (`parallel`).
- Fan-out over a (variable-size) list, OR you need loop-until-dry / budget cap / schema extraction /
  adversarial-verify / resume → **Workflow**.
- **Gate:** Workflow can't be a skill's default — it needs the user to opt in. So a skill's *baked-in*
  design is linear-or-sub-agents; Workflow is an **escalation the user triggers**. Always ship a linear
  fallback for the non-opted-in path.

### Seam → Workflow primitive mapping

- Canonical `gather → reason` cut **is** `pipeline()` — per-item extraction stages feeding orchestrator synthesis.
- "structured facts only" **is** the `schema:` option (validated extraction).
- Step 4's threshold **is** `if (items.length < N) { /* linear */ } else { pipeline(...) }`.
- Cross-worker dedup **is** a barrier (`parallel()` then dedup in plain code) — the one place a barrier beats a pipeline.

## The third lever: effort, not just model

`/pick-model` owns two levers — **model** AND **effort**. When delegating per step, don't only ask "which
model"; effort matters too: a Haiku extractor needs none, an Opus synthesis step may want `xhigh`. Effort
survives cache (cheap to change), so it's the first thing to tune on a step that's slightly off. Let
`/pick-model` set both.

## Thresholds are provisional

Threshold values (e.g. the worked seed's ~40 docs) are *estimates*, not measurements. Revisit against
real token data (`rtk gain`) before freezing. Pick from *typical* input, not worst case — don't pay
orchestration overhead on a 12-file folder because one run someday hits 400.

## Caching / memoization — don't build it, design for it

Do **not** hand-roll a cache or memoization layer. The `Workflow` tool already journals every `agent()`
call and resumes on cache-hit for the unchanged prefix (same script + args → 100% hit) — Anthropic's
research system confirms the pattern (lead agent persists its plan, resumes from failure rather than
restarting). So:

- If a designed skill re-processes the same inputs across runs (an idempotent extraction stage), prefer a
  **resumable Workflow** over a custom cache — you get journaled cache-hits for free.
- Only **memoize a specific step** when token data shows it is **hot, repeated, AND deterministic**. Absent
  that evidence, a bespoke cache is fixed cost (keys, invalidation, staleness) with no measured win — the
  exact over-engineering this skill warns against.
- This skill itself produces a *design* and exits; it processes no repeated data, so nothing here is worth
  memoizing. Caching, if ever, belongs in the skills it designs.

## Default decision order (simplest first)

1. **Linear + single model** — most skills. Stop here unless the table shows heavy per-item token weight
   on independent units.
2. **Orchestrator + sub-agents** (2 tiers) — fixed small fan-out.
3. **Workflow pipeline** (full) — variable-size fan-out / loop / budget / verify, AND user opted in.

State which you chose and why. Bias toward (1); make (2)/(3) earn the wiring.

## Worked seed — project-sweep (2026-06-26)

The analysis this skill was distilled from:

- **Phase 0 Resolve** → orchestrator, sequential, judgment (role-map is a call). Tiny tokens.
- **Phase 1 Audit** → heavy tokens, per-file parallelizable, **BUT §2/§4/§5 are cross-file.**
  Cut: 1a signal-extraction (Haiku, fan-out, structured facts) → 1b cross-file reasoning + dispositions (Opus).
- **Phase 2 Plan** → orchestrator, not parallelizable, high judgment.
- **Phase 3 Execute** → independent edits fan-out (Sonnet); moves on orchestrator (git-gated).
- **Threshold**: < ~40 docs → linear single pass; ≥ ~40 → fan-out 1a.
- **Mechanism**: large-sweep branch is a textbook `pipeline()` (per-file extract → orchestrator reason) —
  but Workflow-gated, so the default path stays linear; user opts into the sweep.
- **Counter-argument**: most projects are small (~30 files) → linear is often the right call; fan-out earns
  its keep only on large sweeps. Don't pay orchestration overhead on a 12-file folder.

## Override

Always respect explicit user choices on topology/model/effort. This skill advises an execution design;
it never executes the task being designed.
