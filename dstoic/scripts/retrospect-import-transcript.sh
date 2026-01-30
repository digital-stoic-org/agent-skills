#!/bin/bash
set -euo pipefail

# ==============================================================================
# Import Claude Code Transcript to Retrospective System
# ==============================================================================
# Purpose: Convert historical Claude Code sessions to retrospective format
# Usage: import-from-transcript.sh <transcript-path> [session-id]
# Output: .retro/sessions/{session-id}.yaml
# ==============================================================================

# --- Configuration ---
RETRO_ROOT="/praxis/.retro"  # Changed to absolute path
LOGS_DIR="$RETRO_ROOT/logs"

# Maximum characters for tool output (target ~500 tokens = ~2000 chars)
MAX_TOOL_OUTPUT_CHARS=2000

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

# --- Ensure log directory exists ---
mkdir -p "$LOGS_DIR"

# --- Parse arguments ---
TRANSCRIPT_PATH="${1:-}"
PROJECT_NAME=""

# Check for --project parameter
if [ "${2:-}" = "--project" ]; then
  PROJECT_NAME="$3"
  SESSION_ID="${4:-$(basename "$TRANSCRIPT_PATH" .jsonl)}"
else
  # No --project flag: $2 is either session-id or empty
  SESSION_ID="${2:-$(basename "$TRANSCRIPT_PATH" .jsonl)}"
fi

if [ -z "$TRANSCRIPT_PATH" ]; then
  echo "ERROR: Transcript path required" >&2
  echo "Usage: import-from-transcript.sh <transcript-path> [--project <project-name>] [session-id]" >&2
  echo "" >&2
  echo "Examples:" >&2
  echo "  # Import with explicit project" >&2
  echo "  ./import-from-transcript.sh ~/.claude/projects/.../abc123.jsonl --project retrospective" >&2
  echo "" >&2
  echo "  # Auto-detect project from transcript path" >&2
  echo "  ./import-from-transcript.sh ~/.claude/projects/-home-mat-gtd/abc123.jsonl" >&2
  echo "" >&2
  echo "  # Import with custom session ID" >&2
  echo "  ./import-from-transcript.sh transcript.jsonl --project gtd my-session-id" >&2
  exit 1
fi

# Auto-detect project if not specified
if [ -z "$PROJECT_NAME" ]; then
  # Extract project from transcript path
  # ~/.claude/projects/-data-lq2-algo-lq-equities-generic-private/abc.jsonl
  # → "algo-lq-equities-generic-private"
  transcript_dir=$(basename "$(dirname "$TRANSCRIPT_PATH")")

  # Strip leading dash and common prefixes
  PROJECT_NAME="${transcript_dir#-}"
  PROJECT_NAME="${PROJECT_NAME#data-lq2-}"
  PROJECT_NAME="${PROJECT_NAME#home-mat-}"
  PROJECT_NAME="${PROJECT_NAME#home-mat-dev-praxis-}"
  PROJECT_NAME="${PROJECT_NAME#projects-}"

  # Fallback to "imported" if detection fails
  if [ -z "$PROJECT_NAME" ] || [ "$PROJECT_NAME" = "." ] || [ "$PROJECT_NAME" = ".." ]; then
    PROJECT_NAME="imported"
  fi

  echo "⚠️  No --project specified, auto-detected: $PROJECT_NAME" >&2
  echo "   To override: add --project <name> parameter" >&2
fi

# Verify transcript exists
if [ ! -f "$TRANSCRIPT_PATH" ]; then
  echo "ERROR: Transcript file not found: $TRANSCRIPT_PATH" >&2
  exit 1
fi

# Set project-specific paths
SESSIONS_DIR="$RETRO_ROOT/$PROJECT_NAME/sessions"
STAGING_DIR="$SESSIONS_DIR/.staging"

# Ensure project directories exist
mkdir -p "$SESSIONS_DIR" "$STAGING_DIR" || {
  echo "ERROR: Cannot create project directories for $PROJECT_NAME" >&2
  exit 1
}

# --- Parse transcript and convert to our format ---
echo "📥 Importing transcript: $TRANSCRIPT_PATH"
echo "   Session ID: $SESSION_ID"

TEMP_JSONL=$(mktemp)
trap "rm -f $TEMP_JSONL" EXIT

# --- Convert Claude transcript events to our schema ---
# Note: Claude Code transcript format may vary. This is best-effort conversion.

echo "🔄 Converting events..."

event_count=0
user_prompts=0
tool_calls=0

# Process each line of the transcript
while IFS= read -r line; do
  # Skip empty lines
  [ -z "$line" ] && continue

  # Detect event type from Claude transcript format
  # Actual format: {"type": "user|assistant|system", "message": {...}}
  entry_type=$(echo "$line" | jq -r '.type // empty')
  timestamp=$(echo "$line" | jq -r '.timestamp // empty')

  # Use current timestamp if not available
  if [ -z "$timestamp" ]; then
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  fi

  case "$entry_type" in
    user)
      # Convert user message to UserPromptSubmit event
      # Content is in message.content (string or array)
      content=$(echo "$line" | jq -r '.message.content // ""')
      if [ -n "$content" ] && [ "$content" != "null" ]; then
        content=$(truncate_output "$content")  # Truncate long prompts
        jq -c -n \
          --arg event "UserPromptSubmit" \
          --arg ts "$timestamp" \
          --arg prompt "$content" \
          '{
            event: $event,
            timestamp: $ts,
            data: {
              prompt: $prompt
            }
          }' >> "$TEMP_JSONL"
        user_prompts=$((user_prompts + 1))
      fi
      ;;

    assistant)
      # Convert assistant message to Stop event
      # Extract text content from message.content array (skip thinking blocks)
      content=$(echo "$line" | jq -r '
        .message.content // []
        | if type == "array" then
            map(select(.type == "text") | .text)
            | join("\n")
          else
            .
          end
      ')

      # Extract token usage from message.usage
      tokens_in=$(echo "$line" | jq -r '.message.usage.input_tokens // 0')
      tokens_out=$(echo "$line" | jq -r '.message.usage.output_tokens // 0')

      # Only create Stop event if there's actual content
      if [ -n "$content" ] && [ "$content" != "null" ] && [ "$content" != "" ]; then
        content=$(truncate_output "$content")  # Truncate long responses
        jq -c -n \
          --arg event "Stop" \
          --arg ts "$timestamp" \
          --arg response "$content" \
          --argjson tokens_in "$tokens_in" \
          --argjson tokens_out "$tokens_out" \
          '{
            event: $event,
            timestamp: $ts,
            data: {
              response: $response,
              tokens_used: {
                input: $tokens_in,
                output: $tokens_out
              },
              stop_reason: "end_turn"
            }
          }' >> "$TEMP_JSONL"
      fi
      ;;

    tool_use|tool_result)
      # Convert tool events to PostToolUse event (best effort)
      # Note: In Claude Code format, tools are embedded in message content
      # This case handles standalone tool events if they exist
      tool_name=$(echo "$line" | jq -r '.name // .tool_name // "unknown"')
      tool_input=$(echo "$line" | jq -c '.input // .tool_input // {}')
      tool_output=$(echo "$line" | jq -r '.output // .tool_output // ""')

      if [ "$tool_name" != "unknown" ]; then
        tool_output=$(truncate_output "$tool_output")  # Truncate long tool outputs
        jq -c -n \
          --arg event "PostToolUse" \
          --arg ts "$timestamp" \
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
              synthesized: true
            }
          }' >> "$TEMP_JSONL"
        tool_calls=$((tool_calls + 1))
      fi
      ;;

    file-history-snapshot|system)
      # Skip metadata events silently
      ;;

    *)
      # Unknown type - skip silently (don't log every unknown type)
      ;;
  esac

  event_count=$((event_count + 1))
done < "$TRANSCRIPT_PATH"

# --- Synthesize SessionStart and SessionEnd events ---
echo "🔧 Synthesizing SessionStart/SessionEnd events..."

# Extract timestamps from first and last events
if [ -s "$TEMP_JSONL" ]; then
  started_at=$(head -n1 "$TEMP_JSONL" | jq -r '.timestamp')
  ended_at=$(tail -n1 "$TEMP_JSONL" | jq -r '.timestamp')
else
  # No events - use current timestamp
  started_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  ended_at="$started_at"
fi

# Create SessionStart event
session_start=$(jq -c -n \
  --arg event "SessionStart" \
  --arg ts "$started_at" \
  --arg sid "$SESSION_ID" \
  '{
    event: $event,
    timestamp: $ts,
    data: {
      session_id: $sid,
      cwd: "unknown",
      permission_mode: "default",
      synthesized: true
    }
  }')

# Create SessionEnd event
session_end=$(jq -c -n \
  --arg event "SessionEnd" \
  --arg ts "$ended_at" \
  '{
    event: $event,
    timestamp: $ts,
    data: {
      reason: "imported",
      synthesized: true
    }
  }')

# Combine: SessionStart + converted events + SessionEnd
{
  echo "$session_start"
  cat "$TEMP_JSONL"
  echo "$session_end"
} > "${TEMP_JSONL}.full"

mv "${TEMP_JSONL}.full" "$TEMP_JSONL"

# --- Compute duration ---
duration_seconds=0
if [ -n "$started_at" ] && [ -n "$ended_at" ]; then
  start_epoch=$(date -d "$started_at" +%s 2>/dev/null || echo 0)
  end_epoch=$(date -d "$ended_at" +%s 2>/dev/null || echo 0)
  duration_seconds=$((end_epoch - start_epoch))
fi

# --- Get git context (current project, may not match original session) ---
branch=$(git branch --show-current 2>/dev/null || echo "unknown")

# --- Generate timestamped filename: {YYYYMMDD_HHMM}_{session-id}.yaml ---
timestamp_prefix=""
if [ -n "$started_at" ] && [ "$started_at" != "null" ]; then
  # Convert ISO8601 to YYYYMMDD_HHMM format
  timestamp_prefix=$(date -d "$started_at" +"%Y%m%d_%H%M" 2>/dev/null || echo "")
fi

# Create final filename
if [ -n "$timestamp_prefix" ]; then
  FINAL_FILE="$SESSIONS_DIR/${timestamp_prefix}_${SESSION_ID}.yaml"
else
  # Fallback to UUID-only if timestamp extraction fails
  FINAL_FILE="$SESSIONS_DIR/${SESSION_ID}.yaml"
fi

# Check if already imported (check for both formats)
if ls "$SESSIONS_DIR"/*"${SESSION_ID}.yaml" 2>/dev/null | grep -q .; then
  existing_file=$(ls "$SESSIONS_DIR"/*"${SESSION_ID}.yaml" 2>/dev/null | head -1)
  echo "⚠️  Session already imported: $SESSION_ID" >&2
  echo "   File: $existing_file" >&2
  read -p "Overwrite? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted." >&2
    exit 0
  fi
  rm -f "$existing_file"
fi

# --- Create YAML frontmatter ---
import_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
import_notes="Imported from Claude Code transcript on $import_date. Missing events: PermissionRequest, Notification, PreCompact (not available in transcript). SessionStart and SessionEnd are synthesized."

yaml_header="---
session_id: \"$SESSION_ID\"
started_at: \"$started_at\"
ended_at: \"$ended_at\"
source: \"claude-code-import\"
status: \"imported\"
import_date: \"$import_date\"
import_notes: \"$import_notes\"
model: \"unknown\"

git:
  branch: \"$branch\"
  files_changed: []
  commits: []

stats:
  total_events: $((event_count + 2))
  user_prompts: $user_prompts
  tool_calls: $tool_calls
  interruptions: 0
  context_compactions: 0
  subagent_spawns: 0
  duration_seconds: $duration_seconds
  incomplete: true

tags: []
notes: \"Imported historical session for retrospective analysis\"
---"

# --- Combine YAML header + JSONL body ---
{
  echo "$yaml_header"
  cat "$TEMP_JSONL"
} > "$FINAL_FILE"

# --- Log import ---
echo "[$(date -u +"%Y-%m-%d %H:%M:%S")] Imported: $SESSION_ID from $TRANSCRIPT_PATH (events: $((event_count + 2)))" >> "$LOGS_DIR/import.log"

# --- Success ---
echo "✅ Import complete!"
echo "   Output: $FINAL_FILE"
echo "   Events: $((event_count + 2)) ($user_prompts prompts, $tool_calls tool calls)"
echo ""
echo "📊 To analyze:"
echo "   /retro domain $SESSION_ID"
echo "   /retro collab $SESSION_ID"
