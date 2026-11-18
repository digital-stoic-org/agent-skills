# diverge reference

## Idea file format

Shared contract with `converge`. One file per topic, edited in place, never versioned.

```markdown
---
topic: "{one-line problem statement}"
project: {project}
slug: {slug}
created: YYYY-MM-DD
updated: YYYY-MM-DD
sessions: 1
status: diverging   # diverging | converged
---

## Problem
{2-4 lines: what is open, for whom, known constraints}

## Research
- {finding} — {url}

## Axes
| Axis | Values |
|------|--------|
| {axis} | {v1} · {v2} · {v3} |

## Options
- P1 · {title} — {one-line idea} · tech: {technique} · src: claude · status: open
- P2 · {title} — {idea} · tech: combine P1+P4 · src: claude · status: kept
- P3 · {title} — {idea} · tech: Mat · src: Mat · status: dropped ({Mat's reason})

## Rounds
- R1 · YYYY-MM-DD · quick · SCAMPER · P1-P7 · reaction: keep P2, drop P3 (too costly), dig P5
- R2 · YYYY-MM-DD · quick · dig P5 · P8-P13 · reaction: stop

## Convergence
{written by converge only}
```

Status values: `open` (no reaction yet), `kept`, `dropped (reason)`, `merged→P<n>`.
`## Research` and `## Axes` appear only when used.

## Techniques

Rotate across rounds in quick mode; use the first three together in deep mode.

- **SCAMPER**: Substitute, Combine, Adapt, Modify, Put to other uses, Eliminate, Reverse.
- **Starbursting**: who, what, when, where, why, how; one option per unexpected answer.
- **Morphological analysis**: axes × values table, options from unusual combinations.
- **Inversion**: how to make the problem worse, then flip each answer.
- **Analogy**: how another field solves the same shape of problem (logistics, biology, games, finance).
- **Constraint shift**: remove one constraint, or add a harsh one (zero budget, one day, no software).
- **Extremes**: smallest possible version, largest possible version.

## Spread axes

Check a round covers several of: minimal vs comprehensive, build vs reuse, quick prototype vs robust, single vs multi-purpose, manual vs automated, Mat-only vs involves others.
