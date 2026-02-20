---
name: pick-model
description: Recommend optimal Claude model (haiku/sonnet/opus) for a task.
---

# Pick Model

Classify user's task → recommend optimal model with reasoning.

Output format:
```
[emoji] **[Model]** — [1-line reason]

💰 Cost: [lowest/medium/highest] | ⚡ Speed: [fastest/medium/slowest]
```

Models: Haiku (simple/fast/cheap), Sonnet (moderate reasoning, default), Opus (complex/strategic/multi-system).
