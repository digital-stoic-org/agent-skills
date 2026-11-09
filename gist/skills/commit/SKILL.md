---
name: commit
description: Impact map of the git state before committing (gist:commit). Scans the workspace repo and its alias data repos, classifies every changed file into 2 planes x 6 kinds (harness, steering, trace | deliverable, input, generated), groups them by project, flags risky changes (deleted with no copy, half-staged move, reopened checkbox, to-reread marker, generated files, secrets) and builds a radar page (treemap, who-reads-it matrix, ranked projects with Validate/Later/Exclude) that outputs one chained shell block of git add + commit for the user to paste, plus a read-only file viewer (Rendered / Diff / Raw: Markdown, Mermaid, HTML, images) opened from each project. Use whenever the user wants to review, validate or commit pending changes, asks what changed, what is impacted, "commit plan", "carte d'impact", "qu'est-ce que je commite", or before any multi-project commit — even if they do not name the skill.
---

# gist:commit

The user reviews the git state on one page and commits by pasting a block themselves. Scripts do the mechanics (0 token); the agent only adds who-reads-it links (v0). The agent never stages or commits.

Scripts: `<skill-dir>/scan.py`, `<skill-dir>/make-page.py` (stdlib only, `python3`). Run them from inside the workspace: the config is found from the git root of the current folder.

## Steps

1. **Scan** (read-only, ~1 s): `python3 <skill-dir>/scan.py` → `<tmp>/scan.json` + `<tmp>/scan-view.json` (viewer data: diffs, snapshot copies); prints the config used and one line per project. Extra repo: `--repo PATH`.
2. **Annotate (agent, v0)**: write `<tmp>/notes.json` with `targets` and per-project `readers` (format: `make-page.py --help`). Only for projects with harness or steering files, or a path other projects cite. Bounded greps: changed path cited verbatim elsewhere = `sure`; wikilink or name match only = `likely`. Designate existing project ids and your own target ids; the code copies, never invents. Extra `alerts` only with a concrete evidence string. Skip trace-only projects. Never open a secret path.
3. **Page**: `python3 <skill-dir>/make-page.py <tmp>/scan.json --notes <tmp>/notes.json` → writes `<out>` and, next to it, the viewer (`commit-view.html`, `commit-view.js`, `commit-vendor/`), removes `<tmp>` (keep it with `--keep`), prints the URL (`serve_url`) or the file path. Check it: `python3 <skill-dir>/../verdict/check-page.py <out>`; with a URL, curl it before handing it over.
4. **User**: opens a row, clicks a file name or `View the N files →` to read files in the viewer tab; V on what they commit (silence = Later, nothing committed), answers the 🎯 decisions, opens `🚀 Commands`, pastes the block in a terminal: per project `git add -A -- <paths>` then `commit_cmd`.
5. State moved (another commit, another session) → rescan, rebuild; never reuse an old page.

## Config

`<git root>/.claude/gist-commit.json`, optional; CLI flags win over it. No file = the git repo of the current folder only, output under its `build/` and `.tmp/commit/`, file path instead of URL.

| key | default | role |
|---|---|---|
| `root` | git root of cwd | workspace repo |
| `control_dir` | none | folder of `root` holding one control folder per alias (e.g. `repos`) |
| `data_repo` | none | data repo pattern per alias, e.g. `/repos/{alias}`; kept when it is a git repo |
| `data_repos` | `{}` | explicit `alias: path` exceptions; a non-repo entry is reported as skipped |
| `monorepos` | `[]` | repo names split by first sub-folder (one plugin = one project) |
| `out` · `tmp` | `build/commit-map.html` · `.tmp/commit` | relative to `root`; keep both gitignored |
| `serve_url` | none | e.g. `http://host:8000/{path}`, `{path}` = `out` relative to `root` |
| `commit_cmd` | `ccommit {path}` if installed, else `git -C {repo} commit` | `{path}` = common dir of the project's paths, `{repo}` = repo root |

## Gotchas

- `ccommit` never stages: it commits what is staged under its path. The block stages first; its guard stops the whole run if an index is already loaded, otherwise stray staged files would join the commit.
- The review id comes from the snapshot time, so picks never carry over to a newer git state; the page drops the stored picks of older snapshots on load.
- Plane = file kind, not location. A deliverable kept in a control folder falls to steering (rule r6 default); `↔` marks files whose kind and repo disagree (e.g. skills in a data repo).
- Decisions exist only where each answer changes `git add`; each option lists what it excludes and exclusions of all decisions add up.
- The verdict chrome is translated on the copy by an asserted string list (`CHROME` in `make-page.py`): if the verdict template changes, the build exits naming the missing strings — update the list, never the template.
- Untracked folders stay collapsed: one entry with a file count, classified by the folder path only.
- Class names avoid the verdict `.sk` sketch names (`.tm .ph .hl`).
- Viewer: one page routed by `#p=<id>&f=<path>&t=rendered|diff|raw`, one named tab (`commit-view`). Default tab: modified → Diff, added → Rendered, deleted → Rendered of HEAD. Prose (`.md .txt`) gets a word diff: the vault never hard-wraps, a line diff would mark the whole paragraph.
- Viewer sources: files of the workspace root are fetched live from the http server (`serve_url`) and an FNV-1a hash taken at scan time flags "changed since the snapshot" (no `crypto.subtle` on plain http); diffs, deleted files (`git show HEAD:`) and data-repo files are copied at scan time, capped (`viewdata.py`). Without a server (file://) live files show "unreachable".
- Viewer data-repo copies land in `<out dir>/commit-view.html`, so the http server now exposes those changed files too; sensitive paths (same list as ccommit) are never read or copied, anything else is.
- Viewer CSP: scripts only from the page's origin, so raw HTML inside a Markdown file cannot run code or send data out; HTML files render in `iframe sandbox` (no same origin). The CSP `<meta>` must be in `<head>`: the DS assembler puts the fragment in `<body>`, `build-view.py` moves it. Never hand-edit `view.html`: edit `view.src.html`, run `python3 build-view.py` (needs bun).
- Wikilinks resolve only to files of the changeset (by name); others show as dotted text.

## Files

| file | role |
|---|---|
| `config.py` | config file lookup, defaults, URL or path of the page |
| `taxonomy.py` | kinds, weights, path rules r1-r6, secret list (same as ccommit) |
| `scan.py` | git snapshot, grouping, deterministic detectors and decisions → scan JSON (carries the resolved config) |
| `make-page.py` | scan + notes JSON → page on `../verdict/template.html` (treemap, phone map, matrix, ranked rows, commands, tooltips); copies the viewer next to it |
| `viewdata.py` | per file, viewer data at scan time: diff vs HEAD (word diff for prose), HEAD copy of deleted files, data-repo copies, FNV-1a hash; untracked folders unfolded (cap 60) |
| `view.src.html` → `view.html` | viewer page source → prebuilt standalone page (DS assembler + `build-view.py`), `__VIEW_DATA__` filled by make-page.py |
| `view.js` | viewer runtime: routing, sidebar, Rendered (marked, mermaid, iframe, img) / Diff / Raw, banners, theme shared with verdict pages |
| `vendor/` | pinned `marked` 18.1.3 and `mermaid` 12.3.0 (MIT, `VERSIONS.txt`); mermaid weighs 5.3 MB, copied only when changed |
