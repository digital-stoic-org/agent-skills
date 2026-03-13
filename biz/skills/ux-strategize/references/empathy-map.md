# Empathy Map

**Framework**: NNGroup — 4 quadrants + Pains/Gains

## Markdown Template

```markdown
# Empathy Map: {Subject} — {Persona Segment}

## Says
> Direct quotes or paraphrased statements from research

- "{verbatim 1}"
- "{verbatim 2}"

## Thinks
> Internal thoughts, concerns, mental models

- {thought 1}
- {thought 2}

## Feels
> Emotions with intensity descriptors

- **{emotion}**: {description}
- **{emotion}**: {description}

## Does
> Observable behaviors and actions

- {action 1}
- {action 2}

## Pains
- {pain 1 — with frequency/severity if available}
- {pain 2}

## Gains
- {desired outcome 1}
- {desired outcome 2}
```

## YAML Schema

Place at end of file under `## Structured Data (for /ux-wireframe)`:

```yaml
type: empathy-map
quadrants:
  says:
    - "{verbatim}"
  thinks:
    - "{internal thought}"
  feels:
    - {emotion}: "{description}"
  does:
    - "{observable action}"
pains:
  - "{pain point}"
gains:
  - "{desired outcome}"
```

## Frontmatter

```yaml
---
artifact: empathy-map
subject: {subject}
persona: {persona-segment}
date: {YYYY-MM-DD}
source_docs:
  - {files read}
engagement_layer: hook
---
```
