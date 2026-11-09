#!/usr/bin/env python3
"""Rebuild view.html (committed, prebuilt) from view.src.html with the design-system assembler, then fix what the
assembler cannot: the CSP <meta> must sit in <head> (a browser ignores it in <body>) and the page is in English.
Dev-time only: run after editing view.src.html or after a design-system release. make-page.py only copies view.html.

usage: build-view.py   (needs bun)"""
import re, subprocess, sys
from pathlib import Path
sys.dont_write_bytecode = True

HERE = Path(__file__).resolve().parent
SRC, OUT = HERE / 'view.src.html', HERE / 'view.html'
subprocess.run(['bun', str(HERE.parent / 'design-system' / 'artifact-build.mjs'), '--standalone', str(SRC), str(OUT)], check=True)
t = OUT.read_text(encoding='utf-8')
m = re.search(r'<meta http-equiv="Content-Security-Policy"[^>]*>\n?', t)
if not m or '</head>' not in t: sys.exit('build-view: CSP meta or </head> not found')
t = t[:m.start()] + t[m.end():]
t = t.replace('</head>', m.group(0).rstrip('\n') + '\n</head>', 1)
t = re.sub(r'<html lang="[^"]*"', '<html lang="en"', t, count=1)
for need in ('__VIEW_DATA__', 'commit-view.js', 'commit-vendor/marked.umd.js', 'commit-vendor/mermaid.min.js'):
    if t.count(need) != 1: sys.exit(f'build-view: {need!r} expected once in {OUT.name}')
OUT.write_text(t, encoding='utf-8')
print(f'{OUT.name}: CSP moved into <head>, lang=en, {len(t) // 1024} KB')
