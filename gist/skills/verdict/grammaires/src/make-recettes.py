#!/usr/bin/env python3
"""Generate recettes.html: grammar hierarchy per HTML deliverable type (round 2 of the catalog review).

Reuses from make-catalog.py: catalog parsing (verbatim names), thumbnails SK, page CSS.
Chrome + runtime copied from plan-review.html. Authored here: tiers, triggers, round-2 answers, decisions.
Usage: python3 make-recettes.py  -> writes build/recettes.html
"""
import datetime, html, importlib.util, os, re

B = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("mc", os.path.join(B, "make-catalog.py"))
mc = importlib.util.module_from_spec(spec); spec.loader.exec_module(mc)
OUT = os.path.join(B, "recettes.html")
RID = "viz-review-recettes-20261103"
CAT = "catalog-grammaires.html"
e = lambda s: html.escape(str(s), quote=True)

SOCLE = [("P15", "G1 · la demande"), ("P02", "G2 · le contexte"), ("V01", "G3 · progression"), ("V03", "G3 · sommaire en tuiles"),
         ("P28", "G5 · provenance"), ("P04", "G6 · verdict typé"), ("P01", "G6 · récap avant export"), ("P09", "G4 · tour 2, dès le 2e tour"), ("V33", "palette + glyphes")]

# type -> (emoji+title, core [(id,label)], conditional [(id,label,trigger)])
RECIPES = [
 ("doc", "📄 Revue de doc",
  [("P29", "D3 · tranché / ouvert"), ("V16", "D4 · structure de l'argument")],
  [("V05", "D2 · chiffres changés", "au moins 3 chiffres modifiés"), ("P07", "D2 · texte changé", "tour ≥ 2 ou diff de la source"),
   ("P33", "D5 · pré-mortem", "le doc engage une décision"), ("V12", "D5 · matrice de risques", "risques notés en probabilité et impact (à trancher)"),
   ("V14", "D4 · arbre GSN", "livrable à fort enjeu"), ("V15", "D4 · Toulmin", "une affirmation clé contestable")]),
 ("code", "💻 Revue de code",
  [("V18", "C1 · carte d'archi"), ("V24", "C3 · anneaux de rayon"), ("V28", "C4 · dedans / dehors du mandat"), ("V38", "proportion +/− par fichier")],
  [("V27", "C5 · faits synchronisés", "le repo déclare des valeurs répétées"), ("V20", "C2 · séquence", "le changement traverse ≥ 2 composants"),
   ("P24", "C4 · raison de l'écart", "au moins un fichier hors mandat"), ("V23", "C3 · matrice de dépendances", "graphe dense, > 15 nœuds")]),
 ("test", "🧪 Cahier de test",
  [("V34", "T1 · étape / attendu / observé"), ("P21", "T1 · bouton copier"), ("P22", "T2 · six statuts")],
  [("V26", "T3 · couverture", "une liste d'exigences existe"), ("P20", "T1 · Given/When/Then", "le cas a des exemples"),
   ("P18", "pause avant exécution", "des prérequis à vérifier"), ("P19", "pas à pas", "étapes dépendantes les unes des autres")]),
 ("decision", "❓ Fiche de décision",
  [("V09", "X1 · Pugh contre le statu quo"), ("P32", "X2 · porte à sens unique / double"), ("P34", "X2 · défaut + échéance"), ("P31", "X3 · reco + confiance")],
  [("P33", "X2 · pré-mortem", "décision à sens unique"), ("V11", "X2 · matrice 2×2", "4 options ou plus"),
   ("V13", "arbre de décision", "options en cascade"), ("V10", "X1 · cartes d'options", "critères en texte, pas en notes")]),
]

LEDGER = [
 ("global", "« pas de groupage ou de hiérarchie par type de livrable ? »", "traité", "ok",
  "Cette page. Quatre niveaux : socle (toutes les vues), cœur (toujours pour ce type), si signal (injecté quand le contenu le déclenche), réserve (le reste du catalogue, à la demande)."),
 ("obj-G6", "« à expliquer, je ne comprends pas »", "répondu", "acc",
  "G6, c'est la façon dont tu réponds. Tu l'utilises déjà : les boutons ✅ 🟡 ❌ ❓. La reco ajoute deux règles. 1) Commentaire obligatoire si ce n'est pas ok : au tour 1, tu as mis 🟡 sur « dec-generation » sans commentaire, et j'ai dû te demander pourquoi. 2) Avant d'exporter, un récap liste toutes tes réponses avec un lien Modifier (pattern « check your answers » de GOV.UK)."),
 ("obj-D1", "« c'est pas redondant avec les objectifs ? »", "à trancher", "mid",
  "Oui. Le contexte commun (G2) contient déjà l'objectif et l'audience. Je propose de supprimer D1 et d'ajouter deux lignes à G2 pour les docs : critères de succès et hors périmètre. Bloc de décision plus bas."),
 ("obj-C3", "« quels sont les anneaux ? composants, features ? »", "à trancher", "mid",
  "Trois niveaux sont possibles : fichiers, composants ou features. Bloc de décision plus bas."),
 ("obj-C5", "« je ne comprends pas à quoi ça sert »", "répondu", "acc",
  "Certaines valeurs sont écrites à plusieurs endroits et doivent rester identiques. Dans stint, la version figure à 3 endroits (plugin.json et deux fois dans marketplace.json). Un agent en change une, oublie les autres, et rien ne casse visiblement. La grille montre chaque valeur à chaque endroit : vert si identique, rouge sinon. Ça vaut aussi pour la prose : un nom canonique (Chèque Retraite plutôt que DIR) ou un prix répété dans deux docs."),
 ("trous", "« pas de risk matrix ? »", "à trancher", "mid",
  "Elle est au catalogue (V12), mais je l'avais écartée parce que Cox (2008) montre qu'elle peut mal classer des risques. Elle reste très lisible d'un coup d'œil. Bloc de décision plus bas."),
]

DECISIONS = [
 ("dec-C3-anneaux", "C3 · Quels anneaux pour le rayon d'impact ?",
  [("A", "Fichiers", "calculés par le code (graphe d'imports), précis mais bruyants"),
   ("B", "Composants", "via la carte d'archi C1 et une table fichier → composant ; lisible, et les fichiers apparaissent au dépliage"),
   ("C", "Features", "le plus parlant, mais une table composant → feature à maintenir à la main")],
  "B", "Les fichiers sont trop nombreux pour un coup d'œil, et les features coûtent une table de plus à tenir à jour. Les composants réutilisent la carte d'archi que tu as déjà demandée.", "↩️ double sens"),
 ("dec-D5-risques", "D5 · Quelle grammaire pour les risques ?",
  [("A", "Matrice par défaut", "heat map probabilité × impact pour tout doc qui a des risques"),
   ("B", "Pré-mortem + 2×2", "la matrice seulement si l'auteur fournit les notes"),
   ("C", "Les deux, enchaînés", "le pré-mortem produit la liste, la matrice 3×3 la classe ; notes ordinales, sans multiplier")],
  "C", "Le pré-mortem fait émerger les risques, la matrice les rend lisibles en 2 secondes. Garder 3×3 et des notes ordinales limite l'erreur de classement relevée par Cox.", "↩️ double sens"),
 ("dec-D1-fusion", "D1 · Fusionner « objectifs et audience » dans le contexte commun ?",
  [("A", "Fusionner", "D1 disparaît, G2 gagne « critères de succès » et « hors périmètre » pour les docs"),
   ("B", "Garder D1", "un bloc séparé, propre aux docs")],
  "A", "C'est la même information affichée deux fois. Un seul endroit évite les divergences, ce qui est d'ailleurs le problème que traite C5.", "↩️ double sens"),
]

CSS = """
.ledger2{display:grid;grid-template-columns:minmax(150px,1fr) auto 2.2fr;gap:8px 14px;align-items:start;font-size:.88rem}
.ledger2 .h{font-size:.75rem;color:var(--muted);font-weight:600}
.ledger2 em{font-style:normal;font-size:.75rem;padding:1px 8px;border-radius:99px;white-space:nowrap}
@media (max-width:700px){.ledger2{grid-template-columns:1fr}.ledger2 .h{display:none}}
.tiers{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}
.tier{font-size:.78rem;font-weight:600;padding:3px 10px;border-radius:99px}
.t0{background:var(--line);color:var(--fg)}.t1{background:var(--accent);color:var(--bg)}.t2{background:var(--warn-weak);color:var(--warn);border:1px dashed var(--warn)}.t3{background:transparent;color:var(--muted);border:1px dotted var(--muted)}
.anat{display:grid;grid-template-columns:120px 1fr;gap:10px;margin-top:12px}
.anat .z{font-size:.78rem;font-weight:600;color:var(--muted);padding-top:6px}
.thumbs{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px}
.th{text-decoration:none;color:var(--fg);border:1px solid var(--line);border-radius:10px;padding:6px;background:var(--surface);display:flex;flex-direction:column;gap:4px}
.th:hover{border-color:var(--accent)}
.th .sk{flex:none;width:100%;min-height:80px;transform-origin:top left}
.th .lb{font-size:.74rem}.th .lb b{color:var(--accent)}
.th .trg{font-size:.7rem;color:var(--warn)}
.th.core{border:2px solid var(--accent)}.th.cond{border:1px dashed var(--warn)}
.zone-sep{grid-column:1/-1;border-top:1px dashed var(--line)}
.opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;margin-top:8px}
.opt2{border:1px solid var(--line);border-radius:10px;padding:8px 10px;font-size:.86rem}
.opt2.rec{border:2px solid var(--accent)}
.opt2 b{font-size:1rem}
.recline{margin-top:8px;font-size:.88rem}
.reserve{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
"""


def thumb(i, label, cat, cls, trigger=None):
    trg = f'<div class="trg">⚡ si : {e(trigger)}</div>' if trigger else ""
    return (f'<a class="th {cls}" href="{CAT}#{i}" target="_blank" title="{e(cat[i]["name"])}"><div class="sk">{mc.SK[i]}</div>'
            f'<div class="lb"><b>{i}</b> {e(label)}</div>{trg}</a>')


def main():
    ta, tb, chrome = mc.read(mc.SRC_A), mc.read(mc.SRC_B), mc.read(mc.CHROME)
    cat = {x["id"]: x for x in mc.parse_catalog(ta) + mc.parse_catalog(tb)}
    style = re.search(r"<style>(.*?)</style>", chrome, re.S).group(1)
    top = re.search(r'(<div class="top">.*?</div></div>)\s*<main>', chrome, re.S).group(1).replace("📋 Revue du plan", "🧭 Recettes par type")
    tail = re.search(r'(<dialog id="dlg">.*?<!--RUNTIME:END-->)', chrome, re.S).group(1)

    used = {i for i, _ in SOCLE}
    for _, _, core, cond in RECIPES:
        used |= {i for i, _ in core} | {i for i, _, _ in cond}
    reserve = sorted(k for k in cat if k not in used)

    led = '<div class="ledger2"><span class="h">ton commentaire</span><span class="h">statut</span><span class="h">ma réponse</span>'
    for bid, quote, status, cls, ans in LEDGER:
        led += f'<span><code>{e(bid)}</code><br>{e(quote)}</span><span><em class="k-{cls}">{e(status)}</em></span><span>{e(ans)}</span>'
    led += "</div>"
    g6 = f'<div class="thumbs" style="margin-top:10px;max-width:600px">{thumb("P04", "commentaire obligatoire si pas ok", cat, "core")}{thumb("P01", "récap avant export", cat, "core")}{thumb("V27", "C5 · faits synchronisés", cat, "core")}</div>'

    socle = "".join(thumb(i, l, cat, "") for i, l in SOCLE)
    recipes = []
    for key, title, core, cond in RECIPES:
        recipes.append(f'''<div class="card" data-block="recette-{key}"><span class="unseen">non vu</span>
<h3>{e(title)}</h3>
<div class="anat">
 <div class="z">1 · En-tête</div><div class="mute" style="font-size:.85rem">le socle : demande, contexte, progression, provenance</div>
 <div class="zone-sep"></div>
 <div class="z">2 · Synthèse<br><span class="tier t1">cœur</span></div><div class="thumbs">{"".join(thumb(i, l, cat, "core") for i, l in core)}</div>
 <div class="zone-sep"></div>
 <div class="z">3 · Si signal<br><span class="tier t2">⚡ conditionnel</span></div><div class="thumbs">{"".join(thumb(i, l, cat, "cond", t) for i, l, t in cond)}</div>
 <div class="zone-sep"></div>
 <div class="z">4 · Blocs + récap</div><div class="mute" style="font-size:.85rem">un bloc = {{"doc": "une section", "code": "un fichier, hunks repliés", "test": "un cas", "decision": "une question"}}[type], puis le récap avant export</div>
</div></div>'''.replace('{"doc": "une section", "code": "un fichier, hunks repliés", "test": "un cas", "decision": "une question"}[type]', {"doc": "une section", "code": "un fichier, hunks repliés", "test": "un cas de test", "decision": "une question"}[key]))

    decs = []
    for bid, q, opts, rec, why, door in DECISIONS:
        resp = "|".join(f"{k}:{k} · {e(n)}" for k, n, _ in opts) + "|question:❓ question"
        cards = "".join(f'<div class="opt2{" rec" if k == rec else ""}"><b>{k}</b> · {e(n)}{" ★" if k == rec else ""}<br><span class="mute">{e(d)}</span></div>' for k, n, d in opts)
        decs.append(f'''<div class="card" data-block="{bid}" data-responses="{resp}"><span class="unseen">non vu</span>
<h3>{e(q)} <span class="tag">{door}</span></h3><div class="opts">{cards}</div>
<p class="recline"><b>Reco : {rec}.</b> {e(why)} <span class="mute">Si tu ne réponds pas, je pars sur {rec}.</span></p></div>''')

    res = "".join(f'<a class="tag" href="{CAT}#{i}" target="_blank">{i} · {e(cat[i]["name"])}</a>' for i in reserve)
    gen = datetime.datetime.now().strftime("%d/%m/%Y %H:%M")
    ncore = sum(len(c) for _, _, c, _ in RECIPES); ncond = sum(len(c) for _, _, _, c in RECIPES)

    page = f'''<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="review-id" content="{RID}"><meta name="review-type" content="decision"><meta name="feedback-endpoint" content="">
<title>Revue · recettes par type de livrable</title>
<style>{style}{mc.PAGE_CSS}{CSS}</style></head><body>
{top}
<main>
<section class="hero">
 <span class="tag acc">viz-review</span> <span class="tag">tour 2 du catalogue</span> <span class="tag">généré le {gen}</span>
 <h1>Quelles grammaires pour quel type de livrable, et dans quel ordre ?</h1>
 <div class="kv" style="display:grid;grid-template-columns:auto 1fr;gap:4px 12px;max-width:820px;margin-top:10px">
  <b class="mute">Situation</b><span>Tu as trouvé la plupart des 74 grammaires intéressantes, mais sans hiérarchie par type de livrable.</span>
  <b class="mute">Évaluation</b><span>{len(SOCLE)} grammaires partout, {ncore} au cœur d'un type, {ncond} déclenchées par un signal, {len(reserve)} en réserve.</span>
  <b class="mute">Demande</b><span><b>Valide les 4 recettes et tranche 3 décisions. Compte environ 5 minutes.</b></span>
 </div>
 <div class="tiers"><span class="tier t0">socle · toutes les vues</span><span class="tier t1">cœur · toujours pour ce type</span><span class="tier t2">⚡ si signal · injecté quand le contenu le déclenche</span><span class="tier t3">réserve · à la demande</span></div>
 <p style="margin-top:6px">{mc.sources_strip()}</p>
</section>

<h2>🔁 Tes commentaires du tour 1</h2>
<div class="card" data-block="tour2"><span class="unseen">non vu</span>{led}{g6}</div>

<h2>🧱 Le socle <small>en tête de toutes les vues</small></h2>
<div class="card" data-block="socle2"><span class="unseen">non vu</span><div class="thumbs">{socle}</div></div>

<h2>🧭 Une recette par type <small>l'ordre sur la page : intention → effet → détail</small></h2>
<div class="grid" style="gap:14px">{"".join(recipes)}</div>

<h2>❓ Trois décisions</h2>
<div class="grid" style="gap:14px">{"".join(decs)}</div>

<h2>📦 La réserve <small>{len(reserve)} grammaires, sans verdict, à sortir à la demande</small></h2>
<div class="card"><div class="reserve">{res}</div></div>

<div class="global" data-global><h3>🏁 Verdict global sur la hiérarchie</h3><p class="mute" style="font-size:.88rem">Ton avis d'ensemble, puis exporte.</p></div>
</main>
{tail}
</body></html>
'''
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(page)
    missing = sorted(i for i in used if i not in cat or i not in mc.SK)
    print(f"wrote {OUT} ({len(page)} chars) · socle {len(SOCLE)} core {ncore} cond {ncond} reserve {len(reserve)} · missing {missing or 'none'}")


if __name__ == "__main__":
    main()
