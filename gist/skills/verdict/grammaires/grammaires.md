# grammaires: visual grammar catalog for verdict
generated: 2026-11-08 10:18 by gist/skills/verdict/grammaires/src/make-grammaires.py; entries copied verbatim from the briefs, nothing selected.
counts: catalog 39 V (representation grammars, BRIEF-grammaires-visuelles-A) + 35 P (review patterns, -B); C6 architecture conformance 15 R (grammars) + 19 A (checks, BRIEF-conformite-archi).
use: read sections 1-4 when composing a page; for each id you place, read its entry: grep -A16 '^### V24 ' grammaires.md. Thumbnail markup: vignettes.html, element id=<ID>; copy the <div class="sk"> block (its CSS is already in template.html).
tiers: socle = every page; core = always for the type; signal = only when its trigger is true; reserve = on demand or when Mat asks.
omitted (declared): round-1 catalog list ALWAYS (superseded by socle), objective x grammar matrices, research gaps, round ledgers and decisions; see /praxis/projects/_archive/viz-review/build/catalog-grammaires.html and recettes.html.

## 1. Objectives (ids used below)
- G1 La demande: Qu'attend-on de toi, et en combien de temps ? | grammars: P15, V02 | En-tête SBAR (situation, contexte, évaluation, recommandation). Sa dernière ligne dit l'action attendue et le temps estimé. Aucune grammaire visuelle dédiée n'a été trouvée : c'est une carte de texte à cases fixes.
- G2 Le contexte: Pour qui, pourquoi, sous quel mandat, à partir de quoi ? | grammars: P02, V30 | Liste clé/valeur à cases fixes : objectif, audience, mandat, sources. Une case vide reste visible.
- G3 Progression et non-vu: Où en suis-je, que reste-t-il ? | grammars: V01, P08, V03 | Barre segmentée et compteur fixe (déjà dans la page), plus une grille de tuiles qui sert de sommaire, exceptions d'abord.
- G4 Tour 2: Qu'est-il advenu de mes commentaires ? | grammars: P09, V39 | Un registre reprend chaque commentaire du tour 1 avec son statut (traité, répondu, en attente, décliné) et un lien vers le bloc. Une pastille « modifié depuis ta revue » marque les blocs concernés.
- G5 Provenance: D'où vient ce contenu, est-il frais ? | grammars: P28, V29 | Un bandeau source · date · empreinte sur chaque bloc. Une source périmée est signalée.
- G6 Types de réponse: Comment est-ce que je réponds ? | grammars: P04, P01 | Verdict typé, avec commentaire obligatoire quand ce n'est pas ok. Avant l'export, un récapitulatif « vérifie tes réponses » avec un lien Modifier par ligne.
- D1 Objectifs et audience: À quoi sert ce doc, et pour qui ? | grammars: P16 | Un brief ancré sur l'objectif : objectif, critères de succès, hors périmètre, type de retour attendu.
- D2 Chiffres et affirmations changés: Quels faits ont bougé ? | grammars: V05, P07 | Un graphe de pente avant/après pour les chiffres. Une redline mot à mot pour le texte, avec bascule original / modifications.
- D3 Tranché vs ouvert: Qu'est-ce qui est décidé, qu'est-ce qui attend ? | grammars: P29, V16 | Un registre décidé / ouvert / remplacé, avec l'ouvert en premier.
- D4 Structure de l'argument: Le raisonnement tient-il ? | grammars: V16, V14 | Un arbre de plan avec pastilles de statut. L'arbre GSN (but, stratégie, preuve) est réservé aux livrables à fort enjeu.
- D5 Risques: Qu'est-ce qui peut mal tourner ? | grammars: P33, V11 | Un pré-mortem (« ça a échoué, pourquoi ? ») et une matrice 2×2. La heat map est écartée parce qu'elle est contestée (Cox 2008).
- C1 Big picture : l'architecture: Où ce changement se place-t-il dans le système ? | grammars: V18, V17 | Un schéma de composants (C4) figé par repo, avec les composants touchés surlignés. Le niveau contexte (V17) ne sert que pour une nouvelle intégration.
- C2 Flux: Qui appelle qui, et dans quel ordre ? | grammars: V20, V21 | Un diagramme de séquence à mise en page déterministe. Des couloirs si la question est « qui fait quoi ».
- C3 Rayon d'impact: Qu'est-ce qui dépend de ce qui a changé ? | grammars: V24, V23 | Des anneaux touché / 1 saut / 2 sauts. La matrice de dépendances prend le relais si le graphe est dense.
- C4 Conformité au mandat: L'agent est-il resté dans son périmètre ? | grammars: V28, P24 | La liste des fichiers dedans / dehors est calculée par le code. L'agent remplit une colonne « raison de l'écart ».
- C5 Faits synchronisés: Les valeurs répétées sont-elles cohérentes ? | grammars: V27 | Une grille fait × emplacement, où l'égalité est calculée par le code (par exemple la version écrite à 3 endroits).
- T1 Étapes et résultat attendu: Que dois-je faire, et que dois-je voir ? | grammars: V34, P21, P20 | Un tableau étape / attendu / observé, avec un bouton 📋 sur chaque commande, prompt ou curl. Given/When/Then quand le cas a des exemples.
- T2 Passe / échoue / bloqué: Combien passent, qu'est-ce qui bloque ? | grammars: P22, V01 | Six statuts, où bloqué n'est pas échoué. Note obligatoire en cas d'échec ou de blocage. Une barre empilée.
- T3 Couverture: Qu'est-ce qui n'est pas testé ? | grammars: V26, P23 | Une matrice exigence × test, avec les lignes non couvertes en tête.
- X1 Options comparées: Quelles options, et laquelle l'emporte ? | grammars: V09, P30, V10 | Une matrice de Pugh contre le statu quo (+ / = / −), avec l'option « ne rien faire » incluse. Des cartes à cases fixes quand les critères sont du texte.
- X2 Heuristiques: Avec quelle prudence trancher ? | grammars: P32, P34, P33 | Un badge porte à sens unique / à double sens qui fixe le nombre de validations. Un défaut si tu ne réponds pas, avec une échéance. Un pré-mortem pour les décisions à sens unique.
- X3 Reco et confiance: Que recommandes-tu, et avec quelle certitude ? | grammars: P31, P35 | Une carte de reco : probabilité en mots et en fourchette, confiance séparée, « ce qui me ferait changer d'avis ». Aucune grammaire visuelle sourcée n'a été trouvée.

## 2. Socle (every page)
- P15 · G1 · la demande · SBAR header (Situation / Background / Assessment / Recommendation)
- P02 · G2 · le contexte · Summary list (key/value rows) with optional summary cards
- V01 · G3 · progression · Segmented status bar (stacked proportion bar)
- V03 · G3 · sommaire en tuiles · Status tile grid (small multiples of blocks)
- P28 · G5 · provenance · Provenance strip (source, date, rank, reference) per claim
- P04 · G6 · verdict typé · Typed response with motivation (verdict is a typed annotation, not a free comment)
- P01 · G6 · récap avant export · Check-your-answers recap with per-row Change link
- P09 · G4 · tour 2, dès le 2e tour · Round-2 resolution ledger (addressed / answered / pending / declined, linked to the original feedback)
- V33 · palette + glyphes · Colour-blind-safe status palette with redundant glyphs

## 3. Recipes per type
### doc (Revue de doc)
core:
- P29 · D3 · tranché / ouvert · Decided / Open / Question ledger (decision status per item)
- V16 · D4 · structure de l'argument · Claim outline tree (indented, status chips)
signal:
- V05 · D2 · chiffres changés · Slopegraph (two-point before/after) | trigger: au moins 3 chiffres modifiés
- P07 · D2 · texte changé · Markup view switcher (Original / Simple / All changes) | trigger: tour ≥ 2 ou diff de la source
- P33 · D5 · pré-mortem · Pre-mortem block ("assume it failed; why") | trigger: le doc engage une décision
- V12 · D5 · matrice de risques · Risk matrix (likelihood x impact heat grid) | trigger: risques notés en probabilité et impact (à trancher)
- V14 · D4 · arbre GSN · GSN argument tree (goal - strategy - evidence) | trigger: livrable à fort enjeu
- V15 · D4 · Toulmin · Toulmin argument cell (claim, grounds, warrant, rebuttal) | trigger: une affirmation clé contestable
### code (Revue de code)
core:
- V18 · C1 · carte d'archi · C4 container/component box diagram with change overlay
- V24 · C3 · anneaux de rayon · Blast-radius rings (touched / 1-hop / 2-hop)
- V28 · C4 · dedans / dehors du mandat · Scope-boundary file list (in / out of owned paths)
- V38 · proportion +/− par fichier · Diff-stat bar (per-file added/removed proportion)
signal:
- V27 · C5 · faits synchronisés · Sync-fact grid (fact x location, value match/mismatch) | trigger: le repo déclare des valeurs répétées
- V20 · C2 · séquence · Sequence diagram (messages over time between participants) | trigger: le changement traverse ≥ 2 composants
- P24 · C4 · raison de l'écart · Mandate-conformity table (requirement - status - evidence - deviation reason) | trigger: au moins un fichier hors mandat
- V23 · C3 · matrice de dépendances · Dependency structure matrix (DSM / adjacency matrix) | trigger: graphe dense, > 15 nœuds
### test (Cahier de test)
core:
- V34 · T1 · étape / attendu / observé · Step table with expected vs observed result
- P21 · T1 · bouton copier · Copy button with insecure-context fallback
- P22 · T2 · six statuts · Run status set with progress bar (Passed / Failed / Blocked / Retest / Untested)
signal:
- V26 · T3 · couverture · Coverage / traceability matrix | trigger: une liste d'exigences existe
- P20 · T1 · Given/When/Then · Given/When/Then triple with Examples table | trigger: le cas a des exemples
- P18 · pause avant exécution · Pause-point Do-Confirm checklist of killer items | trigger: des prérequis à vérifier
- P19 · pas à pas · Read-Do step runner (one step in focus, ordered) | trigger: étapes dépendantes les unes des autres
### decision (Fiche de décision)
core:
- V09 · X1 · Pugh contre le statu quo · Pugh matrix (options vs baseline: better / same / worse)
- P32 · X2 · porte à sens unique / double · Door-type badge (one-way / two-way) that sets process weight
- P34 · X2 · défaut + échéance · Default-if-no-answer and decision deadline
- P31 · X3 · reco + confiance · Recommendation card with likelihood word + numeric range and separate confidence
signal:
- P33 · X2 · pré-mortem · Pre-mortem block ("assume it failed; why") | trigger: décision à sens unique
- V11 · X2 · matrice 2×2 · 2x2 matrix (quadrant plot) | trigger: 4 options ou plus
- V13 · arbre de décision · Decision path / decision tree (default branch highlighted) | trigger: options en cascade
- V10 · X1 · cartes d'options · Option profile cards (side-by-side, same slots) | trigger: critères en texte, pas en notes
### code conformance (C6 architecture, adds to code)
core:
- R15 · tableau des règles : passe / échoue / non évalué · Rules-verdict summary line (fitness function scoreboard) | when: toujours, et dit explicitement « non évalué »
- R03 · liens ajoutés / retirés par le changement · Edge delta list (new / removed dependencies) | when: toujours, marche dès le premier jour sans fichier de règles
- R05 · pastille de pureté par fichier touché · Purity badge row per touched file | when: si un fichier touché appartient à un composant déclaré pur
- R06 · barre de couverture des lignes modifiées · Changed-lines coverage strip (patch coverage bar) | when: si un fichier de couverture existe, sinon carte grise « fichiers sans test »
signal:
- R01 · bandes de couches, flèches interdites en rouge · Layered strip diagram with violation arrows | trigger: le fichier de règles déclare des couches et le diff crée un lien interdit ou non couvert
- R02 · matrice de dépendances rangée par couche · Dependency structure matrix (DSM) with layer blocks | trigger: plus de 12 composants, ou un cycle
- R10 · cycles surlignés sur la carte d'archi · Cycle highlight on the component map | trigger: un cycle nouveau ou agrandi
- R07 · marge verte / rouge dans le diff · Per-line coverage gutter in the diff hunk | trigger: un fichier a des lignes modifiées jamais exécutées
- R08 · couverture par composant, avant / après · Component coverage bars with delta tick | trigger: une couverture de référence est disponible
- R12 · mini-tableau du couplage avant / après · Instability / coupling mini-table with before-after | trigger: le couplage d'un composant touché bouge nettement
- R13 · « tu as touché A, pas B » : paires qui changent ensemble · Change-coupling pair list ("you touched A, not B") | trigger: un fichier « jumeau » habituel n'a pas été touché
- R04 · carte hexagonale cœur / ports / adaptateurs · Hexagon / ports-and-adapters concentric map | trigger: le repo déclare cœur / ports / adaptateurs et le diff touche le cœur
reserve:
- R09 · couverture du repo en treemap · Coverage sunburst / treemap of the repo
- R11 · nuage abstraction × instabilité · Main-sequence scatter (abstractness vs instability)
- R14 · bulles de points chauds · Hotspot bubble (churn x size, touched ringed)

## 4. Reserve (catalog entries outside socle, core and signal)
- V02 · Bullet graph (measure vs target vs qualitative bands) · How far is a value from its target, relative to acceptable bands?
- V04 · Sparkline / trajectory micro-chart · How did a number evolve (rounds, runs, versions)?
- V06 · Diverging delta bar (deviation from reference) · Above/below a fixed reference (previous value, target, budget) by how much?
- V07 · Cleveland dot plot (ranked values on common scale) · Compare a few values precisely, e.g. option scores, metric per module.
- V08 · Weighted decision matrix with graded cells · How do N options score on weighted criteria, and which wins?
- V17 · C4 system context diagram · What is the system, who uses it, and which external systems touch it?
- V19 · Architecture view selector (building block / runtime / deployment) · Which view type answers the reviewer question: static structure, behaviour, or where it runs?
- V21 · Swimlane diagram (steps grouped by owner) · Who or what performs each step; where are handoffs (agent -> reviewer)?
- V22 · Sankey / flow bands (quantity flow) · How does a quantity split and merge across stages (items in -> categories -> outcomes)?
- V25 · Treemap (area = size, colour = change) · Where in the codebase/doc tree is the volume of change or coverage concentrated?
- V29 · Timeline (rounds, events, freshness) · What happened when; how old is each source or round?
- V30 · Six-W context card (who / what / how much / where / when / why) · What is the objective, audience, mandate, sources of this deliverable at a glance?
- V31 · Chart-choice rule sets (FT Visual Vocabulary, Abela chooser, data-to-viz) · Meta: given the message (deviation, correlation, ranking, distribution, change over time, magnitude, part-to-whole, spatial, flow), which chart?
- V32 · Encoding hierarchy (Bertin visual variables + Cleveland-McGill ranking) · Meta: which visual channel for which kind of information?
- V35 · Unit chart / icon array (ISOTYPE-style, waffle) · How many individual things, each shown as one mark, in which state?
- V36 · Cynefin domain tag (clear / complicated / complex / chaotic) · How knowable is the problem, so how much to trust analysis vs probing?
- V37 · Wardley map (value chain x evolution) · Which components are novel vs commodity, hence build vs buy?
- V39 · Round-diff chips (since-your-feedback markers) · For each block you commented on, was it addressed, rejected by the agent, or untouched?
- P03 · Task list with minimal status set and "have you completed this section?" · long review spread over sessions; reviewer loses track of what remains
- P05 · Text-quote anchoring of comments (select text -> comment) · block-level comment cannot point at one figure or sentence; ids break when the text changes in round 2
- P06 · Author-query table with response column and house codes · agent questions to the reviewer are mixed with prose and get lost; answers are vague
- P08 · Review counter ("n changes, m comments, k unresolved") · reviewer cannot tell whether anything remains before sending
- P10 · Single "Important" banner for the one thing that changes the review · critical caveat (stale source, scope change, deadline) lost in the page
- P11 · Progressive disclosure for secondary detail · detail overloads the first read
- P12 · Error summary at export ("There is a problem") · export with missing mandatory comments or unanswered blocks silently produces a poor round 2
- P13 · Warning callout for irreversible or consequential items · one-way or costly items look like any other block
- P14 · Confirmation panel after export (what happens next) · reviewer unsure whether export worked and what to do (copy JSON where? say what?)
- P16 · Objective-anchored critique brief (goals first, questions not opinions, requested kinds of input) · reviewer judges on taste; feedback is not tied to the objective
- P17 · Time-boxed silent read with margin questions · reviewer skims and responds from impression; no stated reading time
- P23 · Coverage matrix (requirement x test, gaps highlighted) · reviewer cannot see what is not tested
- P25 · Signalling questions before the verdict · single judgement call without structured facts; hard for a tired reviewer
- P26 · Claim tree with evidence and defeaters (Assurance 2.0 / GSN) · key claims, their support and what could undermine them are scattered
- P27 · Evidence certainty badge (High / Moderate / Low / Very low) with stated reasons · all claims look equally solid
- P30 · Options comparison table with decision factors and pros/cons · options compared in prose; criteria implicit
- P35 · Decision journal record (prediction + confidence + review date) · no way to check the call later; outcome bias

## 5. Architecture rules file example (C6, one per target repo)
```yaml
architecture_rules_file_example:   # e.g. .stint/architecture.yml or arch-rules.yml at repo root
  version: 1
  components:                       # first match wins; order matters
    - {id: hooks-core,    label: "Hook logic (pure)",   paths: ["hooks/lib/**", "hooks/state/**"], layer: 1, role: core, pure: true}
    - {id: hooks-adapters,label: "Host/FS adapters",     paths: ["hooks/io/**"],                     layer: 2, role: adapter}
    - {id: hooks-entry,   label: "Hook registration",    paths: ["hooks/register.ts", "hooks/dash.ts"], layer: 3, role: entry}
    - {id: scripts,       label: "Python scripts",       paths: ["scripts/**/*.py"],                 layer: 3, role: entry}
  entries: ["hooks/register.ts", "scripts/brand.py"]
  extra_roots: [".claude-plugin/plugin.json", "hooks/hooks.json"]   # references invisible to imports
  allowed_to:                        # whitelist; unlisted pair = uncovered (A02)
    hooks-entry:    [hooks-core, hooks-adapters]
    hooks-adapters: [hooks-core]
    hooks-core:     []
    scripts:        []
  independent: [[scripts, hooks-core]]
  io_modules:
    fs:    ["fs", "node:fs", "fs/promises", "node:fs/promises", "pathlib", "shutil", "tempfile", "glob"]
    proc:  ["child_process", "node:child_process", "subprocess", "os.system"]
    net:   ["http", "https", "node:http", "node:https", "net", "socket", "urllib", "requests", "fetch(", "WebSocket"]
    clock: ["Date.now(", "new Date(", "performance.now(", "time.time(", "datetime.now(", "datetime.utcnow("]
    random:["Math.random(", "crypto.randomUUID(", "random.", "uuid.uuid4("]
    env:   ["process.env", "process.cwd(", "os.environ", "os.getcwd("]
    db:    ["sqlite3", "better-sqlite3", "pg", "psycopg2"]
    llm:   ["@anthropic-ai/sdk", "anthropic", "openai"]
  io_exempt_in_pure: ["type-only imports"]
  limits: {max_file_loc: 400, max_fan_out_component: 6, coverage_floor_changed_lines: 70, forbid_new_cycles: true}
  tests: {run_command: "claude plugin test /repos/stint", coverage_file: "lcov.info", counterpart: ["{dir}/{name}.test.ts", "tests/test_{name}.py"]}
  note: component names and paths above are ILLUSTRATIVE - not read from the stint repo
```

## 6. Catalog entries V (representation)
### V01 · Segmented status bar (stacked proportion bar)
origin: FT Visual Vocabulary, part-to-whole family. https://gijn.org/resource/document-of-the-day-visual-vocabulary/
question: What share of items is ok / revise / no / question / unseen?
objectives: [G3, T2, T3, D3, G1]
data: list of {status, count}; fixed status order
html_feasibility: {type: css, effort: low} # flex children with width % or one inline-svg rect row
scan_time: 1-2 s
injection_rule: any page with >=4 blocks or >=5 test cases; put at top as synthesis strip; always include "unseen" segment
anti_use: <4 items (use plain counts); >6 categories
evidence: FT lists part-to-whole as one of 9 relationship categories (secondary summary of the poster). Cleveland-McGill (V32) ranks length below position, so label counts in-segment.

### V02 · Bullet graph (measure vs target vs qualitative bands)
origin: Stephen Few, Bullet Graph Design Specification (Perceptual Edge, 2008). http://www.perceptualedge.com/articles/misc/Bullet_Graph_Design_Spec.pdf
question: How far is a value from its target, relative to acceptable bands?
objectives: [G1, G3, X3, C5]
data: {label, value, target, bands:[{upto,name}]}
html_feasibility: {type: css, effort: low} # 3 nested divs; or svg rects
scan_time: 2 s
injection_rule: one scalar with a known budget/target (reviewer minutes vs budget, tests passed vs required, evidence strength vs threshold)
anti_use: no target or no meaningful bands; categorical data
evidence: spec exists, designed as replacement for gauges (secondary summaries). Single-hue graded bands recommended per a blog paraphrase (unverified against PDF).

### V03 · Status tile grid (small multiples of blocks)
origin: Tufte small multiples (Visual Display of Quantitative Information, 2nd ed., p.168 as quoted). Secondary: https://maxmasnick.nfshost.com/projects/datatips/guidelines/small-multiples
question: Which blocks/cases are in which state, and where to look first?
objectives: [G1, G3, G4, D3, T2, G5]
data: list of {id, short_label<=3 words, status, changed_since_last:bool, severity?}
html_feasibility: {type: css, effort: low} # CSS grid, tiles are anchors to blocks
scan_time: 2 s
injection_rule: always as the page navigator; order exceptions first (revise/no/question), ok last and dimmed; mark changed tiles with a corner glyph for round 2
anti_use: >60 items (aggregate to V01 + exceptions list)
evidence: small multiples = same design repeated indexed by another variable (Tufte quote via secondary). Exception-first ordering is prior research, not this source.

### V04 · Sparkline / trajectory micro-chart
origin: Tufte, Beautiful Evidence (2006) (attribution via secondary sources). https://gist.github.com/uhop/bdd5ba8e488ddc4459da89c2775d9530
question: How did a number evolve (rounds, runs, versions)?
objectives: [G4, G5, T2, D2]
data: ordered series of numbers (>=4 points) + optional markers for min/max/current
html_feasibility: {type: inline-svg, effort: low} # one polyline, 100x20 viewBox, inline with text
scan_time: 1 s
injection_rule: a metric has history across rounds/runs (pass rate per run, open comments per round)
anti_use: <3 points; categorical data; when exact values matter (add number beside)
evidence: Tufte definition: small, high-resolution graphic embedded in words/numbers (secondary quote). Secondary only.

### V05 · Slopegraph (two-point before/after)
origin: Tufte (Beautiful Evidence per general attribution; UNVERIFIED, searches returned nothing on slopegraphs)
question: Which figures moved between previous version and this one, and how much?
objectives: [D2, G4, X1]
data: list of {label, before, after, unit}; <=12 rows
html_feasibility: {type: inline-svg, effort: med} # two columns of text, lines between; sort/collision-avoid labels in code
scan_time: 3 s
injection_rule: >=3 numeric claims changed between versions/rounds; colour only the lines that changed beyond threshold
anti_use: single change (use inline old->new text); >12 lines; different units per row
evidence: UNVERIFIED in this session. Related secondary: connected dot plots suit few categories across few time points (r-bloggers/Domo snippets).

### V06 · Diverging delta bar (deviation from reference)
origin: FT Visual Vocabulary, deviation family. https://gijn.org/resource/document-of-the-day-visual-vocabulary/
question: Above/below a fixed reference (previous value, target, budget) by how much?
objectives: [D2, G4, C5, T2]
data: list of {label, value, reference}
html_feasibility: {type: css, effort: low} # zero line + signed-width bars; or svg
scan_time: 2 s
injection_rule: numbers with a natural reference and sign matters (+/- vs previous round, over/under budget)
anti_use: no meaningful reference; values spanning orders of magnitude
evidence: FT defines deviation as emphasising positive/negative variation from fixed reference such as 0, target, average (secondary summary).

### V07 · Cleveland dot plot (ranked values on common scale)
origin: Cleveland and McGill 1984 JASA graphical perception; dot plot per Cleveland. https://info3312.infosci.cornell.edu/slides/04-graphical-perception.html (secondary)
question: Compare a few values precisely, e.g. option scores, metric per module.
objectives: [X1, D2, T2, C3]
data: list of {label, value}, optional second value (before/after) per row
html_feasibility: {type: inline-svg, effort: low} # or CSS grid with positioned dots
scan_time: 3 s
injection_rule: 4-15 labelled values where exact comparison matters; prefer over bars when baseline not zero
anti_use: part-to-whole; fewer than 3 items
evidence: position on a common scale ranked most accurate; Heer-Bostock replication largely held; later work questions ranking for some tasks (multi-value averages). Secondary.

### V08 · Weighted decision matrix with graded cells
origin: Decision-matrix method. https://en.wikipedia.org/wiki/Decision-matrix_method
question: How do N options score on weighted criteria, and which wins?
objectives: [X1, X3]
data: criteria[{name, weight}], options[], scores[option][criterion] (0-3 or 0-5), optional note per cell
html_feasibility: {type: table, effort: low} # table; cell shading + Harvey-ball-like glyph via CSS conic-gradient; totals row
scan_time: 5 s
injection_rule: >=2 options AND >=3 criteria with comparable scale; show weights in header, total with bar
anti_use: criteria not independent; scores invented without evidence (false precision; flag assumptions)
evidence: each option scored per criterion then multiplied by weight (secondary). Biases in weights/criteria persist (same snippet). Harvey balls: no source found.

### V09 · Pugh matrix (options vs baseline: better / same / worse)
origin: Pugh method. https://en.wikipedia.org/wiki/Decision-matrix_method (secondary)
question: Versus the status quo, where is each option better or worse?
objectives: [X1, X2]
data: baseline name, criteria[], options[], rating in {+,0,-} per cell
html_feasibility: {type: table, effort: low}
scan_time: 3 s
injection_rule: a baseline exists (current state, default) and criteria are qualitative; best as first pass with 3+ options
anti_use: need final numeric ranking; no real baseline
evidence: Pugh +1/0/-1 vs baseline; used early to screen, weighted matrix for finalists (secondary snippets).

### V10 · Option profile cards (side-by-side, same slots)
origin: Tufte small multiples applied to options (synthesis)
question: What are the 2-4 options, each in the same fixed slots (what, cost, risk, reversibility)?
objectives: [X1, X3, X2]
data: options[{name, one_line, pros[<=3], cons[<=3], cost, reversibility, recommended:bool}]
html_feasibility: {type: css, effort: low} # grid of equal cards; stack on phone; recommended card outlined + glyph
scan_time: 5 s
injection_rule: 2-4 options with prose-like attributes; use V08 when >=3 numeric criteria
anti_use: >4 options
evidence: synthesis; relies on small-multiple principle (same structure so differences pop).

### V11 · 2x2 matrix (quadrant plot)
origin: Eisenhower/Covey priority matrix; generic 2x2. https://corporatefinanceinstitute.com/resources/uncategorized/eisenhower-matrix/ (secondary). Grid origin contested per snippet.
question: Where do items sit on two axes, e.g. reversibility x cost of being wrong, impact x effort?
objectives: [X2, D5, X3, D3]
data: axes[{name, low_label, high_label}], items[{id, label, x:0..1, y:0..1}], quadrant action labels
html_feasibility: {type: inline-svg, effort: med} # label collision handling in code; numbered dots + legend for >8 items
scan_time: 3 s
injection_rule: exactly two orthogonal ordinal dimensions per item and quadrants imply different actions (e.g. high cost-of-wrong + irreversible = ask human)
anti_use: axes correlated; >12 items; precision claimed from ordinal input
evidence: quadrant->action mapping (do/schedule/delegate/delete) documented (secondary). Eisenhower authorship of grid disputed in snippet.

### V12 · Risk matrix (likelihood x impact heat grid)
origin: ISO 31000 practice; critique Cox 2008 Risk Analysis, DOI 10.1111/j.1539-6924.2008.01030.x. Summary https://en.wikipedia.org/wiki/Risk_matrix
question: Which risks are likely and severe?
objectives: [D5]
data: risks[{id, label, likelihood:1..5, impact:1..5, mitigation?}]
html_feasibility: {type: table, effort: low} # 5x5 table, risk ids placed in cells, colour + glyph
scan_time: 3 s
injection_rule: >=3 risks already rated on two ordinal scales by the author; keep scale labels explicit
anti_use: risk score by multiplying ordinals; few risks (use list with chips); rating is invented by the agent without basis
evidence: Cox: poor resolution, ambiguous inputs/outputs, can rank worse than random; Thomas et al. 2013 arbitrary rankings (secondary summary). Prefer V11 with named axes when only two dimensions matter.

### V13 · Decision path / decision tree (default branch highlighted)
origin: data-to-viz decision tree (chart-choice); generic decision trees. https://github.com/compbioNJU/data_to_viz (repo mirror, secondary)
question: If condition A then B; what happens by default if the reviewer does not answer?
objectives: [X2, T1, X3]
data: nodes[{id, question|outcome}], edges[{from, to, label}], default_path:[ids]
html_feasibility: {type: inline-svg, effort: med} # tidy tree layout in code; or nested <ul> with CSS connectors (low effort)
scan_time: 5 s
injection_rule: >=2 branching conditions or a stated default-if-silent; nested-list fallback when depth>3
anti_use: linear steps; cyclic flows
evidence: data-to-viz groups charts by data format as a decision tree (secondary). Use as pattern, not as content source.

### V14 · GSN argument tree (goal - strategy - evidence)
origin: Goal Structuring Notation Community Standard v3 (SCSC, 2021). https://scsc.uk/gsn
question: Is the top claim supported by sub-claims down to evidence, and where is it undeveloped?
objectives: [D4, X3, D2, D5, C4]
data: nodes[{id, type: goal|strategy|solution|context|assumption, text<=15 words, status: supported|undeveloped|challenged}], edges[{parent, child}]
html_feasibility: {type: inline-svg, effort: high} # or nested <details> tree with typed chips (low effort fallback)
scan_time: 5-8 s
injection_rule: deliverable makes a causal/safety/quality claim chain with sources (audit, recommendation, migration safety); show "undeveloped" diamonds as exceptions
anti_use: narrative docs without verifiable claims; non-expert audience unfamiliar with symbols (use plain labels, keep type glyphs)
evidence: claim = goal, strategy partitions argument, solutions = evidence; maintained by SCSC (secondary summary; standard not read). CAE (Adelard) is the parallel notation.

### V15 · Toulmin argument cell (claim, grounds, warrant, rebuttal)
origin: Toulmin model. https://owl.purdue.edu/owl/general_writing/academic_writing/historical_perspectives_on_argumentation/toulmin_argument.html
question: For one key claim, what grounds support it, what bridges grounds to claim, what would falsify it?
objectives: [D4, X3, D2]
data: per claim {claim, grounds[], warrant, backing?, qualifier?, rebuttal[]}
html_feasibility: {type: css, effort: low} # fixed 2x3 grid per claim
scan_time: 5 s
injection_rule: 1-5 central claims where the implicit warrant is the contestable part; one cell per claim
anti_use: descriptive content; >5 claims (use V14 or V16)
evidence: 3 core + 3 supporting parts; layouts vary across handouts, no standard layout (secondary).

### V16 · Claim outline tree (indented, status chips)
origin: synthesis from argument-map/GSN structure; pyramid-style outline (UNVERIFIED origin)
question: What is the structure of the document/argument and which node needs me?
objectives: [D4, D3, D1]
data: tree nodes[{id, level, title<=8 words, kind: claim|evidence|open, status, children}]
html_feasibility: {type: css, effort: low} # nested <details>/<ul>; exceptions auto-expanded
scan_time: 3-5 s
injection_rule: doc has hierarchical sections; always preferred over V14 when no evidence typing is needed; collapse ok branches
anti_use: flat documents
evidence: synthesis; exception-first expand rule from prior research.

### V17 · C4 system context diagram
origin: Simon Brown, C4 model. https://c4model.com/diagrams
question: What is the system, who uses it, and which external systems touch it?
objectives: [C1, G2, D1]
data: system, people[], external_systems[], edges[{from,to,label}]
html_feasibility: {type: inline-svg, effort: med} # centred box + radial/columns layout is easy; avoid general graph layout
scan_time: 5 s
injection_rule: new or reshaped system/integration; also for mandate/audience context (people around the deliverable)
anti_use: pure refactor within one container
evidence: levels context/container/component/code; context+container enough for most teams; notation independent (secondary via search summary of c4model.com).

### V18 · C4 container/component box diagram with change overlay
origin: C4 model. https://c4model.com/diagrams
question: Which parts exist, how do they connect, which did the change touch?
objectives: [C1, C2, C3, C4]
data: nodes[{id, name, kind, parent?, changed: none|modified|added|removed, owned:bool}], edges[{from,to,label}]
html_feasibility: {type: inline-svg, effort: med} # layered layout by code (columns by depth); CSS grid fallback with edge list
scan_time: 5-8 s
injection_rule: >=3 components and >=1 relationship change; dim unchanged, thick outline + glyph on changed, dashed on out-of-ownership
anti_use: >12 boxes (split by level)
evidence: container = deployable/data store; component = encapsulated functionality (secondary). Change overlay is synthesis.

### V19 · Architecture view selector (building block / runtime / deployment)
origin: arc42 sections 5-7. https://examples.arc42.org/sections/
question: Which view type answers the reviewer question: static structure, behaviour, or where it runs?
objectives: [C1, C2]
data: choice among {building_block, runtime_scenario, deployment}; content per chosen view
html_feasibility: {type: css, effort: low} # tabs via radio inputs, no JS
scan_time: n/a (meta)
injection_rule: code review with structure AND behaviour changes: show V18 first, V20 for 1-3 critical scenarios, deployment only if infra touched
anti_use: single-view changes
evidence: arc42 advises few runtime scenarios, level-1 building blocks for most stakeholders (secondary snippet).

### V20 · Sequence diagram (messages over time between participants)
origin: UML sequence diagram. https://static1.creately.com/guides/flowchart-vs-sequence-diagram
question: In what order do components/agents exchange messages in this scenario?
objectives: [C2, T1, G2]
data: participants[], messages[{from, to, label<=5 words, kind: call|return|async, changed:bool}]
html_feasibility: {type: inline-svg, effort: med} # column x, row y: deterministic layout, easy to generate
scan_time: 5-8 s
injection_rule: control flow across >=3 participants with ordering that matters; max 8 participants, 15 messages
anti_use: pure data transformation (use V22); ownership emphasis (use V21)
evidence: messages over time between participants (secondary). Deterministic layout makes it the cheapest diagram to generate.

### V21 · Swimlane diagram (steps grouped by owner)
origin: swimlane/flowchart variant. https://miro.com/blog/swimlane-diagram/
question: Who or what performs each step; where are handoffs (agent -> reviewer)?
objectives: [C2, G1, G2, D1]
data: lanes[], steps[{id, lane, label, order}], edges[{from,to}]
html_feasibility: {type: inline-svg, effort: med} # CSS grid rows=lanes also works
scan_time: 5 s
injection_rule: >=2 actors with handoffs; reviewer lane highlighted to show what is asked of him
anti_use: >5 lanes (gets messy per source); single actor
evidence: use when ownership matters beyond sequence; messy with many participants (secondary).

### V22 · Sankey / flow bands (quantity flow)
origin: Sankey diagram. https://www.metabase.com/glossary/sankey-diagram
question: How does a quantity split and merge across stages (items in -> categories -> outcomes)?
objectives: [C2, G3, D2]
data: nodes[], links[{source,target,value}], single consistent unit
html_feasibility: {type: inline-svg, effort: high} # layout needs a node-ordering algorithm; limit to 3 columns to stay feasible
scan_time: 5 s
injection_rule: single-unit counts passing through >=2 stages (files by type -> changed/unchanged; findings by severity -> verdict)
anti_use: mixed units, many small categories, cycles, time series
evidence: width encodes quantity; fails with mixed units/clutter/circular flow (secondary snippets).

### V23 · Dependency structure matrix (DSM / adjacency matrix)
origin: Eppinger and Browning, Design Structure Matrix Methods and Applications (MIT Press 2012). https://stuff.mit.edu/people/eppinger/SDE-MIT/DSM_Book.html
question: Which module depends on which; what clusters or cycles exist?
objectives: [C3, C5, C1, T2]
data: nodes[], edges[{from,to,weight?}], changed set
html_feasibility: {type: table, effort: low} # n x n table; cells coloured; changed rows/cols highlighted
scan_time: 5-8 s (matrix needs a legend)
injection_rule: >=8 modules with dense dependencies where node-link diagram would tangle; highlight rows of changed modules to read dependents in column
anti_use: <6 nodes; sparse trees; audience unfamiliar (add one-line how-to-read)
evidence: static DSM = N2 chart = adjacency matrix; applied to software architecture (Sookocheff, Stevens thesis) (secondary).

### V24 · Blast-radius rings (touched / 1-hop / 2-hop)
origin: impact-analysis tools: pyblastradius tiers direct/indirect/tertiary; impact_analyzer_dashboard rings view. https://pypi.org/project/pyblastradius/0.4.2/
question: What did the change touch and how far does impact propagate?
objectives: [C3]
data: changed[], dependents[{id, hop:1|2|3, path_to_changed?}], tests_covering?
html_feasibility: {type: inline-svg, effort: med} # concentric circles; angular placement by group; or 3 CSS columns as fallback
scan_time: 3 s
injection_rule: always for code review with a computed dependency graph; counts per ring in header; rings with uncovered nodes flagged
anti_use: graph not computed (agent must not guess dependents); >40 nodes (show counts + top N)
evidence: tools model impact as distance tiers with decay (morpharch weights by 1/(1+d)^2) (secondary snippet). No authoritative guidance on ring layout.

### V25 · Treemap (area = size, colour = change)
origin: Ben Shneiderman, tree-maps (UMD). https://drum.lib.umd.edu/items/06e28bc9-08ff-41c1-943e-27d74e663e6a/full
question: Where in the codebase/doc tree is the volume of change or coverage concentrated?
objectives: [C3, C4, T3]
data: hierarchy[{path, size, status|delta}]; squarified layout computed in code
html_feasibility: {type: inline-svg, effort: med} # absolute-positioned divs also OK; labels clipped on small cells
scan_time: 3 s
injection_rule: >=20 files/dirs with one numeric size (lines changed, test count); colour = in-scope/out-of-scope or covered/uncovered
anti_use: <10 nodes; exact comparison needed (area is weak per V32)
evidence: area from leaf attribute, colour second channel, thousands of items legible (secondary snippet). Area ranks low in Cleveland-McGill.

### V26 · Coverage / traceability matrix
origin: requirements traceability matrix practice (MathWorks, Katalon, Modern Requirements docs). https://www.mathworks.com/help/slrequirements/gs/identify-and-address-traceability-gaps.html
question: Which requirements/behaviours have tests, which have none?
objectives: [T3, C5, C4]
data: rows (requirements or behaviours, with priority), columns (tests or files), links[{row,col,state: pass|fail|notrun}]
html_feasibility: {type: table, effort: low} # empty rows rendered as a red/hatched "no coverage" row, sorted first
scan_time: 3-5 s
injection_rule: a list of things-to-verify AND a list of verifications exist; sort uncovered MUST items first; per-row coverage bar
anti_use: no source of truth for the requirement list (agent-invented rows hide real gaps)
evidence: vendors colour mapped/unexecuted/unmapped cells; filter to missing links; uncovered MUST = critical (secondary vendor docs).

### V27 · Sync-fact grid (fact x location, value match/mismatch)
origin: synthesis; related to traceability matrix and DSM
question: Does the same fact have the same value in every place that must agree (version in 3 files)?
objectives: [C5, G5]
data: facts[{name, locations[{path, value, line?}], expected?}]
html_feasibility: {type: table, effort: low} # rows=facts, cols=locations; mismatch cell red + glyph; code computes equality, never the LLM
scan_time: 2 s
injection_rule: project rules declare sync constraints; show even when all match (one green row proves the check ran)
anti_use: facts without declared constraints
evidence: synthesis (no external source). Equality is computed by code per "LLM designates, code copies".

### V28 · Scope-boundary file list (in / out of owned paths)
origin: synthesis; indented tree + ownership gutter
question: Did the change stay inside the mandate's owned paths?
objectives: [C4]
data: mandate.owned_globs[], touched[{path, lines_added, lines_removed, owned:bool}]
html_feasibility: {type: css, effort: low} # tree grouped by directory, out-of-scope rows first with red gutter; ownership computed by code glob match
scan_time: 3 s
injection_rule: a mandate with owned paths exists; if zero out-of-scope files show a single explicit "0 outside" line
anti_use: no declared ownership
evidence: synthesis; pair with V25 and V40.

### V29 · Timeline (rounds, events, freshness)
origin: Dan Roam, Back of the Napkin: "when" -> timeline. https://www.publishersweekly.com/9781591841999
question: What happened when; how old is each source or round?
objectives: [G5, G4, G3]
data: events[{t (ISO), label, kind, source?}], now
html_feasibility: {type: inline-svg, effort: low} # linear time axis; or CSS list with relative age chips ("3 d old") if span is irregular
scan_time: 3 s
injection_rule: >=3 dated events, or sources with differing dates; flag stale sources (age > threshold) with glyph
anti_use: single date (use a chip)
evidence: W-question to picture mapping (Who/What portrait, How much chart, Where map, When timeline) per secondary summary; exact book framework not verified.

### V30 · Six-W context card (who / what / how much / where / when / why)
origin: Dan Roam, Back of the Napkin (six W's, SQVID). https://www.publishersweekly.com/9781591841999
question: What is the objective, audience, mandate, sources of this deliverable at a glance?
objectives: [G2, D1, G1]
data: slots {who (audience), what (deliverable), why (objective), when (deadline/freshness), where (scope/paths/sources), how_much (size, time to review)}
html_feasibility: {type: css, effort: low} # fixed-slot grid, one short line per slot, icon+label
scan_time: 3 s
injection_rule: every page header; fixed slot order so the reviewer learns positions
anti_use: none; omit empty slots rather than fill
evidence: sources disagree on exact six (5W1H variants); SQVID expansion not confirmed. Use only as slot structure.

### V31 · Chart-choice rule sets (FT Visual Vocabulary, Abela chooser, data-to-viz)
origin: FT https://gijn.org/resource/document-of-the-day-visual-vocabulary/ ; Abela (via https://slidemodel.com/free-powerpoint-templates/free-abelas-chart-chooser-powerpoint-template/) ; data-to-viz (https://github.com/compbioNJU/data_to_viz)
question: Meta: given the message (deviation, correlation, ranking, distribution, change over time, magnitude, part-to-whole, spatial, flow), which chart?
objectives: [all numeric blocks]
data: per numeric block a declared "message" enum
html_feasibility: {type: css, effort: low} # selection logic only, no rendering
scan_time: n/a
injection_rule: use as the generator's lookup: message type -> grammar (deviation->V06, ranking->V07, part-to-whole->V01, change over time->V04/V29, flow->V22, magnitude->V07)
anti_use: do not expose the chooser to the reviewer
evidence: FT: 9 categories; Abela: composition, relationship, comparison, distribution; data-to-viz: tree by data format (all secondary). Lengler-Eppler Periodic Table (~100 methods, IASTED 2007) found only through secondary summaries; not adopted (too broad).

### V32 · Encoding hierarchy (Bertin visual variables + Cleveland-McGill ranking)
origin: Bertin, Semiologie graphique (1967); Cleveland and McGill, JASA 1984. https://axismaps.com/guide/visual-variables ; https://info3312.infosci.cornell.edu/slides/04-graphical-perception.html
question: Meta: which visual channel for which kind of information?
objectives: [all]
data: none; rule table
html_feasibility: {type: css, effort: low}
scan_time: n/a
injection_rule: position/length for quantities; hue + shape for categories (status); value (lightness) for order; size/area only for coarse magnitude; texture/pattern as redundant channel; never rely on one channel
anti_use: do not use area/angle (pie) for precise comparison
evidence: Bertin 7 variables (position, size, shape, value, hue, orientation, texture); selective vs associative vs dissociative; Cleveland-McGill order position > length > angle > area > saturation, largely replicated (Heer-Bostock) but contested for some tasks (secondary).

### V33 · Colour-blind-safe status palette with redundant glyphs
origin: Okabe and Ito colour universal design. https://jfly.uni-koeln.de/color/text.html
question: Meta: how to colour ok/revise/no/question/unseen in light and dark and be unambiguous
objectives: [all status displays]
data: status enum -> {color_light, color_dark, glyph, pattern}
html_feasibility: {type: css, effort: low} # CSS variables under prefers-color-scheme; glyph via ::before text
scan_time: n/a
injection_rule: define once; every status chip = colour + glyph + word. Unseen = hatched/outlined (absence is a state)
anti_use: red/green only
evidence: palette unambiguous to colour-blind and non-colour-blind viewers (primary page title); redundant colour+shape not always better than expected, per 2026 arXiv Tseng et al. (https://arxiv.org/abs/2602.06792v1), so test the glyph set.

### V34 · Step table with expected vs observed result
origin: test-case / traceability report tables (Katalon, TestCollab). https://docs.katalon.com/katalon-platform/analyze/reports/requirement-traceability-report
question: For each step, what is expected, what happened, what is the state?
objectives: [T1, T2]
data: steps[{n, action<=12 words, expected<=12 words, observed?, state: pass|fail|blocked|notrun, evidence_ref?}]
html_feasibility: {type: table, effort: low} # two-line rows; failures first-expanded; state glyph in first column
scan_time: 3-5 s
injection_rule: any ordered procedure; collapse passing runs of consecutive steps into "steps 3-9 pass"
anti_use: >30 steps without grouping
evidence: chained requirement-test-execution-defect tables with coverage filters (secondary vendor docs).

### V35 · Unit chart / icon array (ISOTYPE-style, waffle)
origin: Neurath, ISOTYPE. UNVERIFIED (searches returned nothing on ISOTYPE)
question: How many individual things, each shown as one mark, in which state?
objectives: [G3, T2, T3]
data: items[{id, state}] (<=100)
html_feasibility: {type: css, effort: low} # grid of small squares/circles; each = a block or test
scan_time: 2 s
injection_rule: counts 10-100 where each unit is individually reviewable; a tile grid (V03) with links covers the same need with navigation
anti_use: >100; need exact proportions (V01)
evidence: UNVERIFIED in this session; counting-by-icon claim not backed by a fetched source. Low priority, likely redundant with V03.

### V36 · Cynefin domain tag (clear / complicated / complex / chaotic)
origin: Snowden and Boone, HBR 2007; https://en.wikipedia.org/wiki/Cynefin_framework
question: How knowable is the problem, so how much to trust analysis vs probing?
objectives: [X2, D5]
data: per decision {domain: clear|complicated|complex|chaotic|confusion}
html_feasibility: {type: css, effort: low} # a 4-cell mini-map with one cell lit
scan_time: 2 s
injection_rule: only when the decision sheet asserts uncertainty class; low priority, V11 usually enough
anti_use: reviewers unfamiliar with the vocabulary; domain assigned by LLM with no basis
evidence: ordered (clear, complicated) vs unordered (complex, chaotic); domain names changed over time (secondary).

### V37 · Wardley map (value chain x evolution)
origin: Simon Wardley. https://www.wardleymaps.com/intro
question: Which components are novel vs commodity, hence build vs buy?
objectives: [C1, X1]
data: components[{id, visibility 0..1, evolution 0..1}], edges
html_feasibility: {type: inline-svg, effort: med}
scan_time: 8+ s
injection_rule: rarely; only for build-vs-buy strategy decisions
anti_use: general code/doc review; needs trained reader. Verdict: not recommended for this use.
evidence: axes: visibility (vertical), evolution genesis->commodity (horizontal) (secondary).

### V38 · Diff-stat bar (per-file added/removed proportion)
origin: VCS diff stat convention (synthesis; UNVERIFIED as a source)
question: How big is the change per file, and is it additive or destructive?
objectives: [C3, C4]
data: files[{path, added, removed, owned:bool}]
html_feasibility: {type: css, effort: low} # two flex segments, width in sqrt or capped scale
scan_time: 3 s
injection_rule: list of touched files; sort by out-of-scope first then by size
anti_use: >50 files (use V25)
evidence: none fetched; included because it reuses V01 mechanics.

### V39 · Round-diff chips (since-your-feedback markers)
origin: synthesis from small multiples; sparklines
question: For each block you commented on, was it addressed, rejected by the agent, or untouched?
objectives: [G4, D2, D3]
data: feedback_items[{block_id, verdict_prev, agent_response: fixed|declined|unchanged|new, diff_ref?}]
html_feasibility: {type: table, effort: low} # one row per previous comment: old comment, agent response chip, jump link
scan_time: 3 s
injection_rule: round >= 2; unchanged-but-flagged rows first (silent ignores)
anti_use: round 1
evidence: synthesis; closes gap on "what changed since feedback" together with V05.

## 7. Catalog entries P (review patterns)
### P01 · Check-your-answers recap with per-row Change link
origin: GOV.UK Design System, pattern "Check answers" - https://design-system.service.gov.uk/patterns/check-answers/
problem: reviewer submits without seeing the sum of what they decided; mistakes found after export
objectives: [G6, G3, X3]
data_required: blocks[{id, label, verdict, comment_excerpt}]
html_feasibility: low
interaction: final section lists every block with its verdict and comment as key/value rows; "Change" link scrolls to the block; button names the action ("Export verdicts"); page states export is not final until clicked
injection_rule: always, as last section of any page with >=3 blocks
anti_use: single-block pages; do not use as the only place to answer
evidence: primary (rules: title tells what to do, button names action, Change returns to recap, skipped = "Not provided")
tips: show unanswered rows as "Not provided" with link to the block, not blank

### P02 · Summary list (key/value rows) with optional summary cards
origin: GOV.UK Summary list - https://design-system.service.gov.uk/components/summary-list/
problem: context facts (objective, audience, mandate, sources, dates) buried in prose
objectives: [G2, D1, G5, C4]
data_required: context{key,value,action?} rows; cards[] when several items of the same type
html_feasibility: low (dl/dt/dd + CSS grid; stacks on phone)
interaction: read-only scan; optional row action ("Open source")
injection_rule: use for any set of >=3 short facts with fixed keys; cards when items repeat (e.g. one card per source, per option)
anti_use: tabular multi-column data (use table); items without a key
evidence: primary (dl element; keep borders, they help reading; card actions max 2-3, warn on risky actions)

### P03 · Task list with minimal status set and "have you completed this section?"
origin: GOV.UK Complete multiple tasks - https://design-system.service.gov.uk/patterns/complete-multiple-tasks/
problem: long review spread over sessions; reviewer loses track of what remains
objectives: [G3, T3, G1]
data_required: sections[{id, title, status in {completed, incomplete, in_progress?, cannot_start}, est_minutes}]
html_feasibility: low
interaction: list of sections with tag on the right; click jumps to block; reviewer explicitly declares a section done (yes/no) rather than the page inferring it from clicks
injection_rule: >=5 blocks or expected review >10 min; at page top below the ask
anti_use: short pages (guide says simplify first); never use the "problem" status as validation (inline errors instead)
evidence: primary (fewest statuses; verbs for tasks; adjectives for status; "cannot start yet" = grey, unlinked; user-declared completion)
tips: map "completed" to declared-done, not "visited"; this solves "unseen" tracking

### P04 · Typed response with motivation (verdict is a typed annotation, not a free comment)
origin: W3C Web Annotation Data Model, motivations (commenting, questioning, assessing, editing, replying) - https://www.w3.org/TR/annotation-model/
problem: untyped comments force the agent to guess whether a note is approval, change request, or question
objectives: [G6, G4]
data_required: block ids; verdict enum {ok, revise, no, question}; comment string; optional proposed_text
html_feasibility: low (radio group styled as segmented control; comment textarea revealed by non-ok verdicts)
interaction: pick one verdict per block; comment mandatory for revise/no/question, optional for ok
injection_rule: every block that carries a claim, decision, or deliverable unit
anti_use: purely informational blocks (give a "seen" checkbox only)
evidence: primary for the motivation vocabulary; the 4-verdict mapping (ok=assessing, revise=editing, no=assessing, question=questioning) is my derivation
tips: segmented control with text labels and shapes, not colour only; touch target >=44px; keyboard 1-4 shortcuts on desktop

### P05 · Text-quote anchoring of comments (select text -> comment)
origin: W3C Web Annotation TextQuoteSelector (exact + prefix + suffix) - https://www.w3.org/TR/annotation-model/
problem: block-level comment cannot point at one figure or sentence; ids break when the text changes in round 2
objectives: [G6, G4, D2]
data_required: block text immutable per round; export stores {block_id, exact, prefix, suffix}
html_feasibility: med (window.getSelection + range; mobile selection UX is clumsy)
interaction: select a phrase, a small "Comment on selection" button appears; comment attaches to the quote
injection_rule: only on prose blocks >120 words or tables with figures; offer as optional layer, block verdict stays mandatory
anti_use: phone-first pages (fallback: per-sentence or per-row "comment" link generated by the code, ids assigned by generator)
evidence: primary (selector spec); phone usability unverified
tips: for generated pages prefer generator-assigned ids on sentences/rows (stable, no selection API); keep quote selector for robustness across rounds

### P06 · Author-query table with response column and house codes
origin: CIEP "Queries to the author" (editorial copyediting practice) - https://www.ciep.uk/resource/queries-author.html
problem: agent questions to the reviewer are mixed with prose and get lost; answers are vague
objectives: [G1, G4, G6, D3]
data_required: queries[{id (e.g. Q3), location (block id), query text, options[] optional, default?}]
html_feasibility: low
interaction: three columns - location, query, response; reviewer picks an offered option or types; "Agreed" / "Done" style short answers accepted
injection_rule: whenever the agent has questions it could not resolve; list at the top (G1) and inline at the block
anti_use: do not query what the agent can fix alone (spelling, trivial facts); do not ask without proposing options
evidence: primary (neutral tone, specific, offer alternatives, no silent changes, answers recorded through the query system)
tips: each query needs an id, a location, and at least two options + "other"; mark the default the agent will apply if no answer

### P07 · Markup view switcher (Original / Simple / All changes)
origin: Microsoft Word Track Changes views - https://support.microsoft.com/en-us/office/track-changes-in-word-197ba630-0f5f-4a8e-9a77-3712475e806a ; legal redlining practice
problem: round 2 reader must re-read everything to find what changed
objectives: [G4, D2, D3]
data_required: per block {text_prev, text_now, change_type, linked_feedback_id}
html_feasibility: low-med (ins/del elements; word-level diff computed by the generator, not at runtime)
interaction: toggle: Final (clean) / Changes shown / Original; margin bar marks changed blocks; "Next change" button
injection_rule: round >=2 and any block with text_prev; default view = clean with margin bars, changes one click away
anti_use: round 1; heavy rewrites (diff noise) - show side-by-side before/after instead
evidence: primary (Simple = margin line, All = coloured, Hiding markup does not remove it; only Accept/Reject resolve)
tips: underline+strike, not only colour; the accept/reject maps to the reviewer re-verdict on the changed block

### P08 · Review counter ("n changes, m comments, k unresolved")
origin: Word Reviewing Pane summary - same Microsoft page as P07
problem: reviewer cannot tell whether anything remains before sending
objectives: [G3, G4]
data_required: counts derived live from state
html_feasibility: low (sticky footer/header bar)
interaction: sticky bar shows answered/total and unresolved items; click cycles to next unanswered
injection_rule: always
anti_use: none; keep numbers not percentages (exact counts are verifiable)
evidence: primary (pane summary confirms none remain before sharing)

### P09 · Round-2 resolution ledger (addressed / answered / pending / declined, linked to the original feedback)
origin: composite - CIEP query response log (P06) + inspection issue log dispositions (Wiegers template, secondary) + Figma comment pins (resolve)
problem: after "process the feedback" the reviewer cannot verify that each remark was handled and how
objectives: [G4, G3]
data_required: prior_feedback[{id, block_id, verdict, comment}], agent_response[{feedback_id, status in {addressed, answered, pending, declined}, note, new_block_ref}]
html_feasibility: low-med
interaction: top-of-page ledger, one row per previous comment, grouped by status; reviewer can reopen a row (sets verdict again) or confirm
injection_rule: round >=2; mandatory first section; "declined" requires a reason
anti_use: round 1
evidence: secondary for inspection dispositions (Resolved/Deferred/Rejected from student/defect-tracking notes; Wiegers log lists severity major/minor); Figma resolve behaviour not confirmed (help page fetched did not cover it) -> unverified
tips: counts first ("11 addressed, 2 answered, 1 declined, 0 pending"), exceptions (declined, pending) expanded, rest collapsed

### P10 · Single "Important" banner for the one thing that changes the review
origin: GOV.UK Notification banner - https://design-system.service.gov.uk/components/notification-banner/
problem: critical caveat (stale source, scope change, deadline) lost in the page
objectives: [G5, G4, G1]
data_required: banner{type in {important, success}, heading, text}
html_feasibility: low
interaction: read; dismissal optional
injection_rule: at most one per page; use when a freshness check failed, a source is older than threshold, or an assumption changed between rounds
anti_use: validation errors; information that belongs to the main task; several banners (merge or show highest priority)
evidence: primary (sparing use, one per page, heading text so meaning is not colour-only)

### P11 · Progressive disclosure for secondary detail
origin: GOV.UK Details - https://design-system.service.gov.uk/components/details/
problem: detail overloads the first read
objectives: [G2, G5, D2, T1]
data_required: block.summary (always shown), block.detail (collapsible)
html_feasibility: low (native details/summary, zero JS)
interaction: reviewer opens only what they doubt
injection_rule: sources list, full commands, raw logs, long rationale; default closed
anti_use: anything most readers need; GOV.UK warns some users skip the link and voice control may struggle -> never hide a verdict-relevant fact, never hide the flagged exception
evidence: primary
tips: summary line must state the finding, not "More details"

### P12 · Error summary at export ("There is a problem")
origin: GOV.UK Error summary - https://design-system.service.gov.uk/components/error-summary/
problem: export with missing mandatory comments or unanswered blocks silently produces a poor round 2
objectives: [G3, G6]
data_required: validation rules per block (comment required for revise/no/question)
html_feasibility: low
interaction: on Export click, summary at top lists each problem as a link to the offending block; focus moves to it
injection_rule: always with export button; allow "export anyway" with explicit "unanswered = no opinion" marker
anti_use: do not block export for unseen blocks the reviewer chose to skip - mark them "not reviewed"
evidence: primary (links to first field, same wording as inline message, focus moves to summary)

### P13 · Warning callout for irreversible or consequential items
origin: GOV.UK Warning text - https://design-system.service.gov.uk/components/warning-text/
problem: one-way or costly items look like any other block
objectives: [X2, D5, C1]
data_required: block.flags[] {kind: irreversible|costly|public|security}, reason
html_feasibility: low
interaction: read; may require explicit confirm checkbox before verdict "ok"
injection_rule: content signals - delete, publish, send, migrate, spend, rotate keys, schema change, external recipient
anti_use: general emphasis; overuse kills the signal (cap ~3 per page)
evidence: primary (use to warn about something important); the confirm-checkbox gate is my addition

### P14 · Confirmation panel after export (what happens next)
origin: GOV.UK Confirmation pages - https://design-system.service.gov.uk/patterns/confirmation-pages/
problem: reviewer unsure whether export worked and what to do (copy JSON where? say what?)
objectives: [G1, G4]
data_required: export file name, exact next-step phrase ("tell the agent: process the feedback"), reference id/round/timestamp
html_feasibility: low
interaction: panel replaces the button area: file saved name, copy-the-sentence button (see P21), round number, how to reopen
injection_rule: always
anti_use: none
evidence: primary (completion + what happens next + reference number + way to save a record)

### P15 · SBAR header (Situation / Background / Assessment / Recommendation)
origin: clinical handoff, Navy-origin, endorsed by IHI/Joint Commission/WHO - https://qi.elft.nhs.uk/?p=10117 ; review https://link.springer.com/article/10.1186/s40886-018-0073-1
problem: the synthesis is narrative; reader must dig for what is asked of them
objectives: [G1, G2, C1, X3, D1]
data_required: situation (1-2 lines), background (objective, mandate), assessment (agent's own read incl. confidence), recommendation (what reviewer must do, time)
html_feasibility: low
interaction: read in 30s; recommendation ends with the ask and button to start
injection_rule: top of every page; for code review fill C1 (big picture) as Situation+Background
anti_use: do not pad; if assessment is empty the agent has not formed a view
evidence: secondary (SBAR content from nursing sources and a 2018 narrative review; IHI download page not reached)

### P16 · Objective-anchored critique brief (goals first, questions not opinions, requested kinds of input)
origin: Nielsen Norman Group "Design critiques" - https://www.nngroup.com/articles/design-critiques/
problem: reviewer judges on taste; feedback is not tied to the objective
objectives: [G1, G2, D1, G6]
data_required: objective, audience, success criteria, "what input I want" list, "out of scope" list
html_feasibility: low
interaction: reviewer reads goals, then each verdict is read against them; verdict form may show the criterion tag per block
injection_rule: top of doc review and design deliverables; per block add "serves objective O2"
anti_use: code diffs where the mandate is a spec (use P29/C4 table)
evidence: primary (set scope/objectives first, share beforehand, reframe opinions as goal questions, facilitator time-box)
tips: include explicit "not asking you about" list; reduces scope creep in feedback

### P17 · Time-boxed silent read with margin questions
origin: Amazon six-page memo meetings - https://www.cnbc.com/2018/04/23/what-jeff-bezos-learned-from-requiring-6-page-memos-at-amazon.html (and blogs)
problem: reviewer skims and responds from impression; no stated reading time
objectives: [G1, G3]
data_required: est_read_minutes per section, total; question count
html_feasibility: low (static estimate; optional timer)
interaction: reviewer sees "Read 8 min, decide 4 min"; notes questions as they read (verdict=question)
injection_rule: header of long deliverables; estimate = words/200 + 20s per block needing verdict
anti_use: do not impose a hard timer; estimate only
evidence: secondary (durations vary 10-30 min across blogs; no Amazon primary document found)

### P18 · Pause-point Do-Confirm checklist of killer items
origin: aviation checklists (Boorman/Boeing via Gawande, "Checklist Manifesto"); WHO Surgical Safety Checklist 3 pauses - https://www.who.int/publications/i/item/9789241598590
problem: reviewer forgets the few checks that matter before approving
objectives: [C4, D5, G3, T2]
data_required: items[<=9]{id, text, evidence_ref}, pause_point (e.g. "before approving merge", "before export")
html_feasibility: low (checkboxes; export blocked or flagged until all ticked or waived)
interaction: Do-Confirm: reviewer reads, then ticks to confirm; each tick optionally waivable with reason
injection_rule: before the final verdict; items drawn from risks, flagged irreversible items, mandate requirements; keep 5-9
anti_use: long procedures (use P19); lists that restate everything
evidence: secondary (Boorman five-nine items and killer items from book summaries; WHO manual text not reached - the fetched WHO page lacked pause details)

### P19 · Read-Do step runner (one step in focus, ordered)
origin: Read-Do checklist type (aviation emergency/abnormal procedures; Gawande) - https://sketchplanations.com/read-do-do-confirm-checklists ; https://www.cfinotebook.net/notebook/flight-training/checklist-usage-in-aviation
problem: tester executes steps out of order, misses a precondition
objectives: [T1, T2]
data_required: steps[{n, action, expected, command?, precondition?}]
html_feasibility: med (current-step highlight, next/prev buttons; all steps still visible)
interaction: current step expanded; "Pass / Fail / Blocked" advances; failed step stops the run by default and offers "skip with reason"
injection_rule: sequential test procedures with dependencies; destructive or irreversible steps
anti_use: independent checks (use P22 list); do not hide the other steps
evidence: secondary (terminology varies across sources; no FAA primary text reached)

### P20 · Given/When/Then triple with Examples table
origin: Gherkin reference - https://cucumber.io/docs/gherkin/reference/
problem: test step mixes setup, action and expectation; expected result unclear
objectives: [T1, T3]
data_required: scenarios[{id, given[], when, then[], examples[]?}]
html_feasibility: low
interaction: read; run each Then as the observable check; one example row = one execution row
injection_rule: behaviour tests with data variants; user-facing acceptance criteria
anti_use: exploratory tests; Then must be observable (guide says check output, not internal state)
evidence: primary (Background max ~4 lines; Examples table feeds placeholders)

### P21 · Copy button with insecure-context fallback
origin: Clipboard API secure-context rule + execCommand fallback (developer sources only) - https://bobbyhadz.com/blog/navigator-clipboard-is-undefined-in-javascript
problem: copy-paste of commands/prompts/curl fails silently on http/LAN and file://
objectives: [T1, G1, G4]
data_required: snippet text (inert, in pre or textarea), label, language
html_feasibility: low-med
interaction: button "Copy" copies; state changes to "Copied" or "Select and press Ctrl+C" on failure
injection_rule: any command, prompt, curl, path, SQL block; also the "tell the agent: process the feedback" phrase
anti_use: snippets containing secrets: show masked placeholder
evidence: secondary (MDN page not reached; pattern consistent across sources)
implementation: | if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(ok, fb); else fb(); fb(): create textarea (position:fixed; left:-9999px, NOT display:none), select(), document.execCommand('copy') synchronously in the click handler, use the boolean result; if false: reveal the snippet in a visible readonly textarea, auto-selected, message "Press Ctrl+C". Show success only on true.

### P22 · Run status set with progress bar (Passed / Failed / Blocked / Retest / Untested)
origin: TestRail result statuses - https://velog.io/@dahunyoo/TestRun-and-TestPlan-on-Testrail ; vendor blog https://blog.gurock.com/announcing-testrail-1-1/
problem: test execution outcome reduced to pass/fail; blocked work looks like failure
objectives: [T2, T3, G3]
data_required: tests[{id, title, status, note, evidence_attachment?}]; status enum fixed in the page
html_feasibility: low
interaction: per-test segmented control; note required for failed/blocked; stacked bar summarizes counts
injection_rule: any test plan; map blocked = precondition unmet, retest = fixed, ready again
anti_use: do not add custom statuses beyond 6; do not count blocked as pass
evidence: secondary (default ids 1 Passed, 2 Blocked, 3 Untested, 4 Retest, 5 Failed; progress-bar computation not documented in sources)
tips: stacked bar order = failed, blocked, retest, untested, passed; exceptions first

### P23 · Coverage matrix (requirement x test, gaps highlighted)
origin: requirements traceability matrix (general QA practice); linked to assurance cases (P26)
problem: reviewer cannot see what is not tested
objectives: [T3, C4]
data_required: requirements[{id, text, priority}], tests[{id}], links[{req_id, test_id}]
html_feasibility: med (table; phone: grouped list "Requirement - tests - gap")
interaction: rows with zero tests flagged; click a cell jumps to the test; verdict on gap: accept risk / add test
injection_rule: test plans with >=5 requirements or a mandate document; generate from links in data
anti_use: tiny plans
evidence: unverified (no primary source fetched; standard QA artefact)

### P24 · Mandate-conformity table (requirement - status - evidence - deviation reason)
origin: composite - GOV.UK summary list rows (P02) + risk-of-bias per-domain judgement with justified override (Cochrane Handbook ch.8) - https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-08
problem: "does it do what was asked?" answered by impression
objectives: [C4, D5, C1]
data_required: mandate_items[{id, text, source}], status in {met, partial, not_met, not_applicable}, evidence_ref, deviation_reason
html_feasibility: low
interaction: reviewer overrides status with written reason (Cochrane: reviewer may override algorithm with justification); partial/not_met rows expanded first
injection_rule: whenever a written mandate/brief/spec exists; agent must fill each row, never leave blank
anti_use: no mandate -> instead ask reviewer to state it (P16)
evidence: primary for the three-level judgement + override-with-justification; the table itself is my composite

### P25 · Signalling questions before the verdict
origin: Cochrane risk-of-bias tool signalling questions (Yes / Probably yes / Probably no / No / No information) - https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-08
problem: single judgement call without structured facts; hard for a tired reviewer
objectives: [D5, C4, G6]
data_required: per block 2-4 closed questions with agent's proposed answer + evidence; derived verdict suggestion
html_feasibility: med
interaction: reviewer confirms or flips the agent's answers (one tap each); suggested verdict computed by code, reviewer can override with reason
injection_rule: high-stakes blocks (security, legal, financial claim); not for every block
anti_use: low-stakes blocks (adds clicks)
evidence: primary for the answer scale and "algorithm proposes, human can override with justification"

### P26 · Claim tree with evidence and defeaters (Assurance 2.0 / GSN)
origin: Goal Structuring Notation (Kelly) and Assurance 2.0 (Bloomfield/Rushby) - https://www.csl.sri.com/~rushby/papers/a2nutshell.pdf ; https://arxiv.org/abs/2408.11699v3
problem: key claims, their support and what could undermine them are scattered
objectives: [D2, D5, C4, X3]
data_required: claims[{id, text, parent, evidence[], defeaters[{type: rebutting|undermining|undercutting, text, status: open|resolved|residual}]}]
html_feasibility: med (nested list with indentation, not a graph; native details for subtrees)
interaction: claim -> evidence -> defeaters; reviewer verdict on each claim; open defeaters listed first
injection_rule: key figures/claims changed (D2), risk sections, safety/legal/performance claims
anti_use: do not draw GSN shapes in HTML (axis A); keep it a nested text outline
evidence: secondary (search summaries of Assurance 2.0: defeaters, evidence must discriminate claim from negation); full papers not read

### P27 · Evidence certainty badge (High / Moderate / Low / Very low) with stated reasons
origin: GRADE / Cochrane summary-of-findings - https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-14
problem: all claims look equally solid
objectives: [D2, G5, X3]
data_required: claim.certainty enum, reasons[] (risk of bias, inconsistency, imprecision, indirectness, publication bias analogues: source age, single source, unverified)
html_feasibility: low
interaction: badge on claim; hover/tap shows reasons; ratings are per claim, not per document
injection_rule: any claim with a figure; derive certainty from provenance rules (primary vs secondary, date, corroboration count)
anti_use: ratings without recorded reasons (Cochrane requires justification)
evidence: secondary (symbol notation not verified; per-outcome rating and mandatory justification confirmed via search summary)

### P28 · Provenance strip (source, date, rank, reference) per claim
origin: Wikidata statement ranks (preferred / normal / deprecated) with references - https://www.wikidata.org/wiki/Help:Ranking
problem: reviewer cannot tell which values are current, sourced, or superseded
objectives: [G5, D2, D3]
data_required: claim{source_ref, retrieved_at, source_date, rank in {preferred, normal, deprecated}, rank_reason}
html_feasibility: low
interaction: small line under claim: "source - date - retrieved" ; deprecated values shown struck-through with reason, preferred marked
injection_rule: every figure, quote, or external fact; stale = retrieved_at older than a threshold set by the generator
anti_use: do not display on every sentence; only on claims
evidence: primary (ranks and "preferred/deprecated" semantics; reason qualifiers; deprecation is for erroneous/outdated values)
tips: freshness uses date text plus an icon-free word ("stale"), not colour only

### P29 · Decided / Open / Question ledger (decision status per item)
origin: ADR status field (proposed, accepted, rejected, deprecated, superseded) - https://adr.github.io/madr/ ; DACI template status/outcome - https://www.atlassian.com/team-playbook/plays/daci
problem: reader cannot separate what is settled from what still needs input
objectives: [D3, G4, G1]
data_required: items[{id, text, status in {decided, open, superseded}, decided_by, date, link_to_block}]
html_feasibility: low
interaction: three-column or grouped list; "open" items carry the response control; "decided" collapsed, with "reopen" link
injection_rule: doc review and decision sheets; open first
anti_use: pages with no decisions
evidence: primary (status vocabularies; DACI outcome added after decision)

### P30 · Options comparison table with decision factors and pros/cons
origin: MADR Considered Options / Pros and Cons; DACI options table - https://adr.github.io/madr/ ; https://www.atlassian.com/team-playbook/plays/daci
problem: options compared in prose; criteria implicit
objectives: [X1, X3]
data_required: criteria[{id, label}], options[{id, summary, per_criterion{value, note}, good[], bad[], cost, effort}]
html_feasibility: low-med (table; phone: one card per option with criteria rows)
interaction: reviewer picks an option (radio) or "none of these"; may flag a criterion as non-negotiable
injection_rule: >=2 options; include the do-nothing option always
anti_use: single recommended path without alternatives; criteria not tied to the objective
evidence: primary (section names; decision drivers listed before options; do not hide the outcome)
tips: put the recommended option first but label the recommendation separately (P31); show the difference between options, not full parity

### P31 · Recommendation card with likelihood word + numeric range and separate confidence
origin: Kent "Words of Estimative Probability" (CIA, 1964) - https://www.cia.gov/resources/csi/studies-in-intelligence/archives/vol-8-no-4/words-of-estimative-probability ; ICD 203 (likelihood and confidence kept separate) - https://www.dni.gov/files/documents/ICD/ICD-203.pdf
problem: "likely"/"probably" read as anywhere from 20% to 80%; confidence conflated with probability
objectives: [X3, D5, G6]
data_required: recommendation{option_id, likelihood_pct_range, confidence in {low, moderate, high}, basis[], assumptions[], what_would_change_my_mind[]}
html_feasibility: low
interaction: reviewer agrees / disagrees with recommendation, challenges an assumption (each assumption has a verdict)
injection_rule: every decision sheet; any block where the agent expresses a probability judgement
anti_use: false precision (no 73.4%); use ranges or bands; do not show confidence without its basis
evidence: secondary (PDFs unreadable by the fetch tool; search results confirm 1951 "serious possibility" read as 20-80%, and the separation of likelihood vs confidence in ICD 203; confidence defined by source quality - not directly verified)

### P32 · Door-type badge (one-way / two-way) that sets process weight
origin: Bezos 2015 shareholder letter, Type 1 / Type 2 - https://www.sec.gov/Archives/edgar/data/1018724/000119312516530910/d168744dex991.htm
problem: reviewer spends equal effort on trivial reversible and irreversible choices
objectives: [X2, D5]
data_required: decision.reversibility in {one_way, two_way}, cost_to_reverse (time/money), blast_radius
html_feasibility: low
interaction: badge at top of the decision; one-way unfolds extra gates (premortem P33, confirm checkbox P13); two-way gets "decide fast, here is the default"
injection_rule: classify by content signals (delete, publish, contract, migration = one-way; config, copy, draft = two-way)
anti_use: do not apply the "70% of information" rule to one-way doors (that rule is from the 2016 letter and concerns two-way; sources differ)
evidence: primary for the one-way/two-way definition (quoted: "consequential and irreversible or nearly irreversible"; Type 2 "can and should be made quickly"); the 70% line not found in the letter fetched -> secondary

### P33 · Pre-mortem block ("assume it failed; why")
origin: Gary Klein, "Performing a Project Premortem", HBR Sept 2007
problem: confirmation bias on the recommended option
objectives: [X2, D5]
data_required: failure_stories[{cause, likelihood_band, early_signal, mitigation, owner}] (agent-authored), prompt for reviewer to add one
html_feasibility: low
interaction: reviewer reads 3-5 failure causes, ranks them or adds one; verdict per cause: accept risk / mitigate / blocker
injection_rule: decisions that are one-way or costly, or recommendation confidence <= moderate
anti_use: reversible low-cost decisions (noise)
evidence: secondary (HBR article not retrievable; method described via several summaries; 30% prospective-hindsight claim is Klein's citation of a 1989 study)

### P34 · Default-if-no-answer and decision deadline
origin: DACI (due date, single Approver, outcome recorded) - https://www.atlassian.com/team-playbook/plays/daci ; type 2 speed principle (P32)
problem: decision stalls; agent blocked waiting
objectives: [X2, G1, G4]
data_required: deadline, default_option, default_consequence, who_is_approver
html_feasibility: low
interaction: header line "If no answer by <date>, the agent will do <default> (reversible: yes/no)"
injection_rule: any decision where agent can proceed on a default and the choice is two-way
anti_use: one-way decisions: no silent default; state "blocked until answered"
evidence: primary for due date/Approver; "default if no answer" convention is my synthesis -> unverified as a published pattern

### P35 · Decision journal record (prediction + confidence + review date)
origin: decision journaling (Annie Duke, Thinking in Bets, secondary sources) ; MADR Confirmation section
problem: no way to check the call later; outcome bias
objectives: [X2, X3]
data_required: decision, expected_outcome, confidence_pct, what_would_change_my_mind, review_date, how_to_confirm
html_feasibility: low (export fields into the JSON)
interaction: reviewer fills one-line expectation and review date on one-way decisions
injection_rule: one-way decisions only; optional otherwise
anti_use: routine decisions
evidence: secondary (exact Duke template fields not confirmed; MADR Confirmation = how compliance will be checked, primary)

## 8. C6 grammars R
### R01 · Layered strip diagram with violation arrows
short_description: Components drawn as stacked bands in layer order; allowed edges are quiet, forbidden edges are red arrows going the wrong way.
shows_checks: [A01, A02, A03, A04]
data_required: component list with layer index, edge list with new/old and allowed/forbidden flags
html_feasibility: {type: inline-svg, effort: med}
scan_time: 3-5 s (count the red arrows)
injection_rule: always when rules file declares layers (core); with 0 violations show a single "0 violations / N edges checked" line instead of the diagram
anti_use: more than ~12 components (use R02); cyclic layouts with no natural order
origin: Lattix/Understand layering view concept; Deptrac layer table https://github.com/qossmic/deptrac/blob/2.0.x/docs/formatters.md
evidence: secondary (concept; exact visual is our adaptation)

### R02 · Dependency structure matrix (DSM) with layer blocks
short_description: Square grid, rows depend on columns, sorted by layer; filled cells on the wrong side of the diagonal are violations.
shows_checks: [A01, A02, A15, A16]
data_required: component x component counts, layer order, per-cell new flag
html_feasibility: {type: table, effort: low}
scan_time: 5-10 s once learned (needs a legend); good beyond 12 components where graphs become unreadable
injection_rule: signal: component count > 12 or any cycle present (cycles show as symmetric cell pairs)
anti_use: first-time reader without legend; < 6 components (a list is faster)
origin: Sangal et al. OOPSLA 2005 http://groups.csail.mit.edu/sdg/pubs/2005/oopsla05-dsm.pdf ; Understand dependency matrix https://docs.scitools.com/help/dependencies/dependency-matrix.html ; NDepend blog (matrix beats graph on complex code) https://blog.ndepend.com/identify-net-code-structure-patterns-with-no-effort
evidence: primary

### R03 · Edge delta list (new / removed dependencies)
short_description: Two short columns: component links added by this change and links removed, each tagged allowed, forbidden or uncovered.
shows_checks: [A01, A02, A19]
data_required: base vs HEAD edge sets with rule verdict
html_feasibility: {type: table, effort: low}
scan_time: 2-3 s
injection_rule: core, always shown (empty = "no dependency change", itself useful information)
anti_use: none; cheapest grammar
origin: Codecov-style diff views of "what changed"; dependency-cruiser err reporter (violation list) https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md
evidence: secondary

### R04 · Hexagon / ports-and-adapters concentric map
short_description: Core in the centre, ports as a ring, adapters outside; touched files placed as dots, IO-importing dots in the core are red.
shows_checks: [A03, A07, A08, A09]
data_required: file -> role (core/port/adapter/external), per-file IO categories
html_feasibility: {type: inline-svg, effort: med}
scan_time: 3 s (any red dot inside the inner ring)
injection_rule: signal: repo declares roles core/ports/adapters in rules file, and diff touches core
anti_use: flat script repos with no core concept (Python scripts); same data as R05 fits better
origin: Cockburn https://alistaircockburn.com/Articles/Hexagonal-Architecture ; Martin concentric circles https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
evidence: secondary

### R05 · Purity badge row per touched file
short_description: One chip per changed file: PURE, IO:fs, IO:net, IO:clock, IO:llm..., with a red mark when a pure-declared file carries an IO chip.
shows_checks: [A07, A08, A09, A10]
data_required: file, declared role, IO categories found, taint-through flag
html_feasibility: {type: css, effort: low}
scan_time: 2 s
injection_rule: core when any touched file sits in a component marked pure; otherwise signal: diff adds a new IO category to any file (A19-style)
anti_use: do not use color alone (V33 palette + glyph); never claim "pure" - say "no IO detected" (heuristic)
origin: Bernhardt FCIS https://www.destroyallsoftware.com/talks/boundaries ; purity analysers https://pypi.org/project/mypy-pure/
evidence: secondary

### R06 · Changed-lines coverage strip (patch coverage bar)
short_description: A bar per changed file split into covered and uncovered changed lines, plus one total percentage.
shows_checks: [A11, A13]
data_required: per file: added lines, covered added lines, uncovered line numbers
html_feasibility: {type: css, effort: low}
scan_time: 2 s; extends the existing per-file +/- bar (same row, second bar)
injection_rule: core when a coverage file exists; else grey card with the A13 test-counterpart column
anti_use: shown without the absolute count (100 % of 2 lines misleads); no coverage file -> do not show 0 %
origin: diff-cover console/HTML report https://pypi.org/project/diff-cover/ ; Codecov patch status https://docs.codecov.com/docs/commit-status
evidence: primary

### R07 · Per-line coverage gutter in the diff hunk
short_description: In the folded hunk view, each added line carries a green or red gutter mark (ran / never ran in tests).
shows_checks: [A11]
data_required: hunk lines with hit counts
html_feasibility: {type: css, effort: low}
scan_time: 5 s per file, on demand (unfold hunk)
injection_rule: signal: file has uncovered changed lines (unfolded only for those)
anti_use: whole-file view of covered code (noise); non-executable lines must be neutral not green
origin: diff-cover --show-uncovered / HTML with show-covered https://pypi.org/project/diff-cover/ ; Codecov file view
evidence: primary

### R08 · Component coverage bars with delta tick
short_description: One horizontal bar per component showing coverage, with a tick at the value before the change and an arrow if it moved.
shows_checks: [A12, A10]
data_required: per component: coverage now, coverage base (optional), touched flag
html_feasibility: {type: css, effort: low}
scan_time: 3 s
injection_rule: signal: coverage file with base baseline exists; touched components sorted first; fallback shows absolute bars only
anti_use: components with < ~20 executable lines (ratio is noise: show "n lines")
origin: Codecov components docs https://docs.codecov.com/docs/components
evidence: primary

### R09 · Coverage sunburst / treemap of the repo
short_description: Repo as nested folder rings or rectangles sized by lines and coloured red-to-green by coverage, touched files outlined.
shows_checks: [A12, A11]
data_required: file tree with executable lines and coverage ratio
html_feasibility: {type: inline-svg, effort: high (sunburst arcs) / med (squarified treemap)}
scan_time: 5-8 s; good for exploring, poor for verdict
injection_rule: reserve (on demand); not part of the review default
anti_use: small repos (< 30 files); red/green only without glyph/texture (colour-blind)
origin: Codecov sunburst https://docs.codecov.com/docs/graphs ; coverage-plot treemap https://coverage-plot.readthedocs.io/en/latest/index.html
evidence: primary (sunburst: slice size = tracked lines, colour green->red)

### R10 · Cycle highlight on the component map
short_description: The existing component map with cycle members ringed and the loop path shown as a bold chain.
shows_checks: [A15]
data_required: SCC membership, new-or-existing flag, loop path
html_feasibility: {type: inline-svg, effort: low (reuses C4 map)}
scan_time: 2 s
injection_rule: signal: SCC size > 1 appears or grows at file or component level
anti_use: type-only cycles (show muted); do not draw when no cycle (A15 = 0 -> one line)
origin: NDepend ND1400/ND1401 cycle rules https://blog.ndepend.com/identify-net-code-structure-patterns-with-no-effort ; DSM symmetric cells (R02)
evidence: secondary

### R11 · Main-sequence scatter (abstractness vs instability)
short_description: Dots for each component on an A-vs-I square with the diagonal ideal line; distance from the line is the problem score.
shows_checks: [A16]
data_required: per component A, I, touched flag, previous position (arrow)
html_feasibility: {type: inline-svg, effort: med}
scan_time: 5 s (needs learning); movement arrows make it a delta view
injection_rule: reserve; only when >= 8 components and A is computable (typed languages with interfaces)
anti_use: small plugin/scripts repos (A meaningless; dots cluster at A=0); as verdict without human reading
origin: Martin metrics https://en.wikipedia.org/wiki/Software_package_metrics ; A vs I graphs https://depfind.sourceforge.io/AvsI.html
evidence: primary for definition, our judgement for anti-use

### R12 · Instability / coupling mini-table with before-after
short_description: Rows for touched components with fan-in, fan-out, instability before and after, and an arrow when the stable-dependencies rule breaks.
shows_checks: [A16, A17]
data_required: per touched component Ca, Ce, I at base and HEAD
html_feasibility: {type: table, effort: low}
scan_time: 3 s
injection_rule: signal: a touched component's Ca+Ce changed by >= 2 or I moved > 0.2
anti_use: all components shown (noise)
origin: dependency-cruiser metrics reporter https://github.com/sverweij/dependency-cruiser/blob/main/doc/options-reference.md
evidence: primary

### R13 · Change-coupling pair list ("you touched A, not B")
short_description: Lists files that usually change together with a touched file but were left out of this change.
shows_checks: [A18]
data_required: co-change pairs above threshold, current diff file set
html_feasibility: {type: table, effort: low}
scan_time: 3 s
injection_rule: signal: at least one pair with coupling >= threshold and one side untouched; absent otherwise
anti_use: bulk/merge commits not filtered; very young repos (< ~30 commits)
origin: CodeScene change coupling https://codescene.com/blog/change-coupling-visualize-the-cost-of-change
evidence: secondary

### R14 · Hotspot bubble (churn x size, touched ringed)
short_description: Files as circles sized by lines and shaded by recent change frequency; the touched ones carry a ring.
shows_checks: [A14, A17, A18]
data_required: per file LOC, commits in window, touched flag
html_feasibility: {type: inline-svg, effort: med (circle packing) / low (sorted bars)}
scan_time: 5 s
injection_rule: reserve; promote to signal when a touched file ranks in top 10 % churn and has uncovered changed lines
anti_use: relevance is not defect: must be paired with a health or coverage measure (CodeScene guidance)
origin: CodeScene hotspots https://codescene.ta.philips.com/docs/guides/technical/hotspots.html
evidence: secondary

### R15 · Rules-verdict summary line (fitness function scoreboard)
short_description: One row per declared rule (layer order, purity, cycles, size limit, coverage floor) with pass, fail or not-evaluated, and counts.
shows_checks: [A01, A07, A11, A15, A17, A19]
data_required: rule id, status, count, link to the detail block
html_feasibility: {type: table, effort: low}
scan_time: 1-2 s
injection_rule: core entry point of C6 (always); "not-evaluated" is explicit when input missing (no coverage, no rules file)
anti_use: collapsing to a single score (hides which rule failed)
origin: fitness-function set as automated checks run in pipeline https://www.thoughtworks.com/en-us/insights/articles/fitness-function-driven-development ; Deptrac summary table (violations, uncovered, allowed, errors) https://github.com/qossmic/deptrac/blob/2.0.x/docs/formatters.md
evidence: primary / secondary

## 9. C6 checks A
### A01 · Layer direction violations
short_description: Lists imports that go against the allowed layer order (e.g. domain importing adapters).
sub_objective: patterns
how_computed: B1 edges collapsed by B2; compare each component pair to allowed_to matrix from rules file; report forbidden edges, flag those NEW in the diff (edge present at HEAD, absent at base) vs pre-existing
works_without_toolchain: yes (own ~60-line script); the same semantics exist natively in dependency-cruiser (needs node + npm install), import-linter (pip, Python only), Deptrac (PHP), eslint-plugin-boundaries (eslint)
false_positive_risk: low for static imports; misses dynamic/computed imports; type-only imports can be legit (option to ignore)
origin: Dependency rule - Martin Clean Architecture https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html ; rule engines https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md , https://import-linter.readthedocs.io/en/stable/contract_types/ , https://github.com/qossmic/deptrac/blob/2.0.x/docs/concepts.md
evidence: primary (rule semantics: dependency-cruiser forbidden/allowed with path groups $1; Deptrac ruleset = whitelist, default all forbidden; Martin quote "source code dependencies can only point inwards")

### A02 · Allow-list vs deny-list mode with uncovered edges
short_description: Shows edges that the rules file says nothing about (neither allowed nor forbidden), so silent drift is visible.
sub_objective: patterns
how_computed: in whitelist mode every component pair absent from allowed_to is "uncovered"; count and list; new uncovered edges in diff = prompt to extend the rules file
works_without_toolchain: yes (same script as A01)
false_positive_risk: medium early on (rules file incomplete); decays as the file matures
origin: Deptrac "uncovered dependencies" (--report-uncovered, --fail-on-uncovered) ; dependency-cruiser `allowed` + not-in-allowed https://github.com/qossmic/deptrac/blob/2.0.x/docs/concepts.md
evidence: primary (Deptrac via search summary of docs; dep-cruiser rules reference fetched)

### A03 · Port/adapter placement (hexagon boundary)
short_description: Checks that anything touching the outside world sits in adapters and that the core only sees interfaces (ports).
sub_objective: patterns
how_computed: derived from A01 with roles: core may import only core+ports; adapters may import core+ports+external; core must not import any io_modules (A07). Optional: ports = files matching ports glob, expected to contain only type/interface/abstract declarations (regex `export (interface|type)` ; Python `Protocol|ABC`)
works_without_toolchain: yes for import direction; partial for "ports contain only interfaces" (regex heuristic)
false_positive_risk: medium; hexagonal article does not prescribe internal code layout, so mapping folders to roles is a repo convention
origin: Cockburn https://alistaircockburn.com/Articles/Hexagonal-Architecture ; Bernhardt FCIS is described as a subset of hexagonal (forum summary)
evidence: secondary (Cockburn page fetched but returned no body text; claim "no internal code layout prescribed" from search summary of commentators)

### A04 · Sibling / slice independence
short_description: Flags one feature or component importing another one that is meant to be independent.
sub_objective: patterns
how_computed: rules of kind "independent: [c1,c2,...]" or pattern `from ^src/([^/]+)/ to ^src/(?!\1)`; check edges both directions including transitive (BFS on component graph)
works_without_toolchain: yes
false_positive_risk: low-medium (shared kernel components need an allow list)
origin: import-linter independence contract ; dependency-cruiser group matching $1 https://import-linter.readthedocs.io/en/stable/contract_types/
evidence: primary

### A05 · Entry-point reachability (orphans and dead new files)
short_description: Flags new files that no entry point reaches, and files that became unreachable after the change.
sub_objective: patterns
how_computed: BFS from declared entries (stint: hooks/register.ts; Python: script mains) over B1; list files in diff not reached; list files that were reached at base and not at HEAD
works_without_toolchain: yes
false_positive_risk: medium (dynamic loading, files referenced by manifests like hooks.json or plugin.json are invisible to imports; list them as extra entries in rules file)
origin: dependency-cruiser `reachable` and `orphan` rule conditions https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md
evidence: primary

### A06 · Component map drift vs declared architecture model
short_description: Compares the components declared in the architecture model with the real folders and edges, and lists what is missing on either side.
sub_objective: patterns
how_computed: parse components + relationships from the rules file (or a Structurizr DSL text via regex on `->`); diff against B1 component graph: edge in code but not in model = undeclared; edge in model never seen = stale. Both ends are machine-readable, no LLM
works_without_toolchain: yes if the model is the simple YAML of section 4; no/partial if the source of truth is Structurizr DSL (validation needs the Structurizr CLI, Java)
false_positive_risk: medium (model granularity vs code granularity)
origin: Structurizr validate https://docs.structurizr.com/validate ; fitness-function idea https://www.thoughtworks.com/en-us/insights/articles/fitness-function-driven-development
evidence: secondary (Structurizr validate checks workspace rules, not code-vs-model conformance; the drift check is our composition, not an existing feature - unverified as prior art) # ---------- purity ----------

### A07 · IO import in pure code
short_description: Flags core/domain files that import modules reaching DB, network, filesystem, process, clock, or an LLM SDK.
sub_objective: purity
how_computed: io_modules list in rules file, grouped by category (fs, net, proc, clock, random, env, db, llm). From B1 take external specifiers per file (TS: `node:fs`, `fs`, `child_process`, `node:http`, `fetch` global not an import; Python: `os`, `subprocess`, `socket`, `urllib`, `http`, `sqlite3`, `pathlib`, `time`, `datetime`, `random`, `anthropic`...). For each file in a component marked pure, list matching categories
works_without_toolchain: yes
false_positive_risk: medium: `pathlib`/`os.path` used only for string manipulation; `datetime` used only as a type; mitigate by splitting list into "always IO" vs "IO if called" and routing the latter to A08
origin: deny/allow lists of IO functions in purity analysers: mypy-pure https://pypi.org/project/mypy-pure/ ; pure_fun https://hex.pm/packages/pure_fun/0.1.0/files ; FCIS https://www.destroyallsoftware.com/talks/boundaries
evidence: secondary (tools confirm the deny-list technique; no canonical module list found - we define it)

### A08 · IO call-site and global-effect scan
short_description: Greps pure files for calls that do IO without an import (fetch, Date.now, Math.random, process.env, console, print, open(), input()).
sub_objective: purity
how_computed: regex/token scan of added/changed lines (git diff -U0) and of pure-component files; TS patterns `\bfetch\(|Date\.now\(|new Date\(\)|Math\.random\(|process\.(env|cwd|exit)|console\.|Bun\.|Deno\.`; Python `\bopen\(|\bprint\(|\binput\(|time\.time\(|datetime\.now\(|os\.environ`. Python variant stronger via stdlib ast.Call/Attribute walk (ignores strings and comments)
works_without_toolchain: yes (regex) / yes (Python ast)
false_positive_risk: medium regex (comments, strings; strip them first); low with ast for Python; dynamic access (getattr, globalThis[...]) is a known blind spot
origin: mypy-pure limits (misses getattr/eval, mutation of arguments, global state) https://pypi.org/project/mypy-pure/ ; debtmap purity detector (io, mutable params, unsafe, external state flags) https://docs.rs/crate/debtmap/0.17.0/source/src/analyzers/purity_detector/detector.rs
evidence: secondary

### A09 · Transitive impurity via callee files
short_description: A pure file is flagged if it imports a file that itself does IO, even when it imports no IO module directly.
sub_objective: purity
how_computed: A07/A08 flags on each file, then propagate along B1 (reverse reachability): file is tainted if any file it imports (transitively) is tainted and not an allowed port. Equivalent to dependency-cruiser `reachable` rule with `to.path` = IO files
works_without_toolchain: yes
false_positive_risk: medium (taint over-propagates through barrel/index files; stop propagation at ports)
origin: pure_fun propagates impurity through callees and has an "unknown" class for unresolved calls https://hex.pm/packages/pure_fun/0.1.0/files ; dep-cruiser reachable
evidence: secondary

### A10 · Pure-code test ratio (core covered, shell ignored)
short_description: Shows coverage of the pure core separately from coverage of the IO shell, since the core is where tests are cheap and expected.
sub_objective: purity
how_computed: join A07 pure/impure classification with A12 per-file coverage; report core line coverage and shell line coverage side by side; new impure code inside the core = highlighted
works_without_toolchain: partial (needs coverage file, B4)
false_positive_risk: low; classification inherits A07 errors
origin: Bernhardt Boundaries / FCIS (core = the part needing thorough unit tests) https://www.destroyallsoftware.com/talks/boundaries
evidence: secondary (talk page fetched via search summary only; the join is our composition) # ---------- coverage ----------

### A11 · Diff (patch) coverage
short_description: Percentage of changed lines that tests execute, with the list of changed lines that never ran.
sub_objective: coverage
how_computed: intersect `git diff -U0` added line numbers with line hits from lcov/Cobertura; denominator = added lines that the coverage file knows as executable (non-executable lines are not counted). diff-cover does exactly this; own implementation = lcov parser (DA:<line>,<hits>) + diff hunk parser, ~80 lines
works_without_toolchain: partial (needs an lcov/XML file produced by the repo's test command; Node >= 22 emits lcov natively via `node --test --experimental-test-coverage --test-reporter=lcov --test-reporter-destination=lcov.info` ; Python needs coverage.py (pip) or a sys.monitoring/trace hook; diff-cover itself needs pip)
false_positive_risk: medium: multi-line statements missed (diff-cover has --expand-coverage-report), path mismatch between coverage file and git diff gives "no lines with coverage info"; TS run through a loader/strip-types may report transformed line numbers (unverified)
origin: diff-cover https://pypi.org/project/diff-cover/ ; Codecov patch status https://docs.codecov.com/docs/commit-status ; Node coverage https://nodejs.org/en/learn/test-runner/collecting-code-coverage
evidence: primary (diff-cover inputs: Cobertura, Clover, JaCoCo, LCov; Codecov patch = only changed lines)

### A12 · Per-component coverage with delta
short_description: Coverage of each component, shown against its value before the change, so a drop in one component is not hidden by the project average.
sub_objective: coverage
how_computed: sum lcov LF/LH (lines found/hit) per file, aggregate by B2 component; base value needs a coverage file at base (CI artifact or stored) - else show absolute value and diff coverage only
works_without_toolchain: partial (coverage file; delta needs a stored baseline)
false_positive_risk: low; files never loaded by tests are absent from lcov unless an include pattern forces them (Node --test-coverage-include) -> treat "component with source files but no lcov rows" as 0 %, not as missing
origin: Codecov components (virtual path filters with own project/patch status) https://docs.codecov.com/docs/components
evidence: primary (Codecov docs via search); the "absent files count as 0" rule is our assumption (unverified)

### A13 · Touched-but-untested files
short_description: Lists changed source files that have no matching test file and no coverage rows.
sub_objective: coverage
how_computed: pure path logic, no coverage file needed: for each changed non-test file look for a test counterpart by convention (x.ts -> x.test.ts / test/x.test.ts; foo.py -> test_foo.py / tests/); also show whether the diff touched any test file at all
works_without_toolchain: yes
false_positive_risk: medium-high (naming conventions vary; stint tests run via CLI plugin test, so counterpart files may not exist at all - then the check reports "no test convention declared")
origin: heuristic; pairs with Codecov patch status as fallback when no coverage file exists https://docs.codecov.com/docs/commit-status
evidence: unverified (no primary source for the heuristic; common practice)

### A14 · Risk-weighted coverage gap
short_description: Ranks uncovered changed lines by how risky their file is (churn, size, dependents), so the reviewer reads the dangerous gaps first.
sub_objective: coverage
how_computed: product/ordinal of A11 uncovered count x file churn (git log --numstat last N commits) x fan-in from B1; ordinal bands, no multiplication shown to the user (PLAN decision D5 caveat)
works_without_toolchain: partial (coverage file)
false_positive_risk: medium; weights arbitrary
origin: CodeScene hotspots = churn x code health ; hotspot needs health measure alongside https://codescene.ta.philips.com/docs/guides/technical/hotspots.html
evidence: secondary (CodeScene docs are a Philips-hosted copy) # ---------- structure ----------

### A15 · Import cycles (new and existing)
short_description: Finds groups of files or components that import each other in a loop, and marks those created by this change.
sub_objective: structure
how_computed: Tarjan SCC over B1 at file and component level; SCC size > 1 = cycle; compare with SCC set at base to mark new/grown ones
works_without_toolchain: yes (Tarjan ~30 lines); madge needs npm + tsconfig for paths; jscycles uses ast-grep (binary); Python: grimp/import-linter need pip
false_positive_risk: low for value imports; type-only cycles are benign in TS (separate flag)
origin: Lattix DSM acyclicity criterion http://groups.csail.mit.edu/sdg/pubs/2005/oopsla05-dsm.pdf ; NDepend ND1400/ND1401 ; jscycles https://github.com/EnderHub/jscycles
evidence: primary (OOPSLA'05 via search summary), secondary (others)

### A16 · Coupling and instability change
short_description: Fan-in, fan-out and instability (outgoing share of all links) per touched component, before vs after.
sub_objective: structure
how_computed: from component graph: Ca (incoming), Ce (outgoing), I = Ce/(Ce+Ca); optional A = abstract/total declarations (interfaces+types vs classes+functions, regex) and D = |A+I-1|; compute at base and HEAD from git show for the touched components only. Stable-dependencies rule: a component should depend on components at least as stable (dependency-cruiser `moreUnstable`)
works_without_toolchain: yes (I); partial for A (regex heuristic on abstractness; in TS/Python-stdlib scripts A is often meaningless, show I only)
false_positive_risk: medium-high on small repos (few components -> noisy ratios); thresholds vary by author (one source: preferred I in 0-0.3 or 0.7-1)
origin: Martin package metrics https://en.wikipedia.org/wiki/Software_package_metrics ; dependency-cruiser metrics reporter + moreUnstable https://github.com/sverweij/dependency-cruiser/blob/main/doc/options-reference.md
evidence: primary for formulas (Wikipedia + several), secondary for thresholds

### A17 · Size and complexity growth of touched files
short_description: Lines, function count and nesting depth of touched files before vs after, flagging files that cross a size limit.
sub_objective: structure
how_computed: LOC via git show base:file vs HEAD; TS functions via regex `function|=>` counts (crude); Python via ast: FunctionDef count, max nesting, McCabe-style branch count (ast.If/For/While/Try/BoolOp). Limits in rules file
works_without_toolchain: yes (Python ast exact; TS heuristic only)
false_positive_risk: medium for TS regex (arrow functions, strings); low for Python ast
origin: fitness-function catalogue (code quality gates) https://www.thoughtworks.com/en-us/insights/articles/fitness-function-driven-development ; CodeScene code health patterns (complexity makes code harder to change)
evidence: secondary

### A18 · Change coupling (files that co-change)
short_description: Shows files that nearly always change together in git history, and whether this change touched one half of a pair but not the other.
sub_objective: structure
how_computed: git log --name-only over last N commits (read-only); count co-occurrence per file pair; coupling = shared commits / max(commits_a, commits_b); report pairs above threshold where only one side is in this diff. Not computable from code alone (CodeScene statement). Same idea feeds the existing "sync facts" grid
works_without_toolchain: yes (git + script)
false_positive_risk: medium-high: bulk commits (renames, formatting, multi-file features) inflate pairs; filter commits with > K files
origin: CodeScene change coupling https://codescene.com/blog/change-coupling-visualize-the-cost-of-change ; glossary https://codescene.ta.philips.com/docs/terminology/codescene-terminology.html
evidence: secondary

### A19 · Dependency set change (new external modules and new edges)
short_description: Lists external modules or components newly imported by this change, whatever the rules say.
sub_objective: structure
how_computed: set difference of B1 edges (and external specifiers) between base and HEAD restricted to touched files; no rules needed, so it works on day 1 before any rules file exists
works_without_toolchain: yes
false_positive_risk: low (noise only from renames/moves: match by content hash or git -M)
origin: fitness-function "triggered, atomic" class: Ford/Parsons/Kua taxonomy https://lethain.com/building-evolutionary-architectures/ (atomic vs holistic, triggered vs continual)
evidence: secondary (taxonomy via summaries; the check itself is our design)

