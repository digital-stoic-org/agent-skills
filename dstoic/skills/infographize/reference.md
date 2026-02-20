# Infographize Reference

## Visual Storytelling Principles

- **60/40 rule**: 60% graphics, 40% text — infographics are visual-first
- **Hierarchy**: Title → section headers → item labels → descriptions. Size and weight decrease with depth
- **Proximity** (Gestalt): Related items grouped spatially. Use template structure to reinforce groupings
- **Balance**: Distribute visual weight evenly. Avoid overloading one side
- **Contrast**: Use color/size to highlight key data. Primary color for emphasis, muted for supporting
- **Simplicity**: One idea per infographic. Split complex content into multiple renders if needed

## Content Analysis → Template Category

| Content pattern | Category | Data field |
|---|---|---|
| Bullet lists, features, options | `list-*` | `lists` |
| Numbered steps, processes, timelines | `sequence-*` | `sequences` |
| Pros/cons, A vs B, SWOT, quadrant | `compare-*` | `compares` |
| Nested structure, org chart, taxonomy | `hierarchy-*` | `root` with `children` |
| Connected items, network, flow | `relation-*` | `nodes` + `relations` |
| Numeric data, percentages, stats | `chart-*` | `values` |

## Template Catalog (Top 20)

### List (5)

| Template ID | Best for |
|---|---|
| `list-row-simple-horizontal-arrow` | Horizontal feature list with flow |
| `list-grid-simple` | Grid layout for 4-8 equal items |
| `list-column-simple-vertical-arrow` | Vertical list with progressive flow |
| `list-pyramid-rounded-rect-node` | Ranked items, importance hierarchy |
| `list-zigzag-up-compact-card` | Alternating layout, visual variety |

### Sequence (4)

| Template ID | Best for |
|---|---|
| `sequence-timeline-rounded-rect-node` | Timeline with detailed steps |
| `sequence-roadmap-vertical-simple` | Project roadmap, milestones |
| `sequence-steps-simple` | Simple numbered steps |
| `sequence-stairs-front-simple` | Progressive/building steps |

### Compare (3)

| Template ID | Best for |
|---|---|
| `compare-binary-horizontal-badge-card-fold` | Two-option comparison |
| `compare-swot` | SWOT analysis (4 quadrants) |
| `compare-quadrant-quarter-simple-card` | 2×2 matrix classification |

### Hierarchy (3)

| Template ID | Best for |
|---|---|
| `hierarchy-tree-horizontal-simple` | Org chart, horizontal tree |
| `hierarchy-tree-vertical-card` | Top-down taxonomy |
| `hierarchy-mindmap-branch-simple-left` | Mind map, brainstorming |

### Relation (3)

| Template ID | Best for |
|---|---|
| `relation-dagre-flow-tb-simple-circle-node` | Top-down flow diagram |
| `relation-circle-icon-badge` | Circular relationship |
| `relation-dagre-flow-lr-simple-circle-node` | Left-right flow diagram |

### Chart (2)

| Template ID | Best for |
|---|---|
| `chart-bar-plain-text` | Bar chart for comparisons |
| `chart-pie-donut-plain-text` | Proportions, market share |

## Data Field Reference

### List / Sequence items
```
lists (or sequences):
  - label: Item title
    desc: Item description
    icon: Optional emoji or URL
    value: Optional numeric value
```

### Compare items
```
compares:
  - label: Option name
    desc: Option description
    lists:
      - label: Sub-item
        desc: Sub-detail
```

### SWOT compare
```
compares:
  - label: Strengths
    lists:
      - label: Point 1
  - label: Weaknesses
    lists:
      - label: Point 1
  - label: Opportunities
    lists:
      - label: Point 1
  - label: Threats
    lists:
      - label: Point 1
```

### Hierarchy (root + children)
```
root:
  label: Root node
  children:
    - label: Child 1
      children:
        - label: Grandchild
    - label: Child 2
```

### Relation (nodes + edges)
```
nodes:
  - id: a
    label: Node A
  - id: b
    label: Node B
relations:
  - from: a
    to: b
    label: Edge label
```

### Chart values
```
values:
  - label: Category A
    value: 42
  - label: Category B
    value: 58
```

## Theme Options

Three built-in themes set via `theme` keyword:
- `light` (default) — clean white background
- `dark` — dark background, light text
- `hand-drawn` — sketch/whiteboard aesthetic

Custom theming via `themeConfig`:
```
themeConfig
  colorPrimary #3B82F6
  colorBg #0F172A
  palette #FBBF24,#3B82F6,#EF4444,#10B981
```

## AntV Syntax Structure

```
infographic <template-id>
  title <infographic title>
  theme <light|dark|hand-drawn>
  themeConfig
    colorPrimary <hex>
    colorBg <hex>
    palette <hex>,<hex>,...
  data
    <data-fields per category>
```

Indentation: 2 spaces per level. All data nested under `data` keyword.
