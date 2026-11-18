# Design Translation Guide

How to translate UX research insights into interaction design decisions. This is the core intellectual work of the skill — not copy-paste, but **inference**.

## Phase 1: Extract & Cross-Reference

Read all available artifacts for `{subject}`. Build a unified picture by cross-referencing:

```
Persona.tech_comfort + JTBD.frequency → interaction complexity
Forces.anxiety + Empathy.feels → trust signal placement
Journey.emotion_peaks + VPC.fit_gaps → moment-of-truth design
Empathy.says_vs_thinks + Forces.habit → friction reduction strategy
```

## Phase 2: Design Brief (write to design-brief.md)

For each screen, answer these questions from artifact data:

### A. Complexity Calibration (from Persona)

| Persona Signal | Design Decision |
|---|---|
| `tech_comfort: low` | Large targets, step-by-step wizards, inline help, no jargon |
| `tech_comfort: medium` | Standard forms, contextual tooltips, progressive disclosure |
| `tech_comfort: high` | Keyboard shortcuts, batch ops, compact layout, power-user paths |
| `triggers` list | Design activation hooks at these moments |
| `day_in_life` | Structure workflow around natural entry points |
| `workarounds` | Mirror in UI — if they use spreadsheets, offer table views + export |

### B. Emotional Design (from Empathy Map + Journey)

| Signal | Design Decision |
|---|---|
| `feels: anxiety/fear` | Add reassurance: security badges, undo, "you can change this later" |
| `feels: frustration` | Speed up: reduce steps, show progress, instant feedback |
| `feels: overwhelm` | Simplify: hide options, wizard flow, "just do X first" |
| `feels: pride/satisfaction` | Celebrate: success animations, shareable results, stats |
| `says ≠ thinks` contradiction | Don't trust stated preferences — design for observed behavior (`does`) |
| Journey `emotion.intensity` peaks | These screens need the most design attention |
| Journey `emotion.intensity` valleys | Add encouragement, progress indicators, "almost there" |

### C. Trust Architecture (from Forces)

| Force | Design Response |
|---|---|
| `anxiety` (strong) | Prominent mitigation on that screen: testimonials, certifications, data policy, free trial, easy exit |
| `anxiety` (moderate) | Subtle signals: padlock icon, "256-bit encrypted", "cancel anytime" |
| `habit` (strong) | Import/migration flow, side-by-side comparison, "works like X but better" |
| `habit` (moderate) | Familiar patterns, similar vocabulary to incumbent tool |
| `push` (strong) | Echo the pain: "Tired of [pain]? [Solution] in 30 seconds" |
| `pull` (strong) | Lead with the promise: hero feature demo, before/after |
| `balance: needs-intervention` | Heavy onboarding, prominent anxiety mitigators, guided first-run |
| `balance: wont-switch` | Must break habit first — import wizard, parallel operation mode |

### D. Information Hierarchy (from JTBD + VPC)

| Signal | Above Fold | Below Fold | Hidden/Advanced |
|---|---|---|---|
| JTBD `opportunity_score` > 10 | ✅ Hero feature | | |
| JTBD `opportunity_score` 5-10 | | ✅ Supporting | |
| JTBD `opportunity_score` < 5 | | | ✅ Settings |
| JTBD `frequency: high` | ✅ Always visible | | |
| JTBD `frequency: low` | | | ✅ On demand |
| VPC `fit: strong` | ✅ Prominent | | |
| VPC `fit: partial` | | ✅ With "coming soon" | |
| VPC `fit: gap` | | | ❌ Omit or roadmap |
| VPC `over_serves` | | | ✅ Simplify/remove |

### E. Content Strategy (from Empathy + VPC)

| Source | Content Type | Placement |
|---|---|---|
| VPC `pain_relievers` (high severity) | Lead with pain relief messaging | Headlines, hero section |
| VPC `gain_creators` (must-have, unmet) | Aspirational messaging | Success states, result screens |
| VPC pain severity > gain priority | **Pain-first** design: "Stop losing X" | Above fold |
| VPC gain priority > pain severity | **Gain-first** design: "Start achieving Y" | Above fold |
| Empathy `says` vocabulary | Use exact user words for labels, CTAs | Buttons, navigation, form labels |
| Empathy `thinks` concerns | Address proactively in microcopy | Tooltips, helper text, FAQs |
| JTBD `emotional_jobs` | Micro-interactions that signal progress/control | Animations, status indicators |
| JTBD `social_jobs` | Sharing, export, attestation features | Result screens, dashboards |

### F. Screen Flow Logic (from Journey Map)

| Journey Signal | Screen Design |
|---|---|
| `moments_of_truth` | Commitment screens — clear value prop, low friction, prominent CTA |
| Stage with `engagement_layer: hook` | Instant-value UI: minimal input → immediate output |
| Stage with `engagement_layer: history` | Data accumulation UI: lists, trends, "you've done X so far" |
| Stage with `engagement_layer: temporal-intelligence` | Proactive UI: alerts, calendars, "due in N days" |
| Stage with `engagement_layer: automation` | Background UI: toggles, schedules, "set it and forget it" |
| Stage `pain_points` list | Add contextual help, inline tutorials, error prevention at this screen |
| Stage `opportunities` list | Design the opportunity as a feature on this screen |

## Phase 3: Validate Design Brief

Before generating HTML, check:

- [ ] Every strong anxiety force has a visible mitigation
- [ ] Says/thinks contradictions are addressed (not papered over)
- [ ] Emotional arc has intentional pacing (not monotone)
- [ ] High-opportunity features are above fold
- [ ] Over-served features are deprioritized or removed
- [ ] Tech comfort level is consistently applied
- [ ] Actionable deliverables are first-class UI elements (buttons, not descriptions)
- [ ] Copy uses user vocabulary (from `says`), not product jargon
- [ ] Device target and user type variants resolved (see `interaction-states.md`)
- [ ] All states documented per screen: loading, error, empty, success (see `interaction-states.md`)
- [ ] Annotations explain WHY, not WHAT (see `ux-principles.md`)
- [ ] UX laws applied: Fitts (CTA size/position), Hick (choice count), Jakob (familiar patterns) (see `ux-principles.md`)
- [ ] Copy is real (not lorem ipsum) and traceable to artifact source (promptframe principle)
