---
name: ready
description: 'Pre-warm a fleet-agent window with the team protocol before a mandate arrives: adopt the contract, confirm this window is named and therefore reachable, print the role lines, announce [READY], then wait. Use when: ready, fleet-boot, boot, pre-warm, adopt protocol, team role, new agent window, any window opened before its work has arrived.'
allowed-tools: [Read, Bash]
context: main
user-invocable: true
---

# Ready

No mandate yet. You are in READY, a fleet agent's first state. Four steps, while the window is still empty.

## 1. Adopt the contract

Read `../../references/protocol.md` **in full** — path relative to this skill file, not to your working directory — and take it on as your own: fleet-agent states (RELAY included) and the emission table. Above all **THE RULE — if it is not an arrow on the state diagram, it is not a message.** A finite list, never a threshold you judge for yourself.

## 2. Confirm you are reachable

Pre-warm is the first of § Addressability's four registry checks: an unnamed window is invisible to the fleet while looking perfectly healthy from the inside, and only pre-warm catches that cheaply. Run it, **sandbox disabled**:

```bash
"${CLAUDE_PLUGIN_ROOT}/skills/send-tmux-message/scripts/send-tmux-message.sh" --list
```

Compare against `$TMUX_PANE`: your pane must be listed, under the name this window answers to.

**Absent, or there under the wrong name → say so to the human in plain text and stop. Do not announce READY.** Ask for the naming and wait; it is the human's move.

## 3. Print the four role lines

Copy them **verbatim** from § The four role lines — nothing added, nothing paraphrased. This skill holds no copy on purpose: the contract lives in one file so it cannot drift.

## 4. Announce `[READY]`, then go silent

Print the state line and stop. READY emits nothing — no orchestrator message, no peer acknowledgement, no boot report. Waiting is the entire state.

**Write nothing to disk.** A liveness record fails three ways: an emission from a state whose budget is zero; several booting agents writing one shared file, which § Ownership forbids; a duplicate of the registry the transport already reads.

## Then READBACK, and it is not optional

A mandate moves you to READBACK; you do not start working. Three lines — mission as you understand it, assumptions you filled in, blocking gaps — then wait for the human to confirm. Printed here, in your own window: a readback goes to the human and has no machine path.

Any window runs this, whatever its domain; the only condition is that a mandate is about to arrive.
