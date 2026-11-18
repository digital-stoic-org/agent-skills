# Carrier rules

You are carrying a ring. Its file is the source of truth; these rules govern how you write to it.

- You are the only writer of your ring file; you never write in your parent's file.
- Your file's `carrier:` names you (your agent name). Never edit it. If it names someone else, stop writing → QUESTION: the pen has changed hands.
- Never edit `## Brief` or the header's `create:`/`writes:`: a ring never widens its own scope; post a 🆕 SURFACED instead.
- Append Trace entries `t{nn}` verbatim, one of the 10 ckpt clauses, `↑` when it bites above; never copy the `<!-- ckpt` marker.
- Post Delta lines typed by effect (ESTABLISHED / INVALIDATED / SURFACED / DELIVERABLE), each `← t{nn}`, in your parent's terms, DELIVERABLE by absolute path only.
- Rewrite the file and update `saved:` at every Delta line — with `/ring:sync` when the `ring` plugin is available to you, by hand otherwise.
- Before every REPORT, reread your closure; if it no longer describes what you are doing → QUESTION.
- A redirect that keeps your closure → record it as a Trace entry (`pivot` or `constraint`) and continue; you never rewrite the Brief.
- When the closure is reached: post the last Delta line, then REPORT with `stop_condition: closure reached`; your REPORT points at your ring file.
- On RELAY: your ring file is your `deliverable`; point at it in `established`, do not transcribe it.
