---
name: checkpoint
description: Capture a session's verbatim "meat" — the exact phrasing of constraints, rejected paths, corrections, live reasoning, learnings, pivots, open questions — into CHECKPOINT-*-llm.md, plus a synthesized summary of state. Use before /clear on a long reasoning session, when exact wording matters, or when saving a session you'll resume cold. Triggers: "checkpoint", "save the meat", "capture verbatim", "checkpoint before clear".
argument-hint: "[stream-name] [description]"
allowed-tools: [Bash, Read, Write, Task, AskUserQuestion]
model: sonnet
context: main
user-invocable: true
---

# Checkpoint

Write `CHECKPOINT-{stream}-llm.md`: a self-contained session snapshot with two layers.

- **Summary** — a synthesized, reworded view of state (goal, next steps, decisions, hot files). Cheap to regenerate; good enough for orientation.
- **Meat** — the **verbatim** signal that reconstruction would lose: the exact phrasing of constraints, rejected paths + why, subtle corrections, live reasoning threads, learnings, pivots, open questions. Copied byte-for-byte from the transcript, never reworded.

**Core contract**: the LLM DESIGNATES which turns matter (returns ids); a **script COPIES** their text. Meat text NEVER passes through a model — no hallucination, no output cost. See `reference.md` § Why.

## Setup — temp dir (never /tmp)

```
Bash: TMP="${CLAUDE_PROJECT_DIR:-$(pwd)}/.tmp/checkpoint"; mkdir -p "$TMP"
Bash: PY=$(command -v python3 || command -v python)   # never assume bare python3 — see reference.md
```

All intermediate files go in `$TMP`. Clean up at the end. If `$PY` is empty (or a project venv is pinned, prefer `.venv/bin/python`) → treat as PARSE FAILED → Phase 4 fallback.

## Workflow

### Phase 1 — Index the transcript (script, 0 tokens)

Resolve the newest project `.jsonl` — **use the resolved real path, not bare `pwd`** (symlink/alias breaks the slug); see `reference.md` § Transcript path for the exact snippet. Then:

```
Bash: "$PY" scripts/extract_turns.py index "$TRANSCRIPT" > "$TMP/turns.json"
```

**If the script exits non-zero → PARSE FAILED → go to Phase 4 fallback (summary-only).** Never crash.

### Phase 2 — Triage the meat (delegate to sub-agent, isolated)

Spawn ONE sub-agent (`Task`, subagent Sonnet) with `$TMP/turns.json`. It returns **ids + type(s) + weight only, never text**. Full prompt + the signal taxonomy + schema in `reference.md` § Triage prompt. Signal types: `constraint · rejection · correction · decision · reasoning · learning · pivot · assumption · open-question · preference · definition · resource`, weight 1–3.

**Validate**: keep only integer ids that exist in the index. Drop the rest.

### Phase 3 — Collect verbatim + write

```
Bash: "$PY" scripts/extract_turns.py collect "$TRANSCRIPT" <ids...> > "$TMP/meat.json"
```

Two meat captures (both verbatim, 0 model text):
1. **Punctual** — the collected turns (Phase 2 ids), anywhere in history, grouped by signal type.
2. **Contiguous** — turns AFTER the most-recent high-weight `decision`/`pivot` → the still-live, un-crystallized thread. Floor: last 3 turns. Hard cap: 25 turns / configured max (see `reference.md`).

Then synthesize the **summary** (from the conversation in context) and write `CHECKPOINT-{stream}-llm.md` using the template in `reference.md`. Lean vs full = weight cut (≥2 = lean).

### Phase 4 — Report + offer /clear

Report: file path, #meat turns, histogram by type + weight. Then **offer** (AskUserQuestion, honor the empty-answer guard in `reference.md`): clear the context now and reload from the checkpoint, or stay. Never clear without confirmation.

**Fallback (parse failed)**: write summary-only from conversation context (no `.jsonl`), tell the user "⚠️ verbatim meat unavailable (transcript parse failed) — summary-only checkpoint written", still offer to clear.

Clean up `$TMP` when done.

See `reference.md` for: transcript-path resolution, full triage prompt + taxonomy + schema, CHECKPOINT template, contiguous-window rule, empty-answer guard, golden test.
