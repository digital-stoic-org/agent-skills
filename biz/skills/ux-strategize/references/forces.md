# Customer Forces Diagram

**Framework**: Switch/Moesta — 4 forces of customer behavior change

## Markdown Template

```markdown
# Customer Forces Diagram: {Subject}

## Context
**Current situation**: {what they do today}
**Desired situation**: {what the new solution offers}

## Push Forces (away from current situation)
> Problems with status quo that create momentum for change

| Force | Strength | Evidence |
|-------|----------|----------|
| {frustration/pain with current} | strong/moderate/weak | {data source} |

## Pull Forces (toward new solution)
> Attractions of the new solution

| Force | Strength | Evidence |
|-------|----------|----------|
| {benefit/attraction} | strong/moderate/weak | {data source} |

## Anxiety Forces (about new solution)
> Fears and concerns that block switching

| Force | Strength | Mitigation |
|-------|----------|------------|
| {concern about switching} | strong/moderate/weak | {how to address} |

## Habit Forces (of current situation)
> Inertia and comfort with status quo

| Force | Strength | Breaking Strategy |
|-------|----------|-------------------|
| {habit/comfort pattern} | strong/moderate/weak | {how to overcome} |

## Force Balance Assessment

Push + Pull >> Anxiety + Habit → Switch likely
Push + Pull ≈ Anxiety + Habit → Needs intervention
Push + Pull << Anxiety + Habit → Won't switch without major catalyst

**Verdict**: {assessment with rationale}

## Key Interventions
> Actions to tip the balance toward switching

1. **Reduce anxiety**: {specific action}
2. **Break habit**: {specific action}
3. **Amplify push**: {specific action}
```

## YAML Schema

Place at end of file under `## Structured Data (for /ux-wireframe)`:

```yaml
type: forces
current_situation: "{status quo}"
desired_situation: "{new solution}"
push:
  - force: "{frustration}"
    strength: strong|moderate|weak
    evidence: "{source}"
pull:
  - force: "{attraction}"
    strength: strong|moderate|weak
    evidence: "{source}"
anxiety:
  - force: "{concern}"
    strength: strong|moderate|weak
    mitigation: "{how to address}"
habit:
  - force: "{inertia pattern}"
    strength: strong|moderate|weak
    breaking_strategy: "{how to overcome}"
balance: switch-likely|needs-intervention|wont-switch
interventions:
  - type: reduce-anxiety|break-habit|amplify-push|amplify-pull
    action: "{specific intervention}"
```

## Frontmatter

```yaml
---
artifact: forces
subject: {subject}
persona: all
date: {YYYY-MM-DD}
source_docs:
  - {files read}
engagement_layer: hook
---
```
