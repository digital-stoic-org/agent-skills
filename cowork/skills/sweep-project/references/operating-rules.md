# Operating Rules

Static policy for `sweep-project`. Read at the start of any run. Phase flow lives in `SKILL.md`.

## ⚠️ Hard Constraints (read first)

- **Phase 1 is READ-ONLY.** No writes anywhere except the audit report under `.tmp/`.
- **Never run `git` or `rm`.** Content edits → `Edit`/`Write`. Approved filesystem moves → run plain `mv` directly (Phase 3). **Never** run any git verb (`git mv`/`add`/`rm`/`commit`/`push`) — the user is the git gateway and commits the resulting changes himself. Deletions are never executed; superseded files go to `park/` via `mv`.
- **Never delete.** Superseded/dormant files go to `park/`, never to deletion. Recommend deletion in the report; let the user decide.
- **Never read or factor `park/` content** into reasoning unless the user explicitly asks. `park/` is out of scope by default.
- **Never reshuffle protected satellites**: `sync/` (hash-tracked external bridge), `.tmp/`, `.dump/`, `.claude/`, `.git/`. Describe them in the audit; do not move/rename their contents.
- **One project per invocation.** If the path is ambiguous, ask.
- **Respect per-project overrides.** The project's `CLAUDE.md` is authoritative — if it declares a different convention, follow it and note the divergence rather than imposing the canonical model.

## ⚠️ AskUserQuestion Guard

After EVERY `AskUserQuestion`, check if answers are empty. If empty: output "⚠️ Questions didn't display (known bug).", present options as a numbered text list, WAIT for reply.

## Output Style

Client-agnostic: simple lists + emoji, no Mermaid in the live report. Severity legend 🔴 critical / 🟡 important / 🟠 gap / ⚪ minor. Tier legend per `convention.md`. French-content projects: keep findings bilingual-safe but never rewrite French doc content into English. Token budget for live summaries < 1500 tokens — the detail lives in the `.tmp/` reports.
