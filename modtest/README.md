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

Plan and findings: [[/praxis/repos/agent-skills/plan-self-relay-mod-llm.md]].
