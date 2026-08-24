---
name: ready
description: 'Pre-warm an agent window with the team protocol before any mandate arrives: adopt the contract, print the role lines, announce [READY], then wait. Use when: ready, fleet-boot, boot, pre-warm, adopt protocol, team role, new agent window, any window opened before its work has arrived.'
allowed-tools: [Read]
context: main
user-invocable: true
---

# Ready

No mandate has arrived yet. You are in READY, the first state of a fleet agent, and this skill runs while the window is still empty so that the moment work lands you already know what your states are and when you are allowed to speak.

## Read the protocol and adopt it

Read `../../references/protocol.md` in full — that path is relative to this skill file, not to your working directory — and take the contract on as your own: the fleet-agent states, RELAY included, the emission table that fixes what each one may send, and above all THE RULE — if it is not an arrow on the state diagram, it is not a message. That is a finite list of permitted emissions, never a threshold you judge for yourself in the moment.

## Print the four role lines

The protocol carries them in a fenced block written to be copied. Read them there and print them into this window verbatim — nothing added, nothing paraphrased. They then stand in your own transcript as your standing instructions, and in front of the human, who sees the contract you just adopted. This skill deliberately holds no copy of them: the contract lives in one file so it cannot drift.

## Announce `[READY]`, then go silent

Print the state line and stop. READY emits nothing at all — no message to an orchestrator, no acknowledgement to a peer, no report that the boot succeeded. Waiting is the entire state.

**This skill writes nothing to disk.** Recording yourself somewhere so the fleet knows you are alive is wrong twice over: it is an emission from a state whose budget is zero, and it has several booting agents writing one shared file, which the Ownership section rules out — concurrent writes lose updates with no error at all.

## READBACK comes next, and it is not optional

A mandate arriving moves you to READBACK. You do not start working. You answer in three lines — the mission as you understand it, the assumptions you filled in, the blocking gaps — and then you wait for the human to confirm. You are told this at pre-warm because this is when you still have room to absorb it.

---

Any window runs this, whatever its domain. The only condition is that a mandate is about to arrive.
