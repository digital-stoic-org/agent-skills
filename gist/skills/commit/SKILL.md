---
name: commit
description: Impact map of the git state before committing (gist:commit). Scans /praxis and the alias data repos, classifies every changed file into 2 planes x 6 kinds (harness, steering, trace | deliverable, input, generated), groups them by project, flags risky changes (deleted with no copy, half-staged move, reopened checkbox, to-reread marker, generated files, secrets) and builds a radar page (treemap, who-reads-it matrix, ranked projects with Validate/Later/Exclude) that outputs one chained shell block of git add + ccommit for Mat to paste. Use whenever Mat wants to review, validate or commit his pending changes, asks what changed, what is impacted, "commit plan", "carte d'impact", "qu'est-ce que je commite", or before any multi-project commit — even if he does not name the skill.
---

# gist:commit

Mat reviews the git state on one page and commits by pasting a block himself. Scripts do the mechanics (0 token); the agent only adds who-reads-it links (v0). The agent never stages or commits.

Skill dir: `/repos/agent-skills/gist/skills/commit/` · run Python from `/praxis/.venv` (`. /praxis/.venv/bin/activate`).

## Steps

1. **Scan** (read-only, ~1 s): `python3 <dir>/scan.py` → `/praxis/.tmp/commit/scan.json`, prints one line per project. Extra repo outside `/repos`: `--repo PATH`.
2. **Annotate (agent, v0)**: write `/praxis/.tmp/commit/notes.json` with `targets` and per-project `readers` (format in `make-page.py --help`). Only for projects with harness or steering files, or a path other projects cite. Find links with bounded greps: the changed path cited verbatim elsewhere = `sure`; wikilink or name match only = `likely`. Designate existing project ids and your own target ids; the code copies, never invents. Extra `alerts` only with a concrete evidence string. Skip trace-only projects. Never open a secret path.
3. **Page**: `python3 <dir>/make-page.py /praxis/.tmp/commit/scan.json --notes /praxis/.tmp/commit/notes.json` → `/praxis/build/commit-map.html`, then `python3 /repos/agent-skills/gist/skills/verdict/check-page.py /praxis/build/commit-map.html`. Curl `http://100.64.0.1:8000/build/commit-map.html` before giving Mat the URL.
4. **Mat**: V on what he commits (silence = Later, nothing committed), answers the 🎯 decisions, opens `🚀 Commands`, pastes the block in his terminal. One project = `git add -A -- <paths>` + `ccommit <common dir>` (Haiku writes the message, direct commit).
5. State moved (Mat or another session committed) → rescan, rebuild; never reuse an old page.

## Gotchas

- `ccommit` (`/praxis/code/live/ccommit`) never stages: it commits what is staged under its path. The block stages first; its guard stops the whole run if an index is already loaded, otherwise stray staged files would join the commit.
- The review id is derived from the snapshot time, so picks never carry over to a newer git state. Changing option values in the page also needs a new id, or stale localStorage verdicts match no option.
- Plane = file kind, not location. A deliverable kept in a control repo falls to steering (rule r6 default); `↔` marks files whose kind and repo disagree (e.g. skills in `/repos/agent-skills`).
- Decisions exist only where each answer changes `git add`; each option lists what it excludes and exclusions of all decisions add up.
- The verdict chrome is translated on the copy by an asserted string list (`CHROME` in `make-page.py`): if the verdict template changes, the build exits naming the missing strings — update the list, never the template.
- Untracked folders stay collapsed: one entry with a file count. Classification of a collapsed folder uses the folder path only.
- Proto CSS lives in the content zone; class names avoid the verdict `.sk` sketch names (`.tm .ph .hl`).

## Files

| file | role |
|---|---|
| `taxonomy.py` | kinds, weights, path rules r1-r6, secret list (same as ccommit) |
| `scan.py` | git snapshot, grouping, deterministic detectors and decisions → scan JSON |
| `make-page.py` | scan + notes JSON → page on `../verdict/template.html` (treemap, phone map, matrix, ranked rows, commands, tooltips) |

Workshop (plan, wireframes, prototype): `/praxis/repos/agent-skills/gist/commit/wip/`.
