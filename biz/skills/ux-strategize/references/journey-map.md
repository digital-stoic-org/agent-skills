# User Journey Map

**Framework**: Stage-based with 4-layer engagement mapping

## Markdown Template

```markdown
# User Journey Map: {Subject} — {Persona}

## Journey Overview
**Scenario**: {what the user is trying to accomplish}
**Duration**: {timeframe of the journey}

## Stages

### Stage 1: {Name} [{engagement_layer}]
- **Actions**: {what user does}
- **Touchpoints**: {channels, tools, people}
- **Thoughts**: "{what user is thinking}"
- **Emotions**: {emoji + description} (intensity: 1-5)
- **Pain Points**: {friction, frustration}
- **Opportunities**: {how to improve}

### Stage 2: {Name} [{engagement_layer}]
...

## Moments of Truth
- **MOT 1**: {critical decision point where user commits or abandons}

## Engagement Layer Mapping

| Stage | Layer | Why |
|-------|-------|-----|
| {stage} | Hook/History/TI/Automation | {rationale} |
```

## YAML Schema

Place at end of file under `## Structured Data (for /ux-wireframe)`:

```yaml
type: journey-map
scenario: "{what user does}"
duration: "{timeframe}"
stages:
  - name: "{stage name}"
    engagement_layer: hook|history|temporal-intelligence|automation
    actions:
      - "{action}"
    touchpoints:
      - "{channel or tool}"
    thoughts:
      - "{internal thought}"
    emotion:
      label: "{emotion}"
      intensity: 3
    pain_points:
      - "{friction}"
    opportunities:
      - "{improvement}"
moments_of_truth:
  - stage: "{stage name}"
    description: "{critical decision point}"
engagement_mapping:
  - stage: "{stage}"
    layer: hook|history|temporal-intelligence|automation
    rationale: "{why}"
```

## Frontmatter

```yaml
---
artifact: journey-map
subject: {subject}
persona: {persona}
date: {YYYY-MM-DD}
source_docs:
  - {files read}
engagement_layer: hook|history|temporal-intelligence|automation
---
```

Note: Journey maps span multiple engagement layers. Set frontmatter `engagement_layer` to the primary layer, and detail per-stage mapping in the body.
