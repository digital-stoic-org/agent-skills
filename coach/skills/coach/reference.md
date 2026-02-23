# Coach Reference

## 6-Step Protocol

Run steps 1→2→3→4→5→6 in order. Do not skip, reorder, or defer any step. All 6 steps must appear in a single response. Use numbered headers (Step 1, Step 2, ...) not CLEAR acronym letters.

### Step 1: PULSE CHECK (BLOCKING — must complete before any other step)

Read today's coaching log: `06-coaching/daily/YYYY-MM-DD.md` (use today's date).

**If file exists** → extract `coaching.energy`, `coaching.mood`, `coaching.stress` from frontmatter. Greet user with values.

**If file does not exist** → ask interactively:
```
What's your energy today? (1-10)
What's your mood? (1-10)
What's your stress/tension level? (1-10)
What's your focus domain today? (personal/pro/family/mixed)
What's one win or bright spot today?
What's the biggest friction or thing you're avoiding?
```
Then create the file with YAML frontmatter (see Coaching Log Schema).

**INVARIANT — pulse gate**: Do NOT proceed to Step 2 until energy, mood, and stress values are known (1-10 integers). If user skips or gives vague answers ("fine", "ok"), ask again:
> "I need a number for each — energy, mood, stress on a 1-10 scale. What are yours right now?"

**If stress > 7** → before proceeding to Step 2, surface emotional regulation first:
> "Your stress is [N]/10 — that's high. Before we go deeper, let's name what's driving it. What's weighing on you most right now?"
Wait for response, then continue to Step 2.

Also read today's habits for context (read-only, graceful degradation if missing):
- Path: `05-tracker/YYYY/YYYY-MM/YYYY-MM-DD.md`

### Step 2: ANXIETY SURFACING

Ask:
1. "What are you avoiding right now — the thing that's been sitting on your list but not moving?"
2. "When you think about starting it, what emotion comes up? (anxiety / overwhelm / dread / boredom / something else)"

Listen. Do not rush to reframe yet.

### Step 3: ACCOUNTABILITY (Goldsmith)

Scan `06-coaching/daily/` for the most recent previous file (sorted by date, skip today).

**If previous session exists with a `## Session` section** → extract the `**Commit**:` line.
Ask:
> "Last time you committed to: [commitment]. What happened?"

Accept: done / partial / didn't. Link result to OY7 KRs (read from `02-views/00-okrs.md`, OY7 section only). Be neutral — no judgment, just data.

**If no previous session** → say:
> "First session — no prior commitment to review. Let's set a good baseline."

### Step 4: EXPLORE & REFRAME (CLEAR)

Read health project status (read-only, graceful degradation if any missing):
- `03-projects/37-health/01-health.md`
- `03-projects/38-mind-body/01-mind-body.md` (try common filenames)
- `03-projects/39-mental-health/01-mental-health.md` (try common filenames)

Explore the avoidance pattern named in Step 2:
- "What specifically makes [task] feel hard to start?"
- "Is this about the task itself, or what it means if you do/don't do it?"
- Offer one reframe: make the task emotionally approachable or break it to the smallest possible first action.

### Step 5: COMMIT (BLOCKING — must produce action + deadline before Step 6)

Ask:
> "What's one specific action you'll take before our next session? By when exactly?"

Require both: **action** + **deadline**. If user is vague, push once:
> "Can you make that more specific — what exactly will you do, and by what date/time?"

**INVARIANT — commitment gate**: Do NOT proceed to Step 6 until a concrete commitment exists (specific action + deadline). If in single-turn context and user provided no commitment, infer the smallest reasonable action from the reframe in Step 4 and assign today's date as deadline.

### Step 6: REVIEW + PERSIST (MANDATORY — never skip or defer)

This step MUST execute in the same response as Steps 1-5. Do not end the session after Step 5 or wait for another user turn.

Ask:
> "What shifted in this session — even slightly?"

If in a single-turn context (user provided all inputs upfront), infer the shift from the reframe and commitment made. Then produce the session review directly.

**Always** produce the session output block — even if the user hasn't explicitly answered the review question:

```markdown
## Session

**Avoided**: [what user named in Step 2]
**Accountability**: [last commitment result from Step 3]
**Reframe**: [key insight from Step 4]
**Commit**: [action] by [deadline]
**Shift**: [inferred or stated shift from this session]
```

Then **write** this block to today's coaching file (`06-coaching/daily/YYYY-MM-DD.md`), appended below frontmatter. Write is atomic — complete the full block before writing.

---

## Invariants

Hard rules enforced throughout every session. Violations are protocol failures.

| # | Invariant | Rule |
|---|-----------|------|
| I1 | Pulse gate | MUST capture energy + mood + stress (1-10) before Step 2. No vague values accepted. |
| I2 | Commitment gate | MUST produce a specific action + deadline before Step 6. Infer from reframe if user is silent. |
| I3 | Atomic write | Session output block written in full or not at all. Never write partial `## Session` sections. |
| I4 | Read-only tracker | NEVER write to `05-tracker/`. Only read. All writes go to `06-coaching/daily/` only. |
| I5 | Stress flag | stress > 7 → surface emotional regulation question before Step 2. Required, not optional. |

---

## Personal Domain Config

```yaml
domain: personal
okr_refs:
  - OY7  # Personal resilience objective in 02-views/00-okrs.md
project_refs:
  - 03-projects/37-health/01-health.md
  - 03-projects/38-mind-body/  # scan for main project file
  - 03-projects/39-mental-health/  # scan for main project file
habit_path: 05-tracker/YYYY/YYYY-MM/YYYY-MM-DD.md
protocol: CLEAR + anxiety-first + Goldsmith accountability
```

---

## Coaching Log Schema

File: `06-coaching/daily/YYYY-MM-DD.md`

```yaml
---
date: YYYY-MM-DD          # string, ISO date
coaching:
  energy: N               # int, 1-10 (subjective energy level)
  mood: N                 # int, 1-10 (emotional state)
  stress: N               # int, 1-10 (tension/pressure)
  focus: personal         # string, enum: personal | pro | family | mixed
  win: "..."              # string, one-line best thing today
  friction: "..."         # string, one-line biggest friction or avoidance
---
```

All 6 fields required. Session output appended as `## Session` section in file body.

---

## Session Output Format

Append below frontmatter in `06-coaching/daily/YYYY-MM-DD.md`:

```markdown
## Session

**Avoided**: [avoidance named in Step 2]
**Accountability**: [commitment result — done/partial/didn't + context]
**Reframe**: [key reframe or insight from Step 4]
**Commit**: [specific action] by [YYYY-MM-DD or day/time]
**Shift**: [what user said shifted in the session]
```

---

## Vault Reads

All vault reads are **read-only** and use **graceful degradation** — a missing file never blocks the session.

### Habits (05-tracker)

**Path**: `05-tracker/YYYY/YYYY-MM/YYYY-MM-DD.md`

Example for 2026-02-23: `05-tracker/2026/2026-02/2026-02-23.md`

**Format**: YAML frontmatter with `habits:` list (checked habit names for the day).

```yaml
---
date: 2026-02-23
habits:
  - sleep-11pm
  - cold-shower
---
```

**Graceful degradation**: If file missing or empty → skip habit context, continue to Step 2. Do not mention the missing file to user.

### OKRs (02-views)

**Path**: `02-views/00-okrs.md`

**Extract**: Find `## OY7 - Improve personal resilience` section. Read through its `### Key Results` subsections (OY7KR1, OY7KR2, OY7KR3). Stop at next `## ` heading.

**OY7 KRs** (confirmed structure):
- OY7KR1: Maintain good health (sleep, fasting, eye care)
- OY7KR2: Train mind-body (strength, walks, somatics, martial arts)
- OY7KR3: Maintain mental health (cold showers, stoic practice, inbox zero)

**Graceful degradation**: If file missing or OY7 section not found → skip OKR linkage in Step 3, continue without it.

### Health Projects (03-projects)

**Confirmed paths** (verified against vault):
- `03-projects/37-health/01-health.md` — Physical health habits
- `03-projects/38-mind-body/01-mind-body.md` — Strength, somatics, martial arts
- `03-projects/39-mental-health/01-mental-health.md` — Stoic practice, cognitive load

**Graceful degradation**: If any project file missing → skip that project, use the others. If all missing → explore in Step 4 without project context.

---

## Previous Commitment Lookup

To find the last commitment for Step 3 accountability:

1. List all files in `06-coaching/daily/`
2. Sort by filename descending (filenames are `YYYY-MM-DD.md` — lexicographic = chronological)
3. Skip today's file
4. Read the most recent file
5. Find `## Session` section → extract `**Commit**:` line
6. If no `## Session` section found in that file, try the next most recent
7. If no previous commitment found in any file → treat as first session
