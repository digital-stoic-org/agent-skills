#!/usr/bin/env python3
"""Check generated review pages: balanced tags, required control ids, node --check on inline scripts,
card contract (data-type, decision level/default/options, tri items, unique ids).
Budget overruns (hero words, first-level words and cards in phase explorer) are warnings, not failures.

Usage: check-page.py page.html [...]; exit 1 on any failure.
"""
import os, re, subprocess, sys, tempfile
from html.parser import HTMLParser

IDS = ["bExport", "bSend", "dlg", "toast", "dlgTxt", "bTheme"]
TYPES = {"constat", "decision", "question", "relecture", "tri", "essai"}
BUDGET = {"explorer": (7, 250), "construire": (10, 400)}
CAPS = [(r"<h3[^>]*>(.*?)</h3>", 6, "title"), (r"<li[^>]*data-item=[^>]*>(.*?)</li>", 8, "tri line"), (r'<div class="opt2[^"]*"[^>]*>(.*?)(?:<br>|</div>)', 6, "option"), (r'<p class="recline">(.*?)</p>', 16, "reco")]  # phase -> (max cards, max first-level words); finir = no cap
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr",
        "circle", "rect", "line", "path", "polygon", "polyline", "ellipse", "stop", "use"}


class Bal(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack, self.errs = [], []

    def handle_starttag(self, t, a):
        if t not in VOID:
            self.stack.append((t, self.getpos()[0]))

    def handle_startendtag(self, t, a):
        pass

    def handle_endtag(self, t):
        if t in VOID:
            return
        if self.stack and self.stack[-1][0] == t:
            self.stack.pop()
        else:
            self.errs.append("line %d: </%s> but open %s" % (self.getpos()[0], t, self.stack[-1] if self.stack else None))


def content(s):
    a, b = s.rfind("REVIEW-HTML:CONTENT:BEGIN"), s.rfind("REVIEW-HTML:CONTENT:END")
    return s[a:b] if 0 <= a < b else ""


def cards(s):
    bad, c = [], content(s)
    tags = re.findall(r"<[a-z]+[^>]*\sdata-block=[^>]*>", c)
    ids = [re.search(r'data-block="([^"]*)"', t).group(1) for t in tags]
    bad += ["duplicate block id %s" % i for i in sorted({i for i in ids if ids.count(i) > 1})]
    for t, i in zip(tags, ids):
        m = re.search(r'data-type="([^"]*)"', t)
        typ = m.group(1) if m else None
        if typ not in TYPES:
            bad.append("block %s: data-type %s not in %s" % (i, typ, sorted(TYPES)))
            continue
        body = c[c.index(t):]
        nxt = re.search(r"<[a-z]+[^>]*\sdata-block=", body[len(t):])
        body = body[:len(t) + nxt.start()] if nxt else body
        if typ == "decision":
            lvl = re.search(r'data-level="([^"]*)"', t)
            opts = re.findall(r'data-opt="([^"]*)"', body)
            if not lvl or lvl.group(1) not in ("moyenne", "critique"):
                bad.append("block %s: decision needs data-level moyenne|critique" % i)
            elif lvl.group(1) == "moyenne":
                if re.search(r'class="opt2[^"]*"[^>]*>(?:(?!</div>).)*class="mute"', re.sub(r"<details\b.*?</details>", " ", body, flags=re.S), re.S):
                    bad.append("block %s: moyenne options carry pros/cons; move them to <details> (critique only shows them)" % i)
                d = re.search(r'data-default="([^"]*)"', t)
                if not d or d.group(1) not in opts:
                    bad.append("block %s: moyenne needs data-default naming one of data-opt %s" % (i, opts))
            if len(opts) < 2:
                bad.append("block %s: decision needs >= 2 .opt2[data-opt]" % i)
        if typ == "tri":
            if not re.search(r"data-item=", body):
                bad.append("block %s: tri needs li[data-item]" % i)
            ch = (re.search(r'data-choices="([^"]*)"', t) or [None, "garder|plus-tard|jeter"])[1].split("|")
            bad += ["block %s: item default %s not in data-choices %s" % (i, d, ch) for d in re.findall(r'data-item="[^"]*"[^>]*data-default="([^"]*)"', body) if d not in ch]
    return bad


def words(h):
    h = re.sub(r"<(details|pre|script|style)\b.*?</\1>", " ", h, flags=re.S)
    return len([x for x in re.sub(r"<[^>]+>", " ", h).split() if re.search(r"\w", x)])  # emoji and separators are not words to read


def budget(s):
    w, c = [], content(s)
    hero = re.search(r'<section class="hero">(.*?)</section>', c, re.S)
    if hero and words(hero.group(1)) > 30:
        w.append("hero %d first-level words > 30 (source, checks, counts go in its details)" % words(hero.group(1)))
    nod = re.sub(r"<details\b.*?</details>", " ", c, flags=re.S)
    for rx, cap, what in CAPS:
        for m in re.finditer(rx, nod, re.S):
            txt = re.sub(r"<(span class=\"(?:mute|flag)\"[^>]*>.*?</span>|[^>]+>)", " ", m.group(1)).replace("★", " ")
            n = len([x for x in txt.split() if re.search(r"\w", x)])
            if n > cap:
                w.append("%s %d words > %d: %s" % (what, n, cap, " ".join(txt.split())[:60]))
    # Vabc cuts (Mat, 08/11): no grey line at first level; a constat = title + at most one visual, its sentence goes in details
    ncap = len(re.findall(r'class="cap"', nod))
    if ncap:
        w.append("%d grey .cap line(s) at first level: move them into <details>" % ncap)
    for m in re.finditer(r'<[a-z]+[^>]*data-block="([^"]*)"[^>]*data-type="constat"', nod):
        rest = nod[m.end():]
        nxt = re.search(r"<[a-z]+[^>]*\sdata-block=", rest)
        if re.search(r"<p[\s>]", rest[:nxt.start()] if nxt else rest):
            w.append("constat %s: sentence at first level, put it in <details><summary>détail</summary>" % m.group(1))
    ph = re.search(r'<meta name="review-phase" content="([^"]*)"', s)
    ph = ph.group(1) if ph else ""
    if ph not in ("explorer", "construire", "finir"):
        w.append("review-phase %r not explorer|construire|finir" % ph)
    if ph in BUDGET:
        n, total = len(re.findall(r"\sdata-block=", c)), words(c)
        mc, mw = BUDGET[ph]
        if n > mc:
            w.append("%d cards > %d for phase %s" % (n, mc, ph))
        if total > mw:
            w.append("%d first-level words > %d for phase %s" % (total, mw, ph))
    return w


def check(path):
    s = open(path, encoding="utf-8").read()
    bad = []
    p = Bal()
    p.feed(s)
    bad += p.errs[:5]
    if p.stack:
        bad.append("unclosed: %s" % p.stack[-5:])
    bad += ["missing id %s" % i for i in IDS if not re.search(r'id="%s"' % i, s)]
    bad += cards(s)
    for n, js in enumerate(re.findall(r"<script>(.*?)</script>", s, re.S)):
        with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False) as f:
            f.write(js)
        r = subprocess.run(["node", "--check", f.name], capture_output=True, text=True)
        os.unlink(f.name)
        if r.returncode:
            bad.append("script %d: %s" % (n, r.stderr.strip().splitlines()[-1]))
    warn = budget(s)
    print("%s %s (%d KB)%s%s" % ("OK " if not bad else "BAD", os.path.basename(path), len(s) // 1024,
                                 "".join("\n  - " + b for b in bad), "".join("\n  ~ " + w for w in warn)))
    return not bad


if __name__ == "__main__":
    sys.exit(0 if all([check(a) for a in sys.argv[1:]]) else 1)
