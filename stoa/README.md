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
| `/pack save [stream]` | fork -> `pack-<stream>-llm.md`; returns at once, the outcome is a toast, no `/clear` |
| `/unpack <stream>` | `pack-<stream>-llm.md` -> first message of this session (state + journal rule + unpack rules) |

`/pack load` is removed: it replies with a pointer to `/unpack <stream>`. `save` and `load` are reserved words, never stream names.

Stream = explicit argument (`^[a-zA-Z0-9_-]{1,50}$`, binds for the session; `/unpack <stream>` binds too) > the session title set by `/rename` (slugified when it is not a valid name) > refused with a message. The binding survives `/clear`.

## Storage

Files live in the session's working directory. The journal is shared with modtest. The state file is not: modtest writes `relay-<stream>-llm.md`, which stoa does not read. To unpack a stream saved by modtest, rename its file to `pack-<stream>-llm.md` first.

| file | content |
|---|---|
| `journal/<stream>.md` | one entry per `<!-- ckpt ... -->` trailer of a main-loop answer, append-only |
| `pack-<stream>-llm.md` | state: header + body fields, at most 8,000 chars |

Do not enable modtest and stoa together: both capture every trailer into the same journal.

The mod logic (journal capture, trailer hiding on screen, context zones and advice) is unchanged from modtest; its detailed description is in `/repos/agent-skills/modtest/README.md`. What changed: the command names, the reply prefixes (`pack:` / `unpack:`), the state file name (`pack-<stream>-llm.md`), the state field `previous_session` (was `predecessor`), the unpack rules wording, and every user-facing text, which no longer uses relay vocabulary.
