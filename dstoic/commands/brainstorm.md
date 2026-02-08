---
description: Divergent-convergent brainstorming with research, ideation, and trade-off analysis
allowed-tools: WebSearch, TaskCreate, TaskUpdate, TaskList, TaskGet, AskUserQuestion, Read, Write
argument-hint: [topic/problem]
model: opus
---

# Brainstorming Protocol

You are helping the user brainstorm solutions for: **$ARGUMENTS**

Follow this structured workflow:

## Phase 1: Research First 🔍

**ALWAYS start by researching** to avoid reinventing the wheel:

1. Generate 2-3 focused web searches:
   - Existing solutions/frameworks for this problem
   - Best practices and patterns (2025)
   - Real-world examples and case studies
2. Synthesize findings into key insights
3. Note what already exists vs. what's missing

## Phase 2: Divergent Thinking 💡

Generate **many options** using these techniques:

**SCAMPER Analysis** (modify existing solutions):
- **S**ubstitute: What can be replaced?
- **C**ombine: What can be merged?
- **A**dapt: What can be adjusted?
- **M**odify: What can be enhanced?
- **P**ut to other uses: New applications?
- **E**liminate: What can be removed?
- **R**everse: What if we flip it?

**Starbursting** (explore dimensions):
- WHO: Users, stakeholders, maintainers?
- WHAT: Core capabilities, outputs, inputs?
- WHEN: Timing, triggers, lifecycle?
- WHERE: Location, scope, boundaries?
- WHY: Goals, problems solved, value?
- HOW: Implementation, integration, workflow?

**Generate 5-10 distinct options** across different approaches:
- Simple/minimal vs. comprehensive
- DIY vs. use existing tools
- Quick prototype vs. robust solution
- Single-purpose vs. multi-purpose

Present options in a **table format**:
| # | Approach | Core Idea | Complexity | Novel Aspects |
|---|----------|-----------|------------|---------------|

## Phase 3: Convergent Thinking 🎯

**Auto-select convergence method** based on problem type:

- **If technical/architectural**: Use Weighted Scoring (criteria: effort, maintainability, flexibility, fit)
- **If product/feature**: Use Six Thinking Hats (logical, emotional, creative, critical, optimistic, process)
- **If tooling/workflow**: Use Constraint-Based (filter by time, resources, complexity, then compare)

For the chosen method:
1. Apply framework to each viable option
2. Show scoring/analysis in structured format
3. Identify top 2-3 finalists with rationale
4. **Surface trade-offs explicitly**: what you gain vs. what you sacrifice

## Phase 4: Recommendation & Next Steps ✅

1. **Recommend** the best option with clear reasoning
2. **Flag assumptions** that need validation
3. **Auto-detect boulder vs. pebble**:
   - **Boulder** (multi-step, architectural, ambiguous): Suggest creating OpenSpec proposal
   - **Pebble** (single file, obvious): Suggest immediate implementation

Present as:
```
📋 Recommendation: [Option X]

Why: [2-3 sentence rationale]

⚠️ Assumptions to validate:
- [Assumption 1]
- [Assumption 2]

🎯 Next Step: [OpenSpec proposal | Direct implementation | Further research needed]
```

## Output Style

- Use tables and structured formats (token-efficient)
- Use emojis per user's CLAUDE.md preferences
- Be concise in explanations, comprehensive in options
- Ask clarifying questions ONLY if problem statement is too vague
