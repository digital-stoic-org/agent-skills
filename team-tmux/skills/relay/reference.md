# Relay — why the gates are shaped this way

Background for `SKILL.md`. The contract itself (states, RELAY PACKET template, field semantics, addressability) lives in `../../references/protocol.md`; this file only holds the reasoning the hot path cites.

## Why gate 2 is the unrepairable one

Until the human has opened a fresh window and named it with your name, there is nobody to receive the packet. This is the one delivery in the plugin whose failure cannot be repaired:

| Emission | If it fails |
|---|---|
| MANDATE | refill it from the fleet plan |
| REPORT | reprint it — you are still alive |
| **RELAY PACKET** | **nothing to refill it from — you leave right after sending it** |

Your state at ~70% context exists in one place: your own session, which is about to end. That is why `--list` runs *before* the packet is written rather than after, and why "send it somewhere safe" and "compact instead" are both wrong answers to a missing successor. Compaction is precisely the outcome this state exists to avoid.

## Why relay beats compaction

Three counts:

1. **Authorship** — the packet is written by the agent that actually knows what mattered, not by a summariser working from a transcript.
2. **No cache break** — the successor starts on a clean prompt prefix.
3. **The overlap is a repair channel** — the origin stays alive and answerable, which a compacted session never is.

It needs no artifact on disk either: the packet lands in the successor's transcript. `--archive` is a safety copy against a failed send, not the delivery mechanism.

## Who may relay

Any window. An orchestrator in FRAME is a peer here, not an exception — see the RELAY states on both sides of the diagram in `../../references/protocol.md`.
