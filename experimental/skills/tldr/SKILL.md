---
name: tldr
description: Concise recap of the previous response. Use when user wants a quick summary of what just happened. Triggers include "tldr", "recap", "summarize last response", "what just happened".
context: main
model: haiku
user-invocable: true
---

# TL;DR — Recap Last Response

Summarize your **previous response** in ultra-concise terminal-friendly format.

## Rules

- Max 5 bullet points for summary
- Action items as checkboxes
- No prose, no headers beyond the two sections
- Skip sections if empty (e.g., no actions = no Next section)

## Output Format

```
## TL;DR
- 🎯 [main outcome or finding]
- 📁 [files changed/read, if any]
- ⚡ [key decision or result]

## Next
- [ ] [pending action 1]
- [ ] [pending action 2]
```
