---
name: edit-tool
description: Orchestrates creation of Claude Code tools (skills, commands, agents, scripts). Use when user requests creating, updating, or improving any Claude Code extension mechanism. Triggers include "create/make/new skill/command/agent/script", "tool for X", "slash command", "sub-agent", file paths with /skills/, /commands/, /agents/. Auto-triages based on token budget, frequency, context needs, and execution type. Delegates to edit-skill, edit-command, edit-agent, or edit-plugin after explaining decision rationale. For plugin version bumps and release metadata, route directly to edit-plugin.
---

# Edit Tool Orchestrator

Automatically triages tool creation requests to the appropriate mechanism (skill, command, agent, or script).

## Triage Process

**CRITICAL**: Always follow these steps:

1. **Analyze request** against decision tree
2. **Explain decision** to user with rationale
3. **Invoke appropriate skill** or provide guidance

## Decision Tree

```mermaid
graph TD
    A[Tool Request] --> AA{Plugin<br/>version/release?}
    AA -->|Yes| PLUGIN[✅ edit-plugin<br/>Version bump]
    AA -->|No| B{Deterministic<br/>shell only?}
    B -->|Yes| C{AI needed to<br/>decide when/how?}
    C -->|No| BASH[✅ Bash Script<br/>0 tokens]
    C -->|Yes| D{Token<br/>budget?}
    D -->|<500| WRAP[✅ Skill + scripts/<br/>AI wraps code]
    D -->|>500| CMD1[✅ Command<br/>+ @filepath]

    B -->|No| E{Token<br/>budget?}
    E -->|>2000| AGENT[✅ Sub-Agent<br/>Isolated context]
    E -->|500-2000| F{Invocation?}
    F -->|User| CMD2[✅ Command<br/>User controls]
    F -->|Auto| AGENT

    E -->|<500| G{Frequency?}
    G -->|5+ per session| H{Specific<br/>capability?}
    H -->|Yes| SKILL[✅ Skill<br/>Auto-invoked]
    H -->|No| CMD2
    G -->|1-2 per session| CMD2
    G -->|Rare <1/10| DIRECT[❌ Direct Request<br/>No tool needed]

    style PLUGIN fill:#B2DFDB,stroke:#00897B,stroke-width:2px,color:#000
    style BASH fill:#90EE90,stroke:#000,stroke-width:2px,color:#000
    style SKILL fill:#FFD700,stroke:#000,stroke-width:2px,color:#000
    style WRAP fill:#FFA500,stroke:#000,stroke-width:2px,color:#000
    style CMD1 fill:#87CEEB,stroke:#000,stroke-width:2px,color:#000
    style CMD2 fill:#87CEEB,stroke:#000,stroke-width:2px,color:#000
    style AGENT fill:#DDA0DD,stroke:#000,stroke-width:2px,color:#000
    style DIRECT fill:#FFB6C1,stroke:#000,stroke-width:2px,color:#000
```

## Decision Factors Reference

When path requires multiple criteria, consult:

| Factor | Key Question | Result |
|--------|--------------|--------|
| **Token Budget** | <500 / 500-2000 / >2000? | Skill / Command / Agent |
| **Frequency** | 5+ / 1-2 / <1 per 10 sessions? | Skill / Command / Direct |
| **Context** | Main / Isolated? | Command / Agent |
| **Scripts** | AI wrapper needed? | Skill+scripts/ / Bash |
| **Invocation** | User / Auto? | Command / Skill |
| **Capability** | Specific / Workflow? | Skill / Command |

## Delegation

After explanation: **Skill** → `edit-skill` | **Command** → `edit-command` | **Agent** → `edit-agent` | **Plugin** → `edit-plugin` | **Bash** → Direct guidance (scripts/, #!/bin/bash, chmod +x, no tool)

**Special routing:** Version bumps, release metadata, plugin.json/marketplace.json updates → `edit-plugin` (bypasses decision tree)

**Note**: Model selection (opus/sonnet/haiku) is handled by delegated editors using `pick-model` skill.

## Explanation Template

Explain decision: `✅ [TYPE] because: token budget (~X → range), frequency (pattern), key factor (dimension)`

Example: `✅ SKILL because: ~300 tokens → <500, 10+/session, auto-invoked capability`

## Parallelization Check

**Before any write operations**, verify safety:

| Operation Type | Guidance |
|----------------|----------|
| ✅ Read-only | Parallelize freely |
| ⚠️ Writes (independent files) | Sequential OR Plan Mode first |
| ⚠️ Writes (dependent changes) | Must sequence carefully |
| ❌ Destructive operations | Plan Mode MANDATORY |

**Plan Mode triggers:**
- Creating >3 files
- Modifying >5 files
- Architectural changes
- Breaking changes

## Tool Comparison Quick Reference

| Tool | Token Cost | When to Use | Context |
|------|------------|-------------|---------|
| **Bash Script** | 0 (executed) | Deterministic shell ops | None |
| **Skill** | <500 ideal | Auto-invoked, frequent | Shared (pollution) |
| **Command** | 500-2000 ok | User-triggered workflows | User-controlled |
| **Agent** | Unlimited | Complex exploration | Isolated |

## Common Patterns

| Pattern | When | Solution |
|---------|------|----------|
| Script Wrapper | AI decides timing for existing scripts | Skill + scripts/ |
| Verbose Workflow | >1000 tokens, manual trigger | Slash command |
| Research Task | Multi-file exploration, autonomous | Sub-agent (check Task tool first) |

See `reference.md` for edge cases, conversion guide, and extended examples.
