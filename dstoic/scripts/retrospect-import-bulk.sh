#!/bin/bash
set -euo pipefail

# ==============================================================================
# Bulk Import Claude Code Transcripts to Retrospective System
# ==============================================================================
# Purpose: Import all historical transcripts from ~/.claude/projects
# Usage: retrospect-import-bulk.sh [--all] [--project <name>] [--from <dir>]
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMPORT_SCRIPT="$SCRIPT_DIR/retrospect-import-transcript.sh"
CLAUDE_PROJECTS_DIR="$HOME/.claude/projects"
RETRO_ROOT="/praxis/.retro"

# Default: not bulk import
BULK_IMPORT=false
OVERRIDE_PROJECT=""
TRANSCRIPTS_DIR=""

# --- Parse arguments ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --all)
      BULK_IMPORT=true
      shift
      ;;
    --project)
      OVERRIDE_PROJECT="$2"
      shift 2
      ;;
    --from)
      TRANSCRIPTS_DIR="$2"
      shift 2
      ;;
    -h|--help)
      cat <<EOF
Usage: retrospect-import-bulk.sh [OPTIONS]

Import historical Claude Code transcripts to retrospective system.

OPTIONS:
  --all                 Import all transcripts from ~/.claude/projects
  --project <name>      Override auto-detection, import all to specific project
  --from <dir>          Import from specific directory (default: ~/.claude/projects)
  -h, --help           Show this help

EXAMPLES:
  # Import all transcripts with auto-detection
  ./retrospect-import-bulk.sh --all

  # Import all to single project
  ./retrospect-import-bulk.sh --all --project historical-2025

  # Import from specific project directory
  ./retrospect-import-bulk.sh --all --from ~/.claude/projects/-home-mat-dev-praxis

  # Import from specific project to override destination
  ./retrospect-import-bulk.sh --all --from ~/.claude/projects/-data-lq2-Lean-lq --project lean

OUTPUT:
  Sessions imported to: /praxis/.retro/<project-name>/sessions/
  Import log: /praxis/.retro/logs/import.log

EOF
      exit 0
      ;;
    *)
      echo "ERROR: Unknown argument: $1" >&2
      echo "Run with --help for usage" >&2
      exit 1
      ;;
  esac
done

# Validate --all flag
if [ "$BULK_IMPORT" = false ]; then
  echo "ERROR: --all flag required for bulk import" >&2
  echo "Run with --help for usage" >&2
  exit 1
fi

# Set transcripts directory
if [ -z "$TRANSCRIPTS_DIR" ]; then
  TRANSCRIPTS_DIR="$CLAUDE_PROJECTS_DIR"
fi

# Verify directory exists
if [ ! -d "$TRANSCRIPTS_DIR" ]; then
  echo "ERROR: Directory not found: $TRANSCRIPTS_DIR" >&2
  exit 1
fi

# Find all transcript files
echo "🔍 Searching for transcripts in: $TRANSCRIPTS_DIR"
mapfile -t transcript_files < <(find "$TRANSCRIPTS_DIR" -name "*.jsonl" -type f)

if [ ${#transcript_files[@]} -eq 0 ]; then
  echo "⚠️  No transcript files found" >&2
  exit 0
fi

echo "📦 Found ${#transcript_files[@]} transcript files"
echo ""

# Confirm before proceeding
if [ -z "$OVERRIDE_PROJECT" ]; then
  echo "⚠️  About to import ${#transcript_files[@]} transcripts with AUTO-DETECTION"
  echo "   Each transcript will be auto-assigned to a project based on its path"
else
  echo "⚠️  About to import ${#transcript_files[@]} transcripts to project: $OVERRIDE_PROJECT"
fi

read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted." >&2
  exit 0
fi

# Import each transcript
success_count=0
skip_count=0
error_count=0

for transcript_file in "${transcript_files[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📥 Importing: $(basename "$transcript_file")"
  echo "   Path: $transcript_file"

  # Build import command
  import_cmd=("$IMPORT_SCRIPT" "$transcript_file")

  if [ -n "$OVERRIDE_PROJECT" ]; then
    import_cmd+=(--project "$OVERRIDE_PROJECT")
  fi

  # Run import (capture both stdout and stderr)
  if output=$("${import_cmd[@]}" 2>&1); then
    success_count=$((success_count + 1))
    echo "✅ Success"
    # Show auto-detected project if applicable
    if echo "$output" | grep -q "auto-detected"; then
      echo "$output" | grep "auto-detected"
    fi
  else
    # Check if already imported
    if echo "$output" | grep -q "already imported"; then
      skip_count=$((skip_count + 1))
      echo "⏭️  Already imported (skipped)"
    else
      error_count=$((error_count + 1))
      echo "❌ Error:"
      echo "$output"
    fi
  fi
  echo ""
done

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Import Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Total:   ${#transcript_files[@]}"
echo "   ✅ Success: $success_count"
echo "   ⏭️  Skipped: $skip_count"
echo "   ❌ Errors:  $error_count"
echo ""
echo "📂 Imported sessions location: $RETRO_ROOT/<project-name>/sessions/"
echo "📜 Import log: $RETRO_ROOT/logs/import.log"
echo ""

if [ "$error_count" -gt 0 ]; then
  echo "⚠️  Some imports failed. Check error messages above."
  exit 1
fi

echo "✅ Bulk import complete!"
