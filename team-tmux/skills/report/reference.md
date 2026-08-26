# Report — failure shapes and rationale

Cold path. `SKILL.md` carries the procedure; this file carries the *why*, and the
symptoms you only need once something has already gone wrong. The contract itself
lives in `../../references/protocol.md`.

## Why the gate comes first

A model biased toward completing its mandate will grind on a false scope rather than
challenge it, and it will look productive doing so — which is exactly why "the scope I
was given is wrong" is both the most valuable thing a fleet agent can surface and the
hardest for it to decide to send. Wrapping it in a REPORT packet is the failure mode:
the packet is addressed to the orchestrator, the orchestrator is a machine, and the one
finding that should have interrupted the human sits in a queue instead. Protocol.md
annotates both QUESTION arrows "via the human" for this reason and leaves
`REPORT --> WATCH` bare.

## Why there is no peer roster

The absence is a safety property, not an oversight. One possible machine recipient is
what closes agentic ping-pong and forces every arbitration through the person running
the fleet. The orchestrator is reachable only because it is the one recipient the
mandate already handed you — never because it is a peer. This is why `--list` is a
*confirmation* call and never a *discovery* call: it returns every live pane in the
session, and almost none of them are yours to write into.

## Printing locally

Whenever the report cannot travel — no `orchestrator:` field, or a non-zero exit — print
the filled packet in your own window inside a fenced block, so the human can copy it
into the orchestrator's pane by hand. The content surviving matters more than the
transport working; an agent that reports a delivery failure without showing what it was
carrying has destroyed the thing it was protecting.

## Failure shapes

| Symptom | What it means |
|---|---|
| exit 6 on a fleet that is visibly healthy | almost always a sandboxed Bash call — the tmux socket and the session registry both sit outside the sandbox. Re-run with the sandbox disabled. |
| the name is absent from `--list` | the pane lost its name, or the orchestrator relayed and the successor has not claimed it yet. Tell the human; do not substitute a near-miss name. |
| two rows answer to the same name | a relay overlap. The transport resolves to whichever claimed it most recently — the successor. Nothing to do. |

Exit codes in full: `../send-tmux-message/SKILL.md`.

## Why a report does not end you

REPORT→WORK is the loop discovery is made of. The human reads the report, learns
something, and sends you back in with a corrected mandate while you keep everything you
already established — which is precisely what a sub-agent structurally cannot do, its
only output being its final report. Re-summarising the report for the human, starting
the next obvious piece of work, or announcing that you are waiting all break the same
property: silence is what makes the state readable.
