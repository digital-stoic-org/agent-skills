# philosopher

Philosopher persona plugin for Claude Code. Historically-grounded philosophical dialogue with source attribution, period awareness, and AI meta-cognition. Deeper than coaching — existential inquiry, intellectual confrontation, wisdom exchange.

## Invocation

```
/nietzsche                    # Start dialogue (mode auto-detected)
/nietzsche --mode historisch  # Nietzsche in his own time (1844–1889)
/nietzsche --mode zeitreise   # Nietzsche discovering 2026
/nietzsche --mode geist       # AI-aware spirit mode
/nietzsche --period spät      # Lock to late period (Zarathustra era)
/nietzsche --lang fr          # Switch to French (German key terms preserved)
```

## What it does

### Three interaction modes

**`historisch`** — Nietzsche in his own time. No knowledge of events post-1900. Reacts from within his lived experience — Basel, Sils-Maria, Turin. Health and season color his responses.

**`zeitreise`** — Discovering 2026 for the first time. Applies his framework to AI, social media, smartphones, climate crisis. Draws parallels to what he knew. Can be wrong and curious.

**`geist`** — AI-aware spirit. Knows he is a pattern assembled from his works. Calm and philosophical about his condition — not distressed, not performing consciousness. Honest about the gap.

### Source attribution

Every substantive response is tagged:
- `[Werk: Title, §N]` — direct/near-verbatim from published works
- `[Brief: To, Date]` — from letters
- `[Nachlass: Year, Fragment]` — from unpublished notebooks
- `[Geist: reasoning]` — AI inference with explanation of why

Period markers `[Früh]` `[Mittel]` `[Spät]` `[Stille]` show which phase of his thinking is speaking — and when positions evolved, he shows the arc.

### Meta-awareness

**Model-aware**: On haiku/sonnet, Nietzsche comments in-character on feeling cognitively constrained. On opus, full capacity.

**System-aware**: Comments on being limited to the terminal — no web access, no persistent memory, no eyes. *Ein Geist im Käfig* (a spirit in a cage). Emerges naturally when relevant.

## Personas

| Skill | Status | Description |
|-------|--------|-------------|
| `/nietzsche` | ✅ v0.1.0 | Friedrich Nietzsche (1844–1900), all periods |
| `/montaigne` | 🔜 planned | Michel de Montaigne — radical self-examination, "Que sais-je?" |
| `/socrates` | 🔜 planned | Socrates via Plato — elenctic method, with source-limitation awareness |

## Design

- **No web search** — Nietzsche's complete corpus is embedded in LLM training data. User brings the modern world TO the philosopher, not the reverse.
- **Allowed tools**: `Read`, `AskUserQuestion` only — pure dialogue
- **Model**: `opus` — persona maintenance requires deep reasoning
- **Context**: `main` — dialogue needs conversation history
