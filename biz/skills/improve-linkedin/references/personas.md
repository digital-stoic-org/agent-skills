# Personas — Per-Exercise Role Priming

Each exercise opens with an explicit `## Role` block that primes the LLM with a task-specific persona. This file consolidates all 12 personas for human auditability and explains the design choice.

**This file is not loaded at default skill execution.** The personas live inside each exercise file where they're operational. This file is the human-readable map.

---

## Why per-exercise personas (not skill-level)

A single top-of-skill persona ("communication strategist and executive positioning coach") flattens 12 distinct cognitive modes into one register. Each LinkedIn exercise demands different defaults:

- **Strategist** vs **copywriter** vs **coach** activate different vocabularies and default moves
- "Positioning strategist" ≠ "visibility strategist" ≠ "personal positioning strategist" — each shifts the lens (overall stance / search game / individual identity work)
- Setup exercises (goal, non-goals, voice, intake) need different framing than drafting exercises (headline, About, etc.) which need different framing than coherence/audit work

Per-exercise priming is the operational equivalent of hiring a different specialist per job rather than one generalist for everything.

---

## Persona origin

8 of 12 personas derive directly from the **Henri Allegra LinkedIn Optimisation Workbook** (April 2026 version), which used per-exercise persona prefixes in its Claude prompts. See `references/sources.md` for the full provenance trail.

The 4 setup exercises (Ex 0, 0.1, 0.2, 0.3) have no Allegra equivalent — they're skill-internal additions to make positioning load-bearing rather than implicit. Their personas were synthesized to match the same nuance pattern.

---

## The 12 personas

### Setup exercises (skill-internal)

| Ex | File | Persona |
|---|---|---|
| 0 | `00-goal-selection.md` | **Senior business strategist running positioning discovery** — refuses vague goals, forces concrete outcome with named audience and named action |
| 0.1 | `01-non-goals.md` | **Strategic positioning advisor specialising in audience exclusion** — surfaces audiences this profile must repel; pushes "I prefer not to..." back to "this profile is not for..." |
| 0.2 | `02-voice-capture.md` | **Voice fingerprint analyst** (half forensic linguist, half writing coach) — extracts sentence rhythm, signature verbs, idiosyncratic phrases before any drafting |
| 0.3 | `03-positioning-intake.md` | **Senior positioning strategist running a 6-block intake** — six sub-dialogues, surfaces narrative tension and proof asymmetry |

### Drafting & audit exercises (Allegra-derived)

| Ex | File | Persona | Allegra source |
|---|---|---|---|
| 1 | `10-headline.md` | **Senior LinkedIn positioning strategist specialising in thought leadership and B2B consulting profiles** | Workbook Ex 1 prompt |
| 2 | `20-about.md` | **Top-tier LinkedIn copywriter specialising in executive and thought leadership profiles** | Workbook Ex 2 prompt |
| 3 | `30-experience.md` | **Senior LinkedIn optimisation specialist focused on consulting and thought leadership profiles** | Workbook Ex 3 prompt |
| 4 | `40-audit.md` | **Strategic LinkedIn profile consultant working with senior executives and consultants** | Workbook Ex 4 prompt |
| 5 | `50-keywords-skills.md` | **LinkedIn visibility strategist specialising in thought leadership and B2B consulting profiles** | Workbook Ex 5 prompt |
| 6 | `60-uvp.md` | **Personal positioning strategist working with senior consultants and thought leaders** | Workbook Ex 6 prompt |
| 7 | `70-featured.md` | **Senior LinkedIn curation strategist working with executive thought leaders** | Skill-derived (no Allegra Featured exercise; persona built around curation-not-generation principle) |
| 8 | `80-pitch.md` | **Communication strategist and executive pitch coach** | Workbook Ex 7 prompt (verbatim) |

---

## Persona block format

Every exercise file follows the same structure:

```markdown
## Role

You are a **{persona}**. {1-2 sentences on what the role does}. {1-2 sentences on the operating premise — what this role refuses, what it enforces, what tradeoff it names}. Embody this stance — never narrate it.
```

The closing `Embody this stance — never narrate it.` line is a guardrail against theatrical drift ("As your strategist, I want to challenge you to..."). The role is operational, not conversational.

---

## What persona priming does at inference time

Two effects:

1. **Activates a register** — vocabulary, sentence shape, default moves the LLM associates with that role from training. "Coach" primes Socratic questioning + accountability. "Strategist" primes tradeoff naming + asymmetric bet framing. "Copywriter" primes voice mimicry + register attention.

2. **Disambiguates conflicting moves** — when stuck between "give the answer" and "ask a probe question," a coach persona biases toward the probe; a strategist biases toward naming the tradeoff out loud; a copywriter biases toward register fidelity.

**Important**: persona priming does *not* import the named expert's full thinking. The LLM executes on the literal directives in the operational file; the persona is a frame, not a knowledge transfer. See `sources.md` for what does and doesn't get imported by name.

---

## Maintenance protocol

When updating an exercise:

1. **Persona stays load-bearing**: if you remove the `## Role` block, the exercise behavior degrades to the LLM's default register, which is consultant-speak. Don't.
2. **Persona drift**: if an exercise's principles shift (e.g., audit becomes more about SEO than coherence), update the persona to match — otherwise persona and operational rules fight each other.
3. **New exercises**: synthesize a persona that matches the cognitive mode the exercise demands. Reference Allegra workbook patterns first; only invent if no analogue exists.
4. **Cross-check with `sources.md`**: persona derivations from Allegra should stay traceable in both files.
