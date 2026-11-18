# OpenSpec Reflect Reference

Detailed examples and patterns for pre-gate reflection.

## Output Examples

### Ready for Gate

```markdown
# Reflection Report: add-phase3-skills

## Test Strategy Coverage
- test.md: present
- Mode: garage
- Coverage: 4 tasks across 1 gate (smoke layer)

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

### Not Ready

```markdown
# Reflection Report: add-feature-x

## Test Strategy Coverage
- test.md: missing
- Mode: scale
⚠️ MISSING_TEST_MD - required for scale mode

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
⚠️ DEVIATION: MISSING_TEST_MD
- Expected: test.md required in scale mode
- Actual: test.md not found
- Impact: No human-reviewed test strategy, risk of lazy verification
- Recommendation: Run /openspec-plan tasks to generate test.md

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

## Deviation Flagging Detail

Flag deviations with this format:

```
⚠️ DEVIATION: {type}
- Expected: {what proposal specified}
- Actual: {what was implemented}
- Impact: {why this matters}
- Recommendation: {fix now | discuss at gate | acceptable deviation}
```

**All deviation types**:
- `MISSING_TEST_MD`: test.md file missing in scale/maintenance mode
- `SCOPE_DRIFT`: Files changed exceed proposal by >20%
- `CRITERIA_UNMET`: Acceptance criterion not satisfied
- `PHILOSOPHY_VIOLATION`: Anti-pattern for current mode detected
- `SPEC_DEVIATION`: Implementation differs from spec requirements

## Exploration Strategy

Before reflection, consult `openspec/project.md` → Exploration Strategy section:

1. **Context sources**: Read `primary` files (project.md, proposal.md, specs)
2. **Must-read files**: CLAUDE.md, settings.json (project constraints)
3. **Tools**: Use configured codebase tools (Glob, Grep, Read)
4. **Philosophy**: Read Execution Philosophy section for current mode and principles

## CLI Integration

Use CLI for status checks:
```bash
openspec show {change-id}  # Get current change status
openspec status            # Overall project status
```

## Philosophy Anti-Pattern Detection

| Mode | Anti-patterns to flag |
|------|----------------------|
| `garage` | Over-engineering, gold-plating, premature abstraction, analysis paralysis |
| `scale` | Cowboy coding, skipping tests, undocumented decisions |
| `maintenance` | Refactoring for aesthetics, feature creep, risky upgrades |

When flagging violations:
```
⚠️ PHILOSOPHY VIOLATION ({mode} mode)
- Anti-pattern: {specific anti-pattern}
- Evidence: {what triggered this flag}
- Mode principle violated: {which principle}
```
