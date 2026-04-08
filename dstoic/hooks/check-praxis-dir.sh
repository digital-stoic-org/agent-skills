#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# PRAXIS_DIR Guard: Verify env var is set and points to a valid directory
# ==============================================================================
# Event: SessionStart (observability only — cannot block)
# stdout → enters Claude's context (visible to the model next turn)
# stderr → swallowed (goes to debug log only, user never sees it)
# exit 0 always — exit 2 is ignored on SessionStart
# ==============================================================================

if [ -z "${PRAXIS_DIR:-}" ]; then
  cat <<'EOF'
⚠️  PRAXIS_DIR is not set — running in degraded mode.
    Some skills (thinking artifacts, session logs, config) will be limited.
    Fix: export PRAXIS_DIR="$HOME/dev/praxis" in your shell profile.
EOF
  exit 0
fi

if [ ! -d "$PRAXIS_DIR" ]; then
  echo "⚠️  PRAXIS_DIR=$PRAXIS_DIR does not exist — running in degraded mode."
  exit 0
fi
