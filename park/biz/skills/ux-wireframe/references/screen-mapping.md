# Screen Mapping

## Strategy 1: From Journey Map (preferred)

When a journey map artifact exists, map stages directly to screens:

| Journey Stage Property | Screen |
|---|---|
| First stage with user action | Entry/Landing screen |
| Stage with primary interaction | Core action screen |
| Stage with output/result | Result/confirmation screen |
| Stage with data accumulation | Dashboard/history screen |
| Stage with proactive trigger | Notification/alert screen |
| Stage with recurring pattern | Settings/automation screen |

Use `engagement_layer` tag to select interaction paradigm per screen:
- **hook** → minimal UI, instant value, zero-commitment entry
- **history** → data visualization, trends, accumulated insight
- **temporal-intelligence** → proactive alerts, calendar views, deadlines
- **automation** → toggles, schedules, batch operations

Screen count = number of distinct stages (filter by `--screens N` if specified).

## Strategy 2: From JTBD Core Job (no journey map)

Map the core job structure to a 3-screen arc:

```
core_job.situation  →  Screen 1: Context/entry (where user IS)
core_job.motivation →  Screen 2: Action (what user DOES)
core_job.outcome    →  Screen 3: Result (what user GETS)
```

Add screens for high-opportunity functional jobs if `--screens` allows.

## Strategy 3: From VPC (no journey map, no JTBD)

Map value map to screens:

```
Top pain (highest severity + frequency)  →  Screen 1: Pain-relief entry
Product/service interaction              →  Screen 2: Core feature
Top gain (must-have, unmet)              →  Screen 3: Success/outcome
```

## Strategy 4: Minimal (no artifacts)

Ask user for:
1. Who is the user?
2. What is their core action?
3. What do they get?

Generate 3 screens: Landing → Action → Result.

## Screen Naming Convention

Files: `NN-{descriptive-name}.html` (e.g., `01-upload-invoice.html`, not `01-hook-landing.html`)

Name screens after what the user **does**, not after framework concepts.

## Multi-Artifact Screen Enrichment

Each screen draws from multiple artifacts simultaneously:

```
Screen: "Upload Invoice"
├── Journey map  → this is stage 2, emotion = anxious → add reassurance
├── Persona      → tech_comfort: low → large drop zone, clear instructions
├── Empathy map  → says "I just want it done" → single-step upload, no options
├── Forces       → anxiety: "will it mess up my accounting?" → preview before send
├── JTBD         → functional job: "correct invoice errors" → show validation
└── VPC          → pain reliever: auto-detect errors → highlight corrections
```

This cross-referencing is what makes wireframes **research-grounded**, not template-driven.
