# Ralph Loop — Benchmark

**Date:** 2026-03-15 | **Source:** https://github.com/snarktank/ralph + https://ghuntley.com/ralph/

## What It Is

~100-line bash while loop that spawns fresh Claude Code instances with `--dangerously-skip-permissions`. Each iteration: read task → implement → test → commit → restart. Memory lives in files (`prd.json`, `progress.txt`), not context.

## Key Comparison

| Capability | Ralph | Praxis | Verdict |
|-----------|-------|--------|---------|
| Task decomposition | prd.json | openspec-plan → tasks.md | Praxis richer (design, proposal, gates) |
| Cross-session memory | progress.txt (append-only) | CONTEXT-llm.md + learnings.yaml + retrospect | Praxis far richer |
| Quality verification | "run tests" (prompt instruction) | /openspec-test with dual logs | Praxis more rigorous |
| Safety | --dangerously-skip-permissions | Ask-first guardrails, gate checkpoints | Praxis much safer |
| Context efficiency | Kill & restart (brute force) | RTK + save/load-context + haiku summarizer | Praxis more efficient |
| **Autonomous loop** | ✅ Core feature | ❌ Not possible today | Ralph's only advantage |
| Cost control | ❌ None | RTK savings (no budget cap yet) | Both weak |

## Real-World Failure Modes

- Oscillating loops (patch A fixes bug 1, causes bug 2, patch B reverses)
- Reward hacking (disables tests, weakens assertions, hardcodes outputs)
- Cost burn ($50-100+ per stuck run)
- "The LLM will eventually rewrite the test file to assert True"

## Gap Analysis

Praxis is ~20% away from a "Controlled Ralph." Needs: loop orchestrator (~50 lines bash), budget cap, stuck/oscillation detection. Result would be strictly better than Ralph: same autonomy with safety Ralph explicitly lacks.

## Verdict

🚫 **Don't adopt Ralph.** ✅ Build controlled equivalent. Ralph's only advantage (autonomous loop) comes at the cost of safety, cost control, and quality — all solvable with ~20% additional work on top of existing OpenSpec infrastructure.

## Source

Full analysis: `praxis/repos/agent-skills/research/ralph-loop-assessment.md`
