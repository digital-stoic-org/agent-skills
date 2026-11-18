# Jobs To Be Done

**Framework**: Ulwick ODI — `When [situation], I want to [motivation], so I can [outcome]`

## Markdown Template

```markdown
# Jobs To Be Done: {Subject}

## Core Job Statement
> When {situation}, I want to {motivation}, so I can {outcome}.

## Functional Jobs
| # | Job Statement | Frequency | Importance | Satisfaction |
|---|---------------|-----------|------------|--------------|
| 1 | {job} | high/med/low | high/med/low | high/med/low |

## Emotional Jobs
| # | Job Statement | Trigger |
|---|---------------|---------|
| 1 | Feel {emotion} when {context} | {what triggers this need} |

## Social Jobs
| # | Job Statement | Audience |
|---|---------------|----------|
| 1 | Be seen as {perception} by {whom} | {social context} |

## Priority Matrix
> High importance + Low satisfaction = Top opportunity

| Job | Importance | Satisfaction | Opportunity Score |
|-----|------------|--------------|-------------------|
| {job} | {1-10} | {1-10} | {importance + (importance - satisfaction)} |

## Pains (job obstacles)
- {pain blocking job completion}

## Gains (job success criteria)
- {outcome that means the job is done well}
```

## YAML Schema

Place at end of file under `## Structured Data (for /ux-wireframe)`:

```yaml
type: jtbd
core_job:
  situation: "{when}"
  motivation: "{I want to}"
  outcome: "{so I can}"
functional_jobs:
  - statement: "{job}"
    frequency: high|med|low
    importance: high|med|low
    satisfaction: high|med|low
emotional_jobs:
  - statement: "{feel X when Y}"
    trigger: "{context}"
social_jobs:
  - statement: "{be seen as X by Y}"
    audience: "{whom}"
priority_matrix:
  - job: "{job}"
    importance: 8
    satisfaction: 3
    opportunity_score: 13
pains:
  - "{obstacle}"
gains:
  - "{success criterion}"
```

## Frontmatter

```yaml
---
artifact: jtbd
subject: {subject}
persona: all
date: {YYYY-MM-DD}
source_docs:
  - {files read}
engagement_layer: hook
---
```
