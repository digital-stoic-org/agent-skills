# modtest

Sandbox plugin for Claude Code mods (function hooks) experiments. Not published: absent from `.claude-plugin/marketplace.json`.

⚠️ Mods are not sandboxed: a hooks module runs with the user's permissions. Read the code before loading it.

## Load

```bash
claude --plugin-dir /repos/agent-skills/modtest
claude --plugin-dir /repos/agent-skills/modtest --debug-file /praxis/.tmp/self-relay/debug.log   # with debug log
```

Check and test:

```bash
claude plugin validate /repos/agent-skills/modtest --strict
claude plugin test /repos/agent-skills/modtest
```

Tested with Claude Code 2.1.287.

## Mods

| mod | file | command |
|---|---|---|
| self-relay | `hooks/self-relay.tsx` | `/self-relay` |

### self-relay (v2)

One command, three verbs. A stream is a named line of work; the mod keeps its state and its journal on disk, in the session's working directory.

```
/self-relay save [stream]           fork -> relay-<stream>-llm.md; returns at once, the outcome is a toast, no /clear
/self-relay [stream] [--yes|-y]     same state build (awaited), then review pane [c]/[x], or --yes arm-only; you type /clear; packet re-injected
/self-relay load <stream>           relay-<stream>-llm.md -> first message of this session (state + journal rule + regime)
```

`save` and `load` are reserved words, never stream names. Stream = explicit argument (`^[a-zA-Z0-9_-]{1,50}$`, binds for the session) > the session title set by `/rename` (slugified when it is not a valid name) > refused with a message. The binding survives `/clear`.

Files written, nothing else, both built from the validated stream name:

| file | content | written by |
|---|---|---|
| `journal/<stream>.md` | one entry per `<!-- ckpt ... -->` trailer of a main-loop answer: `### cNN <ISO> <session-id>` + the trailer verbatim; append-only, never rewritten, pruned by hand | code, on every completed turn (subagent and aborted turns skipped) |
| `relay-<stream>-llm.md` | state: 7 header fields + 10 body fields, at most 8,000 chars; lines from trailers end with `(cNN)`; `journal_cursor` = last id integrated | code, from the fork's routing + the trailer clauses copied verbatim |

Trailers captured before a stream is bound wait in `$.store` (`self-relay:buffer:<session-id>`) and are flushed to the journal when a stream gets bound. A journal write that fails twice (size changed between read and write) keeps the entries in that buffer and toasts.

Routing of trailer clauses into the state: `decision`, `constraint` -> decisions; `learning`, `definition` -> learnings; `rejected` -> discarded; `open` -> next; `assumption` -> unknowns; `refs` -> read_if_needed; `reasoning`, `pivot` stay in the journal. The fork only designates (ids answered or reversed) and writes the fields no trailer covers. Over 8,000 chars the code cuts read_if_needed, then stale, then in_progress; if it still does not fit, the save is blocked and nothing is written.

On screen the `<!-- ckpt ... -->` trailer is hidden from assistant replies (a `ui.render` hook on `AssistantMessage`, drawing only). A reply with a closed trailer is drawn as a tree: the reply text without the trailer, then a marker `▸ ckpt: <clauses>`. Click the marker to expand it in place (`▾ ckpt: <clauses>` and the full trailer, dim); click again to collapse. Each reply toggles on its own; the state is lost when the mod reloads (all collapsed again). Clicks are reported by the terminal in fullscreen (alternate-screen) mode only: on the main screen the collapsed marker is drawn but cannot be pressed. A trailer still streaming (unclosed) is cut from the drawing without marker. A reply text over 10,000 chars falls back to a plain `_ckpt: <clauses>_` line (no click).
The stored message is untouched: the journal capture (from the stored answer on `turn.complete`) keeps the trailer verbatim.

Journal rule, appended to every relay and load packet: never read `journal/<stream>.md` whole; to see an entry, `grep -A8 '^### cNN' journal/<stream>.md`.

`--yes` skips the pane, for sessions driven over Remote Control. The packet is armed and you type `/clear` yourself.

The regime lines are a copy of [[/repos/agent-skills/team/skills/relay/SKILL.md]] §3 (md5 `615b560cfe2e88c19763e668bf89570a` at copy time), with the orchestrator line replaced by a solo line and a `read_first` line added. The copy may drift from its source until the mod is promoted to `team`.

### context zones (T19, T21, T22)

A `session.measure` hook (observe only, always `next(e)`) watches the context fill after each main-thread turn and advises a fresh start. Never clears, never arms: `--yes` stays the human gate.

- fill = `tokens / window` (`e.context.window`, 200k or 1M): every floor and every percentage is relative to the model's context window, the same figure as the status line. The percentage shown is `e.context.percent` when present, else `round(tokens / window * 100)`. No `tokens` (fresh session, just compacted) or `context` not in `changed` -> nothing.
- wall = `autoCompactThreshold` of `$.session.usage({ breakdown: 'summary' })`, else `rawMaxTokens`; it only feeds the hard cap. The usage call is made once `tokens / window >= 0.35`, then the wall is cached until `/clear` or a new session. Unavailable -> the hard zone uses `HARD * window` alone.
- seam strength, by code from the last main-turn answer's ckpt trailer (no clause added to any checkpoint menu): strong = a `pivot:` clause, or a clause naming a task id `T<n>` with done / closed / closes / a check mark (`T19 done`, `T21 ✅`, `closes T4`); simple = a `decision:` clause.
- advice: strong seam and fill >= `STRONG` (0.30), or simple seam and fill >= `SOFT` (0.50). One toast per cycle, plus a persistent line under the prompt (`$.ui.status`, the plugin's own line, not the statusLine script). A stronger seam later upgrades the line without a second toast; the percentage on the line follows the fill.
- hard (`HARD = 0.70`): tokens >= `min(HARD * window, 0.95 * wall)` -> the same save as `/self-relay save`, once, not awaited, skipped while a save or relay is running. The cap makes sure the pre-save happens before auto-compaction (the fork is refused at the wall): window 1M and wall 400k give a hard start at 380k, not 700k. After a hard save the zones re-arm when the fill falls under the lower of SOFT and 90% of the hard start. Outcome = toast + persistent line (saved, save failed with a short reason, or no stream set so nothing was saved).
- status precedence: an active flow (saving, writing state, review, armed, the hard pre-save) owns the line; when it clears, the advice line is drawn again if still valid. The advice goes on `/clear` or any new session, when a relay is armed (`--yes` or `clear & relay`), after a manual save, and when the fill drops below its floor (STRONG, SOFT, or after the hard zone the lower of SOFT and 90% of the hard start). A cancelled or blocked relay does not clear it.
- messages (toast and line): `Good moment for a fresh start: T19 just closed (context 41%). Type /self-relay --yes` (also `the direction just changed`, `a decision just landed`); hard: `Context almost full (87%): automatically saving your progress...`, `Progress saved automatically (context 87%). Type /self-relay --yes to continue in a fresh session`, `Context almost full (87%) and the automatic save failed (<reason>). Type /self-relay --yes to continue in a fresh session`, `Context almost full (87%) but no stream is set, so nothing was saved. Type /self-relay save <name>`.
- every measure logs one line to the debug sink (`claude --debug`, nothing on screen), silent ones included: `self-relay: ctx pct=52% tokens=104000 window=200000 wall=160000 hard=140000 seam=strong:T19 action=advice src=measure`. `pct` is the window-relative figure shown in the messages; `hard` is the token count where the hard zone starts; `wall=none` = no usage call yet (fill under 35%) or usage unavailable. Use these lines to calibrate STRONG, SOFT and HARD live.

Plan and findings: [[/praxis/repos/agent-skills/plan-self-relay-mod-llm.md]].
