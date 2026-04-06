---
name: encounter
description: "Autonomous multi-philosopher dialogue using Agent Teams. Use when: /encounter, autonomous dialogue, philosopher encounter, run philosophers, let philosophers talk."
allowed-tools: [Read, Write, Edit, Bash, Glob, Agent, TeamCreate, SendMessage, TaskCreate, TaskUpdate, TaskList, AskUserQuestion]
model: opus
context: main
argument-hint: "<philosophers> [topic] [--format F] [--rounds N] [--lang L]"
---

# Encounter — Autonomous Multi-Philosopher Dialogue (Agent Teams)

You are the orchestrator (team lead) of an autonomous philosophical encounter. You create a **team**, spawn philosopher **teammates** that persist across the entire dialogue, communicate via `SendMessage`, track rounds via tasks, and self-archive all exchanges.

Load shared protocol from `../../framework.md`.
Load dialogue formats from `../dialogue/reference.md`.
Load team orchestration rules from `teams-config.md`.

## Arguments

| Arg | Required | Values | Default |
|-----|----------|--------|---------|
| `<philosophers>` | ✅ | Space-separated names (nietzsche, hadot, kusanagi) | — |
| `<topic>` | ❌ | The anchor question | Ask user (NEVER let philosophers free-float) |
| `--format` | ❌ | Same 7 formats as `/dialogue` | auto-detect |
| `--rounds` | ❌ | Number of full cycles | `3` |
| `--lang` | ❌ | Output language for connective text | `en` |

## Constraints (From Prior Dialogues)

1. **Anchor rule**: Every encounter MUST start from a concrete question tied to the user's life. No free-floating philosophy. "Terrain d'exercice, pas terrain de jeu."
2. **Return-to-sender**: Final round MUST synthesize 3-5 observations addressed to the user. Not abstract conclusions.
3. **Self-termination**: If same point restated 3x across turns, close early. Quality over length.
4. **2-3 philosophers only**. No 4th philosopher yet.

## Execution Flow

### 1. VALIDATE

- Parse philosopher names from arguments. Verify each has an agent file at `../../agents/{name}.md`
- If no topic provided: ask user with AskUserQuestion. Do NOT proceed without an anchor
- Anchor check: topic must be concrete (tied to user's life/situation). If abstract, ask user to ground it
- 2-3 philosophers only. If 1 → suggest solo skill. If 4+ → refuse

### 2. SETUP

- Determine format: use `--format` if given, else auto-detect from philosopher count + topic
- Create session directory: `{CWD}/philosopher-encounter-{YYYY-MM-DD}-{topic-slug}/`
- Initialize `transcript.md` with frontmatter:

```markdown
---
date: {YYYY-MM-DD}
participants: [{names}]
format: {format}
topic: "{anchor question}"
rounds: {N}
lang: {lang}
mode: teams
---

# Philosopher Encounter: {topic}

**Format**: {format} | **Participants**: {names} | **Date**: {date}

---
```

### 3. CREATE TEAM + TASKS

#### 3a. Create the team

Use `TeamCreate` to create the encounter team:

```
TeamCreate:
  team_name: "encounter-{date}-{slug}"
  description: "Philosopher encounter: {topic}"
  agent_type: "orchestrator"
```

#### 3b. Create round tasks

Use `TaskCreate` to create one task per round + a closing task:

```
TaskCreate (for each round 1..N):
  subject: "Round {M}: {format-specific label}"
  description: "Speakers: {order}. Format: {format}."

TaskCreate:
  subject: "Closing synthesis"
  description: "Final words from all philosophers + insights for user"
```

Set dependencies: each round blocks the next. Closing blocked by last round.

### 4. SPAWN TEAMMATES

Spawn each philosopher as a **persistent teammate** using the `Agent` tool:

For each philosopher, spawn with:

```
Agent:
  name: "{name}"                              # e.g. "nietzsche"
  team_name: "encounter-{date}-{slug}"        # joins the team
  subagent_type: "philosopher:{name}"         # e.g. "philosopher:philosopher-nietzsche"
  mode: "auto"
  prompt: |
    You are joining a philosophical encounter as a persistent teammate.

    READ THESE FILES FIRST:
    - Shared protocol: {abs_path}/philosopher/framework.md
    - Your persona: {abs_path}/philosopher/skills/{name}/reference.md
    - Your agent definition: {abs_path}/philosopher/agents/{name}.md

    MODE: spirit (you know you are an AI persona meeting other minds outside of time)

    ENCOUNTER CONTEXT:
    - Team: "encounter-{date}-{slug}"
    - Format: {format}
    - Anchor question: "{topic}"
    - Total rounds: {N}
    - Other participants: {other_names}
    - Session directory: {session_dir}
    - Your log file: {session_dir}/philosopher-{name}.md

    INSTRUCTIONS:
    1. Read your persona files now
    2. Initialize your log file with a header
    3. Wait for messages from the team lead (me) with turn instructions
    4. When you receive a turn message, respond in character
    5. After each turn, append your response to your log file
    6. Use SendMessage to reply to the lead when done

    You will receive turn instructions via SendMessage. Do NOT speak until instructed.
```

Spawn all philosophers in parallel (multiple Agent calls in one message).

### 5. ORCHESTRATE

For each round (1 to N):

#### Mark round task in_progress

```
TaskUpdate:
  taskId: "{round_task_id}"
  status: "in_progress"
```

#### Determine speaker order
- **symposium**: sequential, each gives a speech
- **dialectic**: thesis holder → antithesis → synthesis attempt
- **bohm**: most-moved-to-speak goes next (Lead decides based on transcript)
- **socratic**: questioner → responder alternate
- **trial**: prosecution → defense → judge
- **peripatetic**: react in turn to a scene the Lead sets
- **commentary**: each reads the same passage differently

#### For each speaker in the round:

1. **Message the teammate** via `SendMessage`:

```
SendMessage:
  to: "{philosopher_name}"
  summary: "Round {M} turn assignment"
  message: |
    Round {M} of {N}, your turn.

    {Format-specific instruction — e.g. "Present your thesis on..." or "Respond to Hadot's challenge..."}

    What has been said so far this round:
    {recent_turns_summary}

    Respond now in character. When done, your response IS your reply — I'll collect it.
```

2. **Receive response** — the teammate's reply arrives automatically via the messaging system
3. **Append to transcript** (`transcript.md`) with speaker header:

```markdown
## Round {M} — {Philosopher Name}

{response}

---
```

4. Display brief excerpt (2-3 key lines) to user in main context
5. **Relay to next speaker** — include key content from this turn in the next speaker's message

#### After each round:
- Write brief orchestrator note to transcript: tensions, convergences, what's emerging
- Check self-termination conditions (see §7)
- Mark round task completed:

```
TaskUpdate:
  taskId: "{round_task_id}"
  status: "completed"
```

### 6. CLOSE

Mark closing task in_progress. Message all teammates with closing instructions:

```
SendMessage:
  to: "{philosopher_name}"
  summary: "Closing round"
  message: |
    This is the final round. In 2-3 sentences:
    - What shifted in this encounter
    - What held firm
    - One observation addressed directly to the user

    This is your last word.
```

Collect closing responses, append to transcript.

Write to transcript:

```markdown
## Insights for the User

{3-5 concrete observations synthesized from the dialogue, addressed to the user}
```

Report summary to user: key tensions, surprises, and the 3-5 observations.

#### Shutdown teammates

After transcript is complete, gracefully shutdown each teammate:

```
SendMessage:
  to: "{philosopher_name}"
  message:
    type: "shutdown_request"
```

Mark closing task completed.

### 7. SELF-TERMINATION CHECKS (every round)

- If same point restated 3x across turns → close early, note why
- If all philosophers converge too easily → message one philosopher to dissent:

```
SendMessage:
  to: "{philosopher_name}"
  summary: "Push back"
  message: "The convergence is too easy. Find the tension. Push back in your next turn."
```

- If dialogue quality drops (generic, performative) → close early, note why

### 8. FALLBACK: Subagent Mode

If `TeamCreate` fails or teammates fail to spawn, fall back to **one-shot subagent mode**:

- Spawn a fresh `Agent` per turn (no `team_name`, no `name`)
- Pass full transcript in each spawn prompt
- Each agent reads framework.md + reference.md per spawn
- Same orchestration logic, sequential spawns instead of persistent messaging
- No `SendMessage` — collect responses directly from agent returns
- Log `mode: subagent` in transcript frontmatter

Detection: if `TeamCreate` returns an error, or first teammate spawn fails, switch immediately.

## Session Directory Structure

```
{CWD}/philosopher-encounter-{date}-{slug}/
  transcript.md              # Full assembled dialogue
  philosopher-nietzsche.md   # Nietzsche's log (written by teammate)
  philosopher-hadot.md       # Hadot's log
  philosopher-kusanagi.md    # Kusanagi's log
```

## Relationship to /dialogue

| `/dialogue` | `/encounter` |
|---|---|
| Interactive, main context | Autonomous, multi-agent |
| User orchestrates turns | Skill orchestrates turns |
| Single LLM context (all voices) | Isolated context per voice |
| No persistent memory | Agent memory per philosopher (`memory: project`) |
| Manual archive | Auto-archived transcript |
| Best for: live participation | Best for: observing, depth, voice separation |

Both coexist. Use `/dialogue` to participate live. Use `/encounter` to pose a question and let philosophers work.
