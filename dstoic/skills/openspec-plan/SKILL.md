---
name: openspec-plan
description: "Create OpenSpec change proposals. Use when: user wants to plan a feature, create a proposal, or start a new OpenSpec change."
model: sonnet
allowed-tools: [Read, Edit, Write, Glob, Grep, WebSearch, WebFetch]
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

**Philosophy alignment**: Include `## Execution Philosophy Alignment` section in proposal (see reference.md for template).

**Output**: `openspec/changes/{change-id}/proposal.md` with Why/What/Impact from analysis

**Next step** (ALWAYS display after writing proposal.md):
`✅ proposal.md written → Next: /openspec-design design {change-id} → Then: /openspec-plan tasks {change-id}`

### tasks

Generate outcome-centric tasks + test strategy from proposal.

**Input**: `$ARGUMENTS` = `change-id [--skip-design] [--skip-test]`

**Sources** (read before generating):
1. `openspec/changes/{id}/proposal.md` (required)
2. `openspec/changes/{id}/design.md` (**required** unless `--skip-design`)

**Design gate**: If `design.md` does NOT exist and `--skip-design` not passed:
- ⛔ STOP — do not generate tasks
- Display: `⚠️ No design.md found. Run /openspec-design design {change-id} first, or pass --skip-design to bypass.`
- Wait for user decision

**design.md mapping rules** (when design.md exists):
- **Containers → task sections**: Each C4 container maps to a numbered section in tasks.md
- **Aggregate boundaries → task granularity**: Entities within an aggregate = single task; entities across aggregates = separate tasks
- **TT interaction modes → task sequencing**: Collaboration mode = sequential tasks (tightly coupled); X-as-a-Service mode = parallelizable tasks (clear interface)

If `--skip-design` passed without design.md, derive sections from proposal.md (backward compatible).

**Rules**:
- Tasks are outcomes: "X exists", "Y works", "Z passes"
- NO activity verbs: Design, Implement, Create, Write
- Each task ≤80 chars (TodoWrite compatible)
- Numbered sections with checkboxes
- Add `### GATE N: Description` after sections representing logical boundaries
- Gates optional — not every section needs one
- Standard pattern: scaffold → gate → implement → gate → audit → gate → test

**Cross-check** (only when design.md was consumed — after generating, before presenting output):
Print a coverage table mapping design.md components to generated artifacts:

| design.md Component | Type | tasks.md | tests.md | Status |
|---|---|---|---|---|
| {name} | container/aggregate/flow/invariant/interaction | S{n} / — | GATE {n} / — | ✅ / ⚠️ |

Coverage rules:
- Every C4 container → ≥1 task section
- Every aggregate → tasks covering its entities
- Every key flow → ≥1 gate exercising it
- Every invariant (BC Scope) → ≥1 task enforcing it
- Every context interaction (non-Separate Ways) → tasks or test verification

⚠️ gaps = warn, don't block. If gaps found, ask user: "Fix these gaps now or defer?"

**Output**:
1. `tasks.md` - verifiable outcomes with gates
2. `tests.md` - verification strategy (unless --skip-test or garage mode + simple change)

**tests.md generation**:
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
