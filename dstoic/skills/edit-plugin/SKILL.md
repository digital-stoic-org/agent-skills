---
name: edit-plugin
description: "Automates agent-skills plugin version bumps and release metadata. Use when: adding/removing/updating skills or commands, bumping plugin version, preparing a release. Triggers: bump version, edit plugin, update plugin, release, version bump, new skill added, new command added."
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion
argument-hint: "[plugin-name] [bump-type: patch|minor] [changelog]"
model: sonnet
context: main
---

# Edit Plugin

Resolve → Detect → Version → Update → Review

## ⚠️ AskUserQuestion Guard

**CRITICAL**: After EVERY `AskUserQuestion` call, check if answers are empty/blank. Known Claude Code bug: outside Plan Mode, AskUserQuestion silently returns empty answers without showing UI.

**If answers are empty**: DO NOT proceed with assumptions. Instead:
1. Output: "⚠️ Questions didn't display (known Claude Code bug outside Plan Mode)."
2. Present the options as a **numbered text list** and ask user to reply with their choice number.
3. WAIT for user reply before continuing.

## 0. Resolve Plugin

Determine `PLUGIN_DIR` (relative to repo root, e.g. `dstoic`, `biz`, `gtd`):

1. **From `$ARGUMENTS`**: If first arg matches a dir with `.claude-plugin/plugin.json` → use it
2. **From cwd**: Walk up from cwd, find nearest `.claude-plugin/plugin.json` → derive plugin name from parent dir
3. **Ambiguous/not found**: AskUserQuestion listing discovered plugins (dirs containing `.claude-plugin/plugin.json`)

Read current version from `${PLUGIN_DIR}/.claude-plugin/plugin.json`.

## 1. Detect Changes

```bash
${CLAUDE_PLUGIN_ROOT}/skills/edit-plugin/scripts/detect-changes.sh <repo-root> <plugin-dir>
```

If no changes detected, ask user what to include.

## 2. Version Bump

**Auto-detect from changes:**
- `minor`: new skill/command added, breaking changes
- `patch`: updates, bug fixes, doc changes

User override via `$ARGUMENTS` (e.g., `biz minor "Add ux-strategize"`).

```bash
${CLAUDE_PLUGIN_ROOT}/skills/edit-plugin/scripts/bump-version.sh <current-version> <patch|minor>
```

## 3. Update Version (all files)

**Atomic — never partially update.** Two tiers:

**Required:** `${PLUGIN_DIR}/.claude-plugin/plugin.json` — always update.

**Discovered:** Grep repo root for old version string. Filter results:
- Include: files within `${PLUGIN_DIR}/` + repo-root metadata files referencing this plugin
- Exclude: `.git/`, this skill's `SKILL.md`, this skill's `reference.md`
- **`marketplace.json`**: Only update `plugins[name=${PLUGIN_DIR}].version` entry. Update `metadata.version` only if this plugin is the primary (currently dstoic).

Present discovered file list to user before updating. Use Edit tool: old version → new version.

See `reference.md` for version patterns.

## 4. Update Counts (if skills/commands added/removed)

Skip this step if no adds/removes in detected changes.

Grep repo for count patterns (`N skills`, `N commands`, `N hooks`) in files referencing `${PLUGIN_DIR}`. Update only matching files. See `reference.md` for count patterns.

## 5. Review

Show summary: version change, changes list, files updated. **WAIT for user confirmation before git ops.**

## Notes

- Supports any plugin in the repo (dstoic, biz, gtd, coach, etc.)
- Repo root: detect from cwd or `$ARGUMENTS`, default `/home/mat/dev/agent-skills/`
- See `reference.md` for version/count patterns and cache sync reminder
