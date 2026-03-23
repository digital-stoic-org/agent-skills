# Typography Strategy

## Typographic Hierarchy (Müller-Brockmann)

3 levels minimum, each visually distinct (size + weight + spacing):

| Level | Role | Differentiation |
|---|---|---|
| Display/Hero | Page title, key message | Largest, heaviest, tightest line-height (1.1-1.2) |
| Body | Content text | Medium size, regular weight, comfortable line-height (1.5-1.6) |
| Caption/Meta | Dates, labels, secondary info | Smallest, lighter weight or color differentiation |

**Failure test**: If two levels look similar at arm's length, hierarchy fails.

## Modular Scale Ratios

| Ratio | Name | Character | Use When |
|---|---|---|---|
| 1.125 | Major second | Tight, dense | High-tech, data-heavy dashboards |
| 1.2 | Minor third | Compact, tool-like | Utilitarian, Premium Authority, high info density |
| 1.25 | Major third | Comfortable default | Calming Trust, Empowering Guide, medium-tech |
| 1.333 | Perfect fourth | Generous, editorial | Urgent Action (strong hierarchy), marketing pages |
| 1.5 | Perfect fifth | Dramatic | Hero sections, landing pages only |
| 1.618 | Golden ratio | Very dramatic | Marketing, editorial — too dramatic for tools |

**Selection**: archetype drives base ratio, tech-comfort adjusts. Low-tech → larger ratio (more distinction). High-tech → tighter ratio (more density).

## Font Strategy by Tech-Comfort

| Strategy | Stack | Signal | When |
|---|---|---|---|
| **System-default-safe** | `system-ui, -apple-system, 'Segoe UI', sans-serif` | Maximum familiarity, "native" feel | Tech-comfort 1-4, Calming Trust, Utilitarian |
| **Web-font-moderate** | Inter, Nunito, Source Sans 3 | "Modern app" feel, still approachable | Tech-comfort 4-7, Playful, Empowering Guide |
| **Distinctive** | Geist, Plus Jakarta Sans, DM Sans | "Design tool" feel, premium | Tech-comfort 7-10, Premium Authority |

**Heading + body pairings** (safe combinations):
- System + System (same family, weight contrast only) — safest
- Serif heading + sans body (classic editorial) — authority signal
- Geometric heading + humanist body (modern) — tech-forward

**Never pair**: Two fonts from same classification. Two decorative fonts. Serif body in UI (legibility risk on screens).

## Readability Parameters

| Parameter | Low-tech (1-3) | Medium (4-6) | High (7-10) |
|---|---|---|---|
| Body size | 18px (1.125rem) | 16px (1rem) | 14-15px |
| Line-height | 1.6 | 1.5 | 1.4-1.5 |
| Measure (body) | 55-60ch | 60-70ch | 65-75ch |
| Measure (hero) | 20-25ch | 25-30ch | 25-35ch |
| Weight levels | 2 (400, 700) | 3 (400, 600, 700) | 3-4 (300-700) |
| Letter-spacing body | Normal | Normal | -0.01em OK |
| Heading tracking | Normal | -0.01em | -0.02em |

## Legibility vs Readability

- **Legibility**: Individual character distinction — critical for low-literacy, elderly, small screens
  - Prefer fonts with open counters (a, e, g), distinct l/1/I, clear 0/O
  - System UI fonts score well on legibility
- **Readability**: Ease of reading text blocks — line-height, measure, weight, spacing
  - Low-tech → prioritize BOTH legibility AND readability
  - High-tech → readability sufficient (users are font-literate)

## Optical Sizing

| Size | Adjustment |
|---|---|
| < 14px | Increase weight slightly (400→450 or medium) |
| 14-24px | Standard weight |
| > 36px | Consider light/regular variant (heavy text at large size looks oppressive) |

## OpenType Features (when available)

| Feature | Use Case |
|---|---|
| `tabular-nums` | Price columns, statistics, tables — prevents number width jitter |
| `oldstyle-nums` | Running text (less disruptive than lining figures) |
| `small-caps` | Labels, abbreviations (EUR, TVA, SIRET) |
| `hanging-punctuation` | Pull quotes, editorial content |
| `font-variant-ligatures` | Default on for body text |
