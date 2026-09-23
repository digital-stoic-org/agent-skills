---
name: close
description: 'Ascend: read a child ring''s Delta and reformulate it into the parent''s own terms, then close the turn. Use when: close a ring, close, ascend, read the delta, a ring''s closure is reached, a report says the closure is reached, park a ring, abandon a ring.'
allowed-tools: [Read, Write, Edit, Bash]
argument-hint: <slug> [--park] [--root <path>]... [--opened <iso>]
context: main
user-invocable: true
---

# Close

CLOSE is a **reading**. The parent reads the child's Delta and reformulates it in its own terms — it never re-executes the child's plan, never re-applies a `DELIVERABLE`, and never writes to the child's file while the child is still WORKing. Exactly one turn: the Delta crosses to the direct parent and stops there, never to the grandparent.

Format reference (cite by path, don't reopen it here): `/repos/agent-skills/ring/references/ring-file.md`. Carrier rules the vehicle already followed: `/repos/agent-skills/ring/references/carrier.md`.

## Common rules (all `ring` skills)

- Disk commands go through absolute paths and `/usr/bin/find`, `/usr/bin/grep`, or `python3 ${CLAUDE_PLUGIN_ROOT}/scripts/ring.py` (every `ring.py` below means this) — bare `find`/`grep` are shimmed and fail silently.
- No git verb of any kind. No `.bak` files.
- A question to the human is posed in plain text, once, with A/B/C choices — never an interactive question tool.

## Arguments

| Argument | Value | Required |
|---|---|---|
| slug | the ring to close | yes |
| `--park` | park instead of close (`status: parked`, no Delta reading) | no |
| `--root` | absolute root(s) for the closing sweep, repeatable | no — default: `realpath` of the ring directory's parent |
| `--opened` | ISO instant, for a `subagent` ring that has no file | required if vehicle is `subagent` |

## Preconditions — refuse before reading anything

| Vehicle | Precondition | Else |
|---|---|---|
| `session` | last signal received from the agent is a REPORT — it has stopped writing | refuse: the pen is still with the vehicle |
| `resumed` / `inline` (already promoted) | `/close` runs in the parent's own carrier | refuse |
| `subagent` | the sub-agent's final report is present in this conversation | refuse: nothing to read |
| any | `/close` runs in the **parent's** carrier — closing is a read the parent does on its own file | refuse |

Also refuse, flagged not guessed: slug not found; ring already `status: done`; `status` outside `active`/`parked`/`done`.

## Steps — closing to `done`

1. **Reread the child's file from disk, never from memory.** Guards against double-application: if the child edited a `DELIVERABLE`, that edit is already on disk — the parent must not reapply it, and must not reason from a stale in-memory copy of the file.
2. **Validate the Delta.** Each line carries one of the four types (`ESTABLISHED` / `INVALIDATED` / `SURFACED` / `DELIVERABLE`) and a source `← t{nn}` present in the Trace; every `DELIVERABLE` cites a path that exists (`ls`) and quotes no content. An invalid line is flagged, not silently corrected.
3. **`subagent` only** — type the sub-agent's report through the candidate mapping, then keep only what survives the effect filter (table below).
4. **Read and reformulate into the parent's own file, in the parent's terms — never verbatim.** One `## Log` row (date, slug, verdict); useful ✅ into `## Established`; 🆕 into `## Open`; a ❌ that breaks a premise of the parent's own Brief is flagged to Mat. If a fact still bites one turn further up, the parent posts its **own** Delta line in its own file (rewrite the file, bump `saved:`; this can promote the parent from `inline` to `resumed`) — it never writes directly to the grandparent, that would be a skipped turn. If the parent is the arc, its Delta pours into `## Established` / `## Open` instead of crossing anywhere.
5. **Run the closing sweep** (`ring.py sweep`) with `--opened`, the child's `create:` ∪ `writes:` prefixes, and the root(s). Print the inventory and the review list.
6. **If the review list is non-empty**, ask Mat one plain-text question, once: A) close anyway, B) park instead, C) stop. Nothing closes in silence.
7. **Close the child's file** (writer = parent): `status: done`, `closed:` (ISO UTC), `saved:` (ISO UTC), then remove the `## Trace` section, then `mv` to `done/`. `## Delta` stays. Trace removal is destructive and irreversible on this side (no git net) — it only happens once step 2's schema validation has passed **and Mat has explicitly confirmed it, every time**: show the validated Delta, ask one plain-text line (A) remove the Trace and close, B) keep the Trace and close, C) stop), and wait. Folded into step 6's question when the review list is non-empty. No confirmation → nothing is removed.
8. **Redirect, if any.** If the Delta carries a ❌ or a 🆕 born from a changed closure (see Redirect below), the output **proposes** the next `/open` command — possibly `--agent` = the same team agent — but never runs it.

## `--park`

No Delta reading. `status: parked`, `saved:` (ISO UTC), `mv` to `done/`. `create:`/`writes:` claims are **kept** — only `status: done` releases them, not the `mv`. The Trace is kept too, since the ring will resume via `/open --resume <slug>`.

## `inline` not yet promoted

An `inline` ring promotes itself to `resumed` at its first Delta line — by the time it has something worth closing, it already has a file and behaves like `resumed` above. This is the residual case: closing a ring that never posted a Delta line at all. There is no file and nothing to read. `/close` only writes the parent's `## Log` row (if the parent has a file), and runs the sweep if `--opened` is known.

## Delta by vehicle — where it comes from

| Vehicle | Regime | Rule |
|---|---|---|
| `session` | the ring file is authoritative | the child already posted typed Delta lines into its own file as it went; its REPORT just points at that file. `/close` reads the file, never the REPORT, to type anything. |
| `resumed` | the ring file is authoritative | same as `session` |
| `inline` (promoted) | the ring file is authoritative | same, once promoted |
| `subagent` | mapping candidate, then filter by effect | the sub-agent produces Trace-only facts, never a Delta; the **parent** types them, because typing requires seeing both sides of the turn — table below |

**Candidate mapping for a `subagent` report:**

| Report element | Candidate | Filter |
|---|---|---|
| established fact, with its proof command | ✅ `ESTABLISHED` | only if the parent can lean on it |
| tried-and-rejected path, with its reason | ❌ `INVALIDATED` | only if a **parent premise** falls; otherwise the rejection dies with the Trace |
| "the scope I was given is wrong" | 🆕 `SURFACED` | always — the parent wasn't already carrying this problem |
| file produced | 📦 `DELIVERABLE` | only if its existence changes something above; by path, never by content |

## Redirect

A REPORT→WORK redirect is decided by whether the **closure** changes:

- closure unchanged → **same ring**, Brief untouched; the correction becomes a Trace entry (`pivot` or `constraint`) in the vehicle's own file — an ordinary `team` redirect, no `ring` skill involved.
- closure changed → close this ring (❌ `INVALIDATED` or 🆕 `SURFACED`), then a **new** `/open` — step 8 above proposes the command, `/close` never runs it. `--agent` may name the same team agent.

## Closing sweep

`ring.py sweep --opened <ISO> --prefix <create:∪writes:>... --root <root>... [--exclude ...] --ring-file <path>` wraps:

```bash
# 1. inventory — what was born or touched inside each claimed prefix since opened
/usr/bin/find "<prefix without trailing />" -newermt "<opened ISO>" -type f

# 2. leak — what was born or touched elsewhere under the root during the ring's window
/usr/bin/find "<root>" -newermt "<opened ISO>" -type f \
  -not -path "<prefix1>/*" -not -path "<prefix2>/*" \
  -not -path "<ring file path>" \
  -not -path "*/.git/*" -not -path "<root>/.tmp/*" -not -path "*/build/*"
```

Always `/usr/bin/find`, never bare `find` (shimmed to `bfs`; `-newermt` there silently returns 0 lines). Paths go in after `realpath` (`/praxis` is a symlink `find` won't follow). `opened` in ISO UTC — at day granularity the sweep drags in everything since midnight.

Detection is **temporal, not causal**. Inventory 1 is a read of the real shape of the data plane: whatever bites above must already be an `ESTABLISHED` `DELIVERABLE` line — it is not itself proof of anything. Review list 2 is a **list to look at**, never a list of violations: it cannot tell "this ring wrote it" from "something else wrote it during this ring's window" (a sibling ring, Mat in another pane).

Default root: `realpath` of the ring directory's parent. `--root` is repeatable to widen it; `/close` warns if a claimed prefix sits outside every root given — a leak outside all roots passes in silence.

## Output

Verdict; Delta lines read with their reformulation; inventory; review list; file(s) written; redirect proposal if any.

## Files written

The parent's own file (`## Log` / `## Established` / `## Open`, plus the parent's own Delta line if the fact bites further up). The child's file (header fields, Trace removed, `mv` to `done/`). No deliverable file, ever — `/close` writes control-plane files only.

## Known limitations

- The sweep is temporal, not causal, and only sees under the root(s) given.
- An interrupted `subagent` leaves nothing recoverable — there is no file to resume from.
- The effect filter applied to a sub-agent's report is a parent judgment, not a computation.
- If the parent of a `subagent` ring has no file itself (an `inline` parent not yet promoted), the sub-agent's result only lives in the conversation; typing it can trigger the parent's own promotion if it yields a parent Delta line, otherwise it is lost with the session.
- `/goal` does not survive its session; GOAL mode is out of v1.
- The mechanical `/close` driven by ckpt `↑` markers is v2, not this skill.
