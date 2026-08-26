# send-tmux-message — background

Why the transport behaves as it does. `SKILL.md` holds the invocation, `--list`,
and the exit-code table; this file holds the reasoning behind the rules it states.

## Why not `send-keys` for the payload

Both failures are measured, not theoretical.

A multiline payload sent through `send-keys` is delivered as raw newline bytes, and
the TUI reads each one as Enter — a seven-line MANDATE submits as seven turns, the
first six being fragments of YAML. And a single argv entry is capped at 131072 bytes
on Linux whatever `ARG_MAX` says, so a large packet fails outright with `E2BIG`.

`load-buffer` reads a file and `paste-buffer -d -p` delivers one bracketed-paste
block, which is why the script does that instead.

## Why `--archive` is for a relay packet, not a mandate and not a report

Every send leaves a replay copy at `$FLEET_SPOOL/<name>.last.msg` (default
`~/.claude/fleet/`), overwritten by the next send to that name. That is enough for a
mandate, which you can refill from the fleet plan, and enough for a report, which the
sender still holds. A relay packet cannot be refilled — it is one agent's state at
~70% context, and that agent leaves — so pass `--archive` for it, and pass it before
you send rather than after you wish you had.

## Why the delivery submits, with no opt-out

The keystroke goes in a separate call about a second later: sent alongside the text it
arrives before the line is composed. The receiving agent then takes its turn on its
own, with no one pressing Enter.

A packet left sitting unsubmitted is a packet that silently did not arrive: the sender
reads exit 0, the fleet plan says the branch is briefed, and nothing is running. Worse,
that text is then flushed by whatever Enter comes next in that pane, which may be the
human submitting something else entirely and dragging a stale mandate along with it.

What keeps the fleet from talking itself into a spiral is not the keystroke. It is the
protocol: three arrows travel by machine and no others, there is no peer roster to
answer, and a question or a readback is printed for the human in the agent's own window
rather than sent anywhere. An agent that cannot address a peer cannot start a loop with
one, whether or not its deliveries submit.

## Why a relay overlap resolves to the newest claimant

Through a relay overlap two live sessions answer to one name, because the successor
adopts the origin's while the origin is still alive. The script resolves to whichever
claimed the name most recently, which is the successor — the same rule the rest of the
fleet's address book already assumes. The origin stays reachable in its own pane, which
is what makes the overlap the repair channel `../../references/protocol.md` describes.

## Why a name is an address

An agent whose window carries no name is not in the registry the transport reads: it
receives no mandate, delivers no report, hands off to no successor, and looks perfectly
healthy from the inside. Four skills consult `--list` rather than assume — the four
points are listed under Addressability in `../../references/protocol.md`.
