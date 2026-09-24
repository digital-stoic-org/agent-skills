---
name: open
description: 'Open a ring: the parent composes a targeted Brief and descends into a child problem. Use when: open a ring, open, descend, delegate a problem, new sub-problem, start an arc, brief a ring, open a child ring, resume a parked ring, resume an active ring, pick up a ring, take over a ring.'
allowed-tools: [Read, Write, Edit, Bash, Skill, Agent]
argument-hint: "<problem> --parent <slug|root> --vehicle <inline|subagent|session> [--escalade human|parent|irreversible] [--agent <name>] [--dir <path>] [--create <prefix/>...] [--writes <path>...] [--resume <slug>] [--verbose]"
context: main
user-invocable: true
---

# Open

OPEN descends: it composes one Brief, targeted at one child problem, and starts its vehicle. Format and fields: `${CLAUDE_PLUGIN_ROOT}/references/ring-file.md` (cite by path, do not paraphrase it here). Vehicle rules the child must follow: `${CLAUDE_PLUGIN_ROOT}/references/carrier.md`.

**Rules.** Absolute paths only. Disk commands go through `/usr/bin/find`, `/usr/bin/grep`, or `python3 ${CLAUDE_PLUGIN_ROOT}/scripts/ring.py` — the bare commands are shimmed and fail silently. No git verb, ever. No `.bak` files. A question to Mat is plain text, asked once, choices A/B/C when it's a choice — never an interactive question tool.

## Arguments

| Argument | Value | Required | Default |
|---|---|---|---|
| free text | the problem to settle | yes | — |
| `--parent` | slug or `root` | yes | current ring in the conversation, else ask |
| `--vehicle` | `inline` \| `subagent` \| `session` | no | `inline` — cheapest: no file, no agent, human carries it; natural-language intent parses first ("with a sub agent" → `subagent`) |
| `--escalade` | `human` \| `parent` \| `irreversible` | no | `irreversible` for `session`, `parent` for `subagent` |
| `--agent` | name of a team agent | if `session` | — |
| `--dir` | absolute rings folder | no | chain: parent's file folder if already known in this conversation → `dir:` in `${CLAUDE_PROJECT_DIR}/.claude/ring.local.md` → cwd (`realpath`); never asked |
| `--create` | absolute prefix ending `/`, repeatable | if the ring will create files | derived from the deliverable path named in the request |
| `--writes` | absolute path — existing file or prefix ending `/`, repeatable | no | — |
| `--resume` | slug of a `parked` **or** `active` ring | no | — |
| `--verbose` | flag | no | off — default output is one or two plain-language sentences |

**Inference.** Cost scales with how far the Brief travels, not per field.

- `inline` — the Brief stays in the human's own conversation, correctable next turn: infer `--vehicle`, `--dir`, `--create`, `closure` freely, echo the result in the output, ask nothing.
- `subagent` / `session` — the Brief leaves for an agent with no channel back: infer the same fields, but confirm **`closure` alone**, one line ("ok" suffices) — never re-ask the others.
- `session` without `--agent` is still always a question (V6): nothing infers an agent name.
- Whatever is genuinely underivable after inference (typically `--agent`, or `closure` with no candidate anywhere in the request) goes into the **one** plain-text message at step 2.

## Inputs read

The parent's ring file, if it has one. `${CLAUDE_PROJECT_DIR}/.claude/ring.local.md`, if it exists — its `dir:` line feeds the `--dir` default chain; absent means no project default. `ring.py scan <dir>` (all rings, root + `done/`). `ring.py collide <dir> --slug <candidate> --parent <parent slug> --create ... --writes ...` for the candidate — `--parent` is mandatory, without it the lineage exception is off and a legal child is refused. Every `ring.py` call in this skill means `python3 ${CLAUDE_PLUGIN_ROOT}/scripts/ring.py` (do not read its source).

## Steps

1. **Resolve the parent.** Search directory for this step = `--dir` if given, else the folder of the parent's file if this conversation already knows its path (it carries the parent, or just promoted/synced it), else `dir:` from `${CLAUDE_PROJECT_DIR}/.claude/ring.local.md`, else cwd (`realpath`). `root`, or glob `ring-<slug>-llm.md` in that directory then `<dir>/done/` (`ring.py scan` gives this). Not found → accept a **phantom node** with a warning — unless this parent is `inline`, unpromoted, and carried by this conversation, in which case step 7 is about to promote it and the warning is skipped: expected, not an error, either way.
2. **Fix `<dir>`, infer, and collect.** `<dir>` = the parent's folder if step 1 found a parent file, else the directory step 1 already searched — never re-derived, no circularity — with any trailing `/done` stripped (a parked parent's folder is `done/`; the rings folder is its parent). Infer `--vehicle`, `--create`, `closure` per § Arguments; `inline` echoes the result in the eventual output, `subagent`/`session` confirm `closure` alone. Whatever is still genuinely underivable goes into **one** plain-text message to Mat.
3. **Compose the Brief** from the **direct** parent only, never the arc: `Inherited context` limited to what bites *here* (an exhaustive brief is a failed brief), `Constraints`, `Out of scope`, `closure`, `escalade`, `Input artifacts` (absolute paths). This is a high-judgment step — do it here, in the main context, not delegated.
4. **Name.** Slug: 2–4 words, kebab-case, lowercase, no accents, names the **problem** — not the deliverable, not the gesture. Check uniqueness against `ring.py scan` (root + `done/`).
5. **Validate** — table below, including V15's parent-carrier check. A refusal stops everything, writes nothing, and states why in one sentence.
6. **Write `${CLAUDE_PROJECT_DIR}/.claude/ring.local.md` if warranted.** Only now that validations have passed (a refusal writes nothing): if `<dir>` was resolved via the cwd leg of the chain — no `--dir`, no parent folder, no `ring.local.md` `dir:` — and the file does not exist yet, write one line `dir: <cwd>` and say so in one sentence. The only time this skill writes that file.
7. **Promote the parent if needed.** Right after validations pass, before any vehicle launches: if the parent is an `inline` ring, not yet promoted, and carried by this conversation, `Skill(skill: "ring:sync", args: "<parent slug> --dir <dir>")` creates its file — `<dir>` being the value fixed at step 2, so sync promotes into the same folder the child resolved.
8. **Write per vehicle** — table below. `opened` = now, ISO UTC (`YYYY-MM-DDTHH:MM:SSZ`); `saved` = same value.
9. **Register the child at the parent.** If the parent has a file (its own, or the one step 7 just created) — carrier permission already checked at V15: replace a `children: —` line if one exists, else append `children: <slug> opened=<ISO>`, `<ISO>` being this ring's own `opened` value. This is the parent editing its own file — not the child writing to the parent (`${CLAUDE_PLUGIN_ROOT}/references/carrier.md` forbids that, not this).
10. **Output** — see below.

## Validations (refuse and stop)

| # | Check | Outcome |
|---|---|---|
| V1 | `closure` non-empty | refuse — without it the ring never closes |
| V2 | `Inherited context` non-empty | refuse |
| V3 | every `create:`, `writes:`, `Input artifacts` entry is absolute; `create:` ends `/`; `writes:` ends `/` or names an existing file | refuse, name the offending path |
| V4 | `--vehicle resumed` | refuse — `resumed` is never chosen, only constated by promotion |
| V5 | `subagent` × `human` or `subagent` × `irreversible`, **explicitly requested** | refuse — a sub-agent cannot question mid-flight |
| V6 | `session` without `--agent` | ask Mat (step 2) |
| V7 | `ring.py collide` on the candidate, **with `--parent`** | the output is the full pairwise set: keep only pairs where `a` or `b` is the candidate slug; refuse if any of those has `relation: none` (collision outside lineage) and list them. Pre-existing pairs not involving the candidate → report them as a warning, never a refusal |
| V8 | `subagent`: every requested `create:`/`writes:` prefix included in a claim of the parent | refuse → "the parent must surface a 🆕 SURFACED first"; if the parent has no file either, warn it is unverifiable instead of refusing blind — unless step 7 is about to promote that exact parent, in which case skip the warning |
| V9 | `subagent` requested while the parent's own carrier is itself a sub-agent | refuse (depth cap of 2) — only checkable when known in the conversation |
| V10 | slug already taken (root or `done/`) | refuse; if it's `parked`, suggest `--resume` |
| V11 | parent found with `status: done` | refuse — never open under a closed ring |
| V12 | `Budget` filled in | warn: ignored in v1 (GOAL is v2) |
| V13 | `session` | one-line reminder: a reused team agent carries the context of its earlier rings (Mat manages agent reuse and `/clear` by hand) |
| V14 | `subagent` requested with `--parent root` | refuse — "open an `inline` arc first" (a parentless arc has no file to receive anything) |
| V15 | the parent has a file whose `carrier:` is neither absent, `—`, nor this conversation's token | refuse — "the parent's pen is held by `<x>`; `/open --resume <parent>` first" |

## Warnings (do not stop)

| Check | Message |
|---|---|
| a child's `create:` **equals** (after `realpath`) a `create:` already held by its parent | warn: total withdrawal, not partial delegation — the parent may not create there again until this child `/close`s |

## Write per vehicle

| Vehicle | Ring file | Action |
|---|---|---|
| `inline` | none (B§4 l.168) | hold the ready-to-write block (header with `vehicle: resumed` + `## Brief`) internally — never printed directly; `/ring:sync` writes it verbatim at promotion |
| `subagent` | none | launch the sub-agent **in the foreground** (never background — a backgrounded sub-agent gets a reduced toolset and fails silently) with a prompt built from the Brief as a delegation contract (`question`→objective, `closure`→output format, `Inherited context`→briefing, `Constraints`+`Out of scope`→boundaries), plus: "extract facts, each with the command that proves it; list every file you created or modified; do not type or judge effects" |
| `session` | created in `<dir>`, header + `## Brief` + empty `## Trace` + empty `## Delta` only, per `references/ring-file.md` skeleton, `children: —`, `carrier: <agent>` | then invoke `team:brief` — see below |

## `session` → invoking `team:brief`

`/open` builds the **complete** MANDATE fields itself — `team:brief` infers and reads nothing, so nothing is left for it to ask:

| MANDATE field | Value `/open` builds |
|---|---|
| `scope` | "You carry ring `<slug>`: {question}." + the negative half from `Out of scope` |
| `orchestrator` | the name of the agent running `/open` (the parent's carrier) |
| `owned_paths` | `[ring file]` ∪ `create:` ∪ `writes:` (§4.4) |
| `hands_off` | the parent's ring file, and the other ring files in `<dir>` |
| `read_first` | 1. the ring file · 2. the absolute path of `carrier.md` (expand `${CLAUDE_PLUGIN_ROOT}/references/carrier.md` before writing the mandate — never emit the variable) · 3. `Input artifacts` |
| `deliverable` | the absolute path of the ring file |
| `knowledge_state` | `Inherited context` split into established / hypothesis / to_discover |
| `stop_conditions` | "closure reached: {closure}" · "you discover the scope is wrong" · "before every REPORT, reread your closure; if it no longer describes what you are doing → QUESTION" · the escalade line below |
| `cadence` | per escalade, below |
| `what_i_do_not_know` | mandatory, never empty |

Escalade → `stop_conditions` add-on and `cadence`:

| Escalade | extra `stop_conditions` | `cadence` |
|---|---|---|
| `human` | "you would post a 🆕 SURFACED line → QUESTION to the human instead" | per the Brief |
| `parent` | "you posted a 🆕 SURFACED line in your ring file → REPORT" | per the Brief |
| `irreversible` | "you posted a 🆕 SURFACED line in your ring file → REPORT" | "stop and wait before each point of no return: {list}" |

Then call `Skill(skill: "team:brief", args: <the fields above, formatted for its MANDATE skeleton>)`. `team:brief` appends its own five verbatim role lines and sends the single `SendMessage` — `/open` does not send anything itself.

Known contradiction, accepted for v1 (not fixed here): `team`'s own role line 3 routes "scope you were given is wrong" to QUESTION-to-human regardless of `escalade: parent`, so `session × parent` does not fully take Mat out of the loop for that one case.

## `--resume <slug>`

Accepts a `parked` ring in `done/` (v0.1.0 behavior: moves it to the root, sets `status: active`) **or** an `active` ring already at the root (stays at the root, `status` unchanged). Either way: updates `vehicle` and `saved`, **never touches `## Brief`**, re-runs V7 on its existing claims, writes the carrier token per the table below, and — if `vehicle: session` — invokes `team:brief` exactly as above.

| `carrier:` found on the target file | Effect |
|---|---|
| `—` or absent (no one holds the token) | write `carrier: <new holder>` — `<agent>` if the resumed `vehicle` is `session`, else this conversation's own token, reused if it already holds one and minted only if it holds none (`${CLAUDE_PLUGIN_ROOT}/references/ring-file.md` §2 `carrier` row) |
| equals this conversation's own token | unchanged, resume proceeds |
| any other value | ask Mat: A) take over — same write as the `—` row above B) stop — never resume silently over another holder |

## Output

**Default.** One or two ordinary sentences: the problem opened, its vehicle, where it may write, its closure. For `session`, also whether the mandate reached `team:brief` and to which agent. Plus warnings, if any, one sentence each. Nothing already in the ring file gets reprinted — not the `## Brief` block, not the human position, not the `opened` instant (it now persists on the parent's `children:` line instead).

**`--verbose` adds.** The Validations trail (V1-V15), the raw `collide` output, the resulting human position (derived from vehicle × escalade — see `${CLAUDE_PLUGIN_ROOT}/references/carrier.md` and `${CLAUDE_PLUGIN_ROOT}/references/ring-file.md` §8), and the `## Brief` block.

## Files written

The ring file (`session` only). The parent's own header (`children:` line, with `opened=`) — only under the step 9 condition, which may itself follow a step-7 promotion that creates the parent's file (two files written in that case; name both when `--verbose`). `${CLAUDE_PROJECT_DIR}/.claude/ring.local.md` — only once, only under the step 6 condition. Nothing else.

## Known limitations

- `inline` and `subagent` rings are invisible to `ring.py collide` until an `inline` promotes.
- Promotion of an `inline` parent is tooled via `/ring:sync`, triggered by this skill at step 7 when the parent is carried by this conversation; promoting one by hand outside that path still calls `/ring:sync` — never a manual file write.
- `/goal` lives only in the session where it's set; a ring picked up in another session loses its goal. GOAL is out of scope for v1.
- The depth cap (sub-agent tree ≤ 2) is only checkable when the conversation knows its own carrier is a sub-agent (V9).
- A reused team agent carries context this Brief does not control.
