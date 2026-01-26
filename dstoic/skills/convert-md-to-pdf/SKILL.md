---
name: convert-md-to-pdf
description: Convert Markdown files with Mermaid diagrams to styled PDF. Use when user wants to export/convert markdown to PDF, generate PDF documentation, or create printable documents.
tools: Bash, Read, Write
model: sonnet
---

# Convert Markdown to PDF

Convert markdown files to professionally styled PDFs with Mermaid diagram support.

## Usage

```bash
python <skill_dir>/scripts/converter.py <input.md> [output.pdf] [--style=STYLE]
```

## Available Styles

Check `<skill_dir>/styles/` for options:
- `default` - Clean sans-serif, professional
- `modern` - Bold headers, accent colors
- `minimal` - Serif font, whitespace
- `report` - Formal corporate style

## First Run

**Install dependencies** via `install-dependency` skill:

1. **Python packages**: Use `install-dependency` to install from `<skill_dir>/requirements.txt`
2. **Mermaid CLI**: Use `install-dependency` for `@mermaid-js/mermaid-cli`

**Linux setup** (Ubuntu 23.10+ or AppArmor systems):

Create `puppeteer-config.json` in your project root:
```json
{
  "args": ["--no-sandbox", "--disable-setuid-sandbox"]
}
```
This allows Puppeteer (used by Mermaid) to launch Chrome for diagram rendering.

## Adding Styles

Create `.css` file in `<skill_dir>/styles/` directory.
