# ring

A ring is a problem to settle, not a session. It can be a question, a need, an audit or a piece of work — any shape — and it stays open only until its `closure` is reached: the criterion, fixed at the start, that says when the problem is settled. Settling a ring is not the same as resolving it: a ring that closes on "this path is dead" has still settled its problem, and reports that as an INVALIDATED line rather than a failure. The format is unique and recursive — the root ring (the arc, `parent: root`) has the exact same anatomy as any leaf ring underneath it. A ring holds a Brief handed down by its direct parent and frozen at open, a Trace of local working memory that is thrown away when the ring closes, and a Delta: the only thing that crosses the turn back to the parent, typed by effect (ESTABLISHED, INVALIDATED, SURFACED, DELIVERABLE) and rephrased in the parent's own terms, never copied verbatim.

## Superposition: ring and team

`ring` and `team` are two layers that sit on top of each other; neither replaces the other. `team` is the transport layer: it circulates mandates, reports and relay packets between named Claude Code agents, and this plugin leaves it completely unchanged — no field is added to the MANDATE, REPORT or RELAY PACKET. `ring` is the control layer: it tracks which problem is open, who is carrying it, and what crosses back up when it closes. Everything a ring needs from `team` travels through fields `team` already has — `read_first`, `owned_paths`, `deliverable`, `stop_conditions`, `cadence` — never through a new one. Concretely, `ring:open` calls `team:brief` to hand a ring to an agent, that agent's `team:report` signals it has stopped writing and points at its ring file, and `team:relay` migrates the same ring to a new carrier without re-typing its state.

## The four vehicles

What carries a ring while it is open is independent of where it sits in the tree; only whether it must outlive its own session decides whether it gets a file.

| Vehicle | Carries it | Trace | Has a ring file |
|---|---|---|---|
| `inline` | the parent's own conversation | not isolated | none, until `/ring:sync` promotes it to `resumed` (or `/open` does, when it opens a child under it) |
| `resumed` | a session that survives a `/clear` | not isolated | yes |
| `subagent` | a sub-agent of the parent | isolated | none — it can only produce Trace; the parent reads its final report and types the Delta itself |
| `session` | a named `team` agent, in its own tmux window | isolated | yes, created by the parent at `/open` |

`resumed` is never chosen at `/open`; it is only ever reached by promotion, when `/ring:sync` first writes an `inline` ring's file. A ring file, once it exists, has exactly one writer at a time — its current vehicle — and the writer token changes hands cleanly: the parent holds it while composing the Brief at `/open`, the vehicle holds it from the mandate onward, and the parent takes it back at `/close`, which refuses to run on a `session` ring whose last signal was not a REPORT. Since 0.2.0 the token is on disk: the header field `carrier:` names its current holder, `/ring:sync` refuses to write for anyone else, and `/open --resume` (on a `parked` or an `active` ring) is the one gesture that takes it over.

## The human's position

The human's position — in the loop, on the loop, or out of it — is not a separate setting. It is derived from the pair (vehicle, `escalade`), where `escalade` is a Brief field naming where what blocks the ring goes: `human`, `parent`, or `irreversible`. `/open` validates the pair and refuses incoherent combinations.

| vehicle ↓ · escalade → | `human` | `parent` | `irreversible` |
|---|---|---|---|
| `subagent` | refused — a sub-agent cannot ask a question mid-flight | in the loop, default | refused, same reason |
| `session` | in the loop | on the loop, default | on the loop, with gates at points of no return |
| `inline` / `resumed` | recorded but without effect — the carrier already is the human's own conversation | (same) | (same) |

For `session`, the default is `irreversible`: everywhere else the agent reports and keeps going, and it only stops and waits at named points of no return. For `subagent`, `/open` sets `parent` by default and refuses `human` or `irreversible` if asked for explicitly, since a sub-agent has no channel to ask a question. Praxis's own git rule — every commit passes through the human's validation — is a point of no return regardless of the escalade chosen; a ring running on `parent` does not route around it.

## Skills

| Skill | Runs when | Purpose |
|---|---|---|
| `/open` | descending: the parent hands a targeted Brief to a new or resumed ring | Composes a Brief from the direct parent only, infers what it safely can (asking only for the closure when the Brief leaves the conversation), names and validates the ring, promotes an unpromoted `inline` parent first, writes the child's file if its vehicle needs one, and hands it to its vehicle (keeps it in the conversation for `inline`, launches it foreground for `subagent`, or briefs a named `team` agent for `session`). `--resume` picks up a `parked` or an `active` ring and takes its writer token. |
| `/close` | ascending: the closure is reached, or a `session` ring's REPORT is in | Rereads the child's file from disk, validates and reads its Delta, folds what matters into the parent's own file in the parent's own terms — or, for the arc, into its own file — runs the closing sweep, and files the ring under `done/`. Refuses, before anything destructive, when the parent has no file to fold into. |
| `/rings` | checking the state of the tree | Scans a rings folder, renders it as a Mermaid graph, and flags collisions and anomalies — read-only, writes nothing. States its blind spot: rings without a file are invisible to it. |
| `/ring:sync` | whenever the ring's state should survive the conversation | Writes the current ring's state to its file: the first call promotes an `inline` ring, later calls checkpoint it. Never touches the Brief or the claims; `status` and `vehicle` are constated, never passed. |

All four skills print a short natural-language report by default and keep the mechanics (validations, commands, full tables) behind `--verbose`.

## Where things live

```
ring/
├── .claude-plugin/plugin.json
├── README.md
├── references/
│   ├── ring-file.md   # the ring file format in full: header fields, body sections, skeleton, lifecycle
│   └── carrier.md     # the rules a carrying vehicle follows, read first by every session vehicle
├── scripts/
│   └── ring.py        # scan · collide · sweep · graph · resolve-opened — the one place parsing and detection logic lives
└── skills/
    ├── open/  close/  rings/  sync/
```

`references/ring-file.md` is the only place in this plugin that describes the ring file format; the skills point at it by path rather than repeating it. `references/carrier.md` rides in `read_first` of every `team` mandate a `session` ring sends out, since `team` only carries its own mandate and role lines, never a ring's rules. `scripts/ring.py` is a standard-library-only Python 3 script that the skills call for scanning, collision detection, the closing sweep, the tree graph, and recovering a fileless ring's `opened` instant from its parent's `children:` line, so that parsing and detection logic exist in exactly one place.

**Project defaults.** An optional `.claude/ring.local.md` at the project root holds `dir:` (the rings folder) and `root:` lines (the closing sweep's roots). `/open` writes it once, the first time it falls back to the working directory; after that it is edited by hand. Format: `references/ring-file.md` §9.

## Execution rules (not tooled in v1)

These rules need no code in v1, but no skill may contradict them (spec §1.7).

- The plan is the ring's **last Delta** and lives **inside** the ring file. The switch signal is concrete: `## Next` holds nothing but gestures.
- Fan-out applies only to GATHER and EXECUTE; a cross-item step is **never** sharded.
- The Brief **is** the delegation contract: `question` → objective, `closure` → output format, `Inherited context` → targeted briefing, `Constraints` + `Out of scope` → boundaries. `/open` extends this mapping to the `team` mandate.
- A fork is **not** a vehicle: it ships the whole accumulated context and denies the OPEN gesture. It is never used to verify or challenge.
- Execution fan-out threshold: **at least 6 items AND pairwise-disjoint paths**; below that, or at the slightest overlap, execution stays linear. A dynamic workflow is barred to every sub-agent.
- When the three PLAN/GOAL criteria are not unanimous, the human decides. While GOAL is out of v1, this rule is documentation only.
- Model per step, generic doctrine (not routed through `pick-model`): gather at the cheapest tier, reason and plan at the top tier, execute mid-range.

## v1 scope

v1 ships the recursive ring/arc model, the four vehicles, the escalade-derived human position, exclusive `create:`/`writes:` claims with prefix-inclusion collision detection and the lineage exception between a ring and its ancestors, the reorientation rule (same ring if the closure is unchanged, close-then-open if it changed), and the closing sweep as the only leak detector — a `find`-based pass that runs after the fact, not a `PreToolUse` hook that would block a stray write before it lands.

Left out of v1, documented but not built: the `PreToolUse` hook and its `.claude/active-ring` pointer; the authoritative-source index (`authoritative_on:`/`supersedes:` and a `## Deliverables` view); the `↑` marker inside `ckpt` trailers and the mechanical `/close` it would drive; GOAL mode (`/goal`, `Budget`, and its Met/Impossible/budget-exhausted outcomes); and agent-team depth beyond the two-level sub-agent ceiling. `save-context`, `load-context` and `plan-context` are untouched by this plugin.

0.2.0 adds persistence that survives a `/clear`: `/ring:sync` (promotion and checkpoints), the on-disk writer token `carrier:`, `/open --resume` on `active` rings, the `opened` instant recorded on the parent's `children:` line, the arc folding its own Delta at `/close`, per-vehicle input defaults, project defaults, and the default/`--verbose` output split.
