---
name: openspec-reflect
description: "Pre-gate self-check for drift detection and philosophy alignment. Use when: preparing for human gate review, checking implementation quality, or detecting scope drift."
model: sonnet
allowed-tools: [Glob, Grep, Read, Edit, Bash]
---

# OpenSpec Reflect

Pre-gate self-check skill. Verifies acceptance criteria, detects scope drift, and ensures philosophy alignment before human review.

## Workflow: Check → Assess → Report

```mermaid
flowchart LR
    A["Read context"] --> B["Check criteria"]
    B --> C["Detect drift"]
    C --> D["Check philosophy"]
    D --> E["Self-assess"]
    E --> F["Generate report"]

    classDef action fill:#E1BEE7,stroke:#7B1FA2,color:#000
    class A,B,C,D,E,F action
```

**Critical**: Run before human gates. Catches drift BEFORE human reviews.

## Exploration Strategy

Before reflection, consult `openspec/project.md` → Exploration Strategy section:

1. **Context sources**: Read `primary` files (project.md, proposal.md, specs)
2. **Must-read files**: CLAUDE.md, settings.json (project constraints)
3. **Tools**: Use configured codebase tools (Glob, Grep, Read)
4. **Philosophy**: Read Execution Philosophy section for current mode and principles

## Commands

### reflect

Run comprehensive pre-gate self-check.

**Input**: `$ARGUMENTS` = `change-id`

**Workflow**:
1. **Load context**:
   - Read `openspec/changes/{change-id}/proposal.md` for acceptance criteria
   - Read `openspec/changes/{change-id}/tasks.md` for progress
   - Read `openspec/changes/{change-id}/specs/*.md` for requirements
   - Read `openspec/project.md` for Execution Philosophy

2. **Check acceptance criteria**:
   - Extract criteria from proposal.md (Success Criteria section)
   - For each criterion: verify met/unmet/partial
   - Record evidence for each status

3. **Detect scope drift**:
   - Extract "Affected files" from proposal.md
   - Run `git status` and `git diff --stat` to find actual changes
   - Calculate deviation percentage: `(actual - proposed) / proposed * 100`
   - Flag if >20% deviation

4. **Check philosophy alignment**:
   - Read `mode` from Execution Philosophy
   - Review implementation for anti-patterns of current mode
   - Flag any violations

5. **Self-assessment**:
   - Answer: "Am I solving the right problem?"
   - Evaluate: Is work aligned with proposal's Problem statement?

6. **Generate gate-ready report** (see format below)

## Gate-Ready Report Format

```
# Reflection Report: {change-id}

## Criteria Status
| Criterion | Status | Evidence |
|-----------|--------|----------|
| {criterion 1} | {met/unmet/partial} | {evidence} |
| {criterion 2} | {met/unmet/partial} | {evidence} |

## Scope Analysis
- Proposed files: {n}
- Actual files: {m}
- Deviation: {percent}%
{if >20%: ⚠️ SCOPE DRIFT DETECTED - requires human review}

## Philosophy Alignment
- Mode: {mode}
- Anti-patterns detected: {list or "None"}
{if violations: ⚠️ PHILOSOPHY VIOLATION - {details}}

## Self-Assessment
**Question**: Am I solving the right problem?
**Answer**: {assessment based on proposal's Problem statement}

## Deviations Requiring Attention
{list with ⚠️ emoji for each, or "None"}

## Recommendation
{READY FOR GATE | NOT READY - {reasons}}
```

## Deviation Flagging

Flag deviations with warning emoji and explanation:

```
⚠️ DEVIATION: {type}
- Expected: {what proposal specified}
- Actual: {what was implemented}
- Impact: {why this matters}
- Recommendation: {fix now | discuss at gate | acceptable deviation}
```

**Deviation types**:
- `SCOPE_DRIFT`: Files changed exceed proposal by >20%
- `CRITERIA_UNMET`: Acceptance criterion not satisfied
- `PHILOSOPHY_VIOLATION`: Anti-pattern for current mode detected
- `SPEC_DEVIATION`: Implementation differs from spec requirements

## Philosophy Check

Read `openspec/project.md` → Execution Philosophy → `mode`.

**Flag anti-patterns for current mode**:

| Mode | Anti-patterns to flag |
|------|----------------------|
| `garage` | Over-engineering, gold-plating, premature abstraction, analysis paralysis |
| `scale` | Cowboy coding, skipping tests, undocumented decisions |
| `maintenance` | Refactoring for aesthetics, feature creep, risky upgrades |

**When flagging**:
```
⚠️ PHILOSOPHY VIOLATION ({mode} mode)
- Anti-pattern: {specific anti-pattern}
- Evidence: {what triggered this flag}
- Mode principle violated: {which principle}
```

## Guardrails

**Autonomous** (no confirmation needed):
- Reading all context files
- Analyzing implementation
- Generating reports
- Flagging deviations

**Ask-first** (pause and confirm):
- None - reflect is read-only and advisory

## CLI Integration

Use CLI for status checks:
```bash
openspec show {change-id}  # Get current change status
openspec status            # Overall project status
```

## Output Examples

**Ready for gate**:
```
# Reflection Report: add-phase3-skills

## Criteria Status
| Criterion | Status | Evidence |
|-----------|--------|----------|
| All 4 SKILL.md files created | met | Files exist in .claude/skills/ |
| Skills follow openspec-develop pattern | met | Structure matches reference |

## Scope Analysis
- Proposed files: 4
- Actual files: 4
- Deviation: 0%

## Philosophy Alignment
- Mode: garage
- Anti-patterns detected: None

## Self-Assessment
**Question**: Am I solving the right problem?
**Answer**: Yes - implementing the 4 Phase 3 skills as specified in proposal.

## Deviations Requiring Attention
None

## Recommendation
READY FOR GATE
```

**Not ready**:
```
# Reflection Report: add-feature-x

## Criteria Status
| Criterion | Status | Evidence |
|-----------|--------|----------|
| API endpoint works | partial | Returns 500 on edge cases |
| Tests pass | unmet | 3 failing tests |

## Scope Analysis
- Proposed files: 5
- Actual files: 12
- Deviation: 140%
⚠️ SCOPE DRIFT DETECTED - requires human review

## Philosophy Alignment
- Mode: garage
- Anti-patterns detected:
  ⚠️ PHILOSOPHY VIOLATION (garage mode)
  - Anti-pattern: Over-engineering
  - Evidence: Added abstraction layer not in proposal
  - Mode principle violated: "Working > perfect"

## Self-Assessment
**Question**: Am I solving the right problem?
**Answer**: Partially - core feature works but scope expanded significantly.

## Deviations Requiring Attention
⚠️ DEVIATION: SCOPE_DRIFT
- Expected: 5 files
- Actual: 12 files
- Impact: Review burden increased, potential feature creep
- Recommendation: Discuss at gate

⚠️ DEVIATION: CRITERIA_UNMET
- Expected: All tests pass
- Actual: 3 failing tests
- Impact: Cannot merge without fixes
- Recommendation: Fix now

## Recommendation
NOT READY - unmet criteria and scope drift require attention
```
