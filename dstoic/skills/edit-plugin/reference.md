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

**Plugin table row** (version + counts):
```
| [dstoic](dstoic/) | Core cognitive toolkit: N skills, N commands, N hooks | ✅ vX.Y.Z |
```

**"By the Numbers" section** (total skill count):
```
- **N skills** across 5 cognitive modes + utilities
```

### 4. `dstoic/README.md`

Version section pattern:
```markdown
## 📦 Version

`X.Y.Z` · N skills · N commands · N hooks
```

Replace the backtick-wrapped version string. Update skill/command/hook counts if changed.

### 5. `dstoic/README-full.md`

Version section pattern:
```markdown
## 📦 Version

`X.Y.Z`
```

Replace the backtick-wrapped version string. Also update section heading counts (e.g., `(6 skills)`, `(3 skills + 1 agent)`).

### 6. `PRACTICE.md`

Domain classification table (update counts when skills added/removed):
```
| 🌍 **Domain-agnostic** | Any professional, any field | N skills | ... |
| 💻 **Tech (stack-agnostic)** | Any software project | N skills | ... |
| 🔧 **Tech (stack-specific)** | Tied to specific tooling | N skills | ... |
```

### 7. `PRACTICE-llm.md`

Domain classification YAML (update `count:` fields when skills added/removed):
```yaml
domain_classification:
  agnostic:
    count: N
  tech_agnostic:
    count: N
  tech_specific:
    count: N
  personal:
    count: N
```

## README-full.md Skill/Command Sections

README-full.md is organized by **cognitive modes**, not skill types.

### Adding a New Skill

1. Identify the correct cognitive mode section:
   - `## 🧭 Frame — Sense-Making` — frame-problem, pick-model, edit-tool
   - `## 🧠 Think — Ideation & Analysis` — brainstorm, investigate
   - `## ⚙️ Build — Structured Development` — openspec-* skills
   - `## 🔧 Debug — Troubleshooting` — troubleshoot
   - `## 🪞 Learn — Retrospectives & Session Memory` — retrospect-*, context commands
   - `## 🔨 Create — Tool Orchestration` — edit-*, search-skill
   - `## 🔧 Utilities` — everything else

2. Add table row in the appropriate section:
   ```
   | `skill-name` | 📎 Brief description |
   ```

3. Update skill count in the section heading if present (e.g., `(N skills)`)

### Adding a New Command

1. Identify the correct cognitive mode section:
   - `## 🪞 Learn` — retrospect commands, context management commands
   - `## 📥 Conversions & Imports` — convert-*, import-*
   - `## 🔧 Utilities` — everything else

2. Add table row:
   ```
   | `/command-name` | 📎 Brief description | model |
   ```

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
