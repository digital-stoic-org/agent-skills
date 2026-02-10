---
name: edit-plugin
description: "Automates agent-skills plugin version bumps and release metadata. Use when: adding/removing/updating skills or commands, bumping plugin version, preparing a release. Triggers: bump version, edit plugin, update plugin, release, version bump, new skill added, new command added."
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion
argument-hint: "[bump-type: patch|minor] [changelog description]"
model: sonnet
---

# Edit Plugin

Detect → Version → Update → Review

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

## 3. Update All 5 Files

**Atomic — never partially update.**

| # | File | Field |
|---|------|-------|
| 1 | `dstoic/.claude-plugin/plugin.json` | `version` |
| 2 | `.claude-plugin/marketplace.json` | `metadata.version` + `plugins[name=dstoic].version` |
| 3 | `README.md` | `✅ vX.Y.Z` in plugin table |
| 4 | `dstoic/README.md` | backtick version under `## 📦 Version` |
| 5 | `dstoic/README-full.md` | backtick version under `## 📦 Version` |

Use Edit tool: old version string → new version string. See `reference.md` for exact patterns.

## 4. Update Counts (if added/removed)

Update `README-full.md` headings: `## 🛠️ Skills (N)`, `## ⌨️ Commands (N)`. Add/remove table entries in appropriate sections. See `reference.md` for section categories.

## 5. Review

Show summary: version change, changes list, files updated. **WAIT for user confirmation before git ops.**

## Notes

- Only bumps `dstoic` plugin (gtd = independent versioning)
- Plugin root: detect from cwd or `$ARGUMENTS`, default `/home/mat/dev/agent-skills/`
- See `reference.md` for file format patterns and cache sync reminder
