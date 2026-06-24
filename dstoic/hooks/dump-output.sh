#!/bin/bash
set -e

# ==============================================================================
# Claude Output Dumper Hook (Staging Plugin)
# ==============================================================================
# Review agent output later without scrolling back
# Purpose: Automatically dump Claude's last output when enabled
# Usage: Triggered by Stop hook event
# Input: JSON on stdin (from Claude Code hooks)
# Output: Saves to $PRAXIS_DIR/thinking/dumps/$project/ (fallback: $CLAUDE_PROJECT_DIR/.dump/)
# ==============================================================================

# Portability gate: silently no-op unless dstoic telemetry is opted-in.
# Requires BOTH: DSTOIC_HOOKS_ENABLED=1 AND PRAXIS_DIR set.
{ [ "${DSTOIC_HOOKS_ENABLED:-0}" = "1" ] && [ -n "${PRAXIS_DIR:-}" ]; } || exit 0

# Check if dumping is enabled (look for toggle file)
if [ ! -f "$CLAUDE_PROJECT_DIR/.dump/.enabled" ]; then
  exit 0
fi

# Read hook input from stdin
input=$(cat)

# Prevent infinite loops when Stop hook triggers continuation
stop_active=$(echo "$input" | jq -r '.stop_hook_active // false')
if [ "$stop_active" = "true" ]; then
  exit 0
fi

transcript_path=$(echo "$input" | jq -r '.transcript_path')

if [ ! -f "$transcript_path" ]; then
  exit 0
fi

# Allow transcript to fully flush before reading
sleep 0.5

# Extract FULL last Claude output from transcript (no truncation)
# Format: {"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"..."}]}}
last_output=$(tac "$transcript_path" | \
  jq -rs 'map(select(.type == "assistant" and .message.content != null)) | .[0].message.content[] | select(.type == "text") | .text')

if [ -z "$last_output" ] || [ "$last_output" = "null" ]; then
  exit 0
fi

# Strip fenced ```mermaid ... ``` blocks — diagram source is noise in dumps.
last_output=$(printf '%s' "$last_output" | awk '
  /^[[:space:]]*```mermaid[[:space:]]*$/ { skip=1; next }
  skip && /^[[:space:]]*```[[:space:]]*$/ { skip=0; next }
  !skip')

# Skip empty/null AND trivial outputs (e.g. "Done.", short confirmations),
# measured AFTER mermaid stripping. Floor avoids flooding dumps/ with
# near-empty files; tune via DUMP_MIN_BYTES.
min_bytes="${DUMP_MIN_BYTES:-500}"
out_len=$(printf '%s' "$last_output" | wc -c)
if [ -z "$last_output" ] || [ "$out_len" -lt "$min_bytes" ]; then
  exit 0
fi

# Flat single-stream dump dir at $PRAXIS_DIR/.dumps/ (fallback: .dump/).
# Flat (no per-project subdirs) so parallel sessions interleave by time in
# ONE place — project + topic live in the filename, no folder hopping.
project_name=$(basename "$CLAUDE_PROJECT_DIR")
if [ -n "$PRAXIS_DIR" ]; then
  output_dir="$PRAXIS_DIR/.dumps"
else
  output_dir="$CLAUDE_PROJECT_DIR/.dump"
fi
mkdir -p "$output_dir"

# Topic slug from first heading: scannable filename, sorts by time.
# Format: TIMESTAMP-project-slug.md
slug=$(printf '%s' "$last_output" | grep -m1 '^#' | sed -E 's/^#+[[:space:]]*//; s/[^a-zA-Z0-9]+/-/g; s/^-+|-+$//g' | tr '[:upper:]' '[:lower:]' | cut -c1-40)
[ -z "$slug" ] && slug="untitled"
timestamp=$(date +%Y%m%d_%H%M%S)
output_file="$output_dir/${timestamp}-${project_name}-${slug}.md"

echo "$last_output" > "$output_file"

exit 0
