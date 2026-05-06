---
name: edit-risen-prompt
description: Create or audit RISEN prompts with structure validation. Use when creating structured prompts from notes, auditing existing RISEN prompts, or improving prompt quality. Triggers include "risen prompt", "edit risen", "create risen", "audit risen", "structure prompt".
argument-hint: "<file> [--audit]"
allowed-tools: [Read, Write, Edit, Glob, Grep]
model: sonnet
context: main
user-invocable: true
---

# Edit RISEN Prompt

Create structured RISEN prompts from messy notes OR audit existing RISEN prompts.

## Determine Mode

- **CREATE** (default): `$1` is messy notes → transform to complete RISEN
- **AUDIT** (`--audit` flag): `$1` is existing RISEN → score and recommend

## CREATE Mode

### Phase 1: Analysis
1. Read the file
2. Identify existing sections, gaps, task type

### Phase 2: Structure Enhancement

**Role**: Extract/infer identity + competencies (concise, context-specific)

**INPUT**: Organize into priority tables:
- Priority 1 (HIGH): Critical documents
- Priority 2 (MED): Supporting context
- Priority 3 (LOW): Reference material
- Use `@./path` format for file references

**STEPS**: Apply step pattern from library (see reference.md):
- Research → Analysis → Creation (deliverables)
- Audit → Recommend → Implement (optimization)
- Explore → Design → Build (new features)
- Gather → Synthesize → Document (knowledge)
- Review → Refine → Validate (quality)

Add: `.ctx` management, checkpoints, model specs (Sonnet for analysis, Opus for creative), resumability

**EXPECTATIONS**: Deliverable format, audience, quality standards, final package, quality gates

**NARROWING**: Compliance, audience specificity, style constraints, no hallucinations, checkpoint discipline

### Phase 3: Output
Write to `[original-name]-risen.md` in same directory.

## AUDIT Mode

### Phase 2B: Score each section (0-5)
- **Role**: Identity defined? Competencies listed? Context-specific?
- **INPUT**: Priority tables? `@./path` format? Descriptions?
- **STEPS**: Sequential workflow? Checkpoints? .ctx management? Model specs?
- **EXPECTATIONS**: Deliverables defined? Audience? Quality standards?
- **NARROWING**: Compliance? Constraints? Quality gates?

**Overall**: X/25 — Excellent (20-25) | Good (15-19) | Needs Work (10-14) | Poor (<10)

### Phase 3: Output
Write audit report to `[original-name]-audit.md`.

See `reference.md` for step pattern library, .ctx management, model selection, audit template.
