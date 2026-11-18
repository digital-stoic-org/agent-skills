# Drift Rules

The five checks the audit runs over every file. Each produces findings with severity 🔴/🟡/🟠/⚪ and a proposed disposition (move / rename / rewrite / index-update / describe / park / flag-only). All checks are **read-only** — they describe, they never act.

Aging is **relative, not day-counted** — robust across project tempos (a part-time project and a sprint look different on a calendar but the same in shape).

---

## §1 — Misplaced-by-tier (zone-fit)

Does the file's content maturity match the folder it sits in? (zones + tiers: `convention.md`)

**Semantic-folder projects**: apply this check by the folder's **mapped role**, not its name (convention.md §Hybrid role-mapping). A file in `site/` (mapped `ref`-like) gets ref rules; in `journal/` (mapped `wip`-like) gets wip rules. Never propose renaming a semantic folder to a canonical zone — govern by role.

| Symptom | Disposition | Severity |
|---|---|---|
| Finished, shipped deliverable sitting at `wip/` root or project root | graduate → `ref/` (if durable) or leave + mark, ask | 🟡 |
| 🧊 frozen-source raw file living in `wip/` (consumed by a generation, won't change) | move → `src/` + add `source:` frontmatter | 🟡 |
| Raw input (PDF/img/transcript) outside `in/` | move → `in/` + add to MANIFEST | 🟡 |
| Cleaned/structured doc in `in/` (should be canonical) | move → `src/`, keep raw original in `in/` | 🟠 |
| 🟢 pérenne validated content stuck in `wip/` | graduate → `ref/` (HIGH bar — ask) | 🟠 |
| Dormant/abandoned doc in active zone (see §2) | retire → `park/` | 🟡 |
| File at project root that isn't a recognized root artifact (`CLAUDE.md`, `INDEX.md`, `tasks.md`, `CONTEXT-*-llm.md`, `SWEEP.md`, `01-<project>.md`) | route to its zone | 🟠 |

Recognized **root-level** files (leave in place): `CLAUDE.md`, `INDEX.md`, `tasks.md`, `SWEEP.md`, `README.md`, `NN-<project>.md`, and `CONTEXT-*-llm.md` for **active** streams.

---

## §2 — Staleness / Aging (relative)

No fixed day thresholds. Flag by relative + structural signals:

| Signal | How to detect | Disposition | Severity |
|---|---|---|---|
| **Sync-conflict twin** | filename contains `.sync-conflict-`, `(conflicted copy)`, ` (1)`, ` (2)`, or `~$` | park the twin, keep canonical; flag for deletion | 🔴 |
| **Superseded version** | `X.md` + `X-full.md` / `X-v2.md` / `X-final.md` / dated pair where one is strictly newer & richer | park the older; if it's an explicit draft→final, flag for deletion | 🟡 |
| **Closed-stream CONTEXT** | `CONTEXT-<stream>-llm.md` whose stream is done (status header says shipped/closed, or no file in its domain touched recently) | park → `park/` (or `done/` if the project uses it) | 🟡 |
| **Oldest-quartile in active zone** | within `wip/`, files in the oldest 25% by mtime AND with no inbound wikilinks AND not the spine | candidate park — **flag, ask** (cold ≠ abandoned) | 🟠 |
| **MANIFEST-flagged duplicate** | `in/MANIFEST.md` already marks ⚠️ Duplicate | reconcile per manifest note | 🟡 |
| **Stale ref/** | `ref/` file far older than the `src/`/`wip/` facts it summarizes (contradiction check, §SWEEP) | flag for review — don't auto-touch ref | 🟠 |

**Never** infer "abandoned" from age alone — combine age with *no inbound links* + *stream closed*. When uncertain, flag-only.

---

## §3 — Naming & Frontmatter

| Check | Expectation | Disposition | Severity |
|---|---|---|---|
| Naming mixed within a zone | one convention per zone (`convention.md` §Naming, or CLAUDE.md override) | rename + wikilink-repair | ⚪ |
| `src/` file missing `source:` frontmatter | every `src/` file points to `in/` origin or web URL | add `source:` | 🟡 |
| Index/manifest missing `type:` / `updated:` | indexes carry `type:` + `updated:` frontmatter | add | ⚪ |
| Index/manifest missing tier markers | files in a tiered index annotated 🟢/🔵/🟣/🧊/🟡/⚙️ | annotate | ⚪ |
| Date format drift in names | `YYYYMMDD` / `YYYY-MM-DD`, consistent leading/trailing per `convention.md` | rename | ⚪ |
| Binary/source pair mismatch | `.excalidraw` + `-llm.md` / `.pptx` + `.md` naming aligned | rename for pairing | ⚪ |

Every rename **must** pair with a wikilink-repair (grep `[[old-name` across the project, propose updates). A rename without link repair is a 🔴 — never propose it.

---

## §4 — Index / Manifest gaps

| Gap | Detect | Disposition | Severity |
|---|---|---|---|
| `in/` file not in `in/MANIFEST.md` | diff `find in/ -type f` vs MANIFEST rows | add row (status 🆕 if no `src/` twin) | 🟡 |
| Structurant doc absent from `INDEX.md` | P0/P1 candidate (per content) not listed | add to INDEX with priority + axis | 🟡 |
| `INDEX.md` references a moved/renamed/deleted file | resolve each INDEX wikilink/path | fix or remove the row | 🟠 |
| Broken wikilink anywhere | `[[target]]` with no matching file | repair or flag | 🟠 |
| Orphan file (no index, no inbound link, not root artifact) | reverse-link check | index it or park it (ask) | 🟠 |
| `wip/` sprawl, no `wip/00-index.md` | `wip/` has ≳8 loose files or deep subtrees and no index | create `wip/00-index.md` from template | 🟠 |
| **No `INDEX.md` at project root** | project has a stable-zone surface but no root INDEX | create `INDEX.md` from template (priority compass) | 🟡 |
| **File-listing inside `CLAUDE.md`** | CLAUDE.md hand-maintains a folder/file inventory (Axis 0 drift) | propose moving the inventory → `INDEX.md`; leave CLAUDE.md a one-line pointer | 🟡 |
| Existing project-local `SWEEP.md` | present | this skill supersedes it — propose removing it or leaving as legacy note | ⚪ |

---

## §5 — Description / Orientation coverage

Is the project **navigable** — does each doc/folder say what it is? (Axis 4: `convention.md`)

| Check | Expectation | Disposition | Severity |
|---|---|---|---|
| File missing `description:` frontmatter | every non-trivial doc carries `description: <≤12-word what-this-is>` | add `description:` | ⚪ |
| INDEX/wip-index **Résumé empty** for a listed file | every indexed file has a one-line résumé | fill from the file's `description:` frontmatter (or flag if frontmatter also missing) | 🟠 |
| INDEX/wip-index **Résumé stale** | résumé contradicts the file's current `description:` (frontmatter is source of truth) | refresh the mirror from frontmatter | 🟠 |
| Folder (≳5 files) with **no orientation line** | a README or folder-index `purpose:`/`role:` line says what lives there | propose one (flag — don't invent intent) | 🟠 |
| Description is *behavioral* not *descriptive* | descriptions say what-this-is; "always check X" belongs in CLAUDE.md (Axis 0) | flag to move the directive to CLAUDE.md | ⚪ |

Never invent a folder's purpose from filenames alone — when intent is unclear, **flag for the user** rather than write a guessed orientation line.

---

## Severity → action mapping

- 🔴 critical (conflict twins, rename-without-link-repair): top of plan, HIGH confidence to fix.
- 🟡 important (misplaced, missing provenance, manifest gaps): core of the plan.
- 🟠 gap (orphans, stale-ref, sprawl): propose, often needs a judgment call → MED confidence.
- ⚪ minor (cosmetic naming, missing `updated:`): batch, LOW priority, easy to defer.

**Confidence floor**: anything lossy (delete suggestions, draft→final collapse, ref/ promotion) is **always** flag-only — never pre-approved in the plan.
