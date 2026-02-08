---
name: edit-command
description: Creates and modifies Claude Code slash commands following best practices. Use when user requests creating, updating, modifying, improving, or editing slash commands. Triggers include "create/make/new command", "slash command", "/command-name", file paths with /commands/, "update/modify/improve command X". Handles command structure, YAML frontmatter (description, allowed-tools, argument-hint, model), argument patterns ($ARGUMENTS, $1 $2, @filepath), tool restrictions, discoverability. Delegates to edit-tool orchestrator if uncertain about tool type (command vs skill vs agent vs script).
---

# Instructions for Creating and Modifying Slash Commands

## Determine Action Type

**MODIFY**: Update existing command (keywords: "update", "modify", "improve", "add to", "fix")
**CREATE**: New slash command requested

## Key Principles

- **User-initiated**: Commands don't pollute auto-context (vs skills), can be verbose
- **Discoverable**: Add description to frontmatter so Claude can find it
- **Tool restrictions**: Specify allowed-tools to control capabilities
- **Model selection**: Choose based on reasoning complexity and strategic value (see Model Selection below)

## Modifying Existing Slash Commands

1. Locate and read existing command file
2. Analyze: frontmatter (if present), instructions, arguments used
3. Make surgical edits using Edit tool
4. Update frontmatter if changing tools, model, or arguments
5. Validate: YAML valid, instructions clear, arguments work

## Creating New Slash Commands

1. Ask for details if missing: purpose, arguments needed, tools required
2. Determine location:
   - `.claude/commands/` - Project commands (shared with team)
   - `~/.claude/commands/` - Personal commands (all projects)
3. Generate filename: `[command-name].md` (lowercase-hyphens only)
4. Create file with YAML frontmatter (optional) and instructions

**Frontmatter fields:**

| Field | Purpose |
|-------|---------|
| `description` | Brief description (for discoverability) |
| `allowed-tools` | Tool restrictions (Bash, Read, Edit, etc.) |
| `argument-hint` | Expected parameters display |
| `model` | opus/sonnet/haiku (see Model Selection section) |

**Argument patterns:** `$ARGUMENTS` (all), `$1 $2 $3` (positional), `@filepath` (include file)

## Model Selection

**Use short names** (future-proof): `opus` | `sonnet` | `haiku` (never version-specific IDs)

**When selecting model for a command:**
1. Use `pick-model` skill: Pass command's purpose/workflow as argument
2. `pick-model` provides recommendation with reasoning (decision matrix, complexity escalators)
3. Default: `sonnet` if skipping analysis

**Quick reference** (see pick-model for full decision matrix):
- `opus` — Strategic analysis, multi-framework reasoning, high-stakes decisions
- `sonnet` — Standard workflows with reasoning (DEFAULT)
- `haiku` — Simple conversions, minimal reasoning

## MANDATORY Validation (CREATE only)

**STOP**: Before proceeding, answer YES/NO:

| Question | Answer |
|----------|--------|
| Q1: User-triggered (not auto-invoked)? | [YES/NO] |
| Q2: Multi-step workflow? | [YES/NO] |
| Q3: Repeatedly used? | [YES/NO] |

**If ALL NO** → STOP. Use direct request or bash alias instead.
**If ANY YES + needs AI reasoning** → Proceed to creation above.
**Otherwise** → Delegate to edit-tool (may suggest Sub-Agent or Skill).

---

## Uncertain About Tool Type?

If unsure whether this should be a command vs skill vs agent vs script, see the `edit-tool` orchestrator for comprehensive decision matrix.

**Quick checks:**
- Token budget <500 + auto-invoke? → Probably skill
- Complex autonomous exploration? → Probably sub-agent
- Deterministic shell-only? → Probably bash script
- User-triggered workflow? → ✅ Probably command

**For validation checklist, templates, patterns, and edge cases, see `reference.md`.**
