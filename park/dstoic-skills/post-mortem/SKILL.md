---
name: post-mortem
description: Introspective end-of-session retrospective — the agent reflects on its OWN context (method, decisions, dead-ends, token spend, estimated API cost, lessons) and writes an honest, root-caused report ending in a reusable playbook. Use at the end of a long or complex session (30min+, multi-phase, sub-agents spawned, or a hard problem solved) when the user says "post-mortem", "retrospective", "session retro", "debrief this session", "what did we learn", "write up this session". Not a log parser — it digs context for the narrative; JSONL usage counters may be aggregated for cost only.
argument-hint: "[output-dir]"
allowed-tools: [Bash, Read, Write]
model: opus
effort: high
context: main
user-invocable: true
---

# Post-Mortem

Retrospective of a working session — reasoning, decisions, dead-ends, spend — honest, root-caused, quantified, **priced**, ending in a reusable playbook.

**Introspection for the narrative, aggregation for the cost.** The payload — "I trusted the fork's summary, it had dropped 2 lines, I lost 15 min, lesson: grep the source first" — lives only in context. A log parser sees `Bash` ran 110×; it cannot see that 4 of those were the same decoder rewritten. Never mine logs for the *why*.

> **Carve-out — cost only.** Summing `message.usage` counters from session JSONL and sub-agent `.output` files **is authorized**. It is the only route to a `[measured]` cost: no `total_cost_usd` field exists, cost must be computed. **Numbers may be summed, reasoning may not be mined.** Recipe, sources and boundary → `reference.md` §Cost.

**Output**: `post-mortem-YYYYMMDDHHmm.md` + a 5-line summary in chat. **Always full** — every core section, every qualifying session.

Distinct from `/save-context` (forward-looking resume state) and `/instruct-compact` (compaction steering). This is a backward-looking **debrief for learning**.

## When to Use

- End of a long (30min+) or multi-phase session, a hard problem solved, or sub-agents/forks were spawned.
- User says: "post-mortem", "retrospective", "session retro", "debrief", "what did we learn", "write up this session".
- **Skip the ritual for trivial sessions**: if it was a greeting or a one-file fix, say "Session is light — a post-mortem adds little" and write a 3-line note instead of the full ceremony.

## Gotchas — the two rules that make or break the report

Non-obvious, and they counter your defaults; violating either makes the report worthless.

1. **Main-context tokens are not self-observable — unless you have the JSONL.** Two regimes, and you must state which one you are in (Annexe provenance notice):
   - **Live introspection** (no JSONL) — accumulation, cache ratios, compaction pre/post are `[estimate ±]` + a one-line basis. Measurable: sub-agent tokens (from the completion notifications) and tool calls you recall.
   - **Third-party post-mortem** (JSONL reachable) — main *and* sub-agents become `[measured]` by aggregation. The narrative still comes from context/handoff: never let it pretend to live fidelity on the *why*.

   **Tag every number `[measured]` or `[estimate]`.** An honest "~300-500k [estimate], not measurable from inside" beats a fabricated exact — and `[measured]` must come from a sum you actually ran.
2. **You will under-report your own mistakes** (self-serving bias — you're grading your own homework). Counter it structurally: §Échecs must be at least as substantial as §Wins, and every dead-end gets `cause → lesson`. No "I erred" without "because X, therefore next time Y".

Other guards (in `reference.md`): walk oldest→newest so recency bias doesn't erase the early hour; prefer "I don't recall exactly" over a tidy fabrication; force ONE core idea + a generalizable playbook, not a bullet dump.

## Instructions

1. **Timestamp** (you cannot generate it): run `date +%Y%m%d%H%M` → filename `post-mortem-<that>.md`. Location = project root, or the dir passed as argument.
2. **Detect compaction.** Resumed from a summary, or a compaction fired mid-session → add the notice from `reference.md` §Compaction, mark those phases lower-fidelity.
3. **Regime + cost.** If JSONL is reachable, run the aggregation from `reference.md` §Cost *before* writing, so the cost is `[measured]`.
4. **Price it.** Read `reference.md` §Annexe-prix **first**; load the `claude-api` skill only if a model is missing from that grid (it is token-heavy). Formula per model, then aggregate.
5. **Reconstruct from memory, oldest→newest**, per Gotcha 2's ordering.
6. **Fill every core section** in the prescribed order from `reference.md`; add conditional/optional sections when warranted; never drop a core one.
7. **Write the file**, then print the 5-line chat summary (mission · headline result · biggest win · biggest avoidable cost · one playbook line). Never auto-commit.

## Structure — the order is prescribed

```
🎯 Exec Summary        (½ page, no jargon, in front)
 1. Mission            (right after)
 2. Numbers + 💵 Estimated API cost      (the number surfaces early)
 3. Core idea 🎯
 4. Timeline
 5. What worked ✅      6. Failures ❌     7. Where to save 💰
 8. Playbook 📘         9. The human's role
10. Delegation review  (conditional — only if sub-agents were spawned)
📎 Appendix            (pricing grid · provenance & fidelity · session map) — AT THE END
```

- **Progressive disclosure in every section**, not just the cost one: synthesis first, detail after.
- **Audience labels guide the writing, never the deliverable.** "Synthesis for the executive reader, detail for the technical reader" is how you calibrate — printing `CIO view`, `Tech Lead view`, `for decision-makers`, `30-second read` in the report is **forbidden**. One document, one voice, layered by depth.
- **Annexe is audit material, not decision material.** It goes last; it never opens the report.

`reference.md` holds the rest and is authoritative: per-section directives, number-tagging matrix, cost recipe + formulas, compaction notice, optional-sections menu, pricing grid, exact template. Follow it exactly.
