# Design Rules & Anti-Patterns

Complete design knowledge for `/ux-polish`. Perceptual foundations → compositional frameworks → applied rules → anti-patterns → domain patterns.

---

## 1. Perceptual Foundations (How Humans See)

### Gestalt Principles

Every spacing, grouping, and layout decision should be traceable to a Gestalt principle. These are NOT optional theory — they are the physics of visual perception.

| Principle | What the eye does | Design application |
|-----------|-------------------|-------------------|
| **Proximity** | Elements close together are perceived as a group | Related items share tighter spacing (8-12px) than unrelated items (24-48px). Spacing IS grouping — it's semantic, not decorative. |
| **Similarity** | Elements that look alike are perceived as related | Same color/size/shape = same category. Variation signals semantic difference. Use to create scannable patterns in lists/dashboards. |
| **Closure** | The brain completes incomplete shapes | Cards don't need full borders — a background fill or partial divider is enough. Reduce visual noise by implying containers rather than drawing them. |
| **Continuity** | The eye follows lines and curves | Align elements along invisible lines. Left-aligned text creates a strong vertical axis. Misalignment breaks flow and feels broken. |
| **Figure-Ground** | The brain separates foreground from background | CTAs must be unambiguously foreground (high contrast, solid fill). Modals need clear separation (overlay + shadow). Backgrounds should recede. |
| **Common Region** | Elements inside a boundary are perceived as grouped | Cards, containers, colored backgrounds create groups. But nesting regions (card-in-card) creates ambiguity — use sparingly (max 1 level). |
| **Focal Point** | The eye goes first to the element that breaks the pattern | One dominant element per viewport. Create focal points through size, color contrast, isolation (whitespace), or motion. Multiple focal points = no focal point. |
| **Prägnanz (Simplicity)** | The brain prefers the simplest interpretation | Ambiguous layouts cause cognitive friction. If a user must think about whether two elements are related, the design has failed. Make relationships obvious. |

### Pre-Attentive Attributes (Processed in <250ms)

These are the visual properties the brain processes before conscious thought. Use them for the most critical information:

| Attribute | Strength | Best for |
|-----------|----------|----------|
| **Color hue** | Very strong | Status (red=error, green=success), categorization |
| **Color intensity/saturation** | Strong | Emphasis (saturated = important, desaturated = secondary) |
| **Size** | Very strong | Hierarchy (biggest = most important) |
| **Position** | Strong | Sequence, priority (top-left = first in LTR cultures) |
| **Orientation** | Medium | Distinguishing categories in data visualization |
| **Motion** | Very strong (attention-grabbing) | Alerts, state changes — use sparingly or it overwhelms |
| **Enclosure** | Medium | Grouping (borders, backgrounds) |

**Rule**: Never encode meaning in only one pre-attentive channel. Red text + icon for errors (color + shape). Bold + size for headings (weight + size). Accessibility requires redundant encoding.

### Visual Weight

Every element has visual weight determined by:

| Factor | Heavier | Lighter |
|--------|---------|---------|
| Size | Larger | Smaller |
| Color | Saturated, dark | Desaturated, light |
| Density | Complex, detailed | Simple, minimal |
| Isolation | Surrounded by whitespace | Crowded among peers |
| Shape | Irregular, complex | Regular, geometric |
| Texture | Textured, patterned | Flat, solid |
| Position | Lower on page (gravity) | Higher on page |

**Balance**: Aim for asymmetrical balance (more natural, dynamic) over symmetrical (formal, static). Place heavy elements off-center and balance with lighter distributed elements. A single bold CTA on the left can be balanced by a text block on the right.

### Reading & Scanning Patterns

| Pattern | When it applies | Layout implication |
|---------|----------------|-------------------|
| **F-Pattern** | Text-heavy pages, lists, search results | Place key info in first 2 words of each line. Left column is premium real estate. |
| **Z-Pattern** | Minimal pages, landing, hero sections | Logo top-left → nav top-right → hero content bottom-left → CTA bottom-right |
| **Gutenberg Diagram** | Evenly distributed content (no strong hierarchy) | Primary optical area (top-left) → terminal area (bottom-right). Place CTA in terminal area. |
| **Layer Cake** | Long scrolling pages | Bold headings as horizontal "layers" — users scan heading-to-heading, diving into content when relevant. |

**Mobile override**: On mobile (<768px), all patterns collapse to a single column top-to-bottom scan. Hierarchy becomes purely vertical: most important content first.

---

## 2. Compositional Frameworks (How to Arrange)

### Visual Hierarchy Stack

When deciding which element should dominate, apply these levers in order of power:

```
Size (most powerful)
  > Color / Contrast
    > Weight (font-weight, border-weight)
      > Position (top-left in LTR = primary)
        > Proximity (isolated = more important)
          > Typography (serif vs sans, case)
            > Texture / Detail (least powerful)
```

**Rule of one**: Each viewport should have exactly ONE dominant element (usually the CTA or key message). Everything else supports it. If two elements compete for attention, the hierarchy has failed.

### Grid Systems

| Grid type | Structure | Use |
|-----------|-----------|-----|
| **Column grid** | 4-col mobile, 8-col tablet, 12-col desktop | Page-level layout. Gutters: 16px mobile, 24px tablet, 32px desktop. |
| **Modular grid** | Columns + rows = cells | Dashboards, card layouts, image galleries. Creates uniform modules. |
| **Baseline grid** | Horizontal lines at fixed intervals (4px or 8px) | Vertical rhythm. All text baselines and spacing should snap to the grid. |
| **Soft grid** | Flexible proportions (golden ratio, rule of thirds) | Hero sections, artistic layouts. 61.8% / 38.2% split. |

**Column math**: Element width = (N × column-width) + ((N-1) × gutter-width). Content never bleeds into gutters.

### Alignment Theory

| Type | When to use | CSS |
|------|-------------|-----|
| **Edge alignment** | Default for all content — creates strong vertical axes | `text-align: left` (LTR), consistent padding |
| **Center alignment** | Short text only (headings, CTAs, hero copy). Never for paragraphs. | `text-align: center` for <3 lines max |
| **Optical alignment** | Icons, certain letter shapes (T, V, W, O) don't align mathematically | Nudge left/up by 1-2px to look aligned. Especially for play buttons, dropdown arrows. |
| **Baseline alignment** | Text at different sizes on the same line | `align-items: baseline` not `center` |

**Alignment rule**: Every element must align to at least one other element. Rogue elements that align to nothing create visual tension. When in doubt, left-align everything.

**Optical vs mathematical**: A circle inside a square container must be slightly larger than the square to appear the same size. A play button (triangle) must be shifted right ~2px to appear centered. Always check visually, not just in code.

### White Space (Negative Space)

White space is an active design element, not empty space. It performs specific functions:

| Type | Scale | Function |
|------|-------|----------|
| **Micro** | 4-12px | Breathing room between related elements (label-to-input, icon-to-text) |
| **Meso** | 16-32px | Separation within components (card padding, list item gaps) |
| **Macro** | 48-96px | Section breaks, page margins, hero breathing room |
| **Active** | Variable | Intentional emptiness that draws attention to adjacent content (luxury feel) |

**Rules**:
- More whitespace = more premium/professional feel. Less = more dense/utilitarian.
- Whitespace around a CTA increases its visual importance (isolation = weight).
- Uneven margins feel intentional and dynamic; equal margins feel static and generic.
- Hero sections need generous macro whitespace — 64-96px padding minimum.
- Dense data screens (dashboards, tables) use micro whitespace to maximize information while maintaining readability.

### Consistency & Repetition

| Principle | Application |
|-----------|-------------|
| **Identical treatment = identical function** | All primary buttons must look the same everywhere. Same font size for all body text. Same card style for same content type. |
| **Variation = semantic difference** | If two buttons look different, they MUST function differently. Visual inconsistency without meaning is a design bug. |
| **Repeating patterns create learnability** | Consistent card layouts let users predict content. Consistent icon placement builds muscle memory. |
| **Cross-screen coherence** | Navigation position, header treatment, footer pattern, color usage must be identical across all screens. |
| **Token reuse** | All values should come from design tokens (CSS custom properties). Ad-hoc values (arbitrary 13px, #3A7BC8) signal inconsistency. |

### Progressive Disclosure (Information Density)

| Screen type | Density | Strategy |
|-------------|---------|----------|
| **Landing/Hook** | Low | One message, one CTA. Everything else is supporting evidence. |
| **Form/Wizard** | Medium | Show one step at a time. Validate inline. Hide advanced options behind "Plus d'options". |
| **Dashboard** | High | Summary stats first, details on demand. Expandable rows, hover tooltips, drill-down links. |
| **Data table** | Very high | Fixed headers, sortable columns, row hover highlight. Tufte's data-ink ratio: maximize data, minimize decoration. |
| **Settings** | Medium-low | Group by category. Use toggles for binary. Show current state before edit state. |

**Tufte's data-ink ratio**: In data-heavy screens, every pixel of ink should represent data. Remove gridlines, reduce borders, eliminate chart junk. A table with zebra stripes and heavy borders has low data-ink ratio.

---

## 3. Anti-Patterns (NEVER Produce These)

```yaml
typography:
  - pattern: "font-family: 'Inter', sans-serif"
    why: Overused LLM output, signals AI-generated
    fix: system-ui stack or serif+sans pairing
  - pattern: "color: #000000"
    why: Pure black harsh, unnatural
    fix: "#1E293B or tinted dark from palette"
  - pattern: "font-weight: 400 everywhere"
    why: No typographic hierarchy
    fix: "Headings 600-700, body 400, captions 300-400"
  - pattern: "single font-size throughout"
    why: No visual hierarchy
    fix: "Modular scale 1.25 ratio (12/15/19/24/30/37)"
  - pattern: "letter-spacing: 0 on headings >24px"
    why: Large text needs negative tracking to appear optically correct
    fix: "letter-spacing: -0.02em for 24-36px, -0.03em for 36px+"
  - pattern: "same line-height for all sizes"
    why: Large text with 1.5 line-height looks gapped
    fix: "Body 1.5, headings 1.2, display/hero 1.05-1.1"
  - pattern: "center-aligned paragraphs"
    why: Ragged on both sides, extremely hard to read
    fix: Left-align all body text. Center only short headings/CTAs.

color:
  - pattern: "gray text on colored background"
    why: Contrast failure, washed out
    fix: Tint gray toward background hue
  - pattern: "pure white #FFFFFF background"
    why: Clinical, fatiguing
    fix: "#FAFAFA or warm-tinted near-white"
  - pattern: "semantic colors without tinting"
    why: Feels disconnected from brand
    fix: Tint success/warning/error toward primary hue
  - pattern: "meaning encoded in color alone"
    why: Color-blind users (~8% of males) lose information
    fix: "Color + icon + text. Red error + ⚠ icon + message."
  - pattern: "random hex colors (#3A7BC8)"
    why: Ad-hoc colors create visual chaos, unmaintainable
    fix: All colors from design tokens. Every color maps to a semantic role.
  - pattern: "complementary colors at full saturation adjacent"
    why: Vibration/halation at boundaries (red on green, blue on orange)
    fix: Desaturate one, or separate with neutral space

layout:
  - pattern: "card > card > card nesting"
    why: Visual noise, unclear hierarchy (violates Gestalt Prägnanz)
    fix: Max 1 level nesting, use spacing instead
  - pattern: "border-radius: 8px on everything"
    why: Monotonous, no visual variety
    fix: "Buttons 6px, cards 12px, modals 16px, pills 9999px"
  - pattern: "equal spacing everywhere (16px)"
    why: "No rhythm, flat hierarchy (violates Gestalt Proximity)"
    fix: "Use 4px scale: tight=8, default=16, loose=24, section=48"
  - pattern: "elements aligned to nothing"
    why: Rogue elements create visual tension (violates Continuity)
    fix: Every element aligns to at least one grid line or other element
  - pattern: "multiple focal points competing"
    why: "User doesn't know where to look (violates Focal Point)"
    fix: One dominant element per viewport. Everything else supports it.
  - pattern: "symmetrical centered layout for everything"
    why: Static, generic, LLM-default
    fix: Asymmetrical balance. Off-center hero text + right image. Left-heavy forms.

motion:
  - pattern: "transition: all 0.3s ease"
    why: "'ease' asymmetric, 0.3s too slow for micro-interactions"
    fix: "ease-out entrances (0.2s), ease-in exits (0.15s)"
  - pattern: "no transitions at all"
    why: Static, unresponsive feeling
    fix: Add hover/focus transitions on all interactive elements
  - pattern: "missing prefers-reduced-motion"
    why: Accessibility failure
    fix: "@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }"
  - pattern: "animation on page load without purpose"
    why: Delays content consumption, annoying on repeat visits
    fix: Animate only on state change or user action. Content should be immediately visible.

interaction:
  - pattern: "no focus-visible styles"
    why: Keyboard users invisible
    fix: "outline: 2px solid primary; outline-offset: 2px"
  - pattern: "disabled with just opacity"
    why: Not enough signal
    fix: "opacity: 0.5 + cursor: not-allowed + aria-disabled"
  - pattern: "spinner for loading"
    why: No spatial context
    fix: Skeleton placeholder matching content shape
  - pattern: "error as alert/toast only"
    why: User must remember which field caused it
    fix: Inline error below field + scroll to first error + border color change
```

---

## 4. Typography Rules

| Rule | Value | Why |
|------|-------|-----|
| Font pairing | Serif headings + sans body (or reverse) | Contrast creates hierarchy. Same family = no contrast. |
| Modular scale | 1.25 (body-heavy), 1.333 (display-heavy), 1.414 (hero-heavy) | Choose by screen type. Hero/landing → larger ratio. |
| Body line-height | 1.5 | WCAG 1.4.12 recommendation |
| Heading line-height | 1.15-1.25 (smaller for larger sizes) | Tighter for large text, looser for small headings |
| Display/hero line-height | 1.05-1.1 | Very tight for impact |
| Measure (line length) | 45-75ch (body), 20-35ch (hero) | Optimal reading speed |
| Weight hierarchy | H1:700, H2:600, H3:500, body:400, caption:300 | Visual scanning |
| System font stack | `system-ui, -apple-system, 'Segoe UI', sans-serif` | Fast, native feel |

### Typography Advanced

| Rule | Value | Why |
|------|-------|-----|
| Tracking (letter-spacing) | Body: 0. Headings >24px: -0.02em. Display >36px: -0.03em. ALL-CAPS: +0.05-0.1em. | Large text needs tightening; caps need loosening |
| Optical sizing | `font-optical-sizing: auto` for variable fonts | Adjusts stroke weight for size — thin strokes at small sizes, heavier at display |
| Baseline grid | All text baselines snap to 4px or 8px grid | Creates vertical rhythm across columns and components |
| Typographic color | Even density of text blocks — no rivers, no widows, no orphans | `text-wrap: balance` for headings, `text-wrap: pretty` for body (CSS) |
| Paragraph spacing | 0.5-1em between paragraphs (NOT just line-height) | `margin-bottom: 0.75em` for body paragraphs |
| Hanging punctuation | `hanging-punctuation: first last` | Quotes and bullets align optically with text edge |
| Tabular numbers | `font-variant-numeric: tabular-nums` for data/tables/prices | Columns of numbers align vertically |
| Small caps | `font-variant-caps: all-small-caps` for abbreviations (PDF, API) | Proper small caps, not just font-size reduction |
| Hyphenation | `hyphens: auto` for justified text, `hyphens: none` for left-aligned | Prevents large gaps in justified text |
| Underline style | `text-decoration-thickness: 1px; text-underline-offset: 3px` | Doesn't cut through descenders |

---

## 5. Color Rules

| Rule | Implementation |
|------|---------------|
| Color space | OKLCH preferred — perceptually uniform (equal ΔL = equal perceived brightness change) |
| Tinted neutrals | Mix 5-10% of primary into gray scale |
| Semantic roles | `--color-success`, `--color-warning`, `--color-error`, `--color-info` |
| Contrast minimum | WCAG AA (4.5:1 body, 3:1 large text) |
| Body text contrast | Target AAA (7:1) |
| Dark backgrounds | Tint toward primary, never pure `#000` |
| Surface hierarchy | `--surface-0` (lowest) through `--surface-3` (highest) |
| Brand application | Primary on CTAs, secondary on accents, neutral on body |

### Color Harmony & Theory

| Scheme | Relationship | Use | Feeling |
|--------|-------------|-----|---------|
| **Monochromatic** | Single hue, varying lightness/saturation | Safe, professional, minimal | Cohesive, calm, can be monotonous |
| **Analogous** | Adjacent hues (within 30° on wheel) | Default for cohesive UI. Primary + neighbors. | Harmonious, natural, warm/cool bias |
| **Complementary** | Opposite hues (180° apart) | Accent color only. CTA on complementary background. | High contrast, energetic. Overuse = vibrating. |
| **Split-complementary** | Base + two adjacent to complement | Vibrant but less tension than full complementary | Dynamic, balanced, good for rich UIs |
| **Triadic** | Three equidistant hues (120° apart) | Multi-category dashboards, data visualization | Colorful, balanced. Desaturate 2 of 3. |

**Palette generation algorithm**:
1. Start with brand primary (from design-system.yaml)
2. Generate analogous secondary (±30° in OKLCH hue)
3. Generate complementary accent (180° for emphasis moments)
4. Derive neutral scale by mixing 5-10% of primary into gray
5. Derive semantic colors by tinting standard red/amber/green/blue toward primary
6. Test all combinations for WCAG AA contrast

**60-30-10 rule**: 60% neutral/background, 30% secondary/supporting, 10% primary/accent. The 10% draws the eye precisely because it's rare.

### Color Accessibility

| Condition | Prevalence | What breaks | Fix |
|-----------|-----------|-------------|-----|
| Deuteranopia (red-green) | 6% of males | Red vs green status indicators | Add icons: ✓ success, ✕ error, ⚠ warning |
| Protanopia (red-weak) | 1% of males | Red appears dark/muddy | Don't rely on red saturation alone |
| Tritanopia (blue-yellow) | 0.01% | Blue vs yellow | Rare, but maintain contrast ratios |
| Achromatopsia (no color) | 0.003% | All color meaning | Ensure hierarchy works in grayscale |

**Test**: Desaturate the entire page to grayscale. If hierarchy and meaning are preserved, color usage is accessible.

---

## 6. Spacing Rules

| Scale step | Value | Use |
|------------|-------|-----|
| 1 | 4px | Tight inline spacing |
| 2 | 8px | Icon gaps, compact padding |
| 3 | 12px | Small component padding |
| 4 | 16px | Default padding, list gaps |
| 6 | 24px | Card padding, form gaps |
| 8 | 32px | Section padding (mobile) |
| 12 | 48px | Section breaks |
| 16 | 64px | Major section separation |
| 24 | 96px | Hero/page top padding |

**Rhythm**: Consistent vertical rhythm between sections. Double space before new sections, single space within.

**Gestalt spacing rule**: Space within a group < space between groups. Always. If card padding = inter-card gap, the grouping is ambiguous.

---

## 7. Motion Rules

| Context | Easing | Duration | Why |
|---------|--------|----------|-----|
| Enter/appear | ease-out | 200ms | Decelerate into rest position |
| Exit/dismiss | ease-in | 150ms | Accelerate away |
| Hover state | ease-out | 100-150ms | Snappy micro-interaction |
| Page transition | ease-in-out | 300-500ms | Smooth large movement |
| Stagger siblings | +50ms each | — | Natural cascade |
| Skeleton pulse | ease-in-out | 1.5s infinite | Gentle loading indication |

**Always include**:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Motion Principles

- **Purposeful**: Every animation must communicate something (state change, spatial relationship, feedback). Decorative animation is noise.
- **Natural**: Follow physics — objects accelerate from rest (ease-in) and decelerate to rest (ease-out). Never linear for UI (feels robotic).
- **Hierarchical**: More important state changes get more prominent animation. Button hover = subtle. Page transition = noticeable. Error shake = attention-grabbing.
- **Continuity**: Related elements should animate together or in sequence. Staggered list items (50ms delay) feel connected. Simultaneous animation of unrelated elements feels chaotic.

---

## 8. Interaction Rules

| Element | Hover | Focus | Active | Disabled |
|---------|-------|-------|--------|----------|
| CTA button | Darken 10%, subtle lift shadow | 2px outline primary | Scale 0.98 | opacity 0.5 + not-allowed |
| Text link | Underline offset transition | 2px outline | Darken color | opacity 0.5 |
| Card | Subtle shadow lift | 2px outline | — | opacity 0.5 |
| Nav item | Background tint | 2px outline | Background darker | opacity 0.5 |
| Form input | Border color primary | 2px outline primary | — | bg gray + not-allowed |
| Icon button | Background circle appear | 2px outline | Scale 0.95 | opacity 0.5 |

**Error states**: Inline below field, red-tinted. Format: "what happened" + "how to fix".
**Empty states**: Illustration + explanation + action CTA.
**Loading**: Skeleton > spinner. Match content shape.

### Affordance & Signifiers

| Principle | Application |
|-----------|-------------|
| **Clickable things look clickable** | Buttons have fill/border + cursor:pointer. Links have color + underline. Flat text that is clickable = design failure. |
| **Hover reveals interactivity** | Cursor change + visual state change confirms "yes, this is interactive" |
| **State changes are visible** | Every state (default, hover, focus, active, disabled, loading, error, success) must be visually distinct |
| **Feedback is immediate** | Click → instant visual response (<100ms). If processing takes time, show loading state immediately. |
| **Undo over confirmation** | "Action effectuée. Annuler" > "Êtes-vous sûr ?" (less disruptive, more forgiving) |

---

## 9. Responsive Rules

| Breakpoint | Width | Target |
|------------|-------|--------|
| Mobile (default) | 375px+ | Primary design target |
| Tablet | 768px+ | Expanded layouts |
| Desktop | 1024px+ | Full layouts |
| Large desktop | 1440px+ | Max content width, centered |

- Mobile-first: base styles = mobile, `@media (min-width:)` for larger
- Container queries over media queries when possible
- Touch targets: 44×44px minimum
- Thumb zone: primary actions in bottom 60% on mobile
- Never horizontal scroll
- Stack columns on mobile, side-by-side on tablet+
- Max content width: 1200px centered on large screens (prevent ultra-wide line lengths)
- Fluid typography: `clamp(1rem, 0.5rem + 1.5vw, 1.5rem)` for responsive sizing without breakpoints

---

## 10. Cognitive Load & Usability Heuristics

### Nielsen's Heuristics (for audit/critique)

| # | Heuristic | What to check |
|---|-----------|---------------|
| 1 | **Visibility of system status** | Loading states, progress indicators, current location (breadcrumbs, active nav) |
| 2 | **Match real world** | French B2B language, familiar metaphors, natural order (chronological, alphabetical) |
| 3 | **User control & freedom** | Undo/cancel always available, clear exit paths, back button works |
| 4 | **Consistency & standards** | Same component = same appearance everywhere, platform conventions respected |
| 5 | **Error prevention** | Confirmation for destructive actions, smart defaults, inline validation |
| 6 | **Recognition over recall** | Show options (dropdowns over free text), visible labels, persistent context |
| 7 | **Flexibility & efficiency** | Keyboard shortcuts for power users, recent items, smart defaults |
| 8 | **Aesthetic & minimalist design** | Every element earns its place. No decorative noise. Information hierarchy. |
| 9 | **Help users recover from errors** | Clear error messages (what + why + how to fix), non-destructive |
| 10 | **Help & documentation** | Contextual help (tooltips, inline hints), not separate help pages |

### Cognitive Load Reduction

| Technique | Application |
|-----------|-------------|
| **Hick's Law** | Fewer choices = faster decisions. Max 5-7 items in a navigation. Max 3 CTAs per screen (1 primary, 2 secondary). |
| **Miller's Law** | Chunk information into groups of 5±2. Phone numbers: 06 12 34 56 78 (not 0612345678). |
| **Fitts's Law** | Important targets are large and close to cursor/thumb. CTA buttons: min 44px height, full-width on mobile. |
| **Jakob's Law** | Users spend most time on OTHER sites. Use familiar patterns (hamburger menu, search icon, card layouts). |
| **Doherty Threshold** | System response <400ms feels instant. Show loading if >400ms. Show progress if >1s. |
| **Von Restorff Effect** | The distinctive item is remembered. One red CTA among gray buttons. One bold stat among regular text. |
| **Serial Position Effect** | Users remember first and last items. Important nav items at start and end, not middle. |
| **Zeigarnik Effect** | Incomplete tasks are remembered. Progress bars, step indicators ("étape 2 sur 4") motivate completion. |

---

## 11. UX Writing (French B2B context)

| Pattern | Good | Bad |
|---------|------|-----|
| CTA verbs | "Envoyer le message" | "Soumettre" |
| Error msg | "L'email n'a pas pu être envoyé — vérifiez l'adresse" | "Erreur" |
| Empty state | "Aucun résultat — essayez d'autres critères" + action | Blank page |
| Formal register | "Vous" (always in B2B) | "Tu" |
| Date format | "19 mars 2026" | "03/19/2026" |
| Currency | "1 250,00 €" | "€1,250.00" |
| Microcopy tone | Helpful, concise, action-oriented | Technical jargon, passive voice |
| Confirmation | "Message envoyé avec succès" | "Opération effectuée" |
| Destructive action | "Supprimer cet élément ? Cette action est irréversible." | "Confirmer ?" |
| Help text | "Format attendu : nom@entreprise.fr" | "Email invalide" |

---

## 12. Design System Integration

**Reading `design-system.yaml`**:
- `colors.primary`, `colors.secondary` → CTA and accent
- `colors.neutral` → tinted gray scale
- `colors.semantic` → success/warning/error/info
- `typography.heading_font`, `typography.body_font` → font pairing
- `spacing.base` → spacing scale multiplier
- `border_radius` → component-specific radii

**On `colorize`**: Read `bw` palette → apply color harmony algorithm (analogous secondary, complementary accent) → generate tinted neutrals → test WCAG contrast → write back
**On `polish`**: Read all tokens → apply consistently across all files → report any missing tokens → verify cross-screen consistency

---

## 13. FastHTML Compatibility

- CSS custom properties → map to FastHTML theme variables
- BEM-like class naming → component classes
- **Never strip**: `hx-*`, `data-*`, `cls=`, FastHTML-specific attributes
- Inline `<style>` blocks preferred (self-contained HTML)
- No external CDN dependencies
