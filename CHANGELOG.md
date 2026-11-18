# Changelog

## 2026-11-18 · dstoic 0.55.0 (marketplace 0.57.0)

- **New skills:** `diverge` and `converge` replace the parked `cognitive:brainstorm`. diverge opens a problem in rounds without scoring; converge decides on criteria Mat sets first. Both share one idea file per topic.
- **Handoffs dropped:** the brainstorm-to-probe and brainstorm-to-openspec-plan templates stay in park, since both targets are parked.

## 2026-11-18 · Cleanup (marketplace 0.56.0)

The repo now ships three plugins: dstoic, gist and toolsmith. Everything else moved to [park/](park/README.md), because daily practice stopped calling it.

- **Parked plugins:** biz, coach, cognitive, content, convert, cowork, experimental, gtd, lazy, openspec, philosopher, retrospect, ring, team, stoa, modtest, plus the `test/` harness.
- **dstoic 0.54.0:** its 14 skills moved to `park/dstoic-skills/`. It becomes the default plugin, and revisited skills land back in `dstoic/skills/`.
- **Docs:** PHILOSOPHY, PRACTICE, PRACTICE-llm, HARNESS-ENGINEERING, IDEAS, benchmarks, examples and CLAUDE.md.example moved to [docs/](docs/). The full catalog moved to `park/README-full.md`.
- **Removed:** session state files that did not belong in a public repo.
- **Commit:** the cleanup landed in `0be85b5`.
- **Resume point:** commit `3e3d86c` is the last one with the full layout. To restore a path from it, run `git checkout 3e3d86c -- <path>`.
