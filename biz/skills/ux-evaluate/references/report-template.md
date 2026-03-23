# Report Template

Use this EXACT structure for evaluation reports.

## Full Report Template

```markdown
# UX Evaluation: {subject}
**Date**: {YYYY-MM-DD}
**Screens evaluated**: {count}
**Overall score**: {score}/100
**Subcommand**: {full|heuristic|alignment|accessibility|cognitive-load|flow|walkthrough}

## Summary

{2-3 sentence executive summary. Lead with most critical finding. State overall readiness.}

## Scores by Dimension

| Dimension | Score | Grade | Critical Issues |
|---|---|---|---|
| Heuristic (Nielsen+Krug+Norman) | /100 | | {top issue} |
| Strategy Alignment | /100 | | {top issue} |
| Accessibility | /100 | | {top issue} |
| Cognitive Load | /100 | | {top issue} |
| Flow Coherence | /100 | | {top issue} |
| Cognitive Walkthrough | /100 | | {top issue} |

## Critical Issues (Severity 3-4)

### {Issue title}
- **Screen**: {filename}
- **Location**: {element/section}
- **Dimension**: {which dimension}
- **Severity**: {3|4}
- **Finding**: {what's wrong}
- **Recommendation**: {how to fix}
- **Artifact reference**: {which UX artifact supports this finding}

{Repeat for each critical issue, ordered by severity desc then dimension weight desc}

## Recommendations (Severity 1-2)

| # | Screen | Issue | Severity | Recommendation |
|---|---|---|---|---|
| 1 | {file} | {issue} | {1\|2} | {fix} |

## Screen-by-Screen Detail

### {NN-screen-name.html}

**Heuristic**: {score} | **Accessibility**: {score} | **Cognitive Load**: {score} | **Flow**: {score} | **Walkthrough**: {score} | **Alignment**: {score}

{Per-dimension findings for this screen}

{Repeat for each screen}

## Comparison with Previous Evaluation

{Only if --versus used}

| Dimension | Previous | Current | Delta |
|---|---|---|---|
| Heuristic | {old}/100 | {new}/100 | {+/-N} |

**Resolved issues**: {count}
**New issues**: {count}
**Persistent issues**: {count}

## Structured Data

\```yaml
evaluation:
  subject: {subject}
  date: {YYYY-MM-DD}
  screens_evaluated: {N}
  overall_score: {N}
  dimensions:
    heuristic: {N}
    alignment: {N}
    accessibility: {N}
    cognitive_load: {N}
    flow_coherence: {N}
    walkthrough: {N}
  critical_issues: {N}
  total_issues: {N}
  top_action: "{highest priority fix}"
\```
```

## Grade Scale

| Score | Grade |
|---|---|
| 90-100 | A |
| 85-89 | A- |
| 80-84 | B+ |
| 75-79 | B |
| 70-74 | B- |
| 65-69 | C+ |
| 60-64 | C |
| 50-59 | D |
| <50 | F |

## Quality Gate (informational)

| Score | Verdict |
|---|---|
| < 50 | "Not ready for polish — fix critical issues first" |
| 50-75 | "Polish-ready with caveats — address alignment gaps" |
| > 75 | "Ready for polish and user testing" |

## Subcommand-Specific Reports

When running a single dimension (not `full`):
- Use same structure but only include the relevant dimension in scores table
- Skip dimensions table — go straight to findings
- Still include YAML structured data (other dimensions = `null`)
- Still include screen-by-screen detail for the evaluated dimension
