---
name: pick-workflow
description: "Decide HOW work should EXECUTE — linear vs parallel fan-out, sub-agents vs dynamic Workflow, and the per-step seam — instead of defaulting to linear+single-model. Produces an execution design, does NOT run the task. Delegates the per-step model+effort call to /pick-model. Use when authoring/challenging a skill or agent, AND mid-task when deciding how to run real work — 'should I fan this out', 'should this fan out', 'parallel or linear', 'sub-agents or workflow', 'per-step seam', 'execution topology', 'execution architecture'. For a trivial few-item call, early-exit to linear cheaply rather than a full analysis."
argument-hint: "<skill|agent to design>"
allowed-tools: [Read, Glob, Grep, AskUserQuestion, Skill]
model: opus
effort: high
context: main
user-invocable: true
---

# Pick Workflow

Authoring-time judge for a skill/agent's **execution topology**. Sibling to `/pick-model`: it picks the
model+effort for *one step*; this picks **how steps run** (linear vs fan-out, sub-agents vs Workflow, the
seam) and **calls `/pick-model` per step** for the model. Emits a design — never runs the task.

> **CLAUDE.md contract**: this skill is the single source of truth for the execution-topology call
> (linear vs fan-out, fresh sub-agent vs fork vs Workflow, the seam). CLAUDE.md "Execution defaults"
> carries no sub-agent rules — it defers here by capability (auto-discovery on the description). Don't
> re-derive the mechanism table or sharding rules elsewhere; if topology guidance changes, it changes here.

**When**: authoring or challenging a skill/agent · deciding parallel-vs-linear · sub-agents-vs-Workflow.

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

### 3. Pick topology + mechanism

Front-door first (Anthropic catalog in `reference.md`): **routing** (distinct input *kinds* → branch before fan-out) · **voting / evaluator-optimizer** (need confidence/refinement → run-N-vote or generate→critique→refine). Then:

| Choose | When | Gate |
|---|---|---|
| 🟢 **Linear** | Below threshold; few units — the default | simplest |
| 🔵 **Sub-agents** (`parallel`, fresh ctx) | *fixed small* set (2–6) independent tasks, no loop; worker needs only a **scoped brief**, not your history | no resume/budget |
| 🍴 **Fork** (`subagent_type: "fork"`) | one heavy sub-task that needs your **full accumulated context/reasoning** but should run **isolated** so its tool-output noise stays out of main | inherits parent reasoning → **never for verify/challenge/adversarial steps** (bias); use fresh sub-agent there |
| 🟣 **Workflow** | fan-out over a (variable-size) list; need loop-until-dry, threshold switch, budget cap, schema extraction, verify/voting, resume | **opt-in only → never a skill's default; ship a linear fallback** |

**Fresh vs fork — the context seam:** fresh sub-agent = cheaper, unbiased, but you must brief it (duplication risk if the brief is thin); fork = zero re-briefing, carries every prior decision, but inherits bias and is heavier. Default fresh; fork only when the brief would have to reproduce most of the conversation.

Every worker needs a **delegation contract**: objective · output format (schema) · tool/source guidance · boundaries — else duplication/gaps.

### 4. Threshold, not unconditional fan-out

Fan-out has fixed cost (spawn latency, schema round-trips, orchestrator re-reads). Encode a threshold
switch from the target's *typical* (not worst-case) input. In Workflow: one `if (items < N)` line.

### 5. Model+effort per step → call `/pick-model`

Do **not** re-derive a model table. Run `/pick-model` on each step's shape; write its verdict into the
design. (Typical: synthesis→Opus, schema extraction→Haiku, careful transforms→Sonnet — but it decides.)

## Output

1. **Step table** (filled). 2. **Design** — seam + mechanism + threshold + per-step model. 3. **Trade-offs** — correctness risk avoided · conditionality · honest counter-argument for plain linear. 4. **Concrete change** — `model:`/`effort:` per phase/`agent()`, spawns or `pipeline()`/`parallel()`, threshold, fallback.

## Anti-patterns

- ❌ "Parallel sub-agents for exploration" → shard by file → cross-item checks see a slice (the #1 trap).
- ❌ "Cheap model for subtasks" on a *judgment* step → degraded dispositions/ordering.
- ❌ Default linear+single-model unchecked — wastes tokens AND risks naive over-parallelizing.
- ❌ Workers that judge — they extract facts; dispositions stay on the orchestrator.
- ❌ A skill that *requires* Workflow — it's opt-in-gated; always ship a linear fallback.
- ❌ Re-deriving a model table — `/pick-model`'s job. ❌ Always-on fan-out — only above threshold.
- ❌ Fork for a verify/challenge/adversarial step — it inherits parent reasoning, so it can't independently refute it; use a fresh sub-agent for a clean-context check.
- ❌ Fresh sub-agent when the brief would have to restate most of the conversation — that's the fork's job; thin briefs cause gaps.
- ❌ Auto-running this on every SKILL.md edit — it's Opus-shaped; keep it prompt-invoked.
