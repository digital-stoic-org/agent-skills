#!/bin/bash
set -euo pipefail

# ==============================================================================
# Session Loader with Timeframe and Processed Status Filtering
# ==============================================================================
# Purpose: Find and filter sessions for /retro commands
# Usage: load-sessions.sh [--last Nd] [--week] [--month] [--from DATE --to DATE] [--mode domain|collab|report]
# Output: List of session file paths, one per line
# ==============================================================================

# --- Configuration ---
RETRO_ROOT="${RETRO_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null)/.retro}"

# --- Parse arguments ---
FILTER_MODE=""
FILTER_DAYS=""
FILTER_FROM=""
FILTER_TO=""
PROJECT_FILTER=""  # NEW: Optional project filter

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      PROJECT_FILTER="$2"
      shift 2
      ;;
    --last)
      FILTER_MODE="last"
      FILTER_DAYS="$2"
      shift 2
      ;;
    --week)
      FILTER_MODE="week"
      shift
      ;;
    --month)
      FILTER_MODE="month"
      shift
      ;;
    --from)
      FILTER_MODE="range"
      FILTER_FROM="$2"
      shift 2
      ;;
    --to)
      FILTER_TO="$2"
      shift 2
      ;;
    *)
      echo "ERROR: Unknown argument: $1" >&2
      echo "Usage: load-sessions.sh [--project <name>] [--last Nd] [--week] [--month] [--from DATE --to DATE]" >&2
      exit 1
      ;;
  esac
done

# --- Helper: Extract timestamp from filename ---
# Input: filename (e.g., "20260105_2046_abc123.yaml")
# Output: timestamp prefix (e.g., "20260105_2046") or empty if UUID-only
extract_timestamp() {
  local filename="$1"
  # Match pattern: YYYYMMDD_HHMM at start of filename
  if [[ "$filename" =~ ^([0-9]{8}_[0-9]{4})_ ]]; then
    echo "${BASH_REMATCH[1]}"
  else
    echo ""
  fi
}

# --- Helper: Convert timestamp to epoch seconds ---
# Input: timestamp (e.g., "20260105_2046")
# Output: epoch seconds
timestamp_to_epoch() {
  local ts="$1"
  # Convert YYYYMMDD_HHMM to YYYY-MM-DD HH:MM format for date command
  local year="${ts:0:4}"
  local month="${ts:4:2}"
  local day="${ts:6:2}"
  local hour="${ts:9:2}"
  local min="${ts:11:2}"
  date -d "$year-$month-$day $hour:$min" +%s 2>/dev/null || echo 0
}

# --- Helper: Get week boundaries (Monday-Sunday) ---
get_week_boundaries() {
  # Get Monday of current week
  local monday_epoch=$(date -d "last monday" +%s 2>/dev/null || date -d "this monday" +%s)
  # Get Sunday (6 days after Monday)
  local sunday_epoch=$((monday_epoch + 6 * 86400))

  echo "$monday_epoch $sunday_epoch"
}

# --- Helper: Get month boundaries ---
get_month_boundaries() {
  # First day of current month
  local first_day=$(date -d "$(date +%Y-%m-01)" +%s)
  # Last day of current month
  local last_day=$(date -d "$(date +%Y-%m-01) +1 month -1 day" +%s)

  echo "$first_day $last_day"
}

# --- Find all session files ---
shopt -s nullglob
session_files=()

if [ -n "$PROJECT_FILTER" ]; then
  # Search specific project only
  sessions_dir="$RETRO_ROOT/$PROJECT_FILTER/sessions"
  if [ -d "$sessions_dir" ]; then
    session_files+=("$sessions_dir"/*.yaml)
  fi
else
  # Search all project directories
  for project_dir in "$RETRO_ROOT"/*/sessions; do
    [ -d "$project_dir" ] || continue
    session_files+=("$project_dir"/*.yaml)
  done

  # Also include legacy sessions for backward compatibility
  legacy_sessions_dir="$RETRO_ROOT/sessions"
  if [ -d "$legacy_sessions_dir" ]; then
    session_files+=("$legacy_sessions_dir"/*.yaml)
  fi
fi

shopt -u nullglob

if [ ${#session_files[@]} -eq 0 ]; then
  if [ -n "$PROJECT_FILTER" ]; then
    echo "No sessions found for project: $PROJECT_FILTER" >&2
  else
    echo "No sessions found in any project" >&2
  fi
  exit 0
fi

# --- Apply timeframe filtering ---
filtered_sessions=()

if [ -z "$FILTER_MODE" ]; then
  # No timeframe filter - include all sessions
  filtered_sessions=("${session_files[@]}")
else
  # Compute filter boundaries
  case "$FILTER_MODE" in
    last)
      # Last N days
      days_num="${FILTER_DAYS%d}"  # Strip 'd' suffix
      cutoff_epoch=$(date -d "$days_num days ago" +%s)
      filter_start=$cutoff_epoch
      filter_end=$(date +%s)
      ;;
    week)
      # Current week (Monday-Sunday)
      read filter_start filter_end < <(get_week_boundaries)
      ;;
    month)
      # Current month
      read filter_start filter_end < <(get_month_boundaries)
      ;;
    range)
      # Specific date range
      filter_start=$(date -d "$FILTER_FROM" +%s 2>/dev/null || echo 0)
      filter_end=$(date -d "$FILTER_TO 23:59:59" +%s 2>/dev/null || echo 0)
      ;;
  esac

  # Filter sessions by timestamp
  for session_file in "${session_files[@]}"; do
    filename=$(basename "$session_file")
    timestamp=$(extract_timestamp "$filename")

    if [ -z "$timestamp" ]; then
      # UUID-only file - skip for timeframe filters
      continue
    fi

    # Convert timestamp to epoch
    session_epoch=$(timestamp_to_epoch "$timestamp")

    # Check if within filter range
    if [ "$session_epoch" -ge "$filter_start" ] && [ "$session_epoch" -le "$filter_end" ]; then
      filtered_sessions+=("$session_file")
    fi
  done
fi

# --- Output results ---
if [ ${#filtered_sessions[@]} -eq 0 ]; then
  echo "No matching sessions found" >&2
  exit 0
fi

# Print session file paths, one per line
for session_file in "${filtered_sessions[@]}"; do
  echo "$session_file"
done
