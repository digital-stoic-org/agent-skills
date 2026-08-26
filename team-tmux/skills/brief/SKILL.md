---
name: brief
description: 'Delegate one unit of work to one named agent: choose the model for the delegate, fill a single MANDATE, deliver it into that agent''s pane over tmux, then go silent. Use when: brief, delegate, mandate, BRIEF state, delegate to a named agent, hand a unit of work off, put an idle agent to work, send a mandate.'
allowed-tools: [Read, Bash, Skill]
argument-hint: "[work description]"
context: main
user-invocable: true
---

# Brief

BRIEF emits **one** mandate, to **one** named agent, then you are in WATCH — silent until a question or a report comes back. Never broadcast. Runs in the originating window — usually the orchestrator, but any agent that hands work off.

The contract — MANDATE template, the four role lines, Transport, Addressability — is `../../references/protocol.md`. Read it there; this file does not restate it. Per-field guidance and the reasoning behind the rules below: `reference.md`, this folder.

**1. Source the work.** Arguments describe the work and are the source of `scope` and `knowledge_state`. Invoked bare → ask the human in plain text. Never infer it from the surrounding conversation, never invent it.

**2. Choose the model — for the delegate, not for yourself.** Find the skill in your available-skills list that judges model tier and reasoning effort and recommends rather than executes; invoke it via `Skill`, take its verdict. None there → ask the human. This skill carries no model table of its own, deliberately.

**3. Read the live names, and find your own among them.** Sandbox disabled:

```bash
"${CLAUDE_PLUGIN_ROOT}/skills/send-tmux-message/scripts/send-tmux-message.sh" --list
```

Two things come out of it, both needed before a single field is filled.

- **The target must be in it.** Missing → say so to the human in plain text and stop. Never a neighbouring name.
- **Your own name is in it too**, on the row matching `$TMUX_PANE` — that is the value of the `orchestrator` field. Read it, do not recall it — a relay may have handed you this window under a name other than the one you remember. Your own pane absent → you are unreachable, the delegate's report has nowhere to land: stop, before you brief anyone into a one-way conversation.

**4. Ask the human for the target agent's name.** In plain text, grouped with any question still outstanding into a single message.

**5. Fill the MANDATE.** Template in protocol.md, every field. Five need care — `owned_paths`/`hands_off`, `stop_conditions`, `cadence`, `what_i_do_not_know`, `orchestrator`: read `reference.md` before filling them.

**6. Append the four role lines verbatim, and deliver.** They are in protocol.md, in a fenced block written to be copied. Every mandate carries them; they are the guarantee for a target that skipped `team-tmux:ready`. One mandate is one delivery — filled template and role lines in a single call, never two. Sandbox disabled, heredoc quoted so `$` and backticks in `scope` and `owned_paths` survive.

```bash
"${CLAUDE_PLUGIN_ROOT}/skills/send-tmux-message/scripts/send-tmux-message.sh" <target-name> --from <your-name> <<'EOF'
<the filled MANDATE, then the four role lines>
EOF
```

`--from` is what lets the delegate tell a fleet mandate from something the human typed into its pane by hand. The delivery submits on its own; the target answers in READBACK — in its own window, to the human, not back to you.

**If it fails.** A non-zero exit is a tool failure, not a state transition: name it to the human in plain text and stop. No retry loop, no neighbouring name — `reference.md` carries both reasons. Exit codes are in `../send-tmux-message/SKILL.md` and are not repeated here; exit 6 on an otherwise healthy fleet is almost always a sandboxed call rather than a broken tmux.

---

One mandate, one named target, then WATCH.
