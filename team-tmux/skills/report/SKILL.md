---
name: report
description: 'A stop condition fired: fill one REPORT and deliver it into your orchestrator''s pane over tmux, then wait for the redirect. Use when: report, REPORT state, stop condition, report back, deliver a report, done with the mandate, cadence report, send findings to the orchestrator.'
allowed-tools: [Read, Bash]
context: main
user-invocable: true
---

# Report

One packet, one recipient: the `orchestrator` named in your mandate — the only machine arrow a fleet agent ever sends. No peer roster exists and none can be acquired.

## 1. Gate — report, or question?

**"The scope I was given is wrong"** → **not a report** but a QUESTION: to the human, printed in your own window, no machine path. Sent to the orchestrator it gets buried — and it is the most valuable thing discovery surfaces.

Everything else on `stop_conditions`, and every `cadence` checkpoint → report.

## 2. Address

**Missing** (never in the mandate, or dropped by an inherited relay packet) → stop · tell the human in plain text · **print the report in your own window** · let them carry it. Never guess a name; never `--list`-shop for a plausible one — the list is every live pane, most not yours, and likelihood lands a report in a stranger's window.

**Present** → confirm it still resolves **before** spending tokens on the packet. Sandbox disabled. A relayed orchestrator keeps its name; the row is there under the successor.

```bash
"${CLAUDE_PLUGIN_ROOT}/skills/send-tmux-message/scripts/send-tmux-message.sh" --list
```

## 3. Fill

Every field of `../../references/protocol.md` § *Template: REPORT*. Three fail exactly when the work feels finished:

- `established` — fact **+ its proving command**; the orchestrator acts on these and cannot tell fact from claim. Re-run with Bash if the output is gone.
- `next` — a **proposal**, not a decision; the redirect is the orchestrator's to write.
- `what_i_do_not_know` — mandatory, never empty; a hidden gap reads as complete and the redirect gets built on it.

Report, not transcript: the change in knowledge state, not the path taken.

## 4. Deliver

One report, one call. Sandbox disabled. Heredoc **quoted** — an `established` line quoting its proving command is where a bare backtick does damage.

```bash
"${CLAUDE_PLUGIN_ROOT}/skills/send-tmux-message/scripts/send-tmux-message.sh" <orchestrator-name> --from <your-name> <<'EOF'
<the filled REPORT>
EOF
```

It submits itself — WATCH → FRAME in the orchestrator's window, no keystroke.

Non-zero = **tool failure, not a state transition** → tell the human in plain text · **print it locally** so the content survives · stop. No retry loop, no neighbouring name. Codes: `../send-tmux-message/SKILL.md` · shapes: `reference.md`.

## 5. Then wait

**A report does not end you.** Back in WORK's waiting room — alive, silent, holding everything established. Do not re-summarise the report, do not start the next obvious work on your own initiative, do not announce that you are waiting. Silence is the state.
