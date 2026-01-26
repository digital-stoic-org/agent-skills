---
description: Resume session from CONTEXT-llm.md
allowed-tools: Bash, Read, Glob, TodoWrite
argument-hint: "[--full]"
model: sonnet
---

# Load Context

Load session state from `CONTEXT-llm.md` and optionally expand full resources.

**Speed**: < 5 seconds (default), 8-12 seconds (--full)

## Workflow

### 1. Check CONTEXT-llm.md Exists

```bash
[ -f "CONTEXT-llm.md" ] && echo "found" || echo "not found"
```

If not found, report and exit.

### 2. Read CONTEXT-llm.md

Parse YAML sections:
- Project reference (if exists)
- Git state
- OpenSpec status
- Todos (session TodoWrite state)
- Task queue
- Session summary
- Current focus
- Hot files

### 3. Restore TodoWrite State

If `Todos` section exists in CONTEXT-llm.md with `active: true`:
1. Extract all items from `items` array
2. Call `TodoWrite` tool with the items to restore session state
3. First `in_progress` item becomes active immediately

**Rules:**
- Skip if `active: false` or section missing
- Preserve exact `status`, `content`, and `activeForm`
- Don't restore `completed_recent` items (informational only)

### 4. Expand Resources (if --full)

Check for `--full` in `$ARGUMENTS`.

If `--full`:
```bash
# Full git diff
git diff main..HEAD 2>/dev/null || git diff HEAD~5..HEAD

# Read OpenSpec project.md (if referenced in CONTEXT-llm.md)
# Read OpenSpec proposal (if path in CONTEXT-llm.md)
# Read OpenSpec tasks (if path in CONTEXT-llm.md)
# Read top 3 hot files from Files section
```

### 5. Test Script Detection

```bash
for f in scripts/test scripts/tests script/test script/tests test.sh; do
  [ -x "$f" ] && echo "TEST_SCRIPT=$f" && break
done
```

Report path only (user runs separately).

If OpenSpec tasks exist, count manual checklist progress.

### 6. Format Resume Report

Output human-friendly report (emoji allowed, prose allowed).

```markdown
# 🔄 Session Resume: [branch-name]

**Saved**: [timestamp]
**Focus**: [focus statement]
**Goal**: [goal statement]

## 🎯 Project Context

[IF openspec/project.md referenced]:
**Vision**: [1-2 sentence summary from project.md]
**Reference**: `openspec/project.md` (see file for full architecture/patterns)

[IF --full: include key sections from project.md - Vision, Architecture, Trust Zones]

## 📊 Git

- Branch: `[branch]`
- Status: [M files modified, A added, D deleted]
- Ahead of main: [n] commits
- Recent commits:
  - [hash] [msg]
  - [hash] [msg]
  - [hash] [msg]
- Changes: +[n] -[n] across [n] files

[IF --full: show condensed git diff --stat output]

## 🎯 Active Work

[IF OpenSpec active]:
**OpenSpec**: [change-id] - [title]
- Status: [in_progress/pending]
- Next task: [next_task from CONTEXT]
- Progress: [done]/[total] tasks complete

[IF --full: show proposal summary from proposal.md]

## 📋 Todos Restored

[IF Todos section had active: true]:
✅ Restored [n] items to TodoWrite
- 🔄 [in_progress item content]
- ⏳ [pending item 1]
- ⏳ [pending item 2]

[IF no todos to restore]:
No active todos from previous session.

## ✅ Tasks

Next 3 items:
1. [task 1] (from [source])
2. [task 2] (from [source])
3. [task 3] (from [source])

## 💬 Session Context

**What Happened**:
[Summarize progression from CONTEXT - 2-3 sentences]

**Key Decisions**:
[List 2-3 main decisions with rationale]

**Thinking Process**:
[1-2 key insights or trade-offs]

[IF unexpected events exist]:
**Unexpected**:
[List pivots/corrections]

## 📁 Hot Files

[List top 5-10 files with their roles]

[IF --full: show snippet of top 3 files]

## 🧪 Tests

[IF test script found]:
- Script: `[path]` (run with ./[path])

[IF manual checklist exists]:
- Manual: [x]/[y] items checked

## 🎯 Next Step

[1 sentence recommendation based on next task + current focus]
```

Skip empty sections entirely.

### 7. Suggest Next Action

Based on:
- Restored TodoWrite items (highest priority if `in_progress` exists)
- Next task from Tasks section
- Current focus from Focus section
- Git dirty state
- Test script availability

Provide specific, actionable next step. If TodoWrite was restored with an `in_progress` item, that becomes the immediate focus.

## Flags

**Default** (no args): Minimal summary
- Just read CONTEXT-llm.md
- Parse and format
- < 5 seconds

**`--full`**: Deep expansion
- Read full OpenSpec proposal
- Read full OpenSpec tasks
- Run full git diff
- Read top 3 hot files
- 8-12 seconds

## Notes

- Use Sonnet model (needs to synthesize summary, interpret context, suggest next steps)
- Output is human-friendly (emoji ✅, prose ✅)
- CONTEXT-llm.md is LLM-optimized input
- Resume report is user-facing output
- **TodoWrite integration:**
  - If `Todos` section has `active: true`: restore items via TodoWrite tool
  - Restored `in_progress` item becomes immediate next step
  - Skip `completed_recent` (informational context only)
  - Report restoration status in resume output
- **OpenSpec integration:**
  - If project.md referenced: read and summarize vision (default mode)
  - If --full: include key architecture sections from project.md
  - Project context section shows alignment between session and project goals
- If CONTEXT-llm.md missing, suggest running `/save-context` first

## Related

`/save-context [description]` - Creates CONTEXT-llm.md from current session
`/load-context [--full]` - Load this command
