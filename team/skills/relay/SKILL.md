---
name: relay
description: 'Hand your state to a fresh agent at ~70% context instead of compacting. Emits one relay packet; the successor takes over your name. Use when: relay, RELAY state, relay packet, handoff, hand over, take over, successor, context full, out of context, running out of context, 70% context.'
allowed-tools: [SendMessage]
context: main
user-invocable: true
---

# Relay

RELAY is entered at roughly 70% context: one packet to the fresh agent taking over, then you leave. That packet is the whole permitted emission — no preamble to the human, no announcement to peers, nothing after it.

**Read nothing, re-run nothing.** The skeleton below is complete. You are the agent with the least context left in this fleet, and every token spent re-reading the contract or re-proving a fact you already established is a token missing from the packet itself. `../../references/protocol.md` holds the reasoning, for whoever amends the contract. The packet below is what your successor actually inherits — assume it will read nothing else.

## 1. Gate — are you allowed to relay right now?

In the middle of a **cross-item step** — a synthesis, a deduplication, a global arbitration, anything reasoning across all the units at once — do not relay. Splitting one makes the result wrong silently and nothing downstream catches it. Finish it, or stop and REPORT, then relay. A saturated agent is exactly the one most tempted to hand off mid-thought: treat that temptation as the cue to run this check, not to skip it.

## 2. Fill

```
role:                the scope this name designates
orchestrator:        carried over — the successor's only machine recipient
owned_paths:         [ABSOLUTE paths; trailing / = whole subtree — outside them you read, you do not write]
hands_off:           [shared, high-blast-radius files — a reminder on top of that rule, never the boundary]
established:         each fact with the command that proves it
discarded:           what I tried and rejected, WITH the reason
in_progress:         what is half-done, and where it stands
open:                what has not been touched
gates:               what the human has already decided — do not reopen
what_i_do_not_know:  ...
```

- `role` — the scope the inherited name designates. **The successor takes over your name**: a name designates a scope, not a memory, so the fleet's address book stays valid and the relay is invisible to everyone else.
- `orchestrator` — carried over from your mandate. The successor inherits nothing but this packet: a name left out here is a name gone for good, and its reports lose their machine path while every duty that produces them survives.
- `owned_paths` / `hands_off` — the partition, carried over intact. A subtree belongs to one agent only.
- `established` — every fact paired with **the command that proves it**. Write the command; do not run it. A fact without one is a claim your successor cannot tell apart from a fact — and the successor re-runs it, on a clean prefix, only if it needs the output.
- `discarded` — what you tried and rejected, *with the reason*. **This field justifies the relay on its own**: without it the fresh agent walks straight back into your dead ends. It is also the first thing a saturated model drops, so write it before the fields that feel more urgent.
- `in_progress` / `open` — half-done and where it stands, versus never touched. Together they are the difference between resuming and restarting.
- `gates` — what the human already decided. Reopening one spends the resource this protocol exists to protect.
- `what_i_do_not_know` — mandatory, never empty. Omit it and the successor fills gaps by plausibility, and `established` quietly starts holding guesses.

## 3. Send, then stay alive through the overlap

One `SendMessage` to the successor. Sending does not end you: it can come back and ask, and that is what makes a relay repairable where a compaction is not. Leave once it confirms it is working.

---

Relay rather than compact: the packet is written by the agent that knows what mattered rather than by a summariser working a transcript, the successor starts on a clean prefix with no cache break, and the overlap is a repair channel. Any window relays this way — an orchestrator in FRAME is a peer here, not an exception.
