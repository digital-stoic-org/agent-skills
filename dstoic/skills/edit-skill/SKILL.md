---
name: edit-skill
description: Creates and modifies Claude Code skills following Anthropic best practices. Use when user requests creating, updating, modifying, improving, or editing skills. Triggers include "create/make/new skill", "skill for X", file paths ending in /skills/*/SKILL.md, "update/modify/improve skill Y". Handles skill structure, YAML frontmatter, progressive disclosure (SKILL.md + reference.md + scripts/), token optimization (<500 ideal), validation checklist, Anthropic patterns. Delegates to edit-tool orchestrator if uncertain about tool type. For plugins use edit-plugin instead.
---

# Instructions for Creating and Modifying Skills

## MANDATORY Validation (CREATE only)

**STOP**: Before proceeding, you MUST explicitly answer these questions:

### Complexity Evaluation Checklist

Answer each question with YES or NO:

**Q1: Will this be auto-invoked frequently enough to justify context pollution?**
- Answer: [YOU MUST STATE YES OR NO]

**Q2: Can this be kept under 500 tokens (concise capability)?**
- Answer: [YOU MUST STATE YES OR NO]

**Q3: Is this a specific capability rather than a workflow?**
- Answer: [YOU MUST STATE YES OR NO]

### Decision Tree

**If ANY answer is NO:**
→ STOP. Do NOT create a skill.
→ Explain why it's not appropriate.
→ Recommend one of these alternatives:
  - **Direct request** - For simple one-off tasks (just ask Claude)
  - **Slash command** - For user-initiated workflows or verbose instructions
  - **Sub-Agent** - For complex multi-step exploration/research tasks
→ EXIT this skill immediately.

**If ALL answers are YES:**
→ Proceed to "Creating New Skills" section below.

---

## Uncertain About Tool Type?

If unsure whether this should be a skill vs command vs agent vs script, see the `edit-tool` orchestrator for comprehensive decision matrix.

**Quick checks:**
- Token budget >500? → Probably not a skill
- Used <5 times per session? → Probably command
- Deterministic shell-only? → Probably bash script
- Complex exploration? → Probably sub-agent

## Best Practices Reference

For latest Anthropic skill authoring guidelines, use WebSearch:
```
WebSearch: "skill authoring best practices site:platform.claude.com"
```

See `reference.md` for detailed decision frameworks and patterns.

## Determine Action Type

**CREATE**: New skill requested
**MODIFY**: Update existing skill (keywords: "update", "modify", "improve", "add to", "fix")

## Creating New Skills

💡 **Before creating:** consider running `/search-skill` to discover existing solutions — inspect, adapt, own.

1. Ask for details if missing: purpose, triggers, tools needed, model selection
2. **Location**: Use `.claude/skills/` for project skills or plugin `skills/` directory
3. Create directory: `mkdir -p .claude/skills/skill-name`
4. Generate SKILL.md with frontmatter and instructions

**Frontmatter fields:**
- `name` - Skill identifier (lowercase-hyphens)
- `description` - Triggers and use cases (max 1024 chars)
- `allowed-tools` - Tool restrictions (optional)
- `model` - Model selection (optional, defaults to sonnet):
  - `haiku` - Simple deterministic tasks (token counting, format conversion)
  - `sonnet` - Default for most skills requiring reasoning
  - `opus` - Complex multi-file refactoring, architectural decisions
- `context` - Context execution mode (optional, defaults to main):
  - `main` (default) - Runs in main conversation (fast, shares context)
  - `fork` - Runs in isolated sub-agent context (prevents pollution, parallel-safe)

5. Add supporting files if needed:
   - `scripts/` - Executable code (0 tokens when run)
   - `references/` - Docs for Claude to load (on-demand)
   - `assets/` - Output files (templates, images)

See `reference.md` for SKILL.md template, model selection matrix, and naming rules.

## Modifying Existing Skills

1. Locate in `reference/claude-plugins/common/skills/` and read SKILL.md
2. Analyze: frontmatter, instructions
3. Determine type: Add Feature, Fix/Improve, Refactor, or Restrict/Expand Scope
4. Make surgical edits using Edit tool
5. Update description if adding triggers
6. Validate: YAML valid, triggers clear, instructions actionable

See `reference.md` for modification best practices and common patterns.

## Key Principles

- **Concise**: <500 tokens ideal, avoid >1000 tokens
- **Specific**: Clear triggers in description, not generic
- **Focused**: One capability per skill
- **Token-efficient**: Tables, bullets, code blocks over prose
- **Context-aware**: Main context (default) for quick tasks. Fork context for research/exploration that shouldn't pollute main conversation.

## What NOT to Include

❌ README.md, CHANGELOG.md, INSTALLATION.md - human documentation
✅ Only AI-needed instructions in SKILL.md

## Validation Checklist

- [ ] YAML frontmatter has `---` markers
- [ ] Description includes "when to use" triggers
- [ ] Name follows lowercase-hyphens-only rule
- [ ] File size reasonable (<500 tokens preferred)
- [ ] Instructions are actionable and clear

See `reference.md` for detailed examples, templates, common mistakes, and best practices.