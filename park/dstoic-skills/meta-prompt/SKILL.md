---
name: meta-prompt
description: "Recursive meta-prompt ledger for human-guided complex tasks spanning multiple sessions. Maintains RELIANCE.md — a single-source, append-aware file carrying FINALITÉ, the RAIL session-chain, and the decision/collaboration trail across context resets. Use when: a complex task spans sessions and you want loss-free hand-off + drift detection + proportional AI challenge, WITHOUT autonomous loops or heavy regression tests. Triggers: meta-prompt, reliance, start a guided task, resume reliance, close session, next RAIL."
argument-hint: "[init|resume|close] [task-name]"
allowed-tools: [Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion, Skill]
model: opus
effort: high
context: main
user-invocable: true
---

# Meta-Prompt — RELIANCE ledger

Engine for `RELIANCE.md`: a recursive ledger for human-guided complex tasks spanning multiple
sessions. NOT for autonomous loops or dev with heavy regression tests. **Read `reference.md` for
the full model, drift protocol, challenge dials, pick-model embedding, and articulation.**

**Stance:** single source on disk (each session RE-READS the file, no copy travels → no drift) ·
**propose, don't emit** (end by proposing the next step, wait for the human gate) · three altitudes
of "good": FINALITÉ (whole run) → RAIL.landed (session gate) → HEADING.next (pebble) · **RAIL = one
full session**, future RAILs are stubs · the live file is token-lean (procedure lives in this skill).

**Concepts** (full legend → `reference/morin-glossary.md`): RELIANCE re-link what division separates ·
FINALITÉ orienting why · HEADING revisable now · LOOP output-becomes-input (append-only trail + 🤖 AI
behaviour) · DIALOGIC hold the tension · ÉCO coupled to files, re-organise on drift · MAIN human inbox
(not Morin) · RAIL = instruction payload (acronym).

## Modes

`$ARGUMENTS` = `{init|resume|close} [task-name]`. No mode → infer: no `RELIANCE.md` → `init`; else `resume`.

| Mode | Does |
|---|---|
| **init** | Elicit FINALITÉ + RAIL-0 (role·bounds·ready·landed) + coarse RAIL-chain (ask human, don't invent scope) → `/pick-model` for RAIL-0's `model:` field (recommendation, human confirms) → list hot files by tier + fingerprint → emit lean `RELIANCE.md` from `reference/RELIANCE-template.md` §LLM SKELETON (zones+data only, strip all prose/diagrams) → confirm before first work. |
| **resume** | Run the contract IN ORDER: **0 MAIN** (drain inbox → ack to LOOP → clear; overrides drift) · **1 ÉCO** (drift-check ref/wip → back-sync+flag) · **2 LOOP** (orient from trail, esp. logged failures) · **3 HEADING** (propose next pebble, cite LOOP) · **4 DIALOGIC** (Dial 1 mandate + Dial 2 one lens) · **5 surface + wait** (no proceed without human). |
| **close** | **1** append LOOP two-level entry (append-only, never prune) · **2** mark NOW done · **3** gate RAIL-0 LANDED; if met → detail next RAIL (READY = this LANDED) + re-run `/pick-model`; else keep open · **4** if `/save-context` active, thin its Next/Decisions to `→ see RELIANCE.md`. |

**Gate granularity:** gate at the boulder boundary, not every pebble — pebbles flow light-touch once a boulder is confirmed.

## Anti-patterns

- ❌ Copying the plan into the prompt (travelling state → drift). Single disk source only.
- ❌ Pruning/rewriting LOOP — append-only and sacred.
- ❌ Emitting the next step without the human gate (that's `/goal`, not this).
- ❌ Pre-scripting within-session steps — the loop generates the next pebble; only the RAIL-chain is mapped ahead.
- ❌ Loading the rich template into context — it lives in `reference/`, Read on demand at `init` only.
- ❌ Drift-checking park-tier or non-hot files — mutability tier = drift budget.

> `// future: per-RAIL autonomy flag — a RAIL whose LANDED is machine-checkable could run /goal-like.`
> `// RELIANCE = the human-in-the-loop superset of /goal.`
