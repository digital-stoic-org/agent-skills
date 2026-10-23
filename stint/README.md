# stint

Run your agent in stints. Pit before the redline.

Requires Claude Code 2.1.275+.

⚠️ Mods are not sandboxed: a hooks module runs with your permissions. Read the code in `hooks/` before loading it.

## Load

```bash
claude --plugin-dir <path-to>/stint
claude plugin validate <path-to>/stint --strict
claude plugin test <path-to>/stint
```

## Commands

| command | does |
|---|---|
| `/pit [stream]` | The car comes into the pit: the agent writes its notes to a file, `/clear` runs by itself, and the notes are injected as the first message of the fresh context. If the host refuses the `/clear`, the status line says to type it. |
| `/rejoin [stream]` | The car goes back on track: the notes of a stream are injected as the first message of a new session. With no stream it takes the only notes file of the folder, lists them when there are several, and says so when there are none. |

At session start, if the folder holds notes and no stream is set, the status line reads `Notes for stream "x" found: /rejoin x`.

A `/pit` is refused, and nothing is cleared, when the save fails, when another `/pit` is running, or when the context is at 95% of the limit where Claude Code compacts on its own: the save runs in that same context and would fail there.

Stream name, in order: the argument (`a-z A-Z 0-9 _ -`, up to 50 characters, kept for the session and across `/clear`), the session title set by `/rename`, then `main`. `pit` and `rejoin` are reserved.

## Notes file

`<working directory>/.stint/<stream>-notes.md`, at most 8,000 characters, written by one model fork that sees the previous notes of the stream and merges them. Header: `stream`, `saved`, `status`, `previous_session`, `goal`. Body lists: `read_first`, `read_if_needed`, `deliverable`, `decisions`, `learnings`, `discarded`, `in_progress`, `next`, `unknowns`, `stale`. Over the cap, code cuts `read_if_needed`, `stale`, `in_progress`, `discarded`, `learnings` in that order and marks the status `degraded`; agents still running are listed in `in_progress` by code.

Do not load stint and stoa together.

## License

MIT
