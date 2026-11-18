# Goal Selection — Exercise 0

**Purpose**: Establish which specific professional outcome THIS profile serves. Same person + same skills + same experience produces radically different profiles depending on goal selection.

**This is the most load-bearing exercise in the skill.** If the goal is vague or wrong, every subsequent draft is optimized for the wrong audience.

## Why goal-first (not "who are you")

LinkedIn profiles fail when they try to serve "everyone" — the profile becomes a resume of everything the user has ever done, with no prototype for a stranger to recognize. The platform's Interest Graph (post-2025 shift) rewards topic consistency and prototype clarity, not connection count.

**The same person** can credibly be positioned as:
- CTO co-founder looking for a domain partner (signals availability + complementary ambition)
- CTO-as-a-service / fractional CTO (signals multi-client capacity + buyer-ready)
- AI-augmented technical advisor (signals method + depth)
- Thought leader / speaker (signals outbound voice + content presence)
- Hire-me candidate for CTO role (signals availability for full-time)
- Investor-facing founder (signals traction + ambition)

Each demands different headline, different About hook, different experience framing, different featured assets.

## Open-ended elicitation (NOT a closed menu)

Start with open-ended questions. Let user articulate in their own words. Probe relentlessly until concrete.

### Q1 — Outcome specificity

> "What are the 1–3 specific professional outcomes you want FROM this profile in the next 6 months?"

**Probe vague answers until concrete.** Examples of the depth to push for:

| User says | Skill probes | Acceptable answer |
|---|---|---|
| "I want to be seen as a thought leader" | In what domain? By whom? What action do you want them to take? | "I want AI-native tech leaders (VP Eng / CTO) to read my posts and invite me to podcasts — 2-3 invitations in 6 months" |
| "I want more clients" | What kind of engagement? What's the starting conversation? | "I want 2 inbound CTO-as-a-service inquiries per month from Series A SaaS founders" |
| "I want to co-found a startup" | At what stage? What domain? Who approaches whom? | "I want 1-2 domain-expert founders (non-technical, post-MVP) to approach me about joining as CTO co-founder in the next 4 months" |
| "I'm keeping my options open" | That's a non-answer. Which option is the primary bet for THIS profile? | User must pick. Option-hedging on profile = no prototype = invisible. |

**Anti-patterns to push back on**:
- "Brand awareness" (meaningless without named audience + action)
- "Grow my network" (network is downstream of positioning, not an outcome)
- "Be recognized" (by whom? for what?)
- "Open to opportunities" (signals job-seeker to buyers, signals unserious to employers)

### Q2 — Audience action

> "For each outcome, WHO needs to take an action? Name role + seniority + moment of search."

Example good answers:
- "A VP Engineering at a Series B SaaS, facing AWS cost pressure, searching on a Tuesday afternoon for fractional expertise"
- "A non-technical founder post-MVP, searching for CTO co-founder, looking at profiles recommended by their angel network"
- "A podcast host covering AI+leadership intersection, scouting for guests via LinkedIn search"

## Branching on goal count

### Branch: 1 primary goal (ideal)

User has one clear goal. Proceed directly to Ex 0.1 (Non-goals). Record the goal as `primary_goal` in the artifact; every subsequent draft references it.

### Branch: 2 goals (common — this is Mat's case)

**Do not force the user to pick.** LinkedIn's forced-monoculture constraint is real, but experts have documented 4 legitimate tactics for carrying more than one positioning on a single profile:

#### Tactic A — Unifying thread

Find the narrative thread that makes both goals ONE prototype.
- Example: "CTO co-founder candidate" + "CTO-as-a-service" both resolve to "AI-augmented tech leader building from zero-to-one" — same prototype, different engagement modes.
- **Works when**: goals share underlying skills, worldview, and audience adjacency.
- **Fails when**: thread is forced / reads as hedge ("I help leaders OR individual contributors become better OR more efficient").

#### Tactic B — Primary + secondary signal

Optimize profile fully for primary goal; add ONE line in About as secondary signal.
- Example: Headline + About + Experience all positioned as "CTO-as-a-service"; one line at end of About: "Also open to co-founder conversations with non-technical founders post-MVP."
- **Works when**: primary goal needs full profile real estate; secondary can be a subtle signal for narrow audience.
- **Fails when**: secondary signal gets more than one line, OR secondary goal demands different experience framing.

#### Tactic C — Sequential re-positioning

Run this skill twice; produce two complete locked drafts; swap profile every 3-6 months as user's focus shifts.
- Example: Q1-Q2 profile optimized for "hire-me CTO role"; Q3-Q4 profile optimized for "thought leader".
- **Works when**: goals are temporally distinct, and user has discipline to swap.
- **Fails when**: user doesn't actually swap (profile decays to whichever was last edited).

#### Tactic D — Profile serves one, activity serves the other

Profile = primary goal (prototype clarity). Posts/comments/engagement = secondary goal.
- Example: Profile = "fractional CTO for Series A-B SaaS"; activity = posting about AI tooling for founders (feeds co-founder pipeline).
- **Works when**: user has posting discipline and activity strategy.
- **Fails when**: activity is inconsistent (then only profile signal lands, and secondary goal withers).
- **Note**: Activity strategy is out of scope for this skill. Flag this to user.

#### Decision protocol for 2-goal users

Present all 4 tactics. Ask user to pick. Record the choice as `multi_positioning_tactic` in artifact. All subsequent exercises honor the choice:
- **Tactic A** → drafts reflect unifying thread
- **Tactic B** → drafts optimize for primary goal; skill inserts one secondary-signal line at end of About
- **Tactic C** → skill produces ONE draft this run; offers re-run for second goal at handoff
- **Tactic D** → drafts optimize for primary goal; skill notes which secondary-goal content pillar the user should post about (but does not plan cadence)

### Branch: 3+ goals

**Challenge the user**. More than 2 goals on one profile is almost always goal-sprawl masquerading as strategic breadth. Ask:
- "Which of these would you actually be disappointed about if it didn't happen in 6 months?"
- "If this profile could only serve ONE of these, which would it be?"
- Force a ranking to top 2. Then route to the 2-goal branch above.

If user resists and insists on 3+ goals: proceed with Tactic C (sequential), produce one draft this run, flag the constraint. Do not attempt to serve 3 goals in one profile — that produces an invisible prototype.

## Output — lock the goal decision

Save to `.tmp/improve-linkedin/{profile-slug}/00-goal.md`:

```markdown
# Goal Selection — {Profile Name}

## Primary goal
{specific outcome with measurable signal in 6 months}

## Audience
- Role: {role + seniority}
- Situation: {moment + context}
- Moment of search: {when would they look for someone like me}

## Multi-positioning
- Goal count: {1 | 2 | 3+}
- Tactic chosen (if 2+): {A unifying thread | B primary+secondary | C sequential | D profile+activity}
- Secondary goal (if relevant): {brief note}

## Goals deliberately NOT served by this profile
(Filled in Ex 0.1)
```

**Validation gate before proceeding to Ex 0.1**:
- [ ] Primary goal has measurable 6-month signal (not "more visibility")
- [ ] Audience is named persona + situation (not "decision makers")
- [ ] Multi-positioning decision made, if applicable
- [ ] User has explicitly confirmed the goal statement

If any fails → re-ask. Do not proceed with a fuzzy goal.
