# Cultural & Contextual Frameworks

## Hofstede Dimensions (France, applied to UI)

| Dimension | FR Score | UI Implication |
|---|---|---|
| **Uncertainty Avoidance** | High (86) | Explicit labels, confirmation steps, clear status indicators, validation messages. Users need to know what will happen before they act. |
| **Individualism** | High (71) | Personal dashboard ("Mon espace"), customization options, individual progress tracking. |
| **Power Distance** | Moderate (68) | Formal default (vous), professional tone. Hierarchy in layout reflects authority. |
| **Masculinity** | Moderate (43) | Balance achievement signals with quality-of-life messaging. |
| **Long-Term Orientation** | High (63) | Show trends, history, projections. Users value long-term impact framing. |

## High-Context vs Low-Context (Hall)

France = relatively high-context culture. However:
- **B2B admin tools with low-tech users** → default to LOW-context: explicit, labeled, nothing assumed
- **B2C consumer apps for urban tech users** → can use more implicit cues
- **Rule**: When in doubt for low-tech audience, over-explain. Better verbose than ambiguous.

## Color Localization (French Market)

| Color | FR Cultural Association | Safe For | Avoid For |
|---|---|---|---|
| **Blue** | Institutional (La Poste, EDF, government, Crédit Agricole) | Trust, authority, B2B, finance | — |
| **Green** | Health (pharmacie croix verte), nature, eco | Success states, progress, health | Primary in non-health contexts |
| **Red** | Prohibition, danger, urgency (feux, interdiction) | Error states only | Primary brand color, CTAs in trust-focused apps |
| **Orange** | Telecom (Orange SA, SFR legacy) | Warning states, moderate urgency | Heavy primary use (telecom brand confusion) |
| **Yellow** | Caution (chantier, signalisation) | Highlights, badges | Primary (readability issues on white) |
| **Purple** | Luxury, culture | Premium positioning | Utilitarian/B2B tools |
| **Tricolore** | National, official, government | — | Accidental blue-white-red palette in non-gov tools |

## Numeracy & Data Formatting (FR)

| Element | French Convention | Impact on Design |
|---|---|---|
| **Thousands separator** | Space: `1 234,56` | Number columns need adequate width |
| **Decimal** | Comma: `1 234,56 €` | Ensure comma rendering in all fonts |
| **Currency** | After number: `1 234,56 €` | Right-align amounts in tables |
| **Dates** | jj/mm/aaaa | Date pickers must use FR format |
| **Percentages** | `12,5 %` (space before %) | Typographic detail that signals "native" |
| **Phone** | `06 12 34 56 78` | Input masks must handle FR format |

These formatting conventions affect how data-heavy components feel "native" vs "foreign" to FR users.

## Accessibility: RGAA Compliance

Référentiel Général d'Amélioration de l'Accessibilité — French standard (more stringent than WCAG in some areas).

| RGAA Requirement | Brand Token Impact |
|---|---|
| Contrast ratios | Target WCAG AA minimum, AAA preferred. RGAA auditors test stringently. |
| Focus indicators | Must be visible. Brand accent must work as `:focus-visible` ring color. |
| Text resizing | All text must work at 200% zoom. Use rem units, not px for text. |
| Link distinction | Links must differ from body text by more than color alone (underline default). |
| Error identification | Error states must use icon + color + text (not color alone). |
| Language declaration | `<html lang="fr">` — affects screen reader pronunciation. |

**Brand implication**: Tokens must support RGAA from the start. Retrofitting accessibility into an established design system is expensive.
