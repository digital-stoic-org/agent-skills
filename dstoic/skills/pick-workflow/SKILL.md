---
name: pick-workflow
description: "Decide HOW work should EXECUTE — linear vs parallel fan-out, sub-agents vs teams vs dynamic Workflow, and the per-step seam — instead of defaulting to linear+single-model. Produces an execution design, does NOT run the task. Delegates the per-step model+effort call to a model-picker skill when the environment has one. Use when authoring/challenging a skill or agent, AND mid-task when deciding how to run real work — 'should I fan this out', 'should this fan out', 'parallel or linear', 'sub-agents or workflow', 'per-step seam', 'execution topology', 'execution architecture'. For a trivial few-item call, early-exit to linear cheaply rather than a full analysis."
argument-hint: "<skill|agent to design>"
allowed-tools: [Read, Glob, Grep, Skill]
model: opus
effort: high
context: main
user-invocable: true
---

# Pick Workflow

Authoring-time judge for a skill/agent's **execution topology**: how steps run (linear vs fan-out, which
mechanism, where the seam falls). Emits a design — never runs the task. Model+effort per step is a
*separate* call, delegated (Step 5). Own the topology decision here; don't re-derive the mechanism table
or the sharding rules anywhere else.

**When**: authoring or challenging a skill/agent · parallel-vs-linear · which delegation mechanism.

## Steps

### 1. Decompose — fill the table FIRST (it IS the analysis; no recommending before it exists)

| Step | Work shape | Parallelizable? | Judgment load | Token weight | Cross-item dep? |
|---|---|---|---|---|---|

- **Work shape** — read / classify / synthesize / transform / decide.
- **Parallelizable?** — units *independent*? (per-file yes; "synthesize the whole plan" no.)
- **Judgment load** — low (mechanical/schema-bound) → high (ordering, trade-offs, reversibility, intent).
- **Token weight** — where cost sits (usually the step that *reads everything*).
- **Cross-item dep?** — compares across units / needs the global graph? **Correctness gate: a cross-item step must NOT be sharded.** Two gates + worker rules in `reference.md`.

### 2. Cut the seam by global-context (NOT by folder/file)

Fan out **per-item, judgment-light, independent** work → workers return **structured facts only** (no
dispositions/severity/decisions). Keep **cross-item reasoning + dispositions + synthesis** on the
orchestrator. Canonical: `gather (fan-out) → reason → plan (orchestrator) → execute (fan-out independent ops)`.
If the execute fan-out **writes**, isolate each worker (`isolation: "worktree"`) or give it unique paths —
concurrent edits to one tree lose updates with no error.

### 3. Pick topology + mechanism

Front-door first (pattern catalog in `reference.md`): **routing** (distinct input *kinds* → branch before
fan-out) · **voting / evaluator-optimizer** (need confidence or refinement). Then:

| Choose | When | Gate |
|---|---|---|
| 🟢 **Linear** | below threshold; few units — the default | simplest |
| 🔵 **Sub-agents** (fresh ctx) | *fixed small* set (2–6) independent tasks; worker needs a **scoped brief**, not your history. **Name them**: messaging a finished worker by name replays its whole transcript, so refine loops live here | blind to each other → dedup/merge stays on the orchestrator · caps in `reference.md` |
| 🍴 **Fork** | one heavy sub-task needing your **full accumulated reasoning**, run isolated so its tool noise stays out of main | inherits parent bias → **never for verify/challenge** |
| 🧑‍🤝‍🧑 **Team** (named teammates + shared task list) | workers must **reason against each other**: debate, competing hypotheses, cross-worker dedup with no barrier | env-gated · token-heavy · 3–5 · no nesting · same-file edits collide |
| 🟣 **Workflow** | fan-out over a variable-size list; loop-until-dry, budget cap, schema extraction, journaled resume | **two barriers**: user opt-in AND stripped from every sub-agent → never a default; ship a linear fallback |

**Fresh vs fork:** fresh = cheaper and unbiased but you must brief it; fork = zero re-briefing, carries
every prior decision, heavier and biased. Default fresh; fork only when the brief would reproduce most of
the conversation.

**Cast, don't just spawn.** Enumerate the agent registry (`reference.md`) and pick a type before writing a
brief: read-only searcher for gather, fresh-context critic for challenge, full-toolset worker when it must
be resumable. Prefer an agent whose *definition* encodes the constraint over a generic worker plus prose.

Every worker needs a **delegation contract**: objective · output format (schema) · tool/source guidance ·
boundaries. State it in the brief **and enforce it in frontmatter** (`tools` / `disallowedTools` /
`maxTurns` / `permissionMode`) — structural beats recited.

### 4. Threshold, not unconditional fan-out

Fan-out has fixed cost (spawn latency, schema round-trips, orchestrator re-reads). Encode a threshold
switch from the target's *typical* (not worst-case) input — in Workflow, one `if (items < N)` line.

### 5. Model+effort per step → delegate

Do **not** re-derive a model table here. If the environment provides a model+effort judge skill, run it on
each step's shape and write its verdict into the design; otherwise decide inline and say so. (Typical:
synthesis→top tier, schema extraction→cheapest, careful transforms→mid — but the judge decides.)

## Output

1. **Step table** (filled). 2. **Design** — seam + mechanism + **cast** + **fg/bg** + threshold + per-step model. 3. **Trade-offs** — correctness risk avoided · conditionality · honest counter-argument for plain linear. 4. **Concrete change** — model/effort per step, spawns or pipeline/parallel, threshold, fallback.

Background workers get a **reduced toolset whatever `tools:` says** (list in `reference.md`), so state
fg/bg per step and check the tools your design needs survive it.

## Anti-patterns

- ❌ Sharding an exploration by file → cross-item checks see a slice (the #1 trap).
- ❌ Workers that judge — they extract facts; dispositions stay on the orchestrator.
- ❌ Linear+single-model unchecked *or* fan-out unchecked — both are defaults, not decisions.
- ❌ Cheap model on a *judgment* step → degraded ordering/dispositions. ❌ Re-deriving a model table.
- ❌ Fork for verify/challenge — it inherits parent reasoning, so it can't refute it; use a fresh agent.
- ❌ Fresh agent when the brief would restate the conversation — that's the fork's job; thin briefs = gaps.
- ❌ Escalating to Workflow for a refine loop or a debate — named-worker resume and teams cover both, opt-in-free.
- ❌ A skill that *requires* Workflow — always ship a linear fallback.
- ❌ Write fan-out without isolation — lost updates, silently.
- ❌ Depending on a tool stripped from background workers — it fails silently, not loudly.
- ❌ Three tiers (orchestrator→worker→sub-worker) — nesting is off by default; workers have no spawn tool.
- ❌ Always-on fan-out — only above threshold. ❌ Auto-running this on every edit — keep it prompt-invoked.
