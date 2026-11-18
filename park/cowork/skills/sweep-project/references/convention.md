# Project Folder Convention (canonical)

The reference model `/sweep-project` enforces when a project's `CLAUDE.md` is silent.
A project's own `CLAUDE.md` always wins — this is the fallback + the target for new projects.

Two orthogonal axes. **Zone** = where a file is in its lifecycle (folder). **Tier** = how mature/hot the content is (independent of folder). A file has exactly one zone and one tier.

---

## Axis 0 — CLAUDE.md vs INDEX.md (the two pivot files)

Every project has two distinct pivot files. They answer different questions and **must not duplicate each other**.

| | `CLAUDE.md` | `INDEX.md` |
|---|---|---|
| Answers | "How do I **behave** in this project?" | "What's **here**, and what matters most?" |
| Holds | Role, voice, rules, constraints, naming convention + any per-project overrides | Priority-ranked, cross-zone inventory of stable-zone docs + one-line résumés |
| Job | **Policy** (function context) | **Map** (content navigation) |
| Volatility | Low — changes when policy changes | High — changes whenever a doc is added / moved / parked |
| Maintained by | Human (rarely) | The sweep + ongoing work |

**Rules the sweep enforces:**
- CLAUDE.md carries **policy only**. A hand-maintained file listing inside CLAUDE.md is **drift** — that inventory belongs in `INDEX.md`. The sweep proposes moving it out (see drift-rules §4) and leaving CLAUDE.md with a single pointer line: *"Navigation & priorities → `INDEX.md`."*
- INDEX.md is the **pivotal content-map**. It never carries behavioral policy — those stay in CLAUDE.md.
- If a project has no INDEX.md, the sweep proposes creating one (drift-rules §4); it never folds the map into CLAUDE.md.

---

## Axis 1 — Lifecycle Zones (folders)

| Zone | Marker | Mutability | Content | Rule |
|---|---|---|---|---|
| `in/` | 🔒 | Frozen on arrival | Raw inputs as-received (PDFs, images, messy notes, transcripts). Landing zone. Originals stay forever — audit trail. | Never modify existing. Update `in/MANIFEST.md` on every arrival/processing. |
| `src/` | 🔒 | Frozen once processed | Cleaned/structured form of `in/` inputs. Canonical — wikilink to `src/`, not `in/`. | Never edit unless user says "update src". Must carry `source:` frontmatter pointing to its `in/` origin. |
| `ref/` | 🔒 | Rarely changed | Stable reference docs, templates, durable knowledge. Scaffolding context, frequently consulted. | Never edit unless user says "update ref". Show diff + ask. |
| `wip/` | ✏️ | Changes constantly | All active work. Domain subfolders created **organically** (`wip/engineering/`, `wip/strategy/`, …). Default workspace. | All new files + edits land here. Graduate stabilized content to `ref/`; retire dormant to `park/`. |
| `park/` | 🅿️ | Dormant | Parked / speculative / set-aside / superseded material. | **NEVER read, parse, or factor into reasoning unless the user explicitly references it.** Out of scope by default. |

**Satellite zones** (present in some projects; the sweep *describes* but **never reshuffles** them):

| Zone | What it is | Sweep stance |
|---|---|---|
| `sync/` | External bridge (e.g. Notion). Contains `_manifest.yaml` mapping file ↔ remote page + content hashes. | Read manifest for awareness. **Never move/rename contents** — would break hash tracking. Flag drift only. |
| `converted/` | Output of conversion tools (docx/pdf → md staging). | Treat as transient; flag if it's accumulating finished artifacts that belong in `src/`/`wip/`. |
| `.tmp/` | Scratch. Sweep writes its own reports to `.tmp/sweep-project/`. | Never promote `.tmp/` content; flag long-lived files that look like real work stranded here. |
| `.dump/`, `.claude/`, `.git/` | Tooling/config. | Ignore entirely. |

**Missing-zone policy**: a project need not have all five. Create a zone only when content exists for it. "No over-structuring" — top-level zones exist; subfolders emerge organically, not pre-built.

### Hybrid role-mapping (semantic-folder projects)

Most real projects do **not** use the canonical `in/ src/ ref/ wip/ park/` names — they use semantic folders (`site/ design/ seasons/ journal/ catalog/ …`) declared in their `CLAUDE.md`. **Do not rename these to canonical zones.** Instead, the sweep **maps each folder to a canonical role** and applies that role's mutability + aging rules — names stay, behavior is governed.

Per-project roles are read from CLAUDE.md when stated; otherwise inferred from content + the table below. State the mapping in the audit snapshot.

| Folder smell | Canonical role | Apply the rules of |
|---|---|---|
| Raw, as-received inputs (PDFs, transcripts, catalogs) | `in`-like | 🔒 frozen, MANIFEST tracking |
| Cleaned/structured form of inputs, regenerated downstream | `src`-like | 🔒 frozen, `source:` frontmatter |
| Stable reference, durable knowledge, "always check X" docs | `ref`-like | 🔒 rarely changed, diff+ask before edit |
| Active/living docs, calendars, journals, status trackers | `wip`-like | ✏️ mutable, graduate/retire as it ages |
| Dormant / set-aside / superseded | `park`-like | 🅿️ out of scope by default |

Only **greenfield or convention-silent** projects get the canonical `in/ src/ ref/ wip/ park/` names proposed directly. For everyone else: **keep names, govern by role.**

---

## Axis 2 — Source Temperature / Tier

Tier markers annotate maturity inside indexes and (optionally) frontmatter. Used to decide *what graduates, what freezes, what parks*.

| Marker | Tier | Meaning | Typical zone |
|---|---|---|---|
| 🟢 | pérenne | "≥50% still true in 6 months" — narrative, first-principles, durable framing | `ref/`, mature `wip/` |
| 🔵 | production | Artifact actively being built for a specific deliverable/session | `wip/` |
| 🟣 | spine | Ledger / meta-prompt that drives a pipeline — **read first** | `wip/` (one per pipeline) |
| 🧊 | frozen-source | Source figée consumed by a generation; don't edit, regenerate downstream instead | `src/`, `wip/**/sources/` |
| 🟡 | actif | In-motion working doc, not yet stabilized | `wip/` |
| ⚙️ | meta | Scratch / index / todo — not part of the material itself | any |

**Temperature → zone gravity** (the "drift" the sweep corrects):
- 🟢 pérenne that's validated → graduate `wip/` → `ref/`.
- 🟡 actif that's gone cold (oldest-quartile, no inbound links, stream closed) → `park/`.
- 🧊 frozen that still lives in `wip/` raw → move to `src/` with `source:` frontmatter.
- ⚙️ meta should never block reading of the material — keep indexes thin.

---

## Axis 3 — Traceability artifacts

| Artifact | Location | Scope | Distinct from |
|---|---|---|---|
| `INDEX.md` | project root | Cross-zone **priority compass**: 🔴 P0 structurant · 🟡 P1 important · ⚪ P2 référence. Inventories stable zones (`in/`/`src/`/`ref/`, web). **`wip/` excluded.** "Start here." | `MANIFEST` (which is physical-only, no priority) |
| `in/MANIFEST.md` | `in/` | Tracks **only physical `in/` files**: folder, file, source/context, status (🆕/✅/⚠️), output path. No priority. | `INDEX.md` (priority lives there) |
| `src/` `source:` frontmatter | each `src/` file | Provenance pointer to the `in/` origin (or web URL). | — |
| `wip/00-index.md` | `wip/` | Reading map of `wip/` tree — which file, which tier, reading order. Create when `wip/` sprawls (≳8 loose files or deep subtrees). | `INDEX.md` (which excludes wip) |
| `sync/**/_manifest.yaml` | `sync/` | File ↔ remote page mapping + content hashes for the external bridge. | All above — machine-maintained, do not hand-edit casually |

**Linking rule**: wikilink content from a task/artifact → point at `src/` (canonical). Only "open to re-extract" justifies pointing at `in/`.

**Decision rule for in/ → src/**: a raw input gets a `src/` twin when it's referenced by active work. Until then it stays `in/`, marked 🆕 in MANIFEST.

---

## Axis 4 — Description / Orientation

Hygiene keeps the shelf tidy; **orientation tells you what's on it.** Every non-trivial doc and folder carries a one-line "what this is" so the project is *navigable*, not just consistent. One canonical home per granularity — no duplication.

| Granularity | Canonical home | Format | Mirrored to |
|---|---|---|---|
| **File** | `description:` frontmatter on the file | `description: <≤12-word what-this-is>` | INDEX.md **Résumé** column / wip-index **Role** column |
| **Folder** | `README.md` in the folder, **or** a `purpose:`/`role:` line in the folder's own index | one line: what lives here, why | — |
| **Zone** | already covered by Axis 1 table | — | — |

**Rules:**
- The file's `description:` frontmatter is the **source of truth**; INDEX/wip-index résumés are mirrors of it. When they disagree, the frontmatter wins — the sweep refreshes the mirror.
- A folder with ≳5 files should carry an orientation line somewhere (README or its index). Tiny/obvious folders are exempt.
- Descriptions are *what-this-is*, not *what-to-do* — behavioral "always check X" guidance stays in CLAUDE.md (Axis 0).

---

## Naming

- One convention per zone. Default: lowercase-kebab for organic content; `TYPE-topic` CAPS prefix for recognized artifact classes already in use in the project (`ANALYSIS-`, `BRIEF-`, `SPEC-`, `CONTEXT-…-llm`, `PLAN-`, `META-PROMPT-`).
- Dates in names: `YYYYMMDD` or `YYYY-MM-DD`, leading when chronological (meetings, sessions), trailing when versioning a stable doc.
- `CONTEXT-<stream>-llm.md` for session-resume context files; one per active stream, parked when the stream closes.
- Don't rename to "improve" — only to remove genuine inconsistency within a zone. Renames break wikilinks: every rename pairs with a wikilink-repair pass.
