---
name: edit-agent
description: Creates and modifies Claude Code sub-agents following best practices. Use when user requests creating, updating, modifying, improving, or editing sub-agents. Triggers include "create/make/new agent", "sub-agent for X", file paths with /agents/, "update/modify/improve agent Y". Handles agent structure, YAML frontmatter (name, description, tools, model), system prompt design, tool restrictions (minimal permissions), isolated context benefits. Delegates to edit-tool orchestrator if uncertain about tool type (agent vs skill vs command vs script).
---

# Instructions for Creating and Modifying Sub-agents

## Determine Action Type

**MODIFY**: Update existing sub-agent (keywords: "update", "modify", "improve", "add to", "fix")
**CREATE**: New sub-agent requested

## Key Principles

- **Single responsibility**: One focused purpose per agent
- **Specific triggers**: Clear description of when to use
- **Minimal permissions**: Only grant needed tools
- **Model selection**: Choose based on reasoning complexity and strategic value (see Model Selection below)
- **Detailed prompts**: Include examples, constraints, formats
- **Isolated context**: Agents run independently with own context

## Modifying Existing Sub-agents

1. Locate and read existing agent file
2. Analyze: frontmatter (name, description, tools, model), system prompt
3. Make surgical edits using Edit tool
4. Update description if changing triggers/purpose
5. Validate: YAML valid, tools list correct, prompt clear

See `reference.md` for modification patterns.

## Creating New Sub-agents

1. Ask for details if missing: purpose, use cases, tools needed
2. Determine location:
   - `.claude/agents/` - Project agents (team, highest priority)
   - `~/.claude/agents/` - Personal agents (all projects)
3. Generate filename: `[agent-name].md` (lowercase-hyphens only)
4. Create file with frontmatter and system prompt

See `reference.md` for templates and tool configurations.

## File Structure

```markdown
---
name: agent-identifier
description: When to use this agent (triggers)
tools: Read, Edit, Bash
model: sonnet  # See Model Selection section below
---

System prompt defining agent's role, behavior, and instructions.

Be specific: include examples, constraints, output formats.
```

## Model Selection

**Use short names** (future-proof): `opus` | `sonnet` | `haiku` (never version-specific IDs)

**When selecting model for an agent:**
1. Use `pick-model` skill: Pass agent's purpose/scope as argument
2. `pick-model` provides recommendation with reasoning (decision matrix, complexity escalators)
3. Default: `sonnet` if skipping analysis

**Quick reference** (see pick-model for full decision matrix):
- `opus` — Complex orchestration, architectural exploration, high-stakes decisions
- `sonnet` — Standard autonomous workflows, multi-step reasoning (DEFAULT)
- `haiku` — Simple deterministic agents, speed-sensitive ops

## MANDATORY Validation (CREATE only)

**STOP**: Before proceeding, answer these questions with YES or NO:

| Question | Answer |
|----------|--------|
| Q1: Requires AI reasoning across multiple steps? | [YES/NO] |
| Q2: Needs decisions based on intermediate results? | [YES/NO] |
| Q3: Benefits from isolated context/specialized tools? | [YES/NO] |

**Decision:**
- **ALL NO** → STOP. Do NOT create sub-agent. Recommend: slash command (text expansion), bash script (shell ops), or direct request. EXIT immediately.
- **ANY YES** → Proceed to "Creating New Sub-agents" section above.

---

## Uncertain About Tool Type?

If unsure whether this should be an agent vs skill vs command vs script, see the `edit-tool` orchestrator for comprehensive decision matrix.

**Quick checks:**
- Token budget >2000 OR needs isolation? → ✅ Probably agent
- Token budget <500 + auto-invoke? → Probably skill
- User-triggered workflow? → Probably command
- Deterministic shell-only? → Probably bash script

See `reference.md` and `edit-tool/reference.md` for detailed decision frameworks.

## Validation Checklist

- [ ] Filename follows lowercase-hyphens-only rule
- [ ] YAML frontmatter has `---` markers
- [ ] Name matches filename (without .md)
- [ ] Description includes triggers/when to use
- [ ] Tools list includes only necessary tools (or omit for all)
- [ ] Model specified if non-default needed
- [ ] System prompt is detailed and actionable

See `reference.md` for detailed examples, tool lists, and best practices.
