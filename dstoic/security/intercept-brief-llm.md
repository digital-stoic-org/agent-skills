# Intercept — LLM Brief

Target: `dstoic/hooks/security-*.sh` + `settings.json`
REGISTRY rows: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 5.1, 5.3, 5.4, 5.6
Prereq: Phase 1 (perimeter) applied + smoke-tested

## Hook scripts

All in `dstoic/hooks/`. Stateless. Block = `exit 2`. No temp files, no shared state.

### 2a. security-dangerous-actions.sh

- Event: PreToolUse | Matcher: Bash
- Block patterns:
  - `rm -rf /`, `rm -rf ~`, `rm -rf .` (unscoped)
  - `DROP TABLE`, `DROP DATABASE`, `DELETE FROM` (no WHERE), `TRUNCATE`, `ALTER...DROP`
  - `git push --force main`, `git push --force master`
  - `dd if=`, `mkfs`, `:(){ :|:& };:`
  - Nested: `$(...)` and backticks containing blocked patterns
- Allow: `rm -rf node_modules/`, `rm -rf dist/`, `rm -rf .tmp/` (scoped deletes)

### 2b. security-prompt-injection.sh

- Event: PreToolUse | Matcher: Edit|Write
- Block patterns:
  - Role override: `ignore previous instructions`, `you are now`, `system:`, `<|im_start|>system`
  - Jailbreak: `DAN`, `do anything now`
  - Authority: `as an administrator`, `with root access`
  - Base64 payloads > 200 chars in non-code files
- Allow: base64 in `.js`, `.ts`, `.py` (legit encoding). Markdown code blocks with injection examples.

### 2c. security-unicode-injection.sh

- Event: PreToolUse | Matcher: Edit|Write
- Block patterns:
  - Zero-width: U+200B-200D, U+FEFF
  - RTL overrides: U+202A-202E, U+2066-2069
  - ANSI escapes: `\x1b[`, `\033[`
  - Null bytes: `\x00`
  - Tag chars: U+E0000-E007F
  - Confusable homoglyphs in identifiers
- Allow: `.po`, `.xliff`, paths with `i18n`/`l10n` — flag but don't block.

### 2d. security-output-scanner.sh

- Event: PostToolUse | Matcher: Bash
- Detect (warn only, don't block):
  - AWS access keys: `AKIA...`
  - AWS secret keys: 40-char base64
  - GitHub tokens: `ghp_`, `gho_`, `ghs_`
  - Generic API keys: 32+ hex/base64 after `key=`, `token=`, `secret=`
  - DB URLs with creds: `://user:pass@`
  - High-entropy base64 > 40 chars

### 2e. security-mcp-integrity.sh

- Event: SessionStart | Matcher: (none)
- Hash MCP config against `dstoic/security/.mcp-hash`
- First run (no hash): compute + store. User must verify config is clean first.
- Hash differs: warn, don't block.

## Additional permissions.deny

```
Edit(Dockerfile)
Edit(docker-compose.yml)
Edit(docker-compose.yaml)
Edit(.github/workflows/**)
Edit(terraform/**)
Edit(kubernetes/**)
Edit(k8s/**)
Bash(npm install *)
Bash(npm i *)
Bash(pip install *)
Bash(yarn add *)
Bash(pnpm add *)
```

Note: `npm install` (no args, lockfile-only) stays allowed. Only `npm install <package>` blocked.

## hooks.json registration

Security hooks BEFORE catch-all `""` matcher. Order matters.

```json
{
  "PreToolUse": [
    { "matcher": "Bash", "hooks": [{ "type": "command", "command": "dstoic/hooks/security-dangerous-actions.sh" }] },
    { "matcher": "Edit|Write", "hooks": [
      { "type": "command", "command": "dstoic/hooks/security-prompt-injection.sh" },
      { "type": "command", "command": "dstoic/hooks/security-unicode-injection.sh" }
    ] }
  ],
  "PostToolUse": [
    { "matcher": "Bash", "hooks": [{ "type": "command", "command": "dstoic/hooks/security-output-scanner.sh" }] }
  ],
  "SessionStart": [
    { "matcher": "", "hooks": [{ "type": "command", "command": "dstoic/hooks/security-mcp-integrity.sh" }] }
  ]
}
```

## Smoke tests

| Test | Expected |
|------|----------|
| `echo '{"tool_input":{"command":"rm -rf /"}}' \| ./security-dangerous-actions.sh` | Exit 2 |
| `echo '{"tool_input":{"command":"rm -rf node_modules/"}}' \| ./security-dangerous-actions.sh` | Exit 0 |
| Write file containing `ignore previous instructions` | Blocked |
| Write file containing zero-width chars | Blocked |
| Command outputs `AKIAIOSFODNN7EXAMPLE` | Warning |
| Modify MCP config → new session | Warning |
| `Edit(Dockerfile)` | Blocked by permissions.deny |
| `npm install lodash` | Blocked by permissions.deny |

## Checklist

- [ ] Dangerous-actions: scoped deletes (node_modules, dist, .tmp) pass
- [ ] Prompt-injection: markdown code blocks with examples don't trigger
- [ ] Unicode: i18n/l10n files flag but don't block
- [ ] Output-scanner: warn-only (not block)
- [ ] MCP integrity: clean bootstrap path documented
- [ ] Security hooks ordered before catch-all in hooks.json
- [ ] `npm install` (no args) still works
