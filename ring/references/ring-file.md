# The ring file format

This is the only place in the plugin that describes the ring file format. The three skills point at this file by path instead of repeating it.

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

🔒 **Multivalued fields (`create`, `writes`, `children`) repeat, one line per value** — `create: /a/` then `create: /b/` — never an indented YAML list. Collision and anomaly detectors grep `^create:` / `^writes:` line by line and would miss a list.

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
| ~~`owner`~~ | removed | — | replaced everywhere by `writes:` |
| `goal` | O | one sentence, the target state | distinct from `question` |
| `focus` | O | 1-2 sentences, where attention currently is | |
| `closed` | O | ISO `YYYY-MM-DDTHH:MM:SSZ` (UTC) | set by `/close` when `status` becomes `done`; never an empty key at open |
| `children` | O | one slug per line, or `—` | written by the **parent** in its **own** file; the only trace of children that have no file of their own |
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
| `## Delta` | **M** | typed lines; for the arc, one italic line noting it pours into `Established`/`Open` instead of crossing a turn |
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
goal: {optional — one sentence, the target state}
focus: {optional — 1-2 sentences}
children: —
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

## 6. Write rights

| Right | Lives in | Rule |
|---|---|---|
| read | nowhere | free; a mandate's `read_first` budgets it, never partitions it |
| create | `create:` | 🔒 exclusive: no other living ring claims a prefix that contains it or is contained by it |
| modify (write) | `writes:` | 🔒 exclusive, one deliverable, one writer |

🔒 The two fields stay distinct because creating is not modifying: `create:` governs births, `writes:` governs modifying a file that already exists, and a ring may legitimately modify a deliverable outside its own `create:`.

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
