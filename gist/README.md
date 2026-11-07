# gist

Visual output that a reader grasps at a glance. The name comes from gist perception: the ability to take in the meaning of a scene in a fraction of a second.

## Skills

| skill | what it does |
|---|---|
| `design-system` | Digital Stoic visual system v0.4 "Tablette": tokens, type, classes, chart parameters, and an assembler (`bun artifact-build.mjs`) that injects the base CSS and fonts into a source page. |

The review page skill (`review-html`) will join this plugin in a later version.

## Fonts

The `design-system` skill embeds EB Garamond, Hanken Grotesk and JetBrains Mono as base64 data URIs. These fonts are distributed under the SIL Open Font License 1.1; the licence text must ship with them before publication.
