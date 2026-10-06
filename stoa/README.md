# stoa

Next plugin generation (experimental), replaces dstoic. Listed in `.claude-plugin/marketplace.json`. `modtest` stays the frozen sandbox: stoa is ported from it, nothing flows back.

⚠️ Mods are not sandboxed: a hooks module runs with the user's permissions. Read the code before loading it.

## Load

```bash
claude --plugin-dir /repos/agent-skills/stoa
claude --plugin-dir /repos/agent-skills/stoa --debug-file /praxis/.tmp/pack/debug.log   # with debug log
claude plugin validate /repos/agent-skills/stoa --strict
claude plugin test /repos/agent-skills/stoa
```

## Commands

| command | does |
|---|---|
| `/pack [stream] [--yes\|-y]` | save (awaited) + review pane `[c]`/`[x]`, or `--yes` arm only; you type `/clear`; the pack is re-injected |
| `/pack save [stream]` | fork -> `pack-<stream>-llm.md`; returns at once, the outcome is a toast, the status line and `pack-<stream>-status-llm.md`, no `/clear` |
| `/pack cancel` | leaves the review pane or the armed state (`--yes`); the saved file stays, `/clear` then injects nothing |
| `/unpack <stream>` | `pack-<stream>-llm.md` -> first message of this session (state + journal rule + unpack rules) |

`/pack load` is removed: it replies with a pointer to `/unpack <stream>`. `save`, `load` and `cancel` are reserved words, never stream names.

Stream = explicit argument (`^[a-zA-Z0-9_-]{1,50}$`, binds for the session; `/unpack <stream>` binds too) > the session title set by `/rename` (slugified when it is not a valid name) > refused with a message. The binding survives `/clear`.

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

Over 8,000 chars, code cuts `read_if_needed` (compressed), then `stale`, then `in_progress`. Still over, the fork runs once more, told by how much it missed. Still over, code drops `discarded` then `learnings`, oldest first, writes an `overflow:` line in `stale` naming the dropped ids, and advances the cursor: a degraded state beats none. A save is refused only when what is never cut (header, `read_first`, `decisions`, `next`, `unknowns`) exceeds the cap alone.

Do not enable modtest and stoa together: both capture every trailer into the same journal.

The mod logic (journal capture, trailer hiding on screen, context zones and advice) is unchanged from modtest; its detailed description is in `/repos/agent-skills/modtest/README.md`. What changed: the command names, the reply prefixes (`pack:` / `unpack:`), the state file name (`pack-<stream>-llm.md`), the state field `previous_session` (was `predecessor`), the unpack rules wording, and every user-facing text, which no longer uses relay vocabulary.
