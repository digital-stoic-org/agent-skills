#!/bin/bash
# StatusLine script for Claude Code
# Displays: folder | context % | duration | cost | code changes | model
#
# IMPORTANT: Understanding Claude Code's token metrics
# =======================================================
# Reference: https://github.com/anthropics/claude-code/issues/13783
#
# Claude Code provides TWO different token metrics:
#
# 1. total_input_tokens / total_output_tokens
#    - These are CUMULATIVE SESSION TOTALS (all tokens ever sent/received)
#    - They DO NOT reset on /clear or auto-compact
#    - They track lifetime spending for the CLI session
#    - Use these ONLY for cost tracking, NOT context window percentage
#
# 2. current_usage.input_tokens / current_usage.output_tokens
#    - These reflect the ACTUAL CONTEXT WINDOW contents
#    - This is what /context command shows
#    - Use these for context percentage (0-100%)
#    - Can be null between API requests
#
# Key insight: total_input_tokens includes ALL historical inputs across the session,
# including context that has been compacted/cleared. Using it for context % will show
# impossible values like 441% because it's cumulative, not current.
#
# References:
# - https://github.com/anthropics/claude-code/issues/13783 (Bug: cumulative vs current)
# - https://code.claude.com/docs/en/statusline (Official statusline docs)
# - https://github.com/anthropics/claude-code/issues/2745 (Token usage discussion)
# - https://hyperdev.matsuoka.com/p/how-claude-code-got-better-by-protecting (Context optimization)

input=$(cat)

# Tee raw session JSON for the /pick-model skill (model, context%, cache, cost).
# Opt-in: DSTOIC_HOOKS_ENABLED=1 + PRAXIS_DIR set (same gate as dstoic hooks).
# Guarded (not `exit 0`) so the statusline still renders when disabled.
if [ "${DSTOIC_HOOKS_ENABLED:-0}" = "1" ] && [ -n "${PRAXIS_DIR:-}" ]; then
    PICK_MODEL_STATE="${PRAXIS_DIR}/.tmp/pick-model/session-state.json"
    mkdir -p "$(dirname "$PICK_MODEL_STATE")" 2>/dev/null
    printf '%s' "$input" > "$PICK_MODEL_STATE" 2>/dev/null
fi

# Debug: log the incoming JSON to a file
# Uncomment to enable debugging:
# echo "=== STATUSLINE DEBUG ===" >> /tmp/statusline-debug.log
# echo "Timestamp: $(date)" >> /tmp/statusline-debug.log
# echo "Raw input:" >> /tmp/statusline-debug.log
# echo "$input" | jq '.' >> /tmp/statusline-debug.log
# echo "" >> /tmp/statusline-debug.log

# Extract directory name
DIR=$(echo "$input" | jq -r '.workspace.current_dir // ""')
if [ -n "$DIR" ]; then
    DIR=$(basename "$DIR")
else
    DIR="~"
fi

# ==================================================================================
# CONTEXT USAGE PERCENTAGE (0-100%)
# ==================================================================================
# Uses current_usage to show what's ACTUALLY in the active context window right now.
# This is what the /context command displays.
# Reference: https://github.com/anthropics/claude-code/issues/13783

CONTEXT_SIZE=$(echo "$input" | jq -r '.context_window.context_window_size // 200000')
CURRENT_USAGE=$(echo "$input" | jq '.context_window.current_usage // null')

if [ "$CURRENT_USAGE" != "null" ] && [ "$CURRENT_USAGE" != "{}" ]; then
    # Current context window usage (what's in the active request context)
    CONTEXT_INPUT=$(echo "$CURRENT_USAGE" | jq '.input_tokens // 0')
    CONTEXT_OUTPUT=$(echo "$CURRENT_USAGE" | jq '.output_tokens // 0')
    CONTEXT_CACHE_CREATE=$(echo "$CURRENT_USAGE" | jq '.cache_creation_input_tokens // 0')
    CONTEXT_CACHE_READ=$(echo "$CURRENT_USAGE" | jq '.cache_read_input_tokens // 0')

    # Context % = (input + output + cache_create + cache_read) / context_size
    CONTEXT_TOKENS=$((CONTEXT_INPUT + CONTEXT_OUTPUT + CONTEXT_CACHE_CREATE + CONTEXT_CACHE_READ))
    CONTEXT_PERCENT=$((CONTEXT_TOKENS * 100 / CONTEXT_SIZE))
else
    # Between API requests, current_usage may be null
    CONTEXT_PERCENT=0
    CONTEXT_CACHE_CREATE=0
    CONTEXT_CACHE_READ=0
fi

# ==================================================================================
# CUMULATIVE SESSION TOTALS (for cost tracking, NOT context percentage)
# ==================================================================================
# WARNING: These are LIFETIME session totals, not current context window usage!
# - total_input_tokens includes ALL inputs ever sent (even after /clear or compact)
# - total_output_tokens includes ALL outputs ever generated
# - These can be 10x-100x larger than your actual context window
# - DO NOT use these for context percentage calculations
#
# Why so high? Every request re-sends conversation history + CLAUDE.md + tools.
# A 74-minute session can easily accumulate 850k+ input tokens.
# Reference: https://github.com/anthropics/claude-code/issues/2745

# COMMENTED OUT: These metrics are misleading when displayed as "input/output tokens"
# They represent cumulative spending, not current usage.
# INPUT_TOKENS=$(echo "$input" | jq '.context_window.total_input_tokens // 0')
# OUTPUT_TOKENS=$(echo "$input" | jq '.context_window.total_output_tokens // 0')

# For cache breakdown display, use current_usage cache values (per-request)
CACHE_CREATE=$CONTEXT_CACHE_CREATE
CACHE_READ=$CONTEXT_CACHE_READ

# Session duration (ms to human readable)
DURATION_MS=$(echo "$input" | jq -r '.cost.total_duration_ms // 0')
DURATION_SEC=$((DURATION_MS / 1000))
DURATION_MIN=$((DURATION_SEC / 60))
DURATION_SEC_REMAINDER=$((DURATION_SEC % 60))
if [ $DURATION_MIN -gt 0 ]; then
    DURATION="${DURATION_MIN}m ${DURATION_SEC_REMAINDER}s"
else
    DURATION="${DURATION_SEC}s"
fi

# Session cost
COST=$(echo "$input" | jq -r '.cost.total_cost_usd // 0')
COST=$(printf "%.3f" $COST)

# Code changes
LINES_ADDED=$(echo "$input" | jq -r '.cost.total_lines_added // 0')
LINES_REMOVED=$(echo "$input" | jq -r '.cost.total_lines_removed // 0')
CODE_CHANGES="+${LINES_ADDED}/-${LINES_REMOVED}"

# Model name + funky emoji (match on model.id, robust against display-name changes)
MODEL=$(echo "$input" | jq -r '.model.display_name // "Unknown"')
MODEL_ID=$(echo "$input" | jq -r '.model.id // ""')
case "$MODEL_ID" in
    *opus*)   MODEL_EMOJI="🦅" ;;
    *sonnet*) MODEL_EMOJI="🎷" ;;
    *haiku*)  MODEL_EMOJI="🍃" ;;
    *fable*)  MODEL_EMOJI="🦊" ;;
    *)        MODEL_EMOJI="🛸" ;;
esac

# Reasoning effort + funky emoji (absent when model doesn't support effort)
EFFORT=$(echo "$input" | jq -r '.effort.level // ""')
EFFORT_SEG=""
if [ -n "$EFFORT" ]; then
    case "$EFFORT" in
        low)   EFFORT_EMOJI="🐢" ;;
        medium) EFFORT_EMOJI="🚶" ;;
        high)  EFFORT_EMOJI="🔥" ;;
        xhigh) EFFORT_EMOJI="⚡" ;;
        max)   EFFORT_EMOJI="🚀" ;;
        *)     EFFORT_EMOJI="❓" ;;
    esac
    EFFORT_SEG=" │ ${EFFORT_EMOJI} ${EFFORT}"
fi

# Helper function to detect project name (same logic as retrospect-capture.sh)
detect_project_name() {
  local cwd="$1"

  if [ -z "$cwd" ] || [ "$cwd" = "unknown" ]; then
    echo "unknown"
    return
  fi

  local normalized_path=""
  if [[ "$cwd" == /praxis* ]]; then
    normalized_path="${cwd#/praxis}"
  elif [[ "$cwd" == */dev/praxis* ]]; then
    normalized_path="${cwd#*/dev/praxis}"
  else
    echo "external"
    return
  fi

  normalized_path="${normalized_path#/}"
  normalized_path="${normalized_path%/}"

  if [ -z "$normalized_path" ]; then
    echo "praxis"
    return
  fi

  local project_name="${normalized_path##*/}"
  echo "$project_name"
}

# Session size monitoring (for .retro sessions)
SESSION_SIZE=""
SESSION_ID=$(echo "$input" | jq -r '.session_id // ""')
if [ -n "$SESSION_ID" ]; then
    CURRENT_DIR=$(echo "$input" | jq -r '.workspace.current_dir // ""')
    PROJECT_NAME=$(detect_project_name "$CURRENT_DIR")
    RETRO_ROOT="/praxis/.retro"
    STAGING_FILE="${RETRO_ROOT}/${PROJECT_NAME}/sessions/.staging/${SESSION_ID}.jsonl"

    # Check if staging file exists (project has retro system)
    if [ -f "$STAGING_FILE" ]; then
        # Compute tokens (file size / 4 chars per token)
        FILE_SIZE=$(wc -c < "$STAGING_FILE" 2>/dev/null || echo 0)
        ESTIMATED_TOKENS=$((FILE_SIZE / 4))
        TOKENS_K=$(awk "BEGIN {printf \"%.1f\", $ESTIMATED_TOKENS/1000}")

        # Count events
        EVENT_COUNT=$(wc -l < "$STAGING_FILE" 2>/dev/null || echo 0)

        # Thresholds
        WARN_TOKENS=15000
        CRITICAL_TOKENS=20000

        # Progressive warnings
        if [ "$ESTIMATED_TOKENS" -gt "$CRITICAL_TOKENS" ]; then
            SESSION_SIZE="🚨 Session log: ${TOKENS_K}k tokens | ${EVENT_COUNT} events | FORK NOW"
        elif [ "$ESTIMATED_TOKENS" -gt "$WARN_TOKENS" ]; then
            SESSION_SIZE="⚠️  Session log: ${TOKENS_K}k tokens | ${EVENT_COUNT} events | Consider /fork-session"
        else
            SESSION_SIZE="📝 Session log: ${TOKENS_K}k tokens | ${EVENT_COUNT} events"
        fi
    fi
fi

# ==================================================================================
# TOKEN BREAKDOWN METRICS (current request only)
# ==================================================================================
# These show cache usage from the CURRENT/LAST request, not cumulative.
# Cache metrics are useful for understanding prompt caching efficiency.

# COMMENTED OUT: Cumulative token display is misleading
# INPUT_K=$(awk -v tok="$INPUT_TOKENS" 'BEGIN {printf "%.1f", tok/1000}')
# OUTPUT_K=$(awk -v tok="$OUTPUT_TOKENS" 'BEGIN {printf "%.1f", tok/1000}')

CACHE_CREATE_K=$(awk -v tok="$CACHE_CREATE" 'BEGIN {printf "%.1f", tok/1000}')
CACHE_READ_K=$(awk -v tok="$CACHE_READ" 'BEGIN {printf "%.1f", tok/1000}')

# Calculate cache hit rate (% of cache tokens that were reads vs creates)
TOTAL_CACHE=$((CACHE_CREATE + CACHE_READ))
if [ $TOTAL_CACHE -gt 0 ]; then
    CACHE_HIT_RATE=$((CACHE_READ * 100 / TOTAL_CACHE))
else
    CACHE_HIT_RATE=0
fi

# Calculate cost savings from cache reads (90% discount)
# Cache read cost is 0.1x, so savings = 0.9x of what it would have cost at input rate
# Sonnet 4.5: $3 per 1M input tokens = $0.000003 per token
# Savings = cache_read_tokens * 0.000003 * 0.9
CACHE_SAVINGS=$(awk -v read="$CACHE_READ" 'BEGIN {printf "%.3f", read * 0.000003 * 0.9}')

# Environment warnings
ENV_WARN=""
[ -z "${PRAXIS_DIR:-}" ] && ENV_WARN="⚠️ PRAXIS_DIR not set | "

# Build the statusline (line 1)
if [ -n "$SESSION_SIZE" ]; then
    STATUS_LINE1="${ENV_WARN}📁 $DIR | 🧠 ${CONTEXT_PERCENT}% | ⏱️ $DURATION | 💰 \$$COST | ✏️ $CODE_CHANGES | $SESSION_SIZE | ${MODEL_EMOJI} ${MODEL}${EFFORT_SEG}"
else
    STATUS_LINE1="${ENV_WARN}📁 $DIR | 🧠 ${CONTEXT_PERCENT}% | ⏱️ $DURATION | 💰 \$$COST | ✏️ $CODE_CHANGES | ${MODEL_EMOJI} ${MODEL}${EFFORT_SEG}"
fi

# Build token breakdown line (line 2)
# COMMENTED OUT: Input/Output cumulative totals are misleading (can show 850k+ input)
# STATUS_LINE2="  📊 📥${INPUT_K}k 📤${OUTPUT_K}k | Cache: ✨${CACHE_CREATE_K}k ♻️${CACHE_READ_K}k (${CACHE_HIT_RATE}% hit) | Saved: \$$CACHE_SAVINGS"

# Simplified line 2: Show only reliable cache metrics from current request
STATUS_LINE2="  💾 Cache: ✨${CACHE_CREATE_K}k ♻️${CACHE_READ_K}k (${CACHE_HIT_RATE}% hit) | Saved: \$$CACHE_SAVINGS"

# Calculate terminal width and statusline length
TERM_WIDTH=$(tput cols 2>/dev/null || echo 80)

# Calculate padding for line 1
BASE_LENGTH1=$(printf "%s" "$STATUS_LINE1" | wc -m)
EMOJI_COUNT1=$(echo "$STATUS_LINE1" | grep -o '[📁🧠⏱️💰✏️🤖📊⚠️🚨🦅🎷🍃🦊🛸🐢🚶🔥⚡🚀❓]' | wc -l)
VISUAL_WIDTH1=$((BASE_LENGTH1 + EMOJI_COUNT1))
BUFFER=3
PADDING1=$((TERM_WIDTH - VISUAL_WIDTH1 - BUFFER))
[ $PADDING1 -lt 0 ] && PADDING1=0

# Calculate padding for line 2
BASE_LENGTH2=$(printf "%s" "$STATUS_LINE2" | wc -m)
EMOJI_COUNT2=$(echo "$STATUS_LINE2" | grep -o '[📁🧠⏱️💰✏️🤖📊⚠️🚨♻️✨🦅🎷🍃🦊🛸🐢🚶🔥⚡🚀❓]' | wc -l)
VISUAL_WIDTH2=$((BASE_LENGTH2 + EMOJI_COUNT2))
PADDING2=$((TERM_WIDTH - VISUAL_WIDTH2 - BUFFER))
[ $PADDING2 -lt 0 ] && PADDING2=0

# Print both lines with right alignment
printf "%${PADDING1}s%s\n" "" "$STATUS_LINE1"
printf "%${PADDING2}s%s\n" "" "$STATUS_LINE2"
