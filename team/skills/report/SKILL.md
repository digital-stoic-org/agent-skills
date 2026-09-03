---
name: report
description: 'A stop condition or a cadence checkpoint fired: fill one REPORT and send it to your orchestrator, then go back to waiting. Use when: report, REPORT state, stop condition, report back, deliver a report, done with the mandate, cadence report, send findings to the orchestrator, finished the work I was given.'
allowed-tools: [SendMessage]
context: main
user-invocable: true
---

# Report

One packet, one recipient: the `orchestrator` named in your mandate. It is the only message you ever send by machine — no peer roster exists and none can be acquired.

**Read nothing.** The skeleton below is complete. `../../references/protocol.md` holds the reasoning, for whoever amends the contract; opening it here spends context on a file the orchestrator will never see.

## 1. Gate — report, or question?

**"The scope I was given is wrong"** is **not a report.** It is a QUESTION: addressed to the human, printed here in your own window, no machine path. Sent to the orchestrator it arrives buried inside a status packet — and in discovery it is the single most valuable thing you can surface. Stop and print it instead.

Everything else on your `stop_conditions`, and every `cadence` checkpoint → report.

## 2. Address

The `orchestrator` field of your mandate. **Missing** — never given, or dropped by a relay packet you inherited → stop, say so to the human in plain text, and **print the report in your own window** so its content survives. Never guess a name and never settle for a plausible one: likelihood lands a report in a stranger's window.

## 3. Fill

```
from:                your own name
state:               REPORT
stop_condition:      which one of them fired
established:         each fact with the command that proves it
in_progress:         what is half-done, and where it stands
next:                what you would do if sent back in — a proposal, not a decision
what_i_do_not_know:  ...
```

- `from` — your own name, in the packet rather than left to the transport. The packet outlives the tube: quoted into a plan or carried into a relay, an unattributed report belongs to nobody.
- `stop_condition` — which one fired, quoted from the mandate.
- `established` — every fact paired with **the command that proves it**. Write the command you actually ran; do not re-run it, and never reconstruct a plausible-looking one. The orchestrator acts on these and cannot tell a fact from a claim.
- `in_progress` — what is half-done and where it stands.
- `next` — a **proposal**, not a decision. The redirect is the orchestrator's to write; anticipating it here does not make it yours.
- `what_i_do_not_know` — mandatory, never empty. A hidden gap reads as completeness, and the redirect gets built on it.

Report, not transcript: the change in knowledge state, not the path you took to get there.

## 4. Send, then wait

One `SendMessage` to that one name. A tool error is a delivery failure, not a state transition: say so to the human in plain text, **print the report locally** so nothing is lost, and stop. No retry loop, no neighbouring name.

**A report does not end you.** You are back in WORK's waiting room — alive, silent, holding everything you established, ready for the redirect. Do not re-summarise the report, do not start the next obvious piece of work on your own initiative, do not announce that you are waiting. Silence is the state.
