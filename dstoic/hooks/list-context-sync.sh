#!/bin/bash
set -euo pipefail

# ==============================================================================
# Praxis Sync: Opportunistic Session-Start Maintenance
# ==============================================================================
# Stop wasting session starts on manual housekeeping
# Purpose: Run daily sync tasks on session start (fire-and-forget)
# Trigger: SessionStart hook (async)
# Input: JSON on stdin (from Claude Code hooks)
# Safety: Idempotent, praxis-only, respects user permission gates
# ==============================================================================

# --- Read hook input from stdin ---
INPUT_JSON=$(cat)

# --- Detect project context ---
CWD=$(echo "$INPUT_JSON" | jq -r '.cwd // ""')
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$CWD}"

# Early exit: not a praxis project
if [[ "$PROJECT_DIR" != *"praxis"* ]]; then
  exit 0
fi

# --- Configuration ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_ROOT=$(git -C "$PROJECT_DIR" rev-parse --show-toplevel 2>/dev/null || echo "")
if [ -z "$GIT_ROOT" ]; then
  exit 0
fi
TMP_DIR="$GIT_ROOT/.tmp"
SYNC_STATE_DIR="$TMP_DIR/list-context-sync"
TODAY=$(date +%Y%m%d)
LOG_FILE="$TMP_DIR/list-context-sync.log"

# Ensure directories exist
mkdir -p "$SYNC_STATE_DIR"

# --- Logging helper ---
log() {
  echo "[list-context-sync $(date -u +%H:%M:%S)] $*" >> "$LOG_FILE"
}

log "=== Session start detected (cwd: $CWD) ==="

# ==============================================================================
# Phase 1: Context Sync (once per day)
# ==============================================================================
SYNC_MARKER="$SYNC_STATE_DIR/${TODAY}-context-sync"

if [ ! -f "$SYNC_MARKER" ]; then
  log "Phase 1: Running context sync..."

  # Invoke list-contexts --sync headlessly
  if command -v claude &>/dev/null; then
    claude -p "/list-contexts --sync" --project-dir "$GIT_ROOT" >> "$LOG_FILE" 2>&1 &
    log "Phase 1: Context sync spawned (PID: $!)"
  else
    log "Phase 1: SKIP — claude CLI not found"
  fi

  touch "$SYNC_MARKER"
else
  log "Phase 1: SKIP — already synced today"
fi

# ==============================================================================
# Phase 2: Git Notification (notify only, never auto-push)
# ==============================================================================
if command -v git &>/dev/null && git -C "$PROJECT_DIR" rev-parse --git-dir &>/dev/null 2>&1; then
  UNPUSHED=$(git -C "$PROJECT_DIR" log --oneline --branches --not --remotes 2>/dev/null | wc -l)

  if [ "$UNPUSHED" -gt 0 ]; then
    log "Phase 2: ⚠️  $UNPUSHED unpushed commit(s) (manual push required)"
    echo "[list-context-sync] ⚠️  $UNPUSHED unpushed commit(s) — manual push required" >&2
  else
    log "Phase 2: All commits pushed"
  fi
fi

# ==============================================================================
# Cleanup: Remove stale state markers (older than 2 days)
# ==============================================================================
find "$SYNC_STATE_DIR" -type f -mtime +2 -delete 2>/dev/null || true

log "=== Session sync complete ==="
exit 0
