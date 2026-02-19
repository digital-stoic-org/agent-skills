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

Generate outcome-centric tasks + test strategy from proposal.

**Input**: `$ARGUMENTS` = `change-id [--skip-test]`

**Sources** (read before generating):
1. `openspec/changes/{id}/proposal.md` (required)
2. `openspec/changes/{id}/design.md` (optional — if present, use mapping rules below)

**design.md mapping rules** (only when design.md exists):
- **Containers → task sections**: Each C4 container maps to a numbered section in tasks.md
- **Aggregate boundaries → task granularity**: Entities within an aggregate = single task; entities across aggregates = separate tasks
- **TT interaction modes → task sequencing**: Collaboration mode = sequential tasks (tightly coupled); X-as-a-Service mode = parallelizable tasks (clear interface)

If no `design.md` exists, derive sections from proposal.md as before (backward compatible).

**Rules**:
- Tasks are outcomes: "X exists", "Y works", "Z passes"
- NO activity verbs: Design, Implement, Create, Write
- Each task ≤80 chars (TodoWrite compatible)
- Numbered sections with checkboxes
- Add `### GATE N: Description` after sections representing logical boundaries
- Gates optional — not every section needs one
- Standard pattern: scaffold → gate → implement → gate → audit → gate → test

**Output**:
1. `tasks.md` - verifiable outcomes with gates
2. `test.md` - verification strategy (unless --skip-test or garage mode + simple change)

**test.md generation**:
- Mirrors gates from tasks.md
- For each gated task outcome: concrete verification step + observable expectation
- Quality bar: functional > structural, observable, specific (see reference.md for anti-patterns)
- Mode-aware: garage=recommended, scale/maintenance=required (see reference.md for requirements)

### spec

Generate spec with delta headers and real scenarios.

**Input**: `$ARGUMENTS` = `change-id capability-name`

**Output**: `specs/{capability}/spec.md` with:
- `## ADDED/MODIFIED/REMOVED Requirements`
- `### Requirement:` with SHALL/MUST keywords
- `#### Scenario:` with GIVEN/WHEN/THEN (from codebase understanding)
