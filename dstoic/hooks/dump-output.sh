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

# Skip trivial outputs (e.g. "Done.", short confirmations). Fenced ```mermaid
# blocks are excluded from the MEASUREMENT only — diagram source inflates a
# thin turn past the floor — but the dump itself keeps them verbatim, so the
# file stays a faithful record of what was shown. Tune via DUMP_MIN_BYTES.
prose_only=$(printf '%s' "$last_output" | awk '
  /^[[:space:]]*```mermaid[[:space:]]*$/ { skip=1; next }
  skip && /^[[:space:]]*```[[:space:]]*$/ { skip=0; next }
  !skip')

min_bytes="${DUMP_MIN_BYTES:-500}"
out_len=$(printf '%s' "$prose_only" | wc -c)
if [ "$out_len" -lt "$min_bytes" ]; then
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
#
# The slug MUST be pure ASCII. Two traps, both live:
#   1. In a UTF-8 locale, `[^a-zA-Z0-9]` matches by COLLATION — "é" sorts between
#      e and f, so accents survive the filter instead of becoming "-".
#   2. `cut -c` counts BYTES, so a cut at 40 lands mid-sequence and leaves an
#      orphan lead byte (0xC3). Syncthing then refuses to scan the file
#      ("item is not in UTF8 encoding") and the folder never reaches 100%.
# Fix: transliterate to ASCII first, then run every filter under LC_ALL=C so
# ranges and counting are byte-wise and locale-independent. Even if iconv is
# missing or fails, the LC_ALL=C sed maps every non-ASCII byte to "-", so the
# string is ASCII before `cut` ever sees it.
heading=$(printf '%s' "$last_output" | grep -m1 '^#' || true)
ascii=$(printf '%s' "$heading" | iconv -f UTF-8 -t ASCII//TRANSLIT 2>/dev/null || true)
[ -z "$ascii" ] && ascii="$heading"
slug=$(printf '%s' "$ascii" \
  | LC_ALL=C sed -E 's/^#+[[:space:]]*//; s/[^a-zA-Z0-9]+/-/g' \
  | LC_ALL=C tr '[:upper:]' '[:lower:]' \
  | LC_ALL=C cut -c1-40 \
  | LC_ALL=C sed -E 's/^-+|-+$//g')
[ -z "$slug" ] && slug="untitled"
timestamp=$(date +%Y%m%d_%H%M%S)
output_file="$output_dir/${timestamp}-${project_name}-${slug}.md"

echo "$last_output" > "$output_file"

exit 0
