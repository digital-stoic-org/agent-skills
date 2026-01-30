---
name: openspec-plan
description: "Create OpenSpec change proposals. Use when: user wants to plan a feature, create a proposal, or start a new OpenSpec change."
model: sonnet
---

# OpenSpec Plan

Analysis + reasoning engine for change proposals. Assumes decision made (via /brainstorm or direct request).

## Workflow: Analyze → Reason → Generate

| Phase | Purpose | Model | Thinking |
|-------|---------|-------|----------|
| **Analyze** | Explore codebase, find affected files | Sonnet | off |
| **Reason** | Dependencies, risks, integration points | Sonnet | **on** |
| **Generate** | Write artifacts from analysis | Sonnet | off |

**Exploration**: Consult `openspec/project.md` → Exploration Strategy section for tools and must-read files.

**Philosophy**: Consult `openspec/project.md` → Execution Philosophy section for current mode and principles.

## Commands

### create

Create change proposal from codebase analysis.

**Input**: `$ARGUMENTS` = `change-id: Brief description`

**Workflow**:
1. **Analyze**: Explore codebase for affected files/patterns (Glob, Grep, Read)
2. **Reason** (thinking on): Identify dependencies, risks, integration points
3. **Philosophy check**: Read Execution Philosophy mode, align proposal scope with principles
4. **Research** (optional): Web search for framework docs/patterns if needed
5. **Confirm**: Present findings to user before writing
6. **Generate**: Write proposal.md with analysis-driven content

**Philosophy alignment** (include in proposal):
```markdown
## Execution Philosophy Alignment

**Mode**: {mode from project.md}
**Principles applied**: {relevant principles for this change}
**Trade-offs accepted**: {from accept list}
**Anti-patterns avoided**: {relevant anti-patterns}
```

**Output**: `openspec/changes/{change-id}/proposal.md` with Why/What/Impact from analysis

### tasks

Generate outcome-centric tasks from proposal.

**Input**: `$ARGUMENTS` = `change-id`

**Rules**:
- Tasks are outcomes: "X exists", "Y works", "Z passes"
- NO activity verbs: Design, Implement, Create, Write
- Each task ≤80 chars (TodoWrite compatible)
- Numbered sections with checkboxes

**Output**: `tasks.md` with verifiable outcomes

### spec

Generate spec with delta headers and real scenarios.

**Input**: `$ARGUMENTS` = `change-id capability-name`

**Output**: `specs/{capability}/spec.md` with:
- `## ADDED/MODIFIED/REMOVED Requirements`
- `### Requirement:` with SHALL/MUST keywords
- `#### Scenario:` with GIVEN/WHEN/THEN (from codebase understanding)
