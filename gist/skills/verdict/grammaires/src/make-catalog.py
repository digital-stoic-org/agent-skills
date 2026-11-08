#!/usr/bin/env python3
"""Generate catalog-grammaires.html: visual grammars per objective, with review verdicts.

Sources (copied verbatim by code, never rephrased):
  wip/BRIEF-grammaires-visuelles-A.md  catalog V01.. + matrix (representation grammars)
  wip/BRIEF-grammaires-visuelles-B.md  catalog P01.. + matrix (review/feedback patterns)
Authored in this script (labelled as such in the page): objective labels, recommendations, sketches.
Chrome + runtime are copied from build/plan-review.html (RUNTIME:BEGIN/END), single source.

Usage: python3 make-catalog.py   -> writes build/catalog-grammaires.html
"""
import datetime, hashlib, html, os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
ARCHIVE = "/home/mat/dev/praxis/projects/_archive/viz-review"
SRC_A = os.path.join(ROOT, "BRIEF-grammaires-visuelles-A.md")
SRC_B = os.path.join(ROOT, "BRIEF-grammaires-visuelles-B.md")
CHROME = os.path.join(ARCHIVE, "build/plan-review.html")  # main() only: archived page
OUT = os.path.join(ARCHIVE, "build/catalog-grammaires.html")  # main() only
RID = "viz-review-grammaires-20261103"
RESP = "ok:✅ adopter|revoir:🟡 à revoir|non:❌ non|question:❓ question"

e = lambda s: html.escape(str(s), quote=True)


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def parse_catalog(text):
    m = re.search(r"^#\s*(?:1\.\s*)?catalog\b.*?```yaml\n(.*?)```", text, re.S | re.M)
    if not m:
        sys.exit("catalog block not found")
    entries, cur, key = [], None, None
    for line in m.group(1).splitlines():
        mi = re.match(r"^- id:\s*(\S+)", line)
        if mi:
            cur = {"id": mi.group(1)}; entries.append(cur); key = "id"; continue
        mk = re.match(r"^  (\w+):\s?(.*)$", line)
        if mk and cur is not None:
            key = mk.group(1); cur[key] = mk.group(2).strip(); continue
        if cur is not None and key and line.strip():
            cur[key] += " " + line.strip()
    return entries


def parse_matrix_a(text):
    out = {}
    blk = re.search(r"^# matrix\s*\n+```yaml\n(.*?)```", text, re.S | re.M).group(1)
    for line in blk.splitlines():
        m = re.match(r"^([A-Z]\d):\s*\[(.*)\]\s*$", line)
        if m:
            out[m.group(1)] = re.findall(r"\{id: (V\d+), why: (.*?)\}", m.group(2))
    return out


def parse_matrix_b(text):
    out, key = {}, None
    blk = re.search(r"^# 2\. matrix\s*\n+```yaml\n(.*?)```", text, re.S | re.M).group(1)
    for line in blk.splitlines():
        mk = re.match(r"^([A-Z]\d)_\w+:", line)
        if mk:
            key = mk.group(1); out[key] = []; continue
        mi = re.match(r'^\s+- \[(P\d+), "(.*)"\]', line)
        if mi and key:
            out[key].append((mi.group(1), mi.group(2)))
    return out


def gaps_raw(text, head):
    m = re.search(r"^" + head + r"\s*\n+```yaml\n(.*?)```", text, re.S | re.M)
    return m.group(1).strip() if m else ""


def evidence_tag(ev, origin=""):
    s = (ev + " " + origin).lower()
    if "unverified" in s: return ("no", "non vérifié")
    if "synthesis" in s or "my own" in s: return ("mid", "synthèse agent")
    if "secondary" in s: return ("mid", "secondaire")
    if "primary" in s: return ("ok", "primaire")
    return ("", "?")


def linkify(s):
    return re.sub(r"(https?://[^\s)<]+)", r'<a href="\1" target="_blank" rel="noopener">\1</a>', s)


# ---------- authored content: objectives, recommendations, sketches ----------
TYPES = [
    ("commun", "🧱 Commun à toutes les vues", ["G1", "G2", "G3", "G4", "G5", "G6"]),
    ("doc", "📄 Revue de doc", ["D1", "D2", "D3", "D4", "D5"]),
    ("code", "💻 Revue de code", ["C1", "C2", "C3", "C4", "C5"]),
    ("test", "🧪 Cahier de test", ["T1", "T2", "T3"]),
    ("decision", "❓ Fiche de décision", ["X1", "X2", "X3"]),
]

OBJ = {
 "G1": ("La demande", "Qu'attend-on de toi, et en combien de temps ?", ["P15", "V02"], "En-tête SBAR (situation, contexte, évaluation, recommandation). Sa dernière ligne dit l'action attendue et le temps estimé. Aucune grammaire visuelle dédiée n'a été trouvée : c'est une carte de texte à cases fixes.", "P15"),
 "G2": ("Le contexte", "Pour qui, pourquoi, sous quel mandat, à partir de quoi ?", ["P02", "V30"], "Liste clé/valeur à cases fixes : objectif, audience, mandat, sources. Une case vide reste visible.", "P02"),
 "G3": ("Progression et non-vu", "Où en suis-je, que reste-t-il ?", ["V01", "P08", "V03"], "Barre segmentée et compteur fixe (déjà dans la page), plus une grille de tuiles qui sert de sommaire, exceptions d'abord.", "V03"),
 "G4": ("Tour 2", "Qu'est-il advenu de mes commentaires ?", ["P09", "V39"], "Un registre reprend chaque commentaire du tour 1 avec son statut (traité, répondu, en attente, décliné) et un lien vers le bloc. Une pastille « modifié depuis ta revue » marque les blocs concernés.", "P09"),
 "G5": ("Provenance", "D'où vient ce contenu, est-il frais ?", ["P28", "V29"], "Un bandeau source · date · empreinte sur chaque bloc. Une source périmée est signalée.", "P28"),
 "G6": ("Types de réponse", "Comment est-ce que je réponds ?", ["P04", "P01"], "Verdict typé, avec commentaire obligatoire quand ce n'est pas ok. Avant l'export, un récapitulatif « vérifie tes réponses » avec un lien Modifier par ligne.", "P01"),
 "D1": ("Objectifs et audience", "À quoi sert ce doc, et pour qui ?", ["P16"], "Un brief ancré sur l'objectif : objectif, critères de succès, hors périmètre, type de retour attendu.", "P16"),
 "D2": ("Chiffres et affirmations changés", "Quels faits ont bougé ?", ["V05", "P07"], "Un graphe de pente avant/après pour les chiffres. Une redline mot à mot pour le texte, avec bascule original / modifications.", "V05"),
 "D3": ("Tranché vs ouvert", "Qu'est-ce qui est décidé, qu'est-ce qui attend ?", ["P29", "V16"], "Un registre décidé / ouvert / remplacé, avec l'ouvert en premier.", "P29"),
 "D4": ("Structure de l'argument", "Le raisonnement tient-il ?", ["V16", "V14"], "Un arbre de plan avec pastilles de statut. L'arbre GSN (but, stratégie, preuve) est réservé aux livrables à fort enjeu.", "V16"),
 "D5": ("Risques", "Qu'est-ce qui peut mal tourner ?", ["P33", "V11"], "Un pré-mortem (« ça a échoué, pourquoi ? ») et une matrice 2×2. La heat map est écartée parce qu'elle est contestée (Cox 2008).", "V11"),
 "C1": ("Big picture : l'architecture", "Où ce changement se place-t-il dans le système ?", ["V18", "V17"], "Un schéma de composants (C4) figé par repo, avec les composants touchés surlignés. Le niveau contexte (V17) ne sert que pour une nouvelle intégration.", "V18"),
 "C2": ("Flux", "Qui appelle qui, et dans quel ordre ?", ["V20", "V21"], "Un diagramme de séquence à mise en page déterministe. Des couloirs si la question est « qui fait quoi ».", "V20"),
 "C3": ("Rayon d'impact", "Qu'est-ce qui dépend de ce qui a changé ?", ["V24", "V23"], "Des anneaux touché / 1 saut / 2 sauts. La matrice de dépendances prend le relais si le graphe est dense.", "V24"),
 "C4": ("Conformité au mandat", "L'agent est-il resté dans son périmètre ?", ["V28", "P24"], "La liste des fichiers dedans / dehors est calculée par le code. L'agent remplit une colonne « raison de l'écart ».", "V28"),
 "C5": ("Faits synchronisés", "Les valeurs répétées sont-elles cohérentes ?", ["V27"], "Une grille fait × emplacement, où l'égalité est calculée par le code (par exemple la version écrite à 3 endroits).", "V27"),
 "T1": ("Étapes et résultat attendu", "Que dois-je faire, et que dois-je voir ?", ["V34", "P21", "P20"], "Un tableau étape / attendu / observé, avec un bouton 📋 sur chaque commande, prompt ou curl. Given/When/Then quand le cas a des exemples.", "V34"),
 "T2": ("Passe / échoue / bloqué", "Combien passent, qu'est-ce qui bloque ?", ["P22", "V01"], "Six statuts, où bloqué n'est pas échoué. Note obligatoire en cas d'échec ou de blocage. Une barre empilée.", "P22"),
 "T3": ("Couverture", "Qu'est-ce qui n'est pas testé ?", ["V26", "P23"], "Une matrice exigence × test, avec les lignes non couvertes en tête.", "V26"),
 "X1": ("Options comparées", "Quelles options, et laquelle l'emporte ?", ["V09", "P30", "V10"], "Une matrice de Pugh contre le statu quo (+ / = / −), avec l'option « ne rien faire » incluse. Des cartes à cases fixes quand les critères sont du texte.", "V09"),
 "X2": ("Heuristiques", "Avec quelle prudence trancher ?", ["P32", "P34", "P33"], "Un badge porte à sens unique / à double sens qui fixe le nombre de validations. Un défaut si tu ne réponds pas, avec une échéance. Un pré-mortem pour les décisions à sens unique.", "P32"),
 "X3": ("Reco et confiance", "Que recommandes-tu, et avec quelle certitude ?", ["P31", "P35"], "Une carte de reco : probabilité en mots et en fourchette, confiance séparée, « ce qui me ferait changer d'avis ». Aucune grammaire visuelle sourcée n'a été trouvée.", "P31"),
}

ALWAYS = [("V33", "palette lisible en daltonisme + glyphes redondants"), ("P15", "en-tête SBAR avec la demande"), ("V01", "barre de progression"), ("P08", "compteur fixe"), ("V03", "grille de tuiles en sommaire"), ("P01", "récap avant export")]

SK = {
 "P15": '<div class="kv"><b>S</b><span>Plan T1-T5 prêt</span><b>B</b><span>pivot d\'octobre</span><b>A</b><span>2 points ouverts</span></div><div class="hl">R → valide 22 choix · ~10 min</div>',
 "P02": '<div class="kv"><b>Objectif</b><span>valider le plan</span><b>Audience</b><span>Mat</span><b>Mandat</b><span><code>owns: build/</code></span><b>Sources</b><span>3 fichiers</span></div>',
 "V03": '<div class="tiles">' + '<i class="k-ok"></i>' * 5 + '<i class="k-mid"></i>' * 2 + '<i class="k-no"></i>' + '<i class="k-un"></i>' * 4 + '</div><div class="mute">1 tuile = 1 bloc · rayé = non vu</div>',
 "P09": '<div class="ledger"><span>« un autre plugin ? »</span><em class="k-acc">répondu</em><span>« ajouter audience »</span><em class="k-ok">traité</em><span>« heuristiques ? »</span><em class="k-mid">en attente</em><span>« templates »</span><em class="k-un">décliné</em></div>',
 "P28": '<div class="prov">PLAN-…-llm.md · 03/11 14:02 · #a1b2</div><div class="prov">BRIEF-A.md · 21/10 · <em class="k-mid">périmé</em></div><div class="prov">make-pilotage.py · 01/11 · #9f3c</div>',
 "P01": '<div class="ledger"><span>dec-plugin</span><em class="k-mid">à revoir</em><span>grammaire</span><em class="k-acc">question</em><span>type-code</span><em class="k-ok">ok</em></div><div class="hl" style="margin-top:6px">Exporter mes verdicts</div>',
 "P16": '<div class="kv"><b>But</b><span>Objectif : …</span><b>Réussi</b><span>Réussi si : …</span><b>Hors</b><span>Hors périmètre : …</span><b>Note</b><span>J\'attends : la structure</span></div>',
 "V05": '<svg viewBox="0 0 220 96" class="svg"><line x1="45" y1="8" x2="45" y2="88"/><line x1="175" y1="8" x2="175" y2="88"/><text x="45" y="96" text-anchor="middle">avant</text><text x="175" y="96" text-anchor="middle">après</text><line class="m" x1="45" y1="30" x2="175" y2="30"/><line class="m" x1="45" y1="60" x2="175" y2="56"/><line class="bad" x1="45" y1="72" x2="175" y2="20"/><text x="40" y="75" text-anchor="end">12</text><text x="180" y="23">18 mois</text></svg>',
 "P29": '<div class="cols"><div><b>Ouvert</b><em class="k-mid">plugin</em><em class="k-mid">gabarits</em></div><div><b>Tranché</b><em class="k-ok">serveur</em><em class="k-ok">git</em><em class="k-ok">mandat</em></div><div><b>Remplacé</b><em class="k-un">orbe</em></div></div>',
 "V16": '<div class="tree"><div>● Thèse <em class="k-ok">✓</em></div><div class="i1">○ Argument 1 <em class="k-ok">✓</em></div><div class="i1">○ Argument 2 <em class="k-mid">?</em></div><div class="i2">· preuve <em class="k-no">manque</em></div></div>',
 "V11": '<svg viewBox="0 0 220 110" class="svg"><rect x="40" y="6" width="170" height="90" class="box"/><line x1="125" y1="6" x2="125" y2="96"/><line x1="40" y1="51" x2="210" y2="51"/><circle cx="170" cy="25" r="5" class="bad"/><circle cx="80" cy="75" r="5" class="ok"/><circle cx="150" cy="70" r="5" class="mid"/><text x="125" y="108" text-anchor="middle">réversible → sens unique</text><text x="34" y="51" text-anchor="end">coût</text></svg>',
 "V18": '<svg viewBox="0 0 220 110" class="svg"><rect x="80" y="4" width="70" height="22" class="box"/><text x="115" y="19" text-anchor="middle">register</text><rect x="6" y="70" width="62" height="22" class="box hot"/><text x="37" y="85" text-anchor="middle">dash</text><rect x="84" y="70" width="62" height="22" class="box"/><text x="115" y="85" text-anchor="middle">pit</text><rect x="152" y="70" width="62" height="22" class="box"/><text x="183" y="85" text-anchor="middle">notes</text><line x1="115" y1="26" x2="37" y2="70"/><line x1="115" y1="26" x2="115" y2="70"/><line x1="115" y1="26" x2="183" y2="70"/></svg>',
 "V20": '<svg viewBox="0 0 220 110" class="svg"><text x="30" y="12" text-anchor="middle">hook</text><text x="110" y="12" text-anchor="middle">dash</text><text x="190" y="12" text-anchor="middle">état</text><line x1="30" y1="18" x2="30" y2="106" class="dashed"/><line x1="110" y1="18" x2="110" y2="106" class="dashed"/><line x1="190" y1="18" x2="190" y2="106" class="dashed"/><line x1="30" y1="38" x2="106" y2="38" class="m"/><line x1="110" y1="60" x2="186" y2="60" class="m"/><line x1="190" y1="82" x2="114" y2="82" class="m"/><text x="68" y="34" text-anchor="middle">render</text><text x="150" y="56" text-anchor="middle">lire</text></svg>',
 "V24": '<svg viewBox="0 0 220 110" class="svg"><circle cx="110" cy="55" r="50" class="ring2"/><circle cx="110" cy="55" r="33" class="ring1"/><circle cx="110" cy="55" r="16" class="ring0"/><text x="110" y="59" text-anchor="middle">3</text><text x="110" y="34" text-anchor="middle">4</text><text x="110" y="15" text-anchor="middle">2</text><text x="168" y="30">touché</text><text x="168" y="46">1 saut</text><text x="168" y="62">2 sauts</text></svg>',
 "V28": '<div class="ledger"><span><code>hooks/dash.ts</code></span><em class="k-ok">dedans</em><span><code>hooks/pit.ts</code></span><em class="k-ok">dedans</em><span><code>site/why-pit.html</code></span><em class="k-no">dehors</em></div>',
 "V27": '<table class="mini"><tr><th></th><th>plugin</th><th>meta</th><th>[0]</th></tr><tr><td>version</td><td class="k-ok">0.4.2</td><td class="k-ok">0.4.2</td><td class="k-no">0.4.1</td></tr><tr><td>nom</td><td class="k-ok">stint</td><td class="k-ok">stint</td><td class="k-ok">stint</td></tr></table>',
 "V34": '<table class="mini"><tr><th>#</th><th>action</th><th>attendu</th><th></th></tr><tr><td>1</td><td><code>plugin validate</code> <span class="cp">copier</span></td><td>OK</td><td class="k-ok">✓</td></tr><tr><td>2</td><td>prompt « /pit » <span class="cp">copier</span></td><td>bande visible</td><td class="k-un">…</td></tr></table>',
 "P22": '<div class="sbar"><i class="k-ok" style="flex:8"></i><i class="k-no" style="flex:1"></i><i class="k-mid" style="flex:2"></i><i class="k-acc" style="flex:1"></i><i class="k-un" style="flex:3"></i></div><div class="mute">passé 8 · échoué 1 · bloqué 2 · à refaire 1 · non testé 3</div>',
 "V26": '<table class="mini"><tr><th></th><th>t1</th><th>t2</th><th>t3</th></tr><tr><td>R1</td><td>●</td><td></td><td>●</td></tr><tr class="gap"><td>R3</td><td></td><td></td><td></td></tr><tr><td>R2</td><td></td><td>●</td><td></td></tr></table><div class="mute">ligne vide = non couvert, en tête</div>',
 "V09": '<table class="mini"><tr><th></th><th>rien</th><th>A</th><th>B</th></tr><tr><td>coût</td><td>=</td><td class="k-ok">+</td><td class="k-no">−</td></tr><tr><td>risque</td><td>=</td><td class="k-no">−</td><td class="k-ok">+</td></tr><tr><td>délai</td><td>=</td><td class="k-ok">+</td><td class="k-ok">+</td></tr></table>',
 "P32": '<div class="hl">sens unique → 2 validations + pré-mortem</div><div class="prov" style="margin-top:6px">⏰ défaut si pas de réponse : <b>B</b> · le 05/11</div><div class="prov">↩️ double sens → on essaie, on revient</div>',
 "P31": '<div class="kv"><b>Reco</b><span><b>B</b></span><b>Probable</b><span>60–80 %</span><b>Confiance</b><span><em class="k-mid">moyenne</em></span><b>Changerait si</b><span>serveur &gt; 1 j</span></div>',
}

# Thumbnails for every remaining catalog entry (illustrations authored here, not from the sources).
SK.update({
 "V01": '<div class="sbar"><i class="k-ok" style="flex:9"></i><i class="k-mid" style="flex:3"></i><i class="k-no" style="flex:1"></i><i class="k-acc" style="flex:2"></i><i class="k-un" style="flex:5"></i></div><div class="mute">ok 9 · à revoir 3 · non 1 · question 2 · non vu 5</div>',
 "V02": '<svg viewBox="0 0 220 60" class="svg"><rect x="10" y="14" width="200" height="22" class="f-line"/><rect x="10" y="14" width="140" height="22" class="f-line2"/><rect x="10" y="14" width="80" height="22" class="f-line3"/><rect x="10" y="21" width="110" height="8" class="f-acc"/><line x1="170" y1="10" x2="170" y2="40" class="bad"/><text x="10" y="54">6 min</text><text x="170" y="54" text-anchor="middle">budget 10</text></svg>',
 "V04": '<svg viewBox="0 0 220 60" class="svg"><polyline points="10,40 40,35 70,42 100,28 130,30 160,18 190,22" class="m"/><circle cx="190" cy="22" r="3.5" class="f-acc"/><text x="196" y="26">72 %</text><text x="10" y="56">taux de passage, 7 tours</text></svg>',
 "V06": '<svg viewBox="0 0 220 80" class="svg"><line x1="110" y1="4" x2="110" y2="76"/><rect x="110" y="8" width="60" height="12" class="f-ok"/><rect x="70" y="26" width="40" height="12" class="f-no"/><rect x="110" y="44" width="25" height="12" class="f-ok"/><rect x="95" y="62" width="15" height="12" class="f-no"/><text x="174" y="18">+30 %</text><text x="66" y="36" text-anchor="end">−20 %</text></svg>',
 "V07": '<svg viewBox="0 0 220 80" class="svg"><line x1="60" y1="14" x2="210" y2="14" class="dashed"/><line x1="60" y1="34" x2="210" y2="34" class="dashed"/><line x1="60" y1="54" x2="210" y2="54" class="dashed"/><circle cx="190" cy="14" r="4" class="f-acc"/><circle cx="140" cy="34" r="4" class="f-acc"/><circle cx="90" cy="54" r="4" class="f-acc"/><text x="54" y="17" text-anchor="end">dash</text><text x="54" y="37" text-anchor="end">pit</text><text x="54" y="57" text-anchor="end">notes</text></svg>',
 "V08": '<table class="mini"><tr><th>critère</th><th>×</th><th>A</th><th>B</th></tr><tr><td>coût</td><td>3</td><td>4</td><td>2</td></tr><tr><td>risque</td><td>2</td><td>2</td><td>5</td></tr><tr><td><b>total</b></td><td></td><td>16</td><td class="k-ok"><b>16+</b></td></tr></table>',
 "V10": '<div class="cols"><div class="opt"><b>A</b><span>coût ●●○</span><span>délai ●○○</span></div><div class="opt pick"><b>B ★</b><span>coût ●○○</span><span>délai ●●○</span></div><div class="opt"><b>rien</b><span>coût ○○○</span><span>délai ○○○</span></div></div>',
 "V12": '<div class="heat"><i class="k-mid"></i><i class="k-no"></i><i class="k-no">●</i><i class="k-ok"></i><i class="k-mid">●</i><i class="k-no"></i><i class="k-ok">●</i><i class="k-ok"></i><i class="k-mid"></i></div><div class="mute">probabilité × impact · contesté (Cox)</div>',
 "V13": '<svg viewBox="0 0 220 90" class="svg"><rect x="80" y="4" width="60" height="18" class="box"/><text x="110" y="16" text-anchor="middle">réponse ?</text><line x1="110" y1="22" x2="40" y2="60" class="m"/><line x1="110" y1="22" x2="110" y2="60"/><line x1="110" y1="22" x2="180" y2="60"/><text x="40" y="74" text-anchor="middle">défaut B</text><text x="110" y="74" text-anchor="middle">A</text><text x="180" y="74" text-anchor="middle">C</text><text x="58" y="40">sans réponse</text></svg>',
 "V14": '<svg viewBox="0 0 220 100" class="svg"><rect x="70" y="4" width="80" height="18" class="box"/><text x="110" y="16" text-anchor="middle">But : sûr</text><polygon points="78,36 152,36 144,52 70,52" class="box"/><text x="111" y="47" text-anchor="middle">Stratégie</text><line x1="110" y1="22" x2="110" y2="36"/><line x1="90" y1="52" x2="50" y2="72"/><line x1="130" y1="52" x2="170" y2="72"/><circle cx="50" cy="84" r="12" class="f-okbg"/><text x="50" y="87" text-anchor="middle">tests</text><polygon points="170,72 182,84 170,96 158,84" class="f-midbg"/><text x="190" y="87">à faire</text></svg>',
 "V15": '<div class="kv"><b>Affirmation</b><span>18 mois max</span><b>Fondement</b><span>contrat BNPP</span><b>Garantie</b><span>clause standard</span><b>Réfutation</b><span><em class="k-mid">sauf avenant</em></span></div>',
 "V17": '<svg viewBox="0 0 220 90" class="svg"><circle cx="24" cy="45" r="12" class="box"/><text x="24" y="70" text-anchor="middle">Mat</text><rect x="70" y="30" width="80" height="30" class="box hot"/><text x="110" y="49" text-anchor="middle">stint</text><rect x="176" y="8" width="40" height="22" class="box"/><text x="196" y="22" text-anchor="middle">Claude</text><rect x="176" y="60" width="40" height="22" class="box"/><text x="196" y="74" text-anchor="middle">git</text><line x1="36" y1="45" x2="70" y2="45"/><line x1="150" y1="40" x2="176" y2="20"/><line x1="150" y1="50" x2="176" y2="70"/></svg>',
 "V19": '<div class="tabs"><span class="on">blocs</span><span>exécution</span><span>déploiement</span></div><div class="ph">vue « blocs » : composants et dépendances</div>',
 "V21": '<svg viewBox="0 0 220 90" class="svg"><line x1="0" y1="45" x2="220" y2="45" class="dashed"/><text x="4" y="12">agent</text><text x="4" y="58">Mat</text><rect x="40" y="16" width="50" height="18" class="box"/><text x="65" y="28" text-anchor="middle">génère</text><rect x="90" y="56" width="50" height="18" class="box hot"/><text x="115" y="68" text-anchor="middle">valide</text><rect x="150" y="16" width="56" height="18" class="box"/><text x="178" y="28" text-anchor="middle">corrige</text><line x1="90" y1="25" x2="100" y2="56" class="m"/><line x1="140" y1="65" x2="150" y2="34" class="m"/></svg>',
 "V22": '<svg viewBox="0 0 220 90" class="svg"><path d="M10,20 C90,20 110,30 210,30" class="band" style="stroke-width:18"/><path d="M10,58 C90,58 110,70 210,70" class="band2" style="stroke-width:10"/><path d="M10,24 C90,24 110,66 210,66" class="band3" style="stroke-width:5"/><text x="10" y="86">tokens lus → contexte</text></svg>',
 "V23": '<div class="dsm">' + ''.join('<i class="%s"></i>' % ('k-acc' if r == c else ('k-no' if (r, c) in ((0, 2), (3, 1), (4, 2)) else ('k-mid' if (r, c) in ((1, 0), (2, 4)) else ''))) for r in range(5) for c in range(5)) + '</div><div class="mute">ligne dépend de colonne</div>',
 "V25": '<div class="tm"><i class="k-no" style="flex:5">dash</i><div style="flex:3;display:flex;flex-direction:column;gap:3px"><i class="k-mid" style="flex:2">pit</i><i style="flex:1">notes</i></div><div style="flex:2;display:flex;flex-direction:column;gap:3px"><i style="flex:1">site</i><i style="flex:1">brand</i></div></div>',
 "V29": '<svg viewBox="0 0 220 60" class="svg"><line x1="10" y1="30" x2="210" y2="30"/><circle cx="30" cy="30" r="5" class="f-acc"/><circle cx="100" cy="30" r="5" class="f-acc"/><circle cx="170" cy="30" r="5" class="f-no"/><text x="30" y="18" text-anchor="middle">tour 1</text><text x="100" y="18" text-anchor="middle">tour 2</text><text x="170" y="18" text-anchor="middle">source</text><text x="170" y="50" text-anchor="middle">périmée</text></svg>',
 "V30": '<div class="six"><span><b>Qui</b>Mat</span><span><b>Quoi</b>plan</span><span><b>Combien</b>22</span><span><b>Où</b>build/</span><span><b>Quand</b>03/11</span><span><b>Pourquoi</b>valider</span></div>',
 "V31": '<div class="ledger"><span>écart à une cible</span><em class="k-acc">barre divergente</em><span>part d’un tout</span><em class="k-acc">barre empilée</em><span>évolution</span><em class="k-acc">sparkline</em><span>flux</span><em class="k-acc">sankey</em></div>',
 "V32": '<div class="rank"><span>position</span><i style="width:95%"></i><span>longueur</span><i style="width:80%"></i><span>angle</span><i style="width:55%"></i><span>aire</span><i style="width:40%"></i><span>couleur</span><i style="width:25%"></i></div>',
 "V33": '<div class="always"><em class="k-ok">✓ ok</em><em class="k-mid">! à revoir</em><em class="k-no">✗ non</em><em class="k-acc">? question</em><em class="k-un">… non vu</em></div><div class="mute">couleur + glyphe, jamais la couleur seule</div>',
 "V35": '<div class="waffle">' + '<i class="k-ok"></i>' * 14 + '<i class="k-no"></i>' * 2 + '<i class="k-un"></i>' * 4 + '</div><div class="mute">1 carré = 1 cas de test</div>',
 "V36": '<div class="cyn"><span>complexe</span><span class="on">compliqué</span><span>chaotique</span><span>clair</span></div>',
 "V37": '<svg viewBox="0 0 220 100" class="svg"><line x1="20" y1="90" x2="215" y2="90"/><line x1="20" y1="5" x2="20" y2="90"/><circle cx="60" cy="20" r="4" class="f-acc"/><circle cx="120" cy="50" r="4" class="f-acc"/><circle cx="190" cy="75" r="4" class="f-acc"/><line x1="60" y1="20" x2="120" y2="50"/><line x1="120" y1="50" x2="190" y2="75"/><text x="66" y="18">besoin</text><text x="126" y="48">runtime</text><text x="160" y="70">git</text><text x="22" y="99">genèse</text><text x="215" y="99" text-anchor="end">commodité</text></svg>',
 "V38": '<div class="ds"><span><code>dash.ts</code></span><span><i class="k-ok" style="width:60%"></i><i class="k-no" style="width:15%"></i></span><span><code>pit.ts</code></span><span><i class="k-ok" style="width:10%"></i><i class="k-no" style="width:35%"></i></span><span><code>notes.ts</code></span><span><i class="k-ok" style="width:5%"></i><i class="k-no" style="width:3%"></i></span></div>',
 "V39": '<div class="ph" style="text-align:left"><b>dec-plugin</b> <em class="k-acc">modifié depuis ta revue</em><br>texte du bloc…</div><div class="ph" style="text-align:left;margin-top:4px"><b>T6</b> <em class="k-ok">nouveau</em></div>',
 "P03": '<div class="ledger"><span>Contexte</span><em class="k-ok">terminé</em><span>Décisions</span><em class="k-mid">en cours</em><span>Types</span><em class="k-un">à faire</em><span>Étapes</span><em class="k-un">à faire</em></div><div class="mute">« As-tu terminé cette section ? » oui / non</div>',
 "P04": '<div class="always"><em class="k-ok">ok</em><em class="k-mid">à revoir</em><em class="k-no">non</em></div><div class="ph" style="margin-top:6px;text-align:left">commentaire <b>obligatoire</b> si pas ok…</div>',
 "P05": '<div class="ph" style="text-align:left">La sortie se fait <mark>fin 2026</mark> au plus tard.</div><div class="bubble">« plutôt mi-2026 ? »</div>',
 "P06": '<table class="mini"><tr><th>Q</th><th>options</th><th>défaut</th><th>réponse</th></tr><tr><td>1</td><td>A/B/C</td><td>B</td><td class="k-ok">B</td></tr><tr><td>2</td><td>A/B</td><td>A</td><td class="k-un">…</td></tr></table>',
 "P07": '<div class="tabs"><span>original</span><span class="on">simple</span><span>tout</span></div><div class="ph" style="text-align:left">Durée : <del>12</del> <ins>18</ins> mois, <ins>renouvelable</ins>.</div>',
 "P08": '<div class="hl" style="text-align:center">12/24 vus · 3 commentaires · 1 non résolu</div><div class="mute" style="text-align:center">fixé en haut de page</div>',
 "P10": '<div class="banner">⚠️ <b>Important :</b> la version change le contrat d’API.</div><div class="ph" style="margin-top:6px">reste de la page</div>',
 "P11": '<div class="ph" style="text-align:left">Reco : B, réversible.</div><div class="mute" style="margin-top:4px">▸ Détails (3)</div><div class="mute">▸ Sources (5)</div>',
 "P12": '<div class="err"><b>Il y a un problème</b><br><u>dec-plugin : commentaire manquant</u><br><u>T3 : pas de verdict</u></div>',
 "P13": '<div class="banner" style="border-color:var(--no);background:var(--no-weak)">⚠️ <b>Irréversible :</b> supprime 3 fichiers publiés.</div>',
 "P14": '<div class="okpanel"><b>Envoyé ✓</b><br>Ensuite : dis « traite le feedback », l’agent attend.</div>',
 "P17": '<div class="hl" style="text-align:center">⏱ 05:00 lecture silencieuse</div><div class="ph" style="text-align:left;margin-top:4px">paragraphe… <span class="k-acc" style="padding:0 4px;border-radius:4px">? pourquoi 18</span></div>',
 "P18": '<div class="hl">⏸ PAUSE avant validation</div><div style="margin-top:4px">☑ version synchro<br>☑ aucun secret<br>☐ tests passés</div>',
 "P19": '<div class="steps"><span class="done">1 · installer ✓</span><span class="cur">2 · lancer /pit</span><span>3 · vérifier la bande</span></div>',
 "P20": '<div class="kv"><b>Étant donné</b><span>une session ouverte</span><b>Quand</b><span>je tape /pit</span><b>Alors</b><span>la bande s’affiche</span></div><table class="mini" style="margin-top:4px"><tr><th>entrée</th><th>sortie</th></tr><tr><td>/pit</td><td>bande</td></tr></table>',
 "P21": '<div class="codebox"><code>curl -X POST …/feedback</code><span class="cp">copier</span></div><div class="mute">repli si http : sélection + execCommand</div>',
 "P23": '<table class="mini"><tr><th></th><th>test 1</th><th>test 2</th></tr><tr><td>exig. A</td><td>✓</td><td></td></tr><tr class="gap"><td>exig. B</td><td colspan="2">aucun test</td></tr></table>',
 "P24": '<table class="mini"><tr><th>exigence</th><th>statut</th><th>écart</th></tr><tr><td>owns build/</td><td class="k-ok">✓</td><td></td></tr><tr><td>pas de site</td><td class="k-no">✗</td><td>lien cassé</td></tr></table>',
 "P25": '<div class="ledger"><span>Sources citées ?</span><em class="k-ok">oui</em><span>Chiffres vérifiés ?</span><em class="k-mid">incertain</em><span>Hors périmètre ?</span><em class="k-ok">non</em></div><div class="hl" style="margin-top:4px">→ puis le verdict</div>',
 "P26": '<div class="tree"><div>● Le runtime est générique</div><div class="i1">○ preuve : 2 types <em class="k-ok">✓</em></div><div class="i1">objection : test du tour 2 <em class="k-no">ouverte</em></div></div>',
 "P27": '<div class="ledger"><span>Haute</span><em class="k-ok">⊕⊕⊕⊕</em><span>Modérée</span><em class="k-acc">⊕⊕⊕◯</em><span>Basse</span><em class="k-mid">⊕⊕◯◯</em><span>Très basse</span><em class="k-no">⊕◯◯◯</em></div>',
 "P30": '<table class="mini"><tr><th></th><th>pour</th><th>contre</th></tr><tr><td>rien</td><td>0 effort</td><td>fatigue</td></tr><tr><td>A</td><td>rapide</td><td>rigide</td></tr><tr><td>B</td><td>souple</td><td>coût</td></tr></table>',
 "P33": '<div class="hl">Dans 3 mois, c’est un échec. Pourquoi ?</div><div style="margin-top:4px">1. personne n’exporte → <span class="mute">signal : 0 JSON/sem.</span><br>2. pages trop longues</div>',
 "P34": '<div class="banner">⏰ Sans réponse le <b>05/11</b> → on part sur <b>B</b></div><div class="mute">compte à rebours visible</div>',
 "P35": '<div class="kv"><b>Décision</b><span>plugin à part</span><b>Attendu</b><span>adopté en 1 mois</span><b>Confiance</b><span>70 %</span><b>Revoir le</b><span>01/12</span></div>',
})

PAGE_CSS = """
.svg .f-ok{fill:var(--ok);stroke:var(--ok)}.svg .f-no{fill:var(--no);stroke:var(--no)}.svg .f-acc{fill:var(--accent);stroke:var(--accent)}
.svg .f-line{fill:var(--line);stroke:none}.svg .f-line2{fill:var(--muted);stroke:none;opacity:.35}.svg .f-line3{fill:var(--muted);stroke:none;opacity:.6}
.svg .f-okbg{fill:var(--ok-weak);stroke:var(--ok)}.svg .f-midbg{fill:var(--warn-weak);stroke:var(--warn)}
.svg polygon{stroke:var(--muted);stroke-width:1.2}.svg polyline{fill:none}
.svg path{fill:none}.svg .band{stroke:var(--accent);opacity:.45}.svg .band2{stroke:var(--ok);opacity:.45}.svg .band3{stroke:var(--no);opacity:.55}
.sk .opt{border:1px solid var(--line);border-radius:6px;padding:4px;font-size:.66rem}.sk .opt.pick{border:2px solid var(--accent)}
.sk .heat{display:grid;grid-template-columns:repeat(3,1fr);gap:3px}.sk .heat i{display:flex;align-items:center;justify-content:center;height:22px;border-radius:3px;font-style:normal}
.sk .dsm{display:grid;grid-template-columns:repeat(5,1fr);gap:2px;width:110px}.sk .dsm i{display:block;aspect-ratio:1;border:1px solid var(--line);border-radius:2px}
.sk .dsm i.k-no{background:var(--no)}.sk .dsm i.k-mid{background:var(--warn)}.sk .dsm i.k-acc{background:var(--accent)}
.sk .tm{display:flex;gap:3px;height:90px}.sk .tm i{display:flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:3px;font-style:normal;font-size:.66rem}
.sk .tm i.k-no{background:var(--no-weak)}.sk .tm i.k-mid{background:var(--warn-weak)}
.sk .six{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}.sk .six span{border:1px solid var(--line);border-radius:5px;padding:3px;font-size:.66rem}.sk .six b{display:block;color:var(--muted)}
.sk .rank{display:grid;grid-template-columns:auto 1fr;gap:3px 8px;align-items:center}.sk .rank i{display:block;height:8px;background:var(--accent);border-radius:4px}
.sk .waffle{display:grid;grid-template-columns:repeat(10,1fr);gap:3px}.sk .waffle i{display:block;aspect-ratio:1;border-radius:2px}
.sk .waffle i.k-ok{background:var(--ok)}.sk .waffle i.k-no{background:var(--no)}
.sk .cyn{display:grid;grid-template-columns:1fr 1fr;gap:3px}.sk .cyn span{border:1px solid var(--line);border-radius:5px;padding:6px;text-align:center}.sk .cyn .on{background:var(--accent-weak);color:var(--accent);font-weight:600;border-color:var(--accent)}
.sk .ds{display:grid;grid-template-columns:auto 1fr;gap:4px 8px;align-items:center}.sk .ds span:nth-child(even){display:flex;height:8px}.sk .ds i{display:block;height:8px}
.sk .ds i.k-ok{background:var(--ok)}.sk .ds i.k-no{background:var(--no)}
.sk .tabs{display:flex;gap:2px;margin-bottom:4px}.sk .tabs span{border:1px solid var(--line);border-radius:5px 5px 0 0;padding:1px 6px;font-size:.66rem}.sk .tabs .on{background:var(--accent-weak);color:var(--accent);font-weight:600}
.sk .ph{border:1px dashed var(--line);border-radius:6px;padding:6px;color:var(--muted);text-align:center;font-size:.7rem}
.sk ins{background:var(--ok-weak);color:var(--ok);text-decoration:none}.sk del{background:var(--no-weak);color:var(--no)}.sk mark{background:var(--warn-weak);color:var(--fg)}
.sk .bubble{margin:4px 0 0 30px;background:var(--accent-weak);color:var(--accent);border-radius:8px;padding:3px 7px;font-size:.68rem}
.sk .banner{border-left:4px solid var(--warn);background:var(--warn-weak);padding:5px 7px;border-radius:4px;font-size:.7rem}
.sk .err{border:2px solid var(--no);padding:6px;border-radius:5px;font-size:.7rem;color:var(--no)}.sk .err u{color:var(--accent)}
.sk .okpanel{background:var(--ok-weak);color:var(--ok);border-radius:6px;padding:8px;text-align:center}
.sk .steps{display:flex;flex-direction:column;gap:3px}.sk .steps span{border:1px solid var(--line);border-radius:5px;padding:3px 6px;color:var(--muted)}.sk .steps .done{color:var(--ok)}.sk .steps .cur{border:2px solid var(--accent);color:var(--fg);font-weight:600}
.sk .codebox{display:flex;justify-content:space-between;align-items:center;gap:6px;background:var(--surface);border:1px solid var(--line);border-radius:5px;padding:4px 6px}
.catgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;align-items:start}
.catgrid details.ent{margin:0}
.catgrid details.ent summary{list-style:none;display:flex;flex-direction:column;gap:6px}
.catgrid details.ent summary::-webkit-details-marker{display:none}
.catgrid details.ent .sk{flex:none;width:100%;min-height:100px}
.catgrid details.ent[open]{grid-column:1/-1}
.catgrid details.ent[open] summary{flex-direction:row;align-items:flex-start;gap:14px}
.catgrid details.ent[open] .sk{width:260px}
.catgrid .nm{font-size:.82rem;line-height:1.3}
.obj .ohead{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-right:60px}
.obj .oid{font:400 .76rem var(--mono);color:var(--accent);background:var(--accent-weak);padding:1px 7px;border-radius:6px}
.obj .q{color:var(--muted);font-size:.9rem}
.reco{display:flex;gap:16px;margin-top:10px;flex-wrap:wrap}
.reco .txt{flex:1;min-width:240px}
.reco .txt .ids{margin:0 0 4px}
.sk{flex:0 0 240px;background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:10px;font-size:.74rem;line-height:1.4;min-height:110px}
.sk .mute{font-size:.68rem;margin-top:4px}
.sk code{font-size:.68rem}
.sk .kv{display:grid;grid-template-columns:auto 1fr;gap:3px 8px}
.sk .kv b{color:var(--muted);font-weight:600}
.sk .hl{background:var(--accent-weak);color:var(--accent);border-radius:6px;padding:4px 6px;font-weight:600;margin-top:4px}
.sk em{font-style:normal;font-size:.68rem;padding:0 6px;border-radius:99px;display:inline-block}
.k-ok{background:var(--ok-weak);color:var(--ok)}.k-mid{background:var(--warn-weak);color:var(--warn)}.k-no{background:var(--no-weak);color:var(--no)}.k-acc{background:var(--accent-weak);color:var(--accent)}
.k-un{background:repeating-linear-gradient(45deg,var(--line) 0 3px,transparent 3px 6px);color:var(--muted)}
.sk .tiles{display:grid;grid-template-columns:repeat(6,1fr);gap:4px}
.sk .tiles i{display:block;aspect-ratio:1;border-radius:4px}
.sk .tiles i.k-ok{background:var(--ok)}.sk .tiles i.k-mid{background:var(--warn)}.sk .tiles i.k-no{background:var(--no)}
.sk .ledger{display:grid;grid-template-columns:1fr auto;gap:4px 8px;align-items:center}
.sk .prov{font-size:.7rem;border-left:3px solid var(--line);padding-left:6px;margin:2px 0}
.sk .cols{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.sk .cols div{display:flex;flex-direction:column;gap:3px}.sk .cols b{font-size:.68rem;color:var(--muted)}
.sk .tree .i1{padding-left:14px}.sk .tree .i2{padding-left:28px}
.sk table.mini{border-collapse:collapse;width:100%;font-size:.7rem}.sk table.mini td,.sk table.mini th{border:1px solid var(--line);padding:2px 4px;text-align:center}.sk table.mini th{color:var(--muted);font-weight:600}
.sk tr.gap td{background:var(--no-weak)}
.sk .cp{font-size:.7rem;border:1px solid var(--line);border-radius:4px;padding:0 3px}
.sk .sbar{display:flex;height:12px;border-radius:99px;overflow:hidden;margin:8px 0 4px}.sk .sbar i{display:block}
.sk .sbar i.k-ok{background:var(--ok)}.sk .sbar i.k-no{background:var(--no)}.sk .sbar i.k-mid{background:var(--warn)}.sk .sbar i.k-acc{background:var(--accent)}
.svg{width:100%;height:auto;display:block}
.svg line,.svg rect,.svg circle{stroke:var(--muted);stroke-width:1.2;fill:none}
.svg text{fill:var(--fg);font-size:9px;font-family:var(--mono)}
.svg .m{stroke:var(--accent);stroke-width:2}.svg .bad{stroke:var(--no);stroke-width:2.4}
.svg circle.bad{fill:var(--no)}.svg circle.ok{fill:var(--ok);stroke:var(--ok)}.svg circle.mid{fill:var(--warn);stroke:var(--warn)}
.svg .box{fill:var(--surface)}.svg .hot{fill:var(--no-weak);stroke:var(--no);stroke-width:2}
.svg .dashed{stroke-dasharray:3 3}
.svg .ring0{fill:var(--no-weak);stroke:var(--no)}.svg .ring1{fill:var(--warn-weak);stroke:var(--warn)}.svg .ring2{fill:var(--accent-weak);stroke:var(--accent)}
.cands{margin-top:10px;font-size:.8rem}
.cands summary{cursor:pointer;color:var(--muted)}
.cands ul{margin:.4em 0 0;padding-left:1.1em}.cands li{margin:.15em 0}
.cands a{color:var(--accent);text-decoration:none;font-weight:600}
.src{font-size:var(--u-xs);color:var(--muted);margin-left:4px}
details.ent{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:8px 12px;margin:6px 0}
details.ent summary{cursor:pointer}
details.ent dl{display:grid;grid-template-columns:140px 1fr;gap:4px 12px;font-size:.84rem;margin:.6em 0 .2em}
details.ent dt{color:var(--muted)}details.ent dd{margin:0;word-break:break-word}
details.ent:target,details.ent.flash{outline:2px solid var(--accent)}
.authored{font-size:.72rem;color:var(--muted);font-style:italic}
pre.raw{white-space:pre-wrap;font-size:.75rem}
.always{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
"""


def sources_strip():
    out = []
    for p in (SRC_A, SRC_B):
        raw = open(p, "rb").read()
        mt = datetime.datetime.fromtimestamp(os.path.getmtime(p)).strftime("%d/%m %H:%M")
        out.append(f'<span class="tag">📄 {e(os.path.basename(p))} · {mt} · #{hashlib.sha256(raw).hexdigest()[:8]}</span>')
    return " ".join(out)


def main():
    ta, tb, chrome = read(SRC_A), read(SRC_B), read(CHROME)
    cat = {x["id"]: x for x in parse_catalog(ta) + parse_catalog(tb)}
    na = sum(1 for k in cat if k.startswith("V")); nb = len(cat) - na
    ma, mb = parse_matrix_a(ta), parse_matrix_b(tb)

    style = re.search(r"<style>(.*?)</style>", chrome, re.S).group(1)
    top = re.search(r'(<div class="top">.*?</div></div>)\s*<main>', chrome, re.S).group(1).replace("📋 Revue du plan", "🎨 Grammaires visuelles")
    tail = re.search(r'(<dialog id="dlg">.*?<!--RUNTIME:END-->)', chrome, re.S).group(1)

    def name(i):
        return cat.get(i, {}).get("name", "?")

    blocks = []
    for key, title, objs in TYPES:
        blocks.append(f'<h2>{e(title)}</h2>')
        for o in objs:
            lab, q, reco, txt, sk = OBJ[o]
            ids = " ".join(f'<a href="#{i}" class="tag acc">{i}</a>' for i in reco)
            cands = [(i, w, "A") for i, w in ma.get(o, [])] + [(i, w, "B") for i, w in mb.get(o, [])]
            li = "".join(f'<li><a href="#{i}">{i}</a> {e(name(i))} <span class="src">({s})</span> — <span class="mute">{e(w)}</span></li>' for i, w, s in cands)
            blocks.append(f'''<div class="card obj" data-block="obj-{o}" data-responses="{RESP}"><span class="unseen">non vu</span>
<div class="ohead"><span class="oid">{o}</span><h3 style="margin:0">{e(lab)}</h3><span class="q">{e(q)}</span></div>
<div class="reco"><div class="sk">{SK[sk]}</div><div class="txt"><p class="ids">{ids}</p><p><b>Reco :</b> {e(txt)}</p><p class="mute" style="font-size:.8rem">{" · ".join(e(name(i)) for i in reco)}</p></div></div>
<details class="cands"><summary>Candidats des deux recherches ({len(cands)}), avec leur justification</summary><ul>{li}</ul></details>
</div>''')

    ref = []
    for label, pref in (("A · grammaires de représentation", "V"), ("B · patterns de revue et de feedback", "P")):
        ref.append(f'<h3>{e(label)}</h3><div class="catgrid">')
        for i in sorted(k for k in cat if k.startswith(pref)):
            x = cat[i]
            cls, tag = evidence_tag(x.get("evidence", ""), x.get("origin", ""))
            rows = "".join(f"<dt>{e(k)}</dt><dd>{linkify(e(v))}</dd>" for k, v in x.items() if k not in ("id", "name"))
            sk = SK.get(i, '<div class="ph">pas de vignette</div>')
            ref.append(f'<details class="ent" id="{i}"><summary><div class="sk">{sk}</div><div class="nm"><b>{i}</b> {e(x.get("name",""))} <span class="tag {cls}">{tag}</span></div></summary><dl>{rows}</dl></details>')
        ref.append("</div>")

    always = "".join(f'<a href="#{i}" class="tag acc">{i} · {e(w)}</a>' for i, w in ALWAYS)
    gen = datetime.datetime.now().strftime("%d/%m/%Y %H:%M")
    nobj = sum(len(o) for _, _, o in TYPES)

    page = f'''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="review-id" content="{RID}">
<meta name="review-type" content="decision">
<meta name="feedback-endpoint" content="">
<title>Revue · grammaires visuelles par objectif</title>
<style>{style}{PAGE_CSS}</style>
</head>
<body>
{top}
<main>
<section class="hero">
  <span class="tag acc">viz-review</span> <span class="tag">généré le {gen}</span> <span class="tag mid">⚠️ preuves surtout tirées d'extraits de recherche</span>
  <h1>Quelle grammaire visuelle injecter pour chaque objectif d'une vue ?</h1>
  <p class="lead"><b>Ce que j'attends de toi :</b> pour chacun des {nobj} objectifs, adopte, ajuste ou rejette ma reco, ou pose une question. Compte environ 10 minutes. Les détails sont repliés : ouvre-les seulement en cas de doute.</p>
  <div class="kpis">
    <div class="kpi"><b>{nobj}</b><span>objectifs à trancher</span></div>
    <div class="kpi"><b>{len(cat)}</b><span>grammaires ({na} A + {nb} B)</span></div>
    <div class="kpi"><b>5</b><span>types de vue</span></div>
  </div>
  <p style="margin-top:10px">{sources_strip()}</p>
  <p class="authored">Les recos, les intitulés et les croquis sont rédigés par moi. Les candidats et le catalogue sont recopiés tels quels des deux recherches, en anglais.</p>
</section>

<h2>🧩 Le socle, présent sur toutes les vues</h2>
<div class="card" data-block="socle" data-responses="{RESP}"><span class="unseen">non vu</span>
  <p>Ces éléments sont injectés partout, quel que soit le type : {len(ALWAYS)} grammaires qui reviennent dans les deux recherches.</p>
  <div class="always">{always}</div>
</div>

{"".join(blocks)}

<h2>🕳️ Les trous des recherches</h2>
<div class="card" data-block="trous" data-responses="{RESP}"><span class="unseen">non vu</span>
  <ul style="margin:.2em 0;padding-left:1.1em">
    <li><b>X3</b> (reco et confiance) et <b>G1</b> (la demande) n'ont aucune grammaire visuelle sourcée. Je propose des cartes de texte à cases fixes.</li>
    <li><b>D5</b> (risques) : la heat map est contestée, et ni le nœud papillon ni l'AMDEC n'ont été cherchés.</li>
    <li>Aucune donnée sur le bon nombre de boutons de verdict, ni sur la sélection de texte au téléphone.</li>
    <li>La stabilité des ancres d'un tour à l'autre n'est pas étudiée : il faudra une table d'ids de blocs entre le tour 1 et le tour 2.</li>
  </ul>
  <details class="cands"><summary>Texte brut des deux sections « gaps »</summary><pre class="raw">{e(gaps_raw(ta, "# gaps"))}

{e(gaps_raw(tb, "# 3. gaps"))}</pre></details>
</div>

<div class="global" data-global>
  <h3>🏁 Verdict global sur l'approche par objectif</h3>
  <p class="mute" style="font-size:.88rem">Ton avis d'ensemble, puis exporte.</p>
</div>

<h2>📚 Catalogue complet <small>référence, sans verdict · recopié tel quel</small></h2>
{"".join(ref)}
</main>
{tail}
<script>
/* page-specific: open the catalog entry targeted by an anchor */
function openHash(){{ const id=location.hash.slice(1), d=id&&document.getElementById(id); if(d&&d.tagName==='DETAILS'){{ d.open=true; d.classList.add('flash'); setTimeout(()=>d.classList.remove('flash'),1500) }} }}
window.addEventListener('hashchange', openHash); openHash();
</script>
</body>
</html>
'''
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(page)
    missing = sorted({i for o in OBJ.values() for i in o[2]} - set(cat)) + sorted(i for i, _ in ALWAYS if i not in cat)
    nosk = sorted(k for k in cat if k not in SK)
    print(f"wrote {OUT} ({len(page)} chars) · catalog {na}A+{nb}B · objectives {nobj} · matrix A {len(ma)} B {len(mb)} · missing ids {missing or 'none'} · no thumbnail {nosk or 'none'}")


if __name__ == "__main__":
    main()
