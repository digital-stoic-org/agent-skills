# stoa

Next plugin generation (experimental), successor of dstoic. Not published: absent from `.claude-plugin/marketplace.json`. `modtest` stays the frozen sandbox: stoa is ported from it, nothing flows back.

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
| `/pack [stream] [--yes\|-y]` | save (awaited) + review pane `[c]`/`[x]`, or `--yes` arm only; you type `/clear`; the packet is re-injected |
| `/pack save [stream]` | fork -> `relay-<stream>-llm.md`; returns at once, the outcome is a toast, no `/clear` |
| `/unpack <stream>` | `relay-<stream>-llm.md` -> first message of this session (state + journal rule + regime) |

`/pack load` is removed: it replies with a pointer to `/unpack <stream>`. `save` and `load` are reserved words, never stream names.

Stream = explicit argument (`^[a-zA-Z0-9_-]{1,50}$`, binds for the session; `/unpack <stream>` binds too) > the session title set by `/rename` (slugified when it is not a valid name) > refused with a message. The binding survives `/clear`.

## Storage

Same files and formats as modtest's self-relay, in the session's working directory: a stream saved by one can be unpacked by the other.

| file | content |
|---|---|
| `journal/<stream>.md` | one entry per `<!-- ckpt ... -->` trailer of a main-loop answer, append-only |
| `relay-<stream>-llm.md` | state: header + body fields, at most 8,000 chars |

Do not enable modtest and stoa together: both capture every trailer into the same journal.

The mod itself (journal capture, trailer hiding on screen, context zones and advice, regime lines) is unchanged from modtest; its detailed description is in `/repos/agent-skills/modtest/README.md`. Only the command names, reply prefixes (`pack:` / `unpack:`) and the `/pack` / `/unpack` hints in messages changed.
