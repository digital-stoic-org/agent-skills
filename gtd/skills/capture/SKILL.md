---
name: capture
description: Quick capture to GTD inbox from CLI or natural language
context: fork
allowed-tools: [Read, Edit]
model: haiku
user-invocable: true
argument-hint: <item>
---

# GTD Capture

Fast append to inbox. No priority, no routing — just capture.

## Instructions

1. Take `$ARGUMENTS` as item text
2. Read `/home/mat/dev/gtd-pcm/01-inbox.md`
3. Find `### New` section
4. Insert `- <item>` after section header (newest first)
5. Report: "Captured: <item>"

## Implementation

**Step 1**: Read `/home/mat/dev/gtd-pcm/01-inbox.md`

**Step 2**: Find `### New` section in the file

**Step 3**: Use Edit tool to insert new item:
- old_string: `### New` (exactly as it appears in file)
- new_string: `### New\n- <item text from $ARGUMENTS>`

**Insert position**: After `### New` header, before any existing items (newest first).

**Example**:
```
Before:
### New
### Prio 1

After capture "buy milk":
### New
- buy milk
### Prio 1
```

## Triggers

**Direct invocation**:
- `/gtd:capture buy milk`
- `/gtd:capture call John about project`

**Natural language** (auto-invoked):
- "add buy milk to inbox"
- "capture: need to call John"
- "inbox: review quarterly goals"

## Notes

- No flags, no parsing — append as-is
- No priority sorting (that's triage)
- Empty New section is OK
- Preserve all other sections unchanged

## Error Handling

**File not found**: If inbox doesn't exist, report error and suggest checking vault path.

**Section not found**: If `### New` section missing, report error and suggest running setup.

**Edit conflict**: If Edit tool fails (e.g., concurrent modification), report error and ask user to retry.
