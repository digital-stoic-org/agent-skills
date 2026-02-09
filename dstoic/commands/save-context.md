---
description: Save session to CONTEXT-llm.md with conversation summary
allowed-tools: Bash, Read, Write, AskUserQuestion, TaskList
argument-hint: "[stream-name] [description]"
model: sonnet
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
- Empty → AskUserQuestion with existing streams (defer to after data gathering if needed)

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

Write the context file using the template below, then report.

**Stream resolution** (if not yet resolved from Phase 1):
- If `$ARGUMENTS` empty and multiple streams exist → AskUserQuestion now
- Otherwise use determined stream name

**Report** (enhanced with session summary):

After writing context file, display report:

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

Example:
```
✅ Saved session context to CONTEXT-test6-llm.md

Stream: test6
Tokens: ~580 (target: 1200-1500)

📊 Captured:
  • Focus: Validated optimized load-context implementation
  • Hot files: 3 files
  • Decisions: 1 key decision
  • Next tasks: 3 tasks queued
  • Session events: 5 progression steps

📁 Available streams: CONTEXT-llm.md, test1-test6
```

## Template Structure

**Sections**: Header (saved/stream/focus/goal) → Project → OpenSpec → Tasks → NextTasks → Session → Focus → Files → Refs

**Key principles**:
- Token target: 1200-1500 MAX
- Session section: 780 tokens max (progression/decisions/thinking/unexpected)
- Tasks: Include in_progress + pending + 3 recent completed only
- Files: Max 10 hot files with brief roles
- Use YAML inline objects where possible: `{done: 5, active: 2, pending: 3}`

**See existing CONTEXT-*-llm.md files for template format** (don't recreate from scratch, follow established pattern)

## Context Quality Self-Check

**Before writing, evaluate session significance**:

✅ **Worth saving** (create context):
- Non-trivial work completed (>1 file edited, meaningful decisions made)
- Mid-stream checkpoint (need to switch tasks, resume later)
- Learning/insights captured that inform future work
- OpenSpec change in progress with active tasks

⚠️ **Marginal** (ask user):
- Quick fix/simple task (1-2 file changes, obvious approach)
- Exploration with no decisions yet (research phase, no conclusions)

❌ **Too small** (suggest skip):
- Greeting/chat only
- Single read/question answered
- Pure troubleshooting with no resolution

**If marginal or too small**: Output "📊 Session appears brief. Save context anyway?" and wait for confirmation.

## Stream Naming Conventions

**Reserved names**:
- `default` - maps to `CONTEXT-llm.md` (backward compat)
- `baseline` - created by `/create-context`, fork point for streams

**Recommended patterns**:
- `feature-name` - feature work (e.g., `pricing-v2`, `auth-refactor`)
- `experiment-n` - exploratory work (e.g., `experiment-1`)
- `angle-name` - RISEN angles (e.g., `angle-tech`, `angle-exec`)

**Invalid names** (will prompt for correction):
- Contains spaces, special chars except `-` and `_`
- Longer than 50 characters
- Empty string (use "default" explicitly)

## Meta-Awareness: What This Command Produces

**Output format**: Token-optimized YAML (no emoji, no prose, inline objects)
**Audience**: Future LLM sessions loading context via `/load-context`
**Purpose**: Session state restoration, not documentation

**What load-context expects**:
- Clean YAML structure for parsing
- File references (paths only, not content)
- Aggregated progression (not tool-by-tool transcript)
- Decision rationale (why, not just what)
- Inline progress: `{done: 5, active: 2}` not multi-line

**Token budget discipline**:
- Session section often bloats — watch for redundancy between progression/decisions/thinking
- Compress without losing key insights
- Prefer structured data over narrative

## Related

- `/load-context [stream]` - Load saved stream
- `/create-context` - Create baseline from .in/ folder
