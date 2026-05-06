#!/bin/bash
# Install Python package
# Usage: install-python.sh <package> [shared|local]

set -e

PACKAGE="$1"
MODE="${2:-local}"

if [ -z "$PACKAGE" ]; then
  echo "Usage: install-python.sh <package> [shared|local]"
  exit 1
fi

GIT_ROOT="${GIT_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || echo "")}"

install_shared() {
  local pkg="$1"
  if [ -z "$GIT_ROOT" ]; then
    echo "ERROR: Not in a git repository, cannot install shared"
    exit 1
  fi

  local venv="$GIT_ROOT/.venv"
  if [ ! -d "$venv" ]; then
    echo "Creating shared venv at $venv..."
    python3 -m venv "$venv"
    "$venv/bin/pip" install --upgrade pip
  fi

  echo "Installing $pkg in shared venv..."
  "$venv/bin/pip" install "$pkg"
  echo "INSTALLED:$venv"
}

install_local() {
  local pkg="$1"
  local venv=".venv"

  if [ ! -d "$venv" ]; then
    echo "Creating local venv at $PWD/$venv..."
    python3 -m venv "$venv"
    "$venv/bin/pip" install --upgrade pip
  fi

  echo "Installing $pkg in local venv..."
  "$venv/bin/pip" install "$pkg"
  echo "INSTALLED:$PWD/$venv"
}

case "$MODE" in
  shared) install_shared "$PACKAGE" ;;
  local)  install_local "$PACKAGE" ;;
  *)      echo "Unknown mode: $MODE (use shared|local)"; exit 1 ;;
esac
