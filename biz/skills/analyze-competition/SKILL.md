---
name: analyze-competition
description: Competitive analysis — identify competitors, build feature matrix, assess positioning, and produce go/no-go verdict with kill-criteria framing. Use when "competitive analysis", "compare competitors", "positioning vs", "competitive landscape", "battlecard", "who are the competitors". Outputs analysis/competitive-analysis.md.
allowed-tools: ["Read", "Write", "Glob", "Grep"]
model: sonnet
context: fork
user-invocable: true
argument-hint: "<product-or-market>"
---

# Analyze Competition

Produce a competitive analysis that scales to available input. Thin input → scout report. Rich input → deep matrix.

## Inputs

Read available context (any order): PRD, market notes, prior analysis, pasted Perplexity output, competitor URLs. If `$ARGUMENTS` names a product/market, use that as seed. If nothing found, ask user for product name + target segment.

## Methodology

1. **Discover** — direct, indirect, adjacent, substitute competitors. Use 3-tier search: known names → category search → adjacent categories.
2. **Compare** — side-by-side feature/capability matrix (✅/❌/🟡).
3. **Position** — pricing/business model, target segment, UVP, moat per competitor.
4. **Assess** — kill-criteria check against thresholds. Be honest about where target product loses.
5. **Enrich** — always append a tailored Perplexity deep-search prompt for gaps found.

## Output

Write `analysis/competitive-analysis.md` using the template in `references/methodology.md` § Output Template.

**Core sections** (always present): Competitors table, Kill-Criteria Check, Sources, Perplexity prompt.
**Optional sections** (when data supports): Feature Matrix, Positioning, Gaps & Opportunities. Mark missing sections `[insufficient data — enrich via Perplexity prompt below]`.
**Optional frameworks** (apply only when trigger condition met): Market Timing, Trajectory, ERRC, Entry Barriers. See `references/methodology.md` § Optional Frameworks.

## Key Rules

- Cite sources for every factual claim
- Adapt sources to industry (see `references/methodology.md` § Industry Sources)
- Kill-criteria: if any criterion breaches threshold → explicit kill recommendation
- No speculation — mark uncertain data with confidence level (high/medium/low)
- See `references/methodology.md` for output template, Perplexity prompt, and FR sources
- **Next step**: At end of output, suggest `/ux-strategize empathy-map {subject}` to start building UX artifacts from the analysis
