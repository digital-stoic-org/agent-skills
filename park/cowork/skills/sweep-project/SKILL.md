---
name: sweep-project
description: 'Audit, reorganize, and ensure consistency of ONE project folder against the zone+tier convention. Read-only audit → reorg plan → gated execute. Triggers: "sweep project", "tidy project", "reorganize project", "project hygiene", "audit folder", /sweep-project.'
allowed-tools: [Read, Edit, Write, Bash, Glob, Grep, AskUserQuestion]  # linear by design — no Agent/Task spawns
model: opus
effort: high
context: main
user-invocable: true
argument-hint: "[project-path] [--phase audit|plan|execute]"
---

# Sweep Project

Periodic cleanup + reorganization + consistency check for **one project at a time**.
Three gated phases: **1) audit (read-only) → 2) plan → 3) execute**. Human approves between each.

Covers everything in the project: technical artifacts, deliverables, **context files** (`CONTEXT-*-llm.md`),
indexes, manifests, raw inputs, and parking of what's no longer active.

**References** (read on demand, do NOT inline): `references/operating-rules.md` (⚠️ **hard constraints + AskUserQuestion guard + output style — read first, every run**) · `references/convention.md` (zones + tiers) · `references/drift-rules.md` (the 5 checks) · `references/templates.md` (report skeletons).

**Auto-invoke**: dual-invocable by design. Despite Phase 3 moving/editing files, the three gates (audit → plan → execute, each human-approved) make autonomous misfire safe — so it stays auto-invocable rather than `disable-model-invocation`.

## Phase 0: Resolve Target & Convention

1. **Resolve project path** from `$ARGUMENTS`. If empty: glob for `CLAUDE.md` under `$COWORK_ROOT` / `git rev-parse --show-toplevel` / cwd (max depth 3), list candidates, ask which one. One project only.
2. **Read the project's `CLAUDE.md`** — extract its declared folder structure, mutability table, any tier ontology, and naming rules. This is the **authoritative spec** for this project. Where it's silent, fall back to `references/convention.md`. Note any **file-listing inside CLAUDE.md** — that inventory is Axis-0 drift (belongs in INDEX.md).
3. **Detect zones + map roles**: detect `in/ src/ ref/ wip/ park/` + satellites (`sync/ converted/ .tmp/ .dump/`). For **semantic-folder projects** (own folder names), map each folder to a canonical role per `references/convention.md` §Hybrid role-mapping — keep names, govern by role. Note missing/extra zones and the folder→role map.
4. **Detect traceability artifacts**: `INDEX.md`, `in/MANIFEST.md`, `wip/00-index.md`, `sync/**/_manifest.yaml`, any project-local `SWEEP.md`. Note which are missing.
5. Determine which phase to run (`--phase`, else start at audit). **`--phase plan`/`execute` require the prior artifact** — look for the latest `AUDIT-*`/`PLAN-*` in `<P>/.tmp/sweep-project/`. If the needed artifact is missing (or `--phase execute` has no *approved* plan), say so and restart from the earliest phase that has its inputs; never execute moves/edits without an approved plan. Confirm the project + detected convention in one short line before proceeding.

## Phase 1: AUDIT (read-only)

Goal: classify every file by **zone-fit**, **tier**, **age/staleness**, **index-coverage** — and surface drift. No opinions executed, no files written except the report.

**Gather signals** (parallel, read-only):

```bash
# inventory with size + mtime, excluding protected satellites and binaries-as-content
find "$P" \( -name .git -o -name node_modules -o -name .venv -o -name .tmp -o -name .dump \) -prune \
  -o -type f -printf '%TY-%Tm-%Td %10s %p\n' 2>/dev/null | sort
```

For each candidate doc (markdown/text; treat binaries as inputs only), determine:
- **Zone-fit** — does the file's content maturity match the folder it sits in? (see drift-rules §1)
- **Tier** — assign 🟢/🔵/🟣/🧊/🟡/⚙️ from content (see `references/convention.md` Axis 2)
- **Age signal** — relative only: oldest-quartile within its zone? superseded by a newer version? closed-stream `CONTEXT`? sync-conflict twin? (see drift-rules §2)
- **Naming/frontmatter** — kebab vs CAPS, date-in-name policy, missing `source:`/`type:`/`tier:` (see drift-rules §3)
- **Index coverage** — present in the right index/manifest? broken wikilinks? orphan? INDEX.md present? CLAUDE.md file-listing drift? (see drift-rules §4)
- **Orientation** — `description:` frontmatter present? INDEX/wip-index résumé filled & matching frontmatter? folder oriented? (see drift-rules §5)

Apply the **five drift checks** from `references/drift-rules.md`. Each finding gets: file, signal(s), severity (🔴/🟡/🟠/⚪), and a proposed disposition (move / rename / rewrite / index-update / describe / park / flag-only).

**Whole-project lifecycle check**: if a large majority of files are dormant + all `CONTEXT` stale + deliverables shipped, note a *candidate* whole-project archive — but never act on it; surface as a single flagged finding.

**Write** `AUDIT-<project>-<YYYY-MM-DD>.md` to `<P>/.tmp/sweep-project/` using the audit template in `references/templates.md`. Then **stop** and present a ≤30-line summary (counts by severity, top findings, zones missing, index gaps). 

**GATE** → "Audit complete. Review the report. Proceed to plan? (yes / focus on <area> / stop)"

## Phase 2: PLAN (propose; no project writes)

Turn audit findings into an ordered, reversible reorg plan. Group into:

1. **Moves** — `in/`↔`src/` processing, graduate finished wip → ref, dormant → park, fix misplaced-by-tier. Order so directories exist before moves; no move depends on a later one.
2. **Renames** — naming normalization (one convention per zone, taken from CLAUDE.md or canonical).
3. **Content rewrites** — add/fix frontmatter (`source:`/`type:`/`tier:`/`description:`), insert tier markers, repair wikilinks, add missing one-line descriptions/orientation. (I apply these in Phase 3 via Edit.)
4. **Index/manifest updates** — sync `in/MANIFEST.md`, `INDEX.md` (create if absent; refresh résumés from `description:`); create `wip/00-index.md` if wip sprawls; if CLAUDE.md hand-maintains a file-listing, move it → INDEX and leave a pointer line.
5. **Park/archive proposals** — called out **separately**, each needing explicit per-item approval (sync-conflict twins, superseded versions, closed-stream CONTEXT).

Each item: **confidence** (HIGH/MED/LOW), **reversibility** (trivial-move / content-edit / lossy), and one-line rationale tied to its audit finding. LOW-confidence or lossy items are **flagged, not pre-approved**.

**Write** `PLAN-<project>-<YYYY-MM-DD>.md` to `<P>/.tmp/sweep-project/` using the plan template. Present grouped summary.

**GATE** → "Approve the plan? (yes-all / pick numbers / edit / stop). Park/archive items need explicit yes."

## Phase 3: EXECUTE (planned → I execute)

Only for **approved** items. The Phase 2 plan is the gate: once you've approved it, I execute the full set — content edits **and** filesystem moves. I never touch git; you commit the result.

**I execute, all via my tools:**
- **Content rewrites** — frontmatter, tier markers, wikilink repairs (`Edit`/`Write`).
- **Index/manifest** updates and any new `wip/00-index.md` / refreshed `INDEX.md` / `in/MANIFEST.md` (`Edit`/`Write`).
- **Filesystem moves** — `mkdir -p` then plain `mv` (and `mv … park/` for parking), via `Bash`. **No `git`, no `rm`.** Deletions are never executed — only `mv` to `park/`.

**Audit trail**: before moving, write the ordered move list to `<P>/.tmp/sweep-project/move-script.sh` (each line commented with its rationale) as a record of what I did — then execute those moves myself. This leaves a reviewable artifact without making you run it.

**Ordering**: apply content edits first (path-stable for files not moving), then moves. For files that BOTH move and need content edits, I edit at the current path first, then `mv` relocates them.

**Git gate**: I do not stage or commit. After execution, the moves appear in `git status` as deletes + adds (git detects renames at commit time). 

**Close-out**: report what I edited, what I moved, what was flagged-not-done, and remaining manual decisions (deletions, whole-project archive — yours to make). Show the resulting `git status` so you can review and commit. Suggest re-running `/sweep-project` to verify a clean state.
