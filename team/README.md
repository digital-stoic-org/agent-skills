# team

Coordinates a fleet of named Claude Code agents working in parallel under one human: one terminal window per agent, one orchestrator, and any number of fleet agents that may themselves spawn sub-agents. It is built for discovery work, where the scope moves as the work proceeds, and it protects the human's attention rather than the context window. The whole design rests on a small, fixed set of states and a strict rule about when an agent is allowed to speak at all.

The contract itself — the fleet-agent and orchestrator state diagrams, the emission table, the MANDATE and RELAY PACKET templates, and the ownership rules that decide who may write where — lives in a single file, `references/protocol.md`. The four skills below all cite that file rather than restate it, because a contract copied into four places drifts silently while one that lives in exactly one place cannot.

## Skills

| Skill | Runs when | Purpose |
|---|---|---|
| `/ready` | A window is opened before its work has arrived | Pre-warms the window: it reads the protocol, prints the four standing role lines verbatim, and announces its READY state before going silent to wait. |
| `/plan-fleet` | Before spawning agents, at the start of a session | Writes the session's one steering artifact — the partition of who owns what, the open questions, and the gates the human has already settled — and nothing else. |
| `/brief` | Delegating one unit of work to one named agent | Picks a model for the delegate, fills a single mandate from that agent's row in the plan, and sends it. One mandate, one target, then silence until a question or a report comes back. |
| `/relay` | An agent nears roughly 70% context | Hands that agent's state to a fresh one under the same name, in place of compaction, so the successor starts on a clean prefix without losing what was already learned. |
| `/send-tmux-message` | A fleet runs where `SendMessage` does not exist | Carries one packet — a mandate, a relay packet, or a report going back to the orchestrator — into another named agent's tmux pane and stops there: it pastes without submitting, so nothing becomes a turn until the human presses Enter. Transport only — what may be sent stays in the protocol. |

Agent Teams is the assumed transport, and `/ready`, `/plan-fleet`, `/brief` and `/relay` rely on it rather than checking for it or setting it up. Where it is unavailable — Bedrock, other third-party providers — `/send-tmux-message` substitutes for it without changing the protocol: `/brief` and `/relay` deliver their packets through it, and a fleet agent in REPORT may use it to deposit its report in the orchestrator's window, where it waits for the human's keystroke like anything else pasted. Questions and readbacks get no machine path under either transport. They are printed for the human in the agent's own window, because an agent that cannot address a peer is what keeps every arbitration flowing through the person running the fleet.
