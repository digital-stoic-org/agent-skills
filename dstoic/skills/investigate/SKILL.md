---
name: investigate
description: "Deep proactive analysis for complex technical problems requiring upfront thinking and design. Use when: investigate, deep dive, technical spike, design strategy, complex multi-constraint problem, figure out how to, how should I approach. NOT for errors (use troubleshoot) or option brainstorming (use brainstorm)."
allowed-tools: WebSearch, WebFetch, AskUserQuestion, Read, Write, Glob, Grep, Task
model: opus
context: main
argument-hint: <complex problem description>
cynefin-domain: complicated
cynefin-verb: analyze
---

# Investigate

Deep analysis for complex technical problems. Proactive (design-first), not reactive (error-first).

**You are investigating:** **$ARGUMENTS**

## ⚠️ AskUserQuestion Guard

**CRITICAL**: After EVERY `AskUserQuestion` call, check if answers are empty/blank. Known Claude Code bug: outside Plan Mode, AskUserQuestion silently returns empty answers without showing UI.

**If answers are empty**: DO NOT proceed with assumptions. Instead:
1. Output: "⚠️ Questions didn't display (known Claude Code bug outside Plan Mode)."
2. Present the options as a **numbered text list** and ask user to reply with their choice number.
3. WAIT for user reply before continuing.

## Workflow

`0.Scope → 1.Decompose → 2.Research → 3.Design → 4.Decide → 5.Persist → 6.Bridge`

### 0. Scope

AskUserQuestion to qualify:
- **Problem**: What exactly are you trying to achieve?
- **Constraints**: Environment, stack, access limitations, time budget?
- **Success criteria**: How will you know it's solved?

Skip if $ARGUMENTS already covers these.

### 1. Decompose

Break problem into sub-problems. See `protocols/decompose.md`.

1. **Issue Tree** (MECE): Mutually exclusive, collectively exhaustive breakdown
2. **Constraint Map**: Identify binding constraint (Theory of Constraints — optimize the bottleneck, not everything)
3. **Unknowns inventory**: What don't we know? What assumptions are we making?

Output: Mermaid diagram of sub-problems + dependencies.

### 2. Research

For each sub-problem, multi-angle investigation. See `protocols/research.md`.

1. **WebSearch**: Existing solutions, patterns, pitfalls for each sub-problem
2. **Codebase analysis**: Glob/Grep/Read relevant code (if applicable)
3. **IS / IS NOT** (Kepner-Tregoe): Bound the problem space — what is affected vs. not
4. Use Task (sub-agents) for parallel research on independent sub-problems

Output: Findings matrix — sub-problem × approach × evidence.

### 3. Design

Generate 2-3 alternative approaches. See `protocols/design.md`.

1. **Morphological Analysis** (Zwicky): Map solution dimensions → combine options systematically
2. **Trade-off matrix**: Effort × Risk × Fit × Maintainability
3. Visualize with Mermaid (architecture diagrams, sequence flows)

Output: Alternatives table with trade-offs.

### 4. Decide

1. **Weighted Decision Matrix**: Score alternatives against success criteria from Scope
2. **Pre-mortem** on winner: "It's 6 months later and this failed — why?"
3. **Assumptions list**: What must be true for this approach to work?

Output: Recommended approach + explicit risks.

### 5. Persist Thinking Artifact ⚠️ MANDATORY

**MUST execute before finishing. DO NOT skip. DO NOT wait for user to ask.**

Write investigation to `$THINKING_DIR/investigations/{project}/{date}-{slug}-llm.md`.

`{project}` = current project folder name (e.g., `agent-skills`, `gtd-pcm`). `{slug}` = lowercase hyphenated from problem statement. Create directory if missing.

**Collision handling**: If filename exists, append sequence: `{date}-{slug}-2-llm.md`, `{date}-{slug}-3-llm.md`. First write gets clean name.

**Guard**: If `$THINKING_DIR` is unset, warn user and skip artifact persistence: `⚠️ $THINKING_DIR not set — artifact not persisted. Set via: export THINKING_DIR="$HOME/dev/praxis/thinking"`

Content (required sections):
- Problem statement (from Scope)
- Decomposition (sub-problems + constraints)
- Research findings (per sub-problem)
- Alternatives evaluated (trade-off matrix)
- Decision + risks
- Bridge (next action: OpenSpec/pebble/spike)

### 6. Bridge

Handoff to execution:
- **Boulder** → Generate OpenSpec proposal (`/openspec-plan`)
- **Pebble** → Direct implementation plan (task list)
- **Still unclear** → Identify next spike/experiment needed

## ✅ Completion Checklist

Before responding to user, verify:
- [ ] Artifact written to `$THINKING_DIR` (or guard triggered if unset)

## Refs

- `protocols/decompose.md` — Issue Trees, MECE, Constraint Mapping
- `protocols/research.md` — Kepner-Tregoe IS/IS NOT, multi-angle probing
- `protocols/design.md` — Morphological Analysis, trade-off frameworks
