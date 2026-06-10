# Pick Model — Extended Reference

Verified June 2026. Companion to SKILL.md.

## Model Characteristics

### Haiku 4.5
- **$/M**: $1 in · $5 out — cheapest
- **Speed**: fastest (~2-3× Sonnet)
- **Context**: 200K
- **Effort**: none (param not supported)
- **Best for**: deterministic, pattern-based, low-reasoning — convert, transcribe, format, extract, regex, typo, status query
- **Limits**: ambiguity, multi-step reasoning, creative nuance

### Sonnet 4.6
- **$/M**: $3 in · $15 out
- **Speed**: baseline
- **Context**: 200K
- **Effort**: `low | medium | high` (no `xhigh`/`max`)
- **Best for**: plumbing (GTD, context, commit, library), single-file coding, bug fix, review, content, research summaries
- **Limits**: deep multi-file refactor, highly nuanced strategy

### Opus 4.8
- **$/M**: $5 in · $25 out · Fast Mode $10 · $50
- **Speed**: ~1.5-2× slower than Sonnet
- **Context**: 200K
- **Effort**: `low | high | xhigh | max` — ⚠️ **defaults to `high`** (raised from `medium`); set explicitly to lower spend
- **Best for**: strategy, fiscal, architecture, multi-file refactor, security audit, cognitive skills, framing ambiguous tasks
- **Limits**: overkill + costly for chores/plumbing; 200K ceiling

### Fable 5 (released 2026-06-09)
- **$/M**: $10 in · $50 out — most expensive
- **Context**: **1M tokens** (max output 128K)
- **Thinking**: **adaptive only** — no discrete effort levels, `thinking: disabled` unsupported
- **Best for**: ambitious, long-running, asynchronous, highly multi-step or sustained-ambiguity work; anything needing >200K context
- **Positioning**: Anthropic's most capable GA model — the boulder tier ABOVE Opus
- **Limits**: cost; do not use as an effort dial — pick it for task *shape*

## The Two-Lever Cost Model

| Lever | Cache effect | Bar to recommend |
|---|---|---|
| 🎚️ Effort change (same model) | survives | **low** — judge on quality delta only |
| 🔀 Model switch | breaks (re-read context uncached) | **high** — must beat switch penalty |

### Switch penalty formula

```
switch_penalty_$ ≈ context_tokens × new_model_input_rate × (1 − 0.9 × cache_hit_rate)
```

- Prompt caching = 90% input discount → switching forfeits warm cache.
- Penalty rises with context% (more to re-read) and cache hit rate (more warmth lost).
- Late-session + high-context + marginal gain → DON'T switch; tweak effort or stay.

### Worked examples

**A. 30% context, 60% cache hit, switch Sonnet→Opus**
- context_tokens ≈ 60K · Opus in-rate $5/M
- penalty ≈ 60K × $5/M × (1 − 0.54) ≈ **$0.14** → cheap, switch freely if task is Opus-shaped.

**B. 75% context, 95% cache hit, switch Sonnet→Opus**
- context_tokens ≈ 150K · Opus in-rate $5/M
- penalty ≈ 150K × $5/M × (1 − 0.855) ≈ **$0.11** + loses a deep warm cache + slows next turns.
- If gain is marginal → **stay, bump effort instead** (cache survives).

**C. Recognized chore on Opus 4.8 high**
- Don't reflexively switch to Haiku if context is large — first consider 🎚️ dropping Opus to `low`: zero re-cache, immediate output-spend cut.

## Routing Table (full)

| Task recognition | Model | Effort | Notes |
|---|---|---|---|
| **Chores** — convert, transcribe, format, extract, regex, typo, lookup, template fill | 🟢 Haiku 4.5 | n/a | Deterministic |
| **Plumbing** — GTD, context save/load, commit, library wiring, serialization | 🟡 Sonnet 4.6 | `low`–`medium` | Standard workflows |
| **Standard coding/content** — single-file fix, code review, blog/email, research summary, known-pattern API | 🟡 Sonnet 4.6 | `medium`–`high` | Moderate reasoning |
| **Thinking** — strategy, fiscal, multi-file refactor (3+), architecture, security audit, cognitive skills, long-form (>2K words) | 🔴 Opus 4.8 | `high`, sweep `xhigh` | Trade-offs, nuance |
| **Ambiguous / big / can't-classify** | 🔴 Opus 4.8 | `high` to frame & route | Drop tier once scope clears |
| **Boulder** — multi-day, highly multi-step, sustained ambiguity, or >200K context | 🟣 Fable 5 | adaptive | Above-Opus; 1M window |

### Escalators (apply, cap +1 tier)

- **Ambiguity** (underspecified, multiple interpretations) · **Scope** (3+ files/systems) · **Stakes** (prod, security, data-loss, regulatory) · **Novelty** (no established pattern) → +1
- **Multi-stakeholder / strategic / political / cross-functional** (business) → +1
- **Pattern detection / bias ID / ethical reasoning / multi-framework** (cognitive) → +1
- **Context > 200K needed** → jump to Fable 5
- Tie Haiku↔Sonnet: needs *any* judgment? → Sonnet. Sonnet↔Opus: trade-offs to balance? → Opus.

## Verdict Examples

| Intended prompt | Current | Verdict |
|---|---|---|
| "fix typo in README" | Opus 4.8 high | ⬇️ Haiku (or if 70% ctx: 🎚️ drop to `low`, switch not worth re-cache) |
| "refactor auth across 15 files" | Sonnet 4.6 high | ⬆️ Opus `high` (scope+stakes; worth it early-session) |
| "save session context" | Opus 4.8 high | ⬇️ Sonnet `low` (plumbing) |
| "design market-entry strategy" | Sonnet 4.6 high | 🔀 Opus `xhigh` (strategic, multi-framework) |
| "deep reasoning step, one-off" | Opus 4.8 high | 🎚️ `xhigh` for this step — cache survives, no switch |
| "audit + rewrite entire 400K-line repo" | Opus 4.8 | 🔀 Fable 5 (>200K context + long-horizon) |
| "summarize this transcript" | Haiku 4.5 | ✅ Stay (chore, optimal) |

## Interaction Patterns

| Pattern | Strategy |
|---|---|
| **One-shot** | Match task complexity; lower effort cheaper |
| **Iterative** | Start lower tier/effort, escalate only if it fails |
| **Agentic loop** | Higher effort can REDUCE total cost (better planning, fewer correction turns) |
| **Exploratory/learning** | Sonnet medium — patient, cheap enough to iterate |
| **Production/high-stakes** | +1 tier for safety |
| **Long-horizon / >200K context** | Fable 5 — only 1M-window tier |

## Signal Words

- **Haiku**: quick, simple, just, only, extract, format, rename, fix typo, convert, transcribe
- **Sonnet**: write, create, explain, review, analyze, debug, single file, summarize
- **Opus**: design, architect, complex, multiple files, refactor, migration, strategy, audit, nuanced, trade-offs
- **Fable**: end-to-end, autonomous, multi-day, whole repo, entire codebase, long-running, huge context
- **Effort-up cues**: "think hard", "be thorough", "deep", "carefully" → bump effort before switching model
- **Effort-down cues**: "quick", "rough", "draft", "just need" → drop effort

## Common Mistakes

- ❌ **Opus default**: using Opus `high` for typos/plumbing — 5-25× cost, often a downgrade or effort-drop is right.
- ❌ **Forgotten Opus default**: Opus 4.8 now defaults to `high` — silent cost creep; override for routine work.
- ❌ **Late switch**: switching model at 80% context for the last task — re-cache costs more than saved.
- ❌ **Effort-as-input confusion**: effort is output spend; on loops higher can be cheaper overall.
- ❌ **Fable as effort dial**: Fable is a task-shape choice (long/ambiguous/huge-context), not "Opus but more".
- ❌ **Guessing current model**: always read the state file or ask.

## Override

Always respect explicit user model/effort selection. User knows best on budget,
speed, past-experience preferences. This skill advises; it never executes the prompt.
