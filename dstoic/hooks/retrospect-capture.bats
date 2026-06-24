#!/usr/bin/env bats
# ==============================================================================
# Self-test for the retrospect-capture hook + finalize round-trip.
# Drives the REAL hook script against a throwaway .retro root (no global state).
# Asserts meta-prompt §4 invariants:
#   - SessionStart..SessionEnd promotes staging -> YAML, leaving NO orphan
#   - model field is populated from the SessionStart payload (not "unknown")
#   - large tool_output is truncated in the captured event
#   - a finalize failure NEVER silently drops staging (no-silent-drop guard)
# Run: bats dstoic/hooks/retrospect-capture.bats
# ==============================================================================

setup() {
  HOOK="${BATS_TEST_DIRNAME}/retrospect-capture.sh"
  [ -x "$HOOK" ] || skip "hook not found/executable: $HOOK"
  command -v jq >/dev/null || skip "jq required"

  # Isolated fake project (its own git repo so detect_project_name resolves)
  PROJECT_DIR="$(mktemp -d)"
  git -C "$PROJECT_DIR" init -q
  export CLAUDE_PROJECT_DIR="$PROJECT_DIR"

  # Point the archive at a throwaway root; opt the portability gate in.
  export RETRO_ROOT="$PROJECT_DIR/.retro"
  export PRAXIS_DIR="$PROJECT_DIR"
  export EXPERIMENTAL_HOOKS_ENABLED=1

  SID="bats-$$-${RANDOM}"
  PROJ_NAME="$(basename "$PROJECT_DIR")"
  SESSIONS_DIR="$RETRO_ROOT/$PROJ_NAME/sessions"
  STAGING_DIR="$SESSIONS_DIR/.staging"
}

teardown() {
  [ -n "${PROJECT_DIR:-}" ] && rm -rf "$PROJECT_DIR"
}

# Emit an event through the hook: feed(<EventName>) reads JSON from stdin arg $2
feed() {
  echo "$2" | "$HOOK" "$1"
}

@test "round-trip: SessionStart..SessionEnd promotes to YAML with no orphan" {
  feed SessionStart "$(jq -nc --arg s "$SID" --arg c "$PROJECT_DIR" \
    '{session_id:$s, cwd:$c, permission_mode:"default", transcript_path:"", model:"claude-opus-4-8"}')"
  feed UserPromptSubmit "$(jq -nc --arg s "$SID" '{session_id:$s, prompt:"hello"}')"
  feed PostToolUse "$(jq -nc --arg s "$SID" \
    '{session_id:$s, tool_name:"Bash", tool_input:{command:"echo hi"}, tool_response:{output:"hi"}}')"
  feed SessionEnd "$(jq -nc --arg s "$SID" '{session_id:$s, reason:"user_exit"}')"

  # Exactly one finalized YAML, and NO leftover staging file.
  run bash -c "ls '$SESSIONS_DIR'/*_${SID}.yaml 2>/dev/null | wc -l"
  [ "$output" = "1" ]
  [ ! -f "$STAGING_DIR/${SID}.jsonl" ]
}

@test "model field is populated from SessionStart payload" {
  feed SessionStart "$(jq -nc --arg s "$SID" --arg c "$PROJECT_DIR" \
    '{session_id:$s, cwd:$c, permission_mode:"default", transcript_path:"", model:"claude-opus-4-8"}')"
  feed SessionEnd "$(jq -nc --arg s "$SID" '{session_id:$s, reason:"user_exit"}')"

  local yaml
  yaml="$(ls "$SESSIONS_DIR"/*_"${SID}".yaml)"
  run grep -E '^model: "claude-opus-4-8"$' "$yaml"
  [ "$status" -eq 0 ]
}

@test "large tool_output is truncated in the captured event" {
  feed SessionStart "$(jq -nc --arg s "$SID" --arg c "$PROJECT_DIR" \
    '{session_id:$s, cwd:$c, permission_mode:"default", transcript_path:"", model:"x"}')"
  local big; big="$(head -c 9000 /dev/zero | tr '\0' 'A')"
  feed PostToolUse "$(jq -nc --arg s "$SID" --arg o "$big" \
    '{session_id:$s, tool_name:"Bash", tool_input:{command:"big"}, tool_response:{output:$o}}')"

  run grep -c 'TRUNCATED' "$STAGING_DIR/${SID}.jsonl"
  [ "$status" -eq 0 ]
  [ "$output" -ge 1 ]
}

@test "no-silent-drop: finalize failure keeps staging intact" {
  # Build a normal staging file, then corrupt the lib so finalize write fails.
  feed SessionStart "$(jq -nc --arg s "$SID" --arg c "$PROJECT_DIR" \
    '{session_id:$s, cwd:$c, permission_mode:"default", transcript_path:"", model:"x"}')"
  feed UserPromptSubmit "$(jq -nc --arg s "$SID" '{session_id:$s, prompt:"keep me"}')"
  [ -f "$STAGING_DIR/${SID}.jsonl" ]

  # Make the sessions dir read-only so the YAML write/promote fails.
  chmod a-w "$SESSIONS_DIR"
  run feed SessionEnd "$(jq -nc --arg s "$SID" '{session_id:$s, reason:"user_exit"}')"
  chmod u+w "$SESSIONS_DIR"

  # Staging MUST still exist (no silent drop) and recovery.log must note it.
  [ -f "$STAGING_DIR/${SID}.jsonl" ]
  run grep -q 'FINALIZE-FAIL' "$RETRO_ROOT/logs/recovery.log"
  [ "$status" -eq 0 ]
}
