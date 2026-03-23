# Brand-Level Anti-Patterns

Visual identity mistakes detected at the brand level (vs `/ux-polish` which catches implementation anti-patterns).

## Detection Matrix

| Anti-Pattern | Why It Fails | Detection Logic | Severity |
|---|---|---|---|
| **Palette-archetype mismatch** | Calming archetype + aggressive red/saturated palette destroys trust signal | Archetype emotion vs dominant color hue. Calming + saturated red/orange = fail. | Critical |
| **Tech-comfort mismatch** | Low-tech audience + icon-only navigation, thin fonts, hover-dependent UI | Persona tech_comfort < 4 AND (icon-only elements OR body < 16px OR hover-required) | Critical |
| **Font-archetype conflict** | Authority archetype + rounded/playful font, or Trust + decorative font | Archetype formality level vs font personality classification | High |
| **Reference drift** | Brand references luxury SaaS but audience uses government sites | Familiarity anchors don't overlap with actual reference sites used in design | High |
| **Contrast theater** | Passes WCAG technically but entire palette feels washed out / low-energy | All text-bg pairs between 4.5:1 and 5.5:1 (technically passing but barely). Target >6:1 for low-tech. | Medium |
| **Rainbow palette** | >4 distinct hues in color system (excluding semantic colors) | Count distinct hue families in brand tokens (bg/surface/border excluded) | Medium |
| **Familiarity uncanny valley** | Almost looks like a known app/brand but not quite — triggers distrust | Palette within 10% hue/saturation of major brand colors (Crédit Agricole green, La Poste yellow, Orange orange) | Medium |

## Per-Archetype Danger Zones

### Calming Trust
- ❌ Saturated primary (>60% saturation in HSL)
- ❌ More than 2 font weights
- ❌ Animations beyond loading/transitions
- ❌ Icon-only navigation
- ❌ Dark mode (unfamiliar for low-tech)

### Urgent Action
- ❌ Red as primary (amplifies anger instead of channeling urgency)
- ❌ Too many CTAs per screen (everything urgent = nothing urgent)
- ❌ Slow transitions (contradicts urgency feel)
- ❌ Decorative elements (wastes time)

### Playful Approachable
- ❌ Corporate blue palette (contradicts playful signal)
- ❌ Serif fonts (too formal)
- ❌ Dense information layout
- ❌ Sharp corners (4px) everywhere

### Premium Authority
- ❌ Bright/saturated accent colors
- ❌ Rounded/friendly fonts (Nunito, Comic Sans)
- ❌ Large padding/spacing (signals simplicity, not sophistication)
- ❌ Playful animations or bouncy effects

### Utilitarian Tool
- ❌ Decorative illustrations
- ❌ Hero sections with large imagery
- ❌ Personality-driven microcopy
- ❌ Multiple accent colors

### Empowering Guide
- ❌ Dense/compact layouts (overwhelms learners)
- ❌ Icon-only for domain-specific actions
- ❌ Assumption of prior knowledge in UI labels
- ❌ Missing progress indicators

## Validation Protocol

Run these checks after token derivation, before generating outputs:

1. **Archetype alignment**: Does the dominant palette hue match archetype direction?
2. **Tech-comfort calibration**: Are sizing/spacing/interaction patterns appropriate?
3. **Contrast adequacy**: Do ALL pairs meet WCAG AA? Does average contrast exceed 6:1 for low-tech?
4. **Palette coherence**: Are all non-semantic colors derived from ≤3 base hues?
5. **Font appropriateness**: Does font personality match archetype formality?
6. **Reference consistency**: Would the persona recognize the visual language from their daily tools?
7. **Cultural safety**: No accidental brand-color mimicry or cultural color violations?
