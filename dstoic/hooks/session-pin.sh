#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Session Pin Hook: Inject pin board into model context
# ==============================================================================
# Events: PreToolUse (inject systemMessage), PreCompact (same),
#          SessionStart (hybrid reset: clear approved/pending, keep rest)
# Input: JSON on stdin (from Claude Code hooks)
# ==============================================================================

INPUT=$(cat)
EVENT="${1:-}"

# --- Derive pins file path from CWD ---
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')
[ -n "$CWD" ] || exit 0

GIT_ROOT=$(git -C "$CWD" rev-parse --show-toplevel 2>/dev/null) || exit 0
REL_PATH="${CWD#$GIT_ROOT/}"
# If CWD == GIT_ROOT, REL_PATH equals CWD (no strip happened)
[ "$REL_PATH" != "$CWD" ] || REL_PATH="root"
SLUG=$(echo "$REL_PATH" | tr '/' '-')
PINS_FILE="${PRAXIS_DIR:?PRAXIS_DIR not set}/.session-logs/$SLUG/pins.json"

case "$EVENT" in
  PreToolUse|PreCompact)
    # Early exit if no pins
    [ -f "$PINS_FILE" ] || exit 0
    ITEMS=$(jq -r '.items | length' "$PINS_FILE" 2>/dev/null) || exit 0
    [ "$ITEMS" -gt 0 ] || exit 0

    # Count by type
    COUNTS=$(jq -r '
      .items | group_by(.type) | map("\(.[0].emoji):\(length)") | join(" ")
    ' "$PINS_FILE")

    # Render board lines
    BOARD=$(jq -r '
      "[pin-board] " + (
        .items | group_by(.type) | map("\(.[0].emoji):\(length)") | join(" ")
      ) + "\n" + (
        .items | sort_by(.id) | map(
          "\(.id). \(.emoji) \(.content)" +
          (if .detail != "" and .detail != null then " (\(.detail))" else "" end)
        ) | join("\n")
      )
    ' "$PINS_FILE")

    # Emit systemMessage (PreToolUse only)
    if [ "$EVENT" = "PreToolUse" ]; then
      jq -n --arg msg "$BOARD" '{
        "hookSpecificOutput": {
          "hookEventName": "PreToolUse",
          "permissionDecision": "allow",
          "permissionDecisionReason": "session-pin"
        },
        "systemMessage": $msg
      }'
    fi
    ;;

  SessionStart)
    # Hybrid reset: keep scope/killed/correction, clear approved/pending
    [ -f "$PINS_FILE" ] || exit 0
    jq '.items |= map(select(.type == "killed" or .type == "scope" or .type == "correction"))' \
      "$PINS_FILE" > "${PINS_FILE}.tmp" && mv "${PINS_FILE}.tmp" "$PINS_FILE"
    ;;
esac
