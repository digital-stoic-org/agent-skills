---
name: distill-skill
description: Record an interactive Claude Code session and distill it into one or more generalized skills. Captures turns, tool calls, failures, friction, and confusion signals, then hands a structured draft to edit-tool. Use when "distill skill", "record macro", "turn this session into a skill", "extract skill from session", or "/distill-skill [start|finalize]".
argument-hint: "[start|finalize|status]"
allowed-tools: [Read, Write, Edit, Bash, Glob, Grep, Skill]
model: sonnet
context: main
---

# Distill Skill — Session → Skill

Record a CC session, then distill it into a generalized skill via `edit-tool`. Two modes: **forward** (record as we go) and **retrospective** (parse session-so-far).

## Modes

| Arg | Mode | When |
|---|---|---|
| `start` | Forward | User invokes at/near session start. Creates trace dir, annotates turns going forward. |
| `finalize` | Close out | End of session. Run search-skill dedup, propose split, hand to edit-tool. |
| `status` | Inspect | Show current trace dir + turn count + friction/confusion tally. |
| *(none)* | Retrospective | Parse session-so-far. **⚠️ Warn if compaction may have occurred** (turn count high / early context lost). |

## Workflow

### 1. `start` — initialize trace

```bash
: "${PRAXIS_DIR:?PRAXIS_DIR must be set}"
SID=$(date -Iseconds | tr ':+' '-')
DIR="$PRAXIS_DIR/.tmp/distill-skill/$SID"
mkdir -p "$DIR"
echo "$DIR" > "$PRAXIS_DIR/.tmp/distill-skill/.current"
```

Create three files in `$DIR`:
- `trace.jsonl` — append-only per-turn: `{ts, turn, user_intent, tools_used, files_touched, outcome, friction?, confusion_flag?}`
- `draft.yaml` — RISEN-lite scaffold (see `reference.md`)
- `anti-patterns.md` — what didn't work + why

Respond: `🎬 Recording to $DIR. Annotate turns as you go. /distill-skill finalize when done.`

### 2. Annotate each turn

After each meaningful turn, append to `trace.jsonl` — fields: `user_intent` (generalized, not verbatim) · `tools_used` · `files_touched` · `outcome` ∈ {`ok`,`retry`,`abandoned`} · `friction` (verbatim correction, if any) · `confusion_flag` (`true` if assistant asked clarifying Q → signals upfront disambiguation needed).

Keep `draft.yaml` filled progressively as evidence accumulates.

### 3. `finalize` — distill

1. **Compaction check** (retrospective only): turn >30 or early context lost → warn, confirm start-of-session facts first.
2. **Generalize**: `trace.jsonl` + `draft.yaml` → strip session-specifics.
3. **Dedup**: `/search-skill <intent>` → report overlap verdict. **Mandatory.**
4. **Split**: ≥2 distinct end-goals with disjoint tools/inputs → propose split, confirm.
5. **Preload scan**: Glob `$PRAXIS_DIR/reference/` for frameworks referenced → list as `@include` candidates.
6. **Handoff**: `/edit-tool` with `draft.yaml` + `anti-patterns.md` → it triages (skill/bash/agent) and writes. **Never write final skill directly.**
7. **Kaizen**: each `retry`-friction → append to `$PRAXIS_DIR/thinking/kaizen/distill-skill.jsonl`.

### 4. `status`

Read `.current` → print `$DIR`, `wc -l trace.jsonl`, friction count (`grep -c '"friction"'`), confusion count.

## RISEN-lite scaffold

Structures *what to gather*, not final format. Full template + trace schema + annotation heuristics + split rules in `reference.md`.

```yaml
role: {who performs — inferred from session}
intent: {generalized goal, session-specifics stripped}
steps: [{ordered actions observed}]
end_goal: {observable success criteria}
narrowing: {constraints, anti-patterns, confusion-disambiguation, resources}
```

## Rules

- **Friction + anti-patterns are non-negotiable** in final skill's `narrowing`.
- **Confusion flags → upfront disambiguation** in final skill.
- **No compaction handling**: warn, don't fix.
