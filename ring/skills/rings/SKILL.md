---
name: rings
description: 'Read-only view of a ring directory: Mermaid tree, create:/writes: claims, collisions, anomalies. Use when: rings, list rings, show the ring tree, ring status, which rings are open, arc view, who claims this path.'
allowed-tools: [Bash, Read]
context: main
argument-hint: "[dir] [--claims]"
user-invocable: true
---

# Rings

Read-only. Writes nothing, ever.

## Arguments

| Argument | Value | Default |
|---|---|---|
| `[dir]` | absolute path to the ring directory | the ring directory known from context; if unknown, ask |
| `--claims` | print only the claims table + collisions, skip the tree | off |

## Steps

1. `python3 ${CLAUDE_PLUGIN_ROOT}/scripts/ring.py scan <dir>` — covers `<dir>` root **and** `<dir>/done/`. Exit 1 only means some ring carries an anomaly; keep going, anomalies are surfaced, not fatal. Read each ring's `anomalies[]`.
2. Skip if `--claims`. `python3 ${CLAUDE_PLUGIN_ROOT}/scripts/ring.py graph <dir>` — a Mermaid `flowchart TD`. Node label = `slug<br/>(vehicle)`. Color: `active` green, `parked` gold, `done` gray, `root` blue. A `children:` slug with no matching file, or a `parent:` with no matching file, renders as a dashed phantom node — this is expected for `inline`/`subagent` rings, which have no file. `done` rings stay on the tree, never pruned.
3. `python3 ${CLAUDE_PLUGIN_ROOT}/scripts/ring.py collide <dir>` — every `create:`/`writes:` claim of every `active`/`parked` ring (root + `done/`), paired up where one includes the other. `relation: lineage` is a legal parent→child delegation (§4.2), not a problem. Only `relation: none` pairs are real collisions.
4. Compose the anomaly list from step 1's `anomalies[]` fields plus step 3's `none`-relation pairs. List them flat. Never fix them — this skill only reads.

## Output

- The Mermaid tree (omitted under `--claims`).
- The claims table: one row per `create:`/`writes:` value, the ring that holds it, and its collisions (if any).
- The anomaly list (empty list stated explicitly, not omitted).
- Each `parked` ring flagged as resumable: `<slug> (parked) — resume with /open --resume <slug>`.
- The generation timestamp and the exact `ring.py` commands run, so the reader never re-measures by hand.

## Known limitations

- A ring without a file — `inline` not yet promoted, or `subagent` — appears only if some other ring's `children:` cites its slug, and then only as a phantom node, never as a real one.
- A directory never passed to `scan`/`graph` is invisible to this skill; nothing outside `<dir>` is checked.
- `goal` does not survive its own session (B§7.5); it is not part of this view even when set.
