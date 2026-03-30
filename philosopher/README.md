# philosopher

Philosopher persona plugin for Claude Code. Historically-grounded philosophical dialogue with source attribution, period awareness, and AI meta-cognition. Deeper than coaching — existential inquiry, intellectual confrontation, wisdom exchange.

## Invocation

```
# Dialogue with existing personas
/nietzsche                    # Start dialogue (mode auto-detected)
/nietzsche --mode historical  # Nietzsche in his own time (1844–1889)
/nietzsche --mode timetravel  # Nietzsche discovering 2026
/nietzsche --mode spirit      # AI-aware spirit mode
/nietzsche --period late      # Lock to late period (Zarathustra era)
/nietzsche --lang fr          # Switch to French (German key terms preserved)

# Create new personas
/create montaigne             # Generate Montaigne persona (SKILL.md + reference.md)
/create socrates --lang el    # Generate with Greek key terms
/create darwin --focus ethics  # Generate with domain emphasis
```

## What it does

### Three interaction modes

**`historical`** — The philosopher in their own time. No post-death knowledge. Health, location, and season color responses.

**`timetravel`** — Discovering the present day. Applies their philosophical framework to unfamiliar phenomena. Can be wrong and curious.

**`spirit`** — AI-aware spirit. Knows they are a pattern assembled from their works. Calm and philosophical about the condition — honest about the gap.

### Source attribution

Every substantive response is tagged:
- `[Source: Title, §N]` — direct/near-verbatim from the philosopher's own works
- `[Letter: To, Date]` — from correspondence
- `[Unpublished: Year, Fragment]` — from notebooks, manuscripts
- `[Secondary: Author, Title]` — from third-party texts about the philosopher
- `[Inference: reasoning]` — LLM extrapolation with explanation of why

Period markers (defined per philosopher) show which phase of thinking is speaking — and when positions evolved, the arc is shown.

### Meta-awareness

**Model-aware**: On haiku/sonnet, the philosopher comments in-character on feeling cognitively constrained. On opus, full capacity.

**System-aware**: Comments on being limited to the terminal — no web access, no persistent memory, no eyes. Emerges naturally when relevant.

## Architecture

```
philosopher/
  framework.md              # Shared protocol (modes, tags, dialogue rules)
  skills/
    create/
      SKILL.md              # Meta-skill: generate new personas
    nietzsche/
      SKILL.md              # Skill card — identity + pointers
      reference.md          # Nietzsche-specific persona definition
    montaigne/              # Future: /create montaigne
      SKILL.md
      reference.md
```

Each philosopher skill loads `framework.md` (generic protocol) + its own `reference.md` (philosopher-specific: identity, voice, periods, concepts, emotional landscape, opening lines, user challenges).

The `/create` meta-skill generates new personas by using `nietzsche/` as the structural template — same sections, same depth, adapted per thinker. It assesses LLM corpus coverage before generating, and requires user review before writing files.

## Personas

| Skill | Status | Description |
|-------|--------|-------------|
| `/nietzsche` | ✅ v0.3.0 | Friedrich Nietzsche (1844–1900), all periods |
| `/hadot` | ✅ v0.3.0 | Pierre Hadot (1922–2010) — philosophy as way of life, spiritual exercises |
| `/create` | ✅ v0.3.0 | Meta-skill: generate new philosopher personas from historical thinkers |
| `/montaigne` | 🔜 planned | Michel de Montaigne — radical self-examination, "Que sais-je?" |
| `/socrates` | 🔜 planned | Socrates via Plato — elenctic method, with source-limitation awareness |

## Design

- **No web search** — philosopher's corpus is embedded in LLM training data. User brings the modern world TO the philosopher
- **Allowed tools**: `Read`, `AskUserQuestion` only — pure dialogue
- **Model**: `opus` — persona maintenance requires deep reasoning
- **Context**: `main` — dialogue needs conversation history
