---
name: plan-fleet
description: 'The session''s fleet plan, written in FRAME: the partition, the open questions, the gates. Use when: plan fleet, fleet plan, partition, who owns what, owned_paths, hands_off, session plan, before spawning agents, before parallel work.'
allowed-tools: [Read, Bash, Write]
argument-hint: "[path to source file, or a description of the work]"
context: main
user-invocable: true
---

# Plan the fleet

FRAME. One file — the session's only steering artifact, duplicated nowhere. Reasoning behind every rule here: [reference.md](reference.md).

**1 · Source.** Path → `Read` it. Description of the work → that is the source. Bare → material already in the conversation, invent nothing it lacks. Neither → ask in §3.

**2 · Live names, before any row.** A name is an address: a row naming a pane that does not exist is a branch that never starts, silently. Sandbox **disabled** (else exit 6 on a healthy fleet):

```bash
"${CLAUDE_PLUGIN_ROOT}/skills/send-tmux-message/scripts/send-tmux-message.sh" --list
```

A row may name an agent **about to** exist — say which ones in §3, not at `/brief` time with the mandate written. An empty list is reported, not worked around.

**3 · Ask once, plain text, in the conversation.** One message, three things: where the plan file goes · anything unsourced in §1 · names the partition assumes but the registry does not show. Never guess a path, invent a convention, or derive one from the working directory. One answer, then write there.

**4 · Three things, nothing else.** Partition — one row per agent live or about to be: name, `owned_paths`, `hands_off`. Open questions. Gates the human settled, which no agent reopens.

```
partition
  scout    owned_paths: /abs/path/survey/        hands_off: <this plan>, <shared manifest>
  writer   owned_paths: /abs/path/doc/intro.md   hands_off: <this plan>
open
  - does the API version matter here?
gates
  - English throughout — settled, do not reopen
```

A shape, not a form: **no lots, no deliverables** — discovery moves the scope, so lots go stale by construction.

## Standing rules

- **Partition before the work** — a collision loses updates with no error: silent, unrepairable. Rule itself: `../../references/protocol.md` § **Ownership** — apply from there, never restate it in the plan.
- **Never copied into a mandate** — own row only, no peer roster: the cast goes stale silently, and an agent that cannot address a peer keeps questions flowing to the human.
- **Alive, you its only writer, in every agent's `hands_off`** — shared, high-traffic; edit it as agents appear, finish, get redirected.
- **A relay changes nothing in it** — the successor takes the origin's name, and a name designates a scope, not a memory. Rewriting the row is the mistake.

Write the plan, then move to BRIEF. Nothing is emitted from FRAME.
