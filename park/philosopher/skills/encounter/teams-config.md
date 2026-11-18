# Agent Teams — Orchestration Configuration

Reference for team-specific orchestration rules used by `/encounter`. Uses Claude Code native Agent Teams: `TeamCreate`, `SendMessage`, `TaskCreate`/`TaskUpdate`.

## Team Lifecycle

```
1. TeamCreate → creates team + shared task list
2. Agent (with team_name + name) → spawn persistent teammates
3. SendMessage → orchestrate turns, relay context
4. TaskUpdate → track round progress
5. SendMessage (shutdown_request) → graceful teardown
```

## Team Composition

```
Team Lead = /encounter orchestrator (you)
  ├─ Philosopher teammate 1 (persistent, named by philosopher)
  ├─ Philosopher teammate 2 (persistent, named by philosopher)
  └─ Philosopher teammate 3 (persistent, optional)
```

- Lead does NOT roleplay any philosopher — manages format, timing, synthesis
- Lead monitors all exchanges and writes to transcript
- Lead controls round transitions and self-termination
- Team config readable at `~/.claude/teams/{team-name}/config.json`

## Communication via SendMessage

### Pattern 1: Lead-Relayed (default for most formats)

```
Lead → SendMessage(to: "nietzsche", "Round 1, your turn. Topic: ...")
Nietzsche → responds (auto-delivered to Lead)
Lead → appends response to transcript.md
Lead → SendMessage(to: "hadot", "Round 1, your turn. Nietzsche said: {summary}...")
Hadot → responds (auto-delivered to Lead)
```

Best for: symposium, dialectic, trial, commentary, peripatetic

### Pattern 2: Direct Exchange (for free-form formats)

```
Lead → SendMessage(to: "*", "Round start. Bohm format — respond when moved.")
Philosophers → SendMessage to each other directly
Lead → monitors via idle notifications (peer DM summaries visible)
Lead → SendMessage(to: "*", "Round ending. Final thoughts.")
```

Best for: bohm

**Note**: In bohm format, Lead broadcasts round start/end but philosophers message each other freely. Lead collects turns from peer DM summaries in idle notifications.

### Pattern 3: Structured Debate (for adversarial formats)

```
Lead → SendMessage(to: "nietzsche", "Present your thesis on...")
Nietzsche → responds with thesis
Lead → SendMessage(to: "hadot", "Challenge this thesis: {nietzsche_thesis}")
Hadot → responds with antithesis
Lead → SendMessage(to: "kusanagi", "Synthesize: {thesis} vs {antithesis}")
```

Best for: dialectic, socratic, trial

## Transcript Relay Strategy

### Teams Mode (incremental via SendMessage)
- After each turn: relay **key content** (not full transcript) to next speaker in the message
- For context-heavy formats: include last 2-3 turns verbatim in the message
- For bohm: philosophers accumulate context naturally via direct messaging

### Subagent Fallback (full transcript in prompt)
- Pass complete transcript in each Agent spawn prompt
- Transcript grows per round — accept the overhead

## Task-Based Round Tracking

Use `TaskCreate` at setup to create one task per round + closing:

```
Task #1: "Round 1: Opening positions"     (pending)
Task #2: "Round 2: Responses"             (blocked by #1)
Task #3: "Round 3: Synthesis"             (blocked by #2)
Task #4: "Closing synthesis"              (blocked by #3)
```

Progress flow:
- `TaskUpdate(status: "in_progress")` when round begins
- `TaskUpdate(status: "completed")` when all speakers in round have spoken + orchestrator note written

This gives the user visible progress in the UI as the encounter unfolds.

## Turn Management per Format

| Format | Speaker Selection | Turn Signal (SendMessage) | Round End |
|---|---|---|---|
| symposium | Sequential order | Lead messages each in order | All have spoken |
| dialectic | Thesis → antithesis → synthesis | Lead assigns roles via message | Synthesis attempted |
| bohm | Most-moved (Lead decides) | Lead invites, or broadcast round | Lead calls time |
| socratic | Questioner ↔ responder | Lead alternates messages | N exchanges completed |
| trial | Prosecution → defense → judge | Lead assigns roles via message | Verdict delivered |
| peripatetic | React to scene in turn | Lead sets scene in message, assigns order | All have reacted |
| commentary | Each reads differently | Lead assigns order via message | All have read |

## Self-Termination Protocol

Lead monitors for:

1. **Circling** — same point restated 3x → `SendMessage(to: "*", "Encounter closing early. Final words in 2-3 sentences.")`
2. **Premature convergence** — all agree too quickly → `SendMessage(to: "{one_philosopher}", "Push back. Find the tension.")`
3. **Quality drop** — generic or performative responses → close early with note
4. **Teammate failure** — if a teammate stops responding after 2 messages → note absence in transcript, continue with remaining

## Graceful Shutdown

```
1. Lead collects final closing responses (already done in CLOSE step)
2. Lead writes synthesis + insights to transcript
3. Lead sends shutdown to each teammate:
   SendMessage(to: "{name}", message: {type: "shutdown_request"})
4. Teammates approve shutdown (auto-terminates their process)
5. Task list shows all tasks completed
```

## Resource Considerations

| Aspect | Teams Mode | Subagent Mode |
|---|---|---|
| Spawns | 2-3 (once) | 2-3 × rounds (6-9 total) |
| Context per philosopher | Grows naturally | Reset each spawn |
| File re-reads | Once per philosopher | Once per spawn |
| Inter-philosopher awareness | Direct SendMessage | Via transcript relay |
| Cold-start overhead | Low (once) | High (every turn) |
| Round tracking | TaskCreate/TaskUpdate | Manual in transcript |
| Expected speed | ~2-3× faster | Baseline |
