# Positioning Intake — The 6-Block Anchor

**Runs after** Ex 0 (Goal Selection), Ex 0.1 (Non-goals), Ex 0.2 (Voice capture).

This is a **thought-leadership + business-development intake**, not a job-seeker intake. Skipping or half-running it produces generic output.

Elicit each block with concrete examples, not abstractions. Refuse vague answers — push back until you get specifics. **Every block must be filtered through the chosen goal from Ex 0.** Same block, different goal = different answer.

## The 6 blocks

### 1. Who you are (for LinkedIn purposes, for THIS goal)

Not your job title. The positioning statement a stranger would use to introduce you — specifically optimized for your chosen goal.

**Good examples (notice how goal changes the framing)**:
- Goal = CTO-as-a-service: "Fractional CTO for Series A–B B2B SaaS scale-ups navigating the 50-200 employee window"
- Goal = CTO co-founder: "Technical co-founder for non-technical domain experts building zero-to-one in B2B infrastructure"
- Goal = thought leader: "Engineering leader writing about the intersection of AI tooling and team productivity"
- Goal = hire-me CTO: "Engineering executive scaling 100+ person orgs at Series C-D SaaS"

**Bad (reject these)**:
- "Senior Software Engineer" (job title, not positioning)
- "Passionate about technology" (filler, zero signal)
- "Helping companies succeed" (no specificity)
- "Polymath / generalist / T-shaped" (positioning-as-hedge)

Also capture: **geography signal** (for search discoverability), **years-of-experience signal** (for authority).

### 2. What you sell (in practice, for THIS goal)

Concrete artifacts, engagements, deliverables that someone pays for — or scope composed if employed. Goal-aware.

**Good examples**:
- Goal = CTO-as-a-service: "Technical strategy audits (1 week), team rebuild engagements (3-6 months), architecture decision workshops (2 days)"
- Goal = CTO co-founder: "Equity-based engagement; full-time after PMF; MVP-to-Series A scope"
- Goal = thought leader: "Keynotes, podcast appearances, private workshops for leadership teams"
- Goal = hire-me CTO: "Team scope: 40-100 engineers across 5-8 squads; P&L + hiring + architecture"

**For employed-track personas**: scope, team size, budget, decisions owned, artifacts that bear your signature.

### 3. Your differentiator

What makes the claim defensible. Must pass the test: **"can only I credibly say this?"**

**Good examples**:
- "I've shipped 4 greenfield B2B infra products, 3 survived past Series B — not a strategist who's never shipped"
- "I rebuild engineering orgs with the people already there — I don't run 'bring-your-own-team' transformations"
- "I write code weekly. I'm not a former-engineer-turned-pundit."

**Bad (reject)**:
- "Quality and excellence" (everyone claims this)
- "Customer-centric" (table stakes)
- "Innovative" (empty)
- "Results-oriented" (meaningless without proof)

### 4. Audience

Who should pause on this profile? Be specific about role, seniority, situation, **and the moment of search**.

**Good examples**:
- "VP Engineering at a Series B SaaS (80-200 engineers) facing post-ZIRP cost pressure, searching on a Tuesday afternoon for 'fractional CTO AWS'"
- "Non-technical founder post-MVP, raising pre-seed, scouting co-founder profiles their angel network recommended"
- "CHRO at regulated F500 navigating AI policy under legal scrutiny"

**Bad**:
- "Decision makers" (too broad)
- "Anyone interested in X" (no filter)
- "Senior leaders" (which ones?)

**Moment of search** is the critical addition — what specific trigger or context makes this audience look for someone like the user? It defines keyword strategy (Ex 5) and hook framing (Ex 2).

### 5. Narrative tension — what do you push against?

**This is the block most profiles miss.** What dominant assumption, industry narrative, or conventional wisdom does your positioning contradict?

Positioning without tension reads as compliance to category norms → invisible in feed. Strong positioning names a contrarian stance.

**Good examples**:
- "AI should augment human judgment, not replace it — I reject tool-first adoption narratives"
- "Engineering productivity is a culture problem, not a tooling problem — I reject the 10x-IDE narrative"
- "Fractional ≠ cheap — I sell strategic leadership, not discounted labor"
- "Co-founders need to build, not just strategize — I reject the 'CTO-in-name-only' pattern"

**Bad**:
- No tension articulated (generic category membership)
- Tension is against a strawman ("unlike consultants who don't understand your business")
- Tension is too abstract to land with a real audience

**Test**: would someone disagree with the tension? If not, it's too vague. "Human-centric tech leadership" is not a tension — it's a filler. "Engineering orgs should be rebuilt in place, not replaced wholesale" is a tension.

### 6. Proof asymmetry — what evidence can competitors not replicate?

What specific evidence do you have that makes your claim defensible — evidence a pretender or generalist cannot fake?

**Good examples**:
- "I've run 5 end-to-end team rebuilds; I can tell you the 3 patterns that distinguish success from failure. Most consultants have done 0 or 1."
- "I ran engineering at $X-revenue company for 3 years during [specific transition]; I can name the exact decisions that worked and the 2 that broke things."
- "I have write access to production at 4 current client orgs — not an advisor, an operator."
- "I shipped [specific open-source artifact with specific traction]."

**Bad**:
- "15 years of experience" (tenure ≠ proof)
- "MBA from X" (credential ≠ outcome)
- "Worked at [big name]" (affiliation ≠ your contribution)
- "Passionate about the craft" (belief ≠ evidence)

**Proof asymmetry drives the experience section (Ex 3, STAR method)** — each role description anchors to a specific proof point this block identifies.

## Output format

Save intake as `.tmp/improve-linkedin/{profile-slug}/01-positioning.md`:

```markdown
# Positioning Anchor — {Name}

## Goal served (from Ex 0)
{primary goal — every block below is optimized for this goal}

## 1. Who (for LinkedIn, for this goal)
{positioning statement}
Geography: {region + language signal}
Authority signal: {years / scale / stage}

## 2. What (sell / own, for this goal)
- Engagements / artifacts: ...
- Deliverables: ...
- Scope owned (if employed): ...

## 3. Differentiator
- {defensible claim 1}
- {defensible claim 2}
- Defensibility test: "only I can credibly say X because ..."

## 4. Audience
Primary: {persona + seniority + situation}
Moment of search: {specific trigger or context}
Secondary: {if any, from Tactic B goal stacking}

## 5. Narrative tension
- What I push against: {dominant assumption}
- Concrete stance: {how I operate differently}
- Would someone disagree? {yes/no — if no, refine}

## 6. Proof asymmetry
- Evidence 1: {specific, verifiable}
- Evidence 2: {specific, verifiable}
- What competitors can't fake: {the asymmetric proof}
```

This file is the **source of truth** every subsequent exercise (1–8) reads from.

## Validation gate before proceeding to Ex 1

- [ ] All 6 blocks have concrete specifics (no placeholder phrases)
- [ ] Differentiator passes the "only I can credibly say this" test
- [ ] Audience is a named persona + situation + moment of search
- [ ] Narrative tension is explicit and would generate disagreement
- [ ] Proof asymmetry is verifiable (not a credential list)
- [ ] Every block aligns with the goal from Ex 0 (no drift)

If any fails → return to intake. Do not proceed with weak anchor. **A weak anchor produces weak drafts across all 8 subsequent exercises.**
