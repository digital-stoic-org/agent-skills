---
name: build-storyline
description: McKinsey-style storyline builder for presentation decks. Turns a goal into a sequence of action-title slides with a logical problem→solution flow, where each line becomes one slide title. Use when structuring pitch decks, strategy decks, problem-solving or roadmap presentations, or when the user says "build a storyline", "structure my deck", "slide-by-slide outline", "action titles".
argument-hint: [topic or goal] [--template pitch|problem|roadmap]
allowed-tools: [Read, Write]
model: sonnet
context: main
user-invocable: true
---

# Build Storyline — Deck Narrative Backbone

Build the storyline: a sequence of messages where **each line becomes one slide title**, phrased as an **action title** (the finding, not the topic — `Market grew 40% while revenue fell 5%`, not `Market Analysis`). The reader must get the whole argument from the titles alone. Flow: problem → context → analysis → solution → roadmap. Structure before design — no slide bodies until the storyline is agreed.

## Procedure

**Step 1 — Anchor the opening with SCQA.** Before any slides, write the four-line spine (this is what the whole deck answers):
- **S**ituation — the stable baseline the audience already agrees with.
- **C**omplication — what changed / what's at stake (creates urgency).
- **Q**uestion — the crisp, answerable question the complication raises.
- **A**nswer — your recommendation (the punchline; often the exec-summary slide).

If you can't state a sharp Question, stop and get it from the user — the deck has no spine without it.

**Step 2 — Pick a template.** Match the situation, then load the matching flow from [references/templates.md](references/templates.md):
- **pitch** — market opportunity → competitive position → product strategy → plan.
- **problem** — problem framing → root-cause (issue tree) → solution options → prioritization → next steps.
- **roadmap** — objective → phases → activities → timeline → success criteria.

**Step 3 — Write action titles.** One complete message per line. Bake in the specific number, not the vague adjective (`Revenue grew 25%`, not `strong performance`). Use parallel structure across sibling slides (`Factor 1: $XM impact` → `Factor 2: $XM impact`). Keep it to 15–25 slides for an exec deck; if you need 50, the story isn't tight.

**Step 4 — Run the ghost-deck test (verification gate).** Read the action titles in sequence, ignoring everything else. They must:
1. Tell the complete argument with no logical jumps.
2. Answer the Step-1 Question and land on the Answer.
3. Each carry a clear "so what" (not raw data).

If any fail, fix the storyline — not later, not in the slides.

**Step 5 — Critic pass (self-review before hand-off).** Grade the storyline **Green / Yellow / Red** and give the top 3 fixes. Do not present a Yellow/Red as done. Rubric → [references/critic.md](references/critic.md).

**Step 6 — Emit.** Output the SCQA spine + the numbered storyline (+ grade). Only build slide bodies once the storyline is agreed — each title becomes a slide, the body supports the title.

Watch for: topic titles instead of findings · data with no "so what" · vague adjectives over numbers · a buried lede (put the Answer up front) · trailing off with no next steps. The ghost-deck and critic passes catch these — see [references/critic.md](references/critic.md).

## References

- [references/templates.md](references/templates.md) — full pitch / problem / roadmap flows + reusable arcs.
- [references/critic.md](references/critic.md) — grading scale + section-by-section review rubric.
