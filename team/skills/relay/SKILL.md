---
name: relay
description: 'Hand your state to a fresh agent at ~70% context instead of compacting. Emits one relay packet; the successor takes over your name. Use when: relay, RELAY state, relay packet, handoff, hand over, take over, successor, context full, out of context, running out of context, 70% context.'
allowed-tools: [Read, Bash, SendMessage]
context: main
user-invocable: true
---

# Relay

RELAY is the state entered at roughly 70% context: you write one packet for the fresh agent taking over, then leave. That packet is the whole permitted emission — no preamble to the human, no announcement to peers, nothing after it.

## First — are you allowed to relay right now?

If you are in the middle of a **cross-item step** — a synthesis, a deduplication, a global arbitration, anything that reasons across all the units at once — do not relay. Splitting such a step makes the result wrong silently, and nothing downstream will catch it. Finish the step, or stop and REPORT, and relay after that. A saturated agent is exactly the one most tempted to hand off mid-thought, so treat that temptation as the cue to run this check rather than to skip it.

## Fill the packet

The RELAY PACKET template lives in `../../references/protocol.md`. Read it there and fill every field. Three of them a model gets wrong under context pressure:

- **`established`** — pair every fact with the command that proves it. A fact without its command is a claim, and your successor cannot tell the two apart. Re-run it with Bash if you no longer hold its output.
- **`discarded`** — what you tried and rejected, *with the reason*. This field justifies the relay on its own: without it the fresh agent walks straight back into your dead ends. It is also the first thing a saturated model drops, so write it before the fields that feel more urgent.
- **`what_i_do_not_know`** — mandatory, never left empty. Omit that line and the successor fills gaps by plausibility, and `established` quietly starts holding guesses.

## Send it with `--archive` when the transport is tmux

If you are delivering through `team:send-tmux-message`, pass `--archive` and a path on that send. A mandate that goes missing can be refilled from the fleet plan; this packet cannot be refilled by anyone — it is your state at ~70% context, and you leave right after sending it.

## The successor takes over your name

A name designates a scope, not a memory. The fresh agent adopts your name so the rest of the fleet's address book stays valid and the relay stays invisible to everyone else. State that in `role`.

## You do not vanish on send

Sending the packet does not end you. Stay alive through the overlap — the successor can come back and ask, and that is what makes a relay repairable where a compaction is not. Leave once it confirms it is working.

---

Relay rather than compact because the packet is written by the agent that knows what mattered, the successor starts on a clean prefix, and the overlap is a repair channel.

Any window relays this way. An orchestrator in FRAME is a peer here, not an exception.
