# gist

Visual output that a reader grasps at a glance. The name comes from gist perception: the ability to take in the meaning of a scene in a fraction of a second.

## Skills

| skill | what it does |
|---|---|
| `design-system` | Digital Stoic visual system v0.5 "Tablette" (dark versant "Ardoise"): tokens, type, classes, chart parameters, and an assembler (`bun artifact-build.mjs`) that injects the base CSS and fonts into a source page. |
| `verdict` | Self-contained HTML review page (ex `review-html`): cards typed by the action the reader takes, silence has a meaning per card type, and only the deviations come back as JSON. Ships the visual grammar catalog (`grammaires/`) and its generator (`grammaires/src/`). Its template is assembled from a source by the design-system builder (base CSS and fonts injected, tool mode, verdict state tokens `--no` `--ok-weak` `--warn-weak` `--no-weak` since DS 0.6). |
| `commit` | Git impact map before committing: scans /praxis and the alias data repos (`scan.py`, read-only), classifies each file into 2 planes x 6 kinds (harness, steering, trace / deliverable, input, generated), flags risky changes with deterministic detectors, and builds a radar page on the verdict template (`make-page.py`: treemap, who-reads-it matrix, ranked projects with Validate/Later/Exclude) that outputs one chained `git add` + `ccommit` block to paste. The agent only adds who-reads-it links (v0). |

## Fonts

The `design-system` skill embeds EB Garamond, Hanken Grotesk and JetBrains Mono as base64 data URIs. These fonts are distributed under the SIL Open Font License 1.1; the licence texts ship in `skills/design-system/fonts/`. `verdict/template.html` embeds the same families.
