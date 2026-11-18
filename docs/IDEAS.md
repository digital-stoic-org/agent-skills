# 💡 Future Ideas

> *"Il est urgent d'attendre."* — Talleyrand
>
> Many of these ideas will be obsoleted by native Anthropic features (Auto-Dream, Kairos, Team Memory, etc. — see [ccunpacked.dev](https://ccunpacked.dev)). Build only when real friction emerges, not from competitive benchmarking anxiety.

## Ideas

| # | Idea | Why | Status |
|---|------|-----|--------|
| 1 | **Skill-scoped hooks** | Mechanical enforcement > prose rules. AskUserQuestion guard (5+ skills), destructive-action blockers, scope-drift detection, Stop validation | 💭 Assessed |
| 2 | **ICM long-term memory** | Semantic search, auto-decay, cross-project recall, PreCompact extraction. Complements flat MEMORY.md (200-line cap, no search) | 💭 Watching |
| 3 | **Security hardening** | 3-layer: permissions.deny + hook scripts (dangerous-actions, secrets-scanner, prompt-injection) + Gitleaks pre-commit | 📋 Specced (OpenSpec ready) |
| 4 | **Knowledge store indexing** | Search/surface/connect probe+experiment+learning outputs in `dstoic/knowledge/`. Currently folder convention only | 💭 Deferred BC |
| 5 | **CI test harness** | Ship Docker-based skill test framework (`/test-skill`) to CI. Currently local-only | 💭 Idea |
| 6 | **Pre-Compact state saver** | Hook saves CONTEXT snapshot before compaction. Only relevant when controlled autonomous loops ship | ⏸️ Wait for native |
| 7 | **Cowork context broker** | `/save-work` writes native-memory summary, `/load-work` reads both. Multi-surface (Desktop/Telegram/CLI) | ⏸️ Wait for friction |

## Positioning

~80% of custom harness work is being absorbed by native Anthropic features. The valuable 20%: persistence discipline, cognitive frameworks (Cynefin routing, adversarial thinking), learning loops, and execution philosophy.

**Build when friction is real. Watch when benchmarks say "gap."**
