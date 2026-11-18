---
name: converge
description: Convergent decision on an idea file written by diverge. Asks Mat for his criteria and weights first, then filters, scores and recommends in one pass, and writes the result into the same file. Use when choosing among options, deciding, narrowing down after a brainstorm. Triggers include "converge", "decide", "pick an option", "narrow down", "compare the options".
argument-hint: "<slug or path of an idea file>"
allowed-tools: [Read, Write, Edit, Bash]
model: opus
user-invocable: true
---

# converge

Close a problem opened by `diverge`. Criteria come from Mat, never from you.

Input: `$ARGUMENTS` = slug or absolute path of an idea file.

## Hard rules

- Never score before Mat has set the criteria and weights.
- Cite options with ID and title: `P07 · prepaid wallet`, never `P07` alone.
- Questions to Mat go in plain text with numbered or lettered choices. Never AskUserQuestion.
- No new options. If a gap shows, name it in the result and point to `/diverge {slug}`.
- No web search: research belongs to `diverge --research`.

## 1. Load

Slug → `$PRAXIS_DIR/thinking/brainstorms/{project}/{slug}-llm.md` (`{project}` = basename of the git root of the current directory). If several projects hold the slug, list them and ask. File missing → stop and point to `/diverge`.

Candidates = options with status `open` or `kept`. Show the count and the list, `P<n> · title`. Fewer than 3 candidates → say so and suggest another diverge round; continue only if Mat insists.

## 2. Ask criteria (one message, then wait)

```
1. Eliminators (yes/no, an option failing one is out): ...
2. Criteria and weight 1-3:
   suggested from the problem: A <criterion> · B <criterion> · C <criterion> · D <criterion>
   → keep, change, add, set weights
```

Suggest 3-5 criteria derived from `## Problem` as a starting point only. Mat's answer is final. If he gives no weights, use 1 for all and state it.

## 3. One pass

1. Eliminators: drop failing options, one-line reason each.
2. Score survivors 1-5 per criterion, weighted total. One short justification per score that is not obvious.
3. Finalists: top 2-3 with their main trade-off against each other.
4. Recommendation: one option, why in 2-3 sentences, assumptions to validate before acting, next step (plan it if multi-step or ambiguous, do it directly if single and obvious).
5. Flag ties within 10% of the top score, and any score that rests on an unverified assumption.

## 4. Persist and show

Write `## Convergence` into the idea file (replace it in place if a previous run exists), set `status: converged` and `updated`. Format:

```markdown
## Convergence
- date: YYYY-MM-DD
- eliminators: {list}
- criteria: {criterion} ×{w} · ...
- eliminated: P3 · title ({reason}) · ...

| Option | {c1} ×w | {c2} ×w | Total |
|--------|---------|---------|-------|

- finalists: P2 · title vs P9 · title — {trade-off}
- recommendation: P2 · title — {why}
- assumptions: {list}
- next: {plan | direct}
```

Then show in chat: the score table, finalists, recommendation, assumptions, file path. Mat may change a weight or criterion: rerun step 3 and overwrite the section.
