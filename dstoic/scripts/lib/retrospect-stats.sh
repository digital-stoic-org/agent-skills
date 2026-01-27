#!/bin/bash
# ==============================================================================
# Retrospective System: Stats Computation & YAML Generation Library
# ==============================================================================
# Purpose: Shared functions for session finalization
# Usage: source this file from capture hooks or batch finalization scripts
# ==============================================================================

# ==============================================================================
# Compute Session Statistics from JSONL Events
# ==============================================================================
# Input: $1 = path to staging JSONL file
# Output: Sets global variables with computed stats:
#   - STATS_TOTAL_EVENTS
#   - STATS_USER_PROMPTS
#   - STATS_TOOL_CALLS
#   - STATS_INTERRUPTIONS
#   - STATS_COMPACTIONS
#   - STATS_SUBAGENT_SPAWNS
#   - STATS_STARTED_AT
#   - STATS_ENDED_AT
#   - STATS_DURATION_SECONDS
#   - STATS_MODEL
# ==============================================================================
compute_session_stats() {
  local staging_file="$1"

  if [ ! -f "$staging_file" ]; then
    echo "ERROR: Staging file not found: $staging_file" >&2
    return 1
  fi

  # Compute event counts
  # Note: Compact JSON has no spaces after colons
  STATS_TOTAL_EVENTS=$(wc -l < "$staging_file")
  STATS_USER_PROMPTS=$(grep -c '"event":"UserPromptSubmit"' "$staging_file" || true)
  STATS_TOOL_CALLS=$(grep -c '"event":"PostToolUse"' "$staging_file" || true)
  local perm_req=$(grep -c '"event":"PermissionRequest"' "$staging_file" || true)
  local notifications=$(grep -c '"event":"Notification"' "$staging_file" || true)
  STATS_INTERRUPTIONS=$((perm_req + notifications))
  STATS_COMPACTIONS=$(grep -c '"event":"PreCompact"' "$staging_file" || true)
  STATS_SUBAGENT_SPAWNS=$(grep -c '"event":"SubagentStop"' "$staging_file" || true)

  # Extract timestamps (first and last event)
  STATS_STARTED_AT=$(head -n1 "$staging_file" | jq -r '.timestamp')
  STATS_ENDED_AT=$(tail -n1 "$staging_file" | jq -r '.timestamp')

  # Compute duration (if timestamps valid)
  STATS_DURATION_SECONDS=0
  if [ -n "$STATS_STARTED_AT" ] && [ -n "$STATS_ENDED_AT" ]; then
    local start_epoch=$(date -d "$STATS_STARTED_AT" +%s 2>/dev/null || echo 0)
    local end_epoch=$(date -d "$STATS_ENDED_AT" +%s 2>/dev/null || echo 0)
    STATS_DURATION_SECONDS=$((end_epoch - start_epoch))
  fi

  # Detect model from first Stop event (if available)
  STATS_MODEL=$(grep '"event":"Stop"' "$staging_file" | head -n1 | jq -r '.data.model // "unknown"' || echo "unknown")

  return 0
}

# ==============================================================================
# Generate YAML Frontmatter for Session File
# ==============================================================================
# Input:
#   $1 = session_id
#   $2 = branch
#   $3 = files_changed (JSON array)
#   $4 = commits (JSON array)
#   $5 = status (default: "complete")
#   $6 = recovery_note (optional)
# Prereq: compute_session_stats() must be called first (uses STATS_* variables)
# Output: Prints YAML frontmatter to stdout
# ==============================================================================
generate_yaml_header() {
  local session_id="$1"
  local branch="$2"
  local files_changed="$3"
  local commits="$4"
  local status="${5:-complete}"
  local recovery_note="${6:-}"

  # Build YAML header
  cat << EOF
---
session_id: "$session_id"
started_at: "$STATS_STARTED_AT"
ended_at: "$STATS_ENDED_AT"
source: "claude-code"
status: "$status"
model: "$STATS_MODEL"
EOF

  # Add recovery note if present
  if [ -n "$recovery_note" ]; then
    echo "recovery_note: \"$recovery_note\""
  fi

  # Continue YAML header
  cat << EOF

git:
  branch: "$branch"
  files_changed: $files_changed
  commits: $commits

stats:
  total_events: $STATS_TOTAL_EVENTS
  user_prompts: $STATS_USER_PROMPTS
  tool_calls: $STATS_TOOL_CALLS
  interruptions: $STATS_INTERRUPTIONS
  context_compactions: $STATS_COMPACTIONS
  subagent_spawns: $STATS_SUBAGENT_SPAWNS
  duration_seconds: $STATS_DURATION_SECONDS
  incomplete: $([ "$status" = "incomplete" ] && echo "true" || echo "false")

tags: []
notes: ""
---
EOF
}
