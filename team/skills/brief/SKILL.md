---
name: brief
description: 'Delegate one unit of work to one named agent: choose the model for the delegate, fill a single MANDATE, send it, then go silent. Use when: brief, delegate, mandate, BRIEF state, delegate to a named agent, hand a unit of work off, put an idle agent to work, send a mandate.'
allowed-tools: [Read, Bash, Skill, SendMessage]
argument-hint: "[work description]"
context: main
user-invocable: true
---

# Brief

You are delegating. BRIEF emits exactly one mandate, to one named agent, and then you are in WATCH — silent until a question or a report comes back. This runs in the originating window: usually the orchestrator, but any agent that hands work off runs it.

## 1. Source the work being delegated

If `/brief` was invoked with arguments, those arguments describe the work and are the source of `scope` and `knowledge_state` in the mandate. If it was invoked bare, ask the human in plain text what is being delegated — never infer it from the surrounding conversation, and never invent it. This step sources the work content only; the template itself stays in `../../references/protocol.md`.

## 2. Choose the model — for the delegate, not for yourself

Before you fill anything, hand the model choice to a skill built for it: look in your available-skills list for one that judges which model tier and reasoning-effort level a task needs, and recommends rather than executes. If one is there, invoke it via `Skill` and take its verdict. If none is, ask the human in plain text instead of guessing. This skill carries no model table of its own, deliberately: two tables in two places diverge, and the stale one keeps being read.

## 3. Ask the human for the target agent's name

Ask in plain text in the conversation, grouping this with any question still outstanding from the steps above into a single message. A mandate goes to one named agent; it is never broadcast.

## 4. Fill the MANDATE template

The template lives in `../../references/protocol.md`. Read it there and fill every field. Five of them need care:

- **`owned_paths` and `hands_off`** — copied from that agent's row in the fleet plan, and only its row. Never another agent's entries, never a roster of peers. During discovery the cast changes, so a roster frozen into a mandate goes stale in silence; and an agent that does not know its peers cannot address one, which is what keeps questions flowing to the human.
- **`stop_conditions`** — always includes "you discover the scope is wrong".
- **`cadence`** — the agent reports and keeps going by default, and stops to wait only before something irreversible. The criterion is reversibility, not milestones and not elapsed time: work that can be redone costs only tokens, whereas a write that lands or an external call that fires cannot be taken back. Name the specific points of no return where the agent must stop and wait; everywhere else the human redirects asynchronously. An agent that halts at every milestone turns the human into the bottleneck, and their attention is the resource this protocol exists to protect.
- **`what_i_do_not_know`** — mandatory, never left empty. A mandate that hides its own gaps gets filled in by plausibility at the other end.
- **`orchestrator`** — your own name, which is the delegate's only machine address: it is what lets that agent deposit its report back into your window where `team:send-tmux-message` is the transport. Naming it opens no roster, because the orchestrator was already that agent's single authorised recipient; questions and readbacks are unaffected and still go to the human, printed in the agent's own window.

## 5. Append the four role lines verbatim, and send

They are in `../../references/protocol.md`, in a fenced block written to be copied. Every mandate carries them. The target should already have adopted the protocol through `team:ready` at pre-warm; these lines are the guarantee for when it has not. Send the filled template and those lines as one message to that one agent — one mandate is one message, never two. Where the harness has no `SendMessage`, that one message goes through `team:send-tmux-message` instead, which needs Bash and a sandbox-free call; the packet and the role lines are identical either way, since only the tube changes.

## If the target does not exist, or does not answer

Say so to the human in plain text, and stop. This is a tool failure, not a state transition — not an emission the protocol authorises, but a report that delivery failed. It surfaces differently by transport and is handled identically: with `SendMessage` it comes back as a tool error, and through `team:send-tmux-message` as a non-zero exit code, whose codes that skill documents and this one does not repeat. Treat any non-zero exactly as you treat a tool error — name the failure to the human in plain text, and stop there. Do not retry in a loop and do not try a neighbouring name: a silent retry against a dead name is how a fleet quietly loses a whole branch of work, and a near-miss name drops this mandate into someone else's window.

---

One mandate, one named target, then WATCH. Nothing more is emitted until a question or a report arrives.
