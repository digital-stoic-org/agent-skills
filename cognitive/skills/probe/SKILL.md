---
name: probe
description: "Safe-to-fail experiment for Complex domain problems where cause-effect is only visible in retrospect. Two-phase: foreground qualify → background probe → sense result. Use when: probe, safe-to-fail, test hypothesis, experiment with hypothesis, Complex domain with hypothesis. NOT for brainstorming (use brainstorm) or known cause-effect (use investigate)."
allowed-tools: AskUserQuestion, Read, Glob, Grep, WebSearch, WebFetch, Write, Bash, Task
model: opus
context: main
argument-hint: <hypothesis to probe>
cynefin-domain: complex
cynefin-verb: probe
---

# Probe

Safe-to-fail experiment in Complex domain. Cause-effect only visible in retrospect — probe to sense patterns, not to prove.

**Probing:** **$ARGUMENTS**

Check for handoff context: if `$ARGUMENTS` references a `probe-to-probe-llm.md` file, load it before Phase 1 — carried context accelerates qualification.

## ⚠️ AskUserQuestion Guard

**CRITICAL**: After EVERY `AskUserQuestion` call, check if answers are empty/blank. Known Claude Code bug: outside Plan Mode, AskUserQuestion silently returns empty answers without showing UI.

**If answers are empty**: DO NOT proceed with assumptions. Instead:
1. Output: "⚠️ Questions didn't display (known Claude Code bug outside Plan Mode)."
2. Present the options as a **numbered text list** and ask user to reply with their choice number.
3. WAIT for user reply before continuing.

## Phase 1: Qualify (foreground — MANDATORY)

**ENTRY GATE: Phase 2 does not start until Phase 1 is complete. No bypass path exists.**

### 1.1 Parse hypothesis

Extract from `$ARGUMENTS` or handoff context:
- Hypothesis statement (what you believe might be true)
- Enabling constraints already known (carry forward from prior cycles — do NOT rediscover)
- Confirm/refute criteria already defined (carry forward, update if refined)

If no hypothesis present: AskUserQuestion — ask user to state the hypothesis. Do not proceed without one.

### 1.2 Identify enabling constraints

Bounds without prescribing path:
- **Scope**: time, access, reversibility boundary
- **Immutable**: production systems, data integrity, user-facing state
- **Variable**: what can be freely changed within experiment

Carry forward from prior cycles unchanged unless explicitly updated.

### 1.3 Define confirm/refute criteria

Before running: define observable signals. For each criterion:
- Confirmed: observable evidence that supports the hypothesis
- Refuted: observable evidence that contradicts the hypothesis
- Surprise: unexpected result that suggests a different hypothesis

Criteria must be defined before Phase 2 executes. Gate on this.

### 1.4 Present probe plan

Output:
```
🔬 Probe → [constraints] → [steps] → [expected patterns] → [confirm/refute criteria] → GATE
```

Probe type (see `reference.md`): architecture | library | prompt | integration | design

### 1.5 Entry gate

AskUserQuestion — one call:
- "Proceed with probe? [Yes / Revise hypothesis / Revise criteria / Abort]"

On confirm: Phase 2 executes. On anything else: loop back to 1.1–1.4.

---

## Phase 2: Execute (background)

**Configuration: `isolation: worktree` + `run_in_background: true`**

Runs only after Phase 1 entry gate passes.

### 2.1 Execute probe steps

Run the experiment as defined in Phase 1. Prefer minimal, reversible actions. Gate frequency is SPARSE — enabling constraints bound the agent, not human micromanagement.

### 2.2 Sense patterns

Observe results against confirm/refute criteria:
- What signal emerged?
- What was unexpected?
- What constraints were discovered during execution?

### 2.3 Persist Thinking Artifact ⚠️ MANDATORY

**MUST execute before exit gate. DO NOT skip. DO NOT wait for user to ask.**

Write probe result to `$PRAXIS_DIR/thinking/probes/{project}/{date}-{slug}-llm.md`.

`{project}` = current project folder name (e.g., `agent-skills`, `gtd-pcm`). Create `$PRAXIS_DIR/thinking/probes/{project}/` if missing.

**Collision handling**: If filename exists, append sequence: `{date}-{slug}-2-llm.md`, `{date}-{slug}-3-llm.md`, etc. First write gets clean name.

**Guard**: If `$PRAXIS_DIR` is unset, warn user and skip artifact persistence: `⚠️ $PRAXIS_DIR not set — artifact not persisted. Set via: export PRAXIS_DIR="$HOME/dev/praxis"`

Content: hypothesis + enabling constraints + steps taken + observations + sensed patterns + result classification.

### 2.4 Exit gate

Classify result: `confirmed` | `refuted` | `partial` | `surprise`

Produce B4-compatible handoff:

| Result | When | Transition | Template |
|--------|------|-----------|----------|
| confirmed | Hypothesis holds | Complex → Complicated | `probe-to-investigate-llm.md` |
| partial (enough signal) | Some evidence, ready for expert analysis | Complex → Complicated | `probe-to-investigate-llm.md` |
| partial (need another angle) | Some evidence, hypothesis needs sharpening | Complex → Complex (re-probe) | `probe-to-probe-llm.md` |
| refuted / surprise | Hypothesis failed or unexpected result | Complex → Complex (brainstorm) | `probe-to-brainstorm-llm.md` |

Handoff token budget: target 300 tokens inline, flex 200-500, hard cap 600. References to `$PRAXIS_DIR/thinking` files do not count toward cap.

Self-transition: if result is `partial` and hypothesis can be sharpened, re-invoke `/probe` via `probe-to-probe-llm.md` with accumulated context. Prior cycles compressed to 200 tokens at 800-token accumulated cap.

---

## Refs

- `reference.md` — probe types, observability format, input quality table
- `probe-to-investigate-llm.md` — handoff: confirmed/partial → Complicated
- `probe-to-brainstorm-llm.md` — handoff: refuted/surprise → Complex (brainstorm)
- `probe-to-probe-llm.md` — handoff: partial → Complex (self-transition)
