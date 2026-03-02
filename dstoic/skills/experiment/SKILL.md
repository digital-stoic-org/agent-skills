---
name: experiment
description: "Chaotic domain: act to impose minimal constraints when cause-effect is invisible. Use when: production down with gibberish logs, completely novel problem, crisis, deliberate disruption, nothing makes sense. NOT for problems with any visible pattern — use /probe instead."
allowed-tools: AskUserQuestion, Read, Glob, Grep, Bash, EnterWorktree
argument-hint: <situation or crisis description>
cynefin-domain: chaotic
cynefin-verb: act
model: opus
context: main
---

# Experiment

Act → sense → gate. Human IS the constraint. No autonomous runs.

**Situation:** $ARGUMENTS

## 0. Classify Chaos

AskUserQuestion — single call:

**"Accidental or deliberate?"**
- **Accidental** (crisis): something broke badly — production down, data corruption, cascading failure → faster gates
- **Deliberate** (innovation): intentional disruption — novel architecture, paradigm shift, no prior art → exploratory gates

Set `mode = accidental|deliberate`.

## 1. Frame the Void

State what is NOT known (not what is known):
- No visible cause-effect relationships
- No best practice applies
- No expert can say "do X"

Identify: what is the minimal safe action to impose ANY constraint on this space?

## 2. Act-Gate Loop

Repeat until structure emerges or transition triggered:

### Act
- Propose ONE minimal action (smallest possible intervention)
- State expected signal: "if this works, we'll see X"
- `isolation: worktree` for containment if code changes involved

### Gate
AskUserQuestion: "Ready to act? Describe outcome after: [action]"

**Wait for human response.** Gate fires after EVERY action — no batching.

### Sense
Interpret the response:
- Signal received → update constraint map
- No signal → action was too small or wrong dimension
- Negative signal → constraint hardened in wrong direction

Log: `action N: [what] → [outcome] → [constraint discovered]`

## 3. Structure Check

After each gate, assess:

```
Constraint type now:
- Still absent → continue act-gate loop
- Enabling (patterns visible) → TRANSITION to /probe
- Governing (experts applicable) → skip /probe → /frame-problem → /investigate
- Rigid (process known) → skip /probe → /frame-problem → execute
- Misclassified → TRANSITION to /frame-problem
```

## 4. Exit + Handoff

AskUserQuestion: "Which transition? [Probe — structure emerged / Frame-problem — misclassified / Troubleshoot — crisis was failure]"

Populate handoff template:
- Structure emerged → `experiment->-probe-llm.md`
- Re-classify → `experiment->-frame-problem-llm.md`
- Crisis / failure → invoke `/troubleshoot` with action log as context

Observability: `⚡ Experiment → {mode} → {N} acts → {N} gates → {structure} → TRANSITION`

## Invariants

- NO `run_in_background` — fully foreground
- Gate after EVERY action — human decides at each step
- `isolation: worktree` for containment only, never for parallelism
- Exit to `/probe` when enabling constraints emerge (Chaotic → Complex)

## Refs

- `reference.md` — protocols, gate patterns, transition triggers
