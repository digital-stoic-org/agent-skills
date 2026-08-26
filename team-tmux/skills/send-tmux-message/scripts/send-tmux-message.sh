#!/usr/bin/env bash
# send-tmux-message.sh — deliver one message into another named agent's tmux pane.
#
# Payload arrives on stdin, never in argv: a single argv entry is capped at
# MAX_ARG_STRLEN (131072 bytes on Linux) regardless of ARG_MAX, and a multiline
# payload sent with send-keys is delivered as raw newline bytes, each of which the
# Claude Code TUI reads as Enter — a 9-line RELAY PACKET would submit as 9 turns.
# load-buffer reads a file, paste-buffer -p delivers one bracketed-paste block.
#
# It pastes, then submits: the payload becomes a turn in the target without a
# keystroke. There is no option not to — a delivery that sits unsubmitted in
# someone's input box is a delivery that silently did not happen.

set -uo pipefail

REGISTRY="${CLAUDE_SESSIONS_DIR:-$HOME/.claude/sessions}"
SPOOL="${FLEET_SPOOL:-$HOME/.claude/fleet}"

die() { printf 'send-tmux-message: %s\n' "$2" >&2; exit "$1"; }

usage() {
  cat >&2 <<'USAGE'
Usage:
  send-tmux-message.sh <agent-name> [--from NAME] [--archive PATH] [--no-spool]
      Payload is read from stdin, pasted into the target's pane and submitted.

  Run it with the sandbox disabled. The tmux server socket and the session
  registry both sit outside a sandboxed Bash call, and the failure surfaces as
  exit 6 on a fleet that is perfectly healthy.

  send-tmux-message.sh --list
      Live named interactive sessions and their panes.

Options:
  --from NAME     Prepend one attribution line, so the target can tell a fleet
                  message from something the human typed.
  --archive PATH  Durable copy of the payload. Use it for a RELAY PACKET, which
                  the sender cannot reproduce once it has left.
  --no-spool      Skip the replay copy at $FLEET_SPOOL/<name>.last.msg.

Exit codes: 0 delivered · 2 usage · 3 unknown or dead name · 4 self-send
            5 empty payload · 6 tmux failure
USAGE
  exit 2
}

# --- registry -----------------------------------------------------------------
# One JSON per live session, written by the harness. Only *.json is ever read;
# the sibling *.key files are secrets and are never touched.

registry_py() {
  python3 - "$REGISTRY" "$@" <<'PY'
import json, glob, os, sys

reg = sys.argv[1]
mode = sys.argv[2]
want = sys.argv[3] if len(sys.argv) > 3 else None

def alive(pid):
    if not pid:
        return False
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True          # exists, owned by someone else
    except Exception:
        return False
    return True

rows = []
for p in glob.glob(os.path.join(reg, '*.json')):
    try:
        d = json.load(open(p))
    except Exception:
        continue
    if d.get('kind') != 'interactive' or not d.get('tmux') or not d.get('name'):
        continue
    if not alive(d.get('pid')):
        continue
    rows.append(d)

if mode == 'list':
    for d in sorted(rows, key=lambda x: x.get('name') or ''):
        print('%-24s %-8s %-22s %s' % (d['name'], d.get('status', '?'), d['tmux'], d.get('cwd', '')))
    sys.exit(0)

# resolve: exact name, newest claimant wins.
# During a relay the origin and its successor hold the same name at once; the
# successor adopted it later, so nameSince orders them the way relay expects.
best = None
for d in rows:
    if d['name'] != want:
        continue
    k = d.get('nameSince') or d.get('startedAt') or 0
    if best is None or k > best[0]:
        best = (k, d)

if best is None:
    sys.exit(1)
d = best[1]
print('\t'.join([d['tmux'], str(d.get('status', '?')), str(d['pid'])]))
PY
}

# Print the live names, or say the registry is empty — an empty list under
# "Available names:" reads like a broken script rather than an empty fleet.
list_names() {
  local out
  out="$(registry_py list)" || return 1
  if [ -n "$out" ]; then
    printf '%s\n' "$out"
  else
    printf '(no live named session in %s)\n' "$REGISTRY"
  fi
}

# --- args ---------------------------------------------------------------------

[ $# -ge 1 ] || usage
case "$1" in -h|--help) usage ;; esac

if [ "$1" = "--list" ]; then
  command -v python3 >/dev/null || die 6 "python3 not found"
  list_names || die 6 "could not read the session registry: $REGISTRY"
  exit 0
fi

TARGET="$1"; shift
FROM=""; ARCHIVE=""; SPOOL_ON=1
while [ $# -gt 0 ]; do
  case "$1" in
    --from)    [ $# -ge 2 ] || usage; FROM="$2"; shift 2 ;;
    --archive) [ $# -ge 2 ] || usage; ARCHIVE="$2"; shift 2 ;;
    --no-spool) SPOOL_ON=0; shift ;;
    *) usage ;;
  esac
done

command -v tmux    >/dev/null || die 6 "tmux not found"
command -v python3 >/dev/null || die 6 "python3 not found"

# An agent name is resolved verbatim against the registry, but it also lands in
# two filenames. Sanitise the filename rather than rejecting the name: a name
# the harness accepted must stay addressable, and a "/" in it must not silently
# turn "could not read stdin" into the error for an unwritable directory.
SAFE="${TARGET//[^A-Za-z0-9._-]/_}"
[ -n "$SAFE" ] || SAFE="target"

# --- resolve ------------------------------------------------------------------

row="$(registry_py resolve "$TARGET")" || {
  printf 'send-tmux-message: no live session named "%s".\n\nAvailable names:\n' "$TARGET" >&2
  list_names >&2 || true
  exit 3
}
IFS=$'\t' read -r PANE STATUS PID <<<"$row"

# Probe with list-panes, never display-message: `display-message -p -t <gone>`
# prints "can't find pane" and still exits 0 (tmux 3.4), so it cannot be tested
# and a vanished pane would only surface later as a paste-buffer failure — exit
# 6 where the caller was promised exit 3.
if ! tmux list-panes -t "$PANE" >/dev/null 2>&1; then
  # Tell a vanished pane apart from an unreachable server: one is exit 3 and the
  # caller stops on a dead name, the other is exit 6 and nothing about the fleet
  # is wrong.
  tmux list-sessions >/dev/null 2>&1 || die 6 "tmux server not reachable"
  die 3 "\"$TARGET\" is in the registry (pid $PID) but its pane $PANE is gone"
fi

if [ -n "${TMUX_PANE:-}" ]; then
  # TMUX_PANE is already a %id; the target may be session:win.pane, so only that
  # side needs resolving. Never compare through a lookup that can fail silently
  # and leave the self-send guard skipped.
  tgt="$(tmux display-message -p -t "$PANE" '#{pane_id}' 2>/dev/null || true)"
  if [ -n "$tgt" ] && [ "$TMUX_PANE" = "$tgt" ]; then
    die 4 "refusing to send to self (\"$TARGET\" is this pane)"
  fi
fi

# --- payload ------------------------------------------------------------------

# stdin on a terminal means no heredoc was attached. Reading it would hang the
# calling pane instead of returning, so refuse the way an empty payload does.
[ -t 0 ] && die 5 "no payload on stdin - nothing was sent"

umask 077
mkdir -p "$SPOOL" || die 6 "spool not writable: $SPOOL"
TMPF="$SPOOL/.$$.$SAFE.tmp"
CLEAN_BUF=0
trap 'rm -f "$TMPF" "$TMPF.h"; [ "$CLEAN_BUF" = 1 ] && tmux delete-buffer -b "${BUF:-}" 2>/dev/null; :' EXIT

cat > "$TMPF" || die 6 "could not read stdin"

# stat by argument, never `wc -c < f`: under a sandbox the redirection silently returns 0
SZ="$(stat -c %s "$TMPF" 2>/dev/null || wc -c "$TMPF" | awk '{print $1}')"
[ "${SZ:-0}" -gt 0 ] || die 5 "empty payload on stdin - nothing was sent"

if [ -n "$FROM" ]; then
  { printf -- '--- fleet message from %s ---\n' "$FROM"; cat "$TMPF"; } > "$TMPF.h" \
    || die 6 "could not prepend the --from line"
  mv "$TMPF.h" "$TMPF" || die 6 "could not prepend the --from line"
  SZ="$(stat -c %s "$TMPF" 2>/dev/null || wc -c "$TMPF" | awk '{print $1}')"
fi

[ "$SPOOL_ON" = 1 ] && { cp "$TMPF" "$SPOOL/$SAFE.last.msg" || die 6 "could not write the spool copy"; }
if [ -n "$ARCHIVE" ]; then
  mkdir -p "$(dirname "$ARCHIVE")" || die 6 "archive directory not writable"
  cp "$TMPF" "$ARCHIVE" || die 6 "could not write archive: $ARCHIVE"
fi

# --- deliver ------------------------------------------------------------------

BUF="fleet-$$"
tmux load-buffer -b "$BUF" "$TMPF" || die 6 "load-buffer failed"
CLEAN_BUF=1                                  # the trap reclaims it if we die here
tmux paste-buffer -d -p -b "$BUF" -t "$PANE" || die 6 "paste-buffer failed to $PANE"
CLEAN_BUF=0                                  # -d already consumed the buffer

# Enter must be a separate call: a keystroke sent alongside the text arrives
# before the line is composed.
sleep 1
tmux send-keys -t "$PANE" Enter || die 6 "send-keys Enter failed to $PANE"

printf 'delivered -> %s (pane %s, status %s, %s bytes): submitted\n' \
  "$TARGET" "$PANE" "$STATUS" "$SZ"
