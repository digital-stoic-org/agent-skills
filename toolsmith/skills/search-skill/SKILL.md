---
name: search-skill
description: Discover and evaluate Claude Code skills from curated sources. Use when searching for existing skills, finding skill inspiration, or before creating a new skill. Triggers include "search skill", "find skill", "skill for X", "what skills exist for", "discover skills".
allowed-tools: [WebSearch, WebFetch, Bash, Read, Glob, Grep]
model: sonnet
---

# Search Skill

Discover existing skills from curated sources, evaluate quality with toothbrush filter, output comparison table. Philosophy: **inspect, adapt, own — never import blindly** 🪥

## Workflow

1. **Parse query** from `$ARGUMENTS` (e.g., "pdf converter", "git workflow")
2. **Search tiered sources** (parallel where possible):

| Tier | Source | Method |
|------|--------|--------|
| 1 | Anthropic official repos | `WebSearch: "$QUERY claude code skill site:github.com/anthropics"` |
| 1 | VoltAgent curated | `WebSearch: "$QUERY site:github.com/VoltAgent/awesome-agent-skills"` |
| 2 | GitHub community | `WebSearch: "$QUERY claude code SKILL.md site:github.com"` |
| 2 | Awesome lists | `WebSearch: "$QUERY awesome-claude-skills OR awesome-claude-code"` |
| 3 | SkillHub rated | `WebFetch: skillhub.club search` |
| 3 | Broad web | `WebSearch: "$QUERY claude code skill 2026"` |

3. **Fetch SKILL.md** for top candidates via `WebFetch` on raw GitHub URLs
4. **Apply toothbrush filter** — see `reference.md` for rubric details:
   - Token efficiency: <500 ideal, hard fail >2000
   - Clear triggers: keywords + file types required
   - Single responsibility: one capability only
   - Anthropic patterns + progressive disclosure (soft)
5. **Output comparison report**:

```
🔍 Found N skills for "$QUERY":

| Skill | Source | ~Tokens | Quality | Verdict |
|-------|--------|---------|---------|---------|
| name  | source | ~N      | ⭐⭐⭐⭐  | 🟢/🟡/🔴 Study/Adapt/Ignore |

💡 Recommended approach:
- [What to study from best matches]
- [What patterns to adapt]
- [What to ignore and why]

📎 Key patterns found:
- [Reusable patterns across results]
```

## Rules

- Output verdicts (study/adapt/ignore), NOT install commands
- Skip tiers 2-3 if tier 1 has strong matches
- Fetch actual SKILL.md source when possible — evaluate code not marketing
- See `reference.md` for full source registry and quality rubric weights
