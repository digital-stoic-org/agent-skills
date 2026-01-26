---
description: Save session to CONTEXT-llm.md with conversation summary
allowed-tools: Bash, Read, Glob, Write, AskUserQuestion
argument-hint: "[stream-name] [description]"
model: sonnet
---

# Save Context

Save current session state to `CONTEXT-{stream}-llm.md` with LLM-optimized format.

**Target**: 1500-2000 tokens MAX
**Speed**: 8-12 seconds

## Workflow

### 0. Parse Arguments & Determine Stream

Parse `$ARGUMENTS`:
- First word = stream name (if valid)
- Remaining words = description (optional)

**Stream name validation**:
```bash
# Valid: alphanumeric, hyphens, underscores, 1-50 chars
[[ "$stream" =~ ^[a-zA-Z0-9_-]{1,50}$ ]]
```

**Decision tree**:
```
IF $ARGUMENTS is empty:
    → List existing streams
    → AskUserQuestion: "Stream name? (Enter for default)"
    → Options: "default", existing streams, "Other"

IF $ARGUMENTS starts with valid stream name:
    → Use that stream name
    → Rest of args = description

IF $ARGUMENTS is just description (invalid as stream name):
    → Use "default" stream
    → All args = description
```

**Existing streams detection**:
```bash
ls CONTEXT-*-llm.md 2>/dev/null | sed 's/CONTEXT-\(.*\)-llm.md/\1/' | grep -v '^$'
```

**Stream → filename mapping**:
```
"default" or "" → CONTEXT-llm.md
"baseline"      → CONTEXT-baseline-llm.md
"pricing-v2"    → CONTEXT-pricing-v2-llm.md
```

### 1. Git Context

```bash
git branch --show-current
git log --oneline -5
git status --short
git diff --stat main..HEAD 2>/dev/null || git diff --stat
```

### 2. OpenSpec Context

```bash
[ -d "openspec" ] && openspec list || echo "none"
[ -f "openspec/project.md" ] && echo "project.md exists" || echo "no project.md"
```

**If `openspec/project.md` exists:**
- This is the golden source for vision/architecture/patterns
- CONTEXT-llm.md will reference it, not duplicate it

**If active change exists:**
- Read ONLY title from `openspec/changes/[id]/proposal.md`
- Read next unchecked task from `openspec/changes/[id]/tasks.md`
- Count progress: `grep -c '\[x\]'` vs `grep -c '\[ \]'`

### 3. Task State

Capture the current TaskCreate/TaskList state from the session (if active):
- Call `TaskList` to get all tasks
- Serialize: id, subject, status, blocks, blockedBy, activeForm
- Include completed tasks only if recent (last 3)

Format:
```yaml
tasks:
  - id: "1"
    subject: [brief title]
    status: in_progress | pending
    blocks: [2, 3]
    blockedBy: []
    activeForm: [present continuous form]
```

**Rules:**
- Skip if TaskList returns empty
- Max 10 items (prioritize in_progress > pending > recent completed)
- Skip description field (too verbose for token budget)
- Preserve blocks/blockedBy for dependency restoration

### 4. Next Task Inference

Infer next 3 tasks from:
- OpenSpec next tasks (if exists)
- TaskList pending items (if exists)
- Recent conversation (what's being worked on)
- Logical next steps

Format:
```yaml
next:
  - source: openspec | tasks | inferred
    task: [description]
```

### 5. Conversation Summary

Analyze last 15-20 messages. Extract:

**Progression** (aggregated timeline):
- What was analyzed/loaded
- Key evaluations/decisions
- Major pivots/changes
- Current state

**Decisions** (key choices made):
- What was decided
- Rationale/reasoning

**Thinking** (reasoning process):
- Why certain approaches chosen
- Trade-offs considered
- Insights gained

**Unexpected** (pivots/surprises):
- User corrections
- Changed requirements
- Surprising findings

Token budget: 780 tokens for Session section

### 6. Hot Files

Detect max 10 files discussed/read/edited this session.

### 7. Current Focus & Goal

**If `openspec/project.md` exists:**
- Read vision/goal from project.md (lines 1-20 typically contain ## 🎯 Vision)
- Derive brief goal statement aligned with project vision
- Focus = current task in context of that goal

**Otherwise (non-OpenSpec projects):**
- Infer minimal big picture from conversation
- Focus = what's being worked on now

Synthesize 1-2 sentences:
- What task is active now
- Brief goal aligned with project (if OpenSpec) or inferred
- Any challenges

### 8. Write Context File

**Filename determination**:
```
stream == "default" or stream == "" → CONTEXT-llm.md
otherwise                           → CONTEXT-{stream}-llm.md
```

Use LLM-optimized format (see template below).

### 9. Report

```
Saved session context to {filename}
Stream: {stream-name}
Tokens: ~[estimate] (target: 1500-2000)
Branch: [branch-name]
Focus: [focus-statement]

Existing streams: {list of all CONTEXT-*-llm.md}
```

## Template

```markdown
# Session Context

saved: [ISO 8601 timestamp]
stream: [stream-name]
branch: [branch-name]
focus: [1-2 sentence focus]
goal: [brief goal aligned with project vision or inferred]

## Project

```yaml
ref: openspec/project.md | n/a
manifest: .ctx/manifest.yaml | n/a
# If project.md exists, it contains: vision, architecture, patterns, roadmap
# CONTEXT-llm.md focuses on ephemeral session state only
```

## Git

```yaml
branch: [name]
dirty: {M: [n], A: [n], D: [n]}
ahead_main: [n]
recent:
  - [hash]: [msg]
  - [hash]: [msg]
  - [hash]: [msg]
  - [hash]: [msg]
  - [hash]: [msg]
diff_stat: "+[n] -[n] across [n] files"
```

## OpenSpec

```yaml
active: [change-id] | none
status: [in_progress | pending] | n/a
title: [proposal title] | n/a
next_task: [next unchecked task] | n/a
proposal: openspec/changes/[id]/proposal.md | n/a
tasks: openspec/changes/[id]/tasks.md | n/a
progress: {done: [n], active: [n], pending: [n]} | n/a
```

## Tasks

```yaml
# Active session TaskCreate state (if any)
active: true | false
items:
  - id: "1"
    subject: [brief title]
    status: in_progress
    blocks: []
    blockedBy: []
    activeForm: [present continuous form]
  - id: "2"
    subject: [brief title]
    status: pending
    blocks: []
    blockedBy: [1]
    activeForm: [present continuous form]
# Include max 3 recent completed for context
completed_recent:
  - id: "0"
    subject: [completed task title]
```

## NextTasks

```yaml
next:
  - source: openspec | tasks | inferred
    task: [description]

  - source: openspec | tasks | inferred
    task: [description]

  - source: openspec | tasks | inferred
    task: [description]
```

## Session

```yaml
progression:
  - [aggregated action/analysis]
  - [key evaluation/decision point]
  - [major pivot/change]
  - [current state]

decisions:
  [key_area]: [decision made]
  rationale: [why this choice]
  [another_area]: [decision made]
  rationale: [reasoning]

thinking:
  - [insight/reasoning point]
  - [trade-off considered]
  - [approach rationale]

unexpected:
  - [user correction/pivot]
  - [changed requirement]
  - [surprising finding]
```

## Focus

```yaml
state: [current task/activity]
goal: [what trying to achieve]
challenges: [list of obstacles/questions]
immediate: [next immediate step]
```

## Files

```yaml
hot:
  - [path]: [role/purpose]
  - [path]: [role/purpose]
  - [path]: [role/purpose]
```

## Refs

```yaml
project: openspec/project.md | n/a
proposal: openspec/changes/[id]/proposal.md | n/a
tasks: openspec/changes/[id]/tasks.md | n/a
full_diff: git diff main..HEAD
test_script: [path] | n/a
```
```

## Token Optimization Rules

From CLAUDE.md:

- Token-optimized: Strip prose, keep directives/facts/structure
- Structured data: Clean YAML/JSON (no emoji)
- Compact keys: short but clear
- Inline objects: `{M: 2, A: 1}` not multi-line
- Aggregated timeline: not tool-by-tool
- References: pointers not inline content

- NO emoji in CONTEXT-llm.md
- NO prose paragraphs
- NO decorative formatting
- NO full proposals inline (pointer only)

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

## Notes

- Use Sonnet model (conversation analysis requires reasoning)
- Skip TODO.md entirely (use OpenSpec or infer)
- **Stream management:**
  - First arg is stream name if valid, else "default"
  - AskUserQuestion if no args provided (list existing streams)
  - Always include `stream:` field in output
- **OpenSpec integration:**
  - If `openspec/project.md` exists: reference it, don't duplicate vision/architecture
  - Read project vision (lines 1-20) to align goal statement
  - Active change: include both project.md AND proposal.md references
  - Title + next task only (not full proposal content)
- Session summary: 780 tokens max
- Total output: 1500-2000 tokens MAX
- Optional description: remaining args after stream name

## Related

- `/load-context [stream]` - Load saved stream
- `/create-context` - Create baseline from .in/ folder
