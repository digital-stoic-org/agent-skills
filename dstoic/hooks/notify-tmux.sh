#!/bin/bash

# Know when the agent needs you vs working autonomously
# Context-aware tmux notification with double emoji prefixes (🤖 + status)
# States: IDLE (no emoji) | ACTIVE (🤖X) | ALERT (🤖🚨) | COMPLETED (🤖✅)
# See: ./notify-tmux--state-machine.md

TARGET="${TMUX_PANE:-}"
[[ -z "$TARGET" ]] && exit 0

# Parse event name from CLI arg (if provided) or stdin JSON
EVENT_NAME="${1:-}"

# Parse tool name from stdin JSON
INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""' 2>/dev/null)

# Use CLI event name if provided (for SessionEnd, AskUserQuestion, etc.)
[[ -n "$EVENT_NAME" ]] && TOOL="$EVENT_NAME"

# For PreToolUse without a tool_name in JSON, try to get it from the event data
if [[ "$TOOL" == "PreToolUse" ]]; then
    ACTUAL_TOOL=$(echo "$INPUT" | jq -r '.tool // .name // ""' 2>/dev/null)
    [[ -n "$ACTUAL_TOOL" ]] && TOOL="$ACTUAL_TOOL"
fi



CURRENT=$(tmux display-message -t "$TARGET" -p '#{window_name}')

# Strip existing emoji prefix if present, store original for reset
# Remove robot emoji (🤖) and any status emoji with variation selectors
if [[ "$CURRENT" =~ ^🤖 ]]; then
    # Strip robot + all non-alphanumeric chars (emoji + variation selectors)
    ORIGINAL=$(echo "$CURRENT" | sed 's/^🤖//; s/^[^a-zA-Z0-9_-]*//')
else
    ORIGINAL="$CURRENT"
fi

# Fallback if ORIGINAL is empty (shouldn't happen, but safety net)
[[ -z "$ORIGINAL" ]] && ORIGINAL="bash"

# SessionStart event: Claude starting → show idle state (just robot)
if [[ "$TOOL" == "SessionStart" ]]; then
    # Show just robot emoji since you have focus at session start
    tmux rename-window -t "$TARGET" "🤖$ORIGINAL"
    exit 0
fi

# SessionEnd event: Claude exiting → remove all emojis
if [[ "$TOOL" == "SessionEnd" ]]; then
    # Clear agent state
    tmux set-option -t "$TARGET" -u @agent_running 2>/dev/null
    tmux set-option -t "$TARGET" -u @last_completed_time 2>/dev/null

    # Clear focus-in hook
    tmux set-hook -t "$TARGET" -uw pane-focus-in 2>/dev/null

    # Remove all emojis and restore original window name
    tmux rename-window -t "$TARGET" "$ORIGINAL"
    exit 0
fi

# Stop event: Claude finished responding → check if Task agent still running
if [[ -z "$TOOL" ]]; then
    AGENT_RUNNING=$(tmux show-option -t "$TARGET" -v @agent_running 2>/dev/null)
    if [[ "$AGENT_RUNNING" == "true" ]]; then
        # Task agent spawned, keep working state
        tmux rename-window -t "$TARGET" "🤖⚙️$ORIGINAL"
    else
        # Normal completion: check if pane has focus
        ACTIVE_PANE=$(tmux display-message -p '#{pane_id}')
        if [[ "$TARGET" == "$ACTIVE_PANE" ]]; then
            # Focused: show just robot emoji (no green mark when you have focus)
            tmux rename-window -t "$TARGET" "🤖$ORIGINAL"
        else
            # Unfocused: show robot + green checkmark (completed)
            tmux rename-window -t "$TARGET" "🤖✅$ORIGINAL"
            # Set focus-in hook to remove green mark when user refocuses
            tmux set-hook -t "$TARGET" -w pane-focus-in "rename-window '🤖$ORIGINAL'; set-hook -uw pane-focus-in"
        fi
    fi
    exit 0
fi

# Robot emoji base - always present to identify Claude sessions
BASE="🤖"

# Map tool to status emoji (double emoji system: 🤖 + status)
case "$TOOL" in
    PreToolUse)               SUFFIX="💭" ;;  # Thinking/ongoing (default for tools)
    AskUserQuestion)          SUFFIX="🚨" ;;  # ACTION REQUIRED
    PermissionRequest)        SUFFIX="🚨" ;;  # ACTION REQUIRED
    Edit|Write|NotebookEdit)  SUFFIX="✏️" ;;
    Bash)                     SUFFIX="🧪" ;;
    Read|Grep|Glob)           SUFFIX="🔍" ;;
    Task)                     SUFFIX="⚙️" ;;
    WebSearch|WebFetch)       SUFFIX="🌐" ;;
    TodoWrite)                SUFFIX="📝" ;;
    Skill)                    SUFFIX="🎯" ;;
    SlashCommand)             SUFFIX="⚡" ;;
    TaskOutput)               SUFFIX="📤" ;;
    *)                        SUFFIX="💭" ;;  # Thinking (default for ongoing tasks)
esac

EMOJI="${BASE}${SUFFIX}"

# Track Task agent state (persists even if other tools fire)
if [[ "$TOOL" == "Task" ]]; then
    tmux set-option -t "$TARGET" @agent_running "true"
fi

# Clear agent state when checking/retrieving output
if [[ "$TOOL" == "TaskOutput" ]]; then
    tmux set-option -t "$TARGET" -u @agent_running
fi

# DO NOT set focus-in hook for PreToolUse - we want thinking emoji to persist
# Focus-in hook is only set after task completion (in Stop event)

# Always show thinking emoji, PreToolUse, AskUserQuestion, and PermissionRequest (alerts)
# Skip other emojis when focused
ACTIVE_PANE=$(tmux display-message -p '#{pane_id}')
if [[ "$TARGET" == "$ACTIVE_PANE" ]] && [[ "$TOOL" != "AskUserQuestion" ]] && [[ "$TOOL" != "PermissionRequest" ]] && [[ "$TOOL" != "PreToolUse" ]] && [[ "$SUFFIX" != "💭" ]] && [[ "$SUFFIX" != "🚨" ]]; then
    exit 0
fi

# Update window name with new emoji
tmux rename-window -t "$TARGET" "${EMOJI}${ORIGINAL}"
