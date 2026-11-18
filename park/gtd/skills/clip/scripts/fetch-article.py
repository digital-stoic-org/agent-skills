#!/usr/bin/env python3
"""Fetch a web article and emit clean markdown + metadata for anti-library capture.

Usage:  fetch-article.py <url> [--out DIR]

Writes  <out>/body.md   full article body, GitHub-flavored markdown, HTML stripped
Prints  a JSON metadata block on stdout (title, author, date, description, url, wordcount)

Extraction order:  Substack/Ghost JSON preloads -> JSON-LD -> <article> -> densest <div>.
Requires: curl, pandoc, python3-bs4.
"""

import argparse
import html
import json
import os
import re
import subprocess
import sys

UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")


def die(msg):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def fetch(url):
    r = subprocess.run(["curl", "-sL", "--max-time", "60", "-A", UA, url],
                       capture_output=True, text=True)
    if r.returncode != 0 or not r.stdout:
        die(f"curl failed for {url} (rc={r.returncode})")
    return r.stdout


# --- extraction strategies -------------------------------------------------

def from_substack(page):
    """Substack (and Ghost-alikes) inline the whole post as JSON in window._preloads."""
    m = re.search(r'window\._preloads\s*=\s*JSON\.parse\((".*?")\)', page, re.S)
    if not m:
        return None
    try:
        post = json.loads(json.loads(m.group(1))).get("post") or {}
    except (ValueError, AttributeError):
        return None
    if not post.get("body_html"):
        return None
    bylines = post.get("publishedBylines") or []
    return {
        "title": post.get("title"),
        "author": ", ".join(b.get("name", "") for b in bylines) or None,
        "date": (post.get("post_date") or "")[:10] or None,
        "description": post.get("description") or post.get("subtitle"),
        "wordcount": post.get("wordcount"),
        "body_html": post["body_html"],
        "strategy": "substack-preloads",
    }


def meta(soup, *keys):
    for k in keys:
        tag = (soup.find("meta", property=k) or soup.find("meta", attrs={"name": k}))
        if tag and tag.get("content"):
            return tag["content"].strip()
    return None


def from_jsonld(soup):
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string or "")
        except (ValueError, TypeError):
            continue
        for node in (data if isinstance(data, list) else [data]):
            if not isinstance(node, dict):
                continue
            if node.get("@type") in ("Article", "NewsArticle", "BlogPosting"):
                a = node.get("author")
                if isinstance(a, list):
                    a = a[0] if a else None
                if isinstance(a, dict):
                    a = a.get("name")
                return {
                    "title": node.get("headline"),
                    "author": a,
                    "date": (node.get("datePublished") or "")[:10] or None,
                    "description": node.get("description"),
                }
    return None


def from_dom(soup):
    """<article> if present, else the shallowest container holding ~all the prose.

    Scoring on descendant <p> text alone picks a leaf sub-div and silently loses
    the intro; keeping the shallowest node within 10% of the best score climbs
    back up to the real article container.
    """
    node = soup.find("article")
    if node and len(node.get_text(strip=True)) > 500:
        return str(node), "dom-article"
    scored = []
    for div in soup.find_all(["div", "main", "section"]):
        length = sum(len(p.get_text(" ", strip=True)) for p in div.find_all("p"))
        if length:
            scored.append((length, len(list(div.parents)), div))
    if not scored:
        return None, None
    best_len = max(s[0] for s in scored)
    if best_len < 300:
        return None, None
    keep = [s for s in scored if s[0] >= 0.9 * best_len]
    return str(min(keep, key=lambda s: s[1])[2]), "dom-density"


def unlazy(body_html):
    """Promote lazy-loaded sources to `src`.

    WordPress and friends ship `<img data-src=…>` with no `src` at all; pandoc and
    the inventory then both see zero images and the Dump silently loses every
    figure the argument rests on. Failure mode that reads as success.
    """
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(body_html, "html.parser")
    touched = False
    for img in soup.find_all("img"):
        src = img.get("src") or ""
        if src and not src.startswith("data:"):
            continue
        for attr in ("data-src", "data-lazy-src", "data-original", "data-lazy"):
            if img.get(attr):
                img["src"] = img[attr]
                touched = True
                break
        else:  # only a srcset — take its first candidate
            for attr in ("data-srcset", "srcset"):
                if img.get(attr):
                    img["src"] = img[attr].split(",")[0].strip().split(" ")[0]
                    touched = True
                    break
    return str(soup) if touched else body_html


# --- markdown post-processing ---------------------------------------------

def to_markdown(body_html):
    r = subprocess.run(["pandoc", "-f", "html", "-t", "gfm-raw_html", "--wrap=none"],
                       input=body_html, capture_output=True, text=True)
    if r.returncode != 0:
        die(f"pandoc failed: {r.stderr.strip()[:200]}")
    md = r.stdout
    # inline SVG icons and lightbox duplicates are pure noise, never content
    # (a share bar is a row of base64 icons wrapped in links — kilobytes of it)
    md = re.sub(r'\[!\[[^\]]*\]\(data:[^)]*\)\]\([^)]*\)', '', md)
    md = re.sub(r'^!\[[^\]]*\]\(data:[^)]*\)\n?', '', md, flags=re.M)
    md = re.sub(r'^\[\]\(https?://[^)]*\)\n?', '', md, flags=re.M)
    md = re.sub(r'\n{3,}', '\n\n', md)
    return md.strip()


def demote(md):
    """Shift every heading one level down so the dump nests under `# Dump`.

    Levels are normalized first: the article's own top level becomes H2,
    whatever it was, so a page mixing `#` and `##` stays coherent.
    """
    lines, fence = md.split("\n"), False
    tops = []
    for ln in lines:
        if ln.startswith("```"):
            fence = not fence
        elif not fence:
            m = re.match(r'^(#{1,6}) ', ln)
            if m:
                tops.append(len(m.group(1)))
    if not tops:
        return md
    shift = 2 - min(tops)
    if shift == 0:
        return md
    out, fence = [], False
    for ln in lines:
        if ln.startswith("```"):
            fence = not fence
            out.append(ln)
            continue
        m = re.match(r'^(#{1,6}) (.*)$', ln)
        if m and not fence:
            level = max(2, min(6, len(m.group(1)) + shift))
            out.append("#" * level + " " + m.group(2))
        else:
            out.append(ln)
    return "\n".join(out)


def inventory(body_html, article_url):
    """List the article's images WITHOUT downloading anything.

    Everything here is read off the HTML we already hold: no network call.
    Nothing is ever fetched until a human names the ones worth keeping.
    """
    from urllib.parse import unquote, urlparse
    from bs4 import BeautifulSoup

    host = urlparse(article_url).netloc.replace("www.", "")
    soup = BeautifulSoup(body_html, "html.parser")
    seen, out = set(), []

    for img in soup.find_all("img"):
        src = img.get("src") or ""
        if not src or src.startswith("data:"):
            continue  # inline SVG icons — never content
        # CDN wrappers embed the real asset, url-encoded, after the transform
        # params. Unwrapping yields full resolution AND collapses the lightbox
        # duplicate onto the displayed image.
        m = re.search(r'/(https?%3A%2F%2F\S+)$', src, re.I)
        url = unquote(m.group(1)) if m else src
        url = url.split("?")[0]
        if url in seen:
            continue
        seen.add(url)

        w = h = None
        alt = (img.get("alt") or "").strip()
        try:  # Substack stashes the true geometry in a JSON blob
            attrs = json.loads(html.unescape(img.get("data-attrs") or "{}"))
            w, h = attrs.get("width"), attrs.get("height")
            alt = alt or attrs.get("alt") or attrs.get("title") or ""
        except ValueError:
            pass
        w = w or img.get("width")
        h = h or img.get("height")
        try:
            w, h = int(w), int(h)
        except (TypeError, ValueError):
            w = h = None

        # an image whose enclosing link leaves the article's domain is an ad
        outbound = None
        for parent in img.parents:
            if parent.name == "a" and parent.get("href"):
                d = urlparse(parent["href"]).netloc.replace("www.", "")
                if d and d != host and "substackcdn" not in d:
                    outbound = d
                break

        if outbound:
            verdict, why = "noise", f"encart sponsor → {outbound}"
        elif w and h and (w < 200 or h < 200):
            verdict, why = "noise", f"icône/pixel {w}×{h}"
        else:
            verdict, why = "content", None

        out.append({"url": url, "src": src, "alt": alt, "width": w, "height": h,
                    "verdict": verdict, "why": why,
                    "section": nearest_heading(img), "context": preceding_text(img),
                    "ext": (os.path.splitext(url)[1] or ".png").split("#")[0][:5]})
    return out


def nearest_heading(img):
    """The heading the image sits under — what makes two 1456×971 PNGs tellable apart."""
    for node in img.parents:
        while node is not None:
            if getattr(node, "name", "") in ("h1", "h2", "h3", "h4"):
                return node.get_text(" ", strip=True)[:80]
            node = node.previous_sibling
    return None


def preceding_text(img):
    """The sentence the image illustrates, or its own caption."""
    for attr in ("figcaption", "caption"):
        cap = img.find_parent("figure")
        if cap:
            tag = cap.find(attr)
            if tag and tag.get_text(strip=True):
                return tag.get_text(" ", strip=True)[:100]
        break
    node = img
    for _ in range(40):
        node = node.previous_element
        if node is None:
            break
        if getattr(node, "name", "") in ("p", "blockquote", "li"):
            txt = node.get_text(" ", strip=True)
            if len(txt) > 25:
                return txt[-100:] if len(txt) > 100 else txt
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("--out", default="/praxis/.tmp/clip")
    ap.add_argument("--no-assets", action="store_true",
                    help="skip the image inventory (still never downloads)")
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    page = fetch(args.url)

    info = from_substack(page)
    if info:
        body_html, strategy = info.pop("body_html"), info.pop("strategy")
    else:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(page, "html.parser")
        for junk in soup(["script", "style", "nav", "footer", "aside", "form"]):
            junk.decompose()
        body_html, strategy = from_dom(soup)
        if not body_html:
            die("no article body found — page may be paywalled or JS-rendered")
        info = from_jsonld(soup) or {}
        info.setdefault("title", meta(soup, "og:title", "twitter:title")
                        or (soup.title.string.strip() if soup.title and soup.title.string else None))
        info.setdefault("author", meta(soup, "author", "article:author"))
        info.setdefault("date", (meta(soup, "article:published_time", "date") or "")[:10] or None)
        info.setdefault("description", meta(soup, "og:description", "description"))

    body_html = unlazy(body_html)
    md = demote(to_markdown(body_html))
    path = os.path.join(args.out, "body.md")
    with open(path, "w", encoding="utf-8") as f:
        f.write(md)

    info = {k: (html.unescape(v) if isinstance(v, str) else v) for k, v in info.items()}
    info.update({"url": args.url, "strategy": strategy, "body_md": path,
                 "chars": len(md), "wordcount": info.get("wordcount") or len(md.split())})
    info["assets"] = [] if args.no_assets else inventory(body_html, args.url)
    print(json.dumps(info, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
