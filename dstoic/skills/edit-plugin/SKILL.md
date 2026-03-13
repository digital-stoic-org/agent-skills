---
name: edit-plugin
description: "Automates agent-skills plugin version bumps and release metadata. Use when: adding/removing/updating skills or commands, bumping plugin version, preparing a release. Triggers: bump version, edit plugin, update plugin, release, version bump, new skill added, new command added."
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion
argument-hint: "[bump-type: patch|minor] [changelog description]"
model: sonnet
context: main
---

# Edit Plugin

Detect → Version → Update → Review

## ⚠️ AskUserQuestion Guard

**CRITICAL**: After EVERY `AskUserQuestion` call, check if answers are empty/blank. Known Claude Code bug: outside Plan Mode, AskUserQuestion silently returns empty answers without showing UI.

**If answers are empty**: DO NOT proceed with assumptions. Instead:
1. Output: "⚠️ Questions didn't display (known Claude Code bug outside Plan Mode)."
2. Present the options as a **numbered text list** and ask user to reply with their choice number.
3. WAIT for user reply before continuing.

## 1. Detect Changes

```bash
${CLAUDE_PLUGIN_ROOT}/skills/edit-plugin/scripts/detect-changes.sh <plugin-root>
```

If no changes detected, ask user what to include.

## 2. Version Bump

**Auto-detect from changes:**
- `minor`: new skill/command added, breaking changes
- `patch`: updates, bug fixes, doc changes

User override via `$ARGUMENTS` (e.g., `minor "Add edit-plugin skill"`).

```bash
${CLAUDE_PLUGIN_ROOT}/skills/edit-plugin/scripts/bump-version.sh <current-version> <patch|minor>
```

Read current version from `dstoic/.claude-plugin/plugin.json`.

## 3. Update Version (all files)

**Atomic — never partially update.**

| # | File | Field |
|---|------|-------|
| 1 | `dstoic/.claude-plugin/plugin.json` | `version` |
| 2 | `.claude-plugin/marketplace.json` | `metadata.version` + `plugins[name=dstoic].version` |
| 3 | `README.md` | `✅ vX.Y.Z` in plugin table |
| 4 | `dstoic/README.md` | backtick version under `## 📦 Version` |
| 5 | `dstoic/README-full.md` | backtick version under `## 📦 Version` |

Use Edit tool: old version string → new version string. See `reference.md` for exact patterns.

## 4. Update Counts (if skills/commands/hooks added/removed)

**All files with skill/command/hook counts must stay in sync.**

| # | File | What to update |
|---|------|----------------|
| 1 | `README.md` | "By the Numbers" section (`**N skills**`) + plugin table description (`N skills, N commands, N hooks`) |
| 2 | `README-full.md` | Section heading counts (e.g., `(6 skills)`, `(3 skills + 1 agent)`) |
| 3 | `PRACTICE.md` | Domain classification table (agnostic/tech-agnostic/tech-specific counts) |
| 4 | `PRACTICE-llm.md` | `domain_classification` YAML `count:` fields |
| 5 | `dstoic/README.md` | `## 📦 Version` line (`N skills · N commands · N hooks`) |

Also add/remove table entries in appropriate cognitive mode sections of `README-full.md`. See `reference.md` for section categories.

## 5. Review

Show summary: version change, changes list, files updated. **WAIT for user confirmation before git ops.**

## Notes

- Only bumps `dstoic` plugin (gtd = independent versioning)
- Plugin root: detect from cwd or `$ARGUMENTS`, default `/home/mat/dev/agent-skills/`
- See `reference.md` for file format patterns and cache sync reminder
