---
name: post-mortem
description: Introspective end-of-session retrospective — the agent reflects on its OWN live context (method, decisions, dead-ends, token spend, lessons) and writes an honest, root-caused report ending in a reusable playbook. Use at the end of a long or complex session (30min+, multi-phase, sub-agents spawned, or a hard problem solved) when the user says "post-mortem", "retrospective", "session retro", "debrief this session", "what did we learn", "write up this session". NOT a log parser — it digs the current context, not JSONL files.
argument-hint: "[output-dir]"
allowed-tools: [Bash, Read, Write]
model: opus
effort: high
context: main
user-invocable: true
---

# Post-Mortem

Produce a **rich retrospective of the current live session** by introspecting your own working memory — the reasoning, decisions, dead-ends, and token spend that only exist in *this* context, not in any file. The gold-standard output is honest, root-caused, quantified where possible, and ends in a reusable playbook.

**This is introspection, NOT log-parsing.** The payload — "I trusted the fork's summary, it had dropped 2 lines, I lost 15 min, lesson: grep the source first" — lives only in context. A log parser sees `Bash` ran 110×; it cannot see that 4 of those were you re-writing the same decoder. Do NOT read session JSONL transcripts. Read your own memory of what happened.

**Output**: a timestamped file `post-mortem-YYYYMMDDHHmm.md` (see step 1) + a 5-line spoken summary in chat. **Always full** — every core section, every qualifying session.

Distinct from `/save-context` (forward-looking resume state) and `/instruct-compact` (ephemeral compaction steering). This is a backward-looking **debrief for learning**, meant to be read by a human later.

## When to Use

- End of a long (30min+) or multi-phase session, a hard problem solved, or sub-agents/forks were spawned.
- User says: "post-mortem", "retrospective", "session retro", "debrief", "what did we learn", "write up this session".
- **Skip the ritual for trivial sessions**: if it was a greeting or a one-file fix, say "Session is light — a post-mortem adds little" and write a 3-line note instead of the full ceremony.

## Gotchas — the two rules that make or break the report

These are non-obvious and counter your defaults; violating either makes the report worthless.

1. **You cannot measure your own main-context tokens.** The naive assumption is that a "token report" means exact numbers. From *inside* a live session you can't see your own accumulation, cache ratios, or compaction pre/post figures — so those are `[estimate ±]` with a one-line basis. What you *can* measure: sub-agent tokens (they arrive in the completion notifications you received) and tool-call counts you remember. **Tag every number `[measured]` or `[estimate]`** — an honest "~300-500k [estimate], not measurable from inside" beats a fabricated exact number.
2. **You will under-report your own mistakes** (self-serving bias — you're grading your own homework). Counter it structurally: §Échecs must be at least as substantial as §Wins, and every dead-end gets `cause → lesson`. No "I erred" without "because X, therefore next time Y".

Other guards (elaborated in `reference.md`): walk oldest→newest so recency bias doesn't erase the early hour; prefer "I don't recall exactly" over a tidy fabrication (per project rule: never hallucinate); force ONE idée maîtresse + a generalizable playbook, not a bullet dump.

## Instructions

1. **Get the timestamp** (you cannot generate it yourself): run `date +%Y%m%d%H%M`. Build the filename `post-mortem-<that>.md`. Default location = project root, or the dir passed as argument.
2. **Detect compaction.** If this session was continued from a compacted summary (a resume-summary sits in your context, or you recall a compaction fired), add the honesty notice from `reference.md` §Compaction and mark pre-compaction phases lower-fidelity.
3. **Reconstruct from memory, oldest→newest**, per Gotcha 2's ordering.
4. **Fill every core section** from `reference.md`; add optional sections when the session warrants them (menu there); never drop a core one.
5. **Write the file**, then print the 5-line chat summary (mission · headline result · biggest win · biggest avoidable cost · one playbook line). Never auto-commit.

## The sections (full detail + template in `reference.md`)

Core (always, all nine): Mission · Idée maîtresse (the ONE most-leveraged decision) · Chronologie · Bilan chiffré · Ce qui a marché ✅ · Échecs & fausses pistes ❌ (root-caused) · Où économiser 💰 · Playbook réutilisable · Rôle de l'humain.

`reference.md` holds the per-section directives, the number-tagging rules, the compaction notice, the optional-sections menu, and the exact output template. Follow it exactly.
