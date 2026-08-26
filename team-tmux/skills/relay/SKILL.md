---
name: relay
description: 'Hand your state to a fresh agent at ~70% context instead of compacting: fill one relay packet, archive it, deliver it into the successor''s pane over tmux, then leave. The successor takes over your name. Use when: relay, RELAY state, relay packet, handoff, hand over, take over, successor, context full, out of context, running out of context, 70% context.'
allowed-tools: [Read, Bash]
context: main
user-invocable: true
---

# Relay

At ~70% context: one packet to the successor, then you leave. That packet is the whole permitted emission — no preamble to the human, no announcement to peers, nothing after it.

## Gate 1 — not mid cross-item step

Mid synthesis, mid deduplication, mid global arbitration — anything reasoning across all units at once — **do not relay**: splitting it makes the result wrong silently and nothing downstream catches it. Finish the step or REPORT, then relay. A saturated agent is the one most tempted to hand off mid-thought, so the temptation is the cue to run this check, not to skip it.

## Gate 2 — the successor already exists

Before writing the packet, sandbox disabled:

```bash
"${CLAUDE_PLUGIN_ROOT}/skills/send-tmux-message/scripts/send-tmux-message.sh" --list
```

Your name must appear **twice**: your own pane and the successor's — a fresh window the human opened under your name. Two live sessions answer to one name through the overlap; the transport resolves to the newest claimant, the successor. By design: that is what makes the overlap a repair channel.

**Once only = the successor is not up.** Ask the human in plain text to open and name a window, and wait. Do not send the packet to a different name to keep it safe, and do not skip it and compact instead — compaction is what this state exists to avoid. A mandate refills from the fleet plan and a report reprints; this packet cannot (`reference.md`).

## Fill the packet

Template: RELAY PACKET in `../../references/protocol.md`. Fill every field. Five go wrong under context pressure:

| Field | What context pressure does to it |
|---|---|
| `discarded` | **Write it first**, with the reason — it justifies the relay on its own, and it is the first field a saturated model drops. Without it the successor walks back into your dead ends. |
| `established` | Every fact with the command that proves it. Re-run it with Bash if the output is gone. |
| `what_i_do_not_know` | Mandatory, never empty. |
| `orchestrator` | Carried over VERBATIM — the successor inherits nothing but this packet, so a name left out is a name gone for good: it keeps every duty that produces a report and loses the address. |
| `role` | The scope this name designates. A name is a scope, not a memory: address book still valid, fleet plan unedited, orchestrator unnotified. |

## Deliver it, with `--archive`

Pass `--archive` and a path **now**, not after you wish you had — the routine spool copy is overwritten by the next send to that name. Sandbox disabled, heredoc quoted:

```bash
"${CLAUDE_PLUGIN_ROOT}/skills/send-tmux-message/scripts/send-tmux-message.sh" <your-own-name> --from <your-own-name> --archive <path> <<'EOF'
<the filled RELAY PACKET>
EOF
```

Target is **your own name** — the successor adopted it, newest claimant wins. The self-send guard does not fire: it compares panes, not names, and the pane it resolves to is the successor's.

Non-zero exit = tool failure, not a state transition → plain text to the human, stop. The archive is written, so the packet survives and the human can carry it by hand. No retry loop, no neighbouring name. Exit codes: `../send-tmux-message/SKILL.md`.

## You do not vanish on send

Stay alive through the overlap so the successor can come back and ask — that is what makes a relay repairable where a compaction is not. Leave once it confirms it is working.

Why relay beats compaction, and who may relay: `reference.md`.
