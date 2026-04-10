---
name: benchmark-praxis
description: "Benchmark Praxis methodology against external frameworks, tools, or approaches. Use when: benchmark, compare praxis, how does praxis compare, gap analysis, benchmark vs, assess against. Modes: full (default), quick, gap."
allowed-tools: WebSearch, WebFetch, AskUserQuestion, Read, Write, Glob, Grep
model: opus
context: main
argument-hint: "[quick|gap] <url, repo name, or framework name>"
cynefin-domain: complicated
cynefin-verb: analyze
---

# Benchmark Praxis

Structured benchmarking of Praxis methodology against external frameworks/tools. 3 modes: full, quick, gap.

**Benchmarking:** **$ARGUMENTS**

## Mode Detection

| Argument starts with | Mode | Set | Depth |
|---|---|---|---|
| `quick ...` | Quick | Set 1 (4-5 dims) | Lightweight, no deep research |
| `gap ...` or `gap` (no arg) | Gap | Set 2 (4 dims) | Self-assessment, inward-looking |
| anything else | Full | Set 1 (all 8 dims) | Deep research + verdict + actions |

## AskUserQuestion Guard

After EVERY `AskUserQuestion` call, check if answers are empty/blank. If empty: output "Questions didn't display (known bug)" and present options as numbered text list instead.

## Workflow

`0.Scope → 1.Research → 2.Score → 3.Verdict → 4.Actions → 5.Persist`

### 0. Scope

- **Source**: URL, repo, article, or framework name from $ARGUMENTS
- **Goal emphasis**: AskUserQuestion — which matters most? Learning / Positioning / Import / Gap / Security
- **Prior art**: Read `$PRAXIS_DIR/thinking/benchmarks/inventory.yaml` — has this been benchmarked before? If yes, reference it, focus on what's new/changed

Skip AskUserQuestion if $ARGUMENTS already covers goal.

### 1. Research (skip for quick mode)

- **WebSearch** + **WebFetch**: Source material, docs, README, design decisions
- **Codebase read**: If Claude Code plugin/framework, read its CLAUDE.md, skill architecture
- Output: "What It Is" summary (2-5 sentences)

**Quick mode**: Skip deep research, use what's available from $ARGUMENTS + quick web check.

### 2. Score

Score using rubrics in `reference.md`.

| Mode | What to score |
|---|---|
| Full | All 8 Set 1 dims, both Praxis and subject |
| Quick | 4-5 most relevant Set 1 dims only |
| Gap | All 4 Set 2 dims (current vs holy grail) |

For each dim: score + brief note + flag innovations worth importing or gaps worth closing.
Dim 6 (Human-AI governance): score 3 sub-dimensions separately.
N/A dims: mark as N/A.

### 3. Verdict (full + quick only)

One paragraph: who leads, complementary/competing/irrelevant, strategic implication.
End with action directive: **adopt / cherry-pick / watch / reject / complement**.

### 4. Actions (full mode only)

Structured action items using template in `reference.md` (Actions Template section).
Categories: import / cherry_pick / watch / reject / security.

### 5. Persist MANDATORY

Create `$PRAXIS_DIR/thinking/benchmarks/` if missing.

**Investigation artifact** `$PRAXIS_DIR/thinking/benchmarks/{date}-{slug}-llm.md`
- Full: all research, all dims, reasoning, sources, verdict, actions
- Quick: lighter content, cherry-picked dims only
- Gap: self-assessment focus, Set 2 dims, gap priorities

**Update inventory** `$PRAXIS_DIR/thinking/benchmarks/inventory.yaml`
- Add entry with: name, date, mode, slug, dims scored, verdict directive

**Collision handling**: If filename exists, append sequence: `{date}-{slug}-2-llm.md`.

**Guard**: If `$PRAXIS_DIR` is unset, warn and skip: `$PRAXIS_DIR not set — artifact not persisted.`

## Completion Checklist

- [ ] Artifact written to `$PRAXIS_DIR/thinking/benchmarks/`
- [ ] Inventory updated (or guard triggered if unset)

## Refs

- `reference.md` — scoring rubrics (Set 1 + Set 2), actions template, artifact template
