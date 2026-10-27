# stint

Run your agent in stints. Pit before the redline.

Requires Claude Code 2.1.311+.

## Install

```
/plugin install stint --marketplace digital-stoic-org/agent-skills
```

## Load from a local copy

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

## Dash

A band above the prompt carries the car's instruments, on by default (`dash`: `full`). It is drawn on the terminal and the desktop app. Where there is no such band (VS Code, mobile) the same line goes to the status line instead. While `/pit` runs, or after a pit outcome or the notes hint, those lines take the status line; the band is not affected.

```
🚀 revs <n>% ▮▮▯▯▯▯▯▯▯▯ ↑<n> · ⛽ <n>% · 🏁 <n> · 📋 —
```

| term | reads |
|---|---|
| `revs` | Context fill, as a share of the model window (the figure of Claude Code's own status line). The bar has ten cells, one per 10%. When the window is not 200k its size follows the percentage, e.g. `revs <n>%/1M`. |
| zone emoji | 🚀 under the soft threshold · 🔥 orange from the soft threshold · 🚨 bold red from the hard threshold, fixed, it does not pulse. |
| thresholds | Soft 80k tokens, hard 120k tokens, which is 40% and 60% of a 200k window. A window under 200k caps them at 40% and 60% of itself. They are not the point where Claude Code compacts; that wall is read by `/pit` alone. |
| `↑<n>` | Revs points the last prompt added: the revs at the end of the prompt minus those at the end of the one before, from measured values only. Dim, it stays until the next prompt replaces it. After a pit, the dim `↓<n>` stays the same way. |
| `+<n> +<n> …` | At the right end of the band: the revs points added by each of the last 5 prompts, newest on the right, `+0` when nothing rose, shown from the second entry; it then replaces the `↑<n>` after the bar. After a `/pit` the first entry is the measured drop `-<n>`. Dim, bold above 10 points. The board is cut first, then the oldest entries go. The status-line fallback keeps `↑<n>` and has no series. Reset by `/pit`, `/clear` and a new session. |
| `⛽` | What is left of the tighter of the five-hour and seven-day plan windows. Shown only below 30%, and only when the host reports rate limits. |
| `🏁` | The stint counter, shown from the second stint: +1 at each successful `/pit`, taken from the notes by `/rejoin`. |
| `📋` | Pit board: the sign the crew holds over the pit wall; one short message, `—` when empty. It is cut first when the line is too wide. |

The revs figure flashes for half a second at each upward crossing of a threshold, and the fuel segment flashes when it appears. Nothing else repeats.

A toast appears once per upward crossing: at the soft threshold (5 s, `plan your pit`) and at the hard one (10 s, `REDLINE · box this lap: /pit`, and the board keeps that message while the zone lasts). A successful `/pit` shows `✅ pit done · revs <n>% → <n>% ↓<n>` for 3 s: the revs of the last measure before the `/clear`, then those of the first measure of the fresh context (never an estimate), and a dim `↓<n>` after the revs until the next prompt ends, or as the first entry of the band's series. With no pre-pit value, no measure within 30 s, or no drop, it shows `✅ pit done · fresh window` and no `↓`. The plugin has one toast slot: a redline toast is never replaced by a zone toast, nor a zone toast by the pit one. Toasts re-arm after `/pit`, `/clear` or a new session.

Option (`/config`, row `stint · Dash`, or `pluginConfigs.stint.options.dash`), applied as soon as it changes:

| `dash` | does |
|---|---|
| `full` (default) | The emoji band and the toasts. |
| `ascii` | An ASCII-only band without hex colours (`revs <n>% ##........ | board -`) and ASCII toasts, for terminals that misjudge emoji width. |
| `off` | No band, no dash status line, no toasts. The `/pit` and `/rejoin` lines are unaffected. |

### Board slot

The board draws what other parts of the plugin write to the session state, `{ plugin: 'stint', key: 'board' }`, typed in `types/index.d.ts`:

```ts
type Board = { text: string; level: 'info' | 'warn' | 'alert'; from: string; until?: number }
```

`until` is a time in milliseconds on the host clock; past it the slot reads `—` again. With several candidates the order is `alert`, then the built-in redline message (`box this lap: /pit`), then `warn`, then `info`. Only stint writes this value.

Figures come from Claude Code's `session.measure` event; until it fires, one `$.session.usage()` read after each main-thread turn gives the same reading.

## Notes file

`<working directory>/.stint/<stream>-notes.md`, at most 8,000 characters, written by one model fork that sees the previous notes of the stream and merges them. Header: `stream`, `saved`, `status`, `previous_session`, `goal`, `stint`. `stint` is the number of the stint the notes hand over to: each successful `/pit` writes the previous value plus one, and a file without the field counts as 1. Body lists: `read_first`, `read_if_needed`, `deliverable`, `decisions`, `learnings`, `discarded`, `in_progress`, `next`, `unknowns`, `stale`. Over the cap, code marks the status `degraded`, shortens long `read_if_needed` lines, then drops items oldest first from `stale`, `in_progress`, `discarded`, `learnings`. Still over, it drops from `read_if_needed`, `next`, `unknowns`, `decisions` and names the cut in `stale`. The header, `read_first`, `deliverable` and the running agents are never cut; if they alone exceed the cap, nothing is written and the pit is refused. Agents still running are listed in `in_progress` by code.

Do not load stint and stoa together.

## License

MIT
