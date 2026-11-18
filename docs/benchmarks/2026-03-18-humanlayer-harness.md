# HumanLayer Harness Engineering — Benchmark

**Date:** 2026-03-18 | **Source:** https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents

## What It Is

Foundational taxonomy for AI coding agent harness engineering (Dex Horthy). Defines 7 key principles that the broader ecosystem references. Not a tool — a framework for thinking about agent reliability.

## 7 Principles vs Praxis

| Principle | Praxis Status | Notes |
|-----------|---------------|-------|
| Progressive Disclosure | ✅ Ahead | Skills load SKILL.md on demand, not stuffed upfront |
| Sub-agents as Context Firewall | ✅ Native | devil-advocate (fresh context), summarize-for-context (haiku) |
| Hooks for Back-Pressure | ✅ Implemented | retrospect-capture, notify-tmux, dump-output |
| CLIs over MCPs | ✅ Strong bias | RTK proxy, bun/bunx preference, minimal MCP usage |
| Human-written CLAUDE.md | ✅ Core philosophy | Toothbrush principle |
| Engineer harness on failure | ✅ Compounding | troubleshoot learnings.yaml → checked first next time |
| Bias toward shipping | ✅ Default mode | Garage = "Working > perfect" |

## Minor Gaps Identified

| Gap | Priority | Action |
|-----|----------|--------|
| Silent Success (suppress successful output) | LOW | ~0.08% context waste. RTK handles git. Not worth a hook |
| CLAUDE.md size | LOW | ~80 lines (recommended <60). Audit for redundant rules |
| MCP tool count | MEDIUM | Google Docs MCP loads 100+ deferred tools |

## Verdict

**All 7 harness principles natively covered.** Praxis goes beyond HumanLayer with Cognitive ROI measurement, Cynefin routing, mutual sharpening, and compounding learning loops — capabilities the harness engineering taxonomy doesn't address.

## Source

Full analysis: `praxis/thinking/investigations/agent-skills/2026-03-18-humanlayer-harness-engineering-vs-praxis.md`
