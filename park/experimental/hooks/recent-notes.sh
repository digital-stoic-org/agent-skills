#!/bin/bash
set -e

# ==============================================================================
# Recent Notes Hook (Staging Plugin)
# ==============================================================================
# Purpose: Write a "recently modified notes" index into the vault so it can be
#          browsed on mobile (e.g. via Ignis) — the mobile equivalent of a
#          recent-files view. Regenerates on every Stop so it's fresh when viewed.
# Usage: Triggered by Stop hook event.
# Input: JSON on stdin (from Claude Code hooks).
# Output: $PRAXIS_DIR/logs/recent-notes.md (table of newest .md, tappable wikilinks)
# Env: LIMIT (default 40) — number of notes to list.
# ==============================================================================

# Portability gate: silently no-op unless dstoic hooks opted-in AND PRAXIS_DIR set.
{ [ "${EXPERIMENTAL_HOOKS_ENABLED:-0}" = "1" ] && [ -n "${PRAXIS_DIR:-}" ]; } || exit 0

# Read hook input; bail on Stop-loop continuation to avoid re-triggering.
input=$(cat)
stop_active=$(echo "$input" | jq -r '.stop_hook_active // false')
[ "$stop_active" = "true" ] && exit 0

VAULT="$PRAXIS_DIR"
LIMIT="${LIMIT:-40}"
OUT="$VAULT/logs/recent-notes.md"
[ -d "$VAULT/logs" ] || mkdir -p "$VAULT/logs"

# Recent .md, junk pruned (skips descending into dep/build dirs — fast on big trees),
# the report itself excluded, newest first. Full-path wikilinks avoid the
# duplicate-basename ambiguity (many tasks.md / NOTES.md across projects).
query() {
  find "$VAULT" \
    \( -type d \( -name node_modules -o -name .venv -o -name .git \
       -o -name __pycache__ -o -name .in -o -name code \
       -o -path "*/thinking/dumps" \) -prune \) -o \
    \( -type f -name "*.md" ! -path "$OUT" \
       -printf '%TY-%Tm-%Td %TH:%TM\t%P\n' \) 2>/dev/null \
    | sort -r | head -n "$LIMIT"
}

{
  echo "# 🕒 Recent notes"
  echo
  echo "_Last $LIMIT modified, newest first. Auto-updated on each Claude Code Stop._"
  echo
  echo "| Modified | Note |"
  echo "|---|---|"
  query | while IFS=$'\t' read -r ts path; do
    name="${path%.md}"              # full relative path, no extension
    base="${path##*/}"; alias="${base%.md}"
    echo "| $ts | [[$name\|$alias]] |"
  done
} > "$OUT"

exit 0
