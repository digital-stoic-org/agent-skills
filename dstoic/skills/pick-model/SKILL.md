---
name: pick-model
description: Recommend optimal Claude model (haiku/sonnet/opus) for a task. Use when user asks "which model", "pick model", "model for", or before starting costly/complex tasks. Covers tech and non-tech tasks.
model: haiku
context: main
---

# Pick Model

Classify user's task → recommend optimal model with reasoning.

## Instructions

1. Parse task description from `$ARGUMENTS`
2. Classify against decision matrix below
3. Output recommendation using format template

## Decision Matrix

| Signal → Model | Indicators |
|---|---|
| 🟢 **Haiku** | Simple transforms, formatting, translation, summarization (<2K words), regex, rename, typo fix, status query, template fill, data extraction, factual lookup (no reasoning) |
| 🟡 **Sonnet** | Content creation (blog, email, docs <2K words), single-file coding, bug fix, code review, research/analysis, moderate reasoning, test writing, PR review, explanation, creative/persuasive writing |
| 🔴 **Opus** | Multi-file refactor (3+ files), architecture/design decisions, complex debugging (multi-system), nuanced reasoning (ethics, strategy, ambiguity), long-form content >2K words, framework migration, security audit, novel algorithm design |

## Complexity Escalators

Upgrade one tier if task has:
- **Ambiguity**: Underspecified requirements → +1 tier
- **Scope**: Affects 3+ files or systems → +1 tier
- **Stakes**: Production/security/data-loss risk → +1 tier
- **Novelty**: No established pattern exists → +1 tier

Cap at Opus.

## Output Format

```
[emoji] **[Model]** — [1-line reason]

💰 Cost: [lowest/medium/highest] | ⚡ Speed: [fastest/medium/slowest]

💡 [Optional: "Consider [other model] if [condition]"]
```

## Examples

| Task | Recommendation |
|---|---|
| "summarize this meeting transcript" | 🟢 **Haiku** — simple text transformation |
| "write a blog post about AI trends" | 🟡 **Sonnet** — creative writing, moderate reasoning |
| "refactor auth across 15 files" | 🔴 **Opus** — multi-file architectural change |
| "fix typo in README" | 🟢 **Haiku** — trivial single edit |
| "design database schema for e-commerce" | 🔴 **Opus** — architectural decision with trade-offs |
| "translate paragraph to French" | 🟢 **Haiku** — simple language transform |
| "debug flaky integration test" | 🟡 **Sonnet** — single-system debugging |
| "plan microservices migration strategy" | 🔴 **Opus** — complex architectural planning |
| "extract emails from contact list" | 🟢 **Haiku** — simple data extraction |
| "draft sales proposal for enterprise client" | 🟡 **Sonnet** — persuasive writing, moderate reasoning |
| "plan 3-day conference agenda with speakers" | 🔴 **Opus** — complex scheduling with constraints |
