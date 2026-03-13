# Common Reference — Domain Adaptations & Engagement Mapping

## FR B2B Context

When input data is French or targets French market:

- **Names**: Use French archetypes (artisan, auto-entrepreneur, freelance, gérant TPE/PME)
- **Professions**: artisan BTP, plombier, électricien, maçon, comptable, expert-comptable
- **Pain vocabulary**: impayés, relance, trésorerie, devis, facture, mise en demeure, injonction de payer
- **Quotes**: Preserve original French — do NOT translate verbatims
- **Currency**: EUR, mention seuils (500€, 1000€, 5000€)
- **Legal context**: Code de commerce, tribunal de commerce, procédure simplifiée

## Killer Feature Rule

Every artifact output must identify **actionable deliverables** (documents, automations, actions), NEVER scores/diagnostics. If the artifact only produces a diagnostic, flag it and suggest what action it enables.

## Kill Criteria Awareness

While generating, flag if the artifact reveals:
- ChatGPT/generic AI can deliver 80%+ of the value proposition
- No clear differentiation in the jobs/pains/gains
- Market is saturated with similar solutions

Add a `## Kill Criteria Check` section if any red flags detected.

## Engagement Layer Mapping

Map each artifact (or artifact section) to the 4-layer engagement model:

| Layer | Definition | Artifact Signal |
|-------|-----------|-----------------|
| **Hook** | First-use value, instant gratification | Discovery stage, first touchpoint, initial pain relief |
| **History** | Value grows with repeated use | Data accumulation, patterns, learning from past |
| **Temporal Intelligence** | Proactive, time-aware features | Deadlines, reminders, predictive alerts |
| **Automation** | System acts autonomously | Auto-actions, zero-touch workflows |

Tag every journey map stage and relevant VPC/JTBD elements with their primary engagement layer.
