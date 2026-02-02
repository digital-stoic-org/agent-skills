# Slash Command Editor Reference

Templates and patterns for Claude Code slash commands.

**NOTE**: For comprehensive tool selection matrix (command vs skill vs agent vs script), see `edit-tool/reference.md`.

---

## Table of Contents

- [Validation Checklist](#validation-checklist)
- [Templates](#templates)
- [Frontmatter Fields](#frontmatter-fields)
- [Argument Patterns](#argument-patterns)
- [Naming & Location](#naming--location)
- [Common Patterns](#common-patterns)
- [Modification Workflow](#modification-workflow)
- [Common Mistakes](#common-mistakes)
- [Security](#security)
- [Examples](#examples)
- [Quick Reference](#quick-reference)

---

## Validation Checklist

Before finalizing a command, verify:

- [ ] Filename follows lowercase-hyphens-only rule
- [ ] YAML frontmatter has `---` markers (if used)
- [ ] Description field present (for discoverability)
- [ ] argument-hint matches actual usage (if args used)
- [ ] allowed-tools includes all needed tools
- [ ] Instructions are clear and actionable
- [ ] Arguments ($1, $2, $ARGUMENTS) work correctly

---

## Templates

**Minimal:**
```markdown
Review the code for bugs and suggest improvements.
```

**With Frontmatter:**
```markdown
---
description: What this command does
allowed-tools: Bash, Read, Edit
argument-hint: [params]
model: claude-3-5-haiku-20241022
---

Instructions here.
Use $ARGUMENTS or $1, $2 for args.
Use @filepath for files.
```

---

## Frontmatter Fields

| Field | Purpose | Example |
|-------|---------|---------|
| `description` | Discoverability (max 1024 chars) | `Analyze test coverage` |
| `allowed-tools` | Restrict tools (omit for full access) | `Bash, Read, Edit` |
| `argument-hint` | Guide users | `[file] [--flag]` |
| `model` | Override model | `claude-3-5-haiku-20241022` |

**Models:** haiku (fast/cheap), sonnet (default), opus (complex)

---

## Argument Patterns

| Pattern | Usage | Example |
|---------|-------|---------|
| `$ARGUMENTS` | All args | `/cmd foo bar` → `$ARGUMENTS` = `foo bar` |
| `$1, $2, $3` | Positional | `/cmd x y` → `Convert $1 to $2` = `Convert x to y` |
| `@$1` | File ref | `/cmd file.js` → `@$1` loads file contents |
| None | No args | Just instructions, no parameters |

---

## Naming & Location

**Naming:** lowercase-hyphens-only, max 64 chars, verb-noun pattern

| ✅ Good | ❌ Bad |
|---------|--------|
| `review-pr` | `reviewPR`, `review_pr`, `review pr` |
| `check-types` | `check`, `CheckTypes` |

**Locations:**
- `.claude/commands/` → Project (team) commands, checked into git
- `~/.claude/commands/` → Personal commands, all projects

---

## Common Patterns

**Doc Generator:**
```markdown
---
description: Generate API docs from code
argument-hint: [file]
---
Read @$1 and generate markdown: signatures, params, examples.
```

---

## Modification Workflow

| Change Type | Update |
|-------------|--------|
| Add argument | argument-hint, instructions |
| Change tools | allowed-tools field |
| Fix bug | Instructions only |
| Optimize | model field |
| Expand scope | description, instructions |

**Process:** Read existing → Identify change → Edit (not rewrite) → Validate YAML

---

## Common Mistakes

| Issue | Fix |
|-------|-----|
| Command not found | Add `description` to frontmatter |
| Arguments don't work | Check `$1, $2` vs `$ARGUMENTS` usage |
| Bash fails | Add `allowed-tools: Bash` |
| File not found | Verify `@filepath` syntax |
| Invalid YAML | Check `---` delimiters |
| Name has spaces/caps | Use `lowercase-hyphens` |

---

## Security

- Restrict tools: `allowed-tools: Read` (no write/bash)
- Avoid `!`$ARGUMENTS`` (arbitrary execution)
- Keep secrets in `~/.claude/commands/`, not git

---

## Examples

**Simple:**
```markdown
Explain the following with examples: $ARGUMENTS
```

**With Tools:**
```markdown
---
description: Review PR changes
allowed-tools: Bash
argument-hint: [pr-number]
---

## Quick Reference

**Syntax:**
- `$ARGUMENTS` / `$1, $2` - Arguments
- `@filepath` - File contents

**Locations:**
- `.claude/commands/` - Project
- `~/.claude/commands/` - Personal

**Frontmatter:**
```yaml
description: What it does
allowed-tools: Bash, Read
argument-hint: [args]
model: haiku/sonnet/opus
```
