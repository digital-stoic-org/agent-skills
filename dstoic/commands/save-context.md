---
description: Save session to CONTEXT-llm.md with conversation summary
allowed-tools: Bash, Read, Glob, Write
argument-hint: "[description]"
model: sonnet
---

# Save Context

Save current session state to `CONTEXT-llm.md` with LLM-optimized format.

**Target**: 1500-2000 tokens MAX
**Speed**: 8-12 seconds

## Workflow

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

### 3. TodoWrite State

Capture the current TodoWrite list from the session (if active):
- Check if TodoWrite has items (in_progress or pending)
- Serialize all non-completed todos
- Include completed todos only if recent (last 3)

Format:
```yaml
todos:
  - status: in_progress | pending | completed
    content: [task description]
    activeForm: [present continuous form]
```

**Rules:**
- Skip if no active todos
- Max 10 items (prioritize in_progress > pending > recent completed)
- Preserve exact content/activeForm for accurate restoration

### 4. Task Inference

Infer next 3 tasks from:
- OpenSpec next tasks (if exists)
- TodoWrite pending items (if exists)
- Recent conversation (what's being worked on)
- Logical next steps

Format:
```yaml
next:
  - source: openspec | todowrite | inferred
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

### 8. Write CONTEXT-llm.md

Use LLM-optimized format (see template below).

### 9. Report

```
Saved session context to CONTEXT-llm.md
Tokens: ~[estimate] (target: 1500-2000)
Branch: [branch-name]
Focus: [focus-statement]
```

## Template

```markdown
# Session Context

saved: [ISO 8601 timestamp]
branch: [branch-name]
focus: [1-2 sentence focus]
goal: [brief goal aligned with project vision or inferred]

## Project

```yaml
ref: openspec/project.md | n/a
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

## Todos

```yaml
# Active session TodoWrite state (if any)
active: true | false
items:
  - status: in_progress
    content: [task description]
    activeForm: [present continuous form]
  - status: pending
    content: [task description]
    activeForm: [present continuous form]
# Include max 3 recent completed for context
completed_recent:
  - [task description]
```

## Tasks

```yaml
next:
  - source: openspec | todowrite | inferred
    task: [description]

  - source: openspec | todowrite | inferred
    task: [description]

  - source: openspec | todowrite | inferred
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

✅ Token-optimized: Strip prose, keep directives/facts/structure
✅ Structured data: Clean YAML/JSON (no emoji)
✅ Compact keys: short but clear
✅ Inline objects: `{M: 2, A: 1}` not multi-line
✅ Aggregated timeline: not tool-by-tool
✅ References: pointers not inline content

❌ NO emoji in CONTEXT-llm.md
❌ NO prose paragraphs
❌ NO decorative formatting
❌ NO full proposals inline (pointer only)

## Notes

- Use Sonnet model (conversation analysis requires reasoning)
- Skip TODO.md entirely (use OpenSpec or infer)
- **OpenSpec integration:**
  - If `openspec/project.md` exists: reference it, don't duplicate vision/architecture
  - Read project vision (lines 1-20) to align goal statement
  - Active change: include both project.md AND proposal.md references
  - Title + next task only (not full proposal content)
- Session summary: 780 tokens max
- Total output: 1500-2000 tokens MAX
- Optional description arg: `$ARGUMENTS` - add user note if provided
