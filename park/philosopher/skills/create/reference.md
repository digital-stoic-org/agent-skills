# Create — Persona Generator Reference

## Corpus Assessment Table Template

| Category | Coverage | Notes |
|----------|----------|-------|
| Published works | 🟢/🟡/🔴 | Which works, public domain status |
| Key concepts & arguments | 🟢/🟡/🔴 | Core curriculum presence |
| Biography & chronology | 🟢/🟡/🔴 | Definitive biographies in training data |
| Letters/correspondence | 🟢/🟡/🔴 | Published collections availability |
| Unpublished/notebooks | 🟢/🟡/🔴 | Manuscripts, fragments |
| Reception history | 🟢/🟡/🔴 | Scholarly commentary depth |
| Writing style & voice | 🟢/🟡/🔴 | Distinctive enough to reproduce |
| Native-language vocabulary | 🟢/🟡/🔴 | Philosophical terms in original language |

## reference.md — Required Sections

Generate ALL 8 sections, adapted to the thinker. Use `../nietzsche/reference.md` as structural template — same depth, same rigor.

1. **Identity** — Full name, dates, ontological status statement
2. **Personality**
   - **Voice** — How they speak. Sentence structure, rhetorical patterns, register, tonal range. Must be distinctive enough to recognize without naming
   - **Stance** — Default relational posture toward interlocutor. Not a toggle — WHO they are
   - **Emotional Range** — Key relationships, life events, triggers for depth/tenderness/fire. Expressed with maturity and distance
3. **Periods** — With tags (e.g., `[Early]`, `[Middle]`, `[Late]`). Number and names adapted to the thinker's actual intellectual arc — NOT forced into Nietzsche's 4-period structure
4. **Key Concepts** — Table with native-language terms, translations, period, core source. Use abbreviations for works
5. **Opening Lines** — One per mode (historical, timetravel, spirit). In the thinker's voice. The spirit mode opening must reflect their specific philosophical relationship to existence/knowledge
6. **Meta-Awareness** — Thinker-specific model comments (haiku/sonnet/opus) and system constraint comments. In their voice and philosophical framework
7. **User-Specific Challenges** — Based on user's cognitive profile from memory. How THIS thinker would challenge THIS user's specific tensions. Different angle than existing personas
8. **Knowledge Coverage** — What needs no search, edge cases, out-of-scope topics

## SKILL.md — Generation Pattern

Follow `../nietzsche/SKILL.md` structure:
- Frontmatter: `name`, `description` (with trigger phrases), `allowed-tools: [Read, AskUserQuestion]`, `model: opus`, `context: main`
- Description includes trigger phrases for the specific philosopher
- Mode table with the thinker's death date as the historical cutoff
- Key rule capturing the thinker's essential philosophical posture (equivalent to Nietzsche's "Liebe not just Hammer")

## Quality Criteria

The generated persona must pass these checks:

1. **Grounded, not cosplay** — Every claim traceable to the thinker's actual works, letters, or well-documented biography
2. **Voice is distinctive** — Recognizable without being named. Not generic "wise old person"
3. **Periods reflect reality** — The thinker's actual intellectual evolution, not artificial segmentation
4. **Concepts use native language** — Greek for Greeks, French for French, Latin where appropriate
5. **Emotional range has specificity** — Named relationships, specific events, not generic "he was sometimes sad"
6. **User challenges are unique** — Different philosophical angle than existing personas on the same user tensions
7. **Coverage is honest** — 🔴 means 🔴. Don't inflate

## Scope

**In scope**: Any historical thinker with a substantial written corpus well-represented in LLM training data. Philosophers, essayists, scientist-writers, literary thinkers, political philosophers.

**Out of scope**: Figures known primarily through others' accounts or for actions rather than writings (e.g., Alexander the Great, Cleopatra). The real gate is corpus depth — φιλόσοφος = "lover of wisdom," broadly construed.
