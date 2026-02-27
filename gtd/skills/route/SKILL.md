---
name: route
description: Direct-to-project task routing — skip inbox when target is known. Triggers: route to project, add to project, file in.
context: fork
allowed-tools: [Read, Edit, Glob]
model: haiku
user-invocable: true
argument-hint: <item> → <target> #tags
---

# GTD Route

Put a known item directly into a known project. No inbox, no triage.

## Instructions

1. Parse `$ARGUMENTS`: `<item> → <target> #tags`
   - `→` (or `->`) separates item from target
   - Item: everything before `→` (may contain URLs)
   - Target: project folder shorthand after `→` (e.g., `35-read`, `38-mind-body`)
   - Tags: `#tag` tokens anywhere in arguments
2. Resolve target: Glob `/vaults/gtd-pcm/03-projects/{target}*/01-*.md`
3. If no match: report error + list close matches via Glob `03-projects/*/`
4. Read target file, find insertion section
5. Get today's date (Bash: `date +%Y-%m-%d`)
6. Insert `- [ ] <item> #tags [created:: YYYY-MM-DD]` at end of matched section (before next heading)
7. Report: "✅ Routed to {target}/{section}"

## Section Matching

Route by tag to standard project template sections:

| Tag present | Insert into section |
|-------------|-------------------|
| `#next` or `#frog` | `### ⚡ Next` |
| `#waiting` or `#waiting/Name` | `### 👥 Waiting For` |
| (any other or none) | `### 📋 Backlog` |

**No fallback.** If the expected section is missing, STOP and report:
"⚠️ {target} missing `{section}` — update project to standard template (see CLAUDE.md § Project Template), then retry."

## Implementation

**Step 1**: Parse arguments. Split on `→` or `->`. Extract item text, target shorthand, and all `#tag` tokens.

**Step 2**: Glob `/vaults/gtd-pcm/03-projects/{target}*/01-*.md`
- If multiple matches: use exact prefix match (e.g., `35` matches `35-read/`)
- If zero matches: Glob `03-projects/*/` and report closest options

**Step 3**: Read the matched `01-*.md` file

**Step 4**: Find insertion point using Section Matching table. Insert at END of section (last line before next `##` or `###` heading).

**Step 5**: Use Edit tool — find the last item in the target section (or the section header if empty) and append the new task line after it.

## Examples

```
/gtd:route Read Citi report https://example.com/r.pdf → 35-read #read-deep
→ 35-read/📋 Backlog (no #next or #waiting → default)
→ - [ ] Read Citi report https://example.com/r.pdf #read-deep [created:: 2026-02-27]

/gtd:route Call bank about wire transfer → 03-finances #next #phone
→ 03-finances/⚡ Next
→ - [ ] Call bank about wire transfer #next #phone [created:: 2026-02-27]

/gtd:route Check if Marie sent contract → 01-homo-promptus #waiting/Marie
→ 01-homo-promptus/👥 Waiting For
→ - [ ] Check if Marie sent contract #waiting/Marie [created:: 2026-02-27]
```

## Constraints

- Tasks ONLY in `01-{name}.md` files
- `[field:: value]` date format — never emoji shorthand
- ONLY allowed GTD tags (see CLAUDE.md)
- Preserve existing file structure
- No trailing whitespace

## Error Handling

**No target match**: "❌ No project matching '{target}'. Did you mean: {suggestions}?"
**Section not found**: STOP. Report missing section + link to template. Do NOT insert elsewhere.
**Edit conflict**: Report and ask user to retry
