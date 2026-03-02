---
name: frame-problem
description: "Sense-making before action. Classify problem using Cynefin to route to the right skill chain. Use when: frame, what approach, how should I start, which skill, where to begin, unsure what to do. NOT for known tasks — just do them."
allowed-tools: AskUserQuestion
model: opus
context: main
argument-hint: <task or problem to frame>
cynefin-domain: confused
cynefin-verb: decompose
---

# Frame

Classify → route to right skill chain. Domain determines agent pattern, not just skill.

**Framing:** **$ARGUMENTS**

## 0. Auto-classify (skip if no $ARGUMENTS)

Read `$ARGUMENTS`. Attempt Cynefin domain classification using constraint language.

**If confidence ≥80%**: Propose classification — do NOT decide unilaterally.
```
🎯 Auto-classified: [Domain] (constraint: [type])
→ Verb: [probe|analyze|execute|act|decompose]
→ Suggested route: [skill chain]
Confirm? [Yes / Re-classify manually]
```

**If confidence <80%** or no $ARGUMENTS: Skip to Q1 (full qualification).

For Complicated domain with ≥80% confidence: also determine evolving vs degraded from context if possible. If clear → skip Q1.1 and route directly.

## ⚠️ AskUserQuestion Guard

**CRITICAL**: After EVERY `AskUserQuestion` call, check if answers are empty/blank. Known Claude Code bug: outside Plan Mode, AskUserQuestion silently returns empty answers without showing UI.

**If answers are empty**: DO NOT proceed with assumptions. Instead:
1. Output: "⚠️ Questions didn't display (known Claude Code bug outside Plan Mode)."
2. Present the options as a **numbered text list** and ask user to reply with their choice number.
3. WAIT for user reply before continuing.

## 1. Qualify

**Question Refinement** (before classifying): If $ARGUMENTS is vague or broad, generate 2-3 clarifying sub-questions that sharpen the problem statement. Present them inline before the AskUserQuestion call. Skip if $ARGUMENTS is already specific.

AskUserQuestion — both questions in one call:

**Q1 "Constraints"** (5 options, constraint-based):
- 🔒 **Rigid** — rules are fixed, process is known → Clear
- 📐 **Governing** — experts exist, best practices apply → Complicated
- 🌱 **Enabling** — experimentation needed, cause-effect unclear → Complex
- 🚨 **Absent** — no constraints, crisis or deliberate disruption → Chaotic
- ❓ **Can't tell** — none match or situation is mixed → Confused

**Q1.1 "Complicated sub-question"** (only if Q1 = Governing/Complicated):
- 📈 **Evolving** — system improving, capacity growing → `/investigate`
- 📉 **Degraded** — system failing, quality declining → `/troubleshoot`

*(Skip Q1.1 if auto-classify already determined evolving vs degraded)*

**Q2 "Scale"** (3 options, skip if Chaotic):
- 🪨 Boulder (multi-step, ambiguous, architectural)
- 🫧 Pebble (single file, obvious implementation)
- ❓ Not sure

## 2. Classify + Route

Map constraint type → domain → verb → skill chain:

| Domain | Constraint | Verb | Scale | Route | OpenSpec? |
|--------|-----------|------|-------|-------|-----------|
| Clear | Rigid | execute | Pebble | Just code it | No |
| Clear | Rigid | execute | Boulder | `/openspec-develop` directly | Yes |
| Complicated | Governing/Evolving | analyze | Any | `/investigate` → `/openspec-plan` | Boulder: yes |
| Complicated | Governing/Degraded | analyze | Any | `/troubleshoot` → stabilize → re-frame | No |
| Complex | Enabling/no hypothesis | probe | Any | `/brainstorm` → `/probe` → `/openspec-plan` | Yes |
| Complex | Enabling/has hypothesis | probe | Any | `/probe` → sense → `/openspec-plan` | Yes |
| Chaotic | Absent | act | — | `/experiment` → stabilize → `/frame-problem` | No |
| Confused | Unknown | decompose | Any | `/frame-problem` (re-classify after clarifying) | — |

Present: `🎯 [Domain] → [Verb] → [skill chain] | OpenSpec: [yes/no] | Scale: [boulder/pebble]`

## 3. Handoff

AskUserQuestion "Proceed?": Start chain / Re-frame / Skip framing.

On confirm → invoke first skill with $ARGUMENTS.
