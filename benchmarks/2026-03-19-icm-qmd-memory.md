# ICM + QMD Memory Systems — Benchmark

**Date:** 2026-03-19 | **Sources:** https://github.com/rtk-ai/icm (159⭐) · https://github.com/tobi/qmd (19K⭐)

## What They Are

**ICM** (rtk-ai): Full agent memory system — episodic + semantic + feedback, with decay, knowledge graphs, and lifecycle management. Rust single binary, MCP interface (22 tools).

**QMD** (Tobi Lütke): Local RAG search engine for markdown docs. Hybrid BM25 + vector + LLM reranking. TypeScript, MCP interface (4 tools).

They solve different problems: ICM manages what the agent *remembers*, QMD helps the agent *find documents*.

## ICM vs Praxis Auto-Memory

| Capability | Praxis (file-based) | ICM |
|-----------|---------------------|-----|
| Memory types | 5 typed files (user/feedback/project/reference + MEMORY.md) | 3 subsystems (episodic/semantic/feedback) |
| Decay/forgetting | Manual pruning | Auto-decay: `weight × 0.95^days × importance` |
| Knowledge graphs | ❌ | ✅ Concepts + 9 typed relation edges |
| Learning from errors | troubleshoot learnings.yaml | Closed-loop correction records |
| Consolidation | Manual via retrospect-* | Auto-merge at 7+ entries per topic |
| Hook extraction | retrospect-capture logs to JSONL (no extraction) | 3-layer: PostToolUse → PreCompact → UserPromptSubmit |

## Key Insight

ICM would be a **strict superset** of current Praxis memory. But Praxis's granular CONTEXT management (100+ files, 1500-token budget, phase transitions) reduces the urgency — manual discipline compensates for less sophisticated memory infrastructure.

## Verdict

**Complementary, not urgent.** ICM's decay model and knowledge graphs are architecturally interesting. QMD's retrieval pipeline is more sophisticated than anything in the ecosystem. Neither is needed today given Praxis's manual discipline, but ICM is worth watching if Praxis moves toward more autonomous sessions.

## Source

Full analysis: `praxis/thinking/investigations/agent-skills/icm-vs-qmd-memory-categories.md`
