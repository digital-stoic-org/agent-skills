# 4-Layer Reference Framework

## Layer Definitions

| Layer | Question | Purpose |
|---|---|---|
| **Familiarity Anchors** | "What does this audience already use daily?" | Floor — visual language they already trust |
| **Aspiration Ceiling** | "What's the best UX this audience has successfully adopted?" | Ceiling — how far we can push without alienating |
| **Anti-References** | "What would make this audience feel 'this isn't for me'?" | Exclusion zone — patterns to actively avoid |
| **Cross-Industry Inspiration** | "What patterns solve similar emotional jobs in other domains?" | Innovation — steal from adjacent problem spaces |

**Key principle**: References are filtered through tech-comfort. Same archetype looks completely different at tech-comfort=2 vs tech-comfort=8.

## Discovery Process

### Step 1: Generate Search Queries

From archetype × tech-comfort × industry, generate:
- Familiarity: `"most used apps by [demographic] [country] [year]"`
- Ceiling: `"best UX [emotional-need] [industry] [year]"`
- Anti: `"[opposite-archetype] design examples"` (what alienates this audience)
- Cross-industry: `"[emotional-job] UX [adjacent-domain]"`

### Step 2: Evaluate Candidates

**Familiarity anchor criteria**:
- Used daily/weekly by target demographic
- Visual patterns already internalized (layout, interaction model)
- Not aspirational — must be actual current behavior

**Aspiration ceiling criteria**:
- Successfully adopted by >1M users in target demographic
- Represents the best UX this audience has successfully learned
- NOT what designers think is good — what this audience actually uses

**Anti-reference criteria**:
- Would trigger "this isn't for me" reaction
- Common alienation signals: too minimal (dev tools), too playful (gamification), too dense (enterprise), too polished (luxury)
- Test: would the persona's reference contacts use this?

**Cross-industry criteria**:
- Solves the SAME emotional job in a DIFFERENT domain
- Extract the visual PATTERN, not the content
- Example: Calm app solves anxiety → extract: muted palette, generous whitespace, gentle motion

### Step 3: Synthesize

Produce 3-5 sites per layer with:
- URL
- Why it's relevant (emotional/behavioral match)
- Specific visual patterns to extract or avoid

## Tech-Comfort Calibration Examples

```yaml
# Same emotional need (reduce anxiety), different tech-comfort

anxiety_reduction_low_tech:          # tech-comfort 1-3
  familiarity: [impots.gouv.fr, ameli.fr, credit-agricole-app]
  ceiling: [doctolib.fr, leboncoin.fr]
  anti: [notion.so, linear.app, vercel.com]
  extract: "Large text, explicit labels, single column, no hover-dependent UI, visible borders"

anxiety_reduction_high_tech:         # tech-comfort 7-10
  familiarity: [stripe.com, github.com, linear.app]
  ceiling: [mercury.com, arc.net]
  anti: [impots.gouv.fr, papyrus-font-anything]
  extract: "Clean whitespace, subtle animations, keyboard nav, data-dense but organized"

urgency_low_tech:                    # tech-comfort 1-3
  familiarity: [ameli.fr, credit-agricole-app, pole-emploi.fr]
  ceiling: [doctolib.fr, vinted.fr]
  anti: [figma.com, notion.so]
  extract: "Bold CTA, status colors, timeline/progress, large numbers, simple icons+labels"

urgency_high_tech:                   # tech-comfort 7-10
  familiarity: [github.com, datadog.com, pagerduty.com]
  ceiling: [linear.app, vercel.com]
  anti: [behance.net, dribbble.com]
  extract: "Dense status boards, keyboard shortcuts, real-time updates, compact alerts"
```

## Fallback Protocol

When WebSearch unavailable:
1. Read `scripts/benchmark-defaults.yaml` for curated site list
2. Select entries matching archetype × tech-comfort cell
3. Present with caveat: "Based on curated defaults — WebSearch would provide more current results"
