---
description: Resume session from CONTEXT-llm.md
allowed-tools: Bash, Read, AskUserQuestion
argument-hint: "[stream-name] [--full]"
model: haiku
---

# Load Context

Load session state from `CONTEXT-{stream}-llm.md` and optionally expand full resources.

**Speed**: < 3 seconds (default), 5-8 seconds (--full)

## ⚡ Performance Rules

**CRITICAL — follow these rules to minimize latency:**

1. **Use `rtk` for ALL shell commands** — never raw git/ls/grep
2. **Parallel tool calls** — make ALL independent tool calls in a single message
3. **Minimize round-trips** — batch reads, batch task creates, batch updates
4. **No unnecessary synthesis** — present parsed YAML directly, don't rephrase
5. **NO progress tasks** — load progress is shown in final report only, don't pollute task list

## Workflow

### Phase 1: Detect & Read (parallel — ONE message)

**Before tool calls, output**: `🔍 Detecting streams and loading context...`

**IMPORTANT: Make ALL of these tool calls simultaneously in a single response.**

```
Bash (all in one):
  - List streams: rtk ls -t CONTEXT-*llm.md || true
  - Find test scripts: for f in scripts/test scripts/tests script/test script/tests test.sh; do [ -x "$f" ] && echo "TEST_SCRIPT=$f" && break; done

Read: CONTEXT-{stream}-llm.md (if stream known from $ARGUMENTS)
```

Detect streams and read context simultaneously.

If `$ARGUMENTS` contains an explicit stream name:
- Read `CONTEXT-{stream}-llm.md` directly (or `CONTEXT-llm.md` for "default")

**Otherwise** — wait for Phase 1 results to determine which file to read.

### Phase 1b: Stream Selection (only if needed)

If multiple streams and no explicit selection:

```
AskUserQuestion:
  question: "Which stream would you like to load?"
  header: "Stream"
  options: [streams with timestamps from Phase 1]
```

Then Read the selected file.

**Filename resolution**: `"default" → CONTEXT-llm.md`, `"{name}" → CONTEXT-{name}-llm.md`

### Phase 2: Expand Resources (if --full)

**Before tool calls, output**: `📂 Expanding full resources...`

**DO NOT restore tasks** — they're informational context only, not actual tasks to recreate.

If `--full` flag present, make parallel Read calls in ONE message:
- OpenSpec project.md (if referenced)
- OpenSpec proposal.md (if referenced)
- OpenSpec tasks.md (if referenced)
- Top 3 hot files from Files section
- .ctx/manifest.yaml (if referenced)

### Phase 3: Format Resume Report

**Before report, output**: `📊 Preparing resume report...`

**Report structure** (skip empty sections):

```
# 🔄 Session Resume: [branch-name]

Stream/Saved/Focus/Goal (always show)
📂 Available Streams (if multiple)
🎯 Project Context (if refs exist)
🎯 Active Work (if OpenSpec active)
📋 Task Snapshot (if tasks saved)
✅ NextTasks (always show top 3)
💬 Session Context (always show)
📁 Hot Files (always show)
🧪 Tests (if script found)
🎯 Next Step (always show)
```

**Formatting principles**:
- Parse YAML directly, don't re-synthesize
- Expand inline objects: `{done: 5, active: 2}` → "5 done, 2 active"
- Lists from YAML arrays without re-ordering
- Emoji-rich but concise
- **Next Step**: Single sentence action based on NextTasks[0] + Focus.immediate

## Flags

**Default** (no args): Fast resume
- Detect streams, prompt if multiple
- Read context file, display fancy snapshot
- Direct data presentation
- < 3 seconds

**`--full`**: Deep expansion
- Read full OpenSpec proposal + tasks
- Read top 3 hot files
- Read manifest.yaml if exists
- 5-8 seconds

**`[stream-name]`**: Direct load
- Load specific stream without menu
- Examples: `/load-context baseline`, `/load-context pricing-v2`
- "default" loads CONTEXT-llm.md

## Stream Management

**Available streams display**:
- Phase 1 uses `rtk ls -t CONTEXT-*llm.md` for fast timestamp retrieval
- `rtk` provides optimized output with filenames and modification times
- No `date` command forks needed - timestamps come from rtk's internal implementation
- For AskUserQuestion: parse rtk output to extract stream names and timestamps

## Meta-Awareness: What This Command Consumes

**Input format**: Token-optimized YAML from `/save-context` (no emoji, inline objects)
**Audience**: Human user resuming work
**Purpose**: Transform LLM-optimized context → human-friendly resume report

**Context file characteristics**:
- Clean YAML structure (parse directly, don't re-analyze)
- File references (don't auto-load unless --full)
- Aggregated progression (already synthesized)
- Inline objects: `{done: 5, active: 2}` (expand to prose)

**Transformation rules**:
- YAML → emoji-rich prose
- Compact → expanded (e.g., "done: 5" → "✅ 5 completed")
- References → links (e.g., "proposal: path/to/file.md" → "**Proposal**: `path/to/file.md`")
- Tasks section → display only, NEVER restore via TaskCreate

**Report output principles**:
- Skip empty sections entirely (don't show "No X" placeholders)
- Present data directly from parsed YAML (no re-interpretation)
- Suggest next action based on NextTasks + Focus

## Error Messages

| Condition | Message |
|-----------|---------|
| No context files | "No context files found. Run `/save-context` to create one." |
| Stream not found | "Stream '{name}' not found. Available: {list}" |
| File read error | "Could not read {filename}. Check file permissions." |

## Related

- `/save-context [stream] [description]` - Save session to named stream
- `/list-contexts` - List all contexts across code/ and projects/
- `/create-context` - Create baseline from .in/ folder
- `/load-context [stream] [--full]` - This command
