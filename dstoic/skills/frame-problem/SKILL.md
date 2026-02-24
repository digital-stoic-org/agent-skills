---
name: frame-problem
description: "Sense-making before action. Classify problem using Cynefin + Stacey to route to the right skill chain. Use when: frame, what approach, how should I start, which skill, where to begin, unsure what to do. NOT for known tasks — just do them."
allowed-tools: AskUserQuestion
model: sonnet
argument-hint: <task or problem to frame>
---

# Frame

Classify → route to right skill chain.

**Framing:** **$ARGUMENTS**

## 1. Qualify

**Question Refinement** (before classifying): If $ARGUMENTS is vague or broad, generate 2-3 clarifying sub-questions that sharpen the problem statement. Present them inline before the AskUserQuestion call. Skip if $ARGUMENTS is already specific.

AskUserQuestion — both questions in one call:

**Q1 "Situation"** (4 options):
- 🚨 Broken/urgent → Chaotic
- 🤔 Know WHAT, not HOW → Complicated/certainty
- 💬 Don't agree on WHAT → Complicated/agreement
- 🌫️ Unknown unknowns → Complex

If none match → Clear (just do it).

**Q2 "Scale"** (3 options, skip if Chaotic):
- 🪨 Boulder (multi-step, ambiguous)
- 🫧 Pebble (single file, obvious)
- ❓ Not sure

## 2. Classify + Route

Map answers to domain → skill chain:

| Domain | Route | OpenSpec? |
|--------|-------|-----------|
| Clear | Just code it | No |
| Complicated (HOW?) | `/investigate` → `/openspec-plan` | Boulder: yes |
| Complicated (WHAT?) | `/brainstorm` → decide → code | Boulder: yes |
| Complex | `/brainstorm` → `/investigate` → `/openspec-plan` | Yes |
| Chaotic | `/troubleshoot` → stabilize → re-frame | No |

Show: Mermaid quadrantChart — x: Certainty(HOW), y: Agreement(WHAT). Plot task position.

Present: `🎯 [Domain] → [skill chain] | OpenSpec: [yes/no] | Scale: [boulder/pebble]`

## 3. Handoff

AskUserQuestion "Proceed?": Start chain / Re-frame / Skip framing.

On confirm → invoke first skill with $ARGUMENTS.
