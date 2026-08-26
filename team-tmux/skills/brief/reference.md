# Brief — field guidance and reasoning

`SKILL.md` carries the procedure. This file carries what a model gets wrong while executing it. The MANDATE template itself, with a one-line gloss per field, is in `../../references/protocol.md`.

## The five fields that need care

- **`owned_paths` and `hands_off`** — copied from that agent's row in the fleet plan, and only its row. Never another agent's entries, never a roster of peers. During discovery the cast changes, so a roster frozen into a mandate goes stale in silence; and an agent that does not know its peers cannot address one, which is what keeps questions flowing to the human.
- **`stop_conditions`** — always includes "you discover the scope is wrong".
- **`cadence`** — the agent reports and keeps going by default, and stops to wait only before something irreversible. The criterion is **reversibility**, not milestones and not elapsed time: work that can be redone costs only tokens, whereas a write that lands or an external call that fires cannot be taken back. Name the specific points of no return where the agent must stop and wait; everywhere else the human redirects asynchronously. An agent that halts at every milestone turns the human into the bottleneck, and their attention is the resource this protocol exists to protect.
- **`what_i_do_not_know`** — mandatory, never left empty. A mandate that hides its own gaps gets filled in by plausibility at the other end.
- **`orchestrator`** — your own name as step 3 read it off `--list`, and the delegate's **only** machine address: it is what lets that agent deposit its report into your window through `team-tmux:report`. Naming it opens no roster, because the orchestrator was already that agent's single authorised recipient; questions and readbacks are unaffected and still go to the human, printed in the agent's own window. Leave it out and the delegate has no path for the one arrow it is allowed to send by machine.

## Why the checks come before the writing

Checking the target against `--list` costs one call; a mandate delivered to a name the registry does not hold fails on exit 3, and everything you were about to write is wasted.

Reading your own name rather than recalling it costs nothing and covers the one case that is silent from the inside: a window that carries no name, or a different one, is invisible to the transport while looking perfectly healthy.

## Why no retry, and no neighbouring name

A silent retry against a dead name is how a fleet quietly loses a whole branch of work — nothing surfaces, and the human learns of it when the report never arrives. A near-miss name is worse: the mandate lands in someone else's window, where it reads as a legitimate turn.

Both failures are indistinguishable from success at the sending end, which is why the rule is a hard stop and a plain-text line to the human rather than a judgement call.
