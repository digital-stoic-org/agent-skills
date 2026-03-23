# Rationale Document Template

## Frontmatter

```yaml
---
artifact: brand-rationale
subject: {subject}
archetype: {primary-archetype}
archetype_secondary: {secondary or null}
tech_comfort: {1-10}
date: {YYYY-MM-DD}
source_docs:
  - {list of artifacts read}
---
```

## Sections

### § Audience Profile Summary
Synthesized from persona + empathy map. 3-5 bullet points: who they are, daily reality, emotional state, tech relationship.

### § Emotional Archetype: {archetype}
- **Selected**: {archetype} (+ {secondary blend} if applicable)
- **Why**: Derived from empathy map `feels` quadrant: {dominant emotions}. Forces `anxiety`: {key anxieties}. Forces `push`: {key push factors}.
- **Palette tier**: {safe|moderate|bold} — {why this tier for this audience}

### § Tech Comfort: {level}/10
- **Score**: {N} — derived from persona `tech_comfort` field
- **Evidence**: {tools_used, age, profession indicators}
- **Design implications**: {key constraints from tech-comfort level}

### § Color Rationale
- **Primary**: {hex} — {why this hue (archetype), saturation (tech-comfort), lightness}
- **Accent**: {hex} — {relationship to primary: analogous/complementary/split}
- **Semantic**: success {hex}, warning {hex}, error {hex} — {why these specific shades, cultural considerations}
- **Tinted neutrals**: bg {hex}, surface {hex} — {primary hue mixed at N%}
- **WCAG report**: {table of all text-bg pairs with contrast ratios, AA/AAA status}

### § Typography Rationale
- **Family**: {font stack} — {why: familiarity signal, tech-comfort match}
- **Strategy**: {system-default-safe|web-font-moderate|distinctive}
- **Scale ratio**: {ratio} — {why for this archetype + tech-comfort}
- **Body size**: {size} — {why larger/smaller than 16px default}
- **Heading weight**: {weight} — {number of weight levels and why}

### § Iconography Rationale
- **Strategy**: {label-always|icon-label|contextual} — {why for this tech-comfort}
- **Library**: {choice} — {why this style matches archetype}
- **Sizing**: {default size} — {minimum for this audience}

### § Imagery Rationale
- **Strategy**: {minimal|photos|illustrations|mixed} — {why for this archetype × tech-comfort}
- **Empty states**: {tier 1/2/3} — {rationale}

### § Reference Sites
#### Familiarity Anchors
- {site}: {why the audience already uses this daily}

#### Aspiration Ceiling
- {site}: {why this is the best UX they've successfully adopted}

#### Anti-References
- {site}: {why this would make the audience feel "not for me"}

#### Cross-Industry Inspiration
- {pattern from other domain}: {emotional job match, visual pattern extracted}

### § Design System Diff (only if `--update`)
| Token | Previous | New | Why Changed |
|---|---|---|---|
| {token path} | {old value} | {new value} | {rationale} |

---

## Brand Sheet HTML — Content Spec

The brand sheet (`dev/ux/brand-sheet-{subject}.html`) must include these sections:

1. **Header**: Archetype badge (name + emoji), tech-comfort level indicator, generation date
2. **Color palette**: Each color swatch with hex code, semantic label, and contrast ratio against bg/surface. Group: brand colors → semantic colors → neutrals
3. **Typography scale**: Rendered samples at each level (h1/h2/h3/body/small/cta) with actual text in detected language. Show font-family, size, weight, line-height.
4. **Component samples**: Button (primary/secondary/ghost states), card, input (default/focus/error), alert (success/warning/error), badge. Styled with generated tokens.
5. **Icon usage**: 3-4 sample icons demonstrating the icon strategy (label+icon, sizing, style family)
6. **Spacing visualization**: Visual blocks showing the spacing scale (4/8/12/16/24/32/48)
7. **Do/Don't**: 2-3 side-by-side comparisons. "Do" = archetype-appropriate pattern. "Don't" = anti-reference pattern. Brief label explaining why.
8. **Reference mood**: List of familiarity anchors + ceiling sites with one-line rationale each
9. **Footer**: Link to rationale doc, design-system.yaml path
