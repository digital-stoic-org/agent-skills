---
name: rings
description: 'Read-only view of a ring directory: Mermaid tree, create:/writes: claims, collisions, anomalies. Use when: rings, list rings, show the ring tree, ring status, which rings are open, arc view, who claims this path.'
allowed-tools: [Bash, Read]
context: main
argument-hint: "[dir] [--claims] [--verbose]"
user-invocable: true
---

# Rings

Read-only. Writes nothing, ever.

## Arguments

| Argument | Value | Default |
|---|---|---|
| `[dir]` | absolute path to the ring directory | the ring directory known from context; if unknown, ask |
| `--claims` | print only the claims table + collisions, skip the tree | off |
| `--verbose` | full claims table (every claim, not only collisions), exact `ring.py` commands run | off |

## Steps

1. `python3 ${CLAUDE_PLUGIN_ROOT}/scripts/ring.py scan <dir>` — covers `<dir>` root **and** `<dir>/done/`. Exit 1 only means some ring carries an anomaly; keep going, anomalies are surfaced, not fatal. Read each ring's `anomalies[]`. **If `scan` returns `[]`**, this does not mean the folder is virgin — see the blind-spot sentence under Output; still run steps 2-4, the footer's `measured:` line covers all three commands regardless.
2. Skip if `--claims`. `python3 ${CLAUDE_PLUGIN_ROOT}/scripts/ring.py graph <dir>` — a Mermaid `flowchart TD`. Node label = `slug<br/>(vehicle · carrier)` when the ring's `carrier` field is non-null, `slug<br/>(vehicle)` when it is absent or `—` (v0.1.0 files, or nobody holds the token). Color: `active` green, `parked` gold, `done` gray, `root` blue. A `children:` slug with no matching file, or a `parent:` with no matching file, renders as a dashed phantom node — this is expected for `inline`/`subagent` rings, which have no file. `done` rings stay on the tree, never pruned.
3. `python3 ${CLAUDE_PLUGIN_ROOT}/scripts/ring.py collide <dir>` — every `create:`/`writes:` claim of every `active`/`parked` ring (root + `done/`), paired up where one includes the other. `relation: lineage` is a legal parent→child delegation (§4.2), not a problem. Only `relation: none` pairs are real collisions.
4. Compose the anomaly list from step 1's `anomalies[]` fields plus step 3's `none`-relation pairs. List them flat. Never fix them — this skill only reads.

## Output

**Default** (natural language, not a field dump):

- The Mermaid tree (omitted under `--claims`).
- One sentence of counts, natural language: e.g. "3 rings active, 1 closed, no anomaly."
- The claims table — **only** when step 3 found a `none`-relation collision, or `--claims` was passed. Otherwise omitted; nothing to look at.
- Each `parked` ring flagged as resumable: `<slug> (parked) — resume with /open --resume <slug>`.
- **Blind-spot sentence, only when `scan` returned `[]`:** this view only covers rings that have a file; `inline` rings not yet promoted and `subagent` rings are invisible by construction — an empty result is not proof the folder is unused. Point at `/ring:sync` to promote an `inline` ring into view.
- Footer: `measured: scan+graph+collide on <dir> · <ts>`.

**`--verbose` adds:** the full claims table (one row per `create:`/`writes:` value, its ring, and its collisions if any, even with none found) and the exact `ring.py` commands run, so the reader never re-measures by hand.

## Known limitations

- A ring without a file — `inline` not yet promoted, or `subagent` — appears only if some other ring's `children:` cites its slug, and then only as a phantom node, never as a real one. `/ring:sync` is the only way to bring an `inline` ring into view.
- A directory never passed to `scan`/`graph` is invisible to this skill; nothing outside `<dir>` is checked.
- `goal` does not survive its own session (B§7.5); it is not part of this view even when set.
- `carrier` in the node label reflects whatever `scan` read at measurement time — it can go stale the instant another conversation takes the token.
