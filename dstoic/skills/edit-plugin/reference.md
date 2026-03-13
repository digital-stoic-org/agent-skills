# Edit Plugin — Reference

## Plugin Resolution

Known plugins (dirs with `.claude-plugin/plugin.json`):
- `dstoic` — Core cognitive toolkit
- `biz` — Business analysis skills
- `gtd` — GTD workflow skills
- `coach` — Coaching skills

Discovery command:
```bash
find . -maxdepth 2 -path '*/.claude-plugin/plugin.json' | sed 's|./\(.*\)/.claude-plugin/plugin.json|\1|'
```

## Version Patterns

### Required: `plugin.json`

Every plugin has `{plugin}/.claude-plugin/plugin.json`:
```json
{ "version": "X.Y.Z" }
```
Replace: `"version": "OLD"` → `"version": "NEW"`

### Optional: `marketplace.json`

Repo-level `.claude-plugin/marketplace.json` (multi-plugin repos only):
```json
{
  "metadata": {
    "version": "X.Y.Z"           // ← only if this plugin is primary
  },
  "plugins": [
    { "name": "PLUGIN", "version": "X.Y.Z" }  // ← match by name
  ]
}
```
**Important:** Only update the matching `plugins[name=PLUGIN].version` entry. Update `metadata.version` only if this plugin is the primary (currently dstoic).

### Discovered: grep for old version string

Common matches:
- **README badge**: `✅ vX.Y.Z` in plugin table row
- **Backtick version**: `` `X.Y.Z` `` under `## 📦 Version`
- **Inline version**: `vX.Y.Z` in prose

Filter grep results: include `${PLUGIN_DIR}/` files + repo-root files referencing this plugin. Exclude `.git/`, `SKILL.md`, `reference.md`.

## Count Patterns

Grep-discovered — only update if skills/commands were added/removed:

- `N skills` (e.g., `**6 skills**`, `(6 skills)`, `6 skills ·`)
- `N commands` (e.g., `3 commands`)
- `N hooks` (e.g., `2 hooks`)
- Count fields in YAML: `count: N`
- Description strings: `N skills, N commands, N hooks`

Files commonly containing counts (dstoic-specific, discovered via grep):
- `README.md` — plugin table, "By the Numbers"
- `{plugin}/README.md` — version line with counts
- `PRACTICE.md` / `PRACTICE-llm.md` — domain classification counts

## Change Detection Logic

### Skills directory scan
```
${PLUGIN_DIR}/skills/*/SKILL.md
```
Each directory = one skill. Skill name = directory name.

### Commands directory scan
```
${PLUGIN_DIR}/commands/*.md
```
Each .md file = one command. Command name = filename without .md extension.

### Detecting changes since last release
```bash
git diff --name-status $(git describe --tags --abbrev=0 2>/dev/null || echo HEAD~10) HEAD -- ${PLUGIN_DIR}/skills/ ${PLUGIN_DIR}/commands/
```

Status codes: `A` = added, `M` = modified, `D` = deleted, `R` = renamed

## Version Bump Rules

| Change Type | Bump | Example |
|-------------|------|---------|
| New skill added | minor | 0.1.63 → 0.2.0 |
| New command added | minor | 0.1.63 → 0.2.0 |
| Skill/command removed | minor | 0.1.63 → 0.2.0 |
| Skill/command modified | patch | 0.1.63 → 0.1.64 |
| Doc/hook changes only | patch | 0.1.63 → 0.1.64 |
| User override | as specified | — |

## Plugin Cache Sync Reminder

After updating source repo, remind user:
> ⚠️ Plugin cache (`~/.claude/plugins/cache/...`) is a copy, not symlink.
> Restart Claude Code to pick up changes, or manually copy updated files.
