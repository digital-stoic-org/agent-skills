---
name: triage
description: Inline inbox triage — two-pass // comment flow for async Obsidian review. Triggers: process inbox, triage inbox, route inbox, process triage.
context: fork
allowed-tools: [Read, Edit, Glob, Grep]
model: sonnet
user-invocable: true
---

# GTD Triage

Two-pass inline triage. Claude annotates inbox, human reviews in Obsidian, Claude routes on second pass.

## Two-Pass Flow

### Pass 1: Annotate (no second `//` on lines)

Trigger: `/gtd:triage` when `### New` has lines WITHOUT `//`

1. Read `/home/mat/dev/gtd-pcm/01-inbox.md`, extract `### New` items
2. If empty: report "📭 Inbox empty" and stop
3. Scan `03-projects/` for routing targets (Glob + Grep)
4. Append `// → target #tags` to each unannotated line
5. Report: "✏️ Annotated X items. Review in Obsidian, append your `//` comments, then run `/gtd:triage` again."

### Pass 2: Route (lines have two `//` blocks)

Trigger: `/gtd:triage` when `### New` has lines with TWO `//` blocks

1. Read inbox, parse lines with two `//` blocks
2. If none found: report "⏳ No reviewed items yet" and stop
3. For each reviewed line, interpret the second `//`:
   - `// ok` → route using Claude's proposal (first `//`)
   - `// ok → different-target #tags` → route with human override
   - `// delete` → remove from inbox entirely
   - `// any other text` → interpret intent (question = flag with ❓, target name = reroute)
4. Apply routing to destination project files
5. Remove routed + deleted lines from `### New`
6. Leave lines with only one `//` (unreviewed) untouched — never strip proposals
7. Report summary

### Auto-detect Pass

On invocation, detect which pass to run:
- If ANY line in `### New` has two `//` blocks → **Pass 2**
- If lines exist without `//` → **Pass 1**
- If mixed: run Pass 2 first (process reviewed), then Pass 1 on remaining

## Classification

**Type**: task | reference | waiting-for | someday | trash | project-seed

**Destination**: Scan `03-projects/` for best match
- Glob: `03-projects/**/*.md`
- Grep: search project content for keyword match
- Use folder number prefix as shorthand (e.g., `38-mind-body`)

**Tags**: ONLY allowed GTD tags
- Priority: `#next` `#frog` `#waiting` `#recurring`
- Context: `#phone` `#field` `#admin` `#read-quick` `#read-deep` `#read-book` `#listen` `#watch` `#shop`
- Energy: `#deep` `#braindead`
- People: `#agenda/Name` `#waiting/Name`
- No tag = backlog

**Unclear items**: Mark with `// ❓` + reason instead of routing proposal

**Dates**: `[due:: YYYY-MM-DD]` or `[scheduled:: YYYY-MM-DD]` — never emoji shorthand

## Routing Rules

| Type | Destination | Section |
|------|-------------|---------|
| task | project `01-{name}.md` | `## Tasks` |
| reference | project file | `## Reference` |
| waiting-for | project `01-{name}.md` | `## Waiting For` with `#waiting/Name` |
| someday | 50-59 project | `## Tasks` |
| trash | (delete) | Remove from inbox |
| project-seed | (flag ❓) | Needs new project — ask human |

## Scope

- Only process `### New` section
- Other sections (Prio 1, Prio 2, Misc, Praxis, LQ) are left untouched
- Completed items (`- [x]`) are skipped

## Error Handling

- **Empty inbox**: "📭 Inbox empty"
- **No matching project**: Use `// ❓ no project match` — don't guess
- **Edit conflicts**: Report and ask user to retry

## Constraints

- Tasks ONLY in `01-{name}.md` files (never in reference docs)
- `[field:: value]` date format
- Preserve existing file structure and markdown validity
- No trailing whitespace
- NEVER use AskUserQuestion — the `//` flow IS the human gate

## Triggers

**Direct**: `/gtd:triage`

**Natural language**: "process inbox", "triage inbox", "route inbox", "process triage"
