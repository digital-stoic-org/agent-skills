---
name: save-context
description: 'Menu-driven session save. Guided UX wrapper for context saving. Triggers: "save", "save my work", "checkpoint", "I''m done for now".'
allowed-tools: [Bash, Read, Write, Glob, AskUserQuestion]
model: haiku
context: main
user-invocable: true
argument-hint: ""
---

# Save Session

Menu-driven session save for non-CLI interfaces (Cowork desktop, Telegram, CC CLI).
Same CONTEXT file format as `dstoic:save-context` — files are interchangeable.

**Target**: 1200-1500 tokens MAX for CONTEXT file

## Phase 1: Detect Current Project (parallel)

```
Glob: CONTEXT-*-llm.md (current dir, exclude done/)
Read: CLAUDE.md (first 5 lines, for project name from H1 — required)
```

Identify:
- Project name (from CLAUDE.md H1 heading — all CLAUDE.md files must have `# Project Name` as first line)
- Existing CONTEXT streams (filenames → stream names)

If no CLAUDE.md found in current dir or parents → warn: "⚠️ No project context detected. Use /switch first to select a project."

Before Phase 2: run quality self-check from `reference.md` — if session is trivial, confirm with user before proceeding.

## ⚠️ AskUserQuestion Guard

After EVERY `AskUserQuestion` call, check if answers are empty/blank. If empty: output "⚠️ Questions didn't display (known bug).", present options as numbered text list, WAIT for user reply.

## Phase 2: Ask Save Type + Stream (single menu when possible)

**0-1 existing streams** → merge type + stream into 1 question:

```
💾 Save {stream-name} as:

1. 🔄 Checkpoint — I'll continue later
2. ✅ Done — this work is finished
3. 🅿️ Parking — switching to something else

Which one? (1/2/3)
```

Where `{stream-name}` = existing stream name, or auto-generated from project + conversation topic if no streams exist.

**2+ existing streams** → 2 questions. First ask stream:

```
📝 Save to which session?

1. 📍 {stream-1} (existing)
2. 📍 {stream-2} (existing)
3. ✨ New session

Which one?
```

Then ask save type (same 3-choice menu as above).

**New stream confirmation** (when auto-generated or user picks "New"):

```
📝 Stream name: {suggested-name}
OK? (yes / type a different name)
```

Mapping:
- 1 → status: `building`
- 2 → status: `done`
- 3 → status: `parked`

**Stream naming**: pattern `^[a-zA-Z0-9_-]{1,50}$`. Reserved: `default` → `CONTEXT-llm.md`, `baseline`.

## Phase 4: Synthesize & Write

From conversation (last 15-20 messages), synthesize:

1. **Next** — 3 tasks (IMPORTANT: use heading "Next" — Claude Code compaction grep-matches `next`/`todo`/`pending` keywords for survival priority)
2. **Session** — progression, decisions, thinking, unexpected (780 tokens max)
3. **Hot Files** — max 10 discussed/edited
4. **Focus & Goal** — 1-2 sentence focus + goal

Write CONTEXT file using template from `reference.md`.

**Filename**: `default` → `CONTEXT-llm.md`, otherwise `CONTEXT-{stream}-llm.md`

## Phase 5: Auto-Archive

If status is `done` or `parked`:
```
Bash: mkdir -p done && mv CONTEXT-{stream}-llm.md done/
```

**Exceptions** — do NOT move:
- `CONTEXT-llm.md` (default stream)
- `CONTEXT-baseline-llm.md`
- If user explicitly says "keep here"

## Phase 6: Confirm

```
💾 Saved: CONTEXT-{stream}-llm.md
📊 Status: {emoji} {status}
📍 Focus: {1-line focus}
📋 Next tasks:
  - {task 1}
  - {task 2}
  - {task 3}
```

If archived: `📦 Archived to done/ (status: {status})`

## Rules

1. **Never ask for stream name as free text first** — always offer existing streams or auto-suggest
2. **3 choices max per menu** — don't overwhelm
3. **Auto-detect over ask** — project name, stream name, status should be inferred when possible
4. **Same CONTEXT file format** as dstoic:save-context — files must be readable by both /load and /load-context
5. **Client-agnostic output** — works in terminal, Cowork, Telegram
6. **Token budget** — CONTEXT file stays under 1500 tokens
7. **No shell scripts** — pure tool calls only (Glob, Read, Write, Edit). Only Bash for `mkdir -p done && mv`
