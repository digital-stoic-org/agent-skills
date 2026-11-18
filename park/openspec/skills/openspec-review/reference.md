# OpenSpec Review Reference

Detailed lens checklists, output template, and calibration rules.

## Six Lenses

### Lens 1: Problem-Solution Fit

*"Is the proposal solving the right problem?"*

- Does the Problem statement describe a real, validated pain?
- Does the solution directly address the stated problem or drift into adjacencies?
- Are there simpler ways to achieve the same outcome?
- Are success criteria measurable and falsifiable?
- **Alternatives considered**: Does the proposal document rejected alternatives with reasons? Empty or hand-wavy = MAJOR. No alternatives section at all = CRITICAL
- **Non-goals**: Are non-goals explicitly stated? Are they genuine trade-offs or cop-outs avoiding hard problems?
- **Effort proportionality**: Is the proposed scope proportionate to the problem's impact? 3 weeks of work for a problem affecting 2 users = flag it
- Merge relevant Anchor (Gatekeeper, Reset) and Framing (Socratic) findings from devil-advocate

### Lens 2: Design Soundness

*"Will this architecture actually work?"*

- BC boundaries: clean separation or leaky abstractions?
- Container responsibilities: single-purpose or god-objects?
- Data model: are aggregates correctly bounded? Missing entities?
- Key flows: do sequence diagrams cover error paths, not just happy paths?
- ADRs: are trade-offs documented with rejected alternatives?
- Coupling: are dependencies directional and minimal?
- **Sensitivity points** (ATAM): Which design decisions, if changed slightly, would cause disproportionate effects? These are the fragile joints
- **Reversibility**: Which decisions are one-way doors (schema choices, API contracts, data model shapes) vs two-way doors? One-way doors not acknowledged in ADRs = MAJOR
- If no design.md: flag as finding (severity depends on mode — critical for scale/maintenance, minor for garage)

### Lens 3: Best Practices Coverage

*"What should be here but isn't?"*

- Error handling strategy: defined or implicit?
- Security considerations: auth, input validation, secrets, OWASP patterns?
- Observability: logging, metrics, tracing mentioned?
- Idempotency, retries, failure modes for distributed operations?
- Migration/rollback strategy for data changes?
- Mode-aware: garage mode gets lighter scrutiny, scale/maintenance gets full

### Lens 4: Over-Engineering Detection

*"What's here that shouldn't be?"*

- YAGNI violations: abstractions without current consumers
- Premature generalization: config/flags for hypothetical future use
- Complexity disproportionate to problem size
- Tasks that could be deferred without blocking the stated goal
- Gold-plating: polish beyond acceptance criteria scope
- Merge relevant Pre-mortem and Alternative Approaches findings from devil-advocate

### Lens 5: Task & Test Quality

*"Are the tasks implementable and tests meaningful?"*

- Tasks: outcome-phrased (not activity verbs)? ≤80 chars? Correctly ordered?
- Task granularity: too coarse (multi-day) or too fine (trivial)?
- Gates: placed at logical boundaries? Cover integration points?
- Tests: functional > structural? Observable expectations?
- Test coverage: do tests exercise acceptance criteria, not just task outputs?
- Missing tests for error paths, edge cases, or invariants from design.md?

### Lens 6: Gap Detection

*"What's missing that a seasoned engineer would ask about?"*

- Unstated assumptions that could break in production
- Missing non-functional requirements (performance, scalability, accessibility)
- Integration risks with existing system not addressed
- Deployment/rollout considerations absent
- Documentation gaps for consumers/operators
- **Operational readiness** — the #1 blind spot in design reviews:
  - How do we know it's working? (monitoring, health checks, SLIs)
  - How do we roll this back? (deployment reversibility, data migration undo)
  - What's the blast radius if it fails? (scope of impact)
  - Who owns this in production? (on-call, operational responsibility)
- Merge relevant Steelman and Counterfactual findings from devil-advocate

## Severity Calibration

| Severity | Meaning | Action |
|----------|---------|--------|
| **CRITICAL** | Blocks implementation — design flaw, wrong problem, missing essential | Must fix before `/openspec-develop` |
| **MAJOR** | Significant gap — will cause pain during or after implementation | Should fix, discuss if intentional |
| **MINOR** | Improvement opportunity — nice to have, won't block success | Note for consideration |

**Calibration rules**:
- Be direct. Don't soften severity to be polite.
- A finding that affects correctness or problem-solution fit = CRITICAL, always.
- A finding about missing tests in garage mode = MINOR (not MAJOR).
- Over-engineering in garage mode = MAJOR (garage means lean).
- Missing error handling for user-facing flows = MAJOR minimum.

## Output Template

```markdown
# Review Report: {change-id}

**Mode**: {mode from project.md}
**Artifacts reviewed**: {list of files read}
**Reviewer stance**: Tech lead pre-implementation gate

## Findings

### CRITICAL

{numbered findings with lens tag}

1. **[Lens N: {lens name}]** {finding title}
   - Evidence: {specific reference to artifact content}
   - Impact: {what goes wrong if ignored}
   - Recommendation: {concrete fix}

### MAJOR

{same format}

### MINOR

{same format}

{If no findings at a severity level, omit that section entirely}

## Pre-Mortem

*"It's 6 months from now. This change has failed. Why?"*

Source from devil-advocate's Pre-mortem findings. If devil-advocate didn't produce them, generate independently.

1. **{likely failure}** — Early warning: {signal} · Mitigation: {action}
2. **{second-order failure}** — Early warning: {signal} · Mitigation: {action}
3. **{black swan}** — Early warning: {signal} · Mitigation: {action}

## Socratic Openings

Questions for the proposal author:

1. {question}
2. {question}
3. {question}

## Verdict: {READY | READY WITH CAVEATS | NOT READY | RETHINK}

{1-3 sentence summary of why}

### Next Steps

{If READY}: → `/openspec-develop {change-id}`
{If READY WITH CAVEATS}: → Fix {list}, then `/openspec-develop {change-id}`
{If NOT READY}: → Address critical findings, then `/openspec-review {change-id}`
{If RETHINK}: → Revisit `/openspec-plan create {change-id}` with {specific direction}
```

## Philosophy Anti-Patterns by Mode

| Mode | Flag Anti-patterns |
|------|-------------------|
| `garage` | Over-engineering, premature abstraction, analysis paralysis, gold-plating |
| `scale` | Cowboy coding, skipping tests, undocumented decisions, missing observability |
| `maintenance` | Refactoring for aesthetics, feature creep, risky upgrades, unnecessary migrations |

## Exploration Strategy

Before review, consult `openspec/project.md` → Exploration Strategy section:

1. **Context sources**: Read `primary` files (project.md, proposal.md, design.md, tasks.md, tests.md)
2. **Must-read files**: CLAUDE.md, settings.json (project constraints)
3. **Tools**: Use configured codebase tools (Glob, Grep, Read)
4. **Philosophy**: Read Execution Philosophy section for current mode and principles
