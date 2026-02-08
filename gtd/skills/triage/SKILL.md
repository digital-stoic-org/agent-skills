---
name: triage
description: Intelligent inbox triage with human-in-the-loop approval. Classifies and routes items to projects.
context: fork
allowed-tools: [Read, Edit, Glob, Grep, AskUserQuestion]
model: sonnet
user-invocable: true
---

# GTD Triage

Process inbox items with intelligent routing. Propose-then-apply with human gate.

## Instructions

1. Read `/home/mat/dev/gtd-pcm/01-inbox.md`
2. Extract items from `### New` section
3. If empty: report "Inbox empty" and stop
4. For each item, classify and propose routing
5. Present triage plan to user via AskUserQuestion
6. Apply approved routing
7. Remove routed items from `### New`

## Classification

Analyze each item and determine:

**Type**: task | reference | waiting-for | someday | trash | project-seed

**Destination**: Scan `03-projects/` for best match
- Use Glob to find project files: `03-projects/**/*.md`
- Use Grep to search project content for context
- Match by keywords, domain, or create new project

**Tags**: ONLY allowed GTD tags
- Priority: `#next` `#frog` `#waiting` `#recurring`
- Context: `#phone` `#field` `#admin` `#read` `#listen` `#watch` `#shop`
- Energy: `#deep` `#braindead`
- People: `#agenda/Name` `#waiting/Name`
- No tag = backlog

**Dates**: Use `[field:: YYYY-MM-DD]` format
- `[due:: YYYY-MM-DD]` for hard deadlines
- `[scheduled:: YYYY-MM-DD]` for tickler dates
- Never use emoji date shorthand

## Routing Rules

| Type | Destination | Section |
|------|-------------|---------|
| task | project `01-index.md` | `## Tasks` (under appropriate priority) |
| reference | project file | `## Reference` |
| waiting-for | project `01-index.md` | `## Waiting For` with `#waiting/Name` |
| someday | 50-59 project | `## Tasks` |
| trash | (delete) | Remove from inbox |
| project-seed | (flag) | Needs new project file |

**Priority placement** (for tasks):
- No tag → Backlog subsection
- `#next` → Next Actions subsection
- `#frog` → Today subsection

## Approval Flow

Use AskUserQuestion to present routing plan:

```yaml
question: "Review triage plan for X items. Approve to apply routing?"
header: "Triage Plan"
options:
  - label: "Approve and route all items"
    description: "Apply routing plan to all items"
  - label: "Skip this session"
    description: "Leave items in inbox for later"
```

Display plan before asking:
```
Triage Plan:
1. "buy milk" → 20-home/01-index.md ## Tasks #shop
2. "article link" → 01-project/01-index.md ## Reference #read
3. "call John" → 15-work/01-index.md ## Waiting For #waiting/John
```

## Implementation

**Step 1**: Read inbox and extract items
```
Read: /home/mat/dev/gtd-pcm/01-inbox.md
Parse: Lines after `### New` until next `###` header
```

**Step 2**: Scan projects for routing
```
Glob: 03-projects/**/*.md
Grep: Search for keywords from inbox items
```

**Step 3**: Build routing table
For each item:
- Classify type
- Find best destination project
- Assign tags (only allowed tags)
- Add dates if applicable

**Step 4**: Present plan and get approval

**Step 5**: Apply routing
- Edit destination files (append to correct section)
- Edit inbox (remove routed items from ### New)

**Step 6**: Report summary
```
✅ Triaged X items:
- Y tasks routed
- Z references filed
- N items remain in inbox
```

## Error Handling

**Empty inbox**: Report "Inbox empty" and stop

**No matching project**: Ask user or suggest creating new project

**Invalid tags**: Never add tags not in allowed list

**Edit conflicts**: Report error and ask user to retry

## Constraints

- Tasks ONLY in `01-index.md` files (never in reference docs)
- Use `[field:: value]` date format (not emoji)
- Preserve existing file structure
- No trailing whitespace
- Maintain markdown validity

## Triggers

**Direct invocation**:
- `/gtd:triage`

**Natural language** (auto-invoked):
- "process inbox"
- "triage inbox items"
- "route inbox to projects"
