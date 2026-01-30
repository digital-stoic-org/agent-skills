---
description: Create or audit RISEN prompts with structure validation
allowed-tools: Read, Write, Edit, Glob, Grep
argument-hint: <file> [--audit]
model: sonnet
---

# Edit RISEN Prompt

Create structured RISEN prompts from messy notes OR audit existing RISEN prompts for completeness and quality.

## Usage

```
/edit-risen-prompt <path-to-file>           # Create mode: transform messy notes
/edit-risen-prompt <path-to-file> --audit   # Audit mode: review existing RISEN prompt
```

## What This Command Does

### CREATE Mode (default)
Takes your incomplete/messy notes and transforms them into a complete RISEN prompt with:

1. ✅ **Role** section - Defines assistant identity and competencies
2. ✅ **INPUT** section - Priority-based tables (HIGH/MED/LOW) with file references
3. ✅ **STEPS** section - Sequential workflow with checkpoints and .ctx management
4. ✅ **EXPECTATIONS** section - Deliverables, audience, quality standards
5. ✅ **NARROWING** section - Compliance, constraints, quality gates

### AUDIT Mode (--audit flag)
Reviews an existing RISEN prompt and provides:

1. 🔍 **Structure validation** - Checks all 5 sections present and complete
2. ⚠️ **Gap identification** - Missing elements, weak areas
3. ✅ **Strengths** - Well-implemented aspects
4. 💡 **Recommendations** - Specific improvements with examples
5. 📊 **Scoring** - Quality rating per section (0-5 scale)

## Process

### Phase 1: Mode Detection & Analysis (Sonnet)

**Detect mode:**
- Check for `--audit` flag
- If audit: Validate RISEN structure exists
- If create: Treat as messy notes

**Analysis:**
1. Read the file
2. Identify existing sections and content
3. Detect gaps and missing elements
4. Determine task type for step pattern suggestion (create mode only)

### Phase 2A: CREATE Mode - Structure Enhancement (Sonnet)

**Role Section:**
- Extract or infer role identity
- List relevant competencies
- Keep concise and context-specific

**INPUT Section:**
- Organize files/resources into priority tables:
  - Priority 1 (HIGH): Critical documents
  - Priority 2 (MED): Supporting context
  - Priority 3 (LOW): Reference material
- Use `@./path` format for file references
- Add descriptions for each file

**STEPS Section:**
- Apply step pattern library based on task type:
  - **Research → Analysis → Creation**: For content/deliverable generation
  - **Audit → Recommend → Implement**: For optimization/improvement tasks
  - **Explore → Design → Build**: For new feature development
  - **Gather → Synthesize → Document**: For knowledge consolidation
  - **Review → Refine → Validate**: For quality improvement
- Add `.ctx` folder management:
  - Step-numbered context files (01-, 02-, etc.)
  - Checkpoint after each step for user validation
  - Resumability from .ctx folder
- Include model specifications:
  - **Sonnet 4.5**: Context loading, analysis, research, data processing
  - **Opus 4.5**: Creative work, subjective decisions, complex synthesis, content generation
- Add universal instructions:
  - Sequential execution with user validation
  - Ask clarifications before proceeding
  - Use web search if needed
  - No hallucinations (state uncertainty explicitly)
  - Resumability from .ctx folder

**EXPECTATIONS Section:**
- Define deliverable format
- Specify audience and context
- Set content quality standards
- Define interaction requirements (if applicable)
- Add structure/composition guidelines
- Include technical considerations
- List final deliverables package (with .ctx files)
- Define quality gates/checkpoints

**NARROWING Section:**
- Core compliance requirements
- Audience specificity
- Style and narrative constraints
- Quality standards (no hallucinations, no assumptions, checkpoint discipline)
- Context efficiency guidelines

### Phase 2B: AUDIT Mode - Quality Assessment (Sonnet)

**For each RISEN section, evaluate:**

**Role Section (0-5 scoring):**
- ✅ Clear identity defined (who is the assistant?)
- ✅ Relevant competencies listed
- ✅ Context-specific (not generic)
- ⚠️ Missing: Vague role, no competencies, too generic
- 💡 Recommend: Specific improvements with examples

**INPUT Section (0-5 scoring):**
- ✅ Priority tables present (HIGH/MED/LOW)
- ✅ File references use `@./path` format
- ✅ Descriptions provided for each file
- ✅ Logical prioritization (critical vs supporting)
- ⚠️ Missing: No priorities, no descriptions, unclear structure
- 💡 Recommend: Better organization, missing files, priority adjustments

**STEPS Section (0-5 scoring):**
- ✅ Sequential workflow with clear progression
- ✅ Checkpoints for user validation
- ✅ .ctx folder management included
- ✅ Model specifications (Sonnet vs Opus)
- ✅ Universal instructions (clarifications, no hallucinations, resumability)
- ⚠️ Missing: No checkpoints, missing .ctx pattern, no model specs, steps too vague
- 💡 Recommend: Add missing elements, clarify steps, improve checkpoint placement

**EXPECTATIONS Section (0-5 scoring):**
- ✅ Deliverable format defined
- ✅ Audience and context specified
- ✅ Quality standards articulated
- ✅ Final deliverables package listed
- ✅ Quality gates/checkpoints defined
- ⚠️ Missing: Vague expectations, no audience clarity, missing deliverables list
- 💡 Recommend: Add specificity, clarify audience, enumerate deliverables

**NARROWING Section (0-5 scoring):**
- ✅ Core compliance requirements
- ✅ Audience specificity constraints
- ✅ Style/narrative constraints
- ✅ Quality standards (no hallucinations, checkpoint discipline)
- ⚠️ Missing: Too permissive, no constraints, unclear boundaries
- 💡 Recommend: Add constraints, tighten boundaries, clarify standards

**Overall Assessment:**
- Total score: X/25
- Rating: Excellent (20-25) | Good (15-19) | Needs Work (10-14) | Poor (<10)
- Top 3 strengths
- Top 3 areas for improvement
- Priority fix recommendations

### Phase 3: Output (Sonnet)

**CREATE Mode:**
Write the structured RISEN prompt to a new file:
- Same directory as input file
- Named: `[original-name]-risen.md`
- Complete RISEN structure
- All sections populated
- Gaps filled with intelligent suggestions

**AUDIT Mode:**
Write audit report to a new file:
- Same directory as input file
- Named: `[original-name]-audit.md`
- Section-by-section scoring
- Strengths and weaknesses
- Actionable recommendations
- Priority improvements list

## Step Pattern Library

### Pattern: Research → Analysis → Creation
**Best for:** Deliverable generation, content creation, presentation building

**Steps:**
1. Context Engineering - Load and organize input documents
2. Analysis - Analyze requirements and constraints
3. Structure Design - Create detailed outline/TOC
4. Content Mapping - Identify reusable content
5. Generation - Create the deliverable
6. Formatting - Apply style/format requirements
7. Review - Quality check and validation

**Models:** Steps 1-2 (Sonnet), Steps 3-7 (Opus for creative/subjective work)

### Pattern: Audit → Recommend → Implement
**Best for:** Optimization, improvements, refactoring

**Steps:**
1. Current State Analysis - Assess existing situation
2. Gap Identification - Find problems/opportunities
3. Recommendation - Propose solutions
4. Implementation Plan - Design approach
5. Execution - Apply changes
6. Validation - Verify improvements

**Models:** Steps 1-3 (Sonnet for analysis), Steps 4-6 (Opus for complex decisions)

### Pattern: Explore → Design → Build
**Best for:** New features, greenfield projects

**Steps:**
1. Discovery - Explore codebase/requirements
2. Architecture Design - Design approach
3. Planning - Break down tasks
4. Implementation - Build the feature
5. Testing - Verify functionality
6. Documentation - Document changes

**Models:** Steps 1-3 (Sonnet for exploration), Steps 4-6 (Opus for complex implementation)

### Pattern: Gather → Synthesize → Document
**Best for:** Knowledge work, research consolidation

**Steps:**
1. Information Gathering - Collect all sources
2. Content Organization - Structure information
3. Synthesis - Combine and analyze
4. Documentation - Create final output
5. Review - Quality validation

**Models:** Steps 1-2 (Sonnet), Steps 3-5 (Opus for synthesis and creative documentation)

### Pattern: Review → Refine → Validate
**Best for:** Quality improvement, iteration

**Steps:**
1. Initial Review - Assess current state
2. Feedback Collection - Gather requirements
3. Refinement - Make improvements
4. Validation - Check quality
5. Finalization - Complete and deliver

**Models:** Steps 1-2, 4 (Sonnet for review/validation), Step 3 (Opus for refinement)

## .ctx Folder Management Pattern

For any multi-step RISEN prompt, include:

```markdown
## STEP X: [STEP NAME]

- [Step instructions...]
- Save as .ctx/0X-[descriptive-name].md
- **CHECKPOINT**: User validates [what needs validation]
```

**Context efficiency rules:**
- Priority 1 (HIGH): Create summary if doc > 2000 tokens
- Priority 2 (MED): Create summary if doc > 5000 tokens
- Priority 3 (LOW): Always create summary (reference material)
- Otherwise: Copy file to .ctx folder

**Resumability:**
- All .ctx files numbered (01-, 02-, etc.)
- Each step self-contained
- Session can resume from any STEP
- Index file (.ctx/01-context-index.md) lists all loaded context

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
- **INPUT**: Tables with HIGH/MED/LOW priorities for proposal, style guide, templates
- **STEPS**: 7 steps from context loading → transcript generation → gamma prompt
- **EXPECTATIONS**: 40-45 slides, interaction ratio, quality standards
- **NARROWING**: Compliance rules, audience constraints, style requirements

## Model Selection Guidelines

### Use Sonnet 4.5 for:
- Context loading and organization
- Data analysis and parsing
- Research and information gathering
- Structural tasks (TOC, outlines)
- Fact-checking and validation
- Technical documentation

### Use Opus 4.5 for:
- Creative content generation
- Subjective decision-making
- Complex synthesis and storytelling
- Strategic planning
- Visual design decisions
- Nuanced quality judgments

### Specify in STEPS section:
```markdown
**Model Specification**: Use **Claude Opus 4.5** for STEPS X-Y (creative/subjective work: [examples]). Sonnet 4.5 is acceptable for STEPS 1-Z (analysis, context loading).
```

## Audit Report Format

**AUDIT Mode output structure:**

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
✅ **Strengths:**
- [specific positive findings]

⚠️ **Issues:**
- [specific problems found]

💡 **Recommendations:**
- [actionable improvements with examples]

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
2. [Important improvement with example]
3. [Enhancement suggestion with example]

## Scoring Criteria Reference
- 5: Excellent - All elements present, well-crafted, clear
- 4: Good - Complete with minor improvements needed
- 3: Adequate - Functional but missing important elements
- 2: Weak - Significant gaps or unclear structure
- 1: Poor - Minimal content, major restructuring needed
- 0: Missing - Section absent or unusable
```

## Notes

**CREATE Mode:**
- Output file created in same directory as input
- Named: `[original-name]-risen.md`
- Original notes file remains unchanged
- Review and adjust the generated RISEN prompt as needed
- File paths can be updated manually after generation
- Model specifications should match task complexity

**AUDIT Mode:**
- Output audit report created in same directory
- Named: `[original-name]-audit.md`
- Original RISEN prompt remains unchanged
- Use recommendations to improve the prompt
- Re-run audit after making changes to track progress
