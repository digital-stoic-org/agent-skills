#!/bin/bash
# StatusLine script for Claude Code
# Displays: folder | context % | duration | cost | code changes | model
#
# Token metrics: uses current_usage (actual context window), NOT total_input/output
# (which are cumulative session totals and would show impossible values like 441%).
# Ref: https://github.com/anthropics/claude-code/issues/13783

input=$(cat)

# Extract directory name
DIR=$(echo "$input" | jq -r '.workspace.current_dir // ""')
if [ -n "$DIR" ]; then
    DIR=$(basename "$DIR")
else
    DIR="~"
fi

# Context usage percentage (0-100%) — actual context window, not cumulative
CONTEXT_SIZE=$(echo "$input" | jq -r '.context_window.context_window_size // 200000')
CURRENT_USAGE=$(echo "$input" | jq '.context_window.current_usage // null')

if [ "$CURRENT_USAGE" != "null" ] && [ "$CURRENT_USAGE" != "{}" ]; then
    CONTEXT_INPUT=$(echo "$CURRENT_USAGE" | jq '.input_tokens // 0')
    CONTEXT_OUTPUT=$(echo "$CURRENT_USAGE" | jq '.output_tokens // 0')
    CONTEXT_CACHE_CREATE=$(echo "$CURRENT_USAGE" | jq '.cache_creation_input_tokens // 0')
    CONTEXT_CACHE_READ=$(echo "$CURRENT_USAGE" | jq '.cache_read_input_tokens // 0')

    CONTEXT_TOKENS=$((CONTEXT_INPUT + CONTEXT_OUTPUT + CONTEXT_CACHE_CREATE + CONTEXT_CACHE_READ))
    CONTEXT_PERCENT=$((CONTEXT_TOKENS * 100 / CONTEXT_SIZE))
else
    CONTEXT_PERCENT=0
    CONTEXT_CACHE_CREATE=0
    CONTEXT_CACHE_READ=0
fi

CACHE_CREATE=$CONTEXT_CACHE_CREATE
CACHE_READ=$CONTEXT_CACHE_READ

# Session duration
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

# Model name
MODEL=$(echo "$input" | jq -r '.model.display_name // "Unknown"')

# Project name detection (same logic as retrospect-capture.sh)
detect_project_name() {
  local cwd="$1"
  if [ -z "$cwd" ] || [ "$cwd" = "unknown" ]; then
    echo "unknown"; return
  fi

  local normalized_path=""
  if [[ "$cwd" == /praxis* ]]; then
    normalized_path="${cwd#/praxis}"
  elif [[ "$cwd" == */dev/praxis* ]]; then
    normalized_path="${cwd#*/dev/praxis}"
  else
    echo "external"; return
  fi

  normalized_path="${normalized_path#/}"
  normalized_path="${normalized_path%/}"

  if [ -z "$normalized_path" ]; then
    echo "praxis"; return
  fi

  echo "${normalized_path##*/}"
}

# Session size monitoring (for .retro sessions)
SESSION_SIZE=""
SESSION_ID=$(echo "$input" | jq -r '.session_id // ""')
if [ -n "$SESSION_ID" ]; then
    CURRENT_DIR=$(echo "$input" | jq -r '.workspace.current_dir // ""')
    PROJECT_NAME=$(detect_project_name "$CURRENT_DIR")
    STAGING_FILE="/praxis/.retro/${PROJECT_NAME}/sessions/.staging/${SESSION_ID}.jsonl"

    if [ -f "$STAGING_FILE" ]; then
        FILE_SIZE=$(wc -c < "$STAGING_FILE" 2>/dev/null || echo 0)
        ESTIMATED_TOKENS=$((FILE_SIZE / 4))
        TOKENS_K=$(awk "BEGIN {printf \"%.1f\", $ESTIMATED_TOKENS/1000}")
        EVENT_COUNT=$(wc -l < "$STAGING_FILE" 2>/dev/null || echo 0)

        WARN_TOKENS=15000
        CRITICAL_TOKENS=20000

        if [ "$ESTIMATED_TOKENS" -gt "$CRITICAL_TOKENS" ]; then
            SESSION_SIZE="🚨 Session log: ${TOKENS_K}k tokens | ${EVENT_COUNT} events | FORK NOW"
        elif [ "$ESTIMATED_TOKENS" -gt "$WARN_TOKENS" ]; then
            SESSION_SIZE="⚠️  Session log: ${TOKENS_K}k tokens | ${EVENT_COUNT} events | Consider /fork-session"
        else
            SESSION_SIZE="📝 Session log: ${TOKENS_K}k tokens | ${EVENT_COUNT} events"
        fi
    fi
fi

# Cache metrics
CACHE_CREATE_K=$(awk -v tok="$CACHE_CREATE" 'BEGIN {printf "%.1f", tok/1000}')
CACHE_READ_K=$(awk -v tok="$CACHE_READ" 'BEGIN {printf "%.1f", tok/1000}')

TOTAL_CACHE=$((CACHE_CREATE + CACHE_READ))
if [ $TOTAL_CACHE -gt 0 ]; then
    CACHE_HIT_RATE=$((CACHE_READ * 100 / TOTAL_CACHE))
else
    CACHE_HIT_RATE=0
fi

# Cost savings from cache reads (90% discount at Sonnet rate $3/1M input tokens)
CACHE_SAVINGS=$(awk -v read="$CACHE_READ" 'BEGIN {printf "%.3f", read * 0.000003 * 0.9}')

# Line 1: main status
if [ -n "$SESSION_SIZE" ]; then
    STATUS_LINE1="📁 $DIR | 🧠 ${CONTEXT_PERCENT}% | ⏱️ $DURATION | 💰 \$$COST | ✏️ $CODE_CHANGES | $SESSION_SIZE | 🤖 $MODEL"
else
    STATUS_LINE1="📁 $DIR | 🧠 ${CONTEXT_PERCENT}% | ⏱️ $DURATION | 💰 \$$COST | ✏️ $CODE_CHANGES | 🤖 $MODEL"
fi

# Line 2: cache metrics
STATUS_LINE2="  💾 Cache: ✨${CACHE_CREATE_K}k ♻️${CACHE_READ_K}k (${CACHE_HIT_RATE}% hit) | Saved: \$$CACHE_SAVINGS"

# Right-align output
TERM_WIDTH=$(tput cols 2>/dev/null || echo 80)

BASE_LENGTH1=$(printf "%s" "$STATUS_LINE1" | wc -m)
EMOJI_COUNT1=$(echo "$STATUS_LINE1" | grep -o '[📁🧠⏱️💰✏️🤖📊⚠️🚨]' | wc -l)
VISUAL_WIDTH1=$((BASE_LENGTH1 + EMOJI_COUNT1))
BUFFER=3
PADDING1=$((TERM_WIDTH - VISUAL_WIDTH1 - BUFFER))
[ $PADDING1 -lt 0 ] && PADDING1=0

BASE_LENGTH2=$(printf "%s" "$STATUS_LINE2" | wc -m)
EMOJI_COUNT2=$(echo "$STATUS_LINE2" | grep -o '[📁🧠⏱️💰✏️🤖📊⚠️🚨♻️✨]' | wc -l)
VISUAL_WIDTH2=$((BASE_LENGTH2 + EMOJI_COUNT2))
PADDING2=$((TERM_WIDTH - VISUAL_WIDTH2 - BUFFER))
[ $PADDING2 -lt 0 ] && PADDING2=0

printf "%${PADDING1}s%s\n" "" "$STATUS_LINE1"
printf "%${PADDING2}s%s\n" "" "$STATUS_LINE2"
