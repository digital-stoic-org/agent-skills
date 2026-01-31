---
name: troubleshoot
description: "Use when user reports an error, bug, or something not working. Search-first troubleshooting with diagnostic phase. Triggers: debug, error, broken, not working, failing, crash, exception."
allowed-tools: WebSearch, WebFetch, AskUserQuestion, Read, Glob, Grep
argument-hint: <error or symptom description>
---

# Troubleshoot

Search-first diagnostic workflow. Human executes commands.

## Workflow

`0.Load → 1.Search → 2.Qualify → 3.Diagnose → 4.Investigate → 5.Learn`

### 0. Load Learnings

Read `/praxis/reference/troubleshoot/learnings.yaml` if exists. Apply known patterns before searching.

### 1. Search (do first)

80% of bugs solved online.

- WebSearch: `[error] [stack] [framework]` on SO, GitHub, Docs, Reddit
- Solution found → skip to 5.Learn

### 2. Qualify (2-3 questions)

AskUserQuestion:
- Stack? (language, framework, runtime)
- Environment? (local, container, cloud)
- Changed recently? (deploy, config, dependency)

### 3. Diagnose

See `protocols/diagnose.md` for details.

1. **Mental models**: Check learnings.yaml → WebSearch pattern → reason with 5 Whys/Fishbone
2. **Isolation**: Wolf Fence (binary search), swap one variable, minimal repro
3. **Root cause drill**: 5 Whys, Fishbone 6 M's

Pattern matches → suggest fix, skip OODA

### 4. Investigate (OODA)

Only if diagnosis inconclusive.

- Observe: User runs command, pastes output
- Orient: Analyze, update hypothesis
- Decide: Next command or confirm cause
- Act: Suggest fix (user executes)

Exit when root cause confirmed and fix verified.

### 5. Learn

After resolution, AskUserQuestion: "Save this learning?"
- Global → append to `/praxis/reference/troubleshoot/learnings.yaml`
- Project → append with `scope: project:<name>`
- Skip

## Refs

- `protocols/diagnose.md` - Mental models, bisect strategies
