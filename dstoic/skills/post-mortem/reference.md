# Post-Mortem — Reference

The template below IS the product. Quality bar: honest, root-caused, quantified where possible, **priced**, ending in a reusable playbook. Fill it by introspecting the session — never by parsing logs for the narrative. Usage counters may be aggregated for cost only (§Cost).

## Table of Contents
- [Structure doctrine](#structure-doctrine) — section order, progressive disclosure, audience labels
- [Number tagging](#number-tagging) — the [measured]/[estimate] rule, two regimes
- [Cost](#cost) — aggregation recipe, formulas, section shape
- [Compaction notice](#compaction-notice) — mandatory when the session was compacted
- [Core sections](#core-sections) — the 9 always-present sections
- [Conditional & optional sections](#conditional--optional-sections)
- [Output template](#output-template) — the exact file shape
- [Annexe — pricing grid](#annexe--pricing-grid) — rates, cache multipliers, platform caveat

---

## Structure doctrine

Canonical order. Respect it; do not renumber.

```
🎯 Exec Summary   (½ page, executive reader, in front)
 1. Mission
 2. Bilan chiffré + 💵 Coût API estimé
 3. Idée maîtresse 🎯
 4. Chronologie
 5. Ce qui a marché ✅
 6. Échecs & fausses pistes ❌
 7. Où économiser 💰
 8. Playbook réutilisable 📘
 9. Rôle exact de l'humain
10. Revue de délégation      (conditional: sub-agents spawned)
📎 Annexe        (grille tarifaire · provenance & fidélité · cartographie sessions)
```

Rationale: the executive reader gets result + cost + risk + decision in the first half-page; the number surfaces at §2, not buried at the end; audit material sits in the Annexe, at the end, never in front.

**Durable homes.** This skill can live in an overwritable plugin cache — so the conventions have a canonical home outside it: `tpl/post-mortem-template.md` (structure) and `ref/claude-pricing-ref.md` (prices), when present on the machine. Absent those, the blocks inlined in *this* file are the source of truth.

**Progressive disclosure — transversal.** Every section: synthesis first, detail after. Not a cost-section-only rule. A section whose first three lines cannot be read standalone is malformed.

**Audience labels — writing aid, banned from the deliverable.** Use "executive reader / technical reader" (or CIO / Tech Lead) internally to decide what goes in the synthesis vs the detail. **Never print** `Vue CIO`, `Vue Tech Lead`, `pour décideurs`, `lecture 30 s` or any equivalent label in the generated report. One document, one voice, layered by depth.

**Exec Summary — mandatory content**, ½ page, zero jargon:
- result in one line (what was delivered + the salient fact or the hitch)
- aggregate cost (≈ $N, split by phase, % sub-agents, cache saving)
- ⚠️ the risk, in decision-maker language
- ✅ ONE decision/recommendation, actionable
- autonomy: compaction(s), human share, longest autonomous streak

The provenance/fidelity notice does **not** go here — it belongs to the Annexe.

---

## Number tagging

Every quantity carries a tag. Which tag depends on the regime:

| | **Live introspection** (session in progress, no JSONL) | **Third-party post-mortem** (JSONL access, carve-out applies) |
|---|---|---|
| main-context tokens | `[estimate ±]` + one-line basis | `[measured]` (usage aggregation) |
| sub-agent tokens | `[measured]` — counters from completion notifications | `[measured]` (aggregation over `tasks/*.output` / sidechain entries) |
| cache read/write | `[estimate]` or absent | `[measured]` |
| cost $ | `[estimate]` | `[measured]` tokens × published rates → tag `[estimate]` if rates are a proxy (see caveat) |
| tool-call counts | `[measured]` for what you recall | `[measured]` |
| compaction pre/post | `[estimate]` — you saw a notification, not the ledger | `[estimate]` unless the boundary is identifiable |

Live example of the discipline: `total sub-agents: 725 862` (measured, summed from completion notifications) but `contexte principal: non mesurable de l'intérieur ; estimation ~300-500k`. **Faking a precise main-context number is the cardinal sin of this skill** — and so is tagging `[measured]` a number you did not actually sum.

Session total = Σ sub-agents + main-context. Present both, then the combined figure, each tagged.

---

## Cost

### Boundary (carve-out)

Aggregating `message.usage` counters is **authorized** — from session JSONL and from sub-agent `.output` files. Reconstructing the *narrative* from logs stays **forbidden**. Rule of thumb: **numbers may be summed, reasoning may not be mined.** The why, the decisions, the dead-ends remain introspection. There is no `total_cost_usd` field in the JSONL — cost must be computed, which is why the aggregation is necessary.

Sources:
- session transcript: `~/.claude/projects/<slug-of-cwd>/<session-id>.jsonl`
- sub-agent outputs: `/tmp/claude-1000/<project>/<session-id>/tasks/*.output`

### Aggregation recipe

```bash
jq -s '
  [ .[] | select(.message.usage != null)
    | { id:  (.message.id // .uuid),
        seg: (if .isSidechain then "sous-agents" else "main" end),
        model: (.message.model // "unknown"),
        i:  (.message.usage.input_tokens // 0),
        o:  (.message.usage.output_tokens // 0),
        cr: (.message.usage.cache_read_input_tokens // 0),
        cw: (.message.usage.cache_creation_input_tokens // 0) } ]
  | unique_by(.id)
  | group_by(.model + "|" + .seg)
  | map({ model: .[0].model, segment: .[0].seg, calls: length,
          input: (map(.i)|add), output: (map(.o)|add),
          cache_read: (map(.cr)|add), cache_write: (map(.cw)|add) })
' <session>.jsonl
```

Gotchas:
- **Dedup by `message.id`** — retries and streaming replays double-count otherwise.
- **Group by model first**, then by segment. Rates are per-model; a mixed-model session priced at one rate is wrong.
- If `usage.cache_creation` carries a TTL breakdown (`ephemeral_5m_input_tokens` / `ephemeral_1h_input_tokens`), price the two buckets separately; otherwise assume 5-min TTL and say so.
- Sidechain entries are the sub-agent turns of the main transcript; `tasks/*.output` cover agents whose turns are not inlined. Do not count both for the same agent.

### Formulas

```
coût = (input/1e6 × tarif_in) + (output/1e6 × tarif_out)
     + (cacheR/1e6 × tarif_cacheR) + (cacheW/1e6 × tarif_cacheW)

économie cache = cacheR/1e6 × (tarif_in − tarif_cacheR)
```

Cache reads avoid ~0.90× the full input rate — that difference is the cache saving line. Compute per model, then aggregate.

### Section shape — ONE section, progressive disclosure

Inside §2 Bilan chiffré. **One cost section**, not four tables, not audience-split views.

**1 — Synthesis first:**
- total ≈ $N (+ split per phase if multi-phase)
- billable split: non-cache (input+output) / cache read / cache write
- **cache saving** line, in $

⚠️ `cache_read` is re-counted every turn → total cache tokens ≫ unique context. Never present it as "measured unique context".

**2 — Detail after:** a single merged cost+token table, one row per (phase × main/sub-agents), plus a TOTAL row.

```
| Segment | Appels | Input | Output | Cache read | Cache write | Sous-total $ |
```

This table feeds §10 Revue de délégation (sub-agent ROI). Do **not** re-label its rows by audience. It is an operational breakdown — not the old heterogeneous "tokens mesurés/estimés" line, which is proscribed.

The **pricing grid** (Poste | Tarif par 1M) goes in the **Annexe**, never in this section.

### Price source

1. **Primary**: the grid in [Annexe — pricing grid](#annexe--pricing-grid) below, or the local `ref/claude-pricing-ref.md` if present on the machine. Read it **first**.
2. **Fallback only**: the `claude-api` skill (table "Current Models", Input $/1M, Output $/1M) — load it **only** if a model is absent from the grid; it is token-heavy. Then update the grid and re-date it.

---

## Compaction notice

If the session was continued from a compacted summary (you were resumed from a summary, or you recall auto/manual compaction firing mid-session), you MUST:

1. State it near the top of Bilan chiffré: `⚠️ Cette session a subi N compaction(s). Tout ce qui précède la 1re compaction est reconstruit depuis un résumé avec perte — fidélité réduite.`
2. Re-read your own in-context resume-summary and note **what detail it no longer lets you verify** (exact tool sequences, precise ordering, intermediate values). Name the blind spots; don't paper over them.
3. In Chronologie, mark pre-compaction phases with `(reconstruit depuis résumé)`.
4. Restate the fidelity limits in the Annexe provenance notice.

The pre-compaction *narrative* cannot be recovered from a file (the carve-out covers counters, not reasoning) — so the honest move is to flag the degradation, not to invent a crisp early-session account. Cost, by contrast, stays `[measured]` across a compaction: the usage counters survive in the JSONL.

---

## Core sections

Always all nine, in the doctrine order. Directives per section:

| # | Section | What to write | The trap to avoid |
|---|---|---|---|
| 1 | **La mission** | One paragraph: objective + the hard constraint + the *measured* result. | Vague "we built X" — state the constraint and the metric. |
| 2 | **Bilan chiffré** (incl. 💵 Coût) | Time, autonomy, production, acceptance metric, tokens (main + sub-agents, tagged), then the cost section per §Cost (synthesis → merged detail table). Compaction notice here. | Untagged numbers; forgetting sub-agent tokens are billed separately; burying the total under the detail table. |
| 3 | **L'idée maîtresse** 🎯 | The SINGLE most-leveraged decision and its cascade of consequences (e.g. "making the legacy build runnable locally as an executable oracle"). Exactly one. | A flat list of good ideas — forcing one surfaces the real lever. |
| 4 | **Chronologie** | Phases oldest→newest: what / tools / outcome, timestamps where known, `(reconstruit)` if pre-compaction. | Recency bias collapsing the early hour; skipping the boring inventory phase that actually set everything up. |
| 5 | **Ce qui a marché ✅** | Concrete moves to repeat *systematically*, each with *why it worked*. | Generic praise — tie each to a mechanism. |
| 6 | **Échecs & fausses pistes ❌** | Every dead-end, wrong hypothesis, revert, with **root cause → lesson**. MUST be ≥ section 5 in substance. | Under-reporting (self-serving bias); "I erred" with no cause and no transferable lesson. |
| 7 | **Où économiser 💰** | Measured/estimated waste, itemized: redundant work, fork-vs-fresh-agent misfit, repeated scripts/heredocs, unnecessary vision reads, model switches that broke cache. Each with a token **and $** cost tag, sourced from §2. | Hand-wave "could be faster" — quantify or flag as estimate. |
| 8 | **Playbook réutilisable** 📘 | The generalizable procedure for *this class of task*, numbered, so the next session skips the dead-ends. Include a rough budget line, in tokens **and $**. | Skill-specific trivia — write what transfers. |
| 9 | **Rôle exact de l'humain** | Table: each human intervention, what it decided, est. duration. Names what the agent could NOT do alone. | Erasing the human, or inflating autonomy. |

Each of these obeys progressive disclosure: open with the synthesis, then the table/detail.

---

## Conditional & optional sections

**§10 Revue de délégation — conditional, becomes section 10 whenever sub-agents/forks were spawned.** Per sub-agent: was the brief right-sized? fork vs fresh-agent correct? did two agents re-process the same material? **Quantify the ROI in $** using the sub-agent rows of the §2 detail table. Omit the section entirely when no agent was spawned (the nine core remain nine).

Other optional sections — add only when the session makes them insightful, pick 1-3, don't bolt on all of them (that's noise). Place them after §10, before the Annexe:

- **Tool-call histogram** — counts per tool you recall (`Bash ×N`, `Read ×N`, `Agent ×N`). Cheap, exposes thrash (e.g. 4× the same heredoc = 4 Bash calls doing the same thing). Tag `[measured]` for what you're sure of.
- **Rework / revert ledger** — every "did X, then reverted/redid it" with the cost. The most expensive and most learnable moments — reverts routinely carry a session's sharpest lessons. Often the highest-signal addition.
- **Decision ledger** — the key branch points where you chose A over B, with the rationale, so the *why* survives (rationale gets re-litigated otherwise).
- **Cache / model-switch note** — if you switched model mid-session, flag it: switches break the prompt cache → context re-read uncached, and the new model may bill at a different rate. Price both effects from §2.
- **Assumptions that held / broke** — which early assumptions the session validated vs. blew up, and when you found out. Sharpens future scoping.
- **What I'd delegate differently** — forward-looking counterfactual: same task again, what changes in the agent architecture.

---

## Output template

Write this to `post-mortem-YYYYMMDDHHmm.md`. French or English to match the session's working language. Fill from introspection (+ usage aggregation for the cost); keep it dense (tables, a mermaid diagram for the agent architecture if forks were used, ✅/❌/💰/🎯 markers).

````markdown
# Post-mortem — {session title / mission in a few words}

> Rétrospective de la session du {date}. Modèle : {model}.
> Durée : ~{wall-clock} [measured/estimate], dont ~{human-active} de temps humain.

---

## 🎯 Exec Summary
{résultat en 1 ligne : ce qui a été livré + le fait saillant ou le hic}
{coût agrégé ≈ ${N} — {split phases} · {X}% sous-agents · économie cache ${S}}
⚠️ {le risque, en langage décideur}
✅ {LA décision / recommandation, actionnable}
{autonomie : {N} compaction(s) · humain ~{Y}% · plus longue séquence autonome {W} min}

---

## 1. La mission
{objectif + contrainte dure + résultat mesuré, un paragraphe}

## 2. Bilan chiffré
{⚠️ compaction notice here if applicable}
```yaml
⏱️ Temps:
  wall-clock: ~{X} min [measured|estimate]
  humain actif: ~{Y} min [measured]
  ratio autonomie: ~{Z}%  ; plus longue séquence autonome: {W} min
🧮 Tokens:
  main: {n} [measured|estimate — basis: ...]
  sous-agents: {n} [measured]
  total: {n}
📦 Production:
  {files / lines / artifacts} [measured]
  critère d'acceptation: {metric}
🤝 Humain: {n gates, n decisions}
```

### 💵 Coût API estimé
**Total ≈ ${N}** [measured|estimate] — {phase A ${a} · phase B ${b}}
- non-cache (input + output) : ${x}
- cache read : ${y}  ·  cache write : ${z}
- 💰 **économie cache : ${s}** (vs facturation input plein)

> Le `cache_read` est recompté à chaque tour : le total cache ≫ le contexte unique.

| Segment | Appels | Input | Output | Cache read | Cache write | Sous-total $ |
|---|---|---|---|---|---|---|
| {phase} · main | | | | | | |
| {phase} · sous-agents | | | | | | |
| **TOTAL** | | | | | | **${N}** |

## 3. L'idée maîtresse 🎯
{la SEULE décision la plus à levier + sa cascade}

## 4. Chronologie
{phases oldest→newest; table: étape | outils | résultat; (reconstruit) si pré-compaction}

## 5. Ce qui a marché ✅
{numéroté; chacun = geste + pourquoi ça a marché}

## 6. Échecs & fausses pistes ❌
{numéroté; chacun = quoi → cause racine → leçon. ≥ section 5 en substance}

## 7. Où économiser 💰
{gaspillage itemisé, avec coût en tokens ET en $}

## 8. Playbook réutilisable 📘
{procédure généralisable numérotée + ligne budget (tokens + $)}

## 9. Rôle exact de l'humain
{table: moment | intervention | durée | + ce que l'agent ne pouvait pas faire seul}

## 10. Revue de délégation
{si sous-agents : brief bien dimensionné ? fork vs agent frais ? doublons ? ROI en $ depuis §2}

{--- sections optionnelles ici, seulement les 1-3 qui portent du signal ---}


---

## 📎 Annexe

### Grille tarifaire appliquée
| Poste | Tarif par 1M |
|---|---|
| {modèle} input | ${} |
| {modèle} output | ${} |
| {modèle} cache read | ${} |
| {modèle} cache write (5-min) | ${} |
*Source : {grille skill, datée AAAA-MM-JJ}. {caveat plateforme si applicable.}*

### Provenance & fidélité
{régime : introspection live | post-mortem tiers avec accès JSONL}
{ce qui est [measured] vs [estimate] ; angles morts ; impact des compactions}

### Cartographie des sessions
{fichiers JSONL / tasks agrégés, plages horaires, ce qui a été exclu}
````

After writing, print to chat only:
```
📋 Post-mortem écrit → post-mortem-{ts}.md
Mission: {1 line} · Résultat: {headline metric} · Coût: ≈${N}
🎯 Meilleur coup: {1 line} · 💰 Plus gros gâchis évitable: {1 line}
📘 Playbook: {the single most transferable rule}
```

---

## Annexe — pricing grid

Source: `claude-api` skill, table "Current Models". **Last verified: 2026-07-29** — re-date on every update.

**Per 1M tokens (first-party Anthropic):**

| Modèle | Input | Output |
|---|---|---|
| Opus 5 (`claude-opus-5`) | $5.00 | $25.00 |
| Opus 4.8 (`claude-opus-4-8`) | $5.00 | $25.00 |
| Opus 4.7 (`claude-opus-4-7`) | $5.00 | $25.00 |
| Sonnet 5 (`claude-sonnet-5`) | $3.00 (intro $2.00 jusqu'au 2026-08-31) | $15.00 (intro $10.00) |
| Haiku 4.5 (`claude-haiku-4-5`) | $1.00 | $5.00 |
| Fable 5 (`claude-fable-5`) | $10.00 | $50.00 |

**Cache rates — derived from the model's input rate:** cache read = **0.10× input** · cache write 5-min TTL = **1.25× input** · cache write 1h TTL = **2× input**.
Example Opus 4.8 (input $5.00): cache read $0.50 · cache write 5-min $6.25 · cache write 1h $10.00.

**⚠️ Platform caveat.** Rates above are first-party Anthropic. **Bedrock / Vertex are partner-operated with their own price list** → first-party rates serve only as a **proxy**, to be confirmed against the real invoice before presenting a figure as final. Tag the cost `[estimate]` when derived from proxy rates. Microsoft Foundry uses standard API rates (same as first-party).
