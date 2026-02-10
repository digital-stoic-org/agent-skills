# Edit Plugin — Reference

## File Format Patterns

### 1. `dstoic/.claude-plugin/plugin.json`

```json
{
  "version": "X.Y.Z"
}
```

Replace: `"version": "OLD"` → `"version": "NEW"`

### 2. `.claude-plugin/marketplace.json`

Two locations to update:

```json
{
  "metadata": {
    "version": "X.Y.Z"    // ← location 1
  },
  "plugins": [
    {
      "name": "dstoic",
      "version": "X.Y.Z"  // ← location 2
    }
  ]
}
```

**Important:** Do NOT update `gtd` plugin version — it's independent.

### 3. `README.md`

Plugin table row pattern:
```
| [dstoic](dstoic/) | Core toolkit: OpenSpec, context, retrospectives, investigation | ✅ vX.Y.Z |
```

Replace version in the `✅ vX.Y.Z` cell.

### 4. `dstoic/README.md`

Version section pattern:
```markdown
## 📦 Version

`X.Y.Z`
```

Replace the backtick-wrapped version string.

### 5. `dstoic/README-full.md`

Version section pattern:
```markdown
## 📦 Version

`X.Y.Z`
```

Replace the backtick-wrapped version string.

## README-full.md Skill/Command Sections

### Adding a New Skill

1. Identify the correct category section:
   - `### 📋 OpenSpec Workflow` — openspec-* skills
   - `### 🔧 Tool Orchestration` — edit-*, search-skill
   - `### 🔧 Troubleshoot` — troubleshoot
   - `### 🔬 Investigate` — investigate
   - `### 🔨 Utilities` — everything else

2. Add table row in the appropriate section:
   ```
   | `skill-name` | 📎 Brief description |
   ```

3. Update skill count in `## 🛠️ Skills (N)` heading

### Adding a New Command

1. Identify the correct category section:
   - `### 💾 Context Management` — context/session commands
   - `### 🔍 Session Analysis` — retrospect commands
   - `### 🔨 Utilities` — everything else

2. Add table row:
   ```
   | `/command-name` | 📎 Brief description | model |
   ```

3. Update command count in `## ⌨️ Commands (N)` heading

## Change Detection Logic

### Skills directory scan
```
dstoic/skills/*/SKILL.md
```
Each directory = one skill. Skill name = directory name.

### Commands directory scan
```
dstoic/commands/*.md
```
Each .md file = one command. Command name = filename without .md extension.

### Detecting changes since last release

Compare current state vs last git tag:
```bash
git diff --name-status $(git describe --tags --abbrev=0 2>/dev/null || echo HEAD~10) HEAD -- dstoic/skills/ dstoic/commands/
```

Status codes:
- `A` = added (new skill/command)
- `M` = modified (updated)
- `D` = deleted (removed)
- `R` = renamed

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
