# Search Skill Reference

## Source Registry

### Tier 1 — Official & Curated (always search)

| Source | URL Pattern | Signal |
|--------|------------|--------|
| Anthropic skills | `github.com/anthropics/skills` | Anthropic-vetted |
| Anthropic plugins | `github.com/anthropics/claude-plugins-official` | Vetted plugins |
| VoltAgent curated | `github.com/VoltAgent/awesome-agent-skills` | 200+ from dev teams (Vercel, Stripe, Sentry) |

### Tier 2 — Community Curated (search if tier 1 sparse)

| Source | URL Pattern | Signal |
|--------|------------|--------|
| travisvn/awesome-claude-skills | `github.com/travisvn/awesome-claude-skills` | Claude-focused |
| hesreallyhim/awesome-claude-code | `github.com/hesreallyhim/awesome-claude-code` | Broader ecosystem |
| wshobson/commands | `github.com/wshobson/commands` | Battle-tested commands |

### Tier 3 — Marketplaces (use with caution 🪥)

| Source | URL | Signal |
|--------|-----|--------|
| SkillHub | skillhub.club | 7K+ skills, AI quality scoring (S/A-rank) |
| skills.sh | skills.sh | Vercel, CLI-first, cross-platform |
| SkillsMP | skillsmp.com | 145K+ (auto-scraped, noisy) |

### Tier 4 — MCP Registries (only if searching for MCP servers)

| Source | URL | Signal |
|--------|-----|--------|
| Official MCP Registry | registry.modelcontextprotocol.io | Anthropic-backed |
| Glama | glama.ai/mcp | Security scanning |
| PulseMCP | pulsemcp.com/servers | 8.2K+, daily updates |
| Smithery | smithery.ai | 2.6K tools, CLI-first |

## Quality Rubric (Toothbrush Filter 🪥)

| Criterion | Weight | Pass | Hard Fail |
|-----------|--------|------|-----------|
| Token efficiency | 30% | <500 tokens | >2000 tokens |
| Clear triggers | 20% | Keywords + file types in description | Vague/generic description |
| Single responsibility | 20% | One capability | Multi-purpose "helper" |
| Anthropic patterns | 15% | YAML frontmatter, proper structure | — (soft, adaptable) |
| Progressive disclosure | 15% | SKILL.md + reference/scripts split | — (soft, can add) |

### Scoring

| Score | Stars | Verdict | Action |
|-------|-------|---------|--------|
| 80-100% | ⭐⭐⭐⭐⭐ | 🟢 Excellent | Study patterns directly |
| 60-79% | ⭐⭐⭐⭐ | 🟢 Good | Study + minor adaptation |
| 40-59% | ⭐⭐⭐ | 🟡 Decent | Adapt concept, rewrite implementation |
| 20-39% | ⭐⭐ | 🟡 Weak | Extract one useful idea only |
| 0-19% | ⭐ | 🔴 Ignore | Toothbrush violation |

### Red Flags (auto-downgrade)

- No YAML frontmatter → -20%
- Description >1024 chars → -10%
- Multiple unrelated capabilities → hard fail single-responsibility
- No trigger keywords → hard fail clear-triggers
- Requires external API keys → -15%
- No scripts/ or reference.md despite complexity → -10%

## Search Query Templates

Adapt `$Q` = user's search concept:

```
# Tier 1: Official
"$Q claude code skill site:github.com/anthropics"
"$Q site:github.com/VoltAgent/awesome-agent-skills"

# Tier 2: Community
"$Q claude code SKILL.md site:github.com"
"$Q awesome-claude-skills OR awesome-claude-code"

# Tier 3: Broad
"$Q claude code skill 2026"
"$Q claude skill site:skillhub.club"
```

## SKILL.md Fetch Pattern

When a candidate is found on GitHub:
1. Construct raw URL: `https://raw.githubusercontent.com/{owner}/{repo}/main/.claude/skills/{name}/SKILL.md`
2. Also try: `/.claude/skills/{name}/SKILL.md`, `/skills/{name}/SKILL.md`, `/{name}/SKILL.md`
3. Use `WebFetch` to read content
4. Count approximate tokens (words * 1.3)
5. Apply rubric criteria

## Landscape Stats (updated 2026-02)

- Total marketplace skills: 145K+ (mostly noise)
- Total MCP servers: 17.5K+
- Curated quality skills: ~250 (Anthropic + VoltAgent)
- AI-quality-rated: 7K (SkillHub)
