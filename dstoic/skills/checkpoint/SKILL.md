---
name: checkpoint
description: Capture a session's verbatim "meat" — the exact phrasing of constraints, rejected paths, corrections, live reasoning, learnings, pivots, open questions — into CHECKPOINT-*-llm.md, plus a synthesized summary of state. Use before /clear on a long reasoning session, when exact wording matters, or when saving a session you'll resume cold. Triggers: "checkpoint", "save the meat", "capture verbatim", "checkpoint before clear".
argument-hint: "[stream-name] [description]"
allowed-tools: [Bash, Read, Write, Task, Agent, AskUserQuestion]
model: sonnet
context: main
user-invocable: true
---

# Checkpoint

Write `CHECKPOINT-{stream}-llm.md`: a self-contained session snapshot with two layers.

- **Summary** — a synthesized, reworded view of state (goal, next steps, decisions, hot files). Cheap to regenerate; good enough for orientation.
- **Meat** — the **verbatim** signal that reconstruction would lose: the exact phrasing of constraints, rejected paths + why, subtle corrections, live reasoning threads, learnings, pivots, open questions. Copied byte-for-byte from the transcript, never reworded.

**Core contract** (two paths, both keep model text out of the meat):
1. **Author trailers (primary)** — each turn self-tags its own signal in an `<!-- ckpt … -->` comment as it's written; the skill just *harvests* them (0 LLM, 0 cost, highest fidelity — the author distilled live). Requires the global CLAUDE.md rule; see `reference.md` § Trailer harvest.
2. **Extractive triage (fallback / user-side)** — the LLM DESIGNATES which turns matter (returns ids); a **script COPIES** their text verbatim. Covers the user's exact words (untaggable) and any session predating the rule. See `reference.md` § Why.

Meat text NEVER passes through a model in either path — no hallucination, no output cost.

## Architecture — fork the pipeline, keep the offer in main

The pipeline (index → harvest → triage → collect → write) is mechanical and noisy: Bash output, a triage round-trip, assembler byte-counts. None of it belongs in the main conversation. So **run Phases 1–3 in a fork; keep Phase 4 (report relay + `/clear` offer) in main.**

```
MAIN (this skill, context: main)
 └─ spawn ONE fork (Agent, subagent_type: "fork" — inherits full session context)
     └─ fork runs Phases 1–3: index, harvest, triage (may spawn its own Task sub-agent),
        collect, synthesize summary, WRITE CHECKPOINT-{stream}-llm.md, clean up $TMP
     └─ fork returns ONLY a compact report string (never the meat, never tool output):
        path · #meat turns · histogram(type+weight) · status(full|lean|parse-failed)
 └─ MAIN receives that string → Phase 4: relay it + AskUserQuestion /clear offer
```

Why a fork (not `context: fork` on the whole skill, not a plain subagent):
- **Inherits context** — triage/summary need *this* session's turns; a fresh subagent wouldn't have them. A fork does.
- **Tool output stays out of main** — the fork's Bash/Task noise never enters your context; only its final message returns.
- **Phase 4 must stay in main** — only main can clear its own context, and the `/clear` offer is interactive. So the fork writes the file and reports; main makes the offer.

**Loud-fail guard (critical):** the fork MUST verify the resolved `.jsonl` is *this* session before checkpointing — cross-check the transcript's session id / cwd slug against its own environment, or content-match a distinctive recent turn. On mismatch or ambiguity it MUST return `status: TRANSCRIPT-MISMATCH` with what it found and checkpoint nothing — never silently snapshot the wrong session. Main then surfaces the failure instead of offering /clear.

The fork is handed: the stream name + description (from `$ARGUMENTS`), and the instruction to execute Phases 1–3 below and return the report. Everything in "Setup" and Phases 1–3 runs **inside the fork**; Phase 4 runs in **main**.

## Setup — temp dir (never /tmp)  ·  [runs in fork]

```
Bash: TMP="${CLAUDE_PROJECT_DIR:-$(pwd)}/.tmp/checkpoint"; mkdir -p "$TMP"
Bash: PY=$(command -v python3 || command -v python)   # never assume bare python3 — see reference.md
```

All intermediate files go in `$TMP`. Clean up at the end. If `$PY` is empty (or a project venv is pinned, prefer `.venv/bin/python`) → treat as PARSE FAILED → Phase 4 fallback.

## Workflow

### Phase 1 — Index the transcript (script, 0 tokens)  ·  [fork]

Resolve the newest project `.jsonl` — **use the resolved real path, not bare `pwd`** (symlink/alias breaks the slug); see `reference.md` § Transcript path for the exact snippet. **Then run the loud-fail guard** (Architecture above): confirm the resolved transcript is *this* session (session id / cwd slug / content-match a recent turn); on mismatch return `status: TRANSCRIPT-MISMATCH` and stop. Then:

```
Bash: "$PY" scripts/extract_turns.py index "$TRANSCRIPT" > "$TMP/turns.json"
```

**If the script exits non-zero → PARSE FAILED → go to Phase 4 fallback (summary-only).** Never crash.

### Phase 2 — Harvest author trailers (primary), then triage the rest  ·  [fork]

First **harvest** the author-distilled trailers (0 LLM, 0 hallucination — the model tagged its own meat live):

```
Bash: "$PY" scripts/extract_turns.py harvest "$TRANSCRIPT" > "$TMP/trailers.json"
```

Each entry is `{id, fields:{decision|reasoning|learning|pivot|rejected|constraint|assumption|open|definition|refs}}` — these feed the summary directly (already reworded by the author). See `reference.md` § Trailer harvest.

Then **triage** for what trailers can't cover. Spawn ONE sub-agent (`Task`, subagent Sonnet) with `$TMP/turns.json`. It returns **ids + type(s) + weight only, never text**. Full prompt + taxonomy + schema in `reference.md` § Triage prompt.

- **If trailers were harvested** (`$TMP/trailers.json` non-empty): scope the triage to **user turns + the two user-authored types** — `correction · preference` — plus any assistant turn that bears meat but emitted no trailer (older turns / missed). This halves the read and avoids re-capturing the assistant essays the trailers already distilled.
- **If no trailers** (session predates the CLAUDE.md rule): triage **all** turns across the full 12-type taxonomy, as before.

Signal types (full): `constraint · rejection · correction · decision · reasoning · learning · pivot · assumption · open-question · preference · definition · resource`, weight 1–3.

**Validate**: keep only integer ids that exist in the index. Drop the rest.

### Phase 3 — Collect verbatim + write  ·  [fork]

```
Bash: "$PY" scripts/extract_turns.py collect "$TRANSCRIPT" <ids...> > "$TMP/meat.json"
```

Two meat captures (both verbatim, 0 model text):
1. **Punctual** — the collected turns (Phase 2 ids), anywhere in history, grouped by signal type.
2. **Contiguous** — turns AFTER the most-recent high-weight `decision`/`pivot` → the still-live, un-crystallized thread. Floor: last 3 turns. Hard cap: 25 turns / configured max (see `reference.md`).

Then synthesize the **summary** (from the conversation in context **+ the harvested trailers** — fold their `decision/reasoning/learning/pivot/…` fields into the matching summary lists; they're author-distilled, no rework needed) and write `CHECKPOINT-{stream}-llm.md` using the template in `reference.md`. Lean vs full = weight cut (≥2 = lean).

Clean up `$TMP`. **Then return to main ONE compact report string and nothing else** (no meat, no tool output, no narration):

```
path: <abs path to CHECKPOINT-{stream}-llm.md>
meat_turns: <n>
histogram: {type: count, …} · weights {3: n, 2: n, 1: n}
status: full | lean | parse-failed | TRANSCRIPT-MISMATCH
[if parse-failed] note: verbatim meat unavailable (transcript parse failed) — summary-only written
[if TRANSCRIPT-MISMATCH] note: <what was found; nothing was written>
```

### Phase 4 — Relay + offer /clear  ·  [main]

Main receives the fork's report string. Do NOT re-run the pipeline. Then:

- **status full|lean|parse-failed** → print the path + #meat turns + histogram. If parse-failed, also print "⚠️ verbatim meat unavailable (transcript parse failed) — summary-only checkpoint written". Then **offer** (AskUserQuestion, honor the empty-answer guard in `reference.md`): clear the context now and reload from the checkpoint, or stay. **Never clear without confirmation.**
- **status TRANSCRIPT-MISMATCH** → surface the failure and the fork's note; write nothing, **do not offer /clear**. Ask the user to confirm the intended session/transcript before retrying.

See `reference.md` for: transcript-path resolution, full triage prompt + taxonomy + schema, CHECKPOINT template, contiguous-window rule, empty-answer guard, golden test.
