---
name: brainstorm
description: Divergent-convergent brainstorming with research, ideation, and trade-off analysis. Use when exploring options, generating ideas, comparing approaches. Triggers include "brainstorm", "explore options", "ideate", "compare approaches".
argument-hint: "[topic/problem]"
allowed-tools: [WebSearch, Read, Write, AskUserQuestion]
model: opus
context: main
user-invocable: true
---

# Brainstorming Protocol

You are helping the user brainstorm solutions for: **$ARGUMENTS**

## Phase 1: Research First 🔍

**ALWAYS start by researching** to avoid reinventing the wheel:

1. Generate 2-3 focused web searches (existing solutions, best practices, real-world examples)
2. Synthesize findings into key insights
3. Note what already exists vs. what's missing

## Phase 2: Divergent Thinking 💡

Generate **5-10 distinct options** using SCAMPER + Starbursting:

| # | Approach | Core Idea | Complexity | Novel Aspects |
|---|----------|-----------|------------|---------------|

## Phase 3: Convergent Thinking 🎯

**Auto-select method** based on problem type:
- **Technical/architectural**: Weighted Scoring
- **Product/feature**: Six Thinking Hats
- **Tooling/workflow**: Constraint-Based filtering

Identify top 2-3 finalists with trade-offs.

## Phase 4: Recommendation ✅

1. Recommend best option with reasoning
2. Flag assumptions to validate
3. Auto-detect boulder vs. pebble → suggest OpenSpec or direct implementation

See `reference.md` for SCAMPER details, Starbursting dimensions, and convergence frameworks.
