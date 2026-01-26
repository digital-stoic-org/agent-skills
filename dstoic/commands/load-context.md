---
description: Resume session from CONTEXT-llm.md
allowed-tools: Bash, Read, Glob, TaskCreate, TaskUpdate, TaskList, AskUserQuestion
argument-hint: "[stream-name] [--full]"
model: sonnet
---

# Load Context

Load session state from `CONTEXT-{stream}-llm.md` and optionally expand full resources.

**Speed**: < 5 seconds (default), 8-12 seconds (--full)

## Workflow

### 0. Parse Arguments & Detect Streams

Parse `$ARGUMENTS`:
- `--full` flag → deep expansion mode
- Stream name → specific stream to load
- Empty → detect available streams

**Stream detection**:
```bash
# List all context files
ls -t CONTEXT-*llm.md 2>/dev/null

# Extract stream names (sorted by modification time)
# CONTEXT-llm.md → "default"
# CONTEXT-baseline-llm.md → "baseline"
# CONTEXT-pricing-v2-llm.md → "pricing-v2"
```

**Decision tree**:
```
IF explicit stream name in $ARGUMENTS:
    → Load that stream directly (CONTEXT-{stream}-llm.md or CONTEXT-llm.md for "default")
    → Error if file doesn't exist

IF only CONTEXT-llm.md exists:
    → Load it directly (no menu)
    → Backward compatible behavior

IF multiple CONTEXT-*-llm.md files exist:
    → AskUserQuestion with stream list
    → Include timestamps for each
    → Auto-select if only one

IF no context files exist:
    → Report error, suggest /save-context
```

### 1. Stream Selection (if needed)

When multiple streams exist and no explicit selection:

```
AskUserQuestion:
  question: "Which stream would you like to load?"
  header: "Stream"
  options:
    - label: "default (2026-01-26 15:42)"
      description: "Main context file (CONTEXT-llm.md)"
    - label: "baseline (2026-01-26 14:30)"
      description: "Fork point from /create-context"
    - label: "stream1 (2026-01-26 16:10)"
      description: "Working branch"
```

**Filename resolution**:
```
"default" → CONTEXT-llm.md
"baseline" → CONTEXT-baseline-llm.md
"{name}" → CONTEXT-{name}-llm.md
```

### 2. Check Context File Exists

```bash
# Based on resolved filename
[ -f "$context_file" ] && echo "found" || echo "not found"
```

If not found, report and exit with helpful message.

### 3. Read Context File

Parse YAML sections:
- Stream name (from `stream:` field or filename)
- Project reference (if exists)
- Manifest reference (if exists)
- Git state
- OpenSpec status
- Tasks (session TaskCreate state)
- NextTasks queue
- Session summary
- Current focus
- Hot files

### 4. Restore Task State

If `Tasks` section exists in context file with `active: true`:
1. Extract all items from `items` array
2. Sort by dependencies (topological sort - tasks with no blockedBy first)
3. Create tasks in order:
   a. `TaskCreate` with subject and activeForm
   b. Build ID remap table (old ID → new ID)
4. After all created, set dependencies:
   a. `TaskUpdate` to set blocks/blockedBy (using remapped IDs)
5. Set status for non-pending tasks:
   a. `TaskUpdate` to set status to in_progress if needed

**Dependency ordering algorithm:**
```
ready = [tasks with empty blockedBy]
result = []
while ready not empty:
    task = ready.pop()
    result.append(task)
    for t in remaining tasks:
        if task.id in t.blockedBy:
            remove task.id from t.blockedBy
            if t.blockedBy now empty:
                ready.append(t)
return result
```

**ID Remapping:**
```
id_map = {}  # old_id → new_id
for task in sorted_tasks:
    new_task = TaskCreate(subject, activeForm)
    id_map[task.id] = new_task.id

# Apply dependencies with remapped IDs
for task in sorted_tasks:
    if task.blocks or task.blockedBy:
        TaskUpdate(
            taskId=id_map[task.id],
            addBlocks=[id_map[b] for b in task.blocks],
            addBlockedBy=[id_map[b] for b in task.blockedBy]
        )
```

**Rules:**
- Skip if `active: false` or section missing
- Don't restore `completed_recent` items (informational only)
- Skip dependency references to non-existent tasks

### 5. Expand Resources (if --full)

Check for `--full` in `$ARGUMENTS`.

If `--full`:
```bash
# Full git diff
git diff main..HEAD 2>/dev/null || git diff HEAD~5..HEAD

# Read OpenSpec project.md (if referenced in context file)
# Read OpenSpec proposal (if path in context file)
# Read OpenSpec tasks (if path in context file)
# Read top 3 hot files from Files section
# Read .ctx/manifest.yaml (if referenced)
```

### 6. Test Script Detection

```bash
for f in scripts/test scripts/tests script/test script/tests test.sh; do
  [ -x "$f" ] && echo "TEST_SCRIPT=$f" && break
done
```

Report path only (user runs separately).

If OpenSpec tasks exist, count manual checklist progress.

### 7. Format Resume Report

Output human-friendly report (emoji allowed, prose allowed).

```markdown
# 🔄 Session Resume: [branch-name]

**Stream**: [stream-name]
**Saved**: [timestamp]
**Focus**: [focus statement]
**Goal**: [goal statement]

## 📂 Available Streams

[IF multiple streams exist]:
- `default` (2026-01-26 15:42) ← loaded
- `baseline` (2026-01-26 14:30)
- `stream1` (2026-01-26 16:10)

[IF single stream]:
(single context file)

## 🎯 Project Context

[IF openspec/project.md referenced]:
**Vision**: [1-2 sentence summary from project.md]
**Reference**: `openspec/project.md` (see file for full architecture/patterns)

[IF .ctx/manifest.yaml referenced]:
**Manifest**: `.ctx/manifest.yaml` (source organization)

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

## 📋 Tasks Restored

[IF Tasks section had active: true]:
✅ Restored [n] tasks via TaskCreate
- 🔄 [in_progress: subject]
- ⏳ [pending: subject] (blocked by #[remapped_id])

[IF no tasks to restore]:
No active tasks from previous session.

## ✅ NextTasks

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

### 8. Suggest Next Action

Based on:
- Restored tasks (highest priority if `in_progress` exists)
- Next task from NextTasks section
- Current focus from Focus section
- Git dirty state
- Test script availability

Provide specific, actionable next step. If a task was restored with `in_progress` status, that becomes the immediate focus.

## Flags

**Default** (no args): Minimal summary
- Detect streams, prompt if multiple
- Just read context file
- Parse and format
- < 5 seconds

**`--full`**: Deep expansion
- Read full OpenSpec proposal
- Read full OpenSpec tasks
- Run full git diff
- Read top 3 hot files
- Read manifest.yaml if exists
- 8-12 seconds

**`[stream-name]`**: Direct load
- Load specific stream without menu
- Examples: `/load-context baseline`, `/load-context pricing-v2`
- "default" loads CONTEXT-llm.md

## Stream Management

**Available streams display**:
```bash
# Get all context files with timestamps
for f in CONTEXT-*llm.md; do
  if [ "$f" = "CONTEXT-llm.md" ]; then
    stream="default"
  else
    stream=$(echo "$f" | sed 's/CONTEXT-\(.*\)-llm.md/\1/')
  fi
  timestamp=$(stat -c %Y "$f" 2>/dev/null || stat -f %m "$f")
  date=$(date -d "@$timestamp" "+%Y-%m-%d %H:%M" 2>/dev/null || date -r "$timestamp" "+%Y-%m-%d %H:%M")
  echo "$stream ($date)"
done
```

**Cross-platform note**: Uses `stat` with fallback for macOS vs Linux.

## Notes

- Use Sonnet model (needs to synthesize summary, interpret context, suggest next steps)
- Output is human-friendly (emoji, prose)
- CONTEXT-*-llm.md is LLM-optimized input
- Resume report is user-facing output
- **Stream management:**
  - Detect all CONTEXT-*-llm.md files
  - AskUserQuestion if multiple (with timestamps)
  - Direct load if single or explicit stream name
  - Show available streams in report header
- **Task integration:**
  - If `Tasks` section has `active: true`: restore via TaskCreate/TaskUpdate
  - Topological sort ensures dependencies created in correct order
  - ID remapping preserves dependency relationships with new IDs
  - Restored `in_progress` task becomes immediate next step
  - Skip `completed_recent` (informational context only)
  - Report restoration status in resume output
- **OpenSpec integration:**
  - If project.md referenced: read and summarize vision (default mode)
  - If --full: include key architecture sections from project.md
  - Project context section shows alignment between session and project goals
- If no context files exist, suggest running `/save-context` first

## Error Messages

| Condition | Message |
|-----------|---------|
| No context files | "No context files found. Run `/save-context` to create one." |
| Stream not found | "Stream '{name}' not found. Available: {list}" |
| File read error | "Could not read {filename}. Check file permissions." |

## Related

- `/save-context [stream] [description]` - Save session to named stream
- `/create-context` - Create baseline from .in/ folder
- `/load-context [stream] [--full]` - This command
