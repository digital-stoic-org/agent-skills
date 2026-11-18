# Color Psychology for UI Decisions

## Emotion → Color Mapping (Plutchik-based)

| Emotion | Color Family | UI Application |
|---|---|---|
| Fear/anxiety | Blue-purple (calming) | Cool primary, low saturation, high trust signal |
| Anger/frustration | Green-blue (cool down) | NOT match with red — de-escalate. Amber for urgency. |
| Joy/delight | Warm yellow-orange | Accent colors, success states, celebration moments |
| Trust | Blue | Institutional primary. Universal trust signal across cultures. |
| Anticipation | Orange-amber | CTA highlights, progress indicators |
| Sadness/helplessness | Warm teal-green | Encouraging, growth-oriented. Avoid cold palettes. |

**Rule**: Map empathy map emotions to COUNTER-colors (calm anger, don't amplify it), except for positive emotions (amplify joy/trust).

## Palette Construction

### 60-30-10 Rule
- **60% dominant**: bg + surface (neutrals)
- **30% secondary**: cards, sections, borders (tinted neutrals)
- **10% accent**: CTAs, highlights, interactive elements (brand color)

### Tinted Neutrals
Mix 5-10% of primary hue into ALL grays. Never use pure gray (#808080).
```
pure_gray = hsl(0, 0%, 50%)
tinted_gray = hsl(primary_hue, 5%, 50%)  → cohesive, intentional
```

### No Pure Black/White
- Text: `#1E293B` (dark slate) not `#000000`
- Background: `#FAFAFA` or `#FAFBFC` (warm tint) not `#FFFFFF`
- Exception: None. Always tint.

## Color Harmony Algorithms

| Method | Use When | How |
|---|---|---|
| **Analogous** | Calming, cohesive palettes | Primary ± 30° on color wheel. Safe default. |
| **Complementary** | Need strong CTA contrast | Primary + 180° opposite. Use sparingly (accent only). |
| **Split-complementary** | Balanced with contrast | Primary + two colors adjacent to complement. More nuanced. |
| **Monochromatic** | Utilitarian/premium | Single hue, vary lightness/saturation. Most restrained. |

### OKLCH Color Space
Preferred for computed operations — perceptually uniform (unlike HSL where same saturation looks different across hues).
```
oklch(lightness% chroma hue)
Primary: oklch(55% 0.15 230)  → derive:
  Light:  oklch(95% 0.03 230)  → primary-light
  Dark:   oklch(35% 0.12 230)  → primary-dark
  Muted:  oklch(55% 0.05 230)  → tinted neutral
```

## WCAG Contrast Requirements

| Context | Minimum Ratio | Level |
|---|---|---|
| Body text on bg | 4.5:1 | AA (minimum) |
| Large text (≥18px/bold ≥14px) on bg | 3:1 | AA |
| Body text on bg | 7:1 | AAA (target for low-tech) |
| UI components, borders | 3:1 | AA |
| Disabled elements | No minimum | Exempt |

**Testing**: Check EVERY text-background pair in the palette. Common failures:
- text-secondary on surface (often too low)
- accent on primary-light (same hue, insufficient contrast)
- warning text on white (amber is weak on light bg)

## Semantic Color Conventions

| Semantic | Color | Convention | Violation Cost |
|---|---|---|---|
| Success | Green | Universal | High — users scan for green = done |
| Error | Red (muted) | Universal | Very high — red = problem |
| Warning | Amber/yellow | Universal | High — orange can confuse with brand |
| Info | Blue | Convention | Medium — often matches primary |

**Rule**: Never use brand primary for semantic colors. Keep them distinct.

## French Cultural Context (Color)

| Color | FR Association | UI Implication |
|---|---|---|
| Blue | Trust, authority (La Poste, government, EDF) | Safe default for institutional/B2B |
| Green | Health, nature (pharmacie croix verte) | Good for success, avoid as primary for non-health |
| Red | Prohibition, danger, urgency | Avoid as primary for trust-focused apps. OK for errors. |
| Orange | Telecom (Orange/SFR), moderate urgency | Avoid heavy use — telecom association |
| Tricolore (blue-white-red) | National, official | Avoid accidental tricolore palettes in official-looking tools |

## Itten's 7 Contrasts (Applied)

| Contrast | Application |
|---|---|
| Hue | Different semantic colors remain distinguishable |
| Value (light/dark) | Primary hierarchy: headings dark, body medium, secondary light |
| Saturation | Brand accent saturated, neutrals desaturated. Saturation = importance. |
| Warm/cold | Warm accents for action, cool tones for information/trust |
| Complementary | CTA stands out from surrounding content |
| Simultaneous | Adjacent colors influence each other — test in context, not isolation |
| Extension (proportion) | Small accent area with high saturation = 10% rule |
