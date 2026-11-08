#!/usr/bin/env python3
"""Export the visual-grammar work into the verdict skill (gist).

Writes <verdict>/grammaires/grammaires.md (recipes + verbatim entries) and vignettes.html (thumbnail markup),
injects the thumbnail CSS into src/template.src.html between GRAMMAR-CSS markers, then assembles template.html
with the design-system builder (base CSS and fonts injected by marker).
Sources (single truth, nothing retyped): make-catalog.py (catalog parsers, OBJ, SK, PAGE_CSS), make-recettes.py (SOCLE, RECIPES, CSS),
make-c6.py (CORE, SIGNAL, RESERVE, LAB, SK, CSS) and the briefs they parse.
"""
import datetime, html, importlib.util, os, re, subprocess

B = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.dirname(os.path.dirname(B))  # skill root: src -> grammaires -> verdict
GRAM = os.path.dirname(B)


def load(name, file):
    sp = importlib.util.spec_from_file_location(name, os.path.join(B, file))
    m = importlib.util.module_from_spec(sp)
    sp.loader.exec_module(m)
    return m


mc, mr, m6 = load("mc", "make-catalog.py"), load("mr", "make-recettes.py"), load("m6", "make-c6.py")
A = mc.parse_catalog(mc.read(mc.SRC_A))
Bc = mc.parse_catalog(mc.read(mc.SRC_B))
t6 = mc.read(m6.SRC)
CHECKS = m6.parse_entries(m6.yaml_block(t6, r"2\. Checks"))
GRAMS6 = m6.parse_entries(m6.yaml_block(t6, r"3\. Visual grammars"))
RULES = re.search(r"(architecture_rules_file_example:.*?)\Z", m6.yaml_block(t6, r"4\. Recipe proposal"), re.S).group(1).strip()
CAT = {x["id"]: x for x in A + Bc}
C6 = {x["id"]: x for x in CHECKS + GRAMS6}
noemo = lambda s: re.sub(r"^[^\w(]+", "", s).strip()
name = lambda i: (CAT.get(i) or C6.get(i) or {}).get("name", "")

placed = {i for i, _ in mr.SOCLE}
for _, _, core, cond in mr.RECIPES:
    placed |= {c[0] for c in core} | {c[0] for c in cond}
reserve = [i for i in CAT if i not in placed]

L = []
w = L.append
gen = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
w("# grammaires: visual grammar catalog for verdict")
w("generated: %s by gist/skills/verdict/grammaires/src/make-grammaires.py; entries copied verbatim from the briefs, nothing selected." % gen)
w("counts: catalog %d V (representation grammars, BRIEF-grammaires-visuelles-A) + %d P (review patterns, -B); C6 architecture conformance %d R (grammars) + %d A (checks, BRIEF-conformite-archi)." % (len(A), len(Bc), len(GRAMS6), len(CHECKS)))
w("use: read sections 1-4 when composing a page; for each id you place, read its entry: grep -A16 '^### V24 ' grammaires.md. Thumbnail markup: vignettes.html, element id=<ID>; copy the <div class=\"sk\"> block (its CSS is already in template.html).")
w("tiers: socle = every page; core = always for the type; signal = only when its trigger is true; reserve = on demand or when Mat asks.")
w("omitted (declared): round-1 catalog list ALWAYS (superseded by socle), objective x grammar matrices, research gaps, round ledgers and decisions; see /praxis/projects/_archive/viz-review/build/catalog-grammaires.html and recettes.html.")
w("")
w("## 1. Objectives (ids used below)")
for k, (title, q, ids, note, *_rest) in mc.OBJ.items():
    w("- %s %s: %s | grammars: %s | %s" % (k, title, q, ", ".join(ids), note))
w("")
w("## 2. Socle (every page)")
for i, lab in mr.SOCLE:
    w("- %s · %s · %s" % (i, lab, name(i)))
w("")
w("## 3. Recipes per type")
for key, title, core, cond in mr.RECIPES:
    w("### %s (%s)" % (key, noemo(title)))
    w("core:")
    for i, lab in core:
        w("- %s · %s · %s" % (i, lab, name(i)))
    w("signal:")
    for i, lab, trg in cond:
        w("- %s · %s · %s | trigger: %s" % (i, lab, name(i), trg))
w("### code conformance (C6 architecture, adds to code)")
w("core:")
for i, when in m6.CORE:
    w("- %s · %s · %s | when: %s" % (i, m6.LAB[i], name(i), when))
w("signal:")
for i, trg in m6.SIGNAL:
    w("- %s · %s · %s | trigger: %s" % (i, m6.LAB[i], name(i), trg))
w("reserve:")
for i in m6.RESERVE:
    w("- %s · %s · %s" % (i, m6.LAB[i], name(i)))
w("")
w("## 4. Reserve (catalog entries outside socle, core and signal)")
for i in reserve:
    x = CAT[i]
    w("- %s · %s · %s" % (i, x.get("name", ""), x.get("question") or x.get("problem") or ""))
w("")
w("## 5. Architecture rules file example (C6, one per target repo)")
w("```yaml")
w(RULES)
w("```")
w("")
for title, entries in (("6. Catalog entries V (representation)", A), ("7. Catalog entries P (review patterns)", Bc),
                       ("8. C6 grammars R", GRAMS6), ("9. C6 checks A", CHECKS)):
    w("## " + title)
    for x in entries:
        w("### %s · %s" % (x["id"], x.get("name", "")))
        for k, v in x.items():
            if k not in ("id", "name"):
                w("%s: %s" % (k, " ".join(str(v).split())))
        w("")
open(os.path.join(GRAM, "grammaires.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")

# thumbnails
css = mc.PAGE_CSS + mr.CSS + m6.CSS


def scalable(css):
    """Thumbnail text sizes become calc(Xrem * var(--k)) inside .sk, so .sk.full rescales them all without em compounding."""
    def rule(m):
        sel, body = m.group(1), m.group(2)
        if all(part.strip().startswith(".sk") for part in sel.split(",")):
            body = re.sub(r"font-size:([\d.]+)rem", r"font-size:calc(\1rem * var(--k))", body)
        return sel + "{" + body + "}"
    return re.sub(r"([^{}]+)\{([^{}]*)\}", rule, css)


css = scalable(css) + """
/* .sk = thumbnail scale (vignettes). .sk.full = same markup at reading size, for real content in a review block */
.sk{--k:1}
.sk.full{--k:1.35;flex:none;width:auto;min-height:0;line-height:1.5;padding:12px 14px}
.sk.full .svg{max-width:520px;display:block}
.sk.full .svg text{font-size:10px}
"""
# inject into the template source, then assemble template.html with the design-system builder (base CSS + fonts by marker)
src_path = os.path.join(SKILL, "src", "template.src.html")
tpl_path = os.path.join(SKILL, "template.html")
src = open(src_path, encoding="utf-8").read()
block = "/*GRAMMAR-CSS:BEGIN thumbnails from vignettes.html*/\n%s\n/*GRAMMAR-CSS:END*/\n" % css.strip()
if "/*GRAMMAR-CSS:BEGIN" not in src:
    raise SystemExit("GRAMMAR-CSS markers missing in " + src_path)
src = re.sub(r"/\*GRAMMAR-CSS:BEGIN.*?/\*GRAMMAR-CSS:END\*/\n", lambda _: block, src, count=1, flags=re.S)
open(src_path, "w", encoding="utf-8").write(src)
DS_BUILD = os.path.join(os.path.dirname(SKILL), "design-system", "artifact-build.mjs")
subprocess.run(["bun", DS_BUILD, src_path, tpl_path], check=True)
tpl = open(tpl_path, encoding="utf-8").read()

style = re.search(r"<style>(.*?)</style>", tpl, re.S).group(1)
e = html.escape
tiles = []
for group, ids, sk in (("Catalogue V · grammaires de représentation", [x["id"] for x in A], mc.SK),
                       ("Catalogue P · patterns de revue", [x["id"] for x in Bc], mc.SK),
                       ("C6 R · conformité d'architecture", [x["id"] for x in GRAMS6], m6.SK)):
    tiles.append("<h2>%s <small>%d</small></h2><div class=\"grid g3\">" % (e(group), len(ids)))
    for i in ids:
        tiles.append('<div class="card" id="%s"><h3><code>%s</code> %s</h3>\n<div class="sk">%s</div>\n</div>' % (i, i, e(name(i)), sk.get(i, '<p class="mute">pas de vignette</p>')))
    tiles.append("</div>")
page = ('<!doctype html>\n<html lang="fr" data-theme="light">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        '<title>Vignettes · grammaires verdict</title>\n<style>%s</style>\n</head>\n<body class="mode-outil">\n<main>\n<section class="hero"><span class="tag acc">verdict</span> <span class="tag">généré le %s</span>'
        '<h1>Vignettes des grammaires</h1><p class="lead">Une vignette par grammaire, à copier dans une page de revue : le bloc <code>div.sk</code> de chaque carte. Les détails sont dans <code>grammaires.md</code>.</p></section>\n%s\n</main>\n</body>\n</html>\n'
        % (style, gen, "\n".join(tiles)))
open(os.path.join(GRAM, "vignettes.html"), "w", encoding="utf-8").write(page)
print("grammaires.md %d lines · reserve %d · vignettes %d tiles · template css %d chars" % (len(L), len(reserve), len(A) + len(Bc) + len(GRAMS6), len(block)))
