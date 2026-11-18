# Iconography & Imagery Strategy

## Icon Recognition Hierarchy (NNG Research)

| Category | Examples | Label Required? |
|---|---|---|
| **Universal** | Hamburger, search, home, close, back arrow, plus | No (but label improves speed) |
| **Semi-universal** | Settings gear, filter funnel, share, bookmark, notification bell | Depends on audience. Low-tech → yes. |
| **Domain-specific** | All others (invoice, relay, mise en demeure, pipeline) | ALWAYS — no exceptions |

**Rule by tech-comfort**:
- Low (1-3): Label+icon for ALL icons. No icon-only ever.
- Medium (4-6): Universal icons OK alone. Semi-universal + domain → need label.
- High (7-10): Icon-only OK for universal + semi-universal. Domain → label.

## Icon Style Families

| Style | Library Examples | Character | Best For |
|---|---|---|---|
| **Outline** | Heroicons Outline, Lucide | Clean, modern, lightweight | Calming Trust, Empowering Guide |
| **Filled** | Phosphor Bold, Material Filled | Higher visual weight, better at small sizes | Urgent Action (priority markers) |
| **Duotone** | Phosphor Duotone | Adds depth, premium feel | Premium Authority, Playful |
| **Hand-drawn** | Untitled UI, Sketchy | Friendly, approachable | Playful Approachable only |

**Consistency rule**: ONE style family per project. Mixing outline + filled = visual noise. Exception: filled for active/selected state of outline icon (semantic toggle).

## Icon Sizing

| Context | Minimum Size | Recommended |
|---|---|---|
| Navigation/toolbar | 20px | 24px |
| Inline with text | 16px (match x-height) | 20px |
| Button with label | 20px | 20px |
| Standalone (feature icon) | 24px | 32-48px |
| Low-tech override | 24px minimum everywhere | 24-32px |

## Illustration vs Photography

| Strategy | When | Signal |
|---|---|---|
| **Minimal (none)** | Utilitarian, low-tech, data-focused | Efficiency, no decoration |
| **Photos** | Low-tech audience needing trust/relatability | "Real business", relatable people |
| **Illustrations** | High-tech, playful, brand personality | "Tech company", modern, scalable |
| **Mixed** | Marketing pages with functional app sections | Brand awareness + utility |

**Low-tech rule**: Photos of relatable people > illustrations. Illustrations signal "tech/startup" which alienates non-tech audiences.

**Photo guidelines** (when used):
- Real people, not models. Diversity appropriate to audience.
- Contextual (person at desk, in workshop) not abstract
- `alt` text always. Decorative → `aria-hidden="true"`

## Empty State Strategy

| Tier | Content | Tech-Comfort Match |
|---|---|---|
| **Tier 1 — Functional** | Text + primary action button | Low (1-3): clear, no confusion |
| **Tier 2 — Helpful** | Icon + explanatory text + action + brief explanation | Medium (4-6): informative |
| **Tier 3 — Delightful** | Illustration + personality text + action + encouragement | High (7-10): brand personality |

## Accessibility Requirements

| Element | Requirement |
|---|---|
| Decorative images | `aria-hidden="true"`, empty `alt=""` |
| Functional images | Descriptive `alt` text |
| Icon buttons | `aria-label` on button element |
| Icon + label | `aria-hidden="true"` on icon (label is sufficient) |
| SVG icons | `role="img"` + `aria-label`, or `aria-hidden` if decorative |
| Color-only meaning | Always encode in 2+ channels (icon + color, text + color) |
