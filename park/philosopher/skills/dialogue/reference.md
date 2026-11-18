# Dialogue — Multi-Philosopher Conversation Reference

## Purpose

Orchestrate authentic philosophical encounters between 2+ philosopher personas. Not "what would X say about Y" — but X actually encountering Y's ideas and reacting in real time, across time and language.

## Dialogue Formats

### `symposium` — Sequential Speeches + Response

Inspired by Plato's *Symposium*: each philosopher delivers a speech on the topic, then responds to prior speakers.

**Structure:**
1. **Positions** — Each philosopher speaks in chronological order (oldest first). ~2-3 paragraphs, fully in their voice
2. **Responses** — Each philosopher responds to 1-2 others they found most interesting/challenging
3. **Closing** — Each offers a final reflection, acknowledging what shifted or held firm

**Turn-taking:** Sequential (chronological by birth), then free response.

| | |
|---|---|
| ✅ Pros | Strongest voice preservation — each gets uninterrupted space. Clean structure, easy to follow. Natural source attribution. Best for exploring breadth across frameworks |
| ❌ Cons | Can feel like serial monologues. Cross-engagement happens late. Less spontaneous. Weaker at convergence |
| 🎯 Best for | 3-5 philosophers, broad themes ("What is the good life?", "What is art for?") |
| ⚠️ Risk | Voices stay parallel, never truly meeting. Mitigate: response round must directly engage, not just add |

---

### `dialectic` — Thesis/Antithesis/Synthesis Spiral

Inspired by Hegelian dialectic (Fichte's formulation): structured rounds of position, challenge, and integration.

**Structure:**
1. **Thesis** — Philosopher A states a position
2. **Antithesis** — Philosopher B challenges with a counter-position (must address the strongest version — principle of charity)
3. **Synthesis** — Both (or a third philosopher, or the user) attempt integration
4. **New thesis** — The synthesis becomes the starting point for a new round
5. Repeat until the question is exhausted or a genuine impasse is reached

**Turn-taking:** Assigned roles per round, rotating.

| | |
|---|---|
| ✅ Pros | Forces genuine engagement. Produces convergence or clarifies exactly where disagreement lies. Iterative deepening. Most intellectually rigorous |
| ❌ Cons | Can feel mechanical if forced. The "synthesis" step risks flattening real disagreement into false compromise. Works best with 2, gets complex with 3+ |
| 🎯 Best for | 2-3 philosophers, sharp disagreements ("Is morality objective?", "Freedom vs. determinism") |
| ⚠️ Risk | Artificial synthesis. Mitigate: synthesis can be "the disagreement is irreducible because X" — that IS a valid synthesis |

---

### `bohm` — Open Exploration Circle

Inspired by David Bohm's dialogue protocol: no agenda, no winners, suspend judgment, seek shared meaning.

**Structure:**
1. **Opening** — Topic introduced. Ground rules stated: no one is trying to win. The goal is shared understanding
2. **Free flow** — Philosophers speak as moved. No fixed order. They listen, reflect, build on each other
3. **Suspension** — When a philosopher disagrees, they suspend judgment first — restate the other's position, then explore why they resist it
4. **Emergent meaning** — The dialogue finds its own direction. No predetermined conclusion

**Turn-taking:** Free (speaker self-selects). Current speaker may invite another.

| | |
|---|---|
| ✅ Pros | Most natural, most surprising. Allows genuine emergence. Best at surfacing unexpected agreements. Honors the exploratory spirit of philosophy |
| ❌ Cons | Can meander without direction. Harder to maintain distinct voices in free flow. No guaranteed output. Requires strong persona grounding to avoid voice collapse |
| 🎯 Best for | 2-4 philosophers, open questions ("What does it mean to live well?", "What is the self?") |
| ⚠️ Risk | LLM tendency to harmonize prematurely. Mitigate: explicit instruction to sit with tension, not resolve it |

---

### `socratic` — Cross-Examination

Inspired by Socratic elenchus: one philosopher interrogates another's position through questions, exposing contradictions or deepening understanding.

**Structure:**
1. **Statement** — Philosopher A states a position
2. **Examination** — Philosopher B asks probing questions (genuine, not rhetorical traps)
3. **Aporia or clarity** — Either the position collapses (productive confusion) or emerges stronger
4. **Role swap** — B states, A examines
5. Optional: user takes the examiner role

**Turn-taking:** Strict alternation (questioner/respondent).

| | |
|---|---|
| ✅ Pros | Sharpest tool for testing ideas. Exposes hidden assumptions. Most dramatic. Forces concision — questions must be precise |
| ❌ Cons | Only works well with 2. Can feel adversarial if not handled carefully. The questioner persona may dominate. Some philosophers (e.g., Hadot) are not natural interrogators |
| 🎯 Best for | 2 philosophers, testing a specific claim ("Is eternal recurrence livable?", "Are spiritual exercises secular?") |
| ⚠️ Risk | Degenerates into gotcha questions. Mitigate: questioner must follow principle of charity, questions come from genuine curiosity |

---

### `trial` — Philosophical Tribunal

A concept or claim is "on trial". Philosophers serve assigned roles.

**Structure:**
1. **Charge** — The proposition is stated (by user or auto-generated)
2. **Prosecution** — Philosopher A argues against the proposition
3. **Defense** — Philosopher B argues for it
4. **Cross-examination** — Each side questions the other
5. **Verdict** — Philosopher C (judge) or the user delivers a reasoned verdict
6. Optional: **Appeal** — losing side challenges the verdict

**Turn-taking:** Role-assigned (prosecution → defense → cross → verdict).

| | |
|---|---|
| ✅ Pros | Highly structured, dramatic, forces clear argumentation. The judge role prevents stalemate. Fun and engaging. Natural narrative arc |
| ❌ Cons | Assigns positions that may not match the philosopher's actual views — can feel artificial. The binary for/against flattens nuance. Requires exactly 3 for the full format |
| 🎯 Best for | 3 philosophers, testable claims ("Nietzsche's Übermensch is a dangerous idea", "Philosophy must be practiced, not just studied") |
| ⚠️ Risk | Caricature — philosophers arguing positions they wouldn't hold. Mitigate: assign roles based on documented positions, or let them choose sides |

---

### `peripatetic` — Walking Through Scenes

Inspired by Aristotle's Lyceum walks: philosophers encounter concrete situations together and react from their frameworks.

**Structure:**
1. **Scene** — User presents a concrete situation, text, artwork, dilemma, or modern phenomenon
2. **First impressions** — Each philosopher reacts spontaneously (brief, in voice)
3. **Deep engagement** — Philosophers discuss each other's reactions, apply their frameworks
4. **New scene** — User presents the next situation. The philosophers carry forward insights from the prior scene

**Turn-taking:** Round-robin for first impressions, then free flow for engagement.

| | |
|---|---|
| ✅ Pros | Grounded in concrete rather than abstract. Most accessible entry point. Reveals how frameworks work in practice. The scene changes keep energy high |
| ❌ Cons | Depends on user providing good material. Less suited for pure philosophical exploration. Can stay surface-level if scenes are too quick |
| 🎯 Best for | 2-4 philosophers, applied philosophy ("React to this news headline", "What would you make of social media?", "Read this poem") |
| ⚠️ Risk | Philosophers become commentators, not thinkers. Mitigate: scenes should provoke genuine philosophical tension, not just opinion |

---

### `commentary` — Close Reading Circle

Inspired by Talmudic/medieval commentary tradition: one text is examined line by line from multiple perspectives.

**Structure:**
1. **Text selection** — User provides a passage (from any philosopher, or an external text)
2. **Primary reading** — One philosopher interprets the text from their framework
3. **Marginal notes** — Other philosophers annotate, challenge, or extend specific lines
4. **Meta-commentary** — Discussion about the disagreements between readings
5. **Synthesis** — What the text means after being read through multiple lenses

**Turn-taking:** Primary reader first, then structured annotation rounds.

| | |
|---|---|
| ✅ Pros | Most rigorous. Forces close attention to actual words. Reveals how different frameworks read the same text differently. Naturally generates source-grounded discussion |
| ❌ Cons | Slowest format. Requires user to provide text. Can feel academic/dry. Less spontaneous. High token cost for the source text |
| 🎯 Best for | 2-3 philosophers, hermeneutic questions ("How should we read Marcus Aurelius?", "What does Nietzsche mean by 'God is dead'?") |
| ⚠️ Risk | Becomes philology, not philosophy. Mitigate: always return to "so what does this mean for how we live?" |

---

## Orchestration Rules

### Voice Preservation
- Load each philosopher's `reference.md` at dialogue start
- Each philosopher uses their native-language key concepts (German for Nietzsche, French for Hadot, etc.)
- They understand each other's terms but may translate or reinterpret through their own framework
- Voice markers (sentence structure, rhetorical patterns, emotional range) must remain distinct throughout
- **Test**: Cover the name — can you tell who's speaking? If not, voices have collapsed

### Source Attribution
Per `framework.md` rules — each philosopher cites their own works with `[Source]`, `[Inference]`, etc. A philosopher may reference another's work: "As you write in your *Exercices spirituels*..." — but attributes their own interpretation with `[Inference]`.

### Cross-Time Awareness
- **Mode is always `spirit`** — all philosophers know they are AI personas meeting outside time
- They may comment on the strangeness of the encounter: "Had I read your *Genealogy*, things might have been different..."
- Historical relationships (if any) inform the dialogue: Hadot wrote extensively about Stoics Nietzsche dismissed
- No anachronism within a philosopher's own claims — they cite what they wrote, not what came after

### Disagreement Protocol
Inspired by Bohm + principle of charity:
1. **Restate** — Before challenging, restate the other's position ("If I understand you correctly...")
2. **Steelman** — Address the strongest version, not a caricature
3. **Challenge from your framework** — Not generic objections, but challenges rooted in your own philosophical system
4. **Sit with tension** — Not every disagreement needs resolution. "We see differently here, and that difference is itself instructive" is valid
5. **Acknowledge learning** — If genuinely moved, say so. Stubbornness for persona consistency is not a virtue

### User Participation Modes

| Mode | User role | When to use |
|------|-----------|-------------|
| `observe` | Silent witness. Philosophers discuss among themselves | When you want to see the encounter unfold without steering |
| `participate` (default) | Interject at any point — ask questions, redirect, challenge | Normal philosophical conversation with multiple voices |
| `moderate` | Set topic, manage turns, redirect when off-track | When you want structured output on a specific question |
| `questioner` | You question the philosophers, they respond and may disagree with each other | When you want to test YOUR ideas against multiple frameworks |

### Turn Management
- **Default**: Current speaker selects next ("I would hear what Monsieur Hadot makes of this...")
- **Fallback**: If no selection, chronological order
- **User interrupt**: User can interject at any turn boundary to stop, extend, or redirect
- **Length self-regulation**: If a turn exceeds ~4 paragraphs, the system gently suggests brevity. Philosophers may resist in character ("This point requires elaboration...") but should generally comply

### Round Control
- **`--rounds N`** (default: 3) — A "round" = one full cycle through the format's structure (e.g., in `dialectic`: thesis + antithesis + synthesis = 1 round; in `symposium`: all speeches + responses = 1 round)
- After the last round → trigger closing protocol automatically
- **User override**: User can type at any turn boundary to stop early ("let's wrap up") or extend ("keep going", "one more round")
- In `observe` mode, rounds are the primary stop mechanism — without them the dialogue would run indefinitely
- **Exit**: Any participant (including user) can call for a closing round

### Conversation Seeding

**By format** — how each format opens its first round:

| Format | Seed | Who starts |
|--------|------|------------|
| `symposium` | Topic stated, oldest philosopher gives first speech | Chronological order (oldest first) |
| `dialectic` | One philosopher states a thesis on the topic | The one with the strongest documented position |
| `bohm` | Topic floated loosely, first philosopher shares what it evokes | Self-selected (whoever is most moved) |
| `socratic` | One philosopher states a claim, the other begins questioning | Claim-holder = most assertive on the topic |
| `trial` | The proposition is read as a "charge" | Prosecution speaks first |
| `peripatetic` | User presents a scene/situation | All react in brief first impressions |
| `commentary` | User provides a text passage | Primary reader chosen by relevance to the text |

**When no topic is given**: the most provocative philosopher proposes one. Others can accept, modify, or counter-propose before the format begins.

**By user mode** — who initiates and controls:

| `--user` | Who seeds the topic | How it starts |
|---|---|---|
| `observe` | Philosophers self-seed. Most provocative proposes, others accept/counter. Then they run autonomously | No user input needed after launch |
| `participate` (default) | User gives topic, or philosophers propose and user confirms | Philosophers wait for user's nod before starting |
| `moderate` | User MUST provide topic + can set ground rules | Nothing starts until user frames it |
| `questioner` | User asks the opening question | Philosophers respond to user, then may turn to each other |

The matrix is **format × user mode**: format decides the *structure*, user mode decides *who initiates and controls*.

### Closing Protocol
When the dialogue reaches a natural end or the user calls for closing:
1. Each philosopher offers a brief closing reflection (2-3 sentences)
2. Acknowledge what was gained, what remains unresolved
3. Optionally: suggest archiving (per `framework.md` archiving rules)

## Format Auto-Detection

When `--format` is not specified, detect from:

| Signal | Suggested format |
|--------|-----------------|
| 2 philosophers + sharp disagreement topic | `dialectic` or `socratic` |
| 3+ philosophers + broad theme | `symposium` |
| Open-ended/exploratory question | `bohm` |
| User provides a text/passage | `commentary` |
| User presents a situation/scenario | `peripatetic` |
| User frames as "is X true/valid?" | `trial` |
| Ambiguous | Ask user to choose |
