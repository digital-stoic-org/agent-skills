# coach

Coaching plugin for Claude Code. Two domains: **personal** (CLEAR protocol — anxiety-first surfacing, Goldsmith accountability) and **signal** (GROW protocol — strategic positioning, network targeting, signal-gap scanning).

## Invocation

```
/coach              # Personal coaching session (default)
/coach personal     # Explicit personal domain
/coach signal       # Strategic signal coaching session
/coach pro          # Pro/work domain (stub — not yet implemented)
/coach family       # Family domain (stub — not yet implemented)
/coach review       # Weekly review (stub — not yet implemented)
```

## What it does

### Personal domain (`/coach` or `/coach personal`)

1. **Pulse check** — captures energy/mood/stress (1-10) and today's focus
2. **Anxiety surfacing** — "What are you avoiding right now?"
3. **Accountability** — reviews previous session commitment
4. **Explore & reframe** — links avoidance to OKRs and health projects
5. **Commit** — one specific action with a deadline
6. **Review** — "What shifted in this session?"

### Signal domain (`/coach signal`)

1. **Signal scorecard** — 1:1 count, tech ratio, online signals, follow-ups, active streams
2. **Positioning check** — upcoming interactions mapped to streams + audience claims
3. **Accountability** — reviews previous signal commitment (Goldsmith)
4. **Signal-gap scan** — reads project context, suggests 2-3 signal opportunities tagged strategic/operational
5. **Commit** — one action (person or post) + deadline
6. **Debrief + persist** — capture recent 1:1s, write scorecard + session to coaching log

Session output is persisted to `06-coaching/daily/YYYY-MM-DD.md` in your GTD vault. Both domains share the same daily file with isolated frontmatter blocks (`coaching:` vs `signal:`).

## Data

- **Reads**: `05-tracker/` (habits, read-only), `02-views/00-okrs.md` (OY7 KRs), `03-projects/` (health + signal-gap scan, read-only)
- **Writes**: `06-coaching/daily/YYYY-MM-DD.md` (pulse/scorecard frontmatter + session output)
