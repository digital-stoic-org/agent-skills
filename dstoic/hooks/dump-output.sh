#!/bin/bash
set -e

# ==============================================================================
# Claude Output Dumper Hook (Staging Plugin)
# ==============================================================================
# Purpose: Automatically dump Claude's last output when enabled
# Usage: Triggered by Stop hook event
# Input: JSON on stdin (from Claude Code hooks)
# Output: Saves to $CLAUDE_PROJECT_DIR/.dump/TIMESTAMP.md
# ==============================================================================

# Check if dumping is enabled (look for toggle file)
if [ ! -f "$CLAUDE_PROJECT_DIR/.dump/.enabled" ]; then
  exit 0
fi

# Read hook input from stdin
input=$(cat)
transcript_path=$(echo "$input" | jq -r '.transcript_path')

if [ ! -f "$transcript_path" ]; then
  exit 0
fi

# Extract FULL last Claude output from transcript (no truncation)
# Format: {"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"..."}]}}
last_output=$(tac "$transcript_path" | \
  jq -rs 'map(select(.type == "assistant" and .message.content != null)) | .[0].message.content[] | select(.type == "text") | .text')

if [ -z "$last_output" ] || [ "$last_output" = "null" ]; then
  exit 0
fi

# Save directly to .dump folder
output_dir="$CLAUDE_PROJECT_DIR/.dump"
timestamp=$(date +%Y%m%d_%H%M%S)
output_file="$output_dir/${timestamp}.md"

echo "$last_output" > "$output_file"

exit 0
