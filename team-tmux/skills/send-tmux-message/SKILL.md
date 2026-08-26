---
name: send-tmux-message
description: 'The transport every machine arrow in this plugin travels down: deliver one mandate, report or relay packet into another named agent''s tmux pane and submit it, so it becomes a turn there without a keystroke. Also lists the live named panes. Use when: send-tmux-message, send to an agent, deliver a mandate, deliver a report, deliver a relay packet, fleet transport, list agents, list the fleet, who is live, no SendMessage, Bedrock, third-party provider, paste into another pane, tmux transport.'
allowed-tools: [Read, Bash]
argument-hint: "[agent-name] [--archive PATH] | --list"
context: main
user-invocable: true
---

# Send tmux message

Transport for the whole plugin. `brief`, `report` and `relay` call the script directly instead of invoking this skill — a transport that must be summoned gets forgotten under pressure. This file adds the manual send, `--list`, and the exit-code table those three key their failure handling on. It carries the packet, it does not decide what goes in it: templates and emission rules live in `../../references/protocol.md`.

## Call it

```bash
"${CLAUDE_PLUGIN_ROOT}/skills/send-tmux-message/scripts/send-tmux-message.sh" <agent-name> [--from NAME] [--archive PATH] <<'EOF'
<the filled template, verbatim>
EOF
```

- **Sandbox disabled on every call, `--list` included.** The tmux socket and the session registry sit outside a sandboxed Bash call: a sandboxed run fails on a perfectly healthy fleet, and fails as exit 6 — reading like broken tmux rather than a wrong call.
- Payload on **stdin, never argv**; heredoc **quoted** (`<<'EOF'`) so the shell leaves backticks and `$` alone. A `scope:` line describing a path with a `$` in it is not hypothetical.
- **Never `send-keys` for the payload** — multiline arrives as raw newlines the TUI reads as Enter, and one argv entry caps at 131072 bytes → `E2BIG`. Both measured.
- `--archive` is for a **relay packet**, never a mandate or a report, and pass it *before* you send. Only a relay packet cannot be refilled once the spool copy is overwritten.

## `--list`

```bash
"${CLAUDE_PLUGIN_ROOT}/skills/send-tmux-message/scripts/send-tmux-message.sh" --list
```

Prints live named sessions with status, pane and working directory. **A name is an address here, not a label**: an unnamed window is in no registry, so it receives no mandate and delivers no report while looking perfectly healthy from the inside — which is why four skills consult this list rather than assume it (Addressability, `../../references/protocol.md`). An empty list is printed as such, in words; it is not a crash.

## It submits

The payload is submitted about a second later, in a separate call — a keystroke sent alongside the text arrives before the line is composed. **No opt-out.** An unsubmitted packet silently did not arrive: sender reads exit 0, the plan says briefed, nothing is running — then that text is flushed by whatever Enter comes next, dragging a stale mandate along with the human's own input.

What bounds the traffic is the protocol, not the keystroke: three machine arrows and no others, no peer roster, questions and readbacks printed locally. An agent that cannot address a peer cannot start a loop with one.

## Failure is synchronous

The script resolves the name against the session registry, checks the process is alive and the pane exists, then delivers or fails. No queue, nothing lands later.

| Code | Meaning |
|---|---|
| 0 | delivered |
| 2 | usage |
| 3 | unknown or dead name, or its pane is gone |
| 4 | you addressed your own pane |
| 5 | empty payload — nothing was sent |
| 6 | tmux, `python3` or spool failure |

Exit 6 is the one that may not be about the fleet — check for a sandboxed call before suspecting tmux.

**Non-zero → say so to the human in plain text and stop.** No retry loop, no neighbouring name: a silent retry against a dead name loses a whole branch of work, and a near-miss name drops the packet into someone else's window.

In a relay overlap two sessions answer to one name; the script resolves to the newest claimant — the successor. The origin stays reachable in its own pane, which makes the overlap the repair channel.

Why each rule above holds → `reference.md`.
