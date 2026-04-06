---
name: load-context
description: 'Menu-driven session resume. Guided UX wrapper for context loading. Triggers: "load", "resume", "continue where I left off", "what was I working on?".'
allowed-tools: [Bash, Read, Glob, AskUserQuestion]
model: haiku
context: main
user-invocable: true
argument-hint: ""
---

# Load Session

Menu-driven session resume for non-CLI interfaces (Cowork desktop, Telegram, CC CLI).
Reads CONTEXT files written by both `/save-context` (cowork) and `/save-context` (dstoic) — same format.

## Phase 1: Scan Available Sessions

Run both Glob calls **in parallel** (single tool message):

```
Glob: CONTEXT-*-llm.md (current dir)
Glob: done/CONTEXT-*-llm.md (archived)
```

For each file found, Read first 10 lines to extract header:
- stream name (from filename: `CONTEXT-{name}-llm.md` → `{name}`, `CONTEXT-llm.md` → `default`)
- status
- focus
- saved date
- goal (if present)

## ⚠️ AskUserQuestion Guard

After EVERY `AskUserQuestion` call, check if answers are empty/blank. If empty: output "⚠️ Questions didn't display (known bug).", present options as numbered text list, WAIT for user reply.

## Phase 2: Present Menu

Sort by saved date (most recent first). Separate active from archived.

```
📂 Available sessions:

📍 Active
  1. 🔄 {stream-1} ({relative-date}, {status})
     → {focus}
  2. 🏗️ {stream-2} ({relative-date}, {status})
     → {focus}

📦 Archived
  3. ✅ {stream-3} ({relative-date}, {status})
     → {focus}

Resume which? (number) or 0 to start fresh
```

If only 1 session exists → still show menu but suggest it: `Resume **{stream}**? (yes / no)`

If 0 sessions found → `No saved sessions found. Use /switch to select a project, or start working and /save when ready.`

Wait for user reply.

## Phase 3: Load Selected Session

If user picks a number → Read the full CONTEXT file.
If user picks 0 → respond: `Starting fresh. What would you like to work on?`

If session was from `done/` → note: `📦 This session was archived (status: {status}). Resuming will create a new active session.`

Parse CONTEXT file sections:
- Header (stream, saved, status, focus, goal)
- Project
- Next Tasks
- Session (progression, decisions, thinking, unexpected)
- Hot Files
- Refs

## Phase 4: Present Resume Report

```
📍 Resumed: {stream name}
⏰ Last saved: {date, relative}
🎯 Focus: {focus}
🎯 Goal: {goal}

📋 Where you left off:
  {session progression — 2-3 key bullets}

🔑 Decisions made:
  {decisions — bullets if any}

✅ Next tasks:
  1. {task 1}
  2. {task 2}
  3. {task 3}

🔥 Key files:
  - {file}: {role}

What would you like to tackle first?
```

**Graceful degradation**: missing sections → skip silently. Only Header + Next Tasks required.
**Token budget**: report under 1500 tokens. Summarize, don't dump.

## Phase 5: Offer Expansion (optional)

If the session has OpenSpec references or >5 hot files:

```
💡 Want me to load the full context? (reads top hot files + OpenSpec specs)
Reply yes for deep context, or just start working.
```

## Rules

1. **Menu-first** — always show available sessions as numbered choices
2. **Human-friendly dates** — "2 weeks ago", "yesterday", not ISO timestamps
3. **Focus line as preview** — always show it under menu entry
4. **Graceful on empty** — no sessions = helpful guidance, not error
5. **Client-agnostic output** — works in terminal, Cowork, Telegram. Simple lists + emoji
6. **No shell scripts** — pure tool calls only (Glob, Read, AskUserQuestion)
7. **Token budget** — resume report under 1500 tokens
