---
name: troubleshoot
description: "Use when user reports an error, bug, or something not working. Search-first troubleshooting with diagnostic phase. Triggers: debug, error, broken, not working, failing, crash, exception."
allowed-tools: WebSearch, WebFetch, AskUserQuestion, Read, Glob, Grep
model: opus
context: main
argument-hint: <error or symptom description>
cynefin-domain: complicated
cynefin-verb: analyze
---

# Troubleshoot

Search-first diagnostic workflow. Human executes commands.

## ⚠️ AskUserQuestion Guard

**CRITICAL**: After EVERY `AskUserQuestion` call, check if answers are empty/blank. Known Claude Code bug: outside Plan Mode, AskUserQuestion silently returns empty answers without showing UI.

**If answers are empty**: DO NOT proceed with assumptions. Instead:
1. Output: "⚠️ Questions didn't display (known Claude Code bug outside Plan Mode)."
2. Present the options as a **numbered text list** and ask user to reply with their choice number.
3. WAIT for user reply before continuing.

## Workflow

`0.Load → 1.Search → 2.Qualify → 3.Diagnose → 4.Investigate → 5.Persist → 6.Learn`

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

### 5. Persist Thinking Artifact ⚠️ MANDATORY

**MUST execute after root cause confirmed and fix verified. DO NOT skip. DO NOT wait for user to ask.**

Persist the diagnostic session to `$THINKING_DIR/troubleshoot/{project}/{date}-{slug}-llm.md`.

`{project}` = current project folder name. `{slug}` = lowercase hyphenated from primary symptom/error. Create directory if missing.

**Collision handling**: If filename exists, append sequence: `{date}-{slug}-2-llm.md`, `{date}-{slug}-3-llm.md`. First write gets clean name.

**Guard**: If `$THINKING_DIR` is unset, skip artifact persistence silently (troubleshooting must not fail because of missing env var).

**Content** (required sections):
- Symptoms (as reported)
- Hypotheses tested (ordered list with result: confirmed/eliminated)
- OODA loops (if Phase 4 was entered)
- Root cause (as confirmed)
- Resolution (fix applied)
- Cynefin transition (if problem re-classified during diagnosis)

This is the **active thinking trail** — distinct from `learnings.yaml` which captures distilled, reusable conclusions.

### 6. Learn

After resolution, AskUserQuestion: "Save this learning?"
- Global → append to `/praxis/reference/troubleshoot/learnings.yaml`
- Project → append with `scope: project:<name>`
- Skip

## ✅ Completion Checklist

Before responding to user, verify:
- [ ] Artifact written to `$THINKING_DIR` (or guard triggered if unset)

## Refs

- `protocols/diagnose.md` - Mental models, bisect strategies
