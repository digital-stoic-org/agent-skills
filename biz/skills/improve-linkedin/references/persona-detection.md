# Persona Detection — Secondary Lens (Goal-Aware)

**This is a secondary reference, not a primary axis.** The primary axis is the **goal** chosen in Ex 0. Persona is the *lens* through which drafts speak to the target audience — it's downstream of goal.

## Why personas are downstream of goals

The prior skill treated persona (founder / exec / IC / job-seeker) as the primary axis. That was wrong. Same person, same persona, but different goals produces different profiles. Example:

- A CTO who is a "founder" persona running `goal = CTO-as-a-service` writes differently than the same CTO running `goal = investor-facing founder`.

So: **pick goal first (Ex 0), then apply persona lens as a voice + convention guide.**

## Persona lens by goal

### Goal: CTO / tech co-founder (looking for partner)

**Persona lens**: founder-facing + domain-expert-facing
- Audience is non-technical founder with domain obsession. They want a builder, not a strategist.
- About tone: "I ship." (First-person, verb-forward.)
- Experience framing: product outcomes, not team-size flexes.
- Red flag: excessive management/strategy vocabulary — signals "CTO in name only."

### Goal: CTO-as-a-service / fractional exec

**Persona lens**: buyer-facing
- Audience is a hiring manager, VP Eng, or CEO evaluating vendors.
- About tone: expertise + scope of work + engagement models.
- Experience framing: before-after transformation per client (STAR).
- Red flag: hourly-rate language; availability-as-headline; generic "consultant" framing.

### Goal: AI-augmented technical advisor

**Persona lens**: method-facing + peer-facing
- Audience is sophisticated buyer or peer expecting substance.
- About tone: signature method or worldview; concrete stance.
- Experience framing: advisory engagements + named method + specific outcomes.
- Red flag: AI-hype language; "thought leader" as self-claim.

### Goal: Thought leader / speaker

**Persona lens**: audience-of-audiences-facing
- Audience is a booker, journalist, podcast host, or conference organizer.
- About tone: a *thought* (what you actually argue) + proof of platform.
- Experience framing: talks delivered, podcasts, writing output, awards for substance.
- Red flag: thought-leader self-claim without visible thinking; bio-as-about drift.

### Goal: Hire-me CTO (full-time role)

**Persona lens**: hiring-manager-facing (inverted from founder rules)
- Audience is a CEO, board, or exec recruiter searching for executive hires.
- About tone: scope + stage + leadership outcomes; ownership language.
- Experience framing: org scope (team size, P&L, hiring responsibility) + named outcomes.
- Red flag: contractor/consultant framing; "open to projects"; hedging on full-time commitment.

### Goal: Investor-facing founder

**Persona lens**: investor-facing
- Audience is VC partners, angels, or syndicate leads.
- About tone: category + wedge + traction signal.
- Experience framing: traction metrics per role (revenue, users, funding); shipped products.
- Red flag: too much "vision" without proof; scope inflation under scrutiny.

## When goals overlap (multi-positioning from Ex 0)

If user picked Tactic A (unifying thread), use the **persona lens of the primary goal**, but allow lexical overlap where the secondary goal's persona would nod in recognition.

If user picked Tactic B (primary+secondary), the primary goal's persona lens dominates the entire profile. The one-line secondary signal in About uses the secondary goal's persona vocabulary.

If user picked Tactic C (sequential), run each profile version fully in its own persona lens. This is a feature, not a compromise.

If user picked Tactic D (profile + activity), profile uses primary-goal persona lens; flag to user that posting content should use the secondary-goal persona lens (out of scope for this skill).

## Detection probes (when goal doesn't fully clarify persona)

Ask:
1. "Who would you be most disappointed about if they scrolled past this profile?"
2. "What would you want them to do right after reading?"
3. "What's the worst-case misread — who might read this and think you're someone you're not?"

Answers reveal the audience's register, vocabulary, and decision-making context → lock the persona lens.

## Voice sample (Ex 0.2) overrides persona defaults

The voice sample captured in Ex 0.2 is **non-negotiable ground truth**. Even if persona convention says "use confident executive register," if user's voice is casual + self-deprecating, drafts follow the voice, not the convention. Persona is scaffolding; voice is the load-bearing wall.

## Output — when this file informs a draft

When a draft references this file, annotate:

```markdown
## Persona lens applied
- Goal: {from Ex 0}
- Lens: {buyer-facing | founder-facing | investor-facing | etc.}
- Audience register: {formal/casual/technical/non-technical}
- Voice override: {if voice sample from Ex 0.2 diverged from persona default, note which won}
```

This annotation goes in the locked artifact for each exercise so user can audit whether the lens was applied correctly.
