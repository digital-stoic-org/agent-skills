---
name: infographize
description: Convert markdown documents into AntV infographic SVGs. Analyzes content structure, selects optimal template, generates AntV syntax, and renders to SVG. Use when user wants to create infographics, visual summaries, or storytelling visuals from markdown.
tools: Bash, Read, Write
model: sonnet
---

# Infographize

Convert any markdown document into a visual infographic SVG via AntV Infographic SSR.

## Workflow

1. **Dependency check**: Run `bun run -e "import '@antv/infographic'" 2>/dev/null`. If it fails, install via `install-dependency` skill (`@antv/infographic`, bun package) before proceeding
2. **Read** the source markdown file
2. **Read** `<skill_dir>/reference.md` for template catalog and data field mappings
3. **Analyze** content structure — identify the dominant information type:
   - Bullet lists, features, options → `list-*`
   - Numbered steps, processes, timelines → `sequence-*`
   - Pros/cons, A vs B, SWOT → `compare-*`
   - Nested structure, org chart, taxonomy → `hierarchy-*`
   - Connected items, network, dependencies → `relation-*`
   - Numeric data, percentages, stats → `chart-*`
4. **Select** the best template from the catalog (match content pattern to template's "best for")
5. **Map** markdown content → AntV syntax using the correct data fields for that category
6. **Write** the AntV syntax to a `.txt` file next to the output path
7. **Render** by calling: `bun run <skill_dir>/scripts/render.ts <syntax-file> <output.svg> --preview`

## Output

- Default output: same directory as input, same basename with `.svg` extension
- User can specify a custom output path as second argument

## Content Mapping Rules

- **Be concise**: Infographics are visual-first. Distill prose into short labels (3-7 words) and brief descriptions (1 sentence max)
- **60/40 rule**: Favor graphics over text. Cut detail that doesn't serve the visual narrative
- **One idea per infographic**: If the markdown covers multiple distinct topics, pick the primary one or ask the user
- **Preserve hierarchy**: Map heading levels to visual hierarchy (title → section → item)
- **Extract data**: Pull numbers, percentages, counts into `value` fields when available

## Theme

Default: `light`. User can request `dark`, `hand-drawn`, or custom colors — see reference.md for `themeConfig` options.
