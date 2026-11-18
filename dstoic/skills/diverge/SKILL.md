---
name: diverge
description: Divergent ideation in rounds, no scoring, no recommendation. Generates options on a topic, Mat reacts (keep, dig, combine, drop), next round builds on his reaction; persists one idea file per topic across sessions. Use when exploring options, ideating, opening a problem before deciding. Triggers include "brainstorm", "diverge", "explore options", "ideate", "generate ideas". To decide among the options, use converge.
argument-hint: "[quick|deep] [--research] <topic or slug>"
allowed-tools: [Read, Write, Edit, Bash, WebSearch]
model: opus
user-invocable: true
---

# diverge

Open a problem. Produce options. Never judge them: judging belongs to `converge`.

Input: `$ARGUMENTS`
- `quick` (default) or `deep`: depth of each round.
- `--research`: run web searches before round 1 of this session. Without it, no web search.
- rest: topic in free text, or the slug of an existing idea file.

## Hard rules

- No scoring, ranking, "best", "promising", pros/cons, feasibility or recommendation. Not in the file, not in chat.
- Every option has a stable ID: `P<n>`, never renumbered. Always cite it with its title: `P07 · prepaid wallet`, never `P07` alone.
- Dropped options stay in the file with Mat's reason, so later rounds do not re-propose them.
- Ideas Mat gives himself become options with `src: Mat`.
- Questions to Mat go in plain text with numbered or lettered choices. Never AskUserQuestion.
- Persist after every round, before showing it.

## 1. Locate the idea file

Path: `$PRAXIS_DIR/thinking/brainstorms/{project}/{slug}-llm.md`
- `{project}` = basename of the git root of the current directory, else of the current directory.
- `{slug}` = lowercase hyphenated topic, ≤ 5 words. Reuse an existing slug when the topic matches one in the folder.
- Resolve `$PRAXIS_DIR` with Bash. If unset: warn `$PRAXIS_DIR not set — idea file not persisted (export PRAXIS_DIR="$HOME/dev/praxis")`, keep working in chat only.

File exists → resume: read it, report in 2 lines (open options count, last round date and depth), continue from its state.
File missing → create it with the format in `reference.md`. If the topic is too vague to generate from, ask at most 2 framing questions first.

## 2. Research (only with `--research`)

2-3 focused searches: existing solutions, prior art, real cases. Write 3-6 one-line findings in `## Research` with source URL. Findings feed ideas; they are not verdicts.

## 3. Generate a round

Read all existing options first. A new option must differ from every open, kept and dropped one.

- `quick`: one technique, 5-8 options. Pick the technique least used so far in the file (see `reference.md`).
- `deep`: SCAMPER + Starbursting + morphological analysis together, 15-30 options. Morphological: list 3-5 axes of the problem, 3-4 values per axis, write the axis table in the file, derive options from unusual value combinations.
- Round after a reaction: seed from it. `dig Pn` → variants and sub-options of Pn. `combine Pn+Pm` → hybrids. `angle <x>` → generate from that angle. Kept options anchor the round; dropped ones are excluded.

Each option: one line, concrete enough to picture. Spread across axes (minimal vs full, build vs reuse, now vs later, Mat-only vs others) instead of clustering on one idea.

## 4. Persist, then show

Append the options to `## Options` and a round entry to `## Rounds` (see `reference.md`). Then show in chat only the new options, `P<n> · title — idea`, and the reaction prompt:

```
Reaction? (combine freely)
  keep P3 P5 · drop P2 (reason) · dig P4 · combine P1+P6
  angle <new angle> · idea <your own idea> · stop
```

## 5. Apply the reaction

Update statuses in `## Options`, record the reaction verbatim-short in the round entry, then generate the next round (step 3). `idea <text>` adds an option with `src: Mat`.

## 6. Stop

On `stop`: update the frontmatter (`updated`, `sessions`), print the file path, the count of open and kept options, and the next step: `/converge {slug}` when there are 8 or more open or kept options, otherwise "another diverge session". Never converge yourself.
