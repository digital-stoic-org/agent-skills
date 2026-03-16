# Wireframe Patterns

Generic screen patterns. Adapt based on design brief — these are **starting points**, not templates to fill.

## Pattern 1: Entry Screen

Purpose: first contact. Must answer "what is this?" and "what do I do?" in < 5 seconds.

```
┌─────────────────────────────────────┐
│  [Logo/Name]            [Nav]       │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  HEADLINE                   │    │ ← VPC: pain-first or gain-first
│  │  (from UVP or core job)     │    │   depending on severity/priority
│  │                             │    │
│  │  Subline                    │    │ ← Empathy: address top `thinks`
│  │  (address key concern)      │    │   concern proactively
│  │                             │    │
│  │  ┌───────────────────────┐  │    │
│  │  │   PRIMARY ACTION      │  │    │ ← JTBD: core_job.motivation
│  │  │   [Input/Upload/Form] │  │    │   Persona: calibrate complexity
│  │  │                       │  │    │
│  │  │   [CTA: user verb]    │  │    │ ← Empathy: use `says` vocabulary
│  │  └───────────────────────┘  │    │
│  │                             │    │
│  │  Trust signal               │    │ ← Forces: mitigate top anxiety
│  └─────────────────────────────┘    │
│                                     │
│  ┌─── Social Proof ───────────┐    │ ← Forces: amplify pull force
│  │  (testimonial or metric)    │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

Design decisions driven by artifacts:
- If `forces.balance = needs-intervention` → heavier trust section
- If `persona.tech_comfort = low` → larger action zone, fewer options
- If `empathy.feels` contains anxiety → add "you can undo/cancel" near CTA

## Pattern 2: Result/Outcome Screen

Purpose: deliver the promised value. Bridge to continued engagement.

```
┌─────────────────────────────────────┐
│  [Logo/Name]    [History] [Account] │
│                                     │
│  ✅ [Outcome headline]             │ ← JTBD: core_job.outcome
│                                     │
│  ┌─────────────────────────────┐    │
│  │  [THE DELIVERABLE]          │    │ ← The actionable output
│  │  (document, analysis,       │    │   (PDF, report, corrected
│  │   visualization, etc.)      │    │    file, recommendation)
│  │                             │    │
│  │  [Action 1: Download/Save] │    │
│  │  [Action 2: Share/Send]    │    │ ← JTBD social_jobs: enable sharing
│  └─────────────────────────────┘    │
│                                     │
│  ┌── Insight ─────────────────┐    │ ← VPC gain_creators: show value
│  │  "Here's what we found..."  │    │   beyond the immediate output
│  │  (unexpected value-add)     │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌── Continue ────────────────┐    │ ← Journey: bridge to next stage
│  │  [Save for next time]      │    │   (history/account/recurring)
│  │  [Try another]             │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

Design decisions:
- If `jtbd.emotional_jobs` include pride → add celebration animation
- If `jtbd.social_jobs` exist → prominent share/export buttons
- Insight section = gain_creator that exceeds expectations

## Pattern 3: Dashboard/History Screen

Purpose: value grows over time. Show accumulated insight.

```
┌─────────────────────────────────────┐
│  [Logo/Name]  [Dashboard] [+New]    │
│                                     │
│  ┌── Summary ─────────────────┐    │ ← Aggregated metrics
│  │  [Key metric 1] [Metric 2] │    │   (from JTBD functional jobs)
│  │  [Trend indicator]         │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌── Recent Items ────────────┐    │ ← History of actions
│  │  [Item 1]  [date] [status] │    │   Status = journey stage
│  │  [Item 2]  [date] [status] │    │
│  │  [Item 3]  [date] [status] │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌── Accumulated Insight ─────┐    │ ← THIS is the moat:
│  │  Pattern or trend only      │    │   insight impossible on
│  │  visible with repeated use  │    │   first use, only with data
│  └─────────────────────────────┘    │
│                                     │
│  ┌── Next Level ──────────────┐    │ ← Journey: bridge to
│  │  [Enable proactive feature] │    │   next engagement depth
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

Design decisions:
- Insight section = what the user **couldn't know** without accumulated data
- If `vpc.fit_analysis` has gaps → show as "coming soon" or omit
- If `forces.habit` is strong → make dashboard feel familiar (table/list, not novel)

## Pattern 4: Alert/Proactive Screen

Purpose: system reaches out to user before they think to check.

```
┌─────────────────────────────────────┐
│  [Logo/Name]       [Settings]       │
│                                     │
│  ⚡ [Proactive headline]           │ ← Time-sensitive trigger
│  "Something needs your attention"   │
│                                     │
│  ┌── Context ─────────────────┐    │
│  │  What happened + why it     │    │
│  │  matters + what to do       │    │ ← Journey pain_points at
│  │                             │    │   this stage
│  │  [Take Action Now]         │    │
│  │  [Snooze / Remind Later]   │    │ ← Respect user autonomy
│  └─────────────────────────────┘    │
│                                     │
│  ┌── Related ─────────────────┐    │
│  │  Other pending items        │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

## Anti-Patterns

| ❌ Don't | ✅ Instead |
|---|---|
| Copy-paste empathy map `says` into buttons | Synthesize user intent into clear action verbs |
| List all JTBD features on one screen | Prioritize by opportunity score, progressive disclose |
| Add trust signals everywhere | Place them where anxiety forces are actually strong |
| Make every screen a funnel step | Design for the emotional arc, not conversion metrics |
| Use same layout for all screens | Let artifact insights drive layout variation |
| Ignore contradictions (says ≠ thinks) | Design for `does` behavior, not `says` preference |
