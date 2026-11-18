# Context Session Format — Benchmark

**Date:** 2026-04-07 | **Compared:** Praxis CONTEXT-llm.md vs ECC Session Files vs SuperClaude Sessions

## Format Comparison

| Dimension | Praxis | ECC | SuperClaude |
|-----------|--------|-----|-------------|
| **Format** | Structured markdown, YAML-style sections | Auto-generated markdown with summary markers | Key-value via Serena MCP |
| **Trigger** | Human-triggered (/save-context, /save-work) | Auto on every Stop hook | Auto every 30 min + session end |
| **Token budget** | 1200-1500 tokens MAX (enforced) | Unbounded | Unspecified |

## Unique Praxis Sections (not found in competitors)

| Section | Why It Matters |
|---------|----------------|
| Decisions + rationale table | Prevents re-litigating past decisions |
| Thinking / trade-offs | Preserves reasoning chain |
| Unexpected / pivots | Highest learning signal — where assumptions broke |
| Contracts / invariants (pass/fail) | Carries verification state across sessions |
| Implementation confidence (HIGH/MED/LOW) | Next session knows whether to trust or re-verify |
| Hot files + role | WHY each file matters, not just that it was touched |
| Status lifecycle (exploring→building→decided→parked→done) | Communicates session maturity |
| Quality gate before saving | Prevents noise accumulation |
| Token budget enforcement | Context doesn't bloat across sessions |

## Scores

| Dimension | Praxis | ECC | SuperClaude |
|-----------|--------|-----|-------------|
| Actionability | 🟢🟢🟢 | 🟡 | 🔴 |
| Reasoning preservation | 🟢🟢🟢 | 🔴 | 🔴 |
| Token efficiency | 🟢🟢🟢 | 🔴 | 🟡 |
| Verification state | 🟢🟢🟢 | 🔴 | 🔴 |
| Multi-surface | 🟢🟢 | 🔴 | 🔴 |
| Automated capture | 🔴 | 🟢🟢🟢 | 🟢🟢 |

## Verdict

**Praxis CONTEXT format is significantly more actionable.** 100+ real CONTEXT files across 10+ projects. The only gap is automation — deliberately chosen. Manual save at phase transitions = higher quality than automated capture.

## Source

Full analysis: `praxis/thinking/investigations/2026-04-07_context-format-benchmark.md`
