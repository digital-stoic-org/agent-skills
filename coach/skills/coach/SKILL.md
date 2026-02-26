---
name: coach
description: Coaching session — personal (CLEAR protocol, anxiety-first, Goldsmith accountability) or signal (GROW protocol, strategic positioning, network targeting). Reads pulse/scorecard, surfaces avoidance or signal gaps, reviews last commitment, reframes, commits, persists to coaching log.
allowed-tools: ["Read", "Write", "Glob", "Grep", "Bash"]
model: sonnet
context: fork
user-invocable: true
argument-hint: "[personal|signal|pro|family|review]"
---

# Coach

Run a structured coaching session.

## Step 0: Load Config

Read `coach-config.yaml` (same directory as this file). All vault paths in this skill and `reference.md` refer to keys from this config. Resolve `YYYY-MM-DD` patterns with today's date. All paths are relative to `vault_path` from config.

If config file missing → ask user: "No coach-config.yaml found. Please copy the template and customize your vault paths."

## Subcommand Routing

Parse `$ARGUMENTS` (first word, lowercase):

| Input | Action |
|-------|--------|
| (none) or `personal` | Run CLEAR protocol — see reference.md § Personal 6-Step Protocol |
| `signal` | Run Strategic Signal Protocol — see reference.md § Signal Domain |
| `pro` | Stub: "Pro coaching not built yet. Use `/coach` for personal." |
| `family` | Stub: "Family coaching not built yet. Use `/coach` for personal." |
| `review` | Stub: "Weekly review not built yet. Use `/coach` for daily session." |

## Personal Session

Load `reference.md` and follow the 6-step protocol exactly in order (1-Pulse, 2-Surface, 3-Accountability, 4-Explore, 5-Commit, 6-Review). Complete ALL 6 steps in a single response — do not stop after Step 5 or defer Step 6 to a follow-up turn.

Vault paths from config `personal:` section:
- Coaching log: `personal.coaching_log`
- Habits context: `personal.habits_path` (read-only)
- OKRs: `personal.okr_file` → section matching `personal.okr_section`
- Projects: `personal.project_refs[]` (read-only)

## Signal Session

Load `reference.md` and follow the 6-step Strategic Signal Protocol in order (1-Scorecard, 2-Positioning, 3-Accountability, 4-Signal-Gap Scan, 5-Commit, 6-Debrief+Persist). Complete ALL 6 steps in a single response.

Vault paths from config `signal:` section:
- Coaching log: `signal.coaching_log` (read `signal:` block + write signal session)
- Projects: `signal.project_refs` glob (read-only, for signal-gap scan)
- Streams: `signal.streams` (active stream definitions)
- Previous sessions: same coaching log dir (read-only, for accountability)

## Invariants

- MUST capture pulse (energy/mood/stress) before proceeding (personal domain)
- MUST capture signal scorecard (counts, not feelings) before proceeding (signal domain)
- MUST produce a commitment (action + deadline) before review
- MUST write session output to coaching log path — never to habits or project paths
- stress > 7 → surface emotional regulation flag before anxiety step (personal domain only)
- Signal domain MUST NOT modify `coaching:` frontmatter block (domain isolation)
- Personal domain MUST NOT modify `signal:` frontmatter block (domain isolation)
