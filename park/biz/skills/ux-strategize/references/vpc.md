# Value Proposition Canvas

**Framework**: Strategyzer — Customer Profile ↔ Value Map

## Markdown Template

```markdown
# Value Proposition Canvas: {Subject}

## Customer Profile

### Customer Jobs
| Type | Job |
|------|-----|
| Functional | {job} |
| Emotional | {job} |
| Social | {job} |

### Pains
| Pain | Severity | Frequency |
|------|----------|-----------|
| {pain} | high/med/low | daily/weekly/monthly |

### Gains
| Gain | Priority | Current Satisfaction |
|------|----------|---------------------|
| {gain} | must-have/nice-to-have | met/unmet/overserved |

## Value Map

### Products & Services
- {offering 1}
- {offering 2}

### Pain Relievers
| Pain Addressed | How Relieved | Strength |
|----------------|-------------|----------|
| {pain} | {mechanism} | strong/moderate/weak |

### Gain Creators
| Gain Addressed | How Created | Strength |
|----------------|------------|----------|
| {gain} | {mechanism} | strong/moderate/weak |

## Fit Analysis

| Customer Need | Value Map Element | Fit |
|---------------|-------------------|-----|
| {job/pain/gain} | {product/reliever/creator} | ✅ strong / 🟡 partial / ❌ gap |

### Gaps (unaddressed needs)
- {need with no corresponding value map element}

### Over-serves (features without customer need)
- {feature that doesn't map to a job/pain/gain}
```

## YAML Schema

Place at end of file under `## Structured Data (for /ux-wireframe)`:

```yaml
type: vpc
customer_profile:
  jobs:
    functional:
      - "{job}"
    emotional:
      - "{job}"
    social:
      - "{job}"
  pains:
    - pain: "{description}"
      severity: high|med|low
      frequency: daily|weekly|monthly
  gains:
    - gain: "{description}"
      priority: must-have|nice-to-have
      satisfaction: met|unmet|overserved
value_map:
  products:
    - "{offering}"
  pain_relievers:
    - pain: "{addressed}"
      mechanism: "{how}"
      strength: strong|moderate|weak
  gain_creators:
    - gain: "{addressed}"
      mechanism: "{how}"
      strength: strong|moderate|weak
fit_analysis:
  fits:
    - need: "{job/pain/gain}"
      element: "{product/reliever/creator}"
      fit: strong|partial|gap
  gaps:
    - "{unaddressed need}"
  over_serves:
    - "{unmapped feature}"
```

## Frontmatter

```yaml
---
artifact: vpc
subject: {subject}
persona: all
date: {YYYY-MM-DD}
source_docs:
  - {files read}
engagement_layer: hook
---
```
