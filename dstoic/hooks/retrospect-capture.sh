#!/bin/bash
set -euo pipefail

# ==============================================================================
# Retrospective System: Unified Event Capture Hook
# ==============================================================================
# Purpose: Capture ALL 10 Claude Code lifecycle events to staging JSONL
# Usage: capture.sh <EventName>
# Input: JSON on stdin (from Claude Code hooks)
# Output: Appends to .retro/sessions/.staging/{session-id}.jsonl
# ==============================================================================

# --- Configuration ---
# RETRO_ROOT: centralized at git root of CLAUDE_PROJECT_DIR
RETRO_ROOT="${RETRO_ROOT:-$(git -C "$CLAUDE_PROJECT_DIR" rev-parse --show-toplevel 2>/dev/null)/.retro}"
LOGS_DIR="$RETRO_ROOT/logs"  # Keep logs centralized (only for recovery.log)

# --- Source shared libraries ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/../scripts/lib"
source "$LIB_DIR/retrospect-stats.sh" || {
  echo "ERROR: Cannot source retrospect-stats.sh library" >&2
  exit 1
}

# PROJECT_NAME and project-specific paths computed in handle_SessionStart
# after CWD is known from input JSON

# --- Ensure log directory exists (for recovery.log only) ---
mkdir -p "$LOGS_DIR" || {
  echo "ERROR: Cannot create .retro directories" >&2
  exit 1
}

# --- Parse arguments ---
EVENT_NAME="${1:-}"
if [ -z "$EVENT_NAME" ]; then
  echo "ERROR: Event name required. Usage: capture.sh <EventName>" >&2
  exit 1
fi

# --- Read JSON input from stdin ---
INPUT_JSON=$(cat)

# --- Extract session_id (required for all events) ---
SESSION_ID=$(echo "$INPUT_JSON" | jq -r '.session_id // empty')
if [ -z "$SESSION_ID" ]; then
  echo "ERROR: session_id not found in input JSON" >&2
  exit 1
fi

# --- Staging file path set dynamically per event (after project detection) ---

# --- Current timestamp (ISO 8601) ---
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# --- Maximum characters for tool output (target ~500 tokens = ~2000 chars) ---
MAX_TOOL_OUTPUT_CHARS=2000

# ==============================================================================
# Helper Functions
# ==============================================================================

# --- Truncate tool output to prevent token limit issues ---
truncate_output() {
  local text="$1"
  local length=${#text}

  if [ $length -le $MAX_TOOL_OUTPUT_CHARS ]; then
    echo "$text"
  else
    local truncated="${text:0:$MAX_TOOL_OUTPUT_CHARS}"
    echo "${truncated}... [TRUNCATED: ${length} chars total, showing first ${MAX_TOOL_OUTPUT_CHARS}]"
  fi
}

# --- Detect project from CWD ---
detect_project_name() {
  local cwd="$1"

  # Validate input
  if [ -z "$cwd" ] || [ "$cwd" = "unknown" ]; then
    echo "unknown"
    return
  fi

  # Extract project name from path (last directory component or git root)
  local project_name=""

  # Try to get git repo name first
  if command -v git &> /dev/null && git -C "$cwd" rev-parse --git-dir &> /dev/null 2>&1; then
    local git_root
    git_root=$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null)
    project_name=$(basename "$git_root")
  else
    # Fallback to current directory name
    project_name=$(basename "$cwd")
  fi

  # If empty, return "unknown"
  if [ -z "$project_name" ]; then
    echo "unknown"
    return
  fi

  # Return the project name
  echo "$project_name"
}

# --- Initialize project paths by scanning for existing staging file ---
init_project_paths() {
  # Scan all project directories for this session ID
  for project_dir in "$RETRO_ROOT"/*/sessions/.staging; do
    [ -d "$project_dir" ] || continue

    if [ -f "$project_dir/${SESSION_ID}.jsonl" ]; then
      STAGING_FILE="$project_dir/${SESSION_ID}.jsonl"
      PROJECT_NAME=$(basename "$(dirname "$(dirname "$project_dir")")")
      SESSIONS_DIR="$RETRO_ROOT/$PROJECT_NAME/sessions"
      STAGING_DIR="$SESSIONS_DIR/.staging"
      export PROJECT_NAME SESSIONS_DIR STAGING_DIR STAGING_FILE
      return 0
    fi
  done

  echo "ERROR: Cannot find staging file for session $SESSION_ID" >&2
  echo "       Scanned: $RETRO_ROOT/*/sessions/.staging/" >&2
  return 1
}

# ==============================================================================
# Event Handlers
# ==============================================================================

handle_SessionStart() {
  local input="$1"

  # Extract CWD first
  local cwd=$(echo "$input" | jq -r '.cwd // "unknown"')

  # CRITICAL: Detect project BEFORE recovery (needed for paths)
  PROJECT_NAME=$(detect_project_name "$cwd")
  export PROJECT_NAME  # Make available to subsequent event handlers

  # Set project-specific paths
  PROJECT_RETRO_DIR="$RETRO_ROOT/$PROJECT_NAME"
  SESSIONS_DIR="$PROJECT_RETRO_DIR/sessions"
  STAGING_DIR="$SESSIONS_DIR/.staging"
  STAGING_FILE="$STAGING_DIR/${SESSION_ID}.jsonl"
  export SESSIONS_DIR STAGING_DIR PROJECT_RETRO_DIR

  # Create project directories
  mkdir -p "$STAGING_DIR" || {
    echo "ERROR: Cannot create project directories for $PROJECT_NAME" >&2
    exit 1
  }

  # Start new session capture (orphan recovery handled by daily batch script)
  local permission_mode=$(echo "$input" | jq -r '.permission_mode // "default"')
  local transcript_path=$(echo "$input" | jq -r '.transcript_path // ""')

  # Create event JSON
  local event_json=$(jq -c -n \
    --arg event "SessionStart" \
    --arg ts "$TIMESTAMP" \
    --arg sid "$SESSION_ID" \
    --arg cwd "$cwd" \
    --arg perm "$permission_mode" \
    --arg transcript "$transcript_path" \
    --arg project "$PROJECT_NAME" \
    '{
      event: $event,
      timestamp: $ts,
      data: {
        session_id: $sid,
        cwd: $cwd,
        permission_mode: $perm,
        transcript_path: $transcript,
        project: $project
      }
    }')

  # Append to staging file
  echo "$event_json" >> "$STAGING_FILE"

  # Log to recovery log (commented out - use recovery.log for critical issues only)
  # echo "[$(date -u +"%Y-%m-%d %H:%M:%S")] SessionStart: $SESSION_ID (project: $PROJECT_NAME, cwd: $cwd)" >> "$LOGS_DIR/capture.log"
}

handle_UserPromptSubmit() {
  init_project_paths || return 1  # Locate project before writing
  local input="$1"

  local prompt=$(truncate_output "$(echo "$input" | jq -r '.display_text // .prompt // ""')")

  local event_json=$(jq -c -n \
    --arg event "UserPromptSubmit" \
    --arg ts "$TIMESTAMP" \
    --arg prompt "$prompt" \
    '{
      event: $event,
      timestamp: $ts,
      data: {
        prompt: $prompt
      }
    }')

  echo "$event_json" >> "$STAGING_FILE"
}

handle_PreToolUse() {
  init_project_paths || return 1  # Locate project before writing
  local input="$1"

  local tool_name=$(echo "$input" | jq -r '.tool_name // ""')
  local tool_input=$(echo "$input" | jq -c '.tool_input // {}')
  local permission_mode=$(echo "$input" | jq -r '.permission_mode // "default"')

  local event_json=$(jq -c -n \
    --arg event "PreToolUse" \
    --arg ts "$TIMESTAMP" \
    --arg tool "$tool_name" \
    --argjson tool_input "$tool_input" \
    --arg perm "$permission_mode" \
    '{
      event: $event,
      timestamp: $ts,
      data: {
        tool_name: $tool,
        tool_input: $tool_input,
        permission_mode: $perm
      }
    }')

  echo "$event_json" >> "$STAGING_FILE"
}

handle_PermissionRequest() {
  init_project_paths || return 1  # Locate project before writing
  local input="$1"

  local tool_name=$(echo "$input" | jq -r '.tool_name // ""')
  local tool_input=$(echo "$input" | jq -c '.tool_input // {}')
  local question=$(truncate_output "$(echo "$input" | jq -r '.question // ""')")
  local response=$(truncate_output "$(echo "$input" | jq -r '.response // ""')")

  local event_json=$(jq -c -n \
    --arg event "PermissionRequest" \
    --arg ts "$TIMESTAMP" \
    --arg tool "$tool_name" \
    --argjson tool_input "$tool_input" \
    --arg question "$question" \
    --arg response "$response" \
    '{
      event: $event,
      timestamp: $ts,
      data: {
        tool_name: $tool,
        tool_input: $tool_input,
        question: $question,
        response: $response
      }
    }')

  echo "$event_json" >> "$STAGING_FILE"
}

handle_PostToolUse() {
  init_project_paths || return 1  # Locate project before writing
  local input="$1"

  local tool_name=$(echo "$input" | jq -r '.tool_name // ""')
  local tool_input=$(echo "$input" | jq -c '.tool_input // {}')
  local tool_response=$(echo "$input" | jq -c '.tool_response // {}')

  # Extract tool output based on tool type
  # Structure varies: Read has .file.content, Bash has .output, etc.
  local tool_output=""
  case "$tool_name" in
    Read)
      # Read tool: tool_response.file.content
      tool_output=$(truncate_output "$(echo "$tool_response" | jq -r '.file.content // ""')")
      ;;
    Write|Edit)
      # Write/Edit: may have .text or .message
      tool_output=$(truncate_output "$(echo "$tool_response" | jq -r '.text // .message // ""')")
      ;;
    Bash)
      # Bash: may have .output or .stdout
      tool_output=$(truncate_output "$(echo "$tool_response" | jq -r '.output // .stdout // ""')")
      ;;
    *)
      # Generic: stringify entire response
      tool_output=$(truncate_output "$(echo "$tool_response" | jq -r 'tostring')")
      ;;
  esac

  # exit_code and duration_ms not provided in PostToolUse hook
  local event_json=$(jq -c -n \
    --arg event "PostToolUse" \
    --arg ts "$TIMESTAMP" \
    --arg tool "$tool_name" \
    --argjson tool_input "$tool_input" \
    --arg tool_output "$tool_output" \
    '{
      event: $event,
      timestamp: $ts,
      data: {
        tool_name: $tool,
        tool_input: $tool_input,
        tool_output: $tool_output,
        exit_code: 0,
        duration_ms: 0,
        note: "exit_code and duration_ms not available in hooks"
      }
    }')

  echo "$event_json" >> "$STAGING_FILE"
}

handle_Notification() {
  init_project_paths || return 1  # Locate project before writing
  local input="$1"

  # Field is notification_type, not type
  local notification_type=$(echo "$input" | jq -r '.notification_type // ""')
  local message=$(truncate_output "$(echo "$input" | jq -r '.message // ""')")
  local severity=$(echo "$input" | jq -r '.severity // "info"')

  local event_json=$(jq -c -n \
    --arg event "Notification" \
    --arg ts "$TIMESTAMP" \
    --arg ntype "$notification_type" \
    --arg msg "$message" \
    --arg sev "$severity" \
    '{
      event: $event,
      timestamp: $ts,
      data: {
        type: $ntype,
        message: $msg,
        severity: $sev
      }
    }')

  echo "$event_json" >> "$STAGING_FILE"
}

handle_Stop() {
  init_project_paths || return 1  # Locate project before writing
  local input="$1"

  # Stop hook doesn't provide response content directly
  # Workaround: Read from transcript_path (official solution)
  local transcript_path=$(echo "$input" | jq -r '.transcript_path // ""')
  local response=""

  if [ -f "$transcript_path" ]; then
    # Extract last assistant message from transcript
    # Transcript format: {"message":{"role":"assistant","content":[{"text":"..."}]}}
    response=$(tail -20 "$transcript_path" | \
      jq -r 'select(.message.role == "assistant") | .message.content[0].text // ""' 2>/dev/null | \
      tail -1)
  fi

  # Truncate response
  response=$(truncate_output "$response")

  # Tokens not available in Stop hook or transcript
  local event_json=$(jq -c -n \
    --arg event "Stop" \
    --arg ts "$TIMESTAMP" \
    --arg response "$response" \
    '{
      event: $event,
      timestamp: $ts,
      data: {
        response: $response,
        tokens_used: {
          input: 0,
          output: 0
        },
        stop_reason: "end_turn",
        note: "Response from transcript. Token counts not available in hooks."
      }
    }')

  echo "$event_json" >> "$STAGING_FILE"
}

handle_SubagentStop() {
  init_project_paths || return 1  # Locate project before writing
  local input="$1"

  # SubagentStop hook provides agent_id and agent_transcript_path
  # Task/result would require reading the agent transcript (defer to v2)
  local agent_id=$(echo "$input" | jq -r '.agent_id // ""')
  local agent_transcript_path=$(echo "$input" | jq -r '.agent_transcript_path // ""')

  local event_json=$(jq -c -n \
    --arg event "SubagentStop" \
    --arg ts "$TIMESTAMP" \
    --arg agent_id "$agent_id" \
    --arg agent_transcript "$agent_transcript_path" \
    '{
      event: $event,
      timestamp: $ts,
      data: {
        subagent_type: "",
        subagent_id: $agent_id,
        task: "",
        result: "",
        duration_ms: 0,
        agent_transcript_path: $agent_transcript,
        note: "Task/result require reading agent transcript (not implemented in v1)"
      }
    }')

  echo "$event_json" >> "$STAGING_FILE"
}

handle_PreCompact() {
  init_project_paths || return 1  # Locate project before writing
  local input="$1"

  local reason=$(echo "$input" | jq -r '.reason // ""')
  local context_size=$(echo "$input" | jq -r '.context_size // 0')

  local event_json=$(jq -c -n \
    --arg event "PreCompact" \
    --arg ts "$TIMESTAMP" \
    --arg reason "$reason" \
    --argjson ctx_size "$context_size" \
    '{
      event: $event,
      timestamp: $ts,
      data: {
        reason: $reason,
        context_size: $ctx_size
      }
    }')

  echo "$event_json" >> "$STAGING_FILE"
}

handle_SessionEnd() {
  init_project_paths || return 1  # Locate project before writing
  local input="$1"

  # Extract git context
  local branch=$(git branch --show-current 2>/dev/null || echo "unknown")
  local files_changed=$(git diff --name-only HEAD 2>/dev/null | jq -R -s -c 'split("\n") | map(select(length > 0))' || echo '[]')
  local commits=$(git log --oneline --no-decorate -5 2>/dev/null | jq -R -s -c 'split("\n") | map(select(length > 0))' || echo '[]')

  # Append SessionEnd event to staging
  local reason=$(echo "$input" | jq -r '.reason // "user_exit"')

  local event_json=$(jq -c -n \
    --arg event "SessionEnd" \
    --arg ts "$TIMESTAMP" \
    --arg reason "$reason" \
    '{
      event: $event,
      timestamp: $ts,
      data: {
        reason: $reason
      }
    }')

  echo "$event_json" >> "$STAGING_FILE"

  # NOW: Finalize the session (compute stats, create YAML, move to permanent)
  # Paths already set by init_project_paths
  finalize_session "$SESSION_ID" "$branch" "$files_changed" "$commits"
}

# ==============================================================================
# Session Finalization: Compute stats, create YAML header, move to permanent
# ==============================================================================
finalize_session() {
  local session_id="$1"
  local branch="$2"
  local files_changed="$3"
  local commits="$4"
  local status="${5:-complete}"  # Default: "complete", can be "incomplete" for recovery
  local recovery_note="${6:-}"   # Optional recovery note

  local staging_file="$STAGING_DIR/${session_id}.jsonl"

  # Verify staging file exists
  if [ ! -f "$staging_file" ]; then
    echo "ERROR: Staging file not found: $staging_file" >&2
    return 1
  fi

  # --- Compute statistics from JSONL events using shared library ---
  compute_session_stats "$staging_file" || return 1

  local total_events=$STATS_TOTAL_EVENTS
  local user_prompts=$STATS_USER_PROMPTS
  local tool_calls=$STATS_TOOL_CALLS
  local interruptions=$STATS_INTERRUPTIONS
  local compactions=$STATS_COMPACTIONS
  local subagent_spawns=$STATS_SUBAGENT_SPAWNS
  local started_at=$STATS_STARTED_AT
  local ended_at=$STATS_ENDED_AT
  local duration_seconds=$STATS_DURATION_SECONDS
  local model=$STATS_MODEL

  # Generate timestamped filename: {YYYYMMDD_HHMM}_{session-id}.yaml
  # Extract timestamp from started_at (format: 2026-01-05T20:46:39Z)
  local timestamp_prefix=""
  if [ -n "$started_at" ] && [ "$started_at" != "null" ]; then
    # Convert ISO8601 to YYYYMMDD_HHMM format
    timestamp_prefix=$(date -d "$started_at" +"%Y%m%d_%H%M" 2>/dev/null || echo "")
  fi

  # Create final filename
  if [ -n "$timestamp_prefix" ]; then
    local final_file="$SESSIONS_DIR/${timestamp_prefix}_${session_id}.yaml"
  else
    # Fallback to UUID-only if timestamp extraction fails
    local final_file="$SESSIONS_DIR/${session_id}.yaml"
  fi

  # --- Generate YAML header and combine with JSONL body ---
  {
    generate_yaml_header "$session_id" "$branch" "$files_changed" "$commits" "$status" "$recovery_note"
    cat "$staging_file"
  } > "$final_file"

  # --- Delete staging file ---
  rm -f "$staging_file"

  # --- Log finalization (commented out - use recovery.log for critical issues only) ---
  # echo "[$(date -u +"%Y-%m-%d %H:%M:%S")] Finalized: $session_id (status: $status, events: $total_events)" >> "$LOGS_DIR/capture.log"
}

# ==============================================================================
# Main: Route to event handler
# ==============================================================================
case "$EVENT_NAME" in
  SessionStart)
    handle_SessionStart "$INPUT_JSON"
    ;;
  UserPromptSubmit)
    handle_UserPromptSubmit "$INPUT_JSON"
    ;;
  PreToolUse)
    handle_PreToolUse "$INPUT_JSON"
    ;;
  PermissionRequest)
    handle_PermissionRequest "$INPUT_JSON"
    ;;
  PostToolUse)
    handle_PostToolUse "$INPUT_JSON"
    ;;
  Notification)
    handle_Notification "$INPUT_JSON"
    ;;
  Stop)
    handle_Stop "$INPUT_JSON"
    ;;
  SubagentStop)
    handle_SubagentStop "$INPUT_JSON"
    ;;
  PreCompact)
    handle_PreCompact "$INPUT_JSON"
    ;;
  SessionEnd)
    handle_SessionEnd "$INPUT_JSON"
    ;;
  *)
    echo "ERROR: Unknown event: $EVENT_NAME" >&2
    exit 1
    ;;
esac

exit 0
