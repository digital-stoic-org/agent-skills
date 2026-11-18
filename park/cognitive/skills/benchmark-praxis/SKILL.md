---
name: benchmark-praxis
description: "Benchmark Praxis methodology against external frameworks, tools, or approaches. Use when: benchmark, compare praxis, how does praxis compare, gap analysis, benchmark vs, assess against, track changelog, watch features, inventory features, full feature sweep. Modes: full (default), quick, gap, track, inventory."
allowed-tools: WebSearch, WebFetch, AskUserQuestion, Read, Write, Edit, Glob, Grep, Bash
model: opus
context: main
argument-hint: "[quick|gap|track|inventory] <url, repo name, or framework name>"
cynefin-domain: complicated
cynefin-verb: analyze
---

# Benchmark Praxis

Structured benchmarking of Praxis methodology against external frameworks/tools. 5 modes: full, quick, gap, track, inventory.

**Benchmarking:** **$ARGUMENTS**

## Mode Detection

| Argument starts with | Mode | Set | Depth |
|---|---|---|---|
| `quick ...` | Quick | Set 1 (4-5 dims) | Lightweight, no deep research |
| `gap ...` or `gap` (no arg) | Gap | Set 2 (4 dims) | Self-assessment, inward-looking |
| `track ...` | Track | Feature delta | Changelog diff vs `features/{subject}.yaml`, triage new entries |
| `inventory ...` | Inventory | Full feature sweep | Crawl docs tree, append every missing feature as `new` for batch triage |
| anything else | Full | Set 1 (all 8 dims) | Deep research + verdict + actions |

**When to use inventory vs track**: Inventory is a one-shot baseline build (or rare refresh). Track is recurring delta maintenance against an existing baseline. Run inventory **first** for any new subject; track keeps it fresh afterward.

## AskUserQuestion Guard

After EVERY `AskUserQuestion` call, check if answers are empty/blank. If empty: output "Questions didn't display (known bug)" and present options as numbered text list instead.

## Workflow

`0.Scope → 1.Research → 1b.Feature delta (track only) → 1c.Feature sweep (inventory only) → 2.Score → 3.Verdict → 4.Actions → 5.Persist`

### 0. Scope

- **Source**: URL, repo, article, or framework name from $ARGUMENTS
- **Goal emphasis**: AskUserQuestion — which matters most? Learning / Positioning / Import / Gap / Security
- **Prior art**: Read `$PRAXIS_DIR/thinking/benchmarks/inventory.yaml` — has this been benchmarked before? If yes, reference it, focus on what's new/changed
- **Track mode**: also Read `$PRAXIS_DIR/thinking/benchmarks/features/{subject}.yaml` if present — this is the durable feature-level state for the subject
- **Inventory mode**: Read `features/{subject}.yaml` if present (will be diffed against full doc sweep). If absent, this is a first-time baseline — start fresh.

Skip AskUserQuestion if $ARGUMENTS already covers goal.

### 1. Research (skip for quick mode)

- **WebSearch** + **WebFetch**: Source material, docs, README, design decisions
- **Codebase read**: If Claude Code plugin/framework, read its CLAUDE.md, skill architecture
- Output: "What It Is" summary (2-5 sentences)

**Quick mode**: Skip deep research, use what's available from $ARGUMENTS + quick web check.

### 1b. Feature delta (track mode only)

Goal: keep a per-subject feature ledger fresh and triage new entries into adopt/cherry-pick/watch/reject.

1. **Fetch changelog/release notes** via WebFetch from canonical source (e.g., CC docs changelog, GitHub releases). Default window: since `last_reviewed` in `features/{subject}.yaml`, or last 8 weeks if first run.
2. **Extract candidate features**: each release entry → one feature row. Capture name, version-first-seen, one-line description, source URL.
3. **Diff against existing ledger**: compare candidate names against `features/{subject}.yaml` entries. Three buckets:
   - **New**: not in ledger → append with status `new`
   - **Changed**: in ledger, but description/version updated → update fields, set status to `review` if it was `watching`
   - **Unchanged**: skip
4. **Triage new entries** using the rubric in `reference.md` (Feature Triage Rubric). Each new feature gets a status: `adopt`, `cherry-pick`, `watch`, `reject`, or `new` (if undecided — flag for human review). Include `why` (one line).
5. **Update ledger**: write back to `features/{subject}.yaml` with new entries + bumped `last_reviewed` date.

Skip steps 2-5 if the changelog has no entries since `last_reviewed`.

### 1c. Feature sweep (inventory mode only)

Goal: build (or refresh) a complete feature baseline by crawling the full documentation tree, not just the changelog. Inventory mode answers "what features exist *at all*", track mode answers "what changed since last week".

1. **Identify the docs tree root** for the subject (e.g., Claude Code: `https://docs.claude.com/en/docs/claude-code/`). Ask user to confirm the root URL if not obvious from $ARGUMENTS. Source can be a docs site, GitHub Pages, GitHub repo `docs/` folder, or wiki — all work as long as content is markdown or HTML.
2. **Enumerate doc sections** to crawl:
   - **Claude Code shortcut**: canonical surface is `skills`, `hooks`, `plugins`, `settings`, `agents`, `mcp`, `sandbox`, `teams`, `schedule`, `remote-control`, `lsp`, `worktree`, `slash-commands`, `permissions`, `cli-reference`, `environment-variables`.
   - **GitHub repo source**: if root is a GitHub repo, prefer `gh api repos/{owner}/{repo}/git/trees/{branch}?recursive=1` and filter to paths matching `docs/**/*.md` or `**/README.md`. Fallback: `gh api repos/{owner}/{repo}/contents/{docs-path}` to list a single directory. Each `.md` file = one section.
   - **Docs site source**: WebFetch the index/landing page first, extract the navigation/sidebar links, propose the section list to the user.
   - **Other**: ask the user to enumerate sections manually.
3. **Crawl each section**:
   - **GitHub markdown**: WebFetch via `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}` for clean unrendered markdown (avoids JS/HTML noise).
   - **Docs site**: WebFetch the rendered HTML page directly.
   - **Per-fetch prompt**: "List every distinct feature, setting, env var, hook event, CLI flag, or capability documented on this page. For each, provide: name, one-line description, and a stable identifier (e.g., flag name, env var name, hook name)."
   - Default to ~10-20 fetches per subject; cap at 25 to avoid runaway. If subject has more sections, prioritize by surface area (skip deep API references on first pass).
4. **Group candidates by subsystem** (hooks / skills / plugins / settings / agents / sandbox / mcp / scheduling / cli / misc). Subsystem grouping is the **organizing axis for batch triage** later.
5. **Diff against existing ledger**: candidate names normalized (lowercase, dashes) vs ledger entries. Three buckets:
   - **Already in ledger**: skip (don't double-add)
   - **Missing**: append with `status: new`, populate `subsystem` field, leave `why` blank for human triage
   - **Existing but mismatched description/version**: update fields in place
6. **Write back to ledger**: append all `new` entries grouped by subsystem (preserves existing entries unchanged). Bump `last_reviewed`.
7. **Emit triage worksheet** as part of the investigation artifact: a per-subsystem table of `new` entries the user can batch-classify in 10-min focused passes. Do NOT auto-triage in inventory mode — that defeats the purpose of human review on the full surface.

**Why no auto-triage**: inventory deliberately defers classification to the user. Auto-triaging 80+ features compounds errors silently. Batch human triage by subsystem is the design.

### 2. Score

Score using rubrics in `reference.md`.

| Mode | What to score |
|---|---|
| Full | All 8 Set 1 dims, both Praxis and subject |
| Quick | 4-5 most relevant Set 1 dims only |
| Gap | All 4 Set 2 dims (current vs holy grail) |
| Track | No dim scoring — feature-level triage only (done in step 1b) |
| Inventory | No dim scoring — feature sweep + ledger seeding only (done in step 1c) |

For each dim: score + brief note + flag innovations worth importing or gaps worth closing.
Dim 6 (Human-AI governance): score 3 sub-dimensions separately.
N/A dims: mark as N/A.

### 3. Verdict (full + quick + track + inventory)

- **Full / Quick**: One paragraph — who leads, complementary/competing/irrelevant, strategic implication. End with directive: **adopt / cherry-pick / watch / reject / complement**.
- **Track**: One paragraph summarizing the delta — how many new features, how many adopt/cherry-pick triggers, anything urgent.
- **Inventory**: One paragraph summarizing the surface — total features found, how many were missing from ledger, breakdown by subsystem, and a recommended triage order (which subsystem to tackle first based on Praxis priorities). End with directive: **triage-batched**.

### 4. Actions (full + track + inventory)

Structured action items using template in `reference.md` (Actions Template section).
Categories: import / cherry_pick / watch / reject / security.

For **track** mode, only emit actions for entries triaged as `adopt` or `cherry-pick` in step 1b — `watch`/`reject` stay in the ledger and don't pollute the action list.

For **inventory** mode, no `import`/`cherry_pick`/`watch`/`reject` actions are emitted (nothing is triaged yet). Instead emit a single category `triage_queue`: per-subsystem batched lists with estimated time-to-triage (~10 min per subsystem of ≤15 entries). The user runs these as separate triage sessions.

### 5. Persist MANDATORY

Create `$PRAXIS_DIR/thinking/benchmarks/` if missing. For track and inventory modes, also create `$PRAXIS_DIR/thinking/benchmarks/features/` if missing.

**Investigation artifact** `$PRAXIS_DIR/thinking/benchmarks/{date}-{slug}-llm.md`
- Full: all research, all dims, reasoning, sources, verdict, actions
- Quick: lighter content, cherry-picked dims only
- Gap: self-assessment focus, Set 2 dims, gap priorities
- Track: changelog window, delta summary, list of new/changed entries with triage, action items for adopt/cherry-pick. Filename suffix: `{date}-{slug}-track-llm.md`
- Inventory: doc sections crawled, total surface size, missing-from-ledger count, per-subsystem triage worksheet. Filename suffix: `{date}-{slug}-inventory-llm.md`

**Feature ledger (track + inventory)** `$PRAXIS_DIR/thinking/benchmarks/features/{subject}.yaml`
- Schema in `reference.md` (Feature Ledger Schema section). Persistent, append-only at the entry level (statuses can change).
- Inventory mode adds `subsystem` field to each entry for batch triage grouping.
- Update `last_reviewed` to today's date.

**Update inventory** `$PRAXIS_DIR/thinking/benchmarks/inventory.yaml`
- Add entry with: name, date, mode, slug, dims scored (or `feature-delta` for track), verdict directive

**Collision handling**: If filename exists, append sequence: `{date}-{slug}-2-llm.md`.

**Guard**: If `$PRAXIS_DIR` is unset, warn and skip: `$PRAXIS_DIR not set — artifact not persisted.`

## Recurring track runs

Track mode is designed to be re-run on a cadence (weekly/monthly). Each run reads `features/{subject}.yaml`, fetches the changelog since `last_reviewed`, and appends only the delta. To automate, schedule via the `/schedule` skill — e.g. weekly Monday 8am: `/benchmark-praxis track claude-code`.

## Completion Checklist

- [ ] Artifact written to `$PRAXIS_DIR/thinking/benchmarks/`
- [ ] Inventory.yaml updated (or guard triggered if unset)
- [ ] Track mode only: `features/{subject}.yaml` updated with new entries + bumped `last_reviewed`
- [ ] Inventory mode only: `features/{subject}.yaml` seeded/refreshed with all missing entries grouped by `subsystem`, status `new`, ready for batch triage

## Refs

- `reference.md` — scoring rubrics (Set 1 + Set 2), actions template, artifact template
