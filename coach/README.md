# coach

Personal coaching plugin for Claude Code. Runs structured coaching sessions using the CLEAR protocol with anxiety-first surfacing and Goldsmith accountability loop.

## Invocation

```
/coach              # Personal coaching session (default)
/coach personal     # Explicit personal domain
/coach pro          # Pro/work domain (stub — not yet implemented)
/coach family       # Family domain (stub — not yet implemented)
/coach review       # Weekly review (stub — not yet implemented)
```

## What it does

1. **Pulse check** — captures energy/mood/stress (1-10) and today's focus
2. **Anxiety surfacing** — "What are you avoiding right now?"
3. **Accountability** — reviews previous session commitment
4. **Explore & reframe** — links avoidance to OKRs and health projects
5. **Commit** — one specific action with a deadline
6. **Review** — "What shifted in this session?"

Session output is persisted to `06-coaching/daily/YYYY-MM-DD.md` in your GTD vault.

## Data

- **Reads**: `05-tracker/` (habits, read-only), `02-views/00-okrs.md` (OY7 KRs), `03-projects/37-39-*.md` (health)
- **Writes**: `06-coaching/daily/YYYY-MM-DD.md` (pulse frontmatter + session output)
