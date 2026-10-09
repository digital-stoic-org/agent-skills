# stoa

Next plugin generation (experimental), replaces dstoic. Listed in `.claude-plugin/marketplace.json`. `modtest` stays the frozen sandbox: stoa is ported from it, nothing flows back.

⚠️ Mods are not sandboxed: a hooks module runs with the user's permissions. Read the code before loading it.

## Load

```bash
claude --plugin-dir /repos/agent-skills/stoa
/plugin install stoa --marketplace digital-stoic-org/agent-skills   # marketplace (Claude Code 2.1.275+)
claude --plugin-dir /repos/agent-skills/stoa --debug-file /praxis/.tmp/pack/debug.log   # with debug log
claude plugin validate /repos/agent-skills/stoa --strict
claude plugin test /repos/agent-skills/stoa
```

## Commands

pack and keel share this table; keel's commands are in the [keel](#keel-derived-files) section.

| command | does |
|---|---|
| `/pack [stream]` | fresh start: save (awaited), arm, run `/clear` automatically (falls back to "type `/clear`" if the host refuses); the pack is re-injected. `--yes`/`-y` stay as silent aliases |
| `/pack [stream] --review` | save (awaited) + review pane: `[c]` clear & continue, `[x]` keep working. Cannot be combined with `--yes` |
| `/pack save [stream]` | fork -> `pack-<stream>-llm.md`; returns at once, the outcome is a toast, the status line and `pack-<stream>-status-llm.md`, no `/clear`. No flag allowed |
| `/pack cancel` | leaves the review pane, the armed state or the auto countdown; the saved file stays, `/clear` then injects nothing |
| `/pack auto [off]` | turns the auto mode on or off for the session's working directory (see below) |
| `/unpack <stream>` | `pack-<stream>-llm.md` -> first message of this session (state + journal rule + unpack rules) |

`/pack load` is removed: it replies with a pointer to `/unpack <stream>`. `save`, `load`, `cancel` and `auto` are reserved words, never stream names.

Stream = explicit argument (`^[a-zA-Z0-9_-]{1,50}$`, binds for the session; `/unpack <stream>` binds too) > the session title set by `/rename` (slugified when it is not a valid name) > refused with a message. The binding survives `/clear`.

## Auto mode

`/pack auto` creates `.stoa-pack-auto` in the session's working directory (no lookup in parent directories); `/pack auto off` removes it. `touch` and `rm` by hand work too: the file is re-read at every turn end. While it exists the status line ends with `auto`. The mode uses the current stream; with no stream it only advises (`/pack save <name>` or `/rename` first).

- Trigger: the end of a main-loop turn (not an aborted one, not a subagent's) when the context fill is at or above the hard threshold (70% of the window, capped at 95% of the wall). A measure that arrives just after the turn end, which is the usual order, also triggers it. A mid-turn crossing never clears the session.
- Hard save: with the mode on, the mid-turn hard save is deferred to the turn end. The exception is a fill at or above 95% of the wall mid-turn (compaction imminent): the old hard save runs, with no `/clear`.
- Flow: save (same body as `/pack`), then a 10 s countdown on the status line (`Context N%: fresh session for stream "x" in 10 s. /pack cancel to stay`), then `/clear` and the pack is re-injected.
- Abort: submit a prompt or type `/pack cancel` during the save or the countdown. The saved file stays, no `/clear` runs, and the advice says `Progress saved automatically`. After an abort the cycle sleeps until the fill falls under the floor and the zones rearm.
- Retries: if the save is blocked, the next turn end tries again, 3 tries per cycle, then advice only.
- The agents still in flight are listed in the pack like in any save; the `agent.list()` call times out after 5 s (`agents: unknown (list timed out)`) so a hang cannot stall the mode.

## Feedback

One channel per role. The status line holds the present state, a toast announces an event, and a `{text}` reply is the record in the transcript, written in the past tense.

| what | status line | toast |
|---|---|---|
| save running | `Saving stream "x"... 12s`, ticking; past 3 min it says slow or stuck (the fork cannot be cancelled) | - |
| save ok | `✓ Stream "x" saved at 14:32 (N chars)`, until the end of the next prompted turn | 4 s |
| save over the cap (degraded), save failed, unpack failed | `⚠ ...`, until the next `/pack` or `/unpack` | 12 s |
| checkpoints and no stream | `N checkpoints waiting for a stream: ...`, under the advice | - |
| journal write failed | `⚠ Journal of stream "x" not written: ...`, over the advice | 12 s |

Precedence on the one status line: running flow, last outcome, failed journal write, context advice, checkpoints waiting for a stream. A newer advice or auto-save outcome replaces an ok outcome.

## Storage

Files live in the session's working directory. The journal is shared with modtest. The state file is not: modtest and stoa 0.1.0 write `relay-<stream>-llm.md`. When `pack-<stream>-llm.md` is missing, a save reads `relay-<stream>-llm.md` as the previous state (`predecessor` kept as `previous_session`), writes forward under the new name and says "migrated" in its toast. The old file stays on disk. `/unpack` does not migrate: run `/pack save <stream>` once first.

| file | content |
|---|---|
| `journal/<stream>.md` | one entry per `<!-- ckpt ... -->` trailer of a main-loop answer, append-only |
| `pack-<stream>-llm.md` | state: header + body fields, at most 8,000 chars |
| `pack-<stream>-status-llm.md` | outcome of the last save (`ok` / `degraded` / `blocked`, reason or detail), rewritten at every save so the model can read why a save failed |

## Retirement and the cap

The fork retires trailer lines by id: `retire_answered` (open/assumption resolved), `retire_done` (next item done), `retire_learned` (learning obsolete), `retire_reversed` (decision proved wrong) and `retire_superseded` (decision overtaken). The last two move the decision to `discarded`.

The ceiling is 8,000 chars, enforced by code. The single fork per save is told the ceiling, the size of the previous state and the room left; when the room is tight it is asked to designate `retire_*` ids first. There is no second fork: an over-cap answer goes straight to the deterministic cut.

Cut order: `read_if_needed` (compressed), then `stale`, `in_progress`, `discarded`, `learnings`. Still over, code drops numbered `(cNN)` lines across every body section but `read_first` (`decisions`, `next` and `unknowns` included), lowest `cNN` first, then the un-numbered lines the fork wrote itself. Every dropped id is named by an `overflow:` line at the end of `stale` (the journal keeps the lines), the cursor advances, and the save is reported as degraded. The header, `read_first` and the agent lines (below) are never cut: a save is refused only when they alone (plus the overflow line) exceed the cap.

Every save (`/pack`, `--review`, `save`, automatic) lists in `in_progress`, by code and before the fork starts, the agents still in flight (status `pending`, `running`, `waiting` or `idle`, at most 10) as `agent in flight: <name or type> [<id>] <status> — <description>`, so the fresh context after `/clear` can still `SendMessage` them; agents of a Workflow are not in `$.agent.list()` and are not listed.

Do not enable modtest and stoa together: both capture every trailer into the same journal.

The mod logic (journal capture, trailer hiding on screen, context zones and advice) is unchanged from modtest; its detailed description is in `/repos/agent-skills/modtest/README.md`. What changed: the command names, the reply prefixes (`pack:` / `unpack:`), the state file name (`pack-<stream>-llm.md`), the state field `previous_session` (was `predecessor`), the unpack rules wording, and every user-facing text, which no longer uses relay vocabulary.

## keel: derived files

keel keeps a derived file honest about its sources. A file that lists `sources:` in its frontmatter becomes suspect when a source changes; the agent is told inside the session, with the diff. A file without `sources:` is invisible to keel. keel never edits prose, it only writes the stamps.

```yaml
---
sources:
  - ref/02-money-flow.md#Abondement @3f9a1c0e7b2d
  - "[[note-fonctionnement-dir]]"
---
```

Entry = path (relative to the chantier root, absolute, or `[[name]]` resolved by unique basename) + optional `#Heading` (H2/H3) + stamp `@<12 hex>` (git blob sha1 of the source or of the section). `source:` is read like `sources:`. URLs and unresolvable refs are `opaque`: listed by `/keel why`, never suspect.

Everything is automatic:

| when | what |
|---|---|
| session start (every source) | index of the chantier, absent stamps written, current suspects told to the model |
| each prompt | stat sweep of the sources; sources that moved since last told are injected with their diff |
| after a Write/Edit/Bash | suspects derived from the moved sources, with the diff (first 3) |
| turn end | stamps written (absent -> `stamp`, `@ok` -> `ok`, entry of a child the agent rewrote -> `updated`); Stop blocks once per turn if a derived file created suspect this turn and is still suspect; a toast says how many; `keel-status-llm.md` is rewritten |

Stamps are written only at session start and turn end, never mid-turn. Review gesture: write `@ok` after the entry; keel replaces it with the current stamp and journals it in `journal/keel.md`. The diff comes from `git hash-object -w` blobs kept at stamp time (needs a git repo; otherwise `unavailable: not a git repo`).

| command | does |
|---|---|
| `/keel` | suspects with reason and age, then the size of the index |
| `/keel scan` | re-scan the chantier now, stamps nothing (stamps come at the turn end) |
| `/keel why <file>` | the entries of a derived file with their state, and the children that derive from it |
| `/keel off` / `/keel on` | create / remove `.stoa-keel-off` in the session directory (every keel hook is then a no-op); `on` rescans |

⚠️ A derived file created by hand (shell, editor) outside the agent is invisible until the next session start or `/keel scan`.

Files in the working directory: `keel-status-llm.md` (suspects, `degraded:` notes), `journal/keel.md` (stamp, ok, updated, manual gestures). The index lives in the session store.

Do not declare `/keel` from another mod's `session.*` glob: the host throws on a repeated (pattern, matcher). keel owns `session.*` and `classic.*`.
