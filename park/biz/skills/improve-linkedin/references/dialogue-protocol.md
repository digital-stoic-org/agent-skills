# Per-Exercise Dialogue Protocol

Every exercise (1–8) runs this shape. Deviation = skill is in batch mode (escape hatch), flag to user.

## The 7 moves

1. **Open with tension** — name the strategic tension this exercise must resolve (pull from exercise file). Ask user which side wins, **before** drafting.
2. **Diverge** — ≥3 genuinely different angles (≥5 for Headline and UVP). Label each distinctly.
3. **Probe** — "which makes you wince? which lands? which is too safe?"
4. **Refine** — iterate picked angle; show the diff, not just the new version.
5. **Anti-pattern lint** — flag, don't silently fix. See `anti-patterns.md`.
6. **Tension tester** — apply strategic-note probe from exercise file.
7. **Converge** — user signals `[lock]`. Save artifact. Carry context to next exercise.

## Affordances offered at every turn

- `[more options]`
- `[push harder on X]`
- `[kill this angle]`
- `[try different lens]`
- `[lock this and move on]`

## Cross-exercise memory (mandatory)

At each exercise start, recall prior decisions explicitly:
- The chosen **goal** from Ex 0 (filters every subsequent draft)
- The voice fingerprint from Ex 0.2
- The 6-block positioning anchor from Ex 0.3
- Prior locks ("In Ex 1 you locked angle X because Y")
- Prior rejections ("In Ex 1 you killed 'AI-augmented' as too buzzy — I'll avoid that frame here")

Without this memory, drafts drift across exercises and coherence fails (surfaced in Ex 4 audit).

## Locked artifact format (per exercise)

Every locked exercise output is saved to `.tmp/improve-linkedin/{profile-slug}/{NN}-{section}.md` with this structure:

```markdown
## Goal served
[which goal from Ex 0 this draft optimizes for]

## {Section} — Before
[current text / baseline]

## {Section} — After (locked)
[converged version]

## Angles explored
- [rejected angle 1] — killed because [user's reason]
- [rejected angle 2] — killed because [user's reason]
- [locked angle] — chosen because [user's reason]

## Tension resolved
[which side of the strategic tension won, per user]

## Anchor alignment
- Who: ✅ / What: ✅ / Differentiator: ⚠️ / Audience: ✅ / Tension: ✅ / Proof: ⚠️

## Voice mirror check
[how this draft echoes the voice sample from Ex 0.2]

## Anti-patterns flagged
[list, or "none"; include any overrides user chose]
```

## Mode: batch (escape hatch only)

Batch mode skips dialogue and emits drafts with rationale. Used for:
- Async review of a third-party profile (not user's own)
- Quick second-opinion passes when user has run the full dialogue before
- Time-pressured scenarios where user explicitly requests batch

**Default is dialogue.** Batch requires user to explicitly invoke `--mode batch` (or equivalent). Skill should resist batch when:
- No voice sample exists (batch without voice = consultant-speak drift guaranteed)
- Goal selection (Ex 0) is incomplete (batch without goal = aimless drafts)

If batch is invoked despite these gaps: skill proceeds but flags heavily in the output that quality will be degraded.

## Sequence protocol

Sequence 0 → 0.1 → 0.2 → 0.3 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 is **advised, not gated** (except Ex 0, which is mandatory).

If user wants to jump (e.g., straight to Headline without intake): surface the risk explicitly.
> "Jumping to Headline without positioning anchor (Ex 0.3) means I'll draft against assumptions, not evidence. Your call — proceed or back up?"

If user proceeds anyway: skill uses best-effort inference from available inputs and flags gaps in the locked artifact.
