---
name: open
description: 'Open a ring: the parent composes a targeted Brief and descends into a child problem. Use when: open a ring, open, descend, delegate a problem, new sub-problem, start an arc, brief a ring, open a child ring, resume a parked ring.'
allowed-tools: [Read, Write, Edit, Bash, Skill, Agent]
argument-hint: "<problem> --parent <slug|root> --vehicle <inline|subagent|session> [--escalade human|parent|irreversible] [--agent <name>] [--dir <path>] [--create <prefix/>...] [--writes <path>...] [--resume <slug>]"
context: main
user-invocable: true
---

# Open

OPEN descends: it composes one Brief, targeted at one child problem, and starts its vehicle. Format and fields: `/repos/agent-skills/ring/references/ring-file.md` (cite by path, do not paraphrase it here). Vehicle rules the child must follow: `/repos/agent-skills/ring/references/carrier.md`.

**Rules.** Absolute paths only. Disk commands go through `/usr/bin/find`, `/usr/bin/grep`, or `python3 ${CLAUDE_PLUGIN_ROOT}/scripts/ring.py` — the bare commands are shimmed and fail silently. No git verb, ever. No `.bak` files. A question to Mat is plain text, asked once, choices A/B/C when it's a choice — never an interactive question tool.

## Arguments

| Argument | Value | Required | Default |
|---|---|---|---|
| free text | the problem to settle | yes | — |
| `--parent` | slug or `root` | yes | current ring in the conversation, else ask |
| `--vehicle` | `inline` \| `subagent` \| `session` | yes | none — ask; it fixes where Mat stands (§ Escalade below) |
| `--escalade` | `human` \| `parent` \| `irreversible` | no | `irreversible` for `session`, `parent` for `subagent` |
| `--agent` | name of a team agent | if `session` | — |
| `--dir` | absolute rings folder | no | the parent file's folder; for an arc, ask |
| `--create` | absolute prefix ending `/`, repeatable | if the ring will create files | — |
| `--writes` | absolute path — existing file or prefix ending `/`, repeatable | no | — |
| `--resume` | slug of a `parked` ring | no | — |

Never infer `--parent`, `--vehicle`, `--agent`, `--dir` or `closure` from the surrounding conversation beyond the current ring already known in it. Bare/missing → ask.

## Inputs read

The parent's ring file, if it has one. `ring.py scan <dir>` (all rings, root + `done/`). `ring.py collide <dir> --slug <candidate> --parent <parent slug> --create ... --writes ...` for the candidate — `--parent` is mandatory, without it the lineage exception is off and a legal child is refused. Every `ring.py` call in this skill means `python3 ${CLAUDE_PLUGIN_ROOT}/scripts/ring.py` (do not read its source).

## Steps

1. **Collect.** Everything missing — parent, vehicle, agent name, dir, closure — goes into **one** plain-text message to Mat. Nothing inferred beyond the current parent already visible in the conversation.
2. **Resolve the parent.** `root`, or glob `ring-<slug>-llm.md` in `<dir>` then `<dir>/done/` (`ring.py scan` gives this). Not found → accept a **phantom node** with a warning: an unpromoted `inline` parent has no file, so this is expected, not an error.
3. **Compose the Brief** from the **direct** parent only, never the arc: `Inherited context` limited to what bites *here* (an exhaustive brief is a failed brief), `Constraints`, `Out of scope`, `closure`, `escalade`, `Input artifacts` (absolute paths). This is a high-judgment step — do it here, in the main context, not delegated.
4. **Name.** Slug: 2–4 words, kebab-case, lowercase, no accents, names the **problem** — not the deliverable, not the gesture. Check uniqueness against `ring.py scan` (root + `done/`).
5. **Validate** — table below. A refusal stops everything, writes nothing, and states why in one sentence.
6. **Write per vehicle** — table below. `opened` = now, ISO UTC (`YYYY-MM-DDTHH:MM:SSZ`); `saved` = same value.
7. **Register the child at the parent.** Only if the parent has a file **and** this `/open` is running in that parent's own carrier: append `children: <slug>` to the parent's header. This is the parent editing its own file — not the child writing to the parent (§2.3 of the spec forbids that, not this).
8. **Output** — see below.

## Validations (refuse and stop)

| # | Check | Outcome |
|---|---|---|
| V1 | `closure` non-empty | refuse — without it the ring never closes |
| V2 | `Inherited context` non-empty | refuse |
| V3 | every `create:`, `writes:`, `Input artifacts` entry is absolute; `create:` ends `/`; `writes:` ends `/` or names an existing file | refuse, name the offending path |
| V4 | `--vehicle resumed` | refuse — `resumed` is never chosen, only constated by promotion |
| V5 | `subagent` × `human` or `subagent` × `irreversible`, **explicitly requested** | refuse — a sub-agent cannot question mid-flight |
| V6 | `session` without `--agent` | ask Mat (step 1) |
| V7 | `ring.py collide` on the candidate, **with `--parent`** | the output is the full pairwise set: keep only pairs where `a` or `b` is the candidate slug; refuse if any of those has `relation: none` (collision outside lineage) and list them. Pre-existing pairs not involving the candidate → report them as a warning, never a refusal |
| V8 | `subagent`: every requested `create:`/`writes:` prefix included in a claim of the parent | refuse → "the parent must surface a 🆕 SURFACED first"; if the parent has no file either, warn it is unverifiable instead of refusing blind |
| V9 | `subagent` requested while the parent's own carrier is itself a sub-agent | refuse (depth cap of 2) — only checkable when known in the conversation |
| V10 | slug already taken (root or `done/`) | refuse; if it's `parked`, suggest `--resume` |
| V11 | parent found with `status: done` | refuse — never open under a closed ring |
| V12 | `Budget` filled in | warn: ignored in v1 (GOAL is v2) |
| V13 | `session` | one-line reminder: a reused team agent carries the context of its earlier rings (Mat manages agent reuse and `/clear` by hand) |

## Write per vehicle

| Vehicle | Ring file | Action |
|---|---|---|
| `inline` | none (B§4 l.168) | print, in the conversation, the ready-to-write block (header with `vehicle: resumed` + `## Brief`) that a later promotion will use verbatim |
| `subagent` | none | launch the sub-agent **in the foreground** (never background — a backgrounded sub-agent gets a reduced toolset and fails silently) with a prompt built from the Brief as a delegation contract (`question`→objective, `closure`→output format, `Inherited context`→briefing, `Constraints`+`Out of scope`→boundaries), plus: "extract facts, each with the command that proves it; list every file you created or modified; do not type or judge effects" |
| `session` | created in `<dir>`, header + `## Brief` + empty `## Trace` + empty `## Delta` only, per `references/ring-file.md` skeleton, `children: —` | then invoke `team:brief` — see below |

## `session` → invoking `team:brief`

`/open` builds the **complete** MANDATE fields itself — `team:brief` infers and reads nothing, so nothing is left for it to ask:

| MANDATE field | Value `/open` builds |
|---|---|
| `scope` | "You carry ring `<slug>`: {question}." + the negative half from `Out of scope` |
| `orchestrator` | the name of the agent running `/open` (the parent's carrier) |
| `owned_paths` | `[ring file]` ∪ `create:` ∪ `writes:` (§4.4) |
| `hands_off` | the parent's ring file, and the other ring files in `<dir>` |
| `read_first` | 1. the ring file · 2. `/repos/agent-skills/ring/references/carrier.md` · 3. `Input artifacts` |
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

Ring must be `parked` in `done/`. `/open --resume` moves it to the root, sets `status: active`, updates `vehicle` and `saved`, **never touches `## Brief`**, re-runs V7 on its existing claims, and — if `vehicle: session` — invokes `team:brief` exactly as above.

## Output

One verdict line (opened / refused). The ring file path written, or "no file" for `inline`/`subagent`. The resulting human position (derived from vehicle × escalade — see `/repos/agent-skills/ring/references/carrier.md` and spec §2.5). For `session`, the result of sending the mandate. For `subagent`, print the `opened` instant — `/close` needs it for the sweep.

## Files written

The ring file (`session` only). The parent's own header (`children:` line) — only under the step 7 condition. Nothing else.

## Known limitations

- `inline` and `subagent` rings are invisible to `ring.py collide` until an `inline` promotes.
- Promotion of `inline` is not tooled: the carrier writes the file from the block `/open` printed at step 6.
- `/goal` lives only in the session where it's set; a ring picked up in another session loses its goal. GOAL is out of scope for v1.
- The depth cap (sub-agent tree ≤ 2) is only checkable when the conversation knows its own carrier is a sub-agent (V9).
- A reused team agent carries context this Brief does not control.
