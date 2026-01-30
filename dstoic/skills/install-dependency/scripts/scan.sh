#!/bin/bash
# Scan for existing package installation
# Usage: scan.sh <package> <type>
# type: python|js|system
# Exit codes: 0=found, 1=not found

set -e

PACKAGE="$1"
TYPE="$2"

if [ -z "$PACKAGE" ] || [ -z "$TYPE" ]; then
  echo "Usage: scan.sh <package> <type>"
  echo "  type: python|js|system"
  exit 2
fi

GIT_ROOT="${GIT_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || echo "")}"

scan_python() {
  local pkg="$1"
  for dir in . .. ../.. "$GIT_ROOT"; do
    if [ -n "$dir" ] && [ -d "$dir/.venv" ]; then
      if "$dir/.venv/bin/pip" show "$pkg" &>/dev/null; then
        echo "FOUND:$dir/.venv"
        exit 0
      fi
    fi
  done
  echo "NOT_FOUND"
  exit 1
}

scan_js() {
  local pkg="$1"
  for dir in . .. ../.. "$GIT_ROOT"; do
    if [ -n "$dir" ] && [ -f "$dir/node_modules/$pkg/package.json" ]; then
      echo "FOUND:$dir/node_modules"
      exit 0
    fi
  done
  echo "NOT_FOUND"
  exit 1
}

scan_system() {
  local pkg="$1"
  if command -v "$pkg" &>/dev/null; then
    echo "FOUND:$(which "$pkg")"
    exit 0
  fi
  echo "NOT_FOUND"
  exit 1
}

case "$TYPE" in
  python) scan_python "$PACKAGE" ;;
  js)     scan_js "$PACKAGE" ;;
  system) scan_system "$PACKAGE" ;;
  *)      echo "Unknown type: $TYPE"; exit 2 ;;
esac
