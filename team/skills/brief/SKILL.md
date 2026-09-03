---
name: brief
description: 'Delegate one unit of work to one named agent: fill a single MANDATE, send it, then go silent. Use when: brief, delegate, mandate, BRIEF state, delegate to a named agent, hand a unit of work off, put an idle agent to work, send a mandate.'
allowed-tools: [SendMessage]
argument-hint: "[work description]"
context: main
user-invocable: true
---

# Brief

BRIEF emits **one** mandate, to **one** named agent, then you are in WATCH — silent until a question or a report comes back. Never broadcast. Runs in the originating window: usually the orchestrator, but any agent that hands work off.

**Read nothing here.** Skeleton and role lines below are complete and verbatim — they are the whole contract the delegate needs, and you must assume it has read nothing else. `../../references/protocol.md` holds the reasoning behind each field, for whoever amends the contract; opening it in this window spends the context this skill exists to protect.

**Choose no model.** The delegate is a live agent in a window that already exists — its model was fixed when that window was opened, and a mandate cannot change it.

## 1. Source the work, and the boundary

Arguments describe the work → `scope` and `knowledge_state`. Bare → ask. Never infer from the surrounding conversation, never invent.

`owned_paths` / `hands_off` you assert from what you already hold. No plan file to consult, no roster to inherit. This is the one thing that cannot be deferred: two agents writing one path lose updates with no error at all — silent, unrepairable.

## 2. One message to the human

Fold every outstanding question into a single plain-text message: the target's **name**, plus whatever step 1 left unsourced.

## 3. Fill

```
scope:               what is yours / what is explicitly not yours
orchestrator:        the name of the agent sending this mandate — your only machine recipient
owned_paths:         [ABSOLUTE paths; trailing / = whole subtree — outside them you read, you do not write]
hands_off:           [shared, high-blast-radius files — a reminder on top of that rule, never the boundary]
knowledge_state:     established / hypothesis / to_discover
stop_conditions:     ... (must include "you discover the scope is wrong")
cadence:             when you are expected to report
what_i_do_not_know:  ...
```

- `scope` — state the negative half. An unstated boundary is one an agent crosses.
- `orchestrator` — **your own name**: the delegate's only machine address, where its REPORT lands. Omitted → reporting becomes something only the human can relay by hand. One name is not a roster; questions and readbacks still print in the delegate's own window, for the human.
- `owned_paths` — absolute, so nothing resolves against the delegate's cwd. Precise file when it exists, trailing `/` for a subtree it will populate. A subtree is owned **exclusively**: "you both write in `X/`, just use different filenames" partitions nothing — two agents asked to write up their notes both create `notes.md`.
- `hands_off` — a few shared, high-blast-radius files it is likely to reach for. A reminder, never the boundary; the boundary is default deny.
- `stop_conditions` — always includes "you discover the scope is wrong".
- `cadence` — criterion is **reversibility**, not milestones, not elapsed time. Name the points of no return where it stops and waits; everywhere else it reports and keeps going while you redirect asynchronously. Halting at every milestone makes the human the bottleneck.
- `what_i_do_not_know` — mandatory, never empty. Hidden gaps get filled by plausibility at the other end.

## 4. Append these five lines verbatim, and send

```
Announce your state on a single line at every change: [READY] [READBACK] [WORK] [QUESTION] [REPORT].
In READBACK: three lines — mission as I understand it / assumptions I filled in / blocking gaps — then wait for my confirmation.
If you discover that the scope you were given is wrong, switch to QUESTION immediately. That takes priority over the task.
You emit a message only on a state transition. The rest of the time you are silent.
When a stop condition or a cadence checkpoint fires, run team:report. It is the only message you send by machine.
```

Every mandate carries them. They are the delegate's entire contract — states, readback, the wrong-scope override, and the rule that it speaks only on a transition. Filled skeleton and role lines go out as **one** `SendMessage`, never two.

**If the send fails** — tool error = delivery failure, not a state transition. Name it to the human in plain text and stop. No retry loop, no neighbouring name: a silent retry against a dead name loses a whole branch of work, a near-miss name drops this mandate in someone else's window.

---

One mandate, one named target, then WATCH. The target answers in READBACK — in its own window, to the human, not back to you.
