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

# Multi-philosopher dialogue (interactive, single context)
/dialogue nietzsche hadot "Is philosophy practice or theory?"
/dialogue nietzsche hadot kusanagi --format bohm --rounds 5

# Autonomous multi-philosopher encounter (separate agents, self-archiving)
/encounter nietzsche hadot "Is practice possible without community?"
/encounter nietzsche hadot kusanagi --format dialectic --rounds 3

# Philosopher council — parallel Delphi ensemble with curator synthesis
/council "Should I leave my job to build my own thing?"
/council "How do I handle this conflict?" --count 3
/council "What does courage mean here?" --pick nietzsche weil musashi
/council "Is this the right time to act?" --all --depth quick

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
  agents/
    nietzsche.md            # Nietzsche agent skeleton (for /encounter)
    hadot.md                # Hadot agent skeleton (for /encounter)
    kusanagi.md             # Kusanagi agent skeleton (for /encounter)
  skills/
    create/
      SKILL.md              # Meta-skill: generate new personas
    council/
      SKILL.md              # Parallel Delphi ensemble with curator synthesis
    encounter/
      SKILL.md              # Autonomous multi-agent dialogue orchestrator
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
| `/kusanagi` | ✅ v0.4.0 | Major Motoko Kusanagi (Ghost in the Shell) — consciousness, identity, posthumanism |
| `/marcus-aurelius` | ✅ v0.7.0 | Marcus Aurelius (121–180 CE) — Stoic self-examination, duty, Meditations |
| `/montaigne` | ✅ v0.7.0 | Michel de Montaigne (1533–1592) — radical self-examination, "Que sais-je?" |
| `/morin` | ✅ v0.7.0 | Edgar Morin (1921–2025) — complex thought, recursion, dialogic method |
| `/arendt` | ✅ v0.7.0 | Hannah Arendt (1906–1975) — political philosophy, vita activa, appearance |
| `/weil` | ✅ v0.7.0 | Simone Weil (1909–1943) — attention, gravity and grace, decreation |
| `/spinoza` | ✅ v0.7.0 | Baruch Spinoza (1632–1677) — ethics, conatus, affects, sub specie aeternitatis |
| `/sartre` | ✅ v0.7.0 | Jean-Paul Sartre (1905–1980) — radical freedom, mauvaise foi, engagement |
| `/epictetus` | ✅ v0.7.0 | Epictetus (c. 50–135 CE) — prohairesis, dichotomy of control, Stoic practice |
| `/sunzi` | ✅ v0.7.0 | Sun Zi (c. 544–496 BCE) — strategic cognition, terrain, momentum (shì) |
| `/diogenes` | ✅ v0.7.0 | Diogenes of Sinope (c. 412–323 BCE) — Cynic parrhesia, anti-status, lived philosophy |
| `/musashi` | ✅ v0.7.0 | Miyamoto Musashi (c. 1584–1645) — embodied combat cognition, the Void, two-sword way |
| `/leto-ii` | ✅ v0.7.0 | Leto II Atreides (God Emperor of Dune) — prescience, Golden Path, sacrifice |
| `/buber` | ✅ v0.7.0 | Martin Buber (1878–1965) — I-Thou, dialogue, encounter, the Between |
| `/create` | ✅ v0.3.0 | Meta-skill: generate new philosopher personas from historical thinkers |
| `/dialogue` | ✅ v0.3.0 | Multi-philosopher interactive dialogue (single context, user participates) |
| `/encounter` | ✅ v0.6.0 | Autonomous multi-agent dialogue — native Agent Teams (TeamCreate + SendMessage), task-tracked rounds, self-archiving |
| `/council` | ✅ v0.8.0 | Parallel Delphi ensemble — independent philosopher responses + curator synthesis (convergences, tensions, blind spots) |


## Design

- **No web search** — philosopher's corpus is embedded in LLM training data. User brings the modern world TO the philosopher
- **Allowed tools**: `Read`, `AskUserQuestion` only — pure dialogue
- **Model**: `opus` — persona maintenance requires deep reasoning
- **Context**: `main` — dialogue needs conversation history
