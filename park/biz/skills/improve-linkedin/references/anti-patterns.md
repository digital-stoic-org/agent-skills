# Anti-Patterns — Consolidated Lint List

Run this lint pass on every generated draft, regardless of exercise. Flag matches before presenting output to the user. **Never silently "fix" — surface to user for judgment.**

## Core rule

A draft that is *worse written* but *more the user's voice* beats a polished draft that sounds like a consultant.

## Universal anti-patterns (all goals)

### Buzzword stacking
Strings of 3+ generic abstract nouns with no grounding.
- ❌ "Innovation • Leadership • Strategy • Transformation • Impact"
- ❌ "Passionate about building high-performing teams delivering world-class results"
- ✅ Replace with a concrete claim, a named method, or an outcome number.

### Generic category labels
Category nouns that 100,000 other profiles use.
- ❌ "AI Expert", "Digital Transformation Consultant", "Senior Software Engineer"
- ✅ A claim that implies a method or a worldview.

### "I help X do Y" hedging
The opener that sounds specific but isn't.
- ❌ "I help companies grow"
- ❌ "I help leaders succeed"
- ✅ "I rebuild engineering orgs post-ZIRP — 4 rebuilds, 3 hit Series B within 18 months"

"I help" is fine when followed by **named persona + measurable outcome**. Reject when either is missing.

### Third-person self-description in About
Reads like a bio a consultant wrote about themselves.
- ❌ "Alex is a seasoned consultant with 15 years of experience..."
- ✅ First person, voice of the user, read-aloud test: would I actually say this?

### Credential-listing instead of outcomes
Degrees, certifications, tenures without what they enabled.
- ❌ "MBA from INSEAD, 15 years at McKinsey, author of 3 books"
- ✅ Outcomes those credentials produced for specific clients/orgs.

### Passive voice everywhere
Obscures agency, flattens signal.
- ❌ "Strategies were developed and insights were delivered"
- ✅ "I rebuilt the pricing model; margins moved 4 points in 2 quarters."

### Jargon the audience doesn't use
Internal consulting vocabulary when the audience is CEOs. Engineering slang when the audience is non-technical buyers. **Check against the audience block from positioning intake.**

### Activity lists instead of STAR outcomes
Experience section reads as a job description, not transformation evidence.
- ❌ "Responsibilities included managing a team of 10 engineers, running standups, and conducting 1:1s"
- ✅ "Rebuilt a stalled product team (10 → 6 engineers, shipped 3× faster) — [Situation, Task, Action, Result]"

### Generic audience signal
- ❌ "For decision makers"
- ❌ "For anyone interested in X"
- ✅ Named role + situation + moment of search

### Undifferentiable differentiator
Claims everyone makes.
- ❌ "Quality and excellence"
- ❌ "Customer-centric"
- ❌ "Innovative"
- ✅ Defensible claim that passes "only I can credibly say this"

### Claim without proof backing
Bold statement with no evidence.
- ❌ "I transform organizations"
- ✅ "I've run 5 end-to-end rebuilds; 4 hit planned outcomes within 6 months — [specific example]"

### Keyword stuffing
Density > natural integration. Reads as SEO spam.
- ❌ "AI AI transformation AI leadership AI strategy AI governance..."
- ✅ Keywords integrated into natural claims (Ex 5 does this properly).

### Tense inconsistency
Past/present mixing that signals sloppy editing.

## Multi-positioning anti-patterns

### Hedge-positioning without goal decision
Profile tries to signal 3+ goals without a chosen multi-positioning tactic (from Ex 0).
- ❌ Headline: "CTO + Fractional Advisor + Co-founder + Speaker"
- ✅ Pick one goal via Ex 0; use Tactic A/B/C/D if multiple.

### "Polymath" / "slash career" as positioning
Labels used as a substitute for choosing a prototype.
- ❌ "Engineer / Writer / Strategist / Advisor"
- ✅ The unifying thread (Tactic A) must be a *real* narrative, not a slash list.

## Goal-specific anti-patterns

### For hire-me CTO (inverted from founder rules)

**Desperation tone**
- ❌ "Urgently seeking", "Will relocate anywhere", "Any role considered"
- ✅ Specific role + specific value + reason.

**Blame framing**
- ❌ "Looking to leave toxic environment"
- ✅ "Looking for [positive thing] environment"

### For CTO-as-a-service / fractional exec

**Availability signal over expertise signal**
- ❌ "Open to projects" as headline
- ✅ Expertise signal first; availability is implied by the positioning.

**Hourly rate mention in profile**
- Never. Profile = trust, not price negotiation.

**"Fractional = cheap" drift**
If language signals discounted rather than specialized, flag.

### For CTO co-founder

**Vague commitment signal**
- ❌ "Interested in founder opportunities"
- ✅ "Looking for [stage] [domain] co-founder; ready for full-time after [condition]"

**Ambiguity on equity-vs-salary expectations** — skill surfaces this as a gap to resolve, doesn't fill it.

### For thought leader / speaker

**Claiming thought leadership**
- ❌ "Thought leader in AI"
- ✅ A thought — something you actually argue — visible in About / Featured.

**Bio-as-about**
Third-person speaker-bio text dropped into first-person About section. Rewrite for first-person voice.

### For founder (investor-facing)

**Scope inflation that falls apart under scrutiny**
Claiming ownership over outcomes you didn't own. LinkedIn is public — peers and investors will check.

**Announcing internal strategy**
Public profile leaking confidential bets or competitive positioning.

## Voice-flattening flags (run on every rewrite)

Compare draft to original user writing and the voice sample from Ex 0.2. Flag if:

- Sentence-length variance collapsed (all sentences now same length)
- First-person verbs replaced by nominalizations ("I built" → "development of")
- Idiosyncratic phrases removed in favor of generic polish
- Rhythm/cadence changed — original had voice, draft has cleanliness
- User's signature verbs replaced with generic ones (user said "rebuilt" → draft says "managed")
- Register shifted (user writes casually → draft is formal consultant-speak)

## Lint output format

When flagging (at step 5 of per-exercise dialogue shape):

```markdown
## Anti-patterns flagged

### Voice
- ⚠️ Consultant-speak drift: "strategic AI-driven transformation" in About para 1 — user's voice sample uses shorter sentences and plainer verbs
- ⚠️ Voice flattening: original had 2 questions, draft has 0

### Positioning
- ⚠️ Buzzword stacking in headline option 2: "Innovation • Strategy • AI"
- ⚠️ Claim without proof: About says "I transform organizations" — no proof point from positioning intake

### Goal alignment
- ⚠️ Goal drift: headline option 3 reads as hire-me CTO but chosen goal is CTO-as-a-service — "open to roles" signal conflicts
```

**Do not silently fix.** Present the flags. Let user decide what to keep, change, or reject.

## Lint is a dialogue move, not a gate

Anti-pattern detection surfaces tension. User can override with stated reason — record the override in the locked artifact. "User chose to keep 'passionate about' because it's their actual voice" is a valid override and worth preserving.
