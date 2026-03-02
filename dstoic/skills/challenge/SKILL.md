---
name: challenge
description: "Challenge, push back, play devil's advocate on AI output. Use when: challenge this, are you sure, push back, prove it, what if you're wrong, devil's advocate, stress test, poke holes, second opinion, sanity check, too confident, really?, question this decision. Subcommands: anchor (committed too fast), verify (facts wrong?), framing (wrong problem?), deep (full devil's advocate in separate context)."
allowed-tools: Read, Glob, Grep, Task, AskUserQuestion
model: opus
argument-hint: "[anchor|verify|framing|deep] <target>"
user-invocable: true
cynefin-domain: complicated
cynefin-verb: analyze
---

# Challenge

Apply structured provocation patterns to force reconsideration of current work.

**Target:** **$ARGUMENTS**

## Dispatch

Parse first word of $ARGUMENTS as subcommand:

| Subcommand | Error Type | Protocol |
|---|---|---|
| `anchor` | Premature commitment / anchoring bias | Read `protocols/anchor.md` → execute |
| `verify` | Factual errors / hallucination | Read `protocols/verify.md` → execute |
| `framing` | Wrong problem / framing errors | Read `protocols/framing.md` → execute |
| `deep` | High stakes — all 9 patterns in fresh context | Spawn devil-advocate sub-agent via Task |

## No-Subcommand Fallback

If no subcommand detected:

AskUserQuestion: "What are you worried about with the current AI response?"
- A) Anchoring bias — AI committed too early to one approach
- B) Factual accuracy — claims may be wrong or hallucinated
- C) Wrong framing — solving the wrong problem
- D) High stakes — want all 9 patterns in fresh context (Devil's Advocate)

→ Dispatch to matching subcommand based on answer.

## Deep Subcommand

Spawn via Task tool:
- subagent_type: `devil-advocate`
- prompt: target description + relevant file paths to read
- The agent runs ALL 9 patterns (anchor: Gatekeeper, Reset, Alt Approaches, Pre-mortem · verify: Proof Demand, CoVe, Fact Check List · framing: Socratic, Steelman) comprehensively in fresh context
- DO NOT pass parent conversation reasoning — fresh context is the point

## Thinking Transparency (applies to all subcommands)

For every finding, make reasoning explicit:

1. **Observation**: What specifically in the target triggered this finding
2. **Technique family**: Which challenge family (anchor/verify/framing) and named pattern (e.g., Gatekeeper, CoVe, Steelman) — cite mechanism from `reference.md` pattern catalog
3. **Reasoning**: Why this observation matters — what cognitive bias or error it reveals
4. **Confidence**: How certain is this finding (High/Medium/Low) and what evidence supports that rating

## Output

All subcommands produce a **Challenge Report** (structured, not prose).
See `reference.md` for report format and pattern catalog.
