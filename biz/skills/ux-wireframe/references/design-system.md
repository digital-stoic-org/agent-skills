# Design System

## Defaults

Write `scripts/design-system-defaults.yaml` to `dev/ux/design-system.yaml` on first run if missing.

Three fidelity palettes: `bw` (monochrome), `clean` (semantic colors), `polished` (gradients/shadows).

## Project-Level Overrides

If `dev/ux/design-conventions.md` exists in the project, read it for:
- Custom color palette overrides
- Tech-stack translation hints (e.g., FastHTML component mapping, React equivalents)
- Locale conventions (date format, currency symbol, legal footer requirements)
- Brand-specific patterns (logo placement, typography overrides)

This keeps the skill generic while allowing per-project customization.
