# Design System YAML Schema

## Compatibility

Output must be a superset of `/ux-wireframe`'s `scripts/design-system-defaults.yaml`. All existing fields preserved. New sections safely ignored by older skills.

## Required Fields (downstream skills depend on these)

```yaml
colors:
  bw:                          # Monochrome fidelity
    bg: str                    # Background
    surface: str               # Card/section background
    border: str                # Borders, dividers
    text: str                  # Primary text
    text-secondary: str        # Secondary/muted text
    accent: str                # Accent (same as text in bw)
    cta: str                   # CTA (same as text in bw)
  clean:                       # Semantic color fidelity
    bg: str                    # Never pure #FFF — tint with 2-5% primary
    surface: str               # 5% primary mixed into neutral
    border: str
    text: str                  # Never pure #000 — use dark slate
    text-secondary: str        # Must pass WCAG AA on bg
    accent: str                # Primary brand color
    cta: str                   # CTA color (often darker primary)
    success: str               # Green family
    warning: str               # Amber family (not orange)
    error: str                 # Muted red family
  polished:                    # Extended palette
    # Same as clean + gradients, shadows, elevated surfaces

typography:
  font-family: str             # Body font stack
  heading-1: str               # "size / weight" format
  heading-2: str
  body: str
  small: str
  cta: str

spacing:
  xs: str                      # rem values
  sm: str
  md: str
  lg: str
  xl: str
  section: str

breakpoints:
  mobile: str                  # "375px"
  tablet: str                  # "768px"
  desktop: str                 # "1024px"

components:
  card: str                    # CSS shorthand
  button-primary: str
  input: str
```

## Brand Metadata (new — added by /ux-brand)

```yaml
brand:
  archetype: str               # Primary archetype ID
  archetype-secondary: str     # Optional blend
  tech_comfort: int            # 1-10
  subject: str                 # Artifact subject
  generated: str               # YYYY-MM-DD
  rationale: str               # Path to rationale doc
```

## Extended Sections (new — optional for downstream)

```yaml
colors:
  clean:
    # Additional to required fields:
    primary: str               # Named primary (may differ from accent)
    primary-light: str         # Light tint for backgrounds
    cta-hover: str             # Hover state
    error-light: str           # Error background tint

typography:
  heading-family: str          # If different from body
  scale-ratio: float           # 1.2 | 1.25 | 1.333 | 1.618
  body-size: str               # rem value
  body-line-height: float
  body-weight: int
  heading-weight: int
  heading-line-height: float
  measure-body: str            # ch value
  measure-hero: str
  strategy: str                # "system-default-safe" | "web-font-moderate" | "distinctive"

icons:
  strategy: str                # "label-always" | "icon-label" | "contextual"
  library: str                 # "heroicons-outline" | "lucide" | "phosphor" | etc.
  size-default: str
  size-small: str
  color: str                   # "currentColor"

imagery:
  strategy: str                # "zero-asset" | "minimal" | "photos" | "illustrations" | "mixed"
  photos: bool
  illustrations: bool
  empty-states: str            # "text-with-icon" | "text-only" | "illustration"
  # Zero-asset visual strategy (when strategy = "zero-asset" or "minimal")
  # Common for early-stage nano-apps with no design budget
  visual-layers:               # Ordered list of visual substitutes for imagery
    - str                      # "emoji" | "color-blocks" | "typography-as-design" | "whitespace"
  emoji-vocabulary:            # Semantic emoji mapping (when emoji is a visual layer)
    # Map UI concepts → consistent emoji. One emoji per concept, never decorative.
    # Example: { status-done: "✅", status-overdue: "🔴", status-pending: "⏳",
    #            action-generate: "📄", action-share: "📱", alert: "⚠️" }
    map: dict[str, str]
  hero-style: str              # "gradient" | "solid-color" | "none"
  hero-gradient: str           # CSS gradient value (when hero-style = "gradient")
  stat-cards: bool             # Use large-number stat cards as visual anchors
  upgrade-path: str            # What to invest in for v2+ (e.g., "line illustrations")

corners:
  button: str
  card: str
  modal: str
  input: str
  pill: str

motion:
  strategy: str                # "minimal" | "standard" | "expressive"
  hover-duration: str
  transition-duration: str
  easing-enter: str
  easing-exit: str
  reduced-motion: bool         # Always true

touch:
  min-target: str              # "44px" minimum, "48px" for low-tech
  spacing-between-targets: str
```

## Validation Rules

1. **Contrast**: All text-on-bg pairs must pass WCAG AA (4.5:1 body, 3:1 large)
2. **No pure black/white**: text ≠ #000000, bg ≠ #FFFFFF
3. **Tinted neutrals**: surface/border colors must contain primary hue tint (5-10%)
4. **Spacing scale**: Must use 4px base (values divisible by 4)
5. **Breakpoint order**: mobile < tablet < desktop
6. **BW palette**: accent and cta must equal text (true monochrome)
7. **Font stack**: Must include system fallbacks
