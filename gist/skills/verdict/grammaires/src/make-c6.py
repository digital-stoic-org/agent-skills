#!/usr/bin/env python3
"""Generate conformite-archi.html: review of objective C6 (architectural conformance) for the code recipe.

Source copied verbatim: wip/BRIEF-conformite-archi.md (checks A01.., grammars R01.., recipe, rules-file example, gaps).
Authored here: French labels, thumbnails, triggers in French, decisions. Chrome + runtime from plan-review.html.
Usage: python3 make-c6.py -> writes build/conformite-archi.html
"""
import datetime, hashlib, html, importlib.util, os, re

B = os.path.dirname(os.path.abspath(__file__))
def load(name, file):
    s = importlib.util.spec_from_file_location(name, os.path.join(B, file)); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
mc = load("mc", "make-catalog.py"); mr = load("mr", "make-recettes.py")
SRC = os.path.join(B, "BRIEF-conformite-archi.md")
OUT = os.path.join(B, "conformite-archi.html")
RID = "viz-review-c6-20261103"
e = lambda s: html.escape(str(s), quote=True)


def yaml_block(text, heading):
    m = re.search(r"^#\s*" + heading + r".*?```yaml\n(.*?)```", text, re.S | re.M)
    return m.group(1) if m else ""


def parse_entries(block):
    entries, cur, key, ind = [], None, None, None
    for line in block.splitlines():
        mi = re.match(r"^(\s*)- id:\s*(\S+)", line)
        if mi:
            ind = len(mi.group(1)); cur = {"id": mi.group(2)}; entries.append(cur); key = "id"; continue
        if cur is None:
            continue
        mk = re.match(r"^\s{%d}(\w+):\s?(.*)$" % (ind + 2), line)
        if mk:
            key = mk.group(1); cur[key] = mk.group(2).strip(); continue
        if key and line.strip():
            cur[key] += " " + line.strip()
    return entries


LAB = {
 "R01": "bandes de couches, flèches interdites en rouge", "R02": "matrice de dépendances rangée par couche", "R03": "liens ajoutés / retirés par le changement",
 "R04": "carte hexagonale cœur / ports / adaptateurs", "R05": "pastille de pureté par fichier touché", "R06": "barre de couverture des lignes modifiées",
 "R07": "marge verte / rouge dans le diff", "R08": "couverture par composant, avant / après", "R09": "couverture du repo en treemap",
 "R10": "cycles surlignés sur la carte d'archi", "R11": "nuage abstraction × instabilité", "R12": "mini-tableau du couplage avant / après",
 "R13": "« tu as touché A, pas B » : paires qui changent ensemble", "R14": "bulles de points chauds", "R15": "tableau des règles : passe / échoue / non évalué",
}
CORE = [("R15", "toujours, et dit explicitement « non évalué »"), ("R03", "toujours, marche dès le premier jour sans fichier de règles"),
        ("R05", "si un fichier touché appartient à un composant déclaré pur"), ("R06", "si un fichier de couverture existe, sinon carte grise « fichiers sans test »")]
SIGNAL = [("R01", "le fichier de règles déclare des couches et le diff crée un lien interdit ou non couvert"), ("R02", "plus de 12 composants, ou un cycle"),
          ("R10", "un cycle nouveau ou agrandi"), ("R07", "un fichier a des lignes modifiées jamais exécutées"), ("R08", "une couverture de référence est disponible"),
          ("R12", "le couplage d'un composant touché bouge nettement"), ("R13", "un fichier « jumeau » habituel n'a pas été touché"),
          ("R04", "le repo déclare cœur / ports / adaptateurs et le diff touche le cœur")]
RESERVE = ["R09", "R11", "R14"]
SUBS = [("patterns", "🏛️ Patterns respectés", "couches, hexagonal, sens des dépendances"), ("purity", "🧪 Domaine pur vs appels externes", "fichiers, réseau, process, horloge, LLM"),
        ("coverage", "✅ Couverture de test", "surtout des lignes modifiées"), ("structure", "🕸️ Structure", "cycles, couplage, taille, fichiers qui changent ensemble")]

SK = {
 "R01": '<svg viewBox="0 0 220 96" class="svg"><rect x="4" y="4" width="212" height="26" class="f-line"/><rect x="4" y="35" width="212" height="26" class="f-line"/><rect x="4" y="66" width="212" height="26" class="f-line"/><text x="8" y="20">entrée</text><text x="8" y="51">adaptateurs</text><text x="8" y="82">cœur</text><rect x="90" y="9" width="40" height="16" class="box"/><rect x="90" y="40" width="40" height="16" class="box"/><rect x="150" y="71" width="40" height="16" class="box"/><line x1="110" y1="25" x2="110" y2="40"/><line x1="120" y1="56" x2="160" y2="71"/><line x1="185" y1="71" x2="135" y2="25" class="bad"/></svg>',
 "R02": '<div class="dsm">' + ''.join('<i class="%s"></i>' % ('k-acc' if r == c else ('k-no' if (r, c) == (1, 3) else ('k-mid' if (r, c) in ((2, 0), (3, 1), (4, 2), (3, 0)) else ''))) for r in range(5) for c in range(5)) + '</div><div class="mute">rouge au-dessus de la diagonale = viole l\'ordre des couches</div>',
 "R03": '<div class="ledger"><span>+ entrée → cœur</span><em class="k-ok">autorisé</em><span>+ cœur → fs</span><em class="k-no">interdit</em><span>+ scripts → notes</span><em class="k-mid">non couvert</em><span>− pit → util</span><em class="k-un">retiré</em></div>',
 "R04": '<svg viewBox="0 0 220 100" class="svg"><circle cx="110" cy="50" r="46" class="ring2"/><circle cx="110" cy="50" r="30" class="ring1"/><circle cx="110" cy="50" r="15" class="f-okbg"/><text x="110" y="53" text-anchor="middle">cœur</text><text x="110" y="28" text-anchor="middle">ports</text><text x="110" y="11" text-anchor="middle">adaptateurs</text><circle cx="100" cy="46" r="3.5" class="f-no"/><circle cx="150" cy="30" r="3" class="f-acc"/><text x="160" y="90">● IO dans le cœur</text></svg>',
 "R05": '<div class="ledger"><span><code>state.ts</code></span><em class="k-ok">PUR</em><span><code>notes.ts</code></span><em class="k-no">PUR + IO:fs ✗</em><span><code>pit.ts</code></span><em class="k-acc">IO:proc</em><span><code>dash.ts</code></span><em class="k-acc">IO:clock</em></div>',
 "R06": '<div class="ds"><span><code>dash.ts</code></span><span><i class="k-ok" style="width:70%"></i><i class="k-no" style="width:30%"></i></span><span><code>pit.ts</code></span><span><i class="k-ok" style="width:95%"></i><i class="k-no" style="width:5%"></i></span></div><div class="hl" style="margin-top:6px;text-align:center">74 % des lignes modifiées testées</div>',
 "R07": '<div class="gut"><span class="g-ok"></span><code>+ const s = load()</code><span class="g-ok"></span><code>+ if (!s) return</code><span class="g-no"></span><code>+ s.pits.push(x)</code><span class="g-no"></span><code>+ save(s)</code></div>',
 "R08": '<div class="cov"><span>cœur</span><span class="b"><i style="width:82%"></i><s style="left:88%"></s></span><span class="k-no">↓6</span><span>adapt.</span><span class="b"><i style="width:40%"></i><s style="left:38%"></s></span><span class="k-ok">↑2</span></div><div class="mute">trait = avant le changement</div>',
 "R09": '<div class="tm"><i class="k-ok" style="flex:4">hooks</i><div style="flex:3;display:flex;flex-direction:column;gap:3px"><i class="k-no" style="flex:2;outline:2px solid var(--accent)">dash</i><i class="k-mid" style="flex:1">pit</i></div><i style="flex:2">site</i></div>',
 "R10": '<svg viewBox="0 0 220 96" class="svg"><rect x="20" y="10" width="50" height="20" class="box hot"/><rect x="150" y="10" width="50" height="20" class="box hot"/><rect x="85" y="66" width="50" height="20" class="box hot"/><rect x="150" y="66" width="50" height="20" class="box"/><text x="45" y="24" text-anchor="middle">dash</text><text x="175" y="24" text-anchor="middle">notes</text><text x="110" y="80" text-anchor="middle">pit</text><text x="175" y="80" text-anchor="middle">util</text><line x1="70" y1="20" x2="150" y2="20" class="bad"/><line x1="170" y1="30" x2="125" y2="66" class="bad"/><line x1="95" y1="66" x2="50" y2="30" class="bad"/><line x1="135" y1="76" x2="150" y2="76"/></svg>',
 "R11": '<svg viewBox="0 0 220 100" class="svg"><rect x="30" y="4" width="90" height="90" class="box"/><line x1="30" y1="4" x2="120" y2="94" class="dashed"/><circle cx="50" cy="30" r="4" class="f-acc"/><circle cx="100" cy="70" r="4" class="f-acc"/><circle cx="105" cy="15" r="4" class="f-no"/><text x="126" y="20">loin de la</text><text x="126" y="32">diagonale = </text><text x="126" y="44">à surveiller</text><text x="75" y="100" text-anchor="middle">instabilité →</text></svg>',
 "R12": '<table class="mini"><tr><th></th><th>entrants</th><th>sortants</th><th>instabilité</th></tr><tr><td>cœur</td><td>5</td><td>1 → 3</td><td class="k-no">0,17 → 0,38</td></tr><tr><td>dash</td><td>1</td><td>4</td><td>0,80</td></tr></table>',
 "R13": '<div class="ledger"><span><code>dash.ts</code> touché</span><em class="k-ok">✓</em><span><code>dash.test.ts</code> d\'habitude avec (92 %)</span><em class="k-no">pas touché</em></div>',
 "R14": '<svg viewBox="0 0 220 96" class="svg"><circle cx="60" cy="50" r="34" class="f-midbg"/><circle cx="60" cy="50" r="38" class="m"/><circle cx="130" cy="40" r="20" class="f-line"/><circle cx="180" cy="62" r="14" class="f-line"/><circle cx="160" cy="20" r="9" class="f-line"/><text x="60" y="54" text-anchor="middle">pit.ts</text><text x="150" y="92">taille × fréquence</text></svg>',
 "R15": '<table class="mini"><tr><th>règle</th><th></th></tr><tr><td>ordre des couches</td><td class="k-ok">✓</td></tr><tr><td>cœur pur</td><td class="k-no">✗ 1</td></tr><tr><td>pas de cycle</td><td class="k-ok">✓</td></tr><tr><td>couverture ≥ 70 %</td><td class="k-un">non évalué</td></tr></table>',
}
CSS = """
.gut{display:grid;grid-template-columns:6px 1fr;gap:2px 6px;font-size:.66rem}.gut span{border-radius:2px}.g-ok{background:var(--ok)}.g-no{background:var(--no)}
.cov{display:grid;grid-template-columns:auto 1fr auto;gap:5px 8px;align-items:center}.cov .b{position:relative;height:10px;background:var(--line);border-radius:5px}
.cov .b i{display:block;height:100%;background:var(--accent);border-radius:5px}.cov .b s{position:absolute;top:-3px;width:2px;height:16px;background:var(--fg)}
.cov em,.cov span.k-no,.cov span.k-ok{font-size:.66rem;padding:0 5px;border-radius:99px}
.chk{display:grid;grid-template-columns:auto 1fr auto;gap:6px 12px;font-size:.84rem;align-items:start;margin-top:8px}
.chk .nm b{color:var(--accent)}.chk .ds2{color:var(--muted);font-size:.8rem}
.chk em{font-style:normal;font-size:.72rem;padding:1px 8px;border-radius:99px;white-space:nowrap}
pre.yaml{font-size:.74rem;max-height:420px}
"""


def thumb(i, cat, trigger=None, cls=""):
    trg = f'<div class="trg">⚡ si : {e(trigger)}</div>' if trigger else ""
    return (f'<a class="th {cls}" href="#{i}" title="{e(cat[i].get("name",""))}"><div class="sk">{SK[i]}</div>'
            f'<div class="lb"><b>{i}</b> · {e(LAB[i])}</div>{trg}</a>')


def tool_tag(s):
    s = s.lower()
    if s.startswith("yes"): return ("ok", "sans outillage")
    if s.startswith("partial"): return ("mid", "partiel")
    return ("no", "outillage requis")


def main():
    t, chrome = mc.read(SRC), mc.read(mc.CHROME)
    checks = parse_entries(yaml_block(t, r"2\. Checks"))
    grams = parse_entries(yaml_block(t, r"3\. Visual grammars"))
    cat = {x["id"]: x for x in checks + grams}
    rules = re.search(r"(architecture_rules_file_example:.*?)\Z", yaml_block(t, r"4\. Recipe proposal"), re.S).group(1)
    gaps = yaml_block(t, r"5\. Gaps").split("sources_list:")[0].strip()
    style = re.search(r"<style>(.*?)</style>", chrome, re.S).group(1)
    top = re.search(r'(<div class="top">.*?</div></div>)\s*<main>', chrome, re.S).group(1).replace("📋 Revue du plan", "🏛️ Conformité archi")
    tail = re.search(r'(<dialog id="dlg">.*?<!--RUNTIME:END-->)', chrome, re.S).group(1)
    raw = open(SRC, "rb").read()
    prov = f'<span class="tag">📄 {os.path.basename(SRC)} · {datetime.datetime.fromtimestamp(os.path.getmtime(SRC)).strftime("%d/%m %H:%M")} · #{hashlib.sha256(raw).hexdigest()[:8]}</span>'

    subs = []
    for key, title, sub in SUBS:
        rows = ""
        for c in [c for c in checks if c.get("sub_objective", "").startswith(key)]:
            cls, tg = tool_tag(c.get("works_without_toolchain", ""))
            rows += f'<span class="nm" id="{c["id"]}"><b>{c["id"]}</b> · {e(c.get("name",""))}</span><span class="ds2">{e(c.get("short_description",""))}</span><span><em class="k-{cls}" title="{e(c.get("works_without_toolchain",""))}">{tg}</em></span>'
        subs.append(f'<div class="card" data-block="c6-{key}"><span class="unseen">non vu</span><h3>{e(title)} <small class="mute">{e(sub)}</small></h3><div class="chk">{rows}</div></div>')

    decs = [
     ("dec-c6-regles", "Un fichier de règles d'architecture par repo ?",
      [("A", "Oui, un seul fichier", "il sert à la fois à la carte d'archi, aux anneaux de rayon et aux règles ; rédigé une fois par le LLM, validé par toi"),
       ("B", "Non", "seulement les contrôles qui marchent sans règles : liens ajoutés, cycles, fichiers sans test"),
       ("C", "Plus tard", "commencer sans, l'ajouter au premier repo qui le mérite")],
      "A", "La carte d'archi que tu as validée exige déjà une table fichier → composant. Le fichier de règles n'est que cette table enrichie (couches, sens autorisés, modules IO). Un seul fichier évite deux sources qui divergent. Il doit vivre dans le repo cible, pas dans stint (outil séparé)."),
     ("dec-c6-couverture", "Couverture de test pour stint, qui n'a pas de fichier de couverture ?",
      [("A", "Repli", "carte grise : fichiers modifiés sans fichier de test correspondant"),
       ("B", "Investir", "produire un fichier lcov avec le runner de tests natif de Node pour les hooks"),
       ("C", "Ignorer", "pas de couverture pour stint")],
      "A", "Personne ne sait encore si les tests de stint (lancés par la CLI Claude) peuvent produire un fichier de couverture. Le repli marche dès aujourd'hui, et on investit seulement si le repli montre des trous."),
    ]
    dhtml = []
    for bid, q, opts, rec, why in decs:
        resp = "|".join(f"{k}:{k} · {e(n)}" for k, n, _ in opts) + "|question:❓ question"
        cards = "".join(f'<div class="opt2{" rec" if k == rec else ""}"><b>{k}</b> · {e(n)}{" ★" if k == rec else ""}<br><span class="mute">{e(d)}</span></div>' for k, n, d in opts)
        dhtml.append(f'<div class="card" data-block="{bid}" data-responses="{resp}"><span class="unseen">non vu</span><h3>{e(q)} <span class="tag">↩️ double sens</span></h3><div class="opts">{cards}</div><p class="recline"><b>Reco : {rec}.</b> {e(why)} <span class="mute">Sans réponse, je pars sur {rec}.</span></p></div>')

    ref = '<div class="catgrid">' + "".join(
        f'<details class="ent" id="{g["id"]}"><summary><div class="sk">{SK[g["id"]]}</div><div class="nm"><b>{g["id"]}</b> · {e(LAB[g["id"]])}<br><span class="mute">{e(g.get("short_description",""))}</span></div></summary><dl>'
        + "".join(f"<dt>{e(k)}</dt><dd>{mc.linkify(e(v))}</dd>" for k, v in g.items() if k != "id") + "</dl></details>" for g in grams) + "</div>"

    gen = datetime.datetime.now().strftime("%d/%m/%Y %H:%M")
    page = f'''<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="review-id" content="{RID}"><meta name="review-type" content="doc"><meta name="feedback-endpoint" content="">
<title>Revue · conformité architecturale (C6)</title>
<style>{style}{mc.PAGE_CSS}{mr.CSS}{CSS}</style></head><body>
{top}
<main>
<section class="hero">
 <span class="tag acc">viz-review</span> <span class="tag">recette code · nouvel objectif</span> <span class="tag">généré le {gen}</span> <span class="tag mid">⚠️ rien n'a été exécuté, sources en partie secondaires</span>
 <h1>La revue de code montre-t-elle si l'architecture est respectée ?</h1>
 <div class="kv" style="display:grid;grid-template-columns:auto 1fr;gap:4px 12px;max-width:820px;margin-top:10px">
  <b class="mute">Situation</b><span>Tu as demandé de voir les patterns respectés, la couverture de test et la séparation domaine pur / appels externes, au-delà du diff.</span>
  <b class="mute">Évaluation</b><span>{len(checks)} contrôles calculables par du code, dont la plupart sans outillage, et {len(grams)} grammaires pour les montrer. Rien n'utilise de LLM au moment de la revue.</span>
  <b class="mute">Demande</b><span><b>Valide la recette (4 éléments de cœur, 8 conditionnels), les 4 familles de contrôles et le fichier de règles, puis tranche 2 décisions. Compte environ 8 minutes.</b></span>
 </div>
 <p style="margin-top:8px">{prov}</p>
</section>

<h2>🧭 La recette proposée</h2>
<div class="card" data-block="c6-coeur"><span class="unseen">non vu</span><h3>Cœur <span class="tier t1">toujours ou presque</span></h3><div class="thumbs">{"".join(thumb(i, cat, t, "core") for i, t in CORE)}</div></div>
<div class="card" data-block="c6-signal" style="margin-top:14px"><span class="unseen">non vu</span><h3>Si signal <span class="tier t2">⚡ conditionnel</span></h3><div class="thumbs">{"".join(thumb(i, cat, t, "cond") for i, t in SIGNAL)}</div></div>
<div class="card" data-block="c6-reserve" style="margin-top:14px"><span class="unseen">non vu</span><h3>Réserve <span class="tier t3">à la demande</span></h3><div class="thumbs">{"".join(thumb(i, cat) for i in RESERVE)}</div></div>

<h2>🔎 Les contrôles, par famille <small>calculés par du code ; pastille = besoin d'outillage</small></h2>
<div class="grid" style="gap:14px">{"".join(subs)}</div>

<h2>📜 Le fichier de règles d'un repo <small>exemple, chemins illustratifs</small></h2>
<div class="card" data-block="c6-fichier-regles"><span class="unseen">non vu</span>
 <p>Ce fichier dit quels sont les composants, dans quel sens ils ont le droit de dépendre les uns des autres, quels modules comptent comme appels externes (<code>io_modules</code>) et quelles limites s'appliquent. <b>La liste des modules IO est notre invention, aucune source n'en donne une canonique : relis-la en priorité.</b></p>
 <pre class="yaml">{e(rules)}</pre></div>

<h2>❓ Deux décisions</h2>
<div class="grid" style="gap:14px">{"".join(dhtml)}</div>

<h2>🕳️ Ce qu'on ne sait pas</h2>
<div class="card" data-block="c6-trous"><span class="unseen">non vu</span>
 <ul style="margin:.2em 0;padding-left:1.1em">
  <li>Si les tests de stint peuvent produire un fichier de couverture. Sans lui, la couverture se réduit à « fichiers modifiés sans test ».</li>
  <li>La fiabilité de la lecture des imports par regex (imports sur plusieurs lignes, ré-exports, imports dynamiques) : à tester sur un cas forcé dans stint.</li>
  <li>La dérive entre le code et le modèle d'archi déclaré est une composition à nous : aucun outil existant trouvé.</li>
  <li>Aucun script n'a été exécuté, et le repo stint n'a pas été inspecté.</li>
 </ul>
 <details class="cands"><summary>Texte brut des trous, tel que rendu par la recherche</summary><pre class="raw">{e(gaps)}</pre></details></div>

<div class="global" data-global><h3>🏁 Verdict global sur la conformité architecturale</h3><p class="mute" style="font-size:.88rem">Ton avis d'ensemble, puis exporte.</p></div>

<h2>📚 Les {len(grams)} grammaires en détail <small>recopiées telles quelles</small></h2>
{ref}
</main>
{tail}
<script>
function openHash(){{ const id=location.hash.slice(1), d=id&&document.getElementById(id); if(d&&d.tagName==='DETAILS'){{ d.open=true; d.classList.add('flash'); setTimeout(()=>d.classList.remove('flash'),1500) }} }}
window.addEventListener('hashchange', openHash); openHash();
</script>
</body></html>
'''
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(page)
    print(f"wrote {OUT} ({len(page)} chars) · checks {len(checks)} grams {len(grams)} · subs " + ", ".join(f"{k}={sum(1 for c in checks if c.get('sub_objective','').startswith(k))}" for k, _, _ in SUBS) + f" · rules {len(rules)} chars")


if __name__ == "__main__":
    main()
