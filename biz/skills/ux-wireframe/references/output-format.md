# Dual Output Format

Praxis dual-output principle: every deliverable has a human format + LLM format.

## Human Output: HTML wireframes

Self-contained HTML files in `dev/ux/wireframes/{subject}/`. See `html-template.md`.

Purpose: visual review, stakeholder feedback, click-through testing.

## LLM Output: screen-specs-llm.md

Single file alongside the HTML wireframes. Token-efficient, structured, implementation-ready.

Purpose: consumed by `/openspec-develop` tasks, or any LLM implementing UI.

### Format

One `## Screen:` section per screen. Each section uses structured YAML-like blocks.

```markdown
## Screen: 01-upload-invoice

**Purpose**: Upload unpaid invoice for automated reminder generation
**Job**: JTBD core_job — "When I have an overdue invoice, I want to generate a reminder letter so I can get paid without confrontation"
**Entry points**: Landing CTA, nav "+Nouveau", dashboard quick-action

### Layout

- Nav: [logo, "Mes relances", "+Nouveau {active}"]
- Section hero:
    - h1: "Générez votre lettre de relance"
    - p: "Uploadez la facture, on s'occupe du reste"
    - source: VPC.UVP
- Card upload:
    - UploadZone: {accept: ".pdf,.jpg,.png", max: "10MB", label: "Glissez votre facture ici"}
    - trust: "Vos documents sont chiffrés et supprimés après traitement"
    - source: Forces.anxiety "data security" → mitigation
- Card options: {below-fold: true}
    - Select tone: ["Cordial", "Ferme", "Mise en demeure"]
    - Input delay_days: {type: number, default: 30, label: "Jours de retard"}
    - source: JTBD functional_job frequency=med → below fold
- Button submit: {label: "Analyser ma facture", style: primary, full-width: true}
    - source: Empathy.says vocabulary

### States

| State | Trigger | Behavior |
|---|---|---|
| empty | page load | Upload zone visible, submit disabled |
| uploading | file selected | Progress bar + filename, submit disabled |
| error-format | invalid file | "Format non supporté. Acceptés: PDF, JPG, PNG" |
| error-size | file > 10MB | "Fichier trop volumineux (max 10 MB)" |
| success | upload complete | Submit enabled, file preview shown |

### Transitions

| Action | Target | Method |
|---|---|---|
| submit click | 02-result | POST /api/analyze → loading skeleton → redirect |
| nav "Mes relances" | 03-dashboard | GET /dashboard |
| nav logo | 01-landing | GET / |

### Annotations

- ① Upload zone full-width: persona.tech_comfort=low + Fitts's Law
- ② Tone selector below fold: JTBD frequency=med, not primary action
- ③ Trust signal under upload: Forces.anxiety "data security" rated strong
- ④ Submit label "Analyser" not "Envoyer": Empathy.says — users say "analyser"
```

### Key conventions

| Convention | Rationale |
|---|---|
| Component names, not HTML tags | Framework-agnostic: maps to FastHTML, React, HTMX, anything |
| `source:` annotations inline | Traceability: every design decision links to artifact |
| Real copy, never placeholders | Promptframe principle: content drives implementation, not afterthought |
| States table per screen | Developer implements ALL states, not just happy path |
| Transitions table per screen | Navigation/API contract explicit |
| `below-fold: true` marker | Information hierarchy visible without visual rendering |
| `{active}` / `{disabled}` markers | UI state inline with component spec |

### Token efficiency

Typical screen spec: ~150-250 tokens (vs ~1500-2500 for equivalent HTML).

An 8-screen app:
- HTML: ~12,000-20,000 tokens
- screen-specs-llm.md: ~1,200-2,000 tokens (10× more efficient)

### How OpenSpec consumes this

In `tasks.md`:
```markdown
- [ ] Implement upload screen per `dev/ux/wireframes/relance-impayes/screen-specs-llm.md § 01-upload-invoice`
```

Developer (human or LLM) reads the screen spec section, implements in target tech stack, and cross-references HTML wireframe visually if needed.

### When to update screen-specs-llm.md

Regenerate when:
- Wireframes change (re-run `/ux-wireframe`)
- Design brief changes (re-run `/ux-wireframe`)

Do NOT manually edit screen-specs-llm.md — it's a generated artifact. Source of truth is the design brief + UX artifacts.
