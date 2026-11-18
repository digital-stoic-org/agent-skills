# Pick Workflow — Extended Reference

Companion to SKILL.md. Distilled from `META-PROMPT-execution-architecture` (2026-06-26).

## Contents

- Why this exists · Pattern catalog (Anthropic) + economics + **hard caps & depth** + delegation contract
- **Casting** (which registry agent) · Relationship to a model+effort judge · The two correctness gates
- Mechanism choice (sub-agents vs **teams** vs Workflow) · **fg/bg** · **parallel writes / worktree**
- **Workflow fine print** · Thresholds · Caching/memoization
- Effort lever · Default decision order · Worked seed · Override

## Why this exists

Every new skill defaults to **linear + single model**. That is often wrong in *both* directions:
- it leaves token savings on the table (judgment-light steps run on an expensive model),
- and naive "parallelize everything" silently **breaks correctness** (cross-item checks lose global context).

This skill forces a deliberate per-step decision grounded in the *shape* of the work — not instinct.
It owns the **parallelism** axis; it delegates model+effort to a separate judge (single source of truth).

## Pattern catalog (Anthropic)

Source: [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) +
[Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system). Map the
target's shape onto one of these before picking a mechanism.

| Pattern | Use when | Maps to |
|---|---|---|
| **Prompt chaining** | task decomposes into *fixed sequential* subtasks | 🟢 linear single pass |
| **Routing** | distinct input *kinds* better handled separately | front-door branch (Step 3) |
| **Parallelization — sectioning** | independent subtasks, parallel for speed | 🔵/🟣 fan-out |
| **Parallelization — voting** | same task N× for confidence / diverse outputs | 🧑‍🤝‍🧑 team debate (no opt-in) · 🟣 judge panel at scale |
| **Orchestrator-workers** | can't *predict* the subtasks (dynamic decomposition) | 🟣 Workflow (lead spawns workers) |
| **Evaluator-optimizer** | clear eval criteria + iterative refinement pays | 🔵 named worker re-driven by `SendMessage` · 🟣 at scale |
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

### Hard caps & depth — the scaling rule doesn't survive contact alone

Anthropic's "complex → 10+ subagents" is an *upper shape*, not a budget. Real ceilings:

- **Sub-agents**: ~20 concurrent · ~200 per session. **Workflow**: 16 concurrent · 1000 agents per run,
  and its `agent()` calls don't draw on the session sub-agent budget.
- **Nesting is OFF unless `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` is set** — workers have no `Agent` tool.
  Any orchestrator → worker → sub-worker design fails at run time. Design two tiers, never three.
- **Teams**: 3–5 teammates is the working range; no nested teams; two teammates editing one file collide.
- Verify the env before designing at the edge: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`,
  `CLAUDE_CODE_FORK_SUBAGENT`, `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` in `~/.claude/settings.json`.

### Delegation contract (every worker)

Anthropic's hard rule — each delegated worker needs **objective · output format · tool/source guidance ·
explicit boundaries**. Miss any and workers misinterpret, duplicate, or leave gaps (their example: three
subagents independently re-researching the same supply chain). "structured facts only" covers *output
format*; state the other three in the worker prompt.

**Enforce it, don't just recite it.** A prompt asks; frontmatter compels. `tools` / `disallowedTools` make
"boundaries" structural (a read-only worker *cannot* write), `maxTurns` caps endless searching,
`permissionMode` and `skills:` fix the worker's operating envelope, `model` / `effort` carry the
model+effort verdict. Prefer an existing registry agent whose definition already encodes the contract
over a generic worker plus three paragraphs of prose.

## Casting — which agent, not just which mechanism

Mechanism (how many branches) and cast (who runs each) are orthogonal. Pick the cast first; the brief
shrinks to whatever the definition doesn't already guarantee.

| `subagent_type` | Fits | Watch out |
|---|---|---|
| `Explore` | the **gather** step — read-only by definition, depth tunable ("quick" / "medium" / "very thorough") | skips CLAUDE.md + git status · one-shot, not resumable |
| `Plan` | the **plan** step when you want it off the main thread | same: skips CLAUDE.md, one-shot |
| `general-purpose` | anything needing a **resumable** worker (full toolset) | no built-in discipline — the brief carries everything |

Beyond the built-ins, the installed registry varies per machine — **enumerate it, don't assume it**. What
to look for, by step shape:

| Step shape | Cast for | Reject a candidate that |
|---|---|---|
| gather / survey | read-only tools, tunable depth | can write |
| challenge / verify | **fresh context by construction**, no inheritance from the caller | forks or inherits the parent's reasoning |
| refine loop | resumable (returns an addressable id) | is one-shot |
| execute / edit | scoped write access + `isolation` if parallel | shares the tree with a sibling writer |

Enumerate with `Glob` on `.claude/agents/*.md`, `~/.claude/agents/*.md`,
`~/.claude/plugins/cache/*/*/agents/*.md`, then `Read` the frontmatter. Anchor those globs — a bare
leading `**/` walks `.git` and `node_modules`. The built-ins above live on no disk; they're listed here
because nothing else surfaces them. Scope precedence: managed settings > `--agents` CLI > project
`.claude/agents/` > `~/.claude/agents/` > plugin `agents/`.

## Relationship to a model+effort judge

```
this skill        authoring-time · topology + seam across steps
   └─ model judge   per step · model + effort · the roster, tiers, switch-vs-cache cost
```

- The model judge answers "which model for THIS step". This skill answers "how many steps, which run in
  parallel, by what mechanism, and where's the seam". Two axes, two owners.
- Do **not** copy a tier/routing table here — it drifts with every model release. Call the judge per step.
  If the environment has no such skill, decide inline and **say so in the design**, so the assumption is
  visible instead of silent.

## The two correctness gates

1. **Cross-item dependency** — a step that compares across units or needs the global graph must NOT be
   sharded. Shard it and each worker sees a slice → comparisons, dedup, ordering, whole-graph checks fail.
2. **Cross-worker blindness** — even when sharding IS valid, workers can't see each other's findings.
   Anything needing **dedup/merge across workers** (the multi-modal-sweep blind-spot problem) must surface
   at the orchestrator, which holds all worker outputs at once. Don't let a worker decide "is this a dup".
   **Exception — teams.** Named teammates message each other and share a task list, so cross-worker
   reasoning happens *between* workers instead of at a barrier. That's the whole point of a team, and the
   reason an adversarial debate doesn't need Workflow-voting. It also costs: gate #1 still holds (a
   cross-item *correctness* step stays unsharded), and a team that edits files needs owner-unique paths.

Workers extract **structured facts only** (detected attributes, presence/absence, raw values, link targets).
**No dispositions, no severity, no decisions** — those live on the orchestrator with full context.

## Mechanism choice — sub-agents vs teams vs dynamic Workflow

|  | **Sub-agents** (`Agent`) | **Teams** (named teammates) | **Dynamic Workflow** (`Workflow`) |
|---|---|---|---|
| Control flow | model-driven (you decide each spawn) | peer-to-peer messaging + shared task list | **deterministic** JS — loops, conditionals, fan-out |
| Sweet spot | a *few* (2–6) independent ad-hoc tasks | debate, competing hypotheses, multi-lens review | fan-out **over a list**, esp. variable-size; repeated/structured |
| Cross-worker visibility | none — merge at the orchestrator | **yes** — that's the point | none — merge in plain code at a barrier |
| Structured output | manual | manual | native `schema:` → validated objects, model retries on mismatch |
| Threshold switch | hand-coded each time | n/a | native `if (items < N) linear else pipeline()` |
| Per-step model | `model:` per Agent | per teammate definition | `model:` / `effort:` per `agent()` call |
| Loop-until-dry / count | manual | manual | natural (`while`) |
| Cost ceiling | none | none — tokens ≫ sub-agents | `budget.total` hard cap, `budget.remaining()` |
| Resume | **yes** — `SendMessage` to a finished worker's name replays its full transcript (not `Explore`/`Plan`) | live while the team runs; no `/resume` after | journaled; cache-hit on unchanged prefix, **same session only** |
| Overhead | lower for 1–3 tasks | high; 3–5 teammates is the range | higher fixed cost; earns it at scale |
| **Availability** | always | env-gated (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`), experimental | **user opt-in** AND **stripped from every sub-agent** |

**On resume — the correction that moves designs.** A finished sub-agent is not dead: address it by name
with `SendMessage` and it wakes with its whole transcript (tool calls, results, reasoning) intact, in
background, no re-brief. So generate→critique→refine, "go deeper on finding #3", and follow-up
interrogation all fit **inside 🔵 sub-agents** — they are not reasons to escalate to Workflow. Caveats:
`Explore` and `Plan` are one-shot and return no addressable id; a newer agent taking the same name wins;
resume doesn't re-check the concurrency cap.

**Decision rule:**
- Below threshold → **linear**.
- Fixed small independent set → **sub-agents** — named, and cast from the registry.
- Need to re-drive a worker (refine loop, follow-up) → **same sub-agents + `SendMessage` resume**.
- Need one heavy step carrying your full reasoning, isolated → **fork** (never for verify/challenge).
- Workers must reason *against each other* (debate, dedup between workers) → **team**.
- Variable-size list fan-out, OR loop-until-dry / budget cap / schema extraction / journaled resume →
  **Workflow**.
- **Gate:** Workflow can't be a skill's default — two barriers, not one. The user must opt in, *and* the
  tool is removed from every sub-agent, so a delegated step or a `context: fork` skill can't reach it at
  all. A skill's *baked-in* design is linear / sub-agents / team; Workflow is an **escalation the user
  triggers**. Always ship a linear fallback.

### Foreground vs background — a seam the design must state

Background workers let the orchestrator keep going; foreground blocks it but surfaces permission prompts.
With `CLAUDE_CODE_FORK_SUBAGENT=1` **every** sub-agent runs in background, fork or not, and
`run_in_background` disappears from the `Agent` tool. This is not cosmetic:

- A background worker gets a **reduced toolset regardless of its `tools:` frontmatter** — roughly `Read`,
  `Grep`, `Glob`, `Bash`, `Edit`, `Write`, `NotebookEdit`, `WebFetch`, `WebSearch`, `TodoWrite`, `Skill`,
  `ToolSearch`, `EnterWorktree`/`ExitWorktree`, `Monitor`, `TaskStop`, `SendMessage`, `Artifact`, plus MCP.
  Everything else (`Agent`, `Workflow`, `AskUserQuestion`, `TaskOutput`, `ExitPlanMode`, …) is stripped
  **silently** as long as one tool survives. A design that leans on a stripped tool fails without an error.
- The orchestrator must **wait for the completion notification and re-read from disk** — blocking on spawn
  metadata looks like "the workers did nothing". Verify claims against artifacts, not against the report.

### Parallel writes — `isolation: "worktree"`

When the execute fan-out edits files, two workers on one tree produce silent lost updates (`Edit` is
fail-safe, not clobber-safe; a stale `Write` clobbers outright). `isolation: "worktree"` — available both
as an `Agent` parameter and in agent frontmatter — gives each worker a throwaway git worktree branched
off the default branch, auto-removed if untouched. Costs a checkout per worker and leaves the merge to the
orchestrator. The cheaper alternative when the fan-out is small: **owner-unique paths**, one file one
writer. Never disjoint edits to a shared file by convention alone.

### Seam → Workflow primitive mapping

- Canonical `gather → reason` cut **is** `pipeline()` — per-item extraction stages feeding orchestrator synthesis.
- "structured facts only" **is** the `schema:` option (validated extraction).
- Step 4's threshold **is** `if (items.length < N) { /* linear */ } else { pipeline(...) }`.
- Cross-worker dedup **is** a barrier (`parallel()` then dedup in plain code) — the one place a barrier beats a pipeline.

### Workflow — the fine print that changes designs

- **Availability**: on paid plans (Pro needs it enabled in `/config`). Triggered by a **human-typed**
  `ultracode`, `/effort ultracode`, or "use a workflow" in natural language — never from `-p`, an unstamped
  SDK call, a scheduled run, or a webhook. Never assume it in a skill's default path.
- **Caps**: 16 concurrent agents, 1000 per run, ≤4096 items per `parallel()`/`pipeline()` call.
- **The script is not an agent**: no filesystem or shell access from the script body, and no mid-run human
  input. Only the spawned agents touch the world.
- **Permissions**: workflow agents run in `acceptEdits` whatever the session's permission mode, on the
  session model unless routed explicitly or via `CLAUDE_CODE_SUBAGENT_MODEL`.
- **Resume is same-session only**: quit Claude Code and a resumed run starts over. An agent interrupted
  mid-flight isn't journaled either — a concrete argument for many small `agent()` calls over one long one.

## The third lever: effort, not just model

The model judge owns two levers — **model** AND **effort**. When delegating per step, don't only ask "which
model"; effort matters too: a cheap extractor needs none, a top-tier synthesis step may want the highest
setting. Effort survives cache (cheap to change), so it's the first thing to tune on a step that's slightly
off. Let the judge set both.

## Thresholds are provisional

Threshold values (e.g. the worked seed's ~40 docs) are *estimates*, not measurements. Revisit against
real token-usage data before freezing. Pick from *typical* input, not worst case — don't pay
orchestration overhead on a 12-file folder because one run someday hits 400.

## Caching / memoization — don't build it, design for it

Do **not** hand-roll a cache or memoization layer. The `Workflow` tool already journals every `agent()`
call and resumes on cache-hit for the unchanged prefix (same script + args → 100% hit) — Anthropic's
research system confirms the pattern (lead agent persists its plan, resumes from failure rather than
restarting). So:

- If a designed skill re-processes the same inputs **within a session** (an idempotent extraction stage),
  prefer a **resumable Workflow** over a custom cache — you get journaled cache-hits for free. Across
  sessions the journal is gone, so "resumable" is not a persistence story.
- Only **memoize a specific step** when token data shows it is **hot, repeated, AND deterministic**. Absent
  that evidence, a bespoke cache is fixed cost (keys, invalidation, staleness) with no measured win — the
  exact over-engineering this skill warns against.
- This skill itself produces a *design* and exits; it processes no repeated data, so nothing here is worth
  memoizing. Caching, if ever, belongs in the skills it designs.

## Default decision order (simplest first)

1. **Linear + single model** — most skills. Stop here unless the table shows heavy per-item token weight
   on independent units.
2. **Orchestrator + cast sub-agents** (2 tiers) — fixed small fan-out, each worker typed from the registry.
3. **Same, re-driven** — `SendMessage` resume for refine loops; fork for the one step needing your full
   context. Still no opt-in, still 2 tiers.
4. **Team** — only when workers must reason against each other. Env-gated, token-heavy.
5. **Workflow pipeline** (full) — variable-size fan-out / loop / budget / journaled verify, AND user opted
   in, AND you're on the main thread.

State which you chose and why. Bias toward (1); make each step up earn the wiring. Steps 2–4 need no user
opt-in, so a skill's baked-in design should exhaust them before it reaches for (5).

## Worked seed — a project documentation sweep

The analysis this skill was distilled from. Target: a skill that audits every doc in a project, then plans
and applies fixes.

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
