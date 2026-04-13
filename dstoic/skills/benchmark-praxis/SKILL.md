---
name: benchmark-praxis
description: "Benchmark Praxis methodology against external frameworks, tools, or approaches. Use when: benchmark, compare praxis, how does praxis compare, gap analysis, benchmark vs, assess against, track changelog, watch features. Modes: full (default), quick, gap, track."
allowed-tools: WebSearch, WebFetch, AskUserQuestion, Read, Write, Edit, Glob, Grep, Bash
model: opus
context: main
argument-hint: "[quick|gap|track] <url, repo name, or framework name>"
cynefin-domain: complicated
cynefin-verb: analyze
---

# Benchmark Praxis

Structured benchmarking of Praxis methodology against external frameworks/tools. 4 modes: full, quick, gap, track.

**Benchmarking:** **$ARGUMENTS**

## Mode Detection

| Argument starts with | Mode | Set | Depth |
|---|---|---|---|
| `quick ...` | Quick | Set 1 (4-5 dims) | Lightweight, no deep research |
| `gap ...` or `gap` (no arg) | Gap | Set 2 (4 dims) | Self-assessment, inward-looking |
| `track ...` | Track | Feature delta | Changelog diff vs `features/{subject}.yaml`, triage new entries |
| anything else | Full | Set 1 (all 8 dims) | Deep research + verdict + actions |

## AskUserQuestion Guard

After EVERY `AskUserQuestion` call, check if answers are empty/blank. If empty: output "Questions didn't display (known bug)" and present options as numbered text list instead.

## Workflow

`0.Scope → 1.Research → 1b.Feature delta (track only) → 2.Score → 3.Verdict → 4.Actions → 5.Persist`

### 0. Scope

- **Source**: URL, repo, article, or framework name from $ARGUMENTS
- **Goal emphasis**: AskUserQuestion — which matters most? Learning / Positioning / Import / Gap / Security
- **Prior art**: Read `$PRAXIS_DIR/thinking/benchmarks/inventory.yaml` — has this been benchmarked before? If yes, reference it, focus on what's new/changed
- **Track mode**: also Read `$PRAXIS_DIR/thinking/benchmarks/features/{subject}.yaml` if present — this is the durable feature-level state for the subject

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

### 2. Score

Score using rubrics in `reference.md`.

| Mode | What to score |
|---|---|
| Full | All 8 Set 1 dims, both Praxis and subject |
| Quick | 4-5 most relevant Set 1 dims only |
| Gap | All 4 Set 2 dims (current vs holy grail) |
| Track | No dim scoring — feature-level triage only (done in step 1b) |

For each dim: score + brief note + flag innovations worth importing or gaps worth closing.
Dim 6 (Human-AI governance): score 3 sub-dimensions separately.
N/A dims: mark as N/A.

### 3. Verdict (full + quick + track)

- **Full / Quick**: One paragraph — who leads, complementary/competing/irrelevant, strategic implication. End with directive: **adopt / cherry-pick / watch / reject / complement**.
- **Track**: One paragraph summarizing the delta — how many new features, how many adopt/cherry-pick triggers, anything urgent.

### 4. Actions (full + track)

Structured action items using template in `reference.md` (Actions Template section).
Categories: import / cherry_pick / watch / reject / security.

For **track** mode, only emit actions for entries triaged as `adopt` or `cherry-pick` in step 1b — `watch`/`reject` stay in the ledger and don't pollute the action list.

### 5. Persist MANDATORY

Create `$PRAXIS_DIR/thinking/benchmarks/` if missing. For track mode, also create `$PRAXIS_DIR/thinking/benchmarks/features/` if missing.

**Investigation artifact** `$PRAXIS_DIR/thinking/benchmarks/{date}-{slug}-llm.md`
- Full: all research, all dims, reasoning, sources, verdict, actions
- Quick: lighter content, cherry-picked dims only
- Gap: self-assessment focus, Set 2 dims, gap priorities
- Track: changelog window, delta summary, list of new/changed entries with triage, action items for adopt/cherry-pick. Filename suffix: `{date}-{slug}-track-llm.md`

**Feature ledger (track only)** `$PRAXIS_DIR/thinking/benchmarks/features/{subject}.yaml`
- Schema in `reference.md` (Feature Ledger Schema section). Persistent, append-only at the entry level (statuses can change).
- Update `last_reviewed` to today's date.

**Update inventory** `$PRAXIS_DIR/thinking/benchmarks/inventory.yaml`
- Add entry with: name, date, mode, slug, dims scored (or `feature-delta` for track), verdict directive

**Collision handling**: If filename exists, append sequence: `{date}-{slug}-2-llm.md`.

**Guard**: If `$PRAXIS_DIR` is unset, warn and skip: `$PRAXIS_DIR not set — artifact not persisted.`

## Recurring track runs

Track mode is designed to be re-run on a cadence (weekly/monthly). Each run reads `features/{subject}.yaml`, fetches the changelog since `last_reviewed`, and appends only the delta. To automate, schedule via the `/schedule` skill — e.g. weekly Monday 8am: `/benchmark-praxis track claude-code`.

## Completion Checklist

- [ ] Artifact written to `$PRAXIS_DIR/thinking/benchmarks/`
- [ ] Inventory updated (or guard triggered if unset)
- [ ] Track mode only: `features/{subject}.yaml` updated with new entries + bumped `last_reviewed`

## Refs

- `reference.md` — scoring rubrics (Set 1 + Set 2), actions template, artifact template
