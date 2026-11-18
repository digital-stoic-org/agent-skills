---
name: sync-ref-wip
description: 'Bidirectional ref/wip sync. Auto-detects direction from timestamps and content maturity. Triggers: "sync ref", "align ref wip", "promote to ref", "update wip", /sync-ref-wip.'
allowed-tools: [Read, Edit, Bash, Glob, Grep, AskUserQuestion]
model: sonnet
context: main
user-invocable: true
argument-hint: "[ref-file wip-file | auto]"
---

# Sync ref ↔ wip

Bidirectional alignment between ref (stable reference) and wip (working documents).

**Folder aliases**: ref folder may be named `ref/` or `reference/`. Wip folder may be named `wip/` or `work-in-progress/`. Detect from the paths provided — both are equivalent.

## ⚠️ AskUserQuestion Guard

After EVERY `AskUserQuestion` call, check if answers are empty/blank. If empty: output "⚠️ Questions didn't display (known bug).", present options as numbered text list, WAIT for user reply.

## Phase 0: Resolve Files

**If called by user** (`$ARGUMENTS` is empty or `auto`):
1. Glob for ref folder (`ref/` or `reference/`) and wip folder (`wip/` or `work-in-progress/`) in current directory
2. If neither found → abort: "⚠️ No ref/ or wip/ folder found. Use /switch to navigate to a project first."
3. List files in both folders with last-modified dates
4. Present menu:
   ```
   🔄 Sync ref ↔ wip

   🔒 ref/ files:
     1. persona-claire-v2.md (Mar 16)
     2. positioning-frameworks-v2.md (Mar 16)

   ✏️ wip/ files:
     3. brand-instance.md (Mar 16)
     4. content-marketing.md (Feb 27)

   Pick ref + wip file to sync (e.g. "1 3"), or "all" to scan everything:
   ```
5. If user picks specific pair → set `ref_file` and `wip_file`
6. If user picks "all" → scan all wip files for ref references, report drift for each pair found, ask which to fix

**If called with arguments** (two paths or by `/save-work`):
- Parse `ref_file` and `wip_file` from arguments
- `drift_description` from context or "auto-detect"

## Phase 1: Detect Direction

Read both files in parallel. Also check timestamps:

```bash
stat -c '%Y %y' {ref_file} {wip_file}
```

**Direction heuristics** (check in order, first match wins):

| Signal | Direction | Reasoning |
|---|---|---|
| ref is newer than wip + wip references old ref terms | **ref → wip** | ref was updated, wip hasn't caught up |
| wip is significantly newer + wip contains structured content absent from ref (versioned headers, decision tables, validated sections marked with dates) | **wip → ref** | wip has matured, ref is outdated |
| drift_description says "stale link" or "dead link" or "old terminology" | **ref → wip** | classic drift — wip points to outdated ref |
| drift_description says "promote" or "mature" or "validated" | **wip → ref** | explicit promotion request |
| wip has `[Proposition]` markers removed + content reviewed (dates, signatures, version bumps in wip) | **wip → ref** | wip graduated past draft stage |
| Cannot determine | **ref → wip** | safe default — ref is source of truth |

Report detected direction before proposing changes.

## Phase 2: Propose Changes

### ref → wip (fix drift — most common)

1. Identify all locations in wip that contradict or reference stale content from ref
2. Propose minimal edits to **wip only** — fix links, terminology, outdated values
3. Never add content — only update/fix existing content

### wip → ref (promote — requires extra caution)

1. Identify wip sections that are more complete/current than their ref equivalent
2. Propose minimal edits to **ref only** — update outdated sections, add missing validated content
3. **Flag each change with confidence**: HIGH (wip has dated validation, version bump) / MEDIUM (wip is richer but no explicit validation) / LOW (unclear if wip content is final)
4. LOW confidence changes → report but do NOT propose edit, suggest user validates first

## Phase 3: Show Diff

Output each proposed change as: `line N: "old text" → "new text"` with brief reason.

Do NOT apply edits yet. Show the diff to the user and ask:

```
Apply these changes? (yes / no / pick numbers to apply selectively)
```

If user says **yes** → apply all proposed edits via Edit tool, report what was changed.
If user picks numbers → apply only selected edits.
If user says **no** → stop, no changes.

## Constraints

- **ONE direction per invocation** — never edit both files in the same run
- **ref → wip**: never touch ref. **wip → ref**: never touch wip.
- **Minimal changes** — fix the drift, nothing else. Don't rewrite paragraphs, don't improve style, don't restructure
- **Preserve voice** — files have a specific tone. Match it.
- **French content** — these are French-language business documents. Keep all content in French.
- If the drift cannot be resolved (e.g., not enough info), say so instead of guessing
- **wip → ref is HIGH STAKES** — when promoting to ref, be conservative. When in doubt, don't promote.

## Output Format

```
## Sync Report: {target filename} ← {source filename}

Direction: {ref → wip | wip → ref}
Detected because: {which heuristic matched}
Drift: {drift_description}

### Proposed Changes

1. Line {N}: `{old}` → `{new}`
   Reason: {why}
   Confidence: {HIGH/MEDIUM — wip→ref only}

2. Line {N}: `{old}` → `{new}`
   Reason: {why}

### Flagged (needs user validation)

- {description of LOW confidence change, if any}

### Summary

{X} changes proposed ({Y} to apply, {Z} flagged). Direction: {source} → {target}.
```
