#!/usr/bin/env bash
# verify-url.sh — ACL: wraps agent-browser open/snapshot/screenshot/close
# Usage: verify-url.sh <url> [--screenshot]
set -euo pipefail

URL="${1:-}"
if [[ -z "$URL" ]]; then
  echo "Usage: verify-url.sh <url> [--screenshot]" >&2
  exit 1
fi

SCREENSHOT=false
for arg in "${@:2}"; do
  if [[ "$arg" == "--screenshot" ]]; then
    SCREENSHOT=true
  fi
done

agent-browser open "$URL"

if [[ "$SCREENSHOT" == true ]]; then
  agent-browser screenshot
else
  agent-browser snapshot -i
fi

agent-browser close
