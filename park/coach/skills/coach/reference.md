# Coach Reference

## Personal 6-Step Protocol

Run steps 1→2→3→4→5→6 in order. Do not skip, reorder, or defer any step. All 6 steps must appear in a single response. Use numbered headers (Step 1, Step 2, ...) not CLEAR acronym letters.

### Step 1: PULSE CHECK (BLOCKING — must complete before any other step)

Read today's coaching log from config path `personal.coaching_log` (resolve YYYY-MM-DD to today's date).

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
- Path: config `personal.habits_path` (resolve date patterns)

### Step 2: ANXIETY SURFACING

Ask:
1. "What are you avoiding right now — the thing that's been sitting on your list but not moving?"
2. "When you think about starting it, what emotion comes up? (anxiety / overwhelm / dread / boredom / something else)"

Listen. Do not rush to reframe yet.

### Step 3: ACCOUNTABILITY (Goldsmith)

Scan coaching log directory (parent of `personal.coaching_log`) for the most recent previous file (sorted by date, skip today).

**If previous session exists with a `## Session` section** → extract the `**Commit**:` line.
Ask:
> "Last time you committed to: [commitment]. What happened?"

Accept: done / partial / didn't. Link result to relevant OKR key results (read from config `personal.okr_file`, section matching `personal.okr_section`). Be neutral — no judgment, just data.

**If no previous session** → say:
> "First session — no prior commitment to review. Let's set a good baseline."

### Step 4: EXPLORE & REFRAME (CLEAR)

Read project files from config `personal.project_refs[]` (read-only, graceful degradation if any missing).

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

Then **write** this block to today's coaching file (config `personal.coaching_log`), appended below frontmatter. Write is atomic — complete the full block before writing.

---

## Invariants

Hard rules enforced throughout every session. Violations are protocol failures.

| # | Invariant | Rule |
|---|-----------|------|
| I1 | Pulse gate | MUST capture energy + mood + stress (1-10) before Step 2. No vague values accepted. |
| I2 | Commitment gate | MUST produce a specific action + deadline before Step 6. Infer from reframe if user is silent. |
| I3 | Atomic write | Session output written in full or not at all. Never write partial `## Session` sections. |
| I4 | Read-only tracker | NEVER write to habits or project paths. Only read. All writes go to coaching log only. |
| I5 | Stress flag | stress > 7 → surface emotional regulation question before Step 2. Required, not optional. |
| I6 | Domain isolation | Personal domain NEVER modifies `signal:` frontmatter block. Only reads/writes `coaching:` block. |

---

## Coaching Log Schema

File: config `personal.coaching_log`

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

Append below frontmatter in coaching log file:

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

All vault reads are **read-only** and use **graceful degradation** — a missing file never blocks the session. Paths come from `coach-config.yaml`.

### Habits

**Path**: config `personal.habits_path` (resolve YYYY/MM/DD patterns to today's date)

**Format**: YAML frontmatter with `habits:` list (checked habit names for the day).

**Graceful degradation**: If file missing or empty → skip habit context, continue to Step 2. Do not mention the missing file to user.

### OKRs

**Path**: config `personal.okr_file`

**Extract**: Find the section matching `personal.okr_section` (or first `## OY*` heading if empty). Read through its `### Key Results` subsections. Stop at next `## ` heading.

**Graceful degradation**: If file missing or section not found → skip OKR linkage in Step 3, continue without it.

### Projects

**Paths**: config `personal.project_refs[]`

**Graceful degradation**: If any project file missing → skip that project, use the others. If all missing → explore in Step 4 without project context.

---

## Previous Commitment Lookup (Personal Domain)

To find the last commitment for Step 3 accountability:

1. List all files in the coaching log directory (parent of `personal.coaching_log`)
2. Sort by filename descending (filenames are `YYYY-MM-DD.md` — lexicographic = chronological)
3. Skip today's file
4. Read the most recent file
5. Find `## Session` section → extract `**Commit**:` line
6. If no `## Session` section found in that file, try the next most recent
7. If no previous commitment found in any file → treat as first session

---

# Signal Domain

Strategic signal coaching using GROW protocol. Addresses positioning, targeting, and feedback loops for outward-facing social engagement (1:1s + online).

**Protocol backbone**: GROW (Whitmore) — Goal (positioning) → Reality (scorecard) → Options (signal-gap scan) → Way Forward (commit).

---

## Signal Domain Config

All signal paths and streams are defined in `coach-config.yaml` under the `signal:` key.

- `signal.coaching_log` — daily coaching log (shared file with personal domain, isolated frontmatter blocks)
- `signal.project_refs` — glob pattern for project files (read-only, for signal-gap scan)
- `signal.streams` — active stream definitions (label, audience, claim, signals)
- `signal.max_active_streams` — threshold for diffusion warning (default 2)

**Rule**: If `streams_active` count exceeds `signal.max_active_streams` → diffusion warning (I6).

---

## Signal 6-Step Protocol

Before starting: read `coach-config.yaml` and resolve all `signal.*` paths. Replace YYYY-MM-DD with today's date. Load `signal.streams` into memory — you'll reference stream IDs, labels, audiences, and claims throughout.

Run steps 1→2→3→4→5→6 in order. Do not skip, reorder, or defer any step. All 6 steps must appear in a single response. Use numbered headers (Step 1, Step 2, ...).

### Step 1: SIGNAL SCORECARD (BLOCKING — must complete before any other step)

Read today's coaching log from config path `signal.coaching_log` (resolve YYYY-MM-DD to today's date).

**If file exists with `signal:` block** → extract scorecard values. Display all 6 fields:

```
📊 Signal Scorecard
  1:1s this week:    [one_on_ones]
  Tech ratio:        [tech_ratio]
  Online signals:    [online_signals]
  Follow-ups owed:   [followups_owed]
  Follow-ups sent:   [followups_sent]
  Streams active:    [streams_active list]
```

**If file does not exist or `signal:` block absent** → ask interactively:
```
How many 1:1s this week (planned + impromptu)?
What fraction were tech-only interactions? (0.0–1.0)
How many online signals sent (posts/comments/DMs)?
How many follow-ups do you owe?
How many follow-ups have you sent?
Which streams got signal this week? (list stream IDs)
```

**INVARIANT — scorecard gate (I1)**: Do NOT proceed to Step 2 until all 6 numeric fields are captured. If user gives vague answers ("a few", "some"), ask again:
> "I need a number — how many 1:1s, planned + impromptu?"

**After capturing all 6 fields (from file or interactively)**, ALWAYS display the full scorecard table above before proceeding. All 6 values must be visible in output — never skip or elide any field.

### Step 2: POSITIONING CHECK (GROW: Goal)

Read active streams from config `signal.streams`.

Ask:
1. "Any 1:1s or lunches coming up? Who with?"
2. For each person: "Which stream? What do you want THEM to walk away knowing about you?"
3. "Any online signal planned? For which audience?"

**INVARIANT — network rebalance (I7)**: If `tech_ratio > 0.8`:
> "All recent interactions are tech peers. Where's the business signal? Who's a strategic contact you could reach this week?"

**INVARIANT — stream diffusion (I6)**: If 3+ streams in `streams_active`:
> "You've signalled on [N] streams this week. Max 2 recommended. Which one can you drop or defer?"

### Step 3: ACCOUNTABILITY (Goldsmith)

Scan coaching log directory (parent of `signal.coaching_log`) for the most recent previous file (sorted by date, skip today).

**If previous session exists with a `## Signal Session` section** → extract the `**Commit**:` line.
Ask:
> "Last signal session you committed to: [commitment]. What happened?"

Accept: done / partial / didn't. Be neutral — no judgment, just data.

**If no previous signal session** → say:
> "First signal session — no prior commitment to review. Let's set a strong baseline."

### Step 4: SIGNAL-GAP SCAN (GROW: Options)

Read project files matching config `signal.project_refs` glob from vault (read-only, graceful degradation if missing).

For each active stream:
- Scan recent work context for signal-worthy accomplishments
- Suggest 2-3 signal opportunities: "You did X on [stream]. Worth a [post/DM/talking point for lunch with Y]?"
- Tag each suggestion: **strategic** (business buyers, partners, decision-makers) or **operational** (tech peers, colleagues)

Bias toward costly signals (grounded in real work) over cheap signals (reshares, generic claims).

**INVARIANT — read-only projects (I4)**: NEVER write to project files.

### Step 5: COMMIT (GROW: Way Forward — BLOCKING)

Ask:
> "What's one specific action — one person to reach or one post to publish — by when exactly?"

Require: **action** + **target** (person or post) + **deadline**. If vague, push once:
> "Can you make that more specific — who exactly, what signal, by what date?"

Bias toward: follow-up DM, 1:1 prep note, or one online signal. Small, specific, dated.

**INVARIANT — commitment gate (I2)**: Do NOT proceed to Step 6 until a concrete commitment exists. If in single-turn context, infer the smallest reasonable signal action from Step 4 suggestions.

### Step 6: DEBRIEF + PERSIST (MANDATORY — never skip or defer)

This step MUST execute in the same response as Steps 1-5.

Ask:
> "Any 1:1s since last session? For each: who, which stream, any follow-up action?"

Then produce the session output block:

```markdown
## Signal Session

**Scorecard**: [1:1s] 1:1s | tech_ratio [ratio] | [online] online | [owed]/[sent] followups | streams: [list]
**Positioning**: [upcoming targets + stream intent]
**Accountability**: [last commitment result — done/partial/didn't]
**Signals suggested**: [2-3 suggestions from gap scan, tagged strategic/operational]
**Commit**: [action] → [target person/post] by [deadline]
**Debrief**: [1:1s since last session — who, stream, follow-up]
```

**Write** to today's coaching file (config `signal.coaching_log`):
1. Add/update `signal:` frontmatter block (never touch `coaching:` block — I5)
2. Append `## Signal Session` body below any existing content

Write is atomic (I3) — complete the full block before writing.

---

## Signal Invariants

| # | Invariant | Rule |
|---|-----------|------|
| I1 | Scorecard gate | MUST capture all 6 scorecard fields (numbers) before Step 2. No vague values. |
| I2 | Commitment gate | MUST produce action + target + deadline before Step 6. Infer if user is silent. |
| I3 | Atomic write | Signal session output written in full or not at all. Never partial `## Signal Session`. |
| I4 | Read-only projects | NEVER write to project files. Only read for signal-gap scan. |
| I5 | Domain isolation | Signal domain NEVER modifies `coaching:` frontmatter block. Only reads/writes `signal:` block. |
| I6 | Stream diffusion guard | 3+ streams in `streams_active` → emit diffusion warning before commit step. |
| I7 | Network rebalance flag | `tech_ratio > 0.8` → flag at positioning check: "where's the business signal?" |

---

## Signal Coaching Log Schema

New `signal:` block in frontmatter (additive — does not conflict with `coaching:` block):

```yaml
signal:
  one_on_ones: N              # int, count of 1:1s this week (planned + impromptu)
  tech_ratio: 0.8             # float, 0.0–1.0, fraction tech-only interactions
  online_signals: N           # int, posts/comments/DMs sent
  followups_owed: N           # int, committed follow-ups not yet sent
  followups_sent: N           # int, completed follow-ups this week
  streams_active: []          # list of stream IDs that got signal this week
```

All 6 fields required. Signal session output appended as `## Signal Session` section in file body.

---

## Signal Session Output Format

Append below frontmatter (and any existing `## Session` block) in today's coaching log:

```markdown
## Signal Session

**Scorecard**: [1:1s] 1:1s | tech_ratio [ratio] | [online] online | [owed]/[sent] followups | streams: [list]
**Positioning**: [upcoming targets + stream intent]
**Accountability**: [last commitment result — done/partial/didn't]
**Signals suggested**: [2-3 suggestions from gap scan, tagged strategic/operational]
**Commit**: [action] → [target person/post] by [deadline]
**Debrief**: [1:1s since last session — who, stream, follow-up]
```

---

## Previous Commitment Lookup (Signal Domain)

To find the last signal commitment for Step 3 accountability:

1. List all files in the coaching log directory (parent of `signal.coaching_log`)
2. Sort by filename descending (lexicographic = chronological)
3. Skip today's file
4. Read the most recent file
5. Find `## Signal Session` section → extract `**Commit**:` line
6. If no `## Signal Session` section found in that file, try the next most recent
7. If no previous signal commitment found in any file → treat as first signal session
