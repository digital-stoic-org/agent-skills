---
name: edit-agent
description: Creates and modifies Claude Code sub-agents following best practices. Use when user requests creating, updating, modifying, improving, or editing sub-agents. Triggers include "create/make/new agent", "sub-agent for X", file paths with /agents/, "update/modify/improve agent Y". Handles agent structure, YAML frontmatter (name, description, tools, disallowedTools, model, permissionMode, maxTurns, skills, mcpServers, hooks, memory, background, isolation), system prompt design, tool restrictions, permission modes, persistent memory, hooks. Delegates to edit-tool orchestrator if uncertain about tool type (agent vs skill vs command vs script).
---

# Instructions for Creating and Modifying Sub-agents

## Determine Action Type

**MODIFY**: Update existing sub-agent (keywords: "update", "modify", "improve", "add to", "fix")
**CREATE**: New sub-agent requested

## Key Principles

- **Single responsibility**: One focused purpose per agent
- **Specific triggers**: Clear description with "Use proactively" if auto-delegation desired
- **Minimal permissions**: Use `tools` (allowlist) or `disallowedTools` (denylist), not both
- **Model selection**: Choose via `pick-model` skill; default is `inherit` (parent model)
- **Detailed prompts**: Include examples, constraints, output formats
- **Isolated context**: Agents get only their system prompt + environment basics, NOT the full Claude Code system prompt

## Modifying Existing Sub-agents

1. Locate and read existing agent file
2. Analyze: all frontmatter fields, system prompt
3. **Enumerate functional outputs**: List every behavior/capability. These are the **preservation contract**.
4. Make surgical edits using Edit tool
5. **Regression check**: Verify each output from step 3 is retained
6. Update description if changing triggers/purpose
7. Validate: YAML valid, tools list correct, prompt clear

See `reference.md` for modification patterns.

## Creating New Sub-agents

1. Ask for details if missing: purpose, use cases, tools needed, permission requirements
2. Determine scope/location (priority order):
   - `--agents` CLI flag — Session-only (JSON, for testing/automation)
   - `.claude/agents/` — Project agents (team, check into VCS)
   - `~/.claude/agents/` — Personal agents (all projects)
   - Plugin `agents/` directory — Distributed via plugin
3. Generate filename: `[agent-name].md` (lowercase-hyphens only)
4. Create file with frontmatter and system prompt

See `reference.md` for templates, all frontmatter fields, and tool configurations.

## File Structure

```markdown
---
name: agent-identifier
description: When to use this agent (triggers). Use proactively after X.
tools: Read, Edit, Bash
# model defaults to inherit (parent model) if omitted
---

System prompt defining agent's role, behavior, and instructions.

Be specific: include examples, constraints, output formats.
```

## Frontmatter Quick Reference

| Field | Required | Purpose |
|-------|----------|---------|
| `name` | Yes | Identifier, must match filename |
| `description` | Yes | When Claude should delegate to this agent |
| `tools` | No | Allowlist (omit = inherit all) |
| `disallowedTools` | No | Denylist, removed from inherited/specified list |
| `model` | No | `opus`/`sonnet`/`haiku`/`inherit` (default: `inherit`) |
| `permissionMode` | No | `default`/`acceptEdits`/`dontAsk`/`bypassPermissions`/`plan` |
| `maxTurns` | No | Max agentic turns before stop |
| `skills` | No | Skills to preload into agent context at startup |
| `mcpServers` | No | MCP servers available to this agent |
| `hooks` | No | Lifecycle hooks (PreToolUse, PostToolUse, Stop) |
| `memory` | No | Persistent memory: `user`/`project`/`local` |
| `background` | No | `true` = always run as background task |
| `isolation` | No | `worktree` = isolated git worktree copy |

See `reference.md` for detailed field guidance and examples.

## Model Selection

**Use short names** (future-proof): `opus` | `sonnet` | `haiku` | `inherit`

**When selecting model for an agent:**
1. Use `pick-model` skill: Pass agent's purpose/scope as argument
2. `pick-model` provides recommendation with reasoning
3. Default: `inherit` (uses parent conversation model)

**Quick reference** (see pick-model for full decision matrix):
- `opus` — Complex orchestration, architectural exploration, high-stakes decisions
- `sonnet` — Standard autonomous workflows, multi-step reasoning
- `haiku` — Simple deterministic agents, speed-sensitive ops
- `inherit` — Same as parent conversation (DEFAULT if omitted)

## MANDATORY Validation (CREATE only)

**STOP**: Before proceeding, answer these questions with YES or NO:

| Question | Answer |
|----------|--------|
| Q1: Requires AI reasoning across multiple steps? | [YES/NO] |
| Q2: Needs decisions based on intermediate results? | [YES/NO] |
| Q3: Benefits from isolated context/specialized tools? | [YES/NO] |

**Decision:**
- **ALL NO** → STOP. Do NOT create sub-agent. Recommend: skill (if <500 tokens), bash script (shell ops), or direct request. EXIT immediately.
- **ANY YES** → Proceed to "Creating New Sub-agents" section above.

---

## Uncertain About Tool Type?

If unsure whether this should be an agent vs skill vs command vs script, see the `edit-tool` orchestrator for comprehensive decision matrix.

**Quick checks:**
- Token budget >2000 OR needs isolation? → Probably agent
- Token budget <500 + auto-invoke? → Probably skill
- Deterministic shell-only? → Probably bash script
- Needs cross-session coordination? → Agent team, not sub-agent

See `reference.md` and `edit-tool/reference.md` for detailed decision frameworks.

## Validation Checklist

- [ ] Filename follows lowercase-hyphens-only rule
- [ ] YAML frontmatter has `---` markers
- [ ] Name matches filename (without .md)
- [ ] Description includes triggers/when to use
- [ ] Tools list uses allowlist OR denylist (not both)
- [ ] Model specified or intentionally left as `inherit`
- [ ] Permission mode appropriate for task risk level
- [ ] System prompt is detailed and actionable
- [ ] Memory scope set if cross-session learning needed
- [ ] Hooks defined if tool validation required

See `reference.md` for detailed examples, tool lists, and best practices.
