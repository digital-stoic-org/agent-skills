# Post-Mortem — Reference

The template below IS the product. The quality bar: a retrospective that is honest, root-caused, quantified where possible, and ends in a reusable playbook. Fill it by introspecting the live session — never by parsing logs.

## Table of Contents
- [Number tagging](#number-tagging) — the [measured]/[estimate] rule
- [Compaction notice](#compaction-notice) — mandatory when the session was compacted
- [Core sections](#core-sections) — the 9 always-present sections
- [Optional sections](#optional-sections) — add when insightful
- [Output template](#output-template) — the exact file shape

---

## Number tagging

Every quantity in the report carries a tag:

- **`[measured]`** — knowable from inside the context. Includes: **sub-agent/fork token counts** (they arrived in the completion notifications you received, e.g. `subagent_tokens`), **tool-call counts you remember making**, wall-clock spans you can read off your own timestamps, files you wrote, sub-agents you spawned.
- **`[estimate ±X]`** — NOT knowable from inside. Includes: **main-context token total** (you cannot see your own accumulation), **cache hit/read ratios**, **compaction pre/post token numbers** (you only saw a notification, not the ledger). Give a range and a one-line basis (e.g. "~300-500k [estimate] — basis: ~120 tool calls + 15 vision reads @ ~1.5k each + repeated heredocs").

Example of the discipline: `total sub-agents: 725 862` (measured, summed from the completion notifications) but `contexte principal: non mesurable de l'intérieur ; estimation ~300-500k`. **Do the same. Faking a precise main-context number is the cardinal sin of this skill.**

Session total = Σ sub-agent tokens `[measured]` + main-context `[estimate]`. Present both, then the combined `[estimate]`.

---

## Compaction notice

If the session was continued from a compacted summary (you were resumed from a summary, or you recall auto/manual compaction firing mid-session), you MUST:

1. State it near the top of Bilan chiffré: `⚠️ Cette session a subi N compaction(s). Tout ce qui précède la 1re compaction est reconstruit depuis un résumé avec perte — fidélité réduite.`
2. Re-read your own in-context resume-summary and note **what detail it no longer lets you verify** (exact tool sequences, precise ordering, intermediate values). Name the blind spots; don't paper over them.
3. In Chronologie, mark pre-compaction phases with `(reconstruit depuis résumé)`.

You cannot recover the pre-compaction detail from a file (this skill doesn't read logs) — so the honest move is to flag the degradation, not to invent a crisp early-session account.

---

## Core sections

Always all nine. Directives per section:

| # | Section | What to write | The trap to avoid |
|---|---|---|---|
| 1 | **La mission** | One paragraph: objective + the hard constraint + the *measured* result. | Vague "we built X" — state the constraint and the metric. |
| 2 | **L'idée maîtresse** 🎯 | The SINGLE most-leveraged decision and its cascade of consequences (e.g. "making the legacy build runnable locally as an executable oracle"). Exactly one. | A flat list of good ideas — forcing one surfaces the real lever. |
| 3 | **Chronologie** | Phases oldest→newest: what / tools / outcome, timestamps where known, `(reconstruit)` if pre-compaction. | Recency bias collapsing the early hour; skipping the boring inventory phase that actually set everything up. |
| 4 | **Bilan chiffré** | Tokens (per sub-agent [measured] + main [estimate] + total), wall-clock, human-active time, autonomy ratio, longest autonomous streak, production output (files/lines/artifacts), the acceptance metric. Compaction notice here. | Untagged numbers; forgetting sub-agent tokens are billed separately from main. |
| 5 | **Ce qui a marché ✅** | Concrete moves to repeat *systematically*, each with *why it worked*. | Generic praise — tie each to a mechanism. |
| 6 | **Échecs & fausses pistes ❌** | Every dead-end, wrong hypothesis, revert, with **root cause → lesson**. MUST be ≥ section 5 in substance. | Under-reporting (self-serving bias); "I erred" with no cause and no transferable lesson. |
| 7 | **Où économiser 💰** | Measured/estimated waste, itemized: redundant work, fork-vs-fresh-agent misfit, repeated scripts/heredocs, unnecessary vision reads, model switches that broke cache. Each with a token cost tag. | Hand-wave "could be faster" — quantify or flag as estimate. |
| 8 | **Playbook réutilisable** 📘 | The generalizable procedure for *this class of task*, numbered, so the next session skips the dead-ends. Include a rough budget line. | Skill-specific trivia — write what transfers. |
| 9 | **Rôle exact de l'humain** | Table: each human intervention, what it decided, est. duration. Names what the agent could NOT do alone. | Erasing the human, or inflating autonomy. |

---

## Optional sections

Add when the session makes them insightful — they extend the core nine, include them only when they earn their place:

- **Tool-call histogram** — counts per tool you recall (`Bash ×N`, `Read ×N`, `Agent ×N`). Cheap, exposes thrash (e.g. 4× the same heredoc = you'd see 4 Bash calls doing the same thing). Tag `[measured]` for what you're sure of.
- **Rework / revert ledger** — a focused list of every "did X, then reverted/redid it" with the cost. These are the most expensive and most learnable moments — reverts routinely carry a session's sharpest lessons. Often the highest-signal addition.
- **Agent-delegation review** — per sub-agent: was the brief right-sized? fork vs fresh-agent correct? did two agents re-process the same material? Only if agents were spawned.
- **Decision ledger** — the key branch points where you chose A over B, with the rationale, so the *why* survives (rationale gets re-litigated otherwise).
- **Cache / model-switch note** — if you switched model mid-session, flag it: switches break the prompt cache → context re-read uncached (this is what `/pick-model` computes). A real, often-invisible cost.
- **Assumptions that held / broke** — which early assumptions the session validated vs. blew up, and when you found out. Sharpens future scoping.
- **What I'd delegate differently** — forward-looking counterfactual: same task again, what changes in the agent architecture.

Pick the 1-3 that carry signal for THIS session. Don't bolt on all seven — that's noise.

---

## Output template

Write this to `post-mortem-YYYYMMDDHHmm.md`. French or English to match the session's working language. Fill from introspection; keep it dense (tables, a mermaid diagram for the agent architecture if forks were used, ✅/❌/💰/🎯 markers).

```markdown
# Post-mortem — {session title / mission in a few words}

> Rétrospective introspective de la session du {date}. Écrit depuis le contexte vif en fin de session.
> Modèle : {model}. Durée : ~{wall-clock} [measured/estimate], dont ~{human-active} de temps humain.
> {⚠️ compaction notice if applicable}

---

## 1. La mission
{objective + hard constraint + measured result, one paragraph}

## 2. L'idée maîtresse 🎯
{the ONE most-leveraged decision + its cascade}

## 3. Chronologie
{phases oldest→newest; table per phase: étape | outils | résultat; mark (reconstruit) if pre-compaction}

## 4. Bilan chiffré
{⚠️ compaction notice here if applicable}
```yaml
⏱️ Temps:
  wall-clock: ~{X} min [measured|estimate]
  humain actif: ~{Y} min [measured]
  ratio autonomie: ~{Z}%  ; plus longue séquence autonome: {W} min
🧮 Tokens:
  {sub-agent A}: {n} [measured]
  {sub-agent B}: {n} [measured]
  total sub-agents: {sum} [measured]
  contexte principal: ~{range} [estimate — basis: ...]
  session totale: ~{range} [estimate]
📦 Production:
  {files / lines / artifacts} [measured]
  critère d'acceptation: {metric}
🤝 Humain: {n gates, n decisions}
```

## 5. Ce qui a marché ✅
{numbered; each = move + why it worked}

## 6. Échecs & fausses pistes ❌
{numbered; each = what happened → root cause → lesson. ≥ section 5 in substance}

## 7. Où économiser 💰
{itemized waste with token cost tags}

## 8. Playbook réutilisable 📘
{numbered generalizable procedure + budget line}

## 9. Rôle exact de l'humain
{table: moment | intervention | durée | + what the agent couldn't do alone}

{--- optional sections here, only the 1-3 that carry signal ---}
```

After writing, print to chat only:
```
📋 Post-mortem écrit → post-mortem-{ts}.md
Mission: {1 line} · Résultat: {headline metric}
🎯 Meilleur coup: {1 line} · 💰 Plus gros gâchis évitable: {1 line}
📘 Playbook: {the single most transferable rule}
```
