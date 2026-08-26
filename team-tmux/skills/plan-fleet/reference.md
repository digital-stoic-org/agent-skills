# plan-fleet — the reasoning behind the rules

The directives are in `SKILL.md`; this file is why they are what they are. Read it when a
rule is being argued, corrected, or applied to a case it does not obviously cover. Every
rule about *ownership itself* lives in `../../references/protocol.md` — that file is the
contract, this one only explains this skill's use of it.

## Why the partition is the one decision that cannot wait

Everything else in discovery can be deferred and corrected in flight. A write collision
cannot: two agents writing one path lose updates with no error at all, so nothing records
what was overwritten and the damage is silent and unrepairable. Default deny, exclusively
owned subtrees, and `hands_off` as a reminder rather than the boundary are all stated
under **Ownership** in `../../references/protocol.md`. Read them there and apply them; do
not restate them in the plan you write.

## Why the plan carries no lots

The shape in `SKILL.md` is a shape, not a form to fill. In particular the plan does not
decompose the work into lots or deliverables. This is discovery: the lots are not knowable
in advance, and a plan that pretends otherwise goes stale the moment the scope moves —
which it will.

## Why the partition never leaves this file

A mandate carries that agent's **own** `owned_paths` and `hands_off` — never the other
agents' entries, never a roster of peers. During discovery the cast changes, so a roster
frozen into a mandate goes stale in silence; and an agent that does not know its peers
cannot address one, which is what keeps questions flowing to the human and keeps ping-pong
closed. The protocol states the same property from the other end, under **A question is
always addressed to the human**. You hold the whole picture in this file. Each agent holds
only its own row.

## Why the file is alive, and why it is in everyone's `hands_off`

Agents appear, finish, get redirected, get relayed; you edit the partition as that happens,
and you are its only writer. Because it is shared and high-traffic it belongs in every
agent's `hands_off` — it is the clearest example of what that field is for.

## Why a relay changes nothing in it

The successor takes over the origin's name, and a name designates a scope rather than a
memory (`../../references/protocol.md`, **Relay**), so the row stays valid and correct as
written. Rewriting it would be the mistake.

## Why the live names are read first

On this transport a name is an address. An agent whose window carries no name is invisible
to the registry the transport reads while looking perfectly healthy from the inside, so a
partition row naming a pane that does not exist is a branch of the work that will never
start — and nothing about writing it down will say so. `--list` must run with the sandbox
disabled: the tmux server socket and the session registry both sit outside a sandboxed Bash
call, and a sandboxed run fails as exit 6 on a fleet that is perfectly healthy. See
**Addressability** in `../../references/protocol.md`, which lists all four points at which
the registry is consulted.
