#!/usr/bin/env python3
"""gist:commit page: scan JSON (+ optional agent notes JSON) -> self-contained impact map on the verdict template.
The agent only DESIGNATES (project ids, target ids, evidence strings) in notes.json; this code copies them into the page.

usage: make-page.py scan.json [--notes notes.json] [-o page.html] [--keep]
  defaults from the scan's config (config.py): out = <root>/build/commit-map.html; the tmp folder holding scan.json is removed after the build unless --keep
notes.json = {"targets": {"<tid>": {"name": "...", "desc": "..."}},
              "projects": {"<project id>": {"alerts": [{"rule": "...", "evidence": "..."}],
                                            "readers": [{"target": "<tid>", "conf": "sure|likely", "type": "...", "evidence": "..."}],
                                            "others": 0}}}"""
import argparse, datetime, html, json, os, posixpath, re, shutil, sys
from pathlib import Path
sys.dont_write_bytecode = True  # no __pycache__ inside the skill dir (plugin cache, data repo)
from taxonomy import KINDS, K, PLANES
import config

HERE = Path(__file__).resolve().parent
TPL = HERE.parent / 'verdict' / 'template.html'
E = html.escape
CLS = {k[0]: 'k-' + k[0] for k in KINDS}
STATUS = {'A': 'added', 'M': 'modified', 'R': 'moved', 'D': 'deleted', 'T': 'type changed', 'U': 'unmerged'}

CHROME = [
 ('<html lang="fr"', '<html lang="en"'),
 ("Envoyer vaut « j'ai parcouru la page ». Seuls tes écarts partent, avec les défauts appliqués.", 'Send means "I went through the page". Only your deviations go out, with the defaults applied.'),
 ('Thème : auto (suit le système), clair, sombre', 'Theme: auto (follows the system), light, dark'),
 ('Colle ce JSON dans la session, ou télécharge le fichier.', 'Paste this JSON into the session, or download the file.'),
 ('Pas de serveur configuré : utilise Exporter', 'No server configured: use Export'),
 ('Effacer toutes les réponses de cette page ?', 'Clear every answer on this page?'),
 ("Échec de l\\'envoi : exporte", 'Send failed: export'),
 ('Sélectionne et copie à la main', 'Select and copy by hand'),
 ('Ta question ou ta nuance…', 'Your question or nuance…'),
 ('Ce que tu as observé…', 'What you observed…'),
 ("Pourquoi pas d'accord ?", 'Why do you disagree?'),
 ("✋ pas d'accord", '✋ disagree'),
 ('Ta réponse…', 'Your answer…'),
 ('Commentaire…', 'Comment…'),
 ("c.title='commentaire'", "c.title='comment'"),
 ("' sans réponse'", "' unanswered'"),
 ("' bloquant'", "' blocking'"),
 ('JSON copié', 'JSON copied'),
 ('✅ Envoyé', '✅ Sent'),
 ('✅ relu, ok', '✅ reread, ok'),
 ('✏️ à corriger', '✏️ to fix'),
 ('✅ conforme', '✅ as expected'),
 ('❌ écart', '❌ deviation'),
 ('⏳ pas fait', '⏳ not done'),
 ('🟡 à revoir', '🟡 to review'),
 ('❌ non', '❌ no'),
 ('🏁 Verdict global', '🏁 Overall verdict'),
 ('📤 Ton feedback', '📤 Your feedback'),
 ('📤 Exporter', '📤 Export'),
 ('thème auto', 'theme: auto'), ('thème clair', 'theme: light'), ('thème sombre', 'theme: dark'),
 ('>Envoyer<', '>Send<'), ('>Réinitialiser<', '>Reset<'), ('>Télécharger<', '>Download<'), ('>Copier<', '>Copy<'), ('>Fermer<', '>Close<'),
 ('<title>Revue · TITRE</title>', '<title>Impact map · prototype</title>'),
]


def merge_notes(scan, notes):
    """Copy the agent's designations into the scan; unknown ids are reported, never invented."""
    ids = {p['id']: p for p in scan['projects']}
    targets = notes.get('targets', {})
    for pid, n in notes.get('projects', {}).items():
        if pid not in ids:
            print(f'notes: unknown project id {pid!r}, skipped', file=sys.stderr); continue
        p = ids[pid]
        p['alerts'] += [dict(rule=a['rule'], evidence=a.get('evidence', ''), source='agent') for a in n.get('alerts', [])]
        for r in n.get('readers', []):
            if r.get('target') not in targets:
                print(f'notes: {pid}: unknown target {r.get("target")!r}, skipped', file=sys.stderr); continue
            p['readers'].append(dict(target=r['target'], conf='sure' if r.get('conf') == 'sure' else 'likely', type=r.get('type', 'link'), evidence=r.get('evidence', '')))
        p['others'] = int(n.get('others', 0))
    return targets


def prepare(p):
    p['kinds'] = {}
    for f in p['files']:
        p['kinds'][f['kind']] = p['kinds'].get(f['kind'], 0) + f['n']
    p['flag'] = bool(p['alerts'] or p['decisions'])
    p['mism'] = any(f['mism'] for f in p['files'])
    p['short'] = re.sub(r' \((control|[^)]*)\)$', '', p['name'])


def weight(p, plane=None):
    return sum(K[k]['w'] * n for k, n in p['kinds'].items() if plane in (None, K[k]['plane']))


def kinds_tip(p, plane=None):
    return '\n'.join(f'{K[k]["label"]} ({K[k]["plane"]}): {n} file{"s" if n > 1 else ""} × weight {K[k]["w"]}' for k, n in p['kinds'].items() if plane in (None, K[k]['plane']))


def worst(row, side):
    s = sum(row)
    return max(max(side * side * r / (s * s), s * s / (side * side * r)) for r in row)


def squarify(vals, x, y, w, h):
    tot = sum(vals); vals = [v * w * h / tot for v in vals]; out = []
    while vals:
        side = min(w, h); row = [vals[0]]; i = 1
        while i < len(vals) and worst(row + [vals[i]], side) <= worst(row, side):
            row.append(vals[i]); i += 1
        s = sum(row)
        if w >= h:
            rw = s / h; yy = y
            for v in row: out.append((x, yy, rw, v / rw)); yy += v / rw
            x += rw; w -= rw
        else:
            rh = s / w; xx = x
            for v in row: out.append((xx, y, v / rh, rh)); xx += v / rh
            y += rh; h -= rh
        vals = vals[i:]
    return out


def pct(r, W_, H_):
    x, y, w, h = r
    return f'left:{x / W_ * 100:.2f}%;top:{y / H_ * 100:.2f}%;width:{w / W_ * 100:.2f}%;height:{h / H_ * 100:.2f}%'


def tip(s):
    return f' data-tip="{E(s)}"'


def alert_tip(a):
    return f'⚠️ detected: {a["rule"]}\nevidence: {a["evidence"]}\nsource: {"git scan (deterministic)" if a.get("source") == "script" else "agent reading (check it)"}'


def dec_tip(d):
    return f'🎯 {d["q"]}\n★ {d["reco"]}: {d["why"]}\n' + '\n'.join(f'{o["id"]} {o["label"]} → {o["effect"]}' for o in d['opts'])


def marks(p):
    m = ''.join(f'<span class="mk-a"{tip(alert_tip(a))}>⚠️</span>' for a in p['alerts'])
    m += ''.join(f'<span{tip(dec_tip(d))}>🎯</span>' for d in p['decisions'])
    if p['mism']:
        mm = [f for f in p['files'] if f['mism']]
        m += f'<span class="mism"{tip("↔ function and repo disagree:" + "".join(chr(10) + f["path"] + " is " + K[f["kind"]]["label"] + " (" + K[f["kind"]]["plane"] + ") in a " + f["repo_desc"] for f in mm[:5]))}>↔</span>'
    return m


def bands(p, plane=None):
    return ''.join(f'<i class="{CLS[k]}" style="flex:{K[k]["w"] * n:.2f}"{tip(K[k]["label"] + " · " + K[k]["plane"] + chr(10) + K[k]["define"] + chr(10) + str(n) + " file(s) × weight " + str(K[k]["w"]))}></i>'
                   for k, *_ in KINDS for n in [p['kinds'].get(k, 0)] if n and plane in (None, K[k]['plane']))


def treemap(DATA, ROOTS):
    MW, MH = 100.0, 60.0
    halves = [(pl, sum(weight(p, pl) for p in DATA)) for pl in PLANES]
    halves = [h for h in halves if h[1] > 0]
    tot = sum(w for _, w in halves); x = 0; out = []
    for pl, hw in halves:
        w = MW * hw / tot
        repos = []
        for repo in ROOTS:
            ps = [p for p in DATA if p['repo'] == repo and weight(p, pl) > 0]
            if ps: repos.append((repo, ps, sum(weight(p, pl) for p in ps)))
        rects = squarify([r[2] for r in repos], 0, 0, w, MH)
        inner = ''
        for (repo, ps, _), rr in zip(repos, rects):
            ps = sorted(ps, key=lambda p: weight(p, pl), reverse=True)
            sub = squarify([weight(p, pl) for p in ps], 0, 0, rr[2], rr[3])
            tiles = ''.join(f'<a class="tile" data-p="p-{p["id"]}" href="#p-{p["id"]}" style="{pct(ir, rr[2], rr[3])}"{tip(p["name"] + " · " + pl + " plane" + chr(10) + kinds_tip(p, pl) + chr(10) + "click = open the row")}>'
                            f'<span class="bands">{bands(p, pl)}</span><span class="tl">{E(p["short"])} {marks(p)}</span></a>' for p, ir in zip(ps, sub))
            inner += f'<div class="repo" style="{pct(rr, w, MH)}"><span class="rl"{tip("git repo " + ROOTS[repo])}>{E(repo)}</span><div class="inner">{tiles}</div></div>'
        out.append(f'<div class="plane" style="left:{x / MW * 100:.2f}%;width:{w / MW * 100:.2f}%"><span class="pl"{tip(pl + " plane = " + ", ".join(K[k]["label"] for k in K if K[k]["plane"] == pl) + chr(10) + "placed by function (file kind), framed by git repo")}>{pl}</span><div class="inner">{inner}</div></div>')
        x += w
    return f'<div class="cmap" style="aspect-ratio:{MW:.0f}/{MH:.0f}">{"".join(out)}</div>'


def treemap_phone(DATA):
    """Simplified vertical map for phones: plane panels stacked, one full-width bar per project; height grows with weight (label floor)."""
    wmax = max([weight(p, pl) for p in DATA for pl in PLANES] + [1e-9])
    out = ''
    for pl in PLANES:
        ps = sorted([p for p in DATA if weight(p, pl) > 0], key=lambda p: weight(p, pl), reverse=True)
        if not ps: continue
        bars = ''.join(f'<a class="tile" data-p="p-{p["id"]}" href="#p-{p["id"]}" style="height:{1.9 + 4.1 * weight(p, pl) / wmax:.2f}rem"{tip(p["name"] + " · " + pl + " plane" + chr(10) + kinds_tip(p, pl))}>'
                       f'<span class="bands">{bands(p, pl)}</span><span class="tl">{E(p["short"])} <span class="mute">{E(p["repo"])}</span> {marks(p)}</span></a>' for p in ps)
        out += f'<div class="pm"><span class="pl">{pl}</span>{bars}</div>'
    return f'<div class="cmap-m">{out}</div>'


def matrix(DATA, targets):
    rows = sorted([p for p in DATA if p['readers']], key=weight, reverse=True)
    if not rows:
        return '<div class="mxw"><p class="mxt">Who is touched <span class="mute">· no link recorded yet: the agent adds them in notes.json (v0)</span></p></div>'
    cols = []
    for p in rows:
        for r in p['readers']:
            if r['target'] not in cols: cols.append(r['target'])
    head = '<tr><th></th>' + ''.join(f'<th{tip(targets[c].get("desc", ""))}>{E(targets[c].get("name", c))}</th>' for c in cols) + '<th></th></tr>'
    body = ''
    for p in rows:
        by = {r['target']: r for r in p['readers']}
        dom = max(p['kinds'], key=lambda k: K[k]['w'] * p['kinds'][k])
        cells = ''
        for col in cols:
            if col in by:
                r = by[col]
                cells += f'<td{tip(p["short"] + " → " + targets[col].get("name", col) + chr(10) + "link: " + r["type"] + " · " + r["conf"] + chr(10) + "evidence: " + r["evidence"])}><span class="dot {"d-s" if r["conf"] == "sure" else "d-l"} kc-{dom}"></span></td>'
            else:
                cells += '<td></td>'
        n = len(p['readers']) + p['others']
        body += f'<tr data-p="p-{p["id"]}" tabindex="0"><td class="mn"><i class="sq {CLS[dom]}"></i>{E(p["short"])}</td>{cells}<td class="mc"{tip(str(len(p["readers"])) + " links shown" + (", " + str(p["others"]) + " weaker not shown" if p["others"] else ""))}>{n}</td></tr>'
    return (f'<div class="mxw"><p class="mxt">Who is touched <span class="mute">· changed project → who reads it</span></p><div class="gw"><table class="mx">{head}{body}</table></div>'
            f'<p class="foot"><span class="dot d-s kc-har"></span> sure link · <span class="dot d-l kc-har"></span> likely, guessed · dot colour = kind of what changed · last column = links in total · hover for the evidence</p></div>')


def files_block(p):
    out = ''
    for k, *_ in KINDS:
        fs = [f for f in p['files'] if f['kind'] == k]
        if not fs: continue
        items = ' '.join(f'<span class="fl"{tip(STATUS.get(f["st"], f["st"]) + (" (staged)" if f["staged"] else "") + " · " + f["path"] + (" (" + str(f["n"]) + " files)" if f["n"] > 1 else "") + (" ← " + f["orig"] if f.get("orig") else "") + chr(10) + "kind: " + K[k]["label"] + " · " + f["rule"] + chr(10) + "location: " + f["repo_desc"] + (chr(10) + "↔ function and repo disagree" if f["mism"] else "") + (chr(10) + "⛔ sensitive: never staged by this page" if f["secret"] else ""))}><code>{f["st"]}</code> {E(posixpath.basename(f["path"].rstrip("/")) + ("/" if f["path"].endswith("/") else ""))}{"×" + str(f["n"]) if f["n"] > 1 else ""}{" ↔" if f["mism"] else ""}{" ⛔" if f["secret"] else ""}</span>' for f in fs)
        out += f'<div><i class="sq {CLS[k]}"></i><span class="kd">{K[k]["label"]}</span> {items}</div>'
    return out


def row(p, wmax, targets):
    if p['readers']:
        rd = ' · '.join(f'<span{tip(r["type"] + " · " + r["conf"] + chr(10) + r["evidence"])}>{E(targets[r["target"]].get("name", r["target"]))} <span class="mute">{E(r["conf"])}</span></span>' for r in p['readers'][:3])
        if len(p['readers']) > 3 or p['others']: rd += f' · <span class="mute">+{len(p["readers"]) - 3 + p["others"] if len(p["readers"]) > 3 else p["others"]} others</span>'
    else:
        rd = '<span class="mute">no link recorded</span>'
    o = ''.join(f'<div class="opt2" data-opt="{v}"{tip(t)}>{k}</div>' for v, k, t in [
        ('validate', 'V', 'Validate: added to the commands'), ('later', 'L', 'Later: left aside (default when silent)'), ('exclude', 'X', 'Exclude: left aside, marked as not for this round')])
    al = ''.join(f'<div class="pa"{tip(alert_tip(a))}>⚠️ {E(a["rule"].split(":")[0])}</div>' for a in p['alerts'])
    planes = ' '.join(pl for pl in PLANES if weight(p, pl))
    counts = ' · '.join(f'{k} {n}' for k, n in p['kinds'].items())
    s = f'''<div class="prow" id="p-{p["id"]}" data-block="p-{p["id"]}" data-type="decision" data-level="moyenne" data-default="later" data-flag="{int(p['flag'])}">
 <div class="phead"><span class="pn" role="button" tabindex="0">{E(p["short"])} <span class="mute">{E(p["repo"])}</span> {marks(p)}</span><span class="rb" style="width:{weight(p) / wmax * 100:.0f}%">{bands(p)}</span><span class="pc"{tip(kinds_tip(p))}>{E(planes)} · {E(counts)}</span><div class="opts">{o}</div></div>
 <div class="pan">{al}<dl><dt>reads it</dt><dd>{rd}</dd><dt>files</dt><dd>{files_block(p)}</dd><dt>commit</dt><dd><code class="cc"></code></dd></dl></div>
</div>
'''
    for d in p['decisions']:
        oo = ''.join(f'<div class="opt2{" rec" if o["id"] == d["reco"] else ""}" data-opt="{o["id"]}"{tip(o["id"] + " → " + o["effect"])}>{o["id"]} · {E(o["label"])}{" ★" if o["id"] == d["reco"] else ""}</div>' for o in d['opts'])
        s += f'''<div class="pdec" data-block="{d["id"]}" data-type="decision" data-level="moyenne" data-default="{d["reco"]}"><span class="dq"{tip(dec_tip(d))}>🎯 {E(d["q"])}</span><div class="opts">{oo}</div><span class="mute">★ {E(d["why"])}</span></div>
'''
    return s


def ranked(DATA, targets):
    allp = sorted(DATA, key=weight, reverse=True)
    wmax = max([weight(p) for p in allp] + [1e-9])
    lg = ' '.join(f'<span class="pl-l">{pl}</span> ' + ' '.join(f'<span{tip(K[k]["define"] + chr(10) + "weight " + str(K[k]["w"]))}><i class="sq {CLS[k]}"></i>{K[k]["label"]}</span>' for k in K if K[k]['plane'] == pl) for pl in PLANES)
    keys = f'<span{tip("an alert: something detected that makes the commit risky")}>⚠️ alert</span> · <span{tip("a decision: each answer changes the commands")}>🎯 decision</span> · <span{tip("the file kind says one plane, its git repo says the other")}>↔ plane differs from repo</span> · V L X'
    return f'<div class="rk"><div class="rkh"><span>{lg}</span><span class="mute">{keys}</span></div>' + ''.join(row(p, wmax, targets) for p in allp) + '</div>'


CSS = '''<style>
/* gist:commit radar v3, DS 0.6.1: local layer, tokens only; moves into src/template.src.html once validated.
   Kinds = ordinal risk, so one sequential ramp (--seq) carries them; the plane is the treemap half, not a colour.
   generated and trace share seq-1: they never sit in the same half; the tooltip names them. Link confidence = form (fill vs dash).
   Deliberate DS drift (Mat, 11/09): rounded rows, pills and matrix rows (radius beyond top-level containers); state = ground, never a rail on a rounded row. */
main{max-width:100rem} .top .in{max-width:100rem}
.global .note{display:none}
.k-har{background:var(--seq-5)} .k-stg{background:var(--seq-4)} .k-dlv{background:var(--seq-3)} .k-inp{background:var(--seq-2)} .k-gen,.k-trc{background:var(--seq-1)}
.sq{display:inline-block;width:.75em;height:.75em;border-radius:2px;margin-right:.3em;vertical-align:-.04em}
.radar{display:grid;grid-template-columns:minmax(0,11fr) minmax(0,9fr);gap:var(--s3);align-items:start;margin-top:var(--s2);font-family:var(--sans);font-size:var(--u-sm);font-size-adjust:none}
.cmap{position:relative;width:100%}
.cmap .plane{position:absolute;top:0;bottom:0;box-sizing:border-box;border:3px solid var(--bg);border-radius:calc(3*var(--r));background:var(--sunk);overflow:hidden}
.cmap .pl,.cmap .rl{position:absolute;top:0;left:0;right:0;height:1.3rem;padding:0 var(--s1);display:flex;align-items:center;font-family:var(--label-font);font-variant-caps:var(--label-caps);text-transform:var(--label-tt);letter-spacing:var(--label-ls);font-size:var(--label-size);font-weight:var(--label-w);overflow:hidden;white-space:nowrap}
.cmap .pl{top:3px;left:var(--s0);right:auto;height:1.05rem;border-radius:999px;background:var(--fg);color:var(--bg)}
.cmap .rl{color:var(--muted)}
.cmap .repo{position:absolute;box-sizing:border-box;border:3px solid var(--sunk);border-radius:calc(2*var(--r));background:var(--surface);overflow:hidden}
.cmap .inner{position:absolute;top:1.3rem;left:0;right:0;bottom:0}
.cmap .tile{position:absolute;box-sizing:border-box;border:2px solid var(--surface);border-radius:calc(1.5*var(--r));overflow:hidden;text-decoration:none;color:var(--fg)}
.cmap .tile.lit,.cmap .tile:hover{outline:3px solid var(--accent);outline-offset:-2px;z-index:2}
.cmap .tile.v-exclude{opacity:.3}
.cmap .tile.v-validate{border:3px solid var(--ok)}
.cmap .tile.v-validate .tl::before{content:"\\2713  "}
.cmap .bands{position:absolute;inset:0;display:flex;flex-direction:column;gap:2px}
.cmap .bands i{display:block;min-height:2px}
.cmap .tl{position:absolute;top:3px;left:3px;max-width:calc(100% - 6px);background:var(--surface);border-radius:999px;padding:0 .3em;font-size:var(--u-xs);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cmap-m{display:none}
.cmap-m .pm{display:flex;flex-direction:column;gap:3px;background:var(--sunk);border-radius:calc(3*var(--r));padding:var(--s0);margin-bottom:var(--s1)}
.cmap-m .pl{align-self:flex-start;border-radius:999px;background:var(--fg);color:var(--bg);padding:0 var(--s1);font-family:var(--label-font);font-variant-caps:var(--label-caps);text-transform:var(--label-tt);letter-spacing:var(--label-ls);font-size:var(--label-size);font-weight:var(--label-w)}
.cmap-m .tile{position:relative;display:block;box-sizing:border-box;border:2px solid var(--sunk);border-radius:calc(1.5*var(--r));overflow:hidden;text-decoration:none;color:var(--fg)}
.cmap-m .bands{position:absolute;inset:0;display:flex;gap:2px}
.cmap-m .bands i{display:block;min-width:2px}
.cmap-m .tl{position:absolute;top:3px;left:3px;max-width:calc(100% - 6px);background:var(--surface);border-radius:999px;padding:0 .4em;font-size:var(--u-xs);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cmap-m .tile.lit{outline:3px solid var(--accent);outline-offset:-2px}
.cmap-m .tile.v-validate{border-color:var(--ok)} .cmap-m .tile.v-validate .tl::before{content:"\\2713  "}
.cmap-m .tile.v-exclude{opacity:.3}
.mism{font-weight:600;color:var(--accent)}
.mxw{margin-top:var(--s2);border:1px solid var(--line);border-radius:calc(2*var(--r));padding:var(--s1) var(--s1) var(--s0)}
.mxt{margin:0 0 var(--s0);font-weight:600}
.gw{overflow-x:auto}
.mx{border-collapse:separate;border-spacing:0 2px;font-size:var(--u-xs);width:100%;color:var(--fg);font-variant-numeric:tabular-nums}
.mx th{font-weight:600;color:var(--muted);text-align:center;padding:0 4px var(--s0);white-space:nowrap;border:0}
.mx td{text-align:center;padding:3px 4px;border:0}
.mx tr[data-p] td{background:var(--sunk)}
.mx tr[data-p] td:first-child{border-radius:999px 0 0 999px;text-align:left;white-space:nowrap;padding-left:var(--s1)}
.mx tr[data-p] td:last-child{border-radius:0 999px 999px 0;padding-right:var(--s1);color:var(--muted);font-weight:600}
.mx tr.lit td{background:var(--accent-weak)}
.mx tr[data-p]{cursor:pointer}
.dot{display:inline-block;width:.85rem;height:.85rem;border-radius:50%;box-sizing:border-box;vertical-align:-.12em}
.dot.d-s{background:currentColor}
.dot.d-l{border:2px dashed currentColor}
.kc-har{color:var(--seq-5)} .kc-stg{color:var(--seq-4)} .kc-dlv{color:var(--seq-3)} .kc-inp{color:var(--seq-2)} .kc-gen,.kc-trc{color:var(--seq-1)}
.foot{color:var(--muted);font-size:var(--u-xs);margin:var(--s0) 0 0}
.foot .dot{width:.7rem;height:.7rem}
.rk .rkh{display:flex;justify-content:space-between;gap:var(--s1);flex-wrap:wrap;font-size:var(--u-xs);padding:var(--s0) var(--s1);margin-bottom:var(--s0);border-radius:calc(2*var(--r));background:var(--sunk)}
.rkh span span{margin-right:var(--s1)}
.pl-l{font-weight:600;text-transform:uppercase;color:var(--muted)}
.prow{border-radius:calc(2*var(--r));padding:3px var(--s0) 3px var(--s1);margin:2px 0}
.prow.v-validate{background:var(--ok-weak)} .prow.v-exclude{opacity:.5}
.prow.lit{background:var(--accent-weak)}
.prow.open{background:var(--surface);outline:1px solid var(--line-strong)}
.phead{display:grid;grid-template-columns:minmax(0,1fr) 5rem 9.5rem auto;gap:var(--s1);align-items:center}
.pn{cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pn:hover{text-decoration:underline}
.rb{display:flex;gap:2px;height:.8rem;min-width:3px}
.rb i{display:block}
.rb i:last-child{border-radius:0 4px 4px 0}
.pc{font-size:var(--u-xs);color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.prow .opts,.pdec .opts{display:flex;gap:2px;margin:0}
.prow .opt2,.pdec .opt2{padding:0 .6em;font-size:var(--u-xs);cursor:pointer;line-height:1.6;border-radius:999px}
.prow .opt2.sel,.pdec .opt2.sel{padding:0 calc(.6em - 1px)}
.pan,.pdec,.prow:not(.open)>.rbar,.prow:not(.open)>textarea{display:none}
.prow.open .pan{display:block;padding:var(--s0) 0 var(--s1)}
.prow.open>.rbar{display:flex;margin-top:0}
.prow.open+.pdec{display:flex;gap:var(--s1);align-items:center;flex-wrap:wrap;padding:var(--s0) var(--s1);margin:0 0 var(--s0) var(--s2);border-radius:calc(2*var(--r));background:var(--warn-weak);font-size:var(--u-sm)}
.pdec>.rbar{margin:0}
.pa{color:var(--warn)}
.pan dl{display:grid;grid-template-columns:5rem minmax(0,1fr);gap:2px var(--s1);margin:var(--s0) 0 0}
.pan dt{color:var(--faint);font-family:var(--label-font);font-variant-caps:var(--label-caps);text-transform:var(--label-tt);letter-spacing:var(--label-ls);font-size:var(--label-size);font-weight:var(--label-w);padding-top:2px}
.pan dd{margin:0}
.pan dd>div{margin-bottom:2px}
.kd{color:var(--muted);margin-right:var(--s0)}
.fl{white-space:nowrap;margin-right:var(--s1)}
.pan code{font-size:var(--u-xs)}
.note-ex{color:var(--faint);font-size:var(--u-xs);margin-top:var(--s1)}
.ctip{position:fixed;z-index:30;max-width:24rem;background:var(--surface);color:var(--fg);border:1px solid var(--line-strong);border-radius:var(--r);padding:var(--s0) var(--s1);font-family:var(--sans);font-size:var(--u-xs);font-size-adjust:none;white-space:pre-line;pointer-events:none}
#cpDlg{max-width:60rem}
#cpDlg textarea{white-space:pre;overflow-x:auto}
@media (max-width:900px){ .radar{grid-template-columns:1fr} }
@media (max-width:640px){ .cmap,.mxw{display:none} .cmap-m{display:block} .phead{grid-template-columns:minmax(0,1fr) 3rem auto} .pc{display:none} }
</style>
'''


def script(DATA, commit_cmd):
    """Commands window + radar wiring (tile <-> row <-> matrix, one open row, bulk validate, reset, state tint, tooltips).
    Reads picks from the verdict runtime localStorage. Commands run in a subshell: exit and set -e never close the terminal."""
    rows = []
    for p in DATA:
        usable = [f['path'] for f in p['files'] if not f['secret']]
        if not usable: continue
        rows.append(dict(id='p-' + p['id'], name=p['short'] + ' · ' + p['repo'], repo=p['root'], usable=usable, commit=commit_cmd,
                         decs=[dict(id=d['id'], reco=d['reco'], ex={o['id']: o['exclude'] for o in d['opts']}) for d in p['decisions']]))
    data = json.dumps(rows, ensure_ascii=False).replace('</', '<\\/')
    js = r'''<script>
(function(){
  const rows = JSON.parse(document.getElementById('cp-data').textContent);
  const rid = (document.querySelector('meta[name="review-id"]')||{}).content || '';
  const $$ = s => [...document.querySelectorAll(s)];
  const q = s => /^[A-Za-z0-9._\/@+=:,-]+$/.test(s) ? s : "'" + s.replace(/'/g, "'\\''") + "'";
  const pl = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
  function state(){ try { return JSON.parse(localStorage.getItem('review:' + rid)) || {} } catch(e) { return {} } }
  // silence = later: only an explicit "validate" click puts a project in the commands
  const verdict = (st, id, d) => (((st.blocs || {})[id] || {}).verdict) || d;
  // every decision's chosen answer excludes some paths; exclusions add up; the commit command gets the common ancestor of what is left
  const commitLine = (r, f, quote) => r.commit.replace('{path}', quote(f.cc)).replace('{repo}', quote(r.repo));
  function commonDir(ps){ const ds = ps.map(p => p.endsWith('/') ? p.slice(0, -1) : p.split('/').slice(0, -1).join('/'));
    if (!ds.length || ds.some(d => !d)) return ''; let c = ds[0].split('/');
    ds.slice(1).forEach(d => { const s = d.split('/'); let i = 0; while (i < c.length && c[i] === s[i]) i++; c = c.slice(0, i); }); return c.join('/'); }
  function variant(st, r){
    const ex = new Set(); r.decs.forEach(d => (d.ex[verdict(st, d.id, d.reco)] || d.ex[d.reco] || []).forEach(x => ex.add(x)));
    const paths = r.usable.filter(u => !ex.has(u)), c = commonDir(paths);
    return { paths, cc: r.repo + (c ? '/' + c : '') }; }
  function build(){
    const st = state();
    rows.forEach(r => { const v = verdict(st, r.id, 'later');
      $$('[data-p="' + r.id + '"].tile, #' + r.id).forEach(e => { e.classList.remove('v-validate', 'v-later', 'v-exclude'); e.classList.add('v-' + v); });
      const c = document.querySelector('#' + r.id + ' .cc'); if (c) c.textContent = commitLine(r, variant(st, r), s => s); });
    const ok = rows.filter(r => verdict(st, r.id, 'later') === 'validate'), off = rows.filter(r => verdict(st, r.id, 'later') !== 'validate');
    const sum = document.getElementById('cp-sum'); if (sum) sum.textContent = pl(ok.length, 'commit') + ' · ' + pl(off.length, 'project') + ' left aside';
    const fab = document.getElementById('bCmd'); if (fab) fab.textContent = '🚀 Commands (' + ok.length + ')';
    const ta = document.getElementById('cp-cmd');
    if (!ok.length) { ta.value = '# no project validated: click V on the projects to commit'; return; }
    const repos = [...new Set(ok.map(r => r.repo))];
    const L = ['( set -e', '  # guard: an already loaded index would mix unvalidated files into a commit',
      '  for r in ' + repos.map(q).join(' ') + '; do',
      '    git -C "$r" diff --cached --quiet || { echo "⛔ index not empty: $r"; exit 1; }', '  done'];
    ok.forEach(r => { const f = variant(st, r);
      if (!f.paths.length) { L.push('', '  # ' + r.name + ': every path excluded by its decisions, nothing to add'); return; }
      L.push('', '  # ' + r.name + r.decs.map(d => ' (' + d.id + ': ' + verdict(st, d.id, d.reco) + ')').join(''), '  git -C ' + q(r.repo) + ' add -A -- ' + f.paths.map(q).join(' '), '  ' + commitLine(r, f, q)); });
    if (off.length) L.push('', '  # left aside: ' + off.map(r => r.name + ' (' + verdict(st, r.id, 'later') + ')').join(', '));
    L.push(')');
    ta.value = L.join('\n');
  }
  function copy(){
    const t = document.getElementById('cp-cmd').value, done = () => { const b = document.getElementById('cp-copy'); b.textContent = '✅ Copied'; setTimeout(() => b.textContent = '📋 Copy', 1800); };
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t).then(done);
    document.getElementById('cp-cmd').select();
    try { document.execCommand('copy'); done() } catch(e) {}
  }
  function open(id, scroll){
    $$('.prow.open').forEach(r => { if (r.id !== id) r.classList.remove('open'); });
    const r = document.getElementById(id); if (!r) return;
    r.classList.toggle('open');
    if (scroll) r.scrollIntoView({block: 'nearest', behavior: window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  }
  function hl(id, on){ $$('[data-p="' + id + '"], #' + id).forEach(e => e.classList.toggle('lit', on)); }
  // one tooltip for every [data-tip]: what was detected, what decided, which rule classified
  const tipEl = document.createElement('div'); tipEl.className = 'ctip'; tipEl.setAttribute('role', 'tooltip'); tipEl.hidden = true;
  function showTip(t, x, y){
    tipEl.textContent = t.dataset.tip; tipEl.hidden = false;
    const r = tipEl.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    tipEl.style.left = Math.max(4, Math.min(x + 12, W - r.width - 4)) + 'px';
    tipEl.style.top = (y + 16 + r.height > H ? y - r.height - 8 : y + 16) + 'px';
  }
  document.addEventListener('mouseover', e => { const t = e.target.closest('[data-tip]'); if (t) showTip(t, e.clientX, e.clientY); else tipEl.hidden = true; });
  document.addEventListener('mousemove', e => { const t = e.target.closest('[data-tip]'); if (t && !tipEl.hidden) showTip(t, e.clientX, e.clientY); });
  document.addEventListener('focusin', e => { const t = e.target.closest('[data-tip]'); if (t) { const b = t.getBoundingClientRect(); showTip(t, b.left, b.bottom); } });
  document.addEventListener('focusout', () => tipEl.hidden = true);
  document.addEventListener('click', () => setTimeout(build, 0));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') tipEl.hidden = true; if (e.key === 'Enter' || e.key === ' ') setTimeout(build, 0) });
  document.addEventListener('DOMContentLoaded', () => {
    // one review id per snapshot: drop the stored picks of older snapshots so the browser does not pile them up
    try { Object.keys(localStorage).filter(k => k.startsWith('review:gist-commit-') && k !== 'review:' + rid).forEach(k => localStorage.removeItem(k)); } catch(e) {}
    document.body.appendChild(tipEl);
    const top = document.getElementById('bExport'), mk = (id, t) => { const b = document.createElement('button'); b.type = 'button'; b.id = id; b.dataset.tip = t; top.parentNode.insertBefore(b, top); return b; };
    const bulk = mk('bBulk', 'Validate every project with no alert and no decision'); bulk.className = 'ghost'; bulk.textContent = '✅ Validate unflagged';
    bulk.onclick = () => { const st = state(); $$('.prow[data-flag="0"]').forEach(r => { if (verdict(st, r.id, 'later') !== 'validate') r.querySelector('.opt2[data-opt="validate"]').click(); }); };
    const reset = mk('bReset', 'Back to the initial state: every project on Later, every decision on its ★ default, notes cleared'); reset.className = 'ghost'; reset.textContent = '↺ Reset';
    reset.onclick = () => { if (confirm('Reset every choice to the initial state?')) { localStorage.removeItem('review:' + rid); location.reload(); } };
    const fab = mk('bCmd', 'Every commit command, chained: one paste in a terminal'), dlg = document.getElementById('cpDlg');
    fab.onclick = () => { build(); dlg.showModal(); };
    document.getElementById('cp-copy').onclick = copy;
    document.getElementById('cp-close').onclick = () => dlg.close();
    $$('.tile').forEach(t => { const id = t.dataset.p;
      t.onmouseenter = () => hl(id, true); t.onmouseleave = () => hl(id, false);
      t.onclick = e => { e.preventDefault(); open(id, true); }; });
    $$('.prow').forEach(r => { r.onmouseenter = () => hl(r.id, true); r.onmouseleave = () => hl(r.id, false);
      const n = r.querySelector('.pn'); n.onclick = () => open(r.id); n.onkeydown = e => { if (e.key === 'Enter') open(r.id); }; });
    $$('.mx tr[data-p]').forEach(r => { r.onmouseenter = () => hl(r.dataset.p, true); r.onmouseleave = () => hl(r.dataset.p, false);
      r.onclick = () => open(r.dataset.p, true); r.onkeydown = e => { if (e.key === 'Enter') open(r.dataset.p, true); }; });
    build();
  });
})();
</script>
'''
    return f'''
<dialog id="cpDlg">
 <h3>🚀 Commands to paste <span class="mute" id="cp-sum"></span></h3>
 <textarea id="cp-cmd" readonly></textarea>
 <div class="dlg-act">
  <button id="cp-copy" type="button">📋 Copy</button>
  <button class="ghost" id="cp-close" type="button">Close</button>
 </div>
</dialog>
<script type="application/json" id="cp-data">{data}</script>
{js}'''


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('scan')
    ap.add_argument('--notes')
    ap.add_argument('-o', '--out', help="default: the config's out")
    ap.add_argument('--keep', action='store_true', help='keep the tmp folder (scan.json, notes.json)')
    a = ap.parse_args()
    scan = json.load(open(a.scan, encoding='utf-8'))
    cfg = scan.get('config') or config.load()
    a.out = a.out or cfg['out']
    via = 'ccommit (Haiku writes the message, direct commit)' if cfg['commit_cmd'].startswith('ccommit') else cfg['commit_cmd']
    targets = merge_notes(scan, json.load(open(a.notes, encoding='utf-8'))) if a.notes else {}
    DATA = [p for p in scan['projects'] if p['files']]
    for p in DATA: prepare(p)
    ROOTS = {r['name']: r['root'] for r in scan['repos']}
    snap = datetime.datetime.fromisoformat(scan['generated_at'])
    repos_line = ' · '.join(f'{r["name"]} {r["branch"]}@{r["head"]} ({r["changed"]})' for r in scan['repos'])
    body = (CSS + f'<div class="radar"><div>{treemap(DATA, ROOTS) if DATA else ""}{treemap_phone(DATA) if DATA else ""}{matrix(DATA, targets)}'
            f'<p class="note-ex">Snapshot {snap:%Y-%m-%d %H:%M} · {E(repos_line)} · git state moves: rescan before pasting · area = risk weight · halves = plane by function, frames = git repo · one paste = one git add + {E(via)} per V project; stops on an already loaded index or a failed commit</p></div>'
            f'{ranked(DATA, targets) if DATA else "<p>Nothing to commit.</p>"}</div>' + script(DATA, cfg['commit_cmd']))
    content = '<!-- REVIEW-HTML:CONTENT:BEGIN  (replace everything down to CONTENT:END) -->\n' + body + '<!-- REVIEW-HTML:CONTENT:END -->'
    out = Path(a.out); out.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy(TPL, out)
    t = out.read_text(encoding='utf-8')
    t = re.sub(r'<!-- REVIEW-HTML:CONTENT:BEGIN.*?<!-- REVIEW-HTML:CONTENT:END -->', lambda m: content, t, flags=re.S)
    rid = f'gist-commit-{snap:%Y%m%d-%H%M%S}'  # one id per snapshot: picks never carry over to a newer git state
    t = t.replace('content="REVIEW_ID"', f'content="{rid}"').replace('<meta name="review-phase" content="explorer">', '<meta name="review-phase" content="finir">')
    missing = [fr for fr, _ in CHROME if fr not in t]
    if missing: sys.exit(f'chrome strings not found in template (verdict template changed?): {missing}')
    for fr, en in CHROME:
        t = t.replace(fr, en)
    nflag = sum(1 for p in DATA if p['flag'])
    t = t.replace('<strong>TITRE_COURT</strong>', f'<strong>Impact map</strong> <span class="mute">{len(DATA)} projects · {nflag} flagged · {snap:%H:%M}</span>')
    out.write_text(t, encoding='utf-8')
    tmp = os.path.realpath(cfg['tmp'])
    if not a.keep and os.path.realpath(a.scan).startswith(tmp + os.sep) and os.path.isdir(tmp):
        shutil.rmtree(tmp)  # scan.json and notes.json are spent once the page is built
        d, root = os.path.dirname(tmp), os.path.realpath(cfg['root'])
        while d.startswith(root + os.sep) and not os.listdir(d):  # parents the scan created (e.g. .tmp/), never the root
            os.rmdir(d); d = os.path.dirname(d)
    print(f'{config.page_link(cfg, out)} · {len(DATA)} projects · {nflag} flagged · review-id {rid}' + ('' if a.keep else ' · tmp cleaned'))


if __name__ == '__main__':
    main()
