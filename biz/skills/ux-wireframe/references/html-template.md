# HTML Template Guide

Base skeleton: Read `scripts/boilerplate.html` and adapt per screen. Replace `{placeholders}` with actual values.

## Token Customization

Override `:root` CSS variables per fidelity level from `dev/ux/design-system.yaml` (or `scripts/design-system-defaults.yaml`).

## Annotation Pattern

Each major UI section gets an HTML comment explaining the artifact-driven decision:

```html
<!-- [①] Pain-first headline because:
     VPC pain severity (high) > gain priority (nice-to-have)
     Empathy feels: frustration dominates → lead with relief -->

<!-- [②] Upload zone full-width because:
     Persona tech_comfort: low → maximize target size (Fitts's Law)
     Journey stage 1 emotion: anxious → reduce cognitive load -->
```

## Index Page

`index.html` navigator includes:
- Design brief summary (3-5 key artifact-driven decisions)
- Card per screen linking to `NN-{screen-name}.html`
- Metadata: fidelity level, screen count, generation date

```html
<main class="container">
  <h1>{Subject} — Wireframes</h1>
  <p class="text-secondary">Fidelity: {fidelity} · {N} screens · Generated {date}</p>

  <div class="card mt-3">
    <h2>Design Brief</h2>
    <ul class="text-small" style="padding-left: 1.5rem; margin-top: 0.5rem;">
      <li>{e.g., "Pain-first messaging: users feel frustrated before hopeful"}</li>
      <li>{e.g., "Low-tech onboarding: persona tech comfort is low"}</li>
    </ul>
  </div>

  <div class="mt-3">
    <a href="01-{screen-name}.html" class="card" style="display:block; text-decoration:none; color:inherit;">
      <h2>01 — {Screen Name}</h2>
      <p class="text-secondary text-small">{Screen purpose}</p>
    </a>
  </div>
</main>
```

## Polished Fidelity Extras

When `--fidelity polished`, add to CSS:
- `box-shadow: 0 1px 3px rgba(0,0,0,0.1)` on cards
- `transition: all 0.2s ease` on interactive elements
- Gradient CTA: `background: linear-gradient(135deg, var(--cta), var(--accent))`
- `backdrop-filter: blur(8px)` on sticky nav
