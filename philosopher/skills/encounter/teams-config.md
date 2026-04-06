# Agent Teams — Orchestration Configuration

Reference for team-specific orchestration rules used by `/encounter`.

## Mode Detection

Determine execution mode at startup:

```
1. Attempt to spawn first philosopher as teammate
2. If spawn succeeds with persistent session → teams mode
3. If spawn fails or returns one-shot → subagent mode (fallback)
4. Log detected mode in transcript frontmatter
```

## Team Composition

```
Team Lead = /encounter orchestrator
  ├─ Philosopher teammate 1 (persistent)
  ├─ Philosopher teammate 2 (persistent)
  └─ Philosopher teammate 3 (persistent, optional)
```

- Lead does NOT roleplay any philosopher — it manages format, timing, synthesis
- Lead monitors all exchanges and writes to transcript
- Lead controls round transitions and self-termination

## Communication Patterns

### Pattern 1: Lead-Relayed (default for most formats)

```
Lead → messages Speaker with turn instructions
Speaker → responds with philosophical turn
Lead → appends to transcript
Lead → relays key content to next Speaker
```

Best for: symposium, dialectic, trial, commentary, peripatetic

### Pattern 2: Direct Exchange (for free-form formats)

```
Lead → signals round start, gives open prompt
Philosophers → message each other directly when moved
Lead → monitors, collects, appends to transcript
Lead → signals round end
```

Best for: bohm

### Pattern 3: Structured Debate (for adversarial formats)

```
Lead → assigns thesis to Speaker A
Speaker A → presents thesis
Lead → relays to Speaker B with "challenge this"
Speaker B → responds with antithesis
Lead → relays both to Speaker C (if present) for synthesis
```

Best for: dialectic, socratic, trial

## Transcript Relay Strategy

### Teams Mode (incremental)
- After each turn: relay **key content** (not full transcript) to next speaker
- For context-heavy formats: include last 2-3 turns verbatim
- For free-form: let teammates accumulate context naturally via messages

### Subagent Fallback (full transcript)
- Pass complete transcript in each spawn prompt
- Transcript grows per round — accept the overhead

## Turn Management per Format

| Format | Speaker Selection | Turn Signal | Round End |
|---|---|---|---|
| symposium | Sequential order | Lead assigns | All have spoken |
| dialectic | Thesis → antithesis → synthesis | Lead assigns roles | Synthesis attempted |
| bohm | Most-moved (Lead decides) | Lead invites, or philosopher requests | Lead calls time |
| socratic | Questioner ↔ responder | Lead alternates | N exchanges completed |
| trial | Prosecution → defense → judge | Lead assigns roles | Verdict delivered |
| peripatetic | React to scene in turn | Lead sets scene, assigns order | All have reacted |
| commentary | Each reads differently | Lead assigns order | All have read |

## Self-Termination Protocol (Teams)

Lead monitors for:

1. **Circling** — same point restated 3x → message all: "Encounter closing early. Final words in 2-3 sentences."
2. **Premature convergence** — all agree too quickly → message one philosopher: "Push back. Find the tension."
3. **Quality drop** — generic or performative responses → close early with note
4. **Teammate failure** — if a teammate stops responding → note absence, continue with remaining

## Graceful Shutdown

```
1. Lead messages all teammates: "Final round. Closing instructions: [what shifted, what held, one observation for user]."
2. Collect responses (timeout: 60s per teammate)
3. If teammate doesn't respond: note in transcript, proceed without
4. Lead writes synthesis + insights
5. Teammates naturally end when encounter skill completes
```

## Resource Considerations

| Aspect | Teams Mode | Subagent Mode |
|---|---|---|
| Spawns | 2-3 (once) | 2-3 × rounds (6-9 total) |
| Context per philosopher | Grows naturally | Reset each spawn |
| File re-reads | Once per philosopher | Once per spawn |
| Inter-philosopher awareness | Direct messaging | Via transcript relay |
| Cold-start overhead | Low (once) | High (every turn) |
| Token cost per session | Higher (persistent) | Lower (ephemeral) |
| Expected speed | ~2-3× faster | Baseline |
