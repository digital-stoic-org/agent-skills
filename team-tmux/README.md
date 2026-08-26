# team-tmux

The `team` coordination protocol, carried entirely over tmux.

Same fleet, same contract, same skill names: one terminal window per agent, one orchestrator, any number of fleet agents that may themselves spawn sub-agents, built for discovery work where the scope moves as the work proceeds, and protecting the human's attention rather than the context window. What differs is the tube. `team` assumes Agent Teams and `SendMessage`; this plugin assumes neither, and every machine arrow is hard-wired to `send-tmux-message`, which resolves a name against the harness's session registry and pastes into that agent's pane. Nothing here checks for a native transport and nothing falls back to one.

That makes it the plugin to enable on **Bedrock and other third-party providers**, where `SendMessage` does not exist.

> **Enable `team` or `team-tmux`, never both.** They carry the same five skill names on purpose, so the same commands work on either transport and switching provider is a matter of switching plugin. Two enabled at once gives you two `/brief` and two `/relay` in the list, which is the one thing that symmetry costs.

## Skills

| Skill | Runs when | Purpose |
|---|---|---|
| `/ready` | A window is opened before its work has arrived | Pre-warms the window: reads the protocol, **confirms this pane is named and therefore reachable**, prints the four standing role lines verbatim, announces READY, goes silent. |
| `/plan-fleet` | Before spawning agents, at the start of a session | Writes the session's one steering artifact — who owns what, the open questions, the settled gates — **against the panes that are actually live**, so no row names an agent that cannot be reached. |
| `/brief` | Delegating one unit of work to one named agent | Picks a model for the delegate, reads its own name back out of the registry for the `orchestrator` field, fills one mandate, delivers it into the target's pane. Then silence. |
| `/report` | A stop condition or a cadence checkpoint fires | Fills one REPORT and delivers it to the `orchestrator` named in the mandate, then waits for the redirect. **This skill does not exist in `team`**, where `SendMessage` is already in the agent's hands; here the arrow needs a carrier. |
| `/relay` | An agent nears roughly 70% context | Hands that agent's state to a fresh one under the same name, in place of compaction. Checks the successor is up **before** writing the packet, and archives it on the way out. |
| `/send-tmux-message` | The transport itself, and `--list` | Carries one packet into a named pane and submits it, so it becomes a turn there without a keystroke. The other skills call its script directly; you invoke it for a manual send or to see the fleet. |

## The contract lives in one file

`references/protocol.md` holds the whole thing — the fleet-agent and orchestrator state diagrams, the emission table, the MANDATE, REPORT and RELAY PACKET templates, the ownership rules that decide who may write where. The six skills cite it rather than restate it, because a contract copied into six places drifts silently while one that lives in exactly one place cannot.

It is a fork of `team/references/protocol.md` and is meant to stay a readable one: states, emissions, templates and ownership are word-for-word identical, and the diff between the two files is the **Transport** and **Addressability** sections plus the REPORT template. Keep it that way when you edit either.

## What the tmux transport changes, and what it does not

Three arrows travel by machine — BRIEF→READY, REPORT→WATCH, RELAY→successor — and no others. A question and a readback are addressed to the human, printed in the agent's own window, and have no machine path at all; an arbitration comes back the same way, typed by the human into that agent's pane. That is unchanged from `team`, and it is what closes ping-pong: an agent holds no roster of its peers, so it cannot start a loop with one.

What the transport does add is a failure mode. **A name is an address here, not a label.** A window with no name is in no registry, so it can receive no mandate, deliver no report and hand off to no successor — while looking perfectly healthy from the inside. Four of the six skills consult `--list` for exactly that reason, at the four moments where the check is still cheap: at pre-warm, when the partition is written, before a mandate goes out, and before a relay.

## Two things that bite

**Run every call with the sandbox disabled**, `--list` included. The tmux server socket and the session registry both sit outside a sandboxed Bash call, so a sandboxed run fails on a fleet that is perfectly healthy — and it fails as exit 6, which reads like a broken tmux rather than a wrong call.

**A non-zero exit is a tool failure, not a state transition.** Say so to the human in plain text and stop. Never retry in a loop, never try a neighbouring name: a silent retry against a dead name is how a fleet quietly loses a whole branch of work, and a near-miss name drops the packet into someone else's window.
