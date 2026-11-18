# Proto-Persona

**Framework**: Data-grounded proto-persona (NOT fictional)

## Markdown Template

```markdown
# Proto-Persona: {Name} — {Subject}

## Demographics
| Attribute | Value |
|-----------|-------|
| Archetype | {role/profession} |
| Age range | {range} |
| Business type | {company type/size} |
| Tech comfort | {low/medium/high} |
| Revenue range | {if relevant} |

## Goals
- **Primary**: {main objective}
- **Secondary**: {supporting objectives}

## Behaviors
- {observable behavior pattern from research}
- {tool/channel usage pattern}

## Triggers
> What prompts them to seek a solution

- {trigger event 1}
- {trigger event 2}

## Pain Points
| Pain | Impact | Current Workaround |
|------|--------|-------------------|
| {pain} | {business impact} | {what they do today} |

## Day-in-Life Scenario
> Grounded in research data — NOT fictional

**Morning**: {routine relevant to problem space}
**Midday**: {interactions, decisions}
**End of day**: {reflections, unresolved tensions}

## Quotes (from research)
- "{verbatim or close paraphrase}"
```

## YAML Schema

Place at end of file under `## Structured Data (for /ux-wireframe)`:

```yaml
type: persona
name: "{archetype name}"
demographics:
  archetype: "{role}"
  age_range: "{range}"
  business_type: "{type}"
  tech_comfort: low|medium|high
goals:
  primary: "{main goal}"
  secondary:
    - "{goal}"
behaviors:
  - "{pattern}"
triggers:
  - "{event}"
pain_points:
  - pain: "{description}"
    impact: "{business impact}"
    workaround: "{current solution}"
day_in_life:
  morning: "{routine}"
  midday: "{interactions}"
  end_of_day: "{reflections}"
quotes:
  - "{verbatim}"
```

## Frontmatter

```yaml
---
artifact: persona
subject: {subject}
persona: {archetype-name}
date: {YYYY-MM-DD}
source_docs:
  - {files read}
engagement_layer: hook
---
```
