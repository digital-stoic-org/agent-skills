---
name: pick-model
description: Evaluate whether the CURRENT model+effort fits a task, and recommend a switch only when worth the cache cost. Use when user asks "which model", "pick model", "model for", "is haiku enough", or before starting costly/complex tasks. Does NOT execute the prompt — only judges fit. Covers tech and non-tech tasks.
model: sonnet
effort: low
context: main
---

# Pick Model

Take the user's intended prompt as input. **Do NOT execute it.** Read the live
session state, classify the prompt, emit **verdict + delta + strategy**: is the
current model right, and if not, is switching worth the cache cost.

**Two levers, different cost** (the core call):
- 🎚️ **Effort change, same model** → cache SURVIVES (cheap). Recommend freely.
- 🔀 **Model switch** → cache BREAKS, context re-read uncached (costly). Must beat the switch penalty.

> A **third lever — parallelism** (linear vs fan-out, sub-agents vs Workflow) — is out of scope here.
> To design a *skill/agent's* per-step execution topology (and have it call this skill per step), use `/pick-workflow`.

Recognize-then-route: hit the right tier directly; reserve top-tier (Opus `high` / Fable) for ambiguous/big/can't-classify. Effort = output-spend, not input. See `reference.md` for principles, routing detail, escalators, examples.

## Workflow

### 1. Read live state

```bash
pick-model-state
```

Emits `model= ctx_tokens= ctx_pct= cache_hit_pct= cost_usd= duration_min=`
(jq + path resolution live in `dstoic/scripts/pick-model-state`, on PATH). Bare
call — no shell expansion, so it's allowlistable and won't trigger a permission
prompt. Don't compute these by hand. **Fallback** (prints `state=missing`, or
command not found pre-sync): read model + ctx% from the statusline bar or ask
user; note `⚠️ estimated state`, never guess silently.

### 2. Classify + pick ideal model + effort

Match prompt to tier. Apply escalators (cap +1 tier). See cheatsheet + routing table in `reference.md`.

| Tier | Model | Effort | Shape |
|---|---|---|---|
| Chore | 🟢 Haiku 4.5 | none | convert/format/extract/typo/lookup |
| Plumbing/standard | 🟡 Sonnet 5 | `low`–`high` (default `medium`) | GTD/commit, single-file code, content, review, agentic tool use, light multi-file |
| Thinking | 🔴 Opus 4.8 | `high`→`xhigh` (⚠️ defaults `high`) | strategy, hard 3+ file refactor, architecture, **security/audit**, PhD-reasoning |
| Boulder | 🟣 Fable 5 | adaptive | multi-day, >200K context, sustained ambiguity |

Effort sets: Sonnet 5 `low|med|high|xhigh|max` · Opus `low|high|xhigh|max` · Haiku none · Fable adaptive-only.
⚠️ **Sonnet 5 default = `medium`** (`≈ Sonnet 4.6 @ high`). Avoid `xhigh`/`max` on Sonnet 5: new tokenizer ≈ +30% tokens → can cost MORE than Opus for similar quality. Need that depth → switch to Opus, don't crank Sonnet effort.

### 3. Quantify switch cost (only if ideal model ≠ current)

```bash
awk -v ctx=CTX_TOKENS -v hit=CACHE_HIT_PCT -v rate=NEW_RATE \
  'BEGIN{printf "switch_penalty ~ $%.3f\n", ctx*(rate/1000000)*(1-0.9*hit/100)}'
```

Rates $/M in: Sonnet 5 = 3 ($2 intro thru 2026-08-31) · Opus 5 · Fable 10. Higher ctx% + cache hit = costlier switch; late-session switch for marginal gain = waste → prefer effort tweak.

### 4. Emit verdict

```
🎯 Verdict: [✅ Stay | 🎚️ Change effort | 🔀 Switch | ⬆️ Upgrade | ⬇️ Downgrade]
Current:  [🤖 model] [effort] · 🧠 [ctx%] · ♻️ [cache%]
Ideal:    [model] [effort]
Why: [task shape vs current capability, 1-2 lines]
[if switch] 💾 ~$[penalty] re-cached → [worth it because… | NOT worth it, tweak effort instead]
🧭 Strategy: [e.g. "start Sonnet 5 med, escalate to Opus high only if scope >3 files or security-sensitive"]
```

**Logic:** same model+effort ok → ✅ Stay · same model, effort off → 🎚️ tweak (cheap) · diff model, gain > penalty → 🔀/⬆️/⬇️ · diff model but penalty high + gain marginal → stay/tweak, state trade-off · chore/plumbing on Opus → ⬇️.

## Anti-patterns

- ❌ Opus `high` as default — wastes tokens on chores/plumbing.
- ❌ Late high-context switch for marginal gain — re-cache > savings.
- ❌ Effort-as-input cost — it's output spend; on loops higher can be cheaper.
- ❌ Guessing current model — read state file or ask.
- ❌ Loading `/claude-api` for a model fact — use this skill's table.
