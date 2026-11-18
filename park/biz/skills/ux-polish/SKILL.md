---
name: ux-polish
description: Visual design quality skill — elevates HTML wireframes from structural prototypes to polished UI. Applies typography, color, spacing, motion, interaction polish. Works on /ux-wireframe output or any HTML. Use when "ux polish", "polish wireframe", "colorize", "design audit", "design critique", "visual polish", "add color", "improve design".
allowed-tools: ["Read", "Write", "Glob", "Grep", "Bash", "AskUserQuestion"]
model: sonnet
context: subagent
user-invocable: true
argument-hint: "[audit|critique|colorize|polish|animate|typeset|space|bolder|quieter|delight|adapt|extract] <target> [--scope area] [--tone tone] [--preserve-structure] [--diff]"
---

# UX Polish

## Workflow

1. **Parse** `$ARGUMENTS` → `{subcommand}` + `{target}` + options. Default subcommand = `polish`. Missing target → AskUserQuestion.

2. **Resolve target** — in order:
   - Exact file path → use directly
   - Directory path → Glob `*.html` in it
   - Subject name → Glob `dev/ux/wireframes/{target}/*.html`
   - Nothing found → AskUserQuestion

3. **Load context**:
   - Glob `dev/ux/design-system.yaml` → read design tokens (required for `colorize`/`polish`)
   - Glob `biz/ux/empathy-map-{subject}.md` → emotional tone hints (optional)
   - Missing design system on `polish`/`colorize` → AskUserQuestion or create defaults

4. **Read HTML** — Read each target file. Assess current state.

5. **Execute subcommand** — Read `references/design-rules.md` first, then apply per subcommand:

### Analysis subcommands (read-only)

| Subcommand | Action | Reference sections |
|---|---|---|
| `audit` | Report all design issues: contrast failures, spacing inconsistencies, anti-pattern violations (§3), heuristic violations (§10). Output structured markdown report grouped by severity. | §1-3, §10 |
| `critique` | Opinionated design suggestions with priority ranking. Like audit but prescriptive — "increase CTA size by 20%", "add shadow to separate card from background". Include rationale from Gestalt/hierarchy principles. | §1-3, §10 |

### Modification subcommands (write files)

| Subcommand | Focus | What to apply | Reference sections |
|---|---|---|---|
| `polish` | **Full pass** — the "do everything" command | Typography + color + spacing + motion + interaction + responsive. Apply all rules. | All sections |
| `colorize` | **Color only** | Read design-system.yaml palette. Apply color harmony algorithm (§5): analogous secondary, complementary accent, tinted neutrals, semantic colors. Test WCAG AA contrast. Apply 60-30-10 rule. | §5, §3 color anti-patterns |
| `typeset` | **Typography only** | Font pairing (serif+sans), modular scale, line-height per size, measure (45-75ch body, 20-35ch hero), tracking, OpenType features (tabular-nums, small-caps, hanging-punctuation), baseline grid. | §4, §3 typography anti-patterns |
| `space` | **Spacing only** | Apply 4px scale system. Fix Gestalt Proximity violations (space within group < space between groups). Vertical rhythm. White space hierarchy (micro/meso/macro). Section breathing room. | §6, §1 Gestalt, §2 White Space |
| `animate` | **Motion only** | Add CSS transitions: hover states (100-150ms ease-out), focus-visible, enter/exit animations (ease-out/ease-in), stagger siblings (+50ms), skeleton loading. Include `prefers-reduced-motion`. | §7, §8 interaction states |
| `adapt` | **Responsive only** | Mobile-first breakpoints (375/768/1024/1440). Container queries. Touch targets 44px. Thumb zone. Stack columns on mobile. Fluid typography with clamp(). Max content width 1200px. | §9 |
| `bolder` | **Increase assertiveness** | Increase type scale ratio, strengthen contrast, enlarge CTAs, add bolder shadows, increase font-weight on headings, more saturated primary color. Push Von Restorff effect. | §2 hierarchy, §4, §5 |
| `quieter` | **Reduce visual noise** | Desaturate palette toward monochromatic, increase whitespace, reduce border-radius variation, soften shadows, lighter font-weights on non-critical elements, remove decorative elements. | §2 hierarchy, §5 monochromatic, §6 macro whitespace |
| `delight` | **Add micro-delights** | Subtle hover animations beyond defaults, success state celebrations (checkmark animation), empty state illustrations/messages, loading skeleton with brand-tinted pulse, stagger entrance on list items. | §7 motion, §8 affordance, §11 UX writing |
| `extract` | **Reverse-engineer design system** | Parse all CSS values from HTML. Identify color palette, font families, spacing values, border-radius values. Detect inconsistencies (ad-hoc values). Generate `dev/ux/design-system.yaml` with detected tokens. Report deviations. | §12 |

### Subcommand dispatch rules

- **Unknown subcommand** → tell user available subcommands, suggest closest match
- **`extract`** is unique: outputs YAML, not modified HTML. Does NOT require existing design-system.yaml.
- **`audit`/`critique`** never modify files — output to console only
- **All modification subcommands** respect `--scope`, `--tone`, `--preserve-structure`, `--diff` options
- **Stacking**: User can run `typeset` then `colorize` then `animate` for incremental polish instead of full `polish`

6. **Apply options**:
   - `--scope {area}` → only modify matching section (`header`/`hero`/`cta`/`forms`/`cards`/`nav`/`footer`/`all`)
   - `--tone {tone}` → override emotional direction (`professional`/`friendly`/`urgent`/`celebratory`)
   - `--preserve-structure` → CSS-only changes, never modify HTML tags/attributes
   - `--diff` → show before/after diff, don't overwrite

7. **Write output** — Write modified HTML in-place. Preserve all `hx-*` attributes, `data-*` attributes, and HTML structure (unless structure changes are needed and `--preserve-structure` not set).

8. **Open** — `xdg-open` / `open` the modified file(s).

## Design Foundations

Every decision in this skill traces back to these frameworks (full rules in `references/design-rules.md`):

- **Gestalt principles** (§1) — Proximity, Similarity, Closure, Continuity, Figure-Ground, Prägnanz. These are the physics of visual perception. Spacing is semantic (grouping), not decorative. Alignment creates continuity. One focal point per viewport.
- **Visual hierarchy stack** (§2) — Size > Color > Weight > Position > Proximity > Typography > Texture. When elements compete for attention, the hierarchy has failed.
- **Pre-attentive attributes** (§1) — Color, size, position, motion process in <250ms. Use for critical information. Always encode meaning in 2+ channels (accessibility).
- **Nielsen's 10 heuristics** (§10) — Quality checklist for `audit`/`critique`: system status visibility, user control, consistency, error prevention, recognition over recall.
- **Cognitive load laws** (§10) — Hick's (fewer choices), Fitts's (big targets close to thumb), Miller's (chunk 5±2), Von Restorff (distinctive = memorable). Drive interaction decisions.
- **Tufte's data-ink ratio** (§2) — In data-heavy screens, maximize data, minimize decoration. Every pixel of ink should represent data.

## Implementation Rules

- **Never strip HTMX**: all `hx-*` attributes are sacred
- **Tinted neutrals**: mix 5-10% of primary into grays — never use pure gray
- **No pure black/white**: `#1E293B` not `#000`, `#FAFAFA` not `#FFF`
- **Spacing scale**: 4px base unit (4/8/12/16/24/32/48/64/96)
- **Motion**: ease-out for entrances (0.2s), ease-in for exits (0.15s), `prefers-reduced-motion` always
- **Touch targets**: 44px minimum on mobile
- **Contrast**: WCAG AA minimum, AAA for body text

## Testing

- **Standalone**: This skill is tested independently via manual smoke tests (audit/critique/colorize/polish on sample wireframes). Not managed through OpenSpec.

## Maintenance

- **Sync with `/ux-wireframe`**: Both skills share design foundations (spacing scale, breakpoints, typography rules). When updating design rules here, check `/ux-wireframe` references for consistency. Both must agree on token values, spacing scale, and responsive breakpoints.
