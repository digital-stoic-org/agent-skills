#!/bin/bash
set -euo pipefail

# ==============================================================================
# Retrospective System: Daily Orphan Finalization
# ==============================================================================
# Purpose: Finalize ALL orphaned staging files (no lockfile checks)
# Usage: Run via cron once per day
# Assumption: Sessions last < 24 hours
# ==============================================================================

RETRO_ROOT="${RETRO_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null)/.retro}"
LOGS_DIR="$RETRO_ROOT/logs"

# --- Source shared libraries ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/lib"
source "$LIB_DIR/retrospect-stats.sh" || {
  echo "ERROR: Cannot source retrospect-stats.sh library" >&2
  exit 1
}

# Ensure log directory exists
mkdir -p "$LOGS_DIR" || {
  echo "ERROR: Cannot create logs directory" >&2
  exit 1
}

# Process all staging files across all projects
orphan_count=0

shopt -s nullglob
for project_staging_dir in "$RETRO_ROOT"/*/sessions/.staging; do
    [ -d "$project_staging_dir" ] || continue

    project_name=$(basename "$(dirname "$(dirname "$project_staging_dir")")")
    project_sessions_dir="$RETRO_ROOT/$project_name/sessions"

    for staging_file in "$project_staging_dir"/*.jsonl; do
        [ -f "$staging_file" ] || continue

        orphan_session_id=$(basename "$staging_file" .jsonl)

        # Skip if already finalized (check for timestamped YAML)
        if ls "$project_sessions_dir"/*"${orphan_session_id}.yaml" 2>/dev/null | grep -q .; then
            rm -f "$staging_file"  # Clean up duplicate
            continue
        fi

        # Finalize this orphaned session
        echo "[$(date -u +"%Y-%m-%d %H:%M:%S")] RECOVERY: Orphaned session in $project_name: $orphan_session_id" >> "$LOGS_DIR/recovery.log"

        # Get git context (best effort - from project root)
        pushd "$project_sessions_dir/../.." > /dev/null 2>&1 || true
        branch=$(git branch --show-current 2>/dev/null || echo "unknown")
        files_changed='[]'
        commits='[]'
        popd > /dev/null 2>&1 || true

        # Compute stats using shared library
        compute_session_stats "$staging_file" || continue

        # Generate timestamped filename
        timestamp_prefix=""
        if [ -n "$STATS_STARTED_AT" ] && [ "$STATS_STARTED_AT" != "null" ]; then
            timestamp_prefix=$(date -d "$STATS_STARTED_AT" +"%Y%m%d_%H%M" 2>/dev/null || echo "")
        fi

        if [ -n "$timestamp_prefix" ]; then
            final_file="$project_sessions_dir/${timestamp_prefix}_${orphan_session_id}.yaml"
        else
            final_file="$project_sessions_dir/${orphan_session_id}.yaml"
        fi

        # Generate YAML header and combine with JSONL body
        {
            generate_yaml_header "$orphan_session_id" "$branch" "$files_changed" "$commits" "incomplete" "Auto-recovered by daily batch on $(date -u +"%Y-%m-%d %H:%M:%S")"
            cat "$staging_file"
        } > "$final_file"

        # Delete staging file
        rm -f "$staging_file"

        orphan_count=$((orphan_count + 1))
    done
done
shopt -u nullglob

if [ $orphan_count -gt 0 ]; then
    echo "[$(date -u +"%Y-%m-%d %H:%M:%S")] RECOVERY: Finalized $orphan_count orphaned session(s)" >> "$LOGS_DIR/recovery.log"
fi

exit 0
