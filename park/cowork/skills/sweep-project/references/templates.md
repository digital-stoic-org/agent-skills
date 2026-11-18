# Templates

Skeletons the sweep writes or repairs. Match the project's existing style first (read a sibling file); these are the fallback shape. French-content projects: keep template prose minimal and let the user's content stay French.

---

## AUDIT report → `<P>/.tmp/sweep-project/AUDIT-<project>-<date>.md`

```markdown
---
type: sweep-audit
project: <name>
path: <abs path>
date: <YYYY-MM-DD>
convention: <"canonical" | "CLAUDE.md override">
---

# Sweep Audit — <project> (<date>)

## Snapshot
- Zones present: <in src ref wip park + satellites>  · Missing: <…>
- Folder → role map (semantic-folder projects): <site→ref · journal→wip · catalog→src · …>
- Traceability: INDEX <✓/✗> · in/MANIFEST <✓/✗> · wip/00-index <✓/✗> · sync manifest <✓/✗/—>
- Orientation: files w/ `description:` <n/N> · folders oriented <n/N> · CLAUDE.md file-listing drift <yes/no>
- Files audited: <N>  · Findings: 🔴<n> 🟡<n> 🟠<n> ⚪<n>

## Findings
| # | File | Zone | Tier | Drift (§) | Severity | Proposed disposition |
|---|---|---|---|---|---|---|
| 1 | wip/X.sync-conflict-….md | wip | — | §2 conflict twin | 🔴 | park + flag delete |
| 2 | … | | | | | |

## Whole-project lifecycle
<one line: active | candidate-archive (rationale) — flag only, never acted on>

## Notes
- Protected satellites (described, not touched): <sync/ converted/ …>
- Per-project overrides honored: <from CLAUDE.md>
```

---

## PLAN report → `<P>/.tmp/sweep-project/PLAN-<project>-<date>.md`

```markdown
---
type: sweep-plan
project: <name>
date: <YYYY-MM-DD>
audit: AUDIT-<project>-<date>.md
---

# Sweep Plan — <project> (<date>)

> Approve per group. Park/archive + lossy items need explicit yes. Nothing runs until you do.

## 1. Moves  (→ move-script, you run)
| # | From | To | Conf | Reversible | Why (audit #) |
|---|---|---|---|---|---|

## 2. Renames  (→ move-script + wikilink repair)
| # | From | To | Links to repair | Conf | Why |
|---|---|---|---|---|---|

## 3. Content rewrites  (I apply via Edit)
| # | File | Change | Conf | Why |
|---|---|---|---|---|

## 4. Index / manifest updates  (I apply)
| # | Artifact | Change | Why |
|---|---|---|---|

## 5. Park / archive  ⚠️ explicit approval each
| # | File | → | Lossy? | Why |
|---|---|---|---|---|

## Flagged — NOT in plan (need your call)
- <deletions, ref/ promotions, whole-project archive, LOW-confidence items>
```

---

## move-script (audit trail) → `<P>/.tmp/sweep-project/move-script.sh`

Record of the moves Claude executed in Phase 3 — written, then run, by Claude. Not for the user to run. No `rm`, no `git`; deletions & commits stay the user's.

```bash
#!/usr/bin/env bash
# Sweep moves for <project> — <date> (executed by Claude; this file is the record)
# No rm, no git — deletions & commits are the user's.
# Order: content edits already applied at current paths; moves below relocated after.
set -euo pipefail
cd "<abs project path>"

# --- mkdir (idempotent) ---
mkdir -p park src/meetings wip/_index

# --- moves (each commented with rationale) ---
# §2 sync-conflict twin → park
mv "wip/DECISIONS-….sync-conflict-….md" "park/"
# §1 frozen source wip → src
mv "wip/foo.md" "src/foo.md"

echo "Moves applied. Review 'git status', then commit yourself."
```

Rules: `mkdir -p` first, then `mv`. **No `rm`. No `git`.** Quote every path. One comment line per move citing the drift §. If a file was content-edited AND moves, edit happens first (Claude, at old path), move second (script) — note in header.

---

## INDEX.md (project root) — priority compass

```markdown
---
type: project-index
updated: <YYYY-MM-DD>
purpose: Cross-zone priority compass — what structures this project, by priority
---

# Index — <project>

> All stable zones (in/, src/, ref/, web). Distinct from in/MANIFEST.md (physical in/ only).
> Wikilink → src/ when processed; else → in/. wip/ excluded (see wip/00-index.md).
> Résumé column mirrors each file's `description:` frontmatter (frontmatter is source of truth).
> This is the project MAP. Behavioral policy lives in CLAUDE.md, not here (Axis 0).

## Legend
🔴 P0 structurant · 🟡 P1 important · ⚪ P2 référence  ·  axes: 📊 business · ⚙️ tech · ⚖️ legal

## 🔴 P0
| Doc | Axe | Résumé | Zone |
|---|---|---|---|

## 🟡 P1
| Doc | Axe | Résumé | Zone |
|---|---|---|---|

## ⚪ P2
| Doc | Axe | Résumé | Zone |
|---|---|---|---|

## ⚠️ À traiter (in/ not yet in src/)
- <list>
```

---

## in/MANIFEST.md — physical in/ inventory

```markdown
# in/ Manifest
Raw inputs inventory. Tracks ONLY physical files in in/. Priority lives in INDEX.md.

| Folder | File | Source / Context | Status | Output |
|---|---|---|---|---|
| meetings/ | 20260514-…-raw.md | Mat live notes, 14/05 | ✅ Processed | src/meetings/… |
```
Status vocab: 🆕 Unprocessed · ✅ Processed · ⚠️ Duplicate/issue · ✅ Referenced (used without a src/ twin).

---

## wip/00-index.md — wip reading map (create on sprawl)

```markdown
---
type: manifest
scope: wip/
updated: <YYYY-MM-DD>
role: reading map of wip/ — which file, which tier, reading order
---

# 📂 INDEX — wip/

> Tiers: 🟢 pérenne · 🔵 production · 🟣 spine (read first) · 🧊 frozen-source · 🟡 actif · ⚙️ meta

| File | Tier | Role |
|---|---|---|
| reliance.md | 🟣 | spine — read first |
| 10-syllabus.md | 🟢 | durable narrative |
```
Optional `XX-` numeric prefixes = indicative reading order (gaps = insertion slots, not strict).
