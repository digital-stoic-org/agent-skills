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

**One line per item, and no prose.** A pointer — a path, a `path:line`, a command — replaces every sentence that would explain it. The only field that carries a *why* is `discarded`; everywhere else a justification is the reasoning you already did, retyped at the price of the context this skill exists to save.

```
role:                the scope this name designates
orchestrator:        carried over — the successor's only machine recipient
owned_paths:         [ABSOLUTE paths; trailing / = whole subtree — outside them you read, you do not write]
hands_off:           [shared, high-blast-radius files — a reminder on top of that rule, never the boundary]
read_first:          [carried over — the closed list. Anything else, the successor asks the human]
deliverable:         ABSOLUTE path carried over — where the work already written lives
established:         each fact with the command that proves it, or the path where it is written
discarded:           what I tried and rejected, WITH the reason
in_progress:         what is half-done, and where it stands
open:                what has not been touched
gates:               what the human has already decided — do not reopen
what_i_do_not_know:  ...
next_action:         none — wait for the human
```

- `role` — the scope the inherited name designates. **The successor takes over your name**: a name designates a scope, not a memory, so the fleet's address book stays valid and the relay is invisible to everyone else.
- `orchestrator` — carried over from your mandate. The successor inherits nothing but this packet: a name left out here is a name gone for good, and its reports lose their machine path while every duty that produces them survives.
- `owned_paths` / `hands_off` — the partition, carried over intact. A subtree belongs to one agent only.
- `read_first` / `deliverable` — carried over from your mandate. The read list stays closed for the successor, which would otherwise reopen the whole project to rebuild what you already knew — the exact cost the relay exists to avoid. The `deliverable` path is where your work already sits, and losing it here turns a successor into someone who starts the file again.
- `established` — every fact paired with **the command that proves it**, or with the path where you already wrote it down. Write the command; do not run it. Prefer the path: a fact retyped here is a fact transcribed a second time, and a relay that transcribes the journal instead of pointing at it is doing the work compaction does, at the same price. A fact without command or path is a claim your successor cannot tell apart from a fact.
- `discarded` — what you tried and rejected, *with the reason*. **This field justifies the relay on its own**: without it the fresh agent walks straight back into your dead ends. It is also the first thing a saturated model drops, so write it before the fields that feel more urgent.
- `in_progress` / `open` — half-done and where it stands, versus never touched. Together they are the difference between resuming and restarting.
- `gates` — what the human already decided. Reopening one spends the resource this protocol exists to protect.
- `what_i_do_not_know` — mandatory, never empty. Omit it and the successor fills gaps by plausibility, and `established` quietly starts holding guesses.
- `next_action` — the literal line, always. `in_progress` and `open` hand the successor a rich state and no instruction to stay put; a model reading them without this field resumes the work on its own. It is written as a field rather than left to the role lines because it is the one the successor reads while it is still looking at what is half-done.

## 3. Append these lines verbatim

```
You are taking over this name. Announce [READY] on a single line and stop there.
Do nothing without my explicit go — no file read, no command, no sub-agent, no continuation of what is in progress.
Do not read the packet back to me. One line of acknowledgement is the whole answer.
You emit a message only on a state transition. The rest of the time you are silent.
Your only machine recipient is the orchestrator named above; questions go to me, printed in your own window.
```

A mandate carries its own five role lines from `team:brief`; a relay packet carries none, so without this block the successor inherits a scope and no regime — and takes the initiative, every time. This is the state contract, not a politeness: it is what makes the arriving agent a fleet agent rather than a session that happens to know a lot.

Filled skeleton and these lines go out as **one** `SendMessage`, never two.

## 4. Send, then stay alive through the overlap

One `SendMessage` to the successor. Sending does not end you: it can come back and ask **once**, if it is missing something the packet should have carried, and that is what makes a relay repairable where a compaction is not. Answer that one question and leave. An overlap that turns into a conversation is two agents holding the same scope and burning two contexts to do it — if a second question comes, the packet was wrong, and that is the human's to arbitrate, not yours to patch by message.

---

Relay rather than compact: the packet is written by the agent that knows what mattered rather than by a summariser working a transcript, the successor starts on a clean prefix with no cache break, and the overlap is a repair channel. Any window relays this way — an orchestrator in FRAME is a peer here, not an exception.
