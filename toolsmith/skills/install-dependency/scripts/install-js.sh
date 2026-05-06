#!/bin/bash
# Install JavaScript package
# Usage: install-js.sh <package> [shared|local]

set -e

PACKAGE="$1"
MODE="${2:-local}"

if [ -z "$PACKAGE" ]; then
  echo "Usage: install-js.sh <package> [shared|local]"
  exit 1
fi

GIT_ROOT="${GIT_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || echo "")}"
LOCAL_TMP="${LOCAL_TMP:-${PWD}/.tmp}"

# Ensure bun is installed
ensure_bun() {
  if ! command -v bun &>/dev/null; then
    echo "Installing bun..."
    export TMPDIR="$LOCAL_TMP"
    export BUN_TMPDIR="$LOCAL_TMP"
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
  fi
}

install_shared() {
  local pkg="$1"
  if [ -z "$GIT_ROOT" ]; then
    echo "ERROR: Not in a git repository, cannot install shared"
    exit 1
  fi

  ensure_bun
  echo "Installing $pkg in shared location ($GIT_ROOT)..."
  bun add "$pkg" --cwd "$GIT_ROOT"
  echo "INSTALLED:$GIT_ROOT/node_modules"
}

install_local() {
  local pkg="$1"

  ensure_bun
  echo "Installing $pkg locally..."
  bun add "$pkg"
  echo "INSTALLED:$PWD/node_modules"
}

case "$MODE" in
  shared) install_shared "$PACKAGE" ;;
  local)  install_local "$PACKAGE" ;;
  *)      echo "Unknown mode: $MODE (use shared|local)"; exit 1 ;;
esac
