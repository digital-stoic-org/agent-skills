---
name: clip
description: Clip a web article into the anti-library — frontmatter, TLDR in Notes, verbatim backup in Dump. Use when the user gives a URL to save, archive, or add to the anti-library / articles / PCM. Triggers: clip this, save this article, add to anti-library, archive this link.
context: subagent
allowed-tools: [Read, Write, Edit, Bash, Glob, Grep]
model: sonnet
user-invocable: true
argument-hint: <url> [angle] | --attach "<note>" <asset-url>
---

# GTD Clip

One URL → one note in `/praxis/anti-library/articles/`. The web copy may vanish; this one won't.

## Steps

1. **Fetch + convert** — `python3 <skill>/scripts/fetch-article.py "<url>" --out /praxis/.tmp/clip`.
   Returns JSON (title, author, date, description, strategy, chars) and writes `body.md`.
   - `chars` < 2000 or `strategy: dom-density` on a known-long article → extraction is thin.
     Retry with WebFetch, or tell the user the page is paywalled/JS-rendered. Never fake a Dump.
2. **Read `body.md`** — you write the TLDR from the text, never from the metadata blurb.
3. **Check for a duplicate**: `Glob` the articles folder on a distinctive title word.
   Existing note → update it, don't create a second.
4. **Write** `/praxis/anti-library/articles/<Titre exact>.md` (flat folder — no year, no subject subfolder).
   Sanitize only `/` and `:` in the filename.
5. **Clean up** `/praxis/.tmp/clip`, then report: path, tags, the TLDR, and **one line** on assets —
   `assets` in the JSON counts the images without downloading anything:
   `📎 6 images (2 encarts sponsors) — colle l'adresse de celle que tu veux garder.`
   That line is the notification. Never render the list, never number it, never touch the note for it.

## Assets — `--attach`

The human copies the asset's address from the article and passes it. That *is* the selection:

```bash
python3 <skill>/scripts/attach.py "<note.md>" <asset-url> [<asset-url> …]
```

Any asset, not just images — pdf, svg, csv, zip. It unwraps the CDN wrapper (full resolution, never
downscaled), saves as `<slug>-NN.ext` (extension from the URL, else from the served content-type),
then re-points the reference in `# Dump`: an image line becomes `![[…]]` with the source URL in a
comment, an inline `[label](url)` becomes `[[nom|label]]` so the sentence survives. Anything absent
from the Dump is parked under `# Notes` rather than lost. Cap 25 MB — a guard, not a budget.

**Never run it on your own initiative** — not to "finish the job", not because the images look useful,
not because the human said yes to an attachment earlier. **No URL in hand, no byte fetched**: there is
no pre-download, no buffering "just in case", no fetching at clip time. The URL is the whole mandate.

## File shape

```markdown
---
type: article
created: <today, ISO>          # capture date — NOT the publication date
author: <plain text, never a wikilink; omit if unknown>
description: <one sentence, in the note's language>
url: <canonical url>
tags: [article, journal, <2-3 topic tags>]
---
# <Titre exact>

*<Publication> — publié le <date>.*      ← omit the half you don't have

# Notes

**TLDR** — <2-3 sentences: the thesis and what shifts>

- 🎯 <5-8 bullets: the argument's load-bearing points, with the article's own figures>
...

**Pourquoi c'est ici** — <why this belongs in Mat's anti-library; use the user's angle if given>

# Dump

> Copie verbatim du corps de l'article (`<date>`), conservée en cas de disparition en ligne.
> <mention any noise stripped>

<body.md, unmodified>
```

## Rules

- ❌ **`status:` is forbidden** on articles — it would make the note a debt to settle.
- ❌ **No backfill**: a missing field is an *absent* field, never an empty one.
- ✅ **Reuse existing tags** — harvest them first, invent one only when nothing fits:
  `awk '/^tags:/{f=1;next} /^---$/{f=0} f&&/^  - /{print $2}' /praxis/anti-library/articles/*.md | sort | uniq -c | sort -rn`
- ✅ **Notes in the user's language, Dump in the article's.**
- ✅ Keep sponsor blocks and ads in the Dump — an edited backup is not a backup.
- ❌ **No byte enters the vault without a human naming it.** `clip` only ever inventories.
- ❌ No `attachments:` frontmatter field — the schema has none, and inventing one is backfill.
  Obsidian resolves embeds by basename; that is the whole link.
- Full schema: `/praxis/.claude/rules/anti-library.md`. Videos/podcasts land here too (Dump = transcript or description).

## Errors

- **curl/pandoc missing** → report; `pandoc` and `python3-bs4` are the only deps.
- **Paywalled** → write the note with metadata + a `# Dump` holding what was reachable, and say so explicitly.
