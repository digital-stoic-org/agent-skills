---
name: plan-context
description: "Convert an analysis just done in-session into a resumable, traceable plan file — frontmatter + dashboard + execution log + lots whose closure is a re-runnable shell command — then run the execution pass (/pick-workflow then /pick-model) so a FRESH session can orchestrate it lot by lot. Use when the analysis is done but too big to execute here, when context is filling and the work must survive a /clear, or on 'turn this into a plan', 'give me a resumable/traceable plan', 'workstream plan', 'make this resumable', 'hand this off to a fresh session'. WRITES the plan; never executes it."
argument-hint: "<workstream-slug> [--exec-only]"
allowed-tools: [Read, Write, Edit, Bash, Glob, Grep, Skill]
model: opus
effort: high
context: main
user-invocable: true
---

# Plan Context

Crystallise the reasoning held in **this** session into one file that a **cold** session can pick up:
`<project>/plan-<workstream>.md`. The file is the single steering artifact of the workstream — dashboard,
log, lots, and the execution design. Nothing is rebuilt elsewhere.

Two properties, both mechanical, both non-negotiable:

- **Resumable** — reading the file is enough to resume at any interruption point. No conversation
  history required, no memory of what "we said earlier".
- **Traceable** — every claim is a measurement with its command; every lot closes on a command whose
  result is written back. A sub-agent's report is never evidence.

**Not this skill**: executing the lots (that is the next, fresh session) · designing topology from scratch
(delegated to `/pick-workflow`) · OpenSpec proposals (`/openspec-plan`) · session recap (`/save-context`).

## Steps

### 1. Gate

The plan derives from an analysis **already in context**. If the session holds no analysis, stop and say
so: run the analysis first (`/investigate`, `/probe`, plain exploration), then come back. Never invent a
plan out of a prompt.

**Scale guard**: under one lot there is no workstream — do the gesture, do not write a plan. A plan earns
its cost when the *analysis* would be expensive to rebuild, not when the work is long.

With `--exec-only`, skip to step 6 against the existing plan file.

### 2. Frame — before writing anything

Take the date once, from the system (`date +%d/%m/%Y`), and reuse it for `created`/`revised`, the log line
and the `## Measurements` header. Never infer it from the conversation — a long session drifts.

- **Workstream** — one slug (`biodiversite`, `permaplus`). Series prefix derived from it (`BD-`, `PP-`).
- **The question asked** — restate it as the user framed it, including their sub-question. It is the
  contract.
- **Scope / out of scope** — both explicit, as lists, in the frontmatter. Everything the analysis surfaced
  but that falls outside goes to `## Out of scope — deferred`, never silently dropped.
- **Predecessor** — if a sibling plan exists in the repo (`plan-*.md`), name it in the header line.

**Gate before writing** — show the frame (scope · out of scope · the lot list, titles only) and **wait**.
Ask in plain text, never `AskUserQuestion`. **One round**, then write: the analysis is already done, this
is a validation, not a questionnaire. An ambiguous answer ⇒ choose, and state the assumption.

### 3. Lock the measurements — the traceability floor

Every number that will appear in the plan goes into `## Measurements` with **the command that produced
it**. Rule: a figure with no re-runnable command does not enter the plan. Re-measure anything you inherited
from a sub-agent report rather than copying it — that is exactly where a plan starts lying. When a
re-measure contradicts an earlier value, keep both: new value, old value struck, and the reason.

### 4. Cut the lots

One lot = one gesture = **one output file**, never shared with another lot. Anatomy, all five fields:

| Field | Content |
|---|---|
| **Action** | what is done, precise enough that a briefed worker needs nothing else |
| **Input** | the exact sources, path + section |
| **Output** | the file(s) written — one owner per file |
| **Closure** | a **shell command with its expected value** (`grep -c … = 0`, `≥ 1`, a `comm` that returns empty). Verifiable on disk, not by reading the worker's answer |
| **Depends on** | lot IDs, or `nothing` |

**Run every closure command now**, before any lot is executed. Two returns for a near-zero cost: a
malformed command is caught here instead of in the execution session, and the value it returns *today* is
the baseline — write it in `Disk evidence` as `<value> (before), expected <value>`. A closure command that
cannot run is not a closure criterion; rewrite it until it does.

IDs are `XX-nn`, allocated once and **never recycled**. A lot dropped mid-way keeps its ID in
`### Dropped lots` with its motive — that table is what stops the next pass from re-proposing it.

Order the lots so the cheap prerequisites (indexes, doctrine) come before the heavy production, and park
whatever is blocked (a binary to extract, a decision the user owes) as a late, **frozen** lot that says
`Do not launch before …`.

### 5. Write the file

Path: **root of the current project**, `plan-<workstream>.md`. Template and legend: `reference.md`.
Order: frontmatter · title + resume header · `## Status — dashboard` · `## Execution log`
· `## The question asked` · free analysis sections · `## Plan` (the lots) · `## Out of scope`
· `## Measurements`.

Mandatory: frontmatter, dashboard, log, lots with the five fields, `## Measurements`, `## Execution`.
Optional, and only when the analysis produced them: `## Benchmark`, `## Inventory`, `## Gap`,
`## Reversed conclusions`, `## Out of scope`.

First log line is written now: date, `—`, `Framing: …`, evidence `plan written, repo untouched`.

**Plan already there ⇒ merge, never `Write`.** Re-running on an existing workstream reads the file first,
then: existing IDs and their statuses are kept as they are · new lots continue the series after the highest
ID ever allocated (dropped ones included) · the log gains lines, loses none · `revised:` and the
frontmatter lot lists are updated · a lot that no longer makes sense moves to `### Dropped lots` with its
motive. Overwriting a plan destroys the only trace of what was already established — that is the one
irreversible mistake this skill can make.

### 5bis. Validate the file mechanically

Six checks, one short script, before handing off. Any failure is fixed now, not left to the resume:

1. IDs unique across open + closed + dropped.
2. Every `Depends on` resolves to an existing ID.
3. No dependency cycle.
4. Every lot appears in **both** the frontmatter lists and `## Status — dashboard`.
5. No two lots declare the same `Output` file.
6. Every lot has its five fields, and its `Closure` holds at least one command.

### 6. Execution pass — always, never optional

Invoke `/pick-workflow` on the lot list — **once**. It already delegates model+effort per step to the
model-picker skill, so do not call `/pick-model` in the same breath; call it only for a lot whose verdict
came back without a model, and say so. Write the verdicts into `## Execution — decomposition and models`:
decomposition table · **the seam** (where it falls and why) · **cast** (mechanism + model + effort +
motive, per lot) · worker contract · resume protocol · linear fallback.

**What the verdict changes downstream.** The cast table takes whichever mechanism `/pick-workflow`
returned, not sub-agents by default. When the verdict is a **fleet** of named agents, fill the
`owned_paths` and `hands_off` columns and name the relay point; if the environment has a fleet planner
(`/plan-fleet` from the `team` plugin), hand the ownership map to it rather than writing it by hand. When
the verdict is a **workflow**, record the script path and the `runId`, and keep the linear fallback
explicit. Details per mechanism: `reference.md`.

**Linear does not mean inline.** Even with zero parallelism, a read-heavy lot goes to its own **named**
worker: the orchestrating session must spend context on findings, not on sources. Only a lot whose
gesture is smaller than its brief stays inline. Say so, per lot, in the cast table.

### 7. Hand off — do not execute

End by stating: the plan is self-carrying, so `/clear` then reopen the plan file in a fresh session, which
becomes the orchestrator. Auto-compaction is a fallback, not the route. Never start lot 1 in this session.

## Hard rules written into every plan

- **A sub-agent's report is not evidence.** The closure command is replayed *by the orchestrator*, and the
  result written to `Disk evidence`. No replay → the lot stays ⬜, whatever the worker claimed.
- A worker returns **facts**; dispositions, severity and closure verdicts stay on the orchestrator.
- **No `git` verb, ever** — the human is the gateway.
- Absolute paths (`/praxis` is a symlink), `/usr/bin/grep` and `/usr/bin/find` (the bare names are shimmed
  to ugrep/bfs; `-newermt` returns empty *silently*).
- Mass transformation ⇒ Python script + no-loss invariant + shape assertion. Never hand-editing rows.
- One writer per file. Two workers on one file lose updates with no error.

## Output

1. The plan file, written. 2. A three-line CLI recap: workstream, N lots, the first lot's closure command.
3. The handoff sentence of step 7. Nothing else — the plan is the deliverable, not the chat message.

## Anti-patterns

- ❌ A figure with no command in `## Measurements` — the plan becomes unverifiable at the first resume.
- ❌ A closure criterion phrased as a judgment ("the memo is complete") instead of a command.
- ❌ Recycling the ID of a dropped lot, or deleting it — the next pass will re-propose it.
- ❌ Rewriting the log. It is append-only; a reversal is a new line plus `## Reversed conclusions`.
- ❌ Two lots writing the same file. Merge them into one, or split the file.
- ❌ Executing a lot in the session that wrote the plan — that is the context spend the plan exists to avoid.
- ❌ Silently narrowing the scope. Out-of-scope findings go to `## Out of scope`, dated.
- ❌ A plan that *requires* sub-agents — always keep the `### Linear fallback` paragraph.
