# The ring file format

This is the only place in the plugin that describes the ring file format. The four skills point at this file by path instead of repeating it.

## 1. Naming and layout

```
ring-{slug}-llm.md
```

| Part | Rule |
|---|---|
| `ring-` | fixed, greppable prefix |
| `{slug}` | kebab-case, 2 to 4 words, lowercase, no accents; names the **problem**, never the deliverable or the gesture |
| `-llm` | Praxis suffix for "token-optimized context" |

🔒 **Flat layout plus a `parent:` field.** Active rings live at the root of the rings folder. `parked` and `done` rings live in a `done/` subfolder. Nested folders are rejected — the ring tree has gaps in it, and a `mv done/` would otherwise carry a whole live subtree with it.

```
<rings-folder>/
├── ring-parent-example-llm.md      # arc, parent: root
├── ring-child-example-llm.md       # leaf, parent: parent-example
└── done/
    └── ring-old-one-llm.md         # status: done | parked
```

🔒 The rings folder lives in the control plane (per the project's own control/data split — e.g. under `/praxis/...` in this project), never in the data repo.

## 2. Header fields

Format is `key: value`, one field per line, before the first `---`, with no YAML fence around it.

🔒 **Multivalued fields (`create`, `writes`, `children`) repeat, one line per value** — `create: /a/` then `create: /b/` — never an indented YAML list. Collision and anomaly detectors grep `^create:` / `^writes:` line by line and would miss a list. For `children:`, detectors read `^children:` and take the **first whitespace-separated token** as the slug — a second token, if present, must be `opened=<ISO>` (see the `children` row below).

Legend: **M** mandatory · **O** optional · **D** derived, never hand-maintained.

| Field | M/O/D | Value | Rule |
|---|---|---|---|
| `ring` | **M** | the slug | identity; must equal the file name stripped of `ring-`/`-llm.md` |
| `question` | **M** | one sentence stating the problem to settle, free form | not an interrogative sentence — that constraint was dropped; the field name stays |
| `parent` | **M** | the direct parent's slug, or `root` | resolved by globbing `ring-<slug>-llm.md`, root then `done/` |
| `status` | **M** | `active` \| `parked` \| `done` | 🔒 one exact lowercase token, no emoji or comment; when unsure, `active` |
| `opened` | **M** | ISO `YYYY-MM-DDTHH:MM:SSZ` (UTC) | date the **problem** opened, not the file's appearance; a promoted `inline` ring keeps the instant of its original `/open` |
| `saved` | **M** | ISO `YYYY-MM-DDTHH:MM:SSZ` (UTC) | rewritten at every Delta line posted |
| `vehicle` | **M** | `inline` \| `subagent` \| `session` \| `resumed` | 🔒 the **current** vehicle; `subagent` never appears in a file, since such a ring has none |
| `carrier` | O | the current holder of the write token, or `—` | 🔒 mono-valued; who may write this file **right now**, distinct from `vehicle` (what carries the ring). 🔒 **One token per conversation.** A conversation that already holds a token (from an earlier `/open --resume`, `/ring:sync`, or `/open` auto-promoting an unpromoted `inline` parent) reuses that same one everywhere it acts; it mints a fresh one only when it holds none. A fresh mint is `conv-<YYYYMMDDTHHMMSSZ>` (the instant it took the token) unless the conversation has its own agent name, in which case that name is the token. For `vehicle: session`, the value is always the `team` agent name — including across a `--resume`, never a `conv-` token. `—` when nobody holds it (`parked`, `done`). Absent entirely on a v0.1.0 file — no anomaly for that; held (non-`—`) on a `status: done` file **is** an anomaly. This row is the single statement of the rule; the skills cite it rather than restating it. See §5 for the gestures that set it |
| ~~`owner`~~ | removed | — | replaced everywhere by `writes:` |
| `goal` | O | one sentence, the target state | distinct from `question` |
| `focus` | O | 1-2 sentences, where attention currently is | |
| `closed` | O | ISO `YYYY-MM-DDTHH:MM:SSZ` (UTC) | set by `/close` when `status` becomes `done`; never an empty key at open |
| `children` | O | one line per child: `<slug>` or `<slug> opened=<ISO>`, or `—` if none | written by the **parent** in its **own** file; the only trace of children that have no file of their own. `opened=` is written by `/open` when it registers the child on the parent — it is the fileless child's only durable record of when its problem opened; v0.1.0 lines with no suffix stay valid |
| `create` | **M if the ring writes** | absolute prefix, ending in `/`, one line per prefix | 🔒 the containers where files may be **born**; exclusive (§6) |
| `writes` | O | absolute path, one line per value: either an **existing file**, or a prefix ending in `/` | 🔒 the right to **modify** an existing file; exclusive (§6). Two rings can modify two distinct files in the same folder this way |
| `depth` | **D** | integer | never write it by hand; recomputed by walking `parent` |
| ~~`predecessor`~~, ~~`sessions`~~, ~~`lines`~~ | removed | — | write-only, or out of solo mode |

🔒 A ring file never declares itself in its own `create:` or `writes:`. Its own right to be written follows from "one ring file, one writer, its current vehicle" (README, "The four vehicles"), and for `session` it lands in the mandate's `owned_paths` instead.

## 3. Body sections

| Section | M/O | Content |
|---|---|---|
| `## Brief` | **M** | the sub-fields below, frozen at `/open` |
| `## Trace` | **M** (may be empty at open) | verbatim `t{nn}` entries; removed at `/close` |
| `## Delta` | **M** | typed lines; for the arc, typed lines like any ring — `/close` folds them into its own `Established`/`Open` instead of crossing to a parent (§5) |
| `## Established` | O, every ring, omitted if empty | what holds, accumulated from children's Deltas |
| `## Open` | O, every ring, omitted if empty | what is pending |
| `## Log` | O, every ring, omitted if empty | the lineage: which child was opened when, with what verdict came back (table: Date · Ring · Verdict) |
| `## Rejected` | O, omitted if empty | a path tried and why it fell, same rule as the others |
| `## Next` | O | tasks; the heading is exactly `## Next` |
| `## Hot Files` | O | `[P1\|P2] <absolute path> → <semantic anchor>`, never a line number, 10 at most |
| `## Drop` | O | noise not to chase again |

`## Deliverables` (a derived view over an authority index) is out of v1.

**Brief sub-fields**

| Sub-field | M/O | Role |
|---|---|---|
| `Inherited context` | **M** | what the parent knows **and** that bites here, nothing more; an exhaustive brief is a failed brief |
| `Constraints` | O | hard rules |
| `Out of scope` | O | named temptations; the boundary is still default-deny |
| `closure` | **M** | the criterion by which this is recognized as settled; without it the ring never closes |
| `escalade` | **M** (default set by `/open`) | `human` \| `parent` \| `irreversible` — see §8 below |
| `Input artifacts` | O | absolute paths readable as input |
| `Budget` | O | GOAL mode only, **ignored in v1**; `/open` warns if filled in |

## 4. Complete skeleton

```markdown
ring: {slug}
question: {one sentence stating the problem to settle — free form}
parent: {parent slug | root}
status: active
opened: {YYYY-MM-DDTHH:MM:SSZ}
saved: {YYYY-MM-DDTHH:MM:SSZ}
vehicle: {inline|session|resumed}
carrier: {optional — current write-token holder, or — when nobody holds it}
goal: {optional — one sentence, the target state}
focus: {optional — 1-2 sentences}
children: {slug} opened={YYYY-MM-DDTHH:MM:SSZ}
create: {ABSOLUTE prefix ending in / — one line per prefix — M if the ring writes}
writes: {ABSOLUTE path — an existing file, or a prefix ending in / — one line per value — omit if none}

---

## Brief

**Inherited context** — {what the parent knows AND what bites here}
**Constraints** — {hard rules}
**Out of scope** — {named temptations}
**closure** — {how we know it is settled}
**escalade** — {human|parent|irreversible}
**Input artifacts** — {absolute paths}

## Trace

- **t01** · {YYYY-MM-DD} · `{clause}` {↑ if it bites above}
  > {verbatim, uncorrected}

## Delta

- ✅ **ESTABLISHED** ← t01 · {rephrased in the parent's terms}

## Established

## Open

## Log

| Date | Ring | Verdict |
|---|---|---|

## Next

- [ ] {task}

## Hot Files

- [P1] {absolute path} → {semantic anchor}

## Drop

- {noise not to chase again}
```

`Established`, `Open`, `Log`, `Rejected`, `Next`, `Hot Files` and `Drop` are **omitted** while empty; the skeleton shows them for reference. `/open` writes only the header, `## Brief`, an empty `## Trace` and an empty `## Delta`. `closed:` is only ever added by `/close`.

## 5. Lifecycle

`/open` creates a ring `active`; from there, Trace and Delta accumulate while its vehicle holds the pen. `/close --park` moves it to `parked`; `/open --resume` brings a `parked` ring back to `active`. `/close` on an `active` or `parked` ring moves it to `done`, either because its closure was reached or because it was reoriented (§7) or abandoned.

🔒 `parked` and `done` both live in `done/`; only `active` stays at the root. 🔒 `parked` means "resumable," `done` means "no more resuming." 🔒 A `parked` ring **keeps** its `create:` and `writes:` claims — only `status: done` releases them, not the `mv` into `done/` by itself.

**`/ring:sync`.** An `inline` ring has no file until something writes one; `/ring:sync` is that write, called twice over. First call, no file yet: **promotion** — it creates the file, `opened` set to the instant of the original `/open`, `carrier:` set to the calling conversation's token (§2). Every later call on the same ring: a **checkpoint** — it rewrites Trace, Delta, `## Established`, `## Open`, `## Log`, `## Next`, `## Hot Files`, `## Drop`, and bumps `saved:`. It never touches `## Brief`, `ring`, `parent`, `opened`, `status`, `vehicle`, `create:` or `writes:` — `status` and `vehicle` are constated, never parameters of any skill, and a ring never widens or reworks its own scope by way of a sync. A checkpoint refuses unless the file's `carrier:` **equals** the calling conversation's token: absent, `—`, or any other value all refuse — nobody, or somebody else, is holding the pen. The fix in every refusal case is the same: `/open --resume` takes the token first, then `/ring:sync` proceeds.

**`--resume` of an `active` ring is a token take-over, not a state change.** `status` stays `active` (it never touched `parked`); the file already exists; what moves is `carrier:`, from whoever held it to the resuming conversation's token. This is the same gesture as `--resume` of a `parked` ring turning it `active` — both write a fresh `carrier:` — except here `status` doesn't change at all, only the pen does.

**Arc fold at `/close`.** A ring with `parent: root` (an arc) has no parent file to pour its Delta into. At `/close`, its own accumulated Delta lines fold into its **own** `## Established` / `## Open` instead of crossing to a parent — the file still moves to `done/`, but the record of what it settled stays inside itself rather than traveling anywhere. This is the only case where `/close` writes `## Established`/`## Open` from the closing ring's own Delta rather than from a child's.

## 6. Write rights

| Right | Lives in | Rule |
|---|---|---|
| read | nowhere | free; a mandate's `read_first` budgets it, never partitions it |
| create | `create:` | 🔒 exclusive: no other living ring claims a prefix that contains it or is contained by it |
| modify (write) | `writes:` | 🔒 exclusive, one deliverable, one writer |

🔒 The two fields stay distinct because creating is not modifying: `create:` governs births, `writes:` governs modifying a file that already exists, and a ring may legitimately modify a deliverable outside its own `create:`.

🔒 **Births are exclusive at folder granularity, and this is intentional.** `create:` only ever names a prefix (§2) — never a single file the way `writes:` can — so an inclusion between two unrelated `create:` claims is total: two rings with no ancestry relation can never each birth a distinct file in the same folder. Modification has file granularity (`writes:` can name one file, leaving siblings free); creation does not. Corollary: **one folder per ring that creates.** A ring that needs to birth files in several folders claims several prefixes; a ring that needs to share a folder with a sibling for creation cannot — split the folder, or have one of the two only `writes:` there. Delegating to a child the **same** prefix as the parent's own `create:` (legal under the lineage exception above) withdraws the parent's create right there **entirely**, not partially, for as long as the child is `active` or `parked` — the parent cannot birth anything in that prefix again until the child closes. `/open` warns at the moment of delegation when a child's `create:` equals (rather than is strictly contained in) the parent's, since that is a total withdrawal, not a partial one.

🔒 **Absolute, non-negotiable.** A relative path resolves against wherever the worker happens to be and creates a phantom tree. Every prefix is normalized with `realpath` before comparison.

🔒 **Birth validation.** Any created file's `realpath` must start with one of the ring's `create:` prefixes.

🔒 **The claim lives on the control side.** No control metadata descends into a deliverable.

⛔ **A ring never widens its own scope.** When it discovers it needs to write elsewhere, it posts a 🆕 `SURFACED` line asking for it; the parent either opens a new ring with the wider scope, or refuses. Scope only grows by a visible decision.

🔒 **Collision detection compares `create:` and `writes:` together, by prefix inclusion, not string equality**, across `active` and `parked` rings, at the root and in `done/`. Two claims `a` and `b`, after `realpath` (and with a trailing `/` when they are prefixes), collide if `a == b` or one starts with the other. A `writes:` naming one file compares as a path with no trailing `/`: it collides with a containing prefix and with the identical file, never with a sibling file in the same folder.

**Lineage exception.** A child that inherits a sub-prefix of its parent's `create:` (e.g. parent claims `/x/`, child claims `/x/sub/`) is not a collision — it is a delegation: while the child is `active` or `parked`, the delegated prefix is withdrawn from the parent's own right to write there. An inclusion between two rings with **no** ancestry relation (siblings, cousins, separate arcs) is a collision, and `/open` refuses it.

## 7. Reorientation

A `team` redirect (REPORT → WORK) is resolved by whether the ring's `closure` changes.

| Case | Ring | Brief | Where the correction goes |
|---|---|---|---|
| closure unchanged | same ring | untouched | a Trace entry, verbatim, clause `pivot` or `constraint` |
| closure changed | old ring closes, a new one opens | new Brief | the old ring's Delta: ❌ `INVALIDATED` (a Brief premise falls) or 🆕 `SURFACED` (a different problem appeared) |

🔒 **Anti-drift guardrail.** Before every REPORT, the carrying agent rereads its own `closure`; if it no longer describes what it is doing, it goes to QUESTION instead of sending the REPORT.

🔒 A `/close` followed by a `/open` is never automatic — the parent decides whether to reopen anything, and a ring never extends its own scope.

## 8. Escalade

`escalade` names where what blocks a ring goes: `human` (Mat stays in the loop, as in `team`'s own default), `parent` (a 🆕 `SURFACED` line goes to the parent, Mat is out of the loop), or `irreversible` (goes to the parent except at named points of no return, which go to Mat). Default is `irreversible` for `vehicle: session`, and `parent` for `vehicle: subagent` (a sub-agent cannot ask a mid-flight question, so `human` and `irreversible` are refused there unless asked for explicitly). Nothing is added to the `team` mandate to carry it: `escalade` is translated into `stop_conditions` and `cadence` when `/open` calls `team:brief`.

## 9. Project defaults

`${CLAUDE_PROJECT_DIR}/.claude/ring.local.md` (the project root — the session's working directory at launch — if the variable is not set) holds per-project defaults, one project, one file — the `.claude/<plugin>.local.md` convention. Absent means no defaults; nothing in the plugin requires it.

**Format.** Flat `key: value`, same shape as a ring file's header, but with **no** closing `---` — the file is header only, there is no body to fence off.

```
dir: {ABSOLUTE path to the rings folder}
root: {ABSOLUTE path — repeatable, one line per root}
root: {ABSOLUTE path}
```

| Field | Cardinality | Rule |
|---|---|---|
| `dir` | one line | the rings folder to default to; last one wins if repeated (malformed input, not a feature) |
| `root` | repeatable | one line per sweep root; accumulates like `create:`/`writes:`/`children:` |

**Who reads it.** `/open` reads `dir:` — it sits in the `dir` resolution chain after `--dir` and the parent file's folder, before falling back to `realpath` of the cwd: `--dir` → parent's folder → `dir:` here → cwd. `/close` reads `root:` — ahead of its own `realpath`-of-the-parent's-folder default. `/ring:sync` reads `dir:`, same position as `/open`.

**Who writes it.** `/open`, and only `/open`, and only once: the moment it has just resolved `dir` by falling all the way through the chain to the cwd because nothing else applied, and the file does not yet exist. In that moment it writes `dir: <cwd>` and says so in one sentence. Every other read leaves the file untouched — no skill ever rewrites `root:`, and no skill rewrites `dir:` once the file exists. Mat edits it by hand from there.

🔒 **`ring.py` never reads this file.** It is a skill-level default, not a parsing input; `scan`/`collide`/`sweep`/`graph`/`resolve-opened` all take their directory as an explicit argument.
