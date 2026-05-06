# Design Protocol

Generate and evaluate alternative approaches. Constraint-first, not idea-first.

## Morphological Analysis (Zwicky)

Systematically explore the solution space by combining dimensions.

### Steps

1. **Identify solution dimensions** (3-5): Independent aspects that define a solution
2. **List options per dimension** (2-4 each): Concrete choices
3. **Build morphological box**: Matrix of all dimensions × options
4. **Generate combinations**: Pick one option per dimension → candidate solution
5. **Filter**: Eliminate incompatible combinations

### Template

| Dimension | Option A | Option B | Option C |
|-----------|----------|----------|----------|
| Data collection | Pull-based polling | Push-based streaming | Hybrid |
| Validation timing | Real-time inline | Batch post-hoc | Checkpoint-based |
| Storage | In-memory | File-based | Database |
| Alerting | Log-only | Active notification | Dashboard |

### Candidate solutions

Combine compatible options across dimensions:

| Candidate | Collection | Validation | Storage | Alerting | Notes |
|-----------|-----------|-----------|---------|----------|-------|
| Candidate 1 | Pull | Real-time | In-memory | Active | Low latency, high resource |
| Candidate 2 | Push | Batch | File | Dashboard | Low overhead, delayed detection |
| Candidate 3 | Hybrid | Checkpoint | Database | Active | Balanced, more complex |

## Trade-off Matrix

Score each candidate against criteria from Scope phase.

### Criteria (adapt to problem)

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Effort** | 25% | Implementation complexity, time to build |
| **Risk** | 25% | What could go wrong, unknowns remaining |
| **Fit** | 25% | How well it addresses the binding constraint |
| **Maintainability** | 25% | Long-term operational burden |

### Scoring (1-5)

| Candidate | Effort | Risk | Fit | Maintain | Weighted |
|-----------|--------|------|-----|----------|----------|
| Candidate 1 | 3 | 2 | 5 | 3 | 3.25 |
| Candidate 2 | 5 | 4 | 3 | 5 | 4.25 |
| Candidate 3 | 2 | 3 | 4 | 3 | 3.00 |

## Pre-mortem Analysis

Stress-test the winning approach BEFORE committing.

### Process

1. **Assume failure**: "It's 6 months later. This approach failed. Why?"
2. **Brainstorm failure modes** (aim for 5-8):
   - Technical failures (performance, scale, edge cases)
   - Environmental failures (access, permissions, infra changes)
   - Knowledge failures (wrong assumptions, missing domain knowledge)
   - Integration failures (other systems changed, APIs deprecated)
3. **Risk-rank each**: Impact (H/M/L) × Likelihood (H/M/L)
4. **Mitigate top risks**: Add safeguards to the design for High×High items

### Output

```yaml
pre_mortem:
  - failure: "<what went wrong>"
    impact: H
    likelihood: M
    mitigation: "<how to prevent or detect early>"
```

## Architecture Visualization

Always produce at least one Mermaid diagram for the recommended approach:

- **System architecture**: C4-style context/container diagram
- **Data flow**: Sequence diagram showing data movement
- **Decision flow**: Flowchart for runtime logic

Use appropriate diagram type for the problem. Colorize with classDef (always `color:#000` for readability).

## Weighted Decision Matrix (Detailed)

For complex decisions with many stakeholders or criteria:

1. **List criteria** from success criteria (Scope phase)
2. **Assign weights** (must sum to 100%)
3. **Score each option** 1-5 per criterion
4. **Calculate weighted score**: `Σ(weight × score)`
5. **Sensitivity check**: If you change the top weight ±10%, does the winner change? If yes, flag uncertainty.
