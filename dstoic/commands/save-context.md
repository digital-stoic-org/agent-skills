---
description: Save session to CONTEXT-llm.md with conversation summary
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion, TaskList
argument-hint: "[stream-name] [description]"
model: haiku
---

# Save Context

Save current session state to `CONTEXT-{stream}-llm.md` with LLM-optimized format.

**Target**: 1200-1500 tokens MAX
**Speed**: 3-5 seconds

## ⚡ Performance Rules

**CRITICAL — follow these rules to minimize latency:**

1. **Use `rtk` for ALL shell commands** — never raw git/ls/grep
2. **Parallel tool calls** — make ALL independent tool calls in a single message
3. **Minimize round-trips** — gather all data in phase 1, reason once in phase 2, write in phase 3
4. **No unnecessary synthesis** — output structured data directly
5. **NO progress tasks** — save operation is atomic, use status messages only

## CONTEXT File Template

The file written in Phase 3 MUST follow this exact structure:

```markdown
# Session Context: {title}

saved: YYYY-MM-DDTHH:MM:SSZ
stream: {name}
status: {exploring|building|decided|parked|done}
focus: {1-2 sentences}
goal: {1 sentence}

---

## Project

ref: {openspec project.md path | n/a}
type: {project type}

## Tasks

{in_progress + pending + 3 recent completed only, inline objects}

## Next Tasks

- {task 1}
- {task 2}
- {task 3}

## Session

progression:
  - {aggregated timeline steps}
decisions:
  - {key choice}: {rationale}
thinking:
  - {reasoning, trade-offs, insights}
unexpected:
  - {pivots, corrections, surprises}

## Hot Files

- {path}: {brief role}

## Refs

- {external references if any}
```

**Key principles**:
- Token target: 1200-1500 MAX
- Session section: 780 tokens max (progression/decisions/thinking/unexpected)
- Tasks: in_progress + pending + 3 recent completed only
- Hot Files: max 10 files with brief roles
- Use YAML inline objects where possible: `{done: 5, active: 2, pending: 3}`

## Context Quality Self-Check

Before writing, evaluate session significance:
- ✅ **Save**: non-trivial work (>1 file, decisions made), mid-stream checkpoint, learning/insights, OpenSpec change active
- ⚠️ **Ask user**: quick fix (1-2 files, obvious), exploration with no conclusions
- ❌ **Suggest skip**: greeting/chat only, single read/question, unresolved troubleshooting

If marginal or too small: `"📊 Session appears brief. Save context anyway?"` — wait for confirmation.

## Workflow

### Phase 1: Gather Data (parallel — ONE message)

**Before tool calls, output**: `🔍 Gathering session data...`

**IMPORTANT: Make ALL of these tool calls simultaneously in a single response.**

```
Bash (combined query):
  echo "---OPENSPEC---"
  [ -d "openspec" ] && rtk ls openspec/changes/ 2>/dev/null || echo "none"
  [ -f "openspec/project.md" ] && head -20 openspec/project.md || echo "no project.md"
  echo "---STREAMS---"
  rtk ls -t CONTEXT-*llm.md 2>/dev/null || echo "none"

TaskList: Get current task state
```

If openspec active change detected from Bash output, also Read in parallel:
- `openspec/changes/[id]/proposal.md` (first 10 lines for title)
- `openspec/changes/[id]/tasks.md` (scan for progress)

#### Argument parsing (LLM reasoning, not a tool call)

Determine stream name from `$ARGUMENTS`:
- First word = stream name (if valid: `^[a-zA-Z0-9_-]{1,50}$`)
- Remaining = description
- Empty → check conversation history for a prior `/load-context {stream}` invocation and reuse that stream name as default (skip AskUserQuestion)
- Empty + no prior load-context found → AskUserQuestion with existing streams (defer to after data gathering if needed)

**Stream → filename**: `"default"/"" → CONTEXT-llm.md`, otherwise `CONTEXT-{stream}-llm.md`

### Phase 2: Analyze & Synthesize (ONE reasoning pass)

**Before reasoning, output**: `💭 Analyzing session and synthesizing context...`

With ALL data gathered, perform a SINGLE analysis pass to produce ALL of these sections at once:

**Analyze the conversation (last 15-20 messages) and gathered data. Fill ALL sections:**

1. **NextTasks** — Infer next 3 tasks from OpenSpec, TaskList pending, conversation, logical next steps
2. **Session** — Extract from conversation:
   - progression: aggregated timeline (what happened)
   - decisions: key choices + rationale
   - thinking: reasoning process, trade-offs, insights
   - unexpected: pivots, user corrections, surprises
3. **Hot Files** — max 10 files discussed/read/edited this session
4. **Focus & Goal** — synthesize from project vision (if OpenSpec) + conversation:
   - 1-2 sentence focus (active task + challenges)
   - Goal aligned with project vision or inferred

**Token budget**: 780 tokens for Session section, 1200-1500 total output.

### Phase 3: Write & Report

**Before writing, output**: `💾 Writing context file...`

Write the context file using the CONTEXT File Template above, then report.

**Stream resolution** (if not yet resolved from Phase 1):
- If `$ARGUMENTS` empty and multiple streams exist → AskUserQuestion now
- Otherwise use determined stream name

**Report**:

```
✅ Saved session context to {filename}

Stream: {stream-name}
Tokens: ~{estimate} (target: 1200-1500)

📊 Captured:
  • Focus: {focus-statement}
  • Hot files: {count} files
  • Decisions: {count} key decisions
  • Next tasks: {count} tasks queued
  • Session events: {count} progression steps

📁 Available streams: {list}
```

### Phase 3b: Upsert INDEX.md (after report)

Resolve path: `$(git rev-parse --show-toplevel)/INDEX.md`. Skip if missing or CWD not in `code/`, `projects/`, or `vaults/`.

1. Read INDEX.md (or create with Active/Parked/Done/Archived headers)
2. Derive row from CONTEXT file and path:
   - **Area**: `code`, `projects`, or `vaults` (from CWD relative to repo root)
   - **Project**: folder name relative to area
   - **Context**: stream name
   - **Status**: use Status Mapping below to get emoji form
   - **Focus**: ≤80 chars
   - **Saved**: YYYY-MM-DD
3. Search Active Contexts for matching `| {Area} | {Project} | {Context} |` row:
   - Found → Edit replace
   - Not found → Edit append (before blank line)
4. Update summary counts (`📊 **Total**:`)
5. **Preserve** Parked/Done/Archived unchanged

**Performance**: Single Read + single Edit.

## Status Mapping

Normalize status values to emoji form for INDEX.md rows:

| Raw Value | Display |
|-----------|---------|
| `exploring` | 🔍 exploring |
| `decided` | ✅ decided |
| `building`, `in_progress` | 🏗️ building |
| `parked` | ⏸️ parked |
| `operational`, `verified` | ✅ operational |
| `done`, `completed`, `closed` | ✅ done |
| missing/empty/`n/a` | ❓ unknown |

## Stream Naming

**Reserved**: `default` → `CONTEXT-llm.md`, `baseline` → fork point from `/create-context`
**Pattern**: `^[a-zA-Z0-9_-]{1,50}$` (e.g., `pricing-v2`, `experiment-1`, `angle-tech`)

## Meta-Awareness: What This Command Produces

**Output**: Key-value header + markdown sections (token-optimized, no emoji, inline objects)
**Audience**: Future LLM sessions loading via `/load-context`
**Purpose**: Session state restoration, not documentation

**What load-context expects**:
- Key-value header (saved/stream/status/focus/goal) for frontmatter extraction
- Markdown sections: `## Session`, `## Next Tasks`, `## Hot Files`, `## Tasks`, `## Project`, `## Refs`
- File references (paths only, not content)
- Aggregated progression (not tool-by-tool transcript)
- Decision rationale (why, not just what)
- Inline progress: `{done: 5, active: 2}` not multi-line

## Related

- `/load-context [stream] [--full]` - Load saved stream
- `/list-contexts [--sync] [--archive <stream>]` - List/sync all contexts
- `/create-context` - Create baseline from .in/ folder
