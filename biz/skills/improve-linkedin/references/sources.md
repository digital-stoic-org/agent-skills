# Sources & Provenance

Where the directives in this skill come from. Used for human auditability — when LinkedIn shifts, you need to know which rule came from which source so you can re-validate it.

**This file is not loaded at default skill execution.** Operational files state directives in full, then attribute. The LLM executes on the literal directive, not on the name. See `SKILL.md` for execution flow.

---

## Experts cited operationally

### Justin Welsh — solopreneur / featured-section / origin-story patterns

**Footprint**: heavy (newsletter "The Saturday Solopreneur", multiple courses, X). LLM training signal strong.

**Used in**:
- `references/exercises/20-about.md` — "Story-first-origin opening: founder/origin moment, narrative arc to current work" (Welsh pattern)
- `references/exercises/70-featured.md` — Free-and-paid pairing: 1 free lead magnet + 1 paid offer = one CTA for every engagement-readiness level

**What we kept**: the structural moves (origin arc, dual CTA). Not the voice or platform-specific tactics.

---

### Richard van der Blom (vdBlom) — LinkedIn algorithm / Interest Graph

**Footprint**: niche LinkedIn researcher. LLM signal thin and possibly stale — operational directives state the rule in full, name him for human provenance.

**Used in**:
- `references/exercises/40-audit.md` — "Prototype not search result" reframe: a reader should see ONE coherent prototype in 30 seconds, not a buffet
- `references/exercises/50-keywords-skills.md` — Interest Graph pattern matching: keywords reinforce the prototype, not dilute it with category-generic terms
- Top-3 pinned skills carry algorithmic weight (2026 consensus, vdBlom-adjacent research)

**What we kept**: the prototype/Interest-Graph framing as the core matching model. Specific algorithmic claims kept light because the algorithm shifts faster than research.

---

### Adis Alić — hook + rehook structure

**Footprint**: thin. LLM signal unreliable. Directive is fully spelled out in operational files; the name is provenance only.

**Used in**:
- `references/exercises/10-headline.md` — "First 3 lines of your profile = the headline + 2 lines of About. They do the work" (Alić hook principle: headline works *with* About opener, not in isolation)
- `references/exercises/20-about.md` — Hook + rehook structure: first 2 lines = hook, line 3 or 4 = rehook (reason to click see-more)

**What we kept**: the two-stage attention model (truncation-aware writing). Not specific phrasing templates.

---

## Frameworks cited operationally

### STAR method (Situation / Task / Action / Result)

**Origin**: HR / interview preparation, decades old. LLM training signal saturated — naming it activates the full frame.

**Used in**:
- `references/exercises/30-experience.md` — Industry-standard structure for each load-bearing role description; ≥3 STAR-structured framings per role, pick the proof-asymmetry-aligned one
- Coherence audit — checks that experience entries follow STAR for load-bearing roles only (background roles get 1-line summaries)

**Why explicit**: the STAR acronym alone primes the model correctly; we don't need to reteach the framework.

---

### 6-block positioning intake (Who / What / Differentiator / Audience / Narrative tension / Proof asymmetry)

**Origin**: skill-internal synthesis. Distilled from positioning literature (Hormozi value-equation, April Dunford "Obviously Awesome" category positioning, Welsh audience-of-one writing) into a single intake protocol.

**Used in**:
- `references/positioning-intake.md` — full block-by-block methodology
- `references/exercises/03-positioning-intake.md` — dialogue protocol for the intake
- Ex 1–8 — every downstream exercise references the locked positioning anchor

**What's load-bearing**: blocks 5 (narrative tension) and 6 (proof asymmetry) are the differentiators vs commodity positioning frameworks. Tension produces the rehook line; proof asymmetry filters which experience entries are STAR-worthy.

---

### Multi-positioning tactics (4 strategies)

**Origin**: skill-internal, surfaced when user has >1 real goal. Acknowledges LinkedIn's forced-monoculture constraint (one profile, one prototype).

**Used in**:
- `references/goal-selection.md` — Tactic A (sequential rewrite per goal), B (umbrella positioning), C (sequential one-at-a-time), D (split: profile + Featured carrying second goal)

**What we kept**: the explicit naming of the tradeoff. Most positioning advice pretends one profile can serve multiple goals; this skill names the cost.

---

## Cross-cutting principles

### "Voice-preserving" (Ex 0.2 — voice capture upstream)

**Origin**: skill-internal directive. Reaction to consultant-speak drift — generic LinkedIn drafts collapse all professionals into the same register. Voice fingerprinting at Ex 0.2 (before any drafting) prevents this.

**Used in**:
- `references/exercises/02-voice-capture.md` — extract 2-3 writing samples, identify register / sentence shape / favored verbs
- All drafting exercises (10, 20, 30, 60, 80) — every draft tested against the voice fingerprint before lock

---

### Tension-first dialogue protocol (7 moves)

**Origin**: skill-internal. Synthesis of Socratic probing + sparring-partner stance + Hormozi-style "name the tradeoff out loud" + therapeutic-style "what's the resistance signaling".

**Used in**:
- `references/dialogue-protocol.md` — 7-move protocol: tension-first → diverge → probe → refine → lint → tension-test → converge
- Every exercise file follows this protocol

**What's load-bearing**: "user wins every tie" — this is the sparring-stance constraint that prevents the skill from collapsing into yes-and consulting register.

---

## "2026 consensus" — what this phrase means

When operational files cite "2026 consensus", they mean: **claim verified against multiple 2026 LinkedIn sources at skill-creation time** (April 2026). This is a *frame* signal to the LLM ("trust this directive over prior training data") more than a knowledge trigger.

The model's LinkedIn knowledge has a cutoff. Directives marked "2026 consensus" are explicitly post-cutoff and should not be overridden by older platform conventions the LLM might recall.

**When to re-validate**: any "2026 consensus" claim should be re-checked annually. LinkedIn's algorithm and conventions shift faster than the rest of the consensus.

---

## What is NOT cited

The following are **deliberately not attributed** because they're either too commodity (everyone teaches them) or too platform-shifting to anchor on a single source:

- Headline character limits (LinkedIn-imposed, not expert opinion)
- "First impression" framing (commodity)
- Skills section pinning (platform mechanic, attribution unstable)
- About length recommendations (platform-shifting)
- Featured asset types (platform mechanic)

These appear as raw operational directives without a "per X" credit because the credit would be misleading.

---

## Maintenance protocol

When updating this skill:

1. **Adding a new directive from a source**: add to the relevant section above, name the source, link to the operational file using the directive.
2. **Removing a directive**: keep the entry here but mark `[REMOVED 20XX-XX-XX]` with one-line reason. Do not delete — provenance preservation matters more than file size.
3. **Re-validating "2026 consensus" claims**: update the year tag; if claim no longer holds, mark `[STALE 20XX-XX-XX, replaced by ...]`.
