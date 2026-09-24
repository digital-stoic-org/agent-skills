---
name: sync
description: "Write the ring state currently held by this conversation to its file: creates the file on first call (promoting an unpromoted inline ring), checkpoints it on every later call. Use when: sync a ring, promote an inline ring, checkpoint a ring, save ring state, persist a ring, take the ring's writer token, ring:sync."
allowed-tools: [Read, Write, Edit, Bash]
argument-hint: "[slug] [--dir <path>] [--verbose]"
context: main
user-invocable: true
---

# Sync

SYNC writes this conversation's own view of one ring to disk. First call on a ring with no file **promotes** it (`inline` → `resumed`); every later call **checkpoints** it. Format reference (cite by path, don't reopen it here): `${CLAUDE_PLUGIN_ROOT}/references/ring-file.md`.

## Common rules (all `ring` skills)

Disk commands go through absolute paths and `/usr/bin/find`, `/usr/bin/grep`, or `python3 ${CLAUDE_PLUGIN_ROOT}/scripts/ring.py` (every `ring.py` below means this) — bare `find`/`grep` are shimmed and fail silently. No git verb of any kind. No `.bak` files. A question to the human is posed in plain text, once, with A/B/C choices — never an interactive question tool.

## Arguments

| Argument | Value | Required | Default |
|---|---|---|---|
| `[slug]` | the ring to sync | no | the ring this conversation currently carries; ask if unknown or ambiguous |
| `--dir` | absolute rings folder | no | dir of the ring's own file if it has one → `dir:` line of `${CLAUDE_PROJECT_DIR}/.claude/ring.local.md` → cwd (`realpath`) |
| `--verbose` | print the full rewritten sections + the `ring.py scan` result | no | off |

## Steps

1. **Resolve slug and dir** per the tables above.
2. **Locate the file**: glob `ring-<slug>-llm.md` at the root of `<dir>`; if absent there, glob `<dir>/done/`. Found in `done/` → refuse (table below) — a `parked`/`done` ring is not sync's business, `/open --resume` reactivates it first. Promotion is only the case where the slug is absent from **both** locations.
3. **Refuse before writing** — table below.
4. **This conversation's write token**: reuse whatever token this conversation already holds — from an earlier `/open --resume`, an earlier `/ring:sync` call, or a promotion triggered by `/open` — and mint one only if it holds none yet. Format and precedence: `${CLAUDE_PLUGIN_ROOT}/references/ring-file.md` §2, `carrier` row — cited, not restated here.
5. **Compose and write** — table below.
6. `python3 ${CLAUDE_PLUGIN_ROOT}/scripts/ring.py scan <dir>`. An anomaly on *this* ring is reported in the output, never repaired silently.
7. **Output** — one sentence.

## Refusals

| Check | Outcome |
|---|---|
| slug found in `done/` | refuse: `<slug>` is `<status>`; `/open --resume <slug>` first |
| file present at root, `carrier:` absent, `—`, or not this conversation's token | refuse: take the pen with `/open --resume <slug>` |
| file present at root, `vehicle: session`, this conversation is not that session's team agent | refuse: carried by team agent `<x>`, not this conversation |

Not found at root **or** in `done/` is not a refusal — it is the promotion case (step 5).

## Compose and write

| Case | Write |
|---|---|
| **Absent (promotion)** | Create the file. Header: `status: active`, `vehicle: resumed`, `opened:` = the instant of this ring's *original* `/open` (held by the conversation, never "now"), `saved:` = now, `carrier:` = the token from step 4, `children: —` (unchanged here — registering an entry on this file's own `children:` line is a parent's own later act, not sync's), `create:`/`writes:` exactly as this conversation composed them at `/open`. `## Brief` exactly as composed at `/open`, frozen, verbatim. Then the body sections, right column below, from whatever this conversation already holds for the ring. |
| **Present (checkpoint)** | Reread the file from disk first — never from memory, a stale in-context copy would clobber a change the carrier check didn't catch. Rewrite only: `## Trace`, `## Delta`, `## Established`, `## Open`, `## Log`, `## Next`, `## Hot Files`, `## Drop`, and `saved:` (now). **Never touch**: `## Brief`, `ring`, `parent`, `opened`, `create:`, `writes:`, `status`, `vehicle`. |

`status` and `vehicle` are never parameters of this skill — they are read off what is already true (`--park`, via `/close`, is the only path to `parked`; sync inventing a second one would leave two ways to park a ring with no answer to which is authoritative). Sections stay omitted while empty, per the skeleton in `references/ring-file.md` §4. Multivalued fields repeat one line per value, never a YAML list, per §2.

## Being invoked by `/open`

When `/open` finds its parent is an unpromoted `inline` ring carried by the same conversation, it calls `Skill(skill: "ring:sync", args: "<parent's slug> --dir <resolved dir>")` before registering the new child — an unpromoted parent has no `children:` line to write on. Called this way, `[slug]` and `--dir` are both given explicitly; the explicit `--dir` wins over sync's own chain (Arguments table above), so sync's dir chain never runs on this call. Sync then runs its normal promotion path and nothing more. Registering the child on the now-existing `children:` line is `/open`'s own next step, not sync's.

## Output

One sentence: verdict (promoted / checkpointed / refused), the file path, and what changed in a phrase (new Delta lines, Trace entries, or "Brief only" on first promotion). `--verbose` adds the full rewritten sections and the `ring.py scan` result for this ring.

## Files written

The ring's own file, created or rewritten per the table above. Nothing else — never a parent's or child's file, never `${CLAUDE_PROJECT_DIR}/.claude/ring.local.md` (read-only here).

## Known limitations

- Fidelity depends entirely on what this conversation currently holds; after a `/clear` or a compaction the conversation is no longer the carrier of anything and must reclaim the token via `/open --resume` before syncing — this skill never contests or reclaims a lost token itself.
- A `subagent` ring has no file by construction and nothing to sync; this skill only ever creates or rewrites `inline`(promoting) / `resumed` / `session` files.
- An anomaly `scan` reports after the write is stated, never fixed — repairing anomalies is out of scope of this skill.
- Does not write `${CLAUDE_PROJECT_DIR}/.claude/ring.local.md`; only `/open` writes it, once.
