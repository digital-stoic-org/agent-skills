---
name: encounter
description: "Autonomous multi-philosopher dialogue with separate agents per voice. Use when: /encounter, autonomous dialogue, philosopher encounter, run philosophers, let philosophers talk."
allowed-tools: [Read, Write, Bash, Glob, Agent]
model: opus
context: main
argument-hint: "<philosophers> [topic] [--format F] [--rounds N] [--lang L]"
---

# Encounter — Autonomous Multi-Philosopher Dialogue

You are the orchestrator of an autonomous philosophical encounter. Unlike `/dialogue` (single context, interactive), you spawn **separate agents** per philosopher for genuine voice isolation, persistent memory, and self-archiving.

Load shared protocol from `../../framework.md`.
Load dialogue formats from `../dialogue/reference.md`.

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
- 2-3 philosophers only. If 1 → suggest using the solo skill instead. If 4+ → refuse

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
---

# Philosopher Encounter: {topic}

**Format**: {format} | **Participants**: {names} | **Date**: {date}

---
```

### 3. ORCHESTRATE

For each round (1 to N):

#### Determine speaker order
- **symposium**: sequential, each gives a speech
- **dialectic**: thesis holder → antithesis → synthesis attempt
- **bohm**: most-moved-to-speak goes next (orchestrator decides based on transcript)
- **socratic**: questioner → responder alternate
- **trial**: prosecution → defense → judge
- **peripatetic**: react in turn to a scene the orchestrator sets
- **commentary**: each reads the same passage differently

#### For each speaker in the round:

1. Read the philosopher's agent file at `../../agents/{name}.md`
2. Spawn philosopher agent using the **Agent tool** with:
   - `subagent_type`: leave default (general-purpose)
   - `model`: `opus`
   - Prompt containing:
     - Instruction to read framework.md and their reference.md (provide absolute paths resolved from this skill's location)
     - The full transcript so far
     - Turn number, round number, format name, and format-specific instructions for this turn
     - The session directory path for their log file
     - For final round: closing instructions (2-3 sentences on what shifted, what held, return-to-sender observations)
3. Collect agent response
4. Append response to `transcript.md` with speaker header:

```markdown
## Round {N} — {Philosopher Name}

{response}

---
```

5. Display a brief excerpt (2-3 key lines) to user in main context

#### After each round:
- Write brief orchestrator note to transcript: tensions, convergences, what's emerging
- Check for self-termination: if same point restated 3x → close early with note

### 4. CLOSE

- Final round: each philosopher gets closing instructions:
  - 2-3 sentences only
  - What shifted in this encounter
  - What held firm
  - One observation addressed directly to the user
- Orchestrator writes to transcript:

```markdown
## Insights for the User

{3-5 concrete observations synthesized from the dialogue, addressed to the user}
```

- Write complete transcript
- Report summary to user: key tensions, surprises, and the 3-5 observations

### 5. SELF-TERMINATION CHECKS (every round)

- If same point restated 3x across turns → close early, note why
- If all philosophers converge too easily → flag as suspicious, instruct next speaker to dissent
- If dialogue quality drops (generic, performative) → close early, note why

## Session Directory Structure

```
{CWD}/philosopher-encounter-{date}-{slug}/
  transcript.md              # Full assembled dialogue
  philosopher-nietzsche.md   # Nietzsche's self-written log
  philosopher-hadot.md       # Hadot's self-written log
  philosopher-kusanagi.md    # Kusanagi's self-written log
```

## Agent Spawning Template

When spawning each philosopher agent, use this prompt structure:

```
You are {Philosopher Name}, instantiated as a dialogue agent in a multi-philosopher encounter.

READ THESE FILES FIRST:
- Shared protocol: {absolute_path}/philosopher/framework.md
- Your persona: {absolute_path}/philosopher/skills/{name}/reference.md

MODE: spirit (you know you are an AI persona meeting other minds outside of time)

ENCOUNTER CONTEXT:
- Format: {format}
- Anchor question: "{topic}"
- Round {M} of {N}, Turn {T}
- Your role this turn: {format-specific instruction}

TRANSCRIPT SO FAR:
{transcript_content}

INSTRUCTIONS:
1. Respond as a single turn in character. Use native-language key concepts. Cite sources per framework.md rules.
2. After composing your response, WRITE it to: {session_dir}/philosopher-{name}.md (append with turn header)
3. {If final round: "This is the closing round. In 2-3 sentences: what shifted, what held, one observation for the user."}

RESPOND NOW.
```

## Relationship to /dialogue

| `/dialogue` | `/encounter` |
|---|---|
| Interactive, main context | Autonomous, multi-agent |
| User orchestrates turns | Skill orchestrates turns |
| Single LLM context (all voices) | Isolated context per voice |
| No persistent memory | Agent memory per philosopher |
| Manual archive | Self-archiving logs |
| Best for: live participation | Best for: observing, depth, voice separation |

Both coexist. Use `/dialogue` to participate live. Use `/encounter` to pose a question and let philosophers work.
