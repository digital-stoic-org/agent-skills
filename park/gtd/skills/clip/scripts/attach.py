#!/usr/bin/env python3
"""Save assets the human picked into the anti-library attachments, by URL.

Usage:  attach.py <note.md> <asset-url> [<asset-url> ...]

The human copies the asset's address from the article and passes it. That IS the
decision — there is no inventory to arbitrate, and no index to mistype.

Any asset, not just images: pdf, svg, csv, zip. Obsidian embeds a pdf by
basename exactly like a png; anything it can't render still resolves as a link.

This is the only code in `clip` that fetches bytes.

Per URL: unwrap the CDN wrapper (full resolution, not the capped render),
download to <slug>-NN.<ext>, then re-point the matching reference inside
`# Dump` — an image line becomes an embed, an inline link becomes a wikilink —
keeping the source URL in a comment.
"""

import argparse
import mimetypes
import os
import re
import subprocess
import sys
import unicodedata
from urllib.parse import unquote

ATTACHMENTS = os.environ.get("CLIP_ATTACHMENTS", "/praxis/anti-library/attachments")
# Full resolution is the point: a chosen asset is kept as published, never
# downscaled. The cap is only a runaway guard (an existing attachment is 5.2 MB).
MAX_BYTES = 25 * 1024 * 1024
UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")


def die(msg):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def slugify(name):
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    s = re.sub(r'[^a-zA-Z0-9]+', '-', s).strip('-').lower()
    return re.sub(r'-{2,}', '-', s)[:60] or "clip"


def unwrap(url):
    """A copied Substack/Ghost image address is a CDN transform wrapping the real
    asset, url-encoded, after the resize params. Unwrapping recovers the original
    at full resolution instead of the 1456px render."""
    m = re.search(r'/(https?%3A%2F%2F\S+)$', url, re.I)
    return (unquote(m.group(1)) if m else url).split("?")[0]


def next_index(slug):
    used = {int(m.group(1)) for f in os.listdir(ATTACHMENTS)
            for m in [re.match(re.escape(slug) + r'-(\d{2})\.', f)] if m}
    return max(used) + 1 if used else 1


def download(url, dest):
    """Returns (size, content_type) — the type is what names an extensionless asset."""
    r = subprocess.run(["curl", "-sL", "--max-time", "90", "--max-filesize", str(MAX_BYTES),
                        "-A", UA, "-w", "%{content_type}", "-o", dest, url],
                       capture_output=True, text=True)
    if r.returncode != 0 or not os.path.exists(dest) or os.path.getsize(dest) == 0:
        if os.path.exists(dest):
            os.remove(dest)
        return None, None
    return os.path.getsize(dest), (r.stdout or "").split(";")[0].strip()


def repoint(text, basename, name, embed):
    """Swap the remote reference for the local one. The CDN-wrapped src in the Dump
    still contains the real basename, so matching on it survives the wrapping.

    Two shapes, because a pdf is not an image: a standalone image line becomes the
    embed block, while an inline `[label](url)` — how a pdf or a zip appears in
    prose — becomes `[[name|label]]` so the sentence around it stays intact.
    """
    b = re.escape(basename)
    img = re.compile(r'^!\[[^\]]*\]\([^)\s]*' + b + r'[^)]*\)[ \t]*$', re.M)
    text, hits = img.subn(embed, text)
    link = re.compile(r'\[([^\]]*)\]\([^)\s]*' + b + r'[^)]*\)')
    text, n = link.subn(lambda m: f"[[{name}|{m.group(1)}]]" if m.group(1) else f"[[{name}]]", text)
    return text, hits + n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("note")
    ap.add_argument("urls", nargs="+", help="asset addresses copied from the article")
    args = ap.parse_args()

    if not os.path.isfile(args.note):
        die(f"note not found: {args.note}")
    if not os.path.isdir(ATTACHMENTS):
        die(f"attachments folder not found: {ATTACHMENTS}")

    text = open(args.note, encoding="utf-8").read()
    slug = slugify(os.path.splitext(os.path.basename(args.note))[0])
    n = next_index(slug)
    saved, orphans = [], []

    for raw in args.urls:
        url = unwrap(raw.strip())
        if not url.startswith("http"):
            print(f"  ✗ not a url, skipped: {raw[:60]}")
            continue
        base = os.path.basename(url)
        ext = os.path.splitext(base)[1][:5]
        name = f"{slug}-{n:02d}{ext}"
        dest = os.path.join(ATTACHMENTS, name)

        size, ctype = download(url, dest)
        if size is None:
            print(f"  ✗ download failed — {url}")
            continue
        if not ext:
            # a bare URL (a CDN download endpoint, say) carries no extension;
            # the served content-type does, and Obsidian renders by extension.
            ext = mimetypes.guess_extension(ctype or "") or ".bin"
            name = f"{slug}-{n:02d}{ext}"
            os.rename(dest, os.path.join(ATTACHMENTS, name))

        embed = f"![[{name}]]\n<!-- source: {url} -->"
        text, hits = repoint(text, base, name, embed)
        if not hits and raw != url:  # try the wrapped form's own basename too
            text, hits = repoint(text, os.path.basename(raw.split("?")[0]), name, embed)
        if not hits:
            orphans.append(embed)
        print(f"  ✓ {name}  {size // 1024} kB{'' if hits else '  (absente du Dump)'}")
        saved.append((name, size))
        n += 1

    if orphans:
        # not in the Dump — a diagram lifted from elsewhere, or an image the
        # extraction dropped. Park it under Notes rather than lose it.
        block = "\n\n" + "\n\n".join(orphans) + "\n"
        if "\n# Dump" in text:
            text = text.replace("\n# Dump", block + "\n# Dump", 1)
        else:
            text = text.rstrip() + block

    if saved:
        open(args.note, "w", encoding="utf-8").write(text)
        total = sum(s for _, s in saved)
        print(f"\n{len(saved)} attachment(s), {total // 1024} kB → {ATTACHMENTS}")
        if orphans:
            print(f"{len(orphans)} embed(s) added under # Notes — no match in the Dump.")
    else:
        print("Nothing saved — note untouched.")


if __name__ == "__main__":
    main()
