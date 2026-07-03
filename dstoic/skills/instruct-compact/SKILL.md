---
name: instruct-compact
description: Generate a copy-paste instruction block to steer Claude Code's /compact so the summary keeps what matters. Use when about to compact context intentionally, before a long session gets summarized, or when the user says "instruct compact", "compaction instructions", "steer compact", "custom compact", "prepare compaction".
allowed-tools: [Bash, Read]
model: haiku
context: main
user-invocable: true
---

# Instruct Compact

Synthesize the current session into a **directive block** the user copy-pastes into `/compact <paste>`. The block tells the built-in summarizer what to **preserve verbatim**, what to **compress**, and what to **drop** — so intentional compaction keeps signal and sheds noise.

**Output**: a fenced block only, printed to terminal. No file written. **Target**: 250-400 tokens. **Speed**: 3-5s.

Distinct from `/save-context` (durable `CONTEXT-*-llm.md` for resuming later). This is ephemeral steering for compaction *now*.

## When to Use

- User is about to run `/compact` and wants to control what survives
- Long session nearing auto-compaction; user wants to front-load survival priorities
- Triggers: "instruct compact", "compaction instructions", "steer compact", "prepare compaction"

## Instructions

1. **Read the conversation** (last 15-20 messages) — no shell needed unless confirming a file path.
2. **Synthesize the 7 sections** (below). Write **directives to the summarizer**, not the content itself — e.g. "Preserve exact path `x/y.md`", not a copy of the file. Embed a literal only when losing it is expensive (exact paths, the one key decision).
3. **Print the block** using the template. Nothing else after it except one line: `Copy the block above into /compact.`

## The 7 Sections

| Section | Directive to summarizer | Tier |
|---|---|---|
| **Goal** | State the finalité in 1 sentence; keep verbatim, anchor the summary to it | PRESERVE |
| **Hot Files** | List exact paths + 3-word role; preserve paths character-for-character | PRESERVE |
| **Decisions** | Each decision + its *rationale*; the why is unrecoverable, keep it | PRESERVE |
| **Learnings** | Non-obvious facts found mid-session (bugs, constraints, gotchas); keep — costly to rediscover | PRESERVE |
| **Next** | 2-4 next actions. IMPORTANT: use heading "Next" — compaction grep-favors `next`/`todo`/`pending` for survival | PRESERVE |
| **Open threads** | Unresolved questions / mid-flight work so it isn't dropped | COMPRESS-OK |
| **Drop** | Name what to discard: verbose tool output, dead-end explorations, resolved detours, raw logs | DROP |

The **Drop** section is the unique lever vs. `/save-context` — it actively frees budget for the PRESERVE tiers.

## Output Template

Print exactly this shape (fill from synthesis; omit a section only if genuinely empty):

````markdown
```
Compaction instructions — preserve signal, drop noise.

GOAL (keep verbatim): {one sentence}

PRESERVE VERBATIM:
- Hot files (exact paths): {path — role}; {path — role}
- Decisions + rationale: {decision — why}; {decision — why}
- Learnings/gotchas: {non-obvious fact}; {constraint}

NEXT:
- {action}
- {action}

OPEN THREADS (may compress): {unresolved}; {mid-flight}

DROP (discard freely): {verbose tool output}; {dead ends}; {resolved detours}
```
Copy the block above into /compact.
````

## Best Practices

- **Directive, not dump**: instruct the summarizer; don't re-paste content. Exception: exact paths + the single most-load-bearing decision go in verbatim.
- **Rationale beats restatement**: "chose X because Y" survives; "chose X" gets re-litigated.
- **Be explicit about DROP**: silence = the summarizer guesses. Name the noise.
- **Skip the ritual for trivial sessions**: if the session is a greeting or a one-file fix, say "Session is light — compaction instructions add little" and stop.
