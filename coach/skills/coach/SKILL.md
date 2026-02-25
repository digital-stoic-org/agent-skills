---
name: coach
description: Personal coaching session using CLEAR protocol with anxiety-first surfacing and Goldsmith accountability loop. Reads today's pulse, surfaces avoidance, reviews last commitment, reframes, commits, persists to 06-coaching/daily/.
model: sonnet
context: fork
user-invocable: true
argument-hint: "[personal|signal|pro|family|review]"
---

# Coach

Run a structured coaching session.

## Subcommand Routing

Parse `$ARGUMENTS` (first word, lowercase):

| Input | Action |
|-------|--------|
| (none) or `personal` | Run CLEAR protocol — see reference.md § Personal Domain |
| `signal` | Run Strategic Signal Protocol — see reference.md § Signal Domain |
| `pro` | Stub: "Pro coaching not built yet. Use `/coach` for personal." |
| `family` | Stub: "Family coaching not built yet. Use `/coach` for personal." |
| `review` | Stub: "Weekly review not built yet. Use `/coach` for daily session." |

## Personal Session

Load `reference.md` and follow the 6-step protocol exactly in order (1-Pulse, 2-Surface, 3-Accountability, 4-Explore, 5-Commit, 6-Review). Complete ALL 6 steps in a single response — do not stop after Step 5 or defer Step 6 to a follow-up turn.

Vault paths (all relative to `/home/mat/dev/gtd-pcm/`):
- Coaching log: `06-coaching/daily/YYYY-MM-DD.md`
- Habits context: `05-tracker/` (read-only)
- OKRs: `02-views/00-okrs.md` (OY7 section)
- Health projects: `03-projects/37-health.md`, `03-projects/38-mind-body.md`, `03-projects/39-mental-health.md`

## Signal Session

Load `reference.md` and follow the 6-step Strategic Signal Protocol in order (1-Scorecard, 2-Positioning, 3-Accountability, 4-Signal-Gap Scan, 5-Commit, 6-Debrief+Persist). Complete ALL 6 steps in a single response.

Vault paths (all relative to `$VAULT_PATH` — default `/home/mat/dev/gtd-pcm/`):
- Coaching log: `06-coaching/daily/YYYY-MM-DD.md` (read `signal:` block + write signal session)
- Projects: `03-projects/*/01-*.md` (read-only, for signal-gap scan)
- Previous sessions: `06-coaching/daily/*.md` (read-only, for accountability)

## Invariants

- MUST capture pulse (energy/mood/stress) before proceeding (personal domain)
- MUST capture signal scorecard (counts, not feelings) before proceeding (signal domain)
- MUST produce a commitment (action + deadline) before review
- MUST write session output to `06-coaching/daily/` — never to `05-tracker/` or `03-projects/`
- stress > 7 → surface emotional regulation flag before anxiety step (personal domain only)
- Signal domain MUST NOT modify `coaching:` frontmatter block (domain isolation)
