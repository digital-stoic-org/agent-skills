# Brand Archetypes × Tech-Comfort Matrix

## Selection Logic

1. Read empathy map `feels` quadrant + forces `anxiety` and `push` fields
2. Map dominant emotion → primary archetype
3. Mixed emotions → blend adjacent archetypes (weighted by emotion intensity)
4. `--tone` flag overrides artifact-derived archetype

## Axis 1: Emotional Archetypes

### Calming Trust
- **Trigger emotions**: fear, anxiety, uncertainty, overwhelm
- **Color direction**: Cool blues (#3B6FA0–#4A7FB5), muted greens (#2E7D5B), low saturation. NO pure saturated colors. Tinted warm grays (#8B8680).
- **Typography**: System sans, 18px body, 1.6 line-height, 700 headings only (two weights max). Generous spacing. Measure 60ch body.
- **Icons**: Label+icon ALWAYS, never icon-only. Heroicons outline, 24px min.
- **Imagery**: Minimal. If needed: real photos of relatable people, NOT illustrations.
- **Components**: 8px card radius, 6px button radius. No modals. Single column mobile, max 2 col desktop. Visible borders.
- **Motion**: Minimal — loading states and page transitions only. No hover animations.
- **Reference pattern**: Healthcare onboarding, insurance portals, government services

### Urgent Action
- **Trigger emotions**: anger, frustration, time pressure, urgency
- **Color direction**: Warm amber/orange accents (#C2841A, #D97706) on neutral base. High contrast CTAs. NOT aggressive red (connotation: danger/prohibition in FR).
- **Typography**: Strong weight hierarchy (400/600/700), condensed headings, clear labels. Scale ratio 1.333 (perfect fourth).
- **Icons**: Icon+label combos. Filled icons for high-priority actions.
- **Imagery**: Functional only — status indicators, progress visualization.
- **Components**: Prominent CTAs (larger, higher contrast). Status badges. Timeline/progress indicators.
- **Motion**: Fast transitions (100ms). Loading spinners mandatory.
- **Reference pattern**: Emergency services UX, late-payment flows, deadline tools

### Playful Approachable
- **Trigger emotions**: curiosity, low commitment, exploration, delight
- **Color direction**: Bright primary + pastel secondary, warm palette. Higher saturation OK. Complementary accent.
- **Typography**: Friendly geometric sans (Inter, Nunito). Rounded weight contrast. Scale ratio 1.25.
- **Icons**: Flexible — icon-only OK for universal icons. Rounded/friendly icon style (Phosphor, Lucide).
- **Imagery**: Illustrations welcome. Decorative empty states. Brand personality.
- **Components**: Rounded corners (12px cards, 8px buttons). Playful shadows. Card-based layouts.
- **Motion**: Subtle entrance animations, hover effects, micro-delights. Stagger siblings.
- **Reference pattern**: Onboarding flows, freemium tools, consumer apps

### Premium Authority
- **Trigger emotions**: status, professionalism, serious money, competence
- **Color direction**: Dark base (#1E293B) + gold/navy accents. Restrained palette (3 colors max). No bright/playful colors.
- **Typography**: Serif headings OR modern sans with tight tracking (Geist, Inter tight). Minimal ornament. Scale ratio 1.2 (compact).
- **Icons**: Contextual — icon-only OK for high-tech. Thin/outline style. Smaller sizes (20px).
- **Imagery**: Minimal, functional. Data visualizations > decorative images.
- **Components**: Subtle shadows, sharp corners (4px). Dark mode viable. Dense but organized.
- **Motion**: Restrained, elegant. Slow transitions (200ms). No bouncy/playful effects.
- **Reference pattern**: Banking dashboards, legal tools, enterprise SaaS

### Utilitarian Tool
- **Trigger emotions**: efficiency, speed, "just get it done", pragmatism
- **Color direction**: Neutral with ONE functional accent. Minimal color usage. Gray-dominant.
- **Typography**: System fonts, compact sizing (14-15px body). High information density. Scale ratio 1.2.
- **Icons**: Icon+label for nav, icon-only OK in toolbars for power users.
- **Imagery**: None. Text+data only.
- **Components**: Compact spacing. Tables, lists, dense grids. Minimal borders (1px). Small radius (4px).
- **Motion**: Near-zero. Instant feedback only.
- **Reference pattern**: Developer tools, admin panels, accounting software

### Empowering Guide
- **Trigger emotions**: helplessness, need for guidance, learning, first-time anxiety
- **Color direction**: Warm neutrals + encouraging green/teal accents (#2E7D5B). Approachable but not playful.
- **Typography**: Clear hierarchy, generous headings. Instructional microcopy style. Scale ratio 1.25. Body 16-17px.
- **Icons**: Label-always. Instructional icons (arrows, checkmarks, info circles).
- **Imagery**: Functional illustrations for concepts. Step-by-step visuals.
- **Components**: Progress indicators, step-by-step cards, expandable help sections. Generous padding.
- **Motion**: Guided transitions — step reveals, progressive disclosure animations.
- **Reference pattern**: Financial literacy tools, DIY legal, educational platforms

## Axis 2: Tech-Comfort Levels

### Low (1-3)
- Large touch targets (48px+), explicit labels (no icon-only), high contrast
- No animations suggesting complexity, no hover-dependent UI
- Single column mobile, max 2 columns desktop, no sidebars, no modals
- System fonts only — no exotic fonts, no thin weights
- Body text ≥18px, line-height ≥1.6
- Visible borders and separators (implicit grouping fails for this audience)

### Medium (4-6)
- Standard SaaS patterns OK. Icon+label combos. Subtle transitions OK
- Tabs, filters, multi-column layouts acceptable
- Web fonts OK (Inter, Nunito — familiar from mainstream apps)
- Body text 16px, line-height 1.5
- Can handle moderate information density

### High (7-10)
- Compact layouts, icon-only actions, dense dashboards OK
- Keyboard shortcuts, command palettes, advanced filters
- Distinctive fonts OK (Geist, JetBrains Mono for data)
- Body text 14-15px, line-height 1.4-1.5
- High information density, subtle interactions

## Palette Tiers (per archetype)

Each archetype has 3 graduated palette options. Select tier based on brand positioning:

| Archetype | Safe (conservative) | Moderate (default) | Bold (distinctive) |
|---|---|---|---|
| **Calming Trust** | Slate blue #64748B + warm gray | Muted blue #3B6FA0 + sage green #2E7D5B | Teal #0D9488 + warm stone #78716C |
| **Urgent Action** | Warm gray + amber badge #B45309 | Neutral + amber accent #D97706 + charcoal CTA | Dark slate #1E293B + bright amber #F59E0B |
| **Playful Approachable** | Soft blue #60A5FA + light gray | Coral #F97316 + sky #38BDF8 + cream | Purple #8B5CF6 + lime #84CC16 + warm white |
| **Premium Authority** | Navy #1E3A5F + silver #94A3B8 | Dark base #0F172A + gold #B8860B | True black #09090B + rose gold #BE8C63 |
| **Utilitarian Tool** | Pure gray #6B7280 + blue accent #3B82F6 | Slate #475569 + teal accent #0D9488 | Zinc #3F3F46 + indigo accent #6366F1 |
| **Empowering Guide** | Warm beige #D6CFC7 + forest #166534 | Sand #C2B280 + teal #0F766E + warm text | Warm terra #A16207 + deep green #065F46 |

### Typography Tiers (per archetype)

| Archetype | System-safe | Web-font moderate | Distinctive |
|---|---|---|---|
| **Calming Trust** | system-ui, 400/700 | Inter, 400/600 | Source Serif 4 headings + Inter body |
| **Urgent Action** | system-ui, 400/600/700 | Inter Tight, 400/700 | DM Sans condensed heads + Inter body |
| **Playful Approachable** | system-ui rounded | Nunito, 400/600/700 | Plus Jakarta Sans + Nunito body |
| **Premium Authority** | Georgia heads + system-ui | DM Serif Display + Inter | Playfair Display heads + Geist body |
| **Utilitarian Tool** | system-ui, monospace for data | Inter, JetBrains Mono data | Geist + Geist Mono |
| **Empowering Guide** | system-ui, 400/600/700 | Source Sans 3, 400/600 | Lexend heads + Source Sans 3 body |

### Component Styling Tiers

| Archetype | Corner radius | Shadow | Border | Button style |
|---|---|---|---|---|
| **Calming Trust** | 6-8px | none/subtle | 1px solid visible | Filled, rounded, generous padding |
| **Urgent Action** | 4-6px | subtle on CTAs | 1px for structure | High-contrast filled, tight padding |
| **Playful Approachable** | 8-12px | medium, warm | none/subtle | Filled + gradient, bouncy hover |
| **Premium Authority** | 2-4px | subtle, cool | 1px thin, elegant | Ghost/outlined, tight padding |
| **Utilitarian Tool** | 2-4px | none | 1px functional | Minimal, compact, icon+label |
| **Empowering Guide** | 6-8px | subtle | 1px clear | Filled, clear label, progress-aware |

## Blending Rules

When empathy map shows mixed emotions (common):
1. Pick **primary archetype** from strongest emotion (highest intensity/frequency in empathy map)
2. Pick **secondary archetype** from second emotion
3. Apply primary's palette + secondary's interaction patterns
4. Example: "Calming Trust + Urgent Action" = calming palette (blue/muted) + urgent interaction patterns (prominent CTAs, status indicators, progress visibility)

## Override Protocol (`--tone`)

When user specifies `--tone`:
1. Override primary archetype with specified tone
2. Keep tech-comfort from artifacts (unless also overridden)
3. Re-derive all tokens from new archetype × existing tech-comfort
4. Note override in rationale doc: "Archetype manually overridden from {derived} to {specified}"
