---
name: triage
description: Inline inbox triage — two-pass // comment flow for async Obsidian review. Triggers: process inbox, triage inbox, route inbox, process triage.
context: subagent
allowed-tools: [Read, Edit, Glob, Grep]
model: sonnet
user-invocable: true
---

# GTD Triage

Two-pass inline triage. Claude annotates inbox, human reviews in Obsidian, Claude routes on second pass.

## Two-Pass Flow

### Pass 1: Annotate (no second `//` on lines)

Trigger: `/gtd:triage` when `### New` has lines WITHOUT `//`

1. Read `/praxis/gtd/01-inbox.md`, extract `### New` items
2. If empty: report "📭 Inbox empty" and stop
3. Scan `/praxis/projects/` for routing targets (Glob + Grep)
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

## Project Discovery

Scan `/praxis/projects/` for routing targets:
- Glob: `/praxis/projects/**/*.md`
- Grep: search project content for keyword match
- Use folder name as shorthand (e.g., `mind-body`, `slasheo`, `villa-nara`)

## Classification

**Type**: task | reference | waiting-for | someday | trash | project-seed | article | video

**Tags**: ONLY allowed GTD tags
- Priority: `#next` `#frog` `#waiting` `#recurring`
- Context: `#phone` `#field` `#admin` `#read-quick` `#read-deep` `#read-book` `#listen` `#watch` `#shop`
- Energy: `#deep` `#braindead`
- People: `#agenda/Name` `#waiting/Name`
- No tag = backlog

**Unclear items**: Mark with `// ❓` + reason instead of routing proposal

**Dates**: `[due:: YYYY-MM-DD]` or `[scheduled:: YYYY-MM-DD]` — never emoji shorthand

## Routing Rules

Project files use these standard sections:

| Type | Destination section |
|------|-------------------|
| task + `#next`/`#frog` | `### 🔴 Just Do It` |
| task + `#read-deep`/`#read-quick` or needs research | `### 🟡 Research & Reflect` |
| task + `#waiting/Name` or `[scheduled::]`/`[due::]` | `### 🔵 Not Now But Will` |
| task (no priority tag, someday) | `### 🟢 Maybe` |
| task (default, no special signal) | `### 🔴 Just Do It` |
| reference | `## 📎 Reference` |
| article | Create stub in `/praxis/library/articles/` |
| video | Create stub in `/praxis/library/videos/` |
| trash | (delete) | Remove from inbox |
| project-seed | (flag ❓) | Needs new project — ask human |

**Finding the right file**: Scan all `.md` files in the target project folder for matching sections. Pick the file that has the destination section. If multiple files match, prefer the one with existing tasks.

**Fallback** (if section not found): `### 🔴 Just Do It` → `### 🟢 Maybe` → `## ✅ Tasks` → end of file

## Library Routing

### Articles (`// → library/articles`)
- **Tags**: `#read-quick`, `#read-deep`, `#read-book`
- **Stub**: `/praxis/library/articles/{slug}.md`
- **Slug**: auto-generated kebab-case from URL domain + path fragment (e.g., `alexismontoro-multiplie-pr-par-20`)
- **Format**:
  ```yaml
  ---
  type: article
  status: unread
  url: https://example.com/the-article
  created: YYYY-MM-DD
  tags:
    - read-quick
  ---
  # {Short description from inbox item}
  ```

### Videos (`// → library/videos`)
- **Tags**: `#watch`, `#listen`
- **Stub**: `/praxis/library/videos/{slug}.md`
- **Slug**: auto-generated kebab-case from URL domain + video ID or title fragment (e.g., `youtube-qXod1JtGmis`)
- **Format**:
  ```yaml
  ---
  type: video
  status: unwatched
  url: https://www.youtube.com/watch?v=xxx
  created: YYYY-MM-DD
  tags:
    - watch
  ---
  # {Short description from inbox item}
  ```

Post-consumption processing is out of scope — handled by a separate skill

## Scope

- Only process `### New` section
- Other sections (Unprocessed, etc.) are left untouched
- Completed items (`- [x]`) are skipped

## Error Handling

- **Empty inbox**: "📭 Inbox empty"
- **No matching project**: Use `// ❓ no project match` — don't guess
- **Edit conflicts**: Report and ask user to retry

## Constraints

- `[field:: value]` date format
- Preserve existing file structure and markdown validity
- No trailing whitespace
- NEVER use AskUserQuestion — the `//` flow IS the human gate

## Triggers

**Direct**: `/gtd:triage`

**Natural language**: "process inbox", "triage inbox", "route inbox", "process triage"
