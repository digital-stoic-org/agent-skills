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
4. **No unnecessary synthesis** — present parsed data directly, don't rephrase
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

Parse the CONTEXT file as key-value header + markdown sections. Map sections to report blocks:

**Section mapping** (match with fallback for variants):

| CONTEXT Section | Report Block | Fallback names |
|----------------|-------------|----------------|
| Header fields (saved/stream/status/focus/goal) | Stream/Saved/Focus/Goal | — |
| `## Session` | 💬 Session Context | `## Session Progression` |
| `## Next Tasks` | ✅ NextTasks | `## NextTasks` |
| `## Hot Files` | 📁 Hot Files | `## Files` |
| `## Tasks` | 📋 Task Snapshot | — |
| `## Project` | 🎯 Project Context | — |
| `## Refs` | 📎 References | `## References` |

**Graceful degradation**: If a section is missing or malformed, skip it in the report (don't error). Only Header fields and `## Next Tasks` are required.

**Report structure** (skip empty/missing sections):

```
# 🔄 Session Resume: [stream-name]

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
- Parse key-value header + markdown sections directly, don't re-synthesize
- Expand inline objects: `{done: 5, active: 2}` → "5 done, 2 active"
- Lists from markdown without re-ordering
- Emoji-rich but concise
- **Next Step**: Single sentence action based on NextTasks[0] + focus field

## Meta-Awareness: What This Command Consumes

**Input format**: Key-value header + markdown sections from `/save-context` (token-optimized, no emoji, inline objects)
**Audience**: Human user resuming work
**Purpose**: Transform LLM-optimized context → human-friendly resume report

**Transformation rules**:
- Key-value header → formatted metadata block
- Compact → expanded (e.g., `{done: 5}` → "✅ 5 completed")
- References → links (e.g., `ref: path/to/file.md` → "**Ref**: `path/to/file.md`")
- Tasks section → display only, NEVER restore via TaskCreate
- Skip empty sections entirely (don't show "No X" placeholders)

## Error Messages

| Condition | Message |
|-----------|---------|
| No context files | "No context files found. Run `/save-context` to create one." |
| Stream not found | "Stream '{name}' not found. Available: {list}" |
| File read error | "Could not read {filename}. Check file permissions." |
| Malformed file | Parse what's available, skip unparseable sections with no error |

## Related

- `/save-context [stream] [description]` - Save session to named stream
- `/list-contexts [--sync] [--archive <stream>]` - List/sync all contexts
- `/create-context` - Create baseline from .in/ folder
