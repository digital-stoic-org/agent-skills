#!/bin/bash

# Know when the agent needs you vs working autonomously
# Context-aware tmux notification with double emoji prefixes (🤖 + status)
# States: IDLE (no emoji) | ACTIVE (🤖X) | ALERT (🤖🚨) | COMPLETED (🤖✅)
# See: ./notify-tmux--state-machine.md

# Portability gate: silently no-op unless dstoic telemetry is opted-in.
# Requires BOTH: DSTOIC_HOOKS_ENABLED=1 AND PRAXIS_DIR set.
{ [ "${DSTOIC_HOOKS_ENABLED:-0}" = "1" ] && [ -n "${PRAXIS_DIR:-}" ]; } || exit 0

# Require tmux CLI (not just TMUX_PANE env) — macOS/containers may lack it
command -v tmux >/dev/null 2>&1 || exit 0

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

# --- Source of truth: @cc_base_name tmux user-option ---
ORIGINAL=$(tmux show-option -t "$TARGET" -qv @cc_base_name 2>/dev/null)

# SessionStart: capture true name, pin automatic-rename off, show idle
if [[ "$TOOL" == "SessionStart" ]]; then
    CURRENT=$(tmux display-message -t "$TARGET" -p '#{window_name}')
    [[ -z "$CURRENT" ]] && CURRENT="bash"

    tmux set-option -t "$TARGET" @cc_base_name "$CURRENT"

    # Save current automatic-rename value and disable it for this window
    OLD_AUTO=$(tmux show-option -t "$TARGET" -wqv automatic-rename 2>/dev/null)
    if [[ -n "$OLD_AUTO" ]]; then
        tmux set-option -t "$TARGET" @cc_saved_auto_rename "$OLD_AUTO"
    else
        tmux set-option -t "$TARGET" @cc_saved_auto_rename "__inherited__"
    fi
    tmux set-option -t "$TARGET" -w automatic-rename off

    tmux rename-window -t "$TARGET" "🤖$CURRENT"
    exit 0
fi

# SessionEnd: restore original name + automatic-rename, clean up
if [[ "$TOOL" == "SessionEnd" ]]; then
    [[ -z "$ORIGINAL" ]] && ORIGINAL="bash"
    tmux rename-window -t "$TARGET" "$ORIGINAL"

    SAVED_AUTO=$(tmux show-option -t "$TARGET" -qv @cc_saved_auto_rename 2>/dev/null)
    if [[ "$SAVED_AUTO" == "__inherited__" ]]; then
        tmux set-option -t "$TARGET" -wu automatic-rename 2>/dev/null
    elif [[ -n "$SAVED_AUTO" ]]; then
        tmux set-option -t "$TARGET" -w automatic-rename "$SAVED_AUTO"
    fi

    tmux set-option -t "$TARGET" -u @cc_base_name 2>/dev/null
    tmux set-option -t "$TARGET" -u @cc_saved_auto_rename 2>/dev/null
    tmux set-option -t "$TARGET" -u @agent_running 2>/dev/null
    tmux set-option -t "$TARGET" -u @last_completed_time 2>/dev/null
    tmux set-hook -t "$TARGET" -uw pane-focus-in 2>/dev/null
    exit 0
fi

# Late init: hook fired before SessionStart — capture now
if [[ -z "$ORIGINAL" ]]; then
    CURRENT=$(tmux display-message -t "$TARGET" -p '#{window_name}')
    ORIGINAL=$(echo "$CURRENT" | sed 's/^🤖[^[:alnum:]_-]*//')
    [[ -z "$ORIGINAL" ]] && ORIGINAL="bash"
    tmux set-option -t "$TARGET" @cc_base_name "$ORIGINAL"
    tmux set-option -t "$TARGET" -w automatic-rename off
fi

# Stop event: Claude finished responding
if [[ -z "$TOOL" ]]; then
    AGENT_RUNNING=$(tmux show-option -t "$TARGET" -v @agent_running 2>/dev/null)
    if [[ "$AGENT_RUNNING" == "true" ]]; then
        tmux rename-window -t "$TARGET" "🤖⚙️$ORIGINAL"
    else
        ACTIVE_PANE=$(tmux display-message -p '#{pane_id}')
        if [[ "$TARGET" == "$ACTIVE_PANE" ]]; then
            tmux rename-window -t "$TARGET" "🤖$ORIGINAL"
        else
            tmux rename-window -t "$TARGET" "🤖✅$ORIGINAL"
            tmux set-hook -t "$TARGET" -w pane-focus-in "rename-window '🤖$ORIGINAL'; set-hook -uw pane-focus-in"
        fi
    fi
    exit 0
fi

BASE="🤖"

case "$TOOL" in
    PreToolUse)               SUFFIX="💭" ;;
    AskUserQuestion)          SUFFIX="🚨" ;;
    PermissionRequest)        SUFFIX="🚨" ;;
    Edit|Write|NotebookEdit)  SUFFIX="✏️" ;;
    Bash)                     SUFFIX="🧪" ;;
    Read|Grep|Glob)           SUFFIX="🔍" ;;
    Task)                     SUFFIX="⚙️" ;;
    WebSearch|WebFetch)       SUFFIX="🌐" ;;
    TodoWrite)                SUFFIX="📝" ;;
    Skill)                    SUFFIX="🎯" ;;
    SlashCommand)             SUFFIX="⚡" ;;
    TaskOutput)               SUFFIX="📤" ;;
    *)                        SUFFIX="💭" ;;
esac

EMOJI="${BASE}${SUFFIX}"

if [[ "$TOOL" == "Task" ]]; then
    tmux set-option -t "$TARGET" @agent_running "true"
fi

if [[ "$TOOL" == "TaskOutput" ]]; then
    tmux set-option -t "$TARGET" -u @agent_running
fi

ACTIVE_PANE=$(tmux display-message -p '#{pane_id}')
if [[ "$TARGET" == "$ACTIVE_PANE" ]] && [[ "$TOOL" != "AskUserQuestion" ]] && [[ "$TOOL" != "PermissionRequest" ]] && [[ "$TOOL" != "PreToolUse" ]] && [[ "$SUFFIX" != "💭" ]] && [[ "$SUFFIX" != "🚨" ]]; then
    exit 0
fi

tmux rename-window -t "$TARGET" "${EMOJI}${ORIGINAL}"
