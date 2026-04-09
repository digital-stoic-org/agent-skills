# Harness Engineering — Benchmark

**Date:** 2026-04-08 | **Supersedes:** [2026-03-18-humanlayer-harness.md](2026-03-18-humanlayer-harness.md) | **Sources:** [Böckeler/Fowler (Apr 2026)](https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html), [Horthy/HumanLayer (2025)](https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents)

## What It Is

Harness engineering = everything in an AI agent except the model itself. Böckeler (Fowler, Apr 2026) formalized the model: **guides** (feedforward, steer before action) and **sensors** (feedback, observe after action), both **computational** (deterministic) or **inferential** (LLM-based). Three layers: context engineering, architectural constraints, entropy management.

Builds on Horthy's 7 principles (HumanLayer, 2025) which remain the foundational taxonomy.

## Fowler Model vs Praxis

| Layer | Guides (feedforward) | Sensors (feedback) | Praxis Status |
|---|---|---|---|
| **Context engineering** | CLAUDE.md, `.in/`, SKILL.md, `/frame-problem` | `/save-context`, `/load-context`, `summarize-for-context` | ✅ Strong |
| **Architectural constraints** | OpenSpec gates, `/openspec-plan` (upfront test strategy), `/pick-model` | `/openspec-test`, `/openspec-reflect`, `/openspec-replan` | ✅ Strong |
| **Entropy management** | `learnings.yaml` (pre-loaded), `thinking/bridges/` | `/retrospect-*`, `/challenge`, `devil-advocate`, `/troubleshoot` | ✅ Strong |

## Horthy's 7 Principles (unchanged from prior benchmark)

| Principle | Praxis Status | Notes |
|-----------|---------------|-------|
| Progressive Disclosure | ✅ Ahead | Skills load SKILL.md on demand, not stuffed upfront |
| Sub-agents as Context Firewall | ✅ Native | devil-advocate (fresh context), summarize-for-context (haiku) |
| Hooks for Back-Pressure | ✅ Implemented | retrospect-capture, notify-tmux, dump-output, list-context-sync, session-pin |
| CLIs over MCPs | ✅ Strong bias | RTK proxy, bun/bunx preference, minimal MCP usage |
| Human-written CLAUDE.md | ✅ Core philosophy | Toothbrush principle |
| Engineer harness on failure | ✅ Compounding | troubleshoot learnings.yaml → checked first next time |
| Bias toward shipping | ✅ Default mode | Garage = "Working > perfect" |

## Maturity Assessment

| Level | Description | Praxis | Most frameworks |
|---|---|---|---|
| **L1 — Prompting** | Static instructions (CLAUDE.md, rules) | ✅ | ✅ |
| **L2 — Structured** | Context persistence + deterministic checks + human gates | ✅ | ⚠️ Partial |
| **L3 — Compounding** | **Autonomous** learning loops, adversarial review, entropy detection, session-to-session improvement | ⚠️ Partial | ❌ Rare |

**Praxis is solid L2, aspiring L3.** The L3 building blocks exist (learnings.yaml, retrospectives, devil-advocate, bridge captures) but feedback loops are **human-triggered, not autonomous**:
- `/troubleshoot` loads learnings but doesn't auto-update them after a fix
- `/retrospect-*` extracts patterns but requires manual invocation
- `/challenge` is reactive (user must ask), not automatic on high-confidence outputs
- Session compounding works but depends on disciplined `/save-context` → `/load-context`

**Gap to true L3:** automated learning capture (hooks that write learnings.yaml on fix), proactive adversarial triggers (auto-challenge on confidence signals), entropy detection that runs without prompting. ECC's automated instincts are closer to L3 on the automation axis, though shallower on cognitive depth.

## What Praxis Adds Beyond the Fowler Model

| Capability | Fowler Model | Praxis |
|---|---|---|
| Workflow phase routing | Not addressed | `/frame-problem` (Cynefin) routes to appropriate skill chains |
| Adversarial review | Implied by inferential sensors | Explicit: `/challenge` (4 modes) + `devil-advocate` (fresh context, 9 debiasing patterns) |
| Cognitive ROI measurement | Not addressed | Three-tier model (Automation → Assisted → Amplified) |
| Mutual sharpening | User harness = one-way (human → agent) | Bidirectional: AI challenges human assumptions |
| Cross-project learning | Not addressed | `thinking/bridges/`, `/retrospect-domain` |

## Verdict

**All Fowler layers and Horthy principles natively covered. Solid L2 maturity with L3 building blocks in place.** Praxis extends the model with workflow phase routing, adversarial depth, mutual sharpening, and cross-project compounding — but feedback loops remain human-triggered, not autonomous. The gap to L3 is automation of the learning capture, not the learning itself.

## Full Details

- Harness model + session lifecycle: [HARNESS-ENGINEERING.md](../HARNESS-ENGINEERING.md)
- Prior benchmark (Horthy only): [2026-03-18-humanlayer-harness.md](2026-03-18-humanlayer-harness.md)
- Full investigation: `praxis/thinking/investigations/agent-skills/2026-03-18-humanlayer-harness-engineering-vs-praxis.md`
