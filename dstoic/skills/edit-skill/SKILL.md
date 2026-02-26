---
name: edit-skill
description: Creates and modifies Claude Code skills following Anthropic best practices. Use when user requests creating, updating, modifying, improving, or editing skills. Triggers include "create/make/new skill", "skill for X", file paths ending in /skills/*/SKILL.md, "update/modify/improve skill Y". Handles skill structure, YAML frontmatter, progressive disclosure (SKILL.md + reference.md + scripts/), token optimization (<500 ideal), validation checklist, Anthropic patterns. Delegates to edit-tool orchestrator if uncertain about tool type. For plugins use edit-plugin instead.
---

# Instructions for Creating and Modifying Skills

## Determine Action Type

**CREATE**: New skill requested
**MODIFY**: Update existing skill (keywords: "update", "modify", "improve", "add to", "fix")

## Modifying Existing Skills

1. Locate skill in plugin `skills/` directory (e.g., `dstoic/skills/{name}/`) or `.claude/skills/` and read SKILL.md
2. Analyze: frontmatter, instructions
3. **Enumerate functional outputs**: List every distinct output, behavior, and user-facing capability the skill produces. These are the **preservation contract** — all must be retained unless user explicitly approves removal.
4. Determine type: Add Feature, Fix/Improve, Refactor, or Restrict/Expand Scope
5. Make surgical edits using Edit tool
6. **Regression check**: Verify each functional output from step 3 is still present and working. If any are missing, restore before proceeding.
7. Update description if adding triggers
8. Validate: YAML valid, triggers clear, instructions actionable

See `reference.md` for modification best practices and common patterns.

## Creating New Skills

💡 **Before creating:** consider running `/search-skill` to discover existing solutions — inspect, adapt, own.

1. Ask for details if missing: purpose, triggers, tools needed, model selection
2. **Location**: Use `.claude/skills/` for project skills or plugin `skills/` directory
3. Create directory: `mkdir -p .claude/skills/skill-name`
4. Generate SKILL.md with frontmatter and instructions
5. **Order sections by usage frequency** — most common workflow first, validation/reference last. See `reference.md` § Instruction Ordering.

**Frontmatter fields:**
- `name` - Skill identifier (lowercase-hyphens)
- `description` - Triggers and use cases (max 1024 chars)
- `allowed-tools` - Tool restrictions (optional)
- `model` - See Model Selection section below
- `context` - Context execution mode (optional, defaults to main):
  - `main` (default) - Runs in main conversation (fast, shares context)
  - `fork` - Runs in isolated sub-agent context (prevents pollution, parallel-safe)

5. Add supporting files if needed:
   - `scripts/` - Executable code (0 tokens when run)
   - `references/` - Docs for Claude to load (on-demand)
   - `assets/` - Output files (templates, images)

See `reference.md` for SKILL.md template, model selection matrix, and naming rules.

## Model Selection

**Use short names** (future-proof): `opus` | `sonnet` | `haiku` (never version-specific IDs)

**When selecting model for a skill:**
1. Use `pick-model` skill: Pass skill's purpose/capability as argument
2. `pick-model` provides recommendation with reasoning (decision matrix, complexity escalators)
3. Default: `sonnet` if skipping analysis

**Quick reference** (see pick-model for full decision matrix):
- `opus` — Strategic analysis, multi-framework reasoning, architectural decisions
- `sonnet` — Standard workflows with reasoning (DEFAULT for most skills)
- `haiku` — Simple deterministic tasks, format conversion, speed-sensitive ops

## Key Principles

- **Preserve function**: MODIFY must not remove functional outputs unless explicitly requested. Token optimization must NEVER reduce capabilities.
- **Concise**: <500 tokens ideal, avoid >1000 tokens
- **Specific**: Clear triggers in description, not generic
- **Focused**: One capability per skill
- **Token-efficient**: Tables, bullets, code blocks over prose — but never at the cost of functional completeness
- **Context-aware**: Main context (default) for quick tasks. Fork context for research/exploration that shouldn't pollute main conversation.

## MANDATORY Validation (CREATE only)

**STOP**: Before proceeding, you MUST explicitly answer these questions:

### Complexity Evaluation Checklist

Answer each question with YES or NO:

**Q1: Is the pollution cost acceptable? (token_count × load_frequency)**
- Answer: [YOU MUST STATE YES OR NO]
- <500 tokens × any frequency = acceptable
- 500-1000 tokens = use progressive disclosure (reference.md)
- >1000 tokens = needs `context: fork` or sub-agent

**Q2: Can SKILL.md be kept under 500 tokens (with reference.md for overflow)?**
- Answer: [YOU MUST STATE YES OR NO]

**Q3: Is this a specific capability rather than a workflow?**
- Answer: [YOU MUST STATE YES OR NO]

### Decision Tree

**If ANY answer is NO:**
→ STOP. Do NOT create a skill.
→ Explain why it's not appropriate.
→ Recommend one of these alternatives:
  - **Direct request** - For simple one-off tasks (just ask Claude)
  - **Skill with `context: fork`** - For verbose/research workflows needing isolation
  - **Sub-Agent** - For complex multi-step exploration/research tasks
→ EXIT this skill immediately.

**If ALL answers are YES:**
→ Proceed to "Creating New Skills" section above.

---

## Uncertain About Tool Type?

If unsure whether this should be a skill vs command vs agent vs script, see the `edit-tool` orchestrator for comprehensive decision matrix.

**Quick checks:**
- Token budget >500? → Use progressive disclosure (SKILL.md + reference.md)
- Needs isolation? → Skill with `context: fork` or sub-agent
- Deterministic shell-only? → Bash script
- Complex exploration? → Sub-agent

## Best Practices Reference

For latest Anthropic skill authoring guidelines, use WebSearch:
```
WebSearch: "skill authoring best practices site:platform.claude.com"
```

See `reference.md` for detailed decision frameworks and patterns.

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
