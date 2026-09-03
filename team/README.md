# team

Coordinates a fleet of named Claude Code agents working in parallel under one human: one window per agent, one orchestrator, and any number of fleet agents that may themselves spawn sub-agents. It is built for discovery work, where the scope moves as the work proceeds, and it protects the human's attention rather than the context window. The whole design rests on a small, fixed set of states and a strict rule about when an agent is allowed to speak at all.

The contract itself — the fleet-agent and orchestrator state diagrams, the emission table, the MANDATE, REPORT and RELAY PACKET templates, and the ownership rules that decide who may write where — lives in a single file, `references/protocol.md`.

Agent Teams is assumed enabled and `SendMessage` is the only transport. Three arrows travel by machine and no others: a mandate to a delegate, a report back to the orchestrator, a relay packet to a successor. Questions and readbacks have no machine path at all — they are printed for the human in the agent's own window, because an agent that cannot address a peer is what keeps every arbitration flowing through the person running the fleet.

## Skills

| Skill | Runs when | Purpose |
|---|---|---|
| `/brief` | Delegating one unit of work to one named agent | Fills a single mandate and sends it. One mandate, one target, then silence until a question or a report comes back. |
| `/report` | A stop condition or a cadence checkpoint fires | Sends one structured report to the orchestrator named in the mandate — every fact paired with the command that proves it — then goes back to waiting. |
| `/relay` | An agent nears roughly 70% context | Hands that agent's state to a fresh one under the same name, in place of compaction, so the successor starts on a clean prefix without losing what was already learned. |

Three skills, one per machine arrow. There is nothing to run before the work arrives: a window that has never seen this plugin can receive a mandate and behave correctly, because the mandate carries its own contract.

## Where the reading happens

Nowhere, at runtime. No skill loads `references/protocol.md` while a fleet is working. Whatever a delegate must know travels inside the packet it receives — the five role lines ride verbatim in every mandate, and the `owned_paths` and `hands_off` lines carry the default-deny rule with them rather than pointing at it. The protocol file is there for whoever amends the contract.

That is why the MANDATE, RELAY PACKET and REPORT skeletons are mirrored verbatim inside the three skills. Each one runs in a window with no context to spare — an orchestrator halfway through a session, an agent that just hit 70%, an agent that has been working for hours — so each reads nothing, runs no sub-skill, and consults no file. One `SendMessage`, and that is the whole call.

`/brief` in particular chooses no model. The delegate is a live agent in a window that already exists, and its model was fixed when that window was opened — a mandate cannot change it.

The cost of that arrangement is one duplication, guarded by a note in `references/protocol.md`: change a field name there and change it in the mirroring skill in the same edit.

## Why a fleet rather than sub-agents

A fleet agent is interruptible and redirectable in flight; a sub-agent is not, its only output being its final report. `REPORT → WORK`, the redirect, is the loop that makes discovery possible: the human reads a report, learns something, and sends the agent back in with a corrected mandate while it keeps everything it already established. That is the thing this protocol exists to protect.
