# 🗼 Phase 3: Sentinel — Git Boundary & Autonomous Safety

The last line. Everything before this protects the session. Phase 3 protects two boundaries that live outside Claude Code's control loop: **what gets committed to git**, and **what happens when no human is watching**.

## Why a third phase?

Phases 1 and 2 assume an interactive session with a human in the loop. But Claude Code also runs autonomously — background agents, subagent chains, scheduled tasks. An agent that enters an infinite loop burns tokens and can cause real damage. An agent that commits a secret to git has created a permanent leak (git history is forever, even after force-push).

These threats need different controls: pre-commit scanning and behavioral governors.

## Three components

### Gitleaks pre-commit 🔑

The only control that protects against **all** commit sources — not just Claude Code. Whether a human, a script, or an AI agent creates the commit, Gitleaks scans staged content for secrets before it reaches the repository.

**Why not rely on Phase 1 + 2?** Because secrets can enter the codebase through paths we haven't blocked. A new tool, a copy-paste, a file rename that escapes pattern matching. Gitleaks is the catch-all.

**The tradeoff**: 88% recall is good but not perfect — 12% of secrets slip through. 46% precision means roughly half of all flags are false positives. The `.gitleaksignore` file handles known exceptions, but expect some noise in the first week.

### Velocity governor ⏱️

Rate-limiting for autonomous agents. If a subagent issues more than 20 Bash commands in 5 minutes without meaningful progress, something is wrong — likely a loop. The governor blocks and warns.

**Read-only commands are exempt.** An agent doing `git log` + `grep` + `ls` twenty times is probably searching, not looping. Only state-changing commands count.

**The tuning challenge**: 20/5min is Bruniaux's starting point. Aggressive but legitimate agents (parallel file processing, bulk refactoring) may hit this. Monitor false positives in the first week and adjust.

### Heartbeat + watchdog 💓

Visibility into agent aliveness. The heartbeat hook writes a timestamp after every tool use. An external watchdog process checks: if the heartbeat is stale for 10+ minutes and the session is autonomous, kill it.

**Interactive sessions are never killed.** A human staring at the terminal for 10 minutes is thinking, not stuck.

**The watchdog is external** — a separate process, not a Claude Code hook. This is intentional: if CC itself is hung, its hooks don't fire. The watchdog operates independently.

## Review questions

1. **Is Gitleaks the right scanner?** Alternatives exist (truffleHog, detect-secrets). Gitleaks was chosen for its git integration and Bruniaux recommendation. Worth revisiting if precision is unacceptable.
2. **20 commands / 5 minutes — is that right for our usage?** Profile a typical autonomous session first. If legitimate agents regularly hit 15+, the threshold is too low.
3. **Watchdog kill safety** — What if the agent is doing something important but slow (large file processing, long API wait)? The heartbeat should still fire between tool calls. If it doesn't, the session is truly stuck.
4. **Who monitors the watchdog?** If the watchdog process dies, there's no safety net. Consider a systemd unit or cron check.

## Prerequisites

Phases 1 and 2 applied and tested. This phase adds the final layer.

→ Exact scripts, thresholds, and test commands: [sentinel-brief-llm.md](sentinel-brief-llm.md)
