# edit-risen-prompt Reference

## Step Pattern Library

### Research → Analysis → Creation
**Best for:** Deliverable generation, content creation, presentations
1. Context Engineering — Load and organize inputs
2. Analysis — Analyze requirements and constraints
3. Structure Design — Create outline/TOC
4. Content Mapping — Identify reusable content
5. Generation — Create the deliverable
6. Formatting — Apply style/format
7. Review — Quality check
**Models:** Steps 1-2 (Sonnet), Steps 3-7 (Opus)

### Audit → Recommend → Implement
**Best for:** Optimization, improvements, refactoring
1. Current State Analysis
2. Gap Identification
3. Recommendation
4. Implementation Plan
5. Execution
6. Validation
**Models:** Steps 1-3 (Sonnet), Steps 4-6 (Opus)

### Explore → Design → Build
**Best for:** New features, greenfield projects
1. Discovery — Explore codebase/requirements
2. Architecture Design
3. Planning — Break down tasks
4. Implementation
5. Testing
6. Documentation
**Models:** Steps 1-3 (Sonnet), Steps 4-6 (Opus)

### Gather → Synthesize → Document
**Best for:** Knowledge work, research consolidation
1. Information Gathering
2. Content Organization
3. Synthesis
4. Documentation
5. Review
**Models:** Steps 1-2 (Sonnet), Steps 3-5 (Opus)

### Review → Refine → Validate
**Best for:** Quality improvement, iteration
1. Initial Review
2. Feedback Collection
3. Refinement
4. Validation
5. Finalization
**Models:** Steps 1-2, 4 (Sonnet), Step 3 (Opus)

## .ctx Folder Management

```markdown
## STEP X: [STEP NAME]
- [Step instructions...]
- Save as .ctx/0X-[descriptive-name].md
- **CHECKPOINT**: User validates [what needs validation]
```

**Context efficiency rules:**
- Priority 1 (HIGH): Summarize if > 2000 tokens
- Priority 2 (MED): Summarize if > 5000 tokens
- Priority 3 (LOW): Always summarize (reference material)
- Otherwise: Copy to .ctx folder

**Resumability:** All files numbered (01-, 02-), each step self-contained, index file lists all context.

## Model Selection

**Sonnet**: Context loading, analysis, research, parsing, structural tasks, fact-checking, technical docs
**Opus**: Creative content, subjective decisions, complex synthesis, strategic planning, visual design, nuanced judgments

Specify in STEPS:
```
**Model Specification**: Use **Claude Opus 4.5** for STEPS X-Y (creative/subjective). Sonnet 4.5 for STEPS 1-Z (analysis).
```

## Audit Report Template

```markdown
# RISEN Prompt Audit Report
**File**: [original-file]
**Date**: [date]
**Overall Score**: X/25 (Rating)

## Executive Summary
- Top 3 Strengths
- Top 3 Areas for Improvement
- Priority Recommendations

## Section Analysis

### Role Section (Score: X/5)
✅ **Strengths:** [findings]
⚠️ **Issues:** [problems]
💡 **Recommendations:** [improvements with examples]

### INPUT Section (Score: X/5)
[same structure]

### STEPS Section (Score: X/5)
[same structure]

### EXPECTATIONS Section (Score: X/5)
[same structure]

### NARROWING Section (Score: X/5)
[same structure]

## Priority Action Items
1. [Critical fix with example]
2. [Important improvement]
3. [Enhancement suggestion]

## Scoring Criteria
- 5: Excellent — All elements present, well-crafted
- 4: Good — Complete with minor improvements
- 3: Adequate — Functional but missing elements
- 2: Weak — Significant gaps
- 1: Poor — Minimal content
- 0: Missing — Section absent
```

## Example Transformation

**Input (messy notes):**
```
need to create presentation for client X
- 2 hour session
- business leaders
- need slides
- reference: boissel transcript
files: proposal.md, style-guide.md
```

**Output (structured RISEN):**
- **Role**: Presentation designer with expertise in...
- **INPUT**: Tables with HIGH/MED/LOW for proposal, style guide, templates
- **STEPS**: 7 steps from context loading → transcript generation → gamma prompt
- **EXPECTATIONS**: 40-45 slides, interaction ratio, quality standards
- **NARROWING**: Compliance, audience constraints, style requirements
