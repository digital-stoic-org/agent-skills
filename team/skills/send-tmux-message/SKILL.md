---
name: send-tmux-message
description: 'Deliver one mandate or relay packet into another named agent''s tmux pane, for fleets running where SendMessage does not exist (Bedrock, third-party providers). It pastes into the target''s pane and submits, so the packet becomes a turn there without a keystroke. Use when: send-tmux-message, send to an agent, deliver a mandate, deliver a relay packet, fleet transport, no SendMessage, Bedrock, third-party provider, paste into another pane, tmux transport.'
allowed-tools: [Read, Bash]
argument-hint: "[agent-name] [--archive PATH]"
context: main
user-invocable: true
---

# Send tmux message

This is the transport `team:brief` and `team:relay` use when the harness has no `SendMessage` — a fleet on Bedrock or another third-party provider. It carries the packet; it does not decide what goes in it. The MANDATE and RELAY PACKET templates, and every rule about who may emit what, stay in `../../references/protocol.md` and are unchanged by the transport.

## Call it

```bash
"${CLAUDE_PLUGIN_ROOT}/skills/send-tmux-message/scripts/send-tmux-message.sh" <agent-name> [--from NAME] [--archive PATH] <<'EOF'
<the filled template, verbatim>
EOF
```

Run it with the sandbox disabled — always, including `--list`. The tmux server socket and the harness's session registry both sit outside a sandboxed Bash call, so a sandboxed run fails on a fleet that is perfectly healthy, and it fails as exit 6, which reads like a broken tmux rather than a wrong call.

`--list` prints the live named sessions and their panes. Run it when you need to confirm a name before sending, rather than sending hopefully.

The payload goes in on **stdin**, never as an argument, and the heredoc must be quoted (`<<'EOF'`) so the shell leaves backticks and `$` alone. A `scope:` line describing a path with a `$` in it is not a hypothetical.

## It submits

The payload lands in the target's input box and is submitted about a second later, in a separate call — a keystroke sent in the same call as the text arrives before the line is composed. The receiving agent takes its turn on its own, with no one pressing Enter.

There is no option to skip that. A packet left sitting unsubmitted in someone's box is a packet that silently did not arrive: the sender reads exit 0, the fleet plan says the branch is briefed, and nothing is running. Worse, that text is then flushed by whatever Enter comes next in that pane, which may be the human submitting something else entirely and dragging a stale mandate along with it.

What keeps the fleet from talking itself into a spiral is not the keystroke, then. It is the protocol: three arrows travel by machine and no others, there is no peer roster to answer, and a question or a readback is printed for the human in the agent's own window rather than sent anywhere. An agent that cannot address a peer cannot start a loop with one, whether or not its deliveries submit.

## Delivery failure comes back on the exit code, immediately

The script resolves the name against the harness's own session registry — one JSON per live session, holding the agent's name and its tmux pane — then checks that the process is alive and the pane still exists. It delivers or it fails synchronously; there is no queue and nothing lands later.

| Code | Meaning |
|---|---|
| 0 | delivered |
| 2 | usage |
| 3 | unknown or dead name, or its pane is gone |
| 4 | you addressed your own pane |
| 5 | empty payload — nothing was sent |
| 6 | tmux, `python3` or spool failure |

A sandboxed call is the one exit 6 that is not about the fleet. Check that before you suspect tmux.

Non-zero is what `team:brief` keys its "if the target does not exist, or does not answer" rule on: say so to the human in plain text and stop. Do not retry in a loop and do not try a neighbouring name. A silent retry against a dead name is how a fleet quietly loses a whole branch of work.

## During a relay, the newest claimant wins

Through a relay overlap two live sessions answer to one name, because the successor adopts the origin's while the origin is still alive. The script resolves to whichever claimed the name most recently, which is the successor — the same rule the rest of the fleet's address book already assumes. The origin stays reachable in its own pane, which is what makes the overlap the repair channel `../../references/protocol.md` describes.

## Archive a relay packet, not a mandate

Every send leaves a replay copy at `$FLEET_SPOOL/<name>.last.msg` (default `~/.claude/fleet/`), overwritten by the next send to that name. That is enough for a mandate, which you can refill from the fleet plan. A relay packet cannot be refilled — it is one agent's state at ~70% context, and that agent leaves — so pass `--archive` for it, and pass it before you send rather than after you wish you had.

## Do not reach for `send-keys` with the payload

Both failures are measured, not theoretical.

A multiline payload sent through `send-keys` is delivered as raw newline bytes, and the TUI reads each one as Enter — a seven-line MANDATE submits as seven turns, the first six being fragments of YAML. And a single argv entry is capped at 131072 bytes on Linux whatever `ARG_MAX` says, so a large packet fails outright with `E2BIG`. `load-buffer` reads a file and `paste-buffer -d -p` delivers one bracketed-paste block, which is why the script does that instead.

---

One packet, one named target, delivered and submitted. What the packet contains, and whether it was permitted at all, is decided in `../../references/protocol.md` — not here.
