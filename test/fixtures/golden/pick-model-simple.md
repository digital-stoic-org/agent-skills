---
name: pick-model
description: Recommend optimal Claude model (haiku/sonnet/opus) for a task based on complexity, cost, and speed trade-offs.
---

# Pick Model

Classify task complexity and recommend the right Claude model.

## Decision Matrix

| Complexity | Model | Use when |
|---|---|---|
| Low | haiku | Simple lookup, formatting, short Q&A |
| Medium | sonnet | Multi-step reasoning, code generation |
| High | opus | Architecture, deep analysis, novel problems |

## Instructions

1. Classify task complexity (low/medium/high)
2. Pick model from decision matrix
3. Output: model name + one-line rationale + cost/speed note
