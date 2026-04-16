# Sentinel — LLM Brief

Target: git pre-commit hook + `dstoic/hooks/` + external watchdog
REGISTRY rows: 4.1, 4.2, 6.1, 6.2
Prereq: Phase 1 (perimeter) + Phase 2 (intercept) applied + tested

## 3a. Gitleaks pre-commit

Install: binary or package manager.
Hook: `.git/hooks/pre-commit` or via Husky/lefthook.
Config: `.gitleaksignore` for known exceptions (test fixtures, example keys).

Patterns detected: AWS keys, GCP service account keys, GitHub tokens, Slack tokens, Stripe keys, RSA/EC/DSA private keys, generic high-entropy `key=`/`secret=`/`token=` strings.

Stats: 88% recall, 46% precision.
Gap: staged content only. Unstaged files + env vars covered by phase 1 + 2.

## 3b. Velocity governor

Script: `dstoic/hooks/security-velocity-governor.sh`
- Event: PreToolUse | Matcher: Bash
- Sliding window: 5 minutes
- Threshold: >20 commands → block + warn
- State: `/tmp/cc-velocity-$$` (PID-scoped, cleaned on session end)
- Exempt: read-only commands (ls, cat, grep, git status, git log, git diff)
- Reset: on user interaction

## 3c. Heartbeat + watchdog

### Heartbeat
Script: `dstoic/hooks/security-autonomous-heartbeat.sh`
- Event: PostToolUse | Matcher: (all)
- Writes timestamp to `/tmp/cc-heartbeat-$$`

### Watchdog
Script: `dstoic/security/watchdog.sh` (external, not a CC hook)
- Check heartbeat file age
- If >10 min stale AND session is autonomous → kill CC process
- Detection: check for `--dangerouslySkipPermissions` or subagent markers
- Never kills interactive sessions
- Run via: cron, tmux, or monitoring wrapper

## Smoke tests

| Test | Expected |
|------|----------|
| Commit file containing `AKIAIOSFODNN7EXAMPLE` | Gitleaks blocks commit |
| Add to `.gitleaksignore`, retry | Commit succeeds |
| 21 Bash commands in 5 min | Velocity governor blocks 21st |
| 21 `git status` commands in 5 min | No block (read-only exempt) |
| No commands for 10+ min, autonomous mode | Watchdog kills session |
| No commands for 10+ min, interactive mode | No kill |

## Checklist

- [ ] Gitleaks version current (check for CVEs in Gitleaks itself)
- [ ] `.gitleaksignore` covers test fixtures
- [ ] Velocity window (20/5min) profiled against real usage
- [ ] Read-only commands correctly exempted
- [ ] Watchdog distinguishes autonomous vs interactive
- [ ] Heartbeat file cleaned up on session end
- [ ] Watchdog has permissions to kill CC processes
