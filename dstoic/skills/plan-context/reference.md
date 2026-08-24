# Plan Context — template and conventions

The template below reproduces the structure proven by `plan-permaplus.md` / `plan-biodiversite.md`
(villa-nara repo). It is copied as is: optional sections can be deleted, mandatory ones cannot.
The plan's prose follows the user's language; the headings and the frontmatter keys are fixed.

## Template

````markdown
---
workstream: <slug>
series_id: <XX>-xx
status: framed           # framed | in-progress | closed
created: DD/MM/YYYY
revised: DD/MM/YYYY
scope: [<folder>, <folder>]
out_of_scope: [<folder>, <folder>]
lots_open: [XX-01, XX-02]
lots_closed: []
lots_dropped: []
---

# Plan — <workstream title>

> Steering artifact for workstream <slug>. **Resumable cold**: every lot carries its own closure
> criterion, verifiable on disk, and its status. Do not rebuild it anywhere else.
> Predecessor in the same repo: `<previous-plan.md>` (series `<YY-xx>`, closed on DD/MM/YYYY).

## Status — dashboard

| Lot | Title | Status | Disk evidence |
|---|---|---|---|
| `XX-01` | <title> | ⬜ open | <value measured before execution>, expected <value> |

Legend: ⬜ open · 🟡 in progress · ✅ closed (with evidence) · ❌ dropped (ID kept).
**Resume rule**: a lot is ✅ only once its closure command has been replayed and its result written into
the `Disk evidence` column. A sub-agent's report is never evidence.
When the plan is written, that column already holds the **before value**: it proves the command runs and
it gives the point of comparison.

## Execution log

| Date | Lot | Action | Evidence |
|---|---|---|---|
| DD/MM/YYYY | — | Framing: <what was done> | plan written, repo untouched |

## The question asked

<The question as the user framed it, their sub-question, and the target.>

## <Analysis sections — optional>

<Benchmark · Inventory · Gap · whatever the analysis produced. Full prose, tables for facts.>

## Plan

<Ordering in one line: cheap prerequisites → heavy production → blocked lot last, isolated.>

### XX-01 — <title>

- **Action**: <what is done, precise enough that a briefed worker needs nothing else>
- **Input**: <paths + exact sections>
- **Output**: <the file(s) written — one owner per file>
- **Closure**: `<command>` = <expected value> · `<command>` ≥ <value>
- **Depends on**: <IDs | nothing>

### Dropped lots — ID kept, never recycled

| ID | Title on first pass | Status | Motive |
|---|---|---|---|

## Reversed conclusions

**<Initial finding>. Reversed on DD/MM/YYYY by <who>.**
<Motive, then the independent checks that corroborate it. The old lot keeps its ID, marked ❌.>

## Out of scope — deferred

- <out-of-scope finding, with its location, dated>

## Measurements

All dated **DD/MM/YYYY**, run from `<absolute path>`.

| Measurement | Value | Command |
|---|---|---|
| <what> | <value> | `<replayable command>` |

---

## Execution — decomposition and models

Decided on DD/MM/YYYY via `/pick-workflow` then `/pick-model`. Orchestrating session: <model> (ctx <n> %).

### Decomposition

| Lot | Work shape | Parallelizable? | Judgment load | Token weight | Cross-item dep? |
|---|---|---|---|---|---|

### The seam

<Where the seam falls and why. A cross-item lot is never sharded: name it, and say so in full. If nothing
parallelizes, write that down — "a sequence of named sub-agents" is a decision, not a default.>

### Cast

| Lot | Mechanism | Model | Effort | `owned_paths` | `hands_off` | Routing motive |
|---|---|---|---|---|---|---|
| `XX-01` | named sub-agent `xx01-<slug>` | <model> | <effort> | — | — | <motive> |
| `XX-02` | **inline**, orchestrator | — | — | — | — | the gesture is smaller than its brief |
| `XX-03` | **fleet**, named agent `<name>` | <model> | <effort> | `<exclusive subtree>` | `<nearest traps>` | several workers live in parallel on one repo |
| `XX-04` | **workflow**, script `<name>.js` | <model> | <effort> | — | — | variable-size list, or loop until dry |

The two ownership columns stay empty as long as the workers never overlap in time. They are filled for a
fleet, and only for a fleet.

Verification is never delegated: dispositions and findings stay with the orchestrator. A worker returns
**facts**, never a closure verdict.

### What the chosen mechanism adds to the plan

The `Cast` table is enough as long as each lot goes to an isolated worker that returns its file and then
disappears. As soon as the mechanism keeps several workers alive at the same time, or delegates the loop
itself, the plan has to carry more.

- **Fleet of named agents** — fill `owned_paths` and `hands_off` for every lot concerned. `owned_paths` is
  the worker's exclusive subtree: everything else is denied by default, and `hands_off` merely enumerates
  the nearest traps without claiming to be exhaustive. Name the relay point as well, meaning the state that
  passes to the successor when a worker reaches its context limit. If the environment has a fleet planner
  (`/plan-fleet` from the `team` plugin), that skill writes the ownership map — call it instead of copying
  the map out by hand.
- **Workflow** — record the script path, then the `runId` of the first run, because that identifier alone
  makes resumption possible. Write the linear fallback out in full. A workflow requires explicit human
  opt-in at every launch, so a plan that depends on one without a fallback is a plan that stalls.
- **In both cases** — the `Resume protocol` below holds as written, but closure is replayed lot by lot,
  never in one batch at the end. Two concurrent workers can both be finished while half the closure
  commands have not run.

### Contract imposed on every worker

- Objective, output format, allowed sources, boundaries — all written into the brief.
- **Absolute** paths, `/usr/bin/grep` and `/usr/bin/find` (the bare names are shimmed).
- **No `git` command, ever.**
- Mass transformation ⇒ **Python script + no-loss invariant + shape assertion**.
- A worker writes **one single file**, never shared with another worker.

### Resume protocol

1. Launch the lot, wait for it to finish.
2. **Replay the closure command** from the orchestrator.
3. Write the result into `Disk evidence` + one line in the `Execution log`.
4. A lot with no replayed evidence stays ⬜, whatever the worker claimed.

### Linear fallback

If the sub-agents fail or return nothing usable, the <n> lots can be run linearly in the orchestrating
session, same order, same closure criteria.
````

## Framing decisions

**Naming.** `plan-<workstream>.md` at the root of the current project. One workstream = one plan = one
series of IDs. A second plan in the same repo cites its predecessor in the header line (series continuity).

**Verifiable closure — what counts and what does not.**

| ✅ Closure | ❌ Pseudo-closure |
|---|---|
| `/usr/bin/grep -c "converted/" README.md` = 0 | "the README is up to date" |
| `comm` of the anchors against `grep "^### "` = empty | "the 43 wikilinks resolve" |
| 43 data rows, 4 `Depth` cells | "the table is complete" |
| a file exists at `<path>` with N sections | "the worker says it is done" |
| the command **already runs** when the plan is written and returns the before value | a command never executed, found broken at resume time |

**Resuming an existing plan — merge, never rewrite.** Re-running the skill on an already open workstream
reads the file first. IDs and their statuses are kept as they are; new lots continue the series after the
highest ID ever allocated, dropped ones included; the log loses no line; `revised:` and the three
frontmatter lists are updated; a lot that no longer makes sense moves to `### Dropped lots` with its
motive. Overwriting a plan destroys the only trace of what had already been established.

**Mechanical validation before handoff.** Six checks: IDs unique across the three lists · every
`Depends on` resolves · no cycle · every lot present in the frontmatter **and** in the dashboard · no two
lots declare the same `Output` · every lot has its five fields and at least one command under `Closure`.
