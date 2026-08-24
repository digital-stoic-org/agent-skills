---
name: plan-fleet
description: 'Write the session''s fleet plan in FRAME: who owns what, what is still open, what the human has already settled. Use when: plan fleet, fleet plan, partition, who owns what, owned_paths, hands_off, session plan, before spawning agents, before parallel work.'
allowed-tools: [Read, Bash, Write]
argument-hint: "[path to source file, or a description of the work]"
context: main
user-invocable: true
---

# Plan the fleet

You are in FRAME, at the start of a working session. This skill produces one file, and that file is the session's only steering artifact — there is no second register anywhere, and nothing here is duplicated elsewhere.

## Source the material

If `/plan-fleet` was invoked with an argument that is a path, read that file with `Read` — it is the source of the partition. If the argument is a description of the work rather than a path, that description is the source. If invoked bare and the surrounding conversation already carries the material, use it, but do not invent what it is missing. If none of that yields the material, ask the human in plain text, in the same message as the question in the next section.

## Ask where the file goes

Ask the human, once, in plain text in the conversation, where the fleet plan should live — and, if the previous section left the material unsourced, fold that question into the same message. Do not guess a path, invent a convention, or derive one from the working directory. One message, one answer, then write there.

## Three things go in it, and nothing else

The partition, one row per agent that exists or is about to: its name, its `owned_paths`, its `hands_off`. Then the open questions the session has not decided yet. Then the gates — what the human has already decided, which no agent may reopen.

```
partition
  scout    owned_paths: /abs/path/survey/        hands_off: <this plan>, <shared manifest>
  writer   owned_paths: /abs/path/doc/intro.md   hands_off: <this plan>
open
  - does the API version matter here?
gates
  - English throughout — settled, do not reopen
```

That shape is a shape, not a form to fill. In particular the plan does **not** decompose the work into lots or deliverables. This is discovery: the lots are not knowable in advance, and a plan that pretends otherwise goes stale the moment the scope moves — which it will.

## The partition precedes the work, and never leaves this file

Everything else in discovery can be deferred and corrected in flight. A write collision cannot: two agents writing one path lose updates with no error at all, so nothing records what was overwritten and the damage is silent and unrepairable. The rule itself — default deny, exclusively owned subtrees, `hands_off` as a reminder rather than the boundary — is in the Ownership section of `../../references/protocol.md`. Read it there and apply it; do not restate it in the plan.

The partition is never copied into a mandate. A mandate carries that agent's **own** `owned_paths` and `hands_off` — never the other agents' entries, never a roster of peers. During discovery the cast changes, so a roster frozen into a mandate goes stale in silence; and an agent that does not know its peers cannot address one, which is what keeps questions flowing to the human and keeps ping-pong closed. You hold the whole picture in this file. Each agent holds only its own row.

## The file is alive, and you are its only writer

Agents appear, finish, get redirected, get relayed; you edit the partition as that happens. Because it is shared and high-traffic, it belongs in every agent's `hands_off` — it is the clearest example of what that field is for.

---

Write the plan, then move to BRIEF. Nothing is emitted from FRAME.
