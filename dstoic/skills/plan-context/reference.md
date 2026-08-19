# Plan Context — template et conventions

Le gabarit ci-dessous reproduit la structure éprouvée de `plan-permaplus.md` / `plan-biodiversite.md`
(dépôt villa-nara). Il se recopie tel quel : les sections optionnelles se suppriment, les obligatoires non.
La langue du plan est celle de l'utilisateur ; les clés de frontmatter sont fixes.

## Gabarit

````markdown
---
chantier: <slug>
serie_id: <XX>-xx
statut: cadre            # cadre | en-cours | clos
cree: JJ/MM/AAAA
revise: JJ/MM/AAAA
perimetre: [<dossier>, <dossier>]
hors_perimetre: [<dossier>, <dossier>]
lots_ouverts: [XX-01, XX-02]
lots_clos: []
lots_abandonnes: []
---

# Plan — <titre du chantier>

> Artefact de pilotage du chantier <slug>. **Reprenable à froid** : chaque lot porte son critère de
> clôture vérifiable sur disque et son statut. Ne pas le reconstruire ailleurs.
> Précédent du même dépôt : `<plan-precedent.md>` (série `<YY-xx>`, clos le JJ/MM/AAAA).

## État — tableau de bord

| Lot | Titre | Statut | Constaté disque |
|---|---|---|---|
| `XX-01` | <titre> | ⬜ ouvert | <valeur mesurée avant exécution>, attendu <valeur> |

Légende : ⬜ ouvert · 🟡 en cours · ✅ clos (avec constaté) · ❌ abandonné (ID conservé).
**Règle de reprise** : un lot n'est ✅ que si sa commande de clôture a été rejouée et son résultat écrit
dans la colonne `Constaté disque`. Un rapport de sub-agent ne vaut pas constat.
À l'écriture du plan, cette colonne porte déjà la **valeur d'avant** : elle prouve que la commande tourne
et donne le point de comparaison.

## Journal d'exécution

| Date | Lot | Geste | Constaté |
|---|---|---|---|
| JJ/MM/AAAA | — | Cadrage : <ce qui a été fait> | plan écrit, dépôt non modifié |

## Question posée

<La question telle que l'utilisateur l'a posée, sa sous-question, et la cible.>

## <Sections d'analyse — optionnelles>

<Étalon · Inventaire · Gap · tout ce que l'analyse a produit. Prose pleine, tables pour les faits.>

## Plan

<Ordre en une ligne : prérequis bon marché → production lourde → lot bloqué en dernier, isolé.>

### XX-01 — <titre>

- **Geste** : <ce qui est fait, assez précis pour qu'un worker briefé n'ait besoin de rien d'autre>
- **Entrée** : <chemins + sections exactes>
- **Sortie** : <fichier(s) écrit(s) — un seul propriétaire par fichier>
- **Clôture** : `<commande>` = <valeur attendue> · `<commande>` ≥ <valeur>
- **Dépend de** : <IDs | rien>

### Lots abandonnés — ID conservé, jamais recyclé

| ID | Titre du 1er passage | statut | Motif |
|---|---|---|---|

## Conclusions renversées

**<Constat initial>. Renversé le JJ/MM/AAAA par <qui>.**
<Motif, puis les vérifications indépendantes qui le corroborent. L'ID de l'ancien lot est conservé ❌.>

## Hors périmètre — reporté

- <trouvaille hors périmètre, avec sa localisation, datée>

## Mesures

Toutes datées du **JJ/MM/AAAA**, exécutées depuis `<chemin absolu>`.

| Mesure | Valeur | Commande |
|---|---|---|
| <quoi> | <valeur> | `<commande rejouable>` |

---

## Exécution — découpage et modèles

Décidé le JJ/MM/AAAA via `/pick-workflow` puis `/pick-model`. Session d'orchestration : <modèle> (ctx <n> %).

### Décomposition

| Lot | Forme du travail | Parallélisable ? | Charge de jugement | Poids en tokens | Dépendance croisée ? |
|---|---|---|---|---|---|

### La couture

<Où tombe la couture et pourquoi. Un lot cross-item ne se sharde pas : dire lequel, et le dire en toutes
lettres. Si rien ne se parallélise, l'écrire — « séquence de sub-agents nommés » est une décision, pas un
défaut.>

### Cast

| Lot | Mécanisme | Modèle | Effort | Motif du routage |
|---|---|---|---|---|
| `XX-01` | sub-agent nommé `xx01-<slug>` | <modèle> | <effort> | <motif> |
| `XX-02` | **inline**, orchestrateur | — | — | geste plus petit que son brief |

La vérification ne se délègue pas : dispositions et constats restent sur l'orchestrateur. Un worker rend
des **faits**, jamais un verdict de clôture.

### Contrat imposé à chaque worker

- Objectif, format de sortie, sources autorisées, bornes — écrits dans le brief.
- Chemins **absolus**, `/usr/bin/grep` et `/usr/bin/find` (les commandes nues sont shimées).
- **Aucune commande `git`, jamais.**
- Transformation de masse ⇒ **script Python + invariant de non-perte + assertion de forme**.
- Un worker écrit **un seul fichier**, jamais partagé avec un autre worker.

### Protocole de reprise

1. Lancer le lot, attendre la fin.
2. **Rejouer la commande de clôture** depuis l'orchestrateur.
3. Écrire le résultat dans `Constaté disque` + une ligne au `Journal d'exécution`.
4. Un lot sans constaté rejoué reste ⬜, quoi qu'ait dit le worker.

### Repli linéaire

Si les sub-agents échouent ou ne rendent rien d'exploitable, les <n> lots sont exécutables en linéaire
dans la session d'orchestration, même ordre, mêmes critères de clôture.
````

## Décisions de cadrage

**Nommage.** `plan-<chantier>.md` à la racine du projet courant. Un chantier = un plan = une série d'IDs.
Un second plan dans le même dépôt cite son précédent dans l'en-tête (continuité des séries).

**Clôture vérifiable — ce qui compte et ce qui ne compte pas.**

| ✅ Clôture | ❌ Pseudo-clôture |
|---|---|
| `/usr/bin/grep -c "converted/" README.md` = 0 | « le README est à jour » |
| `comm` des ancres contre `grep "^### "` = vide | « les 43 wikilinks résolvent » |
| 43 lignes de données, 4 cellules `Profondeur` | « la table est complète » |
| un fichier existe à `<chemin>` avec N sections | « le worker dit que c'est fait » |
| la commande **tourne déjà** à l'écriture du plan et rend la valeur d'avant | une commande jamais exécutée, découverte cassée à la reprise |

**Reprise sur un plan existant — merge, jamais réécriture.** Relancer le skill sur un chantier déjà ouvert
lit le fichier d'abord. Les IDs et leurs statuts sont conservés tels quels ; les nouveaux lots continuent la
série après le plus haut ID jamais alloué, abandonnés compris ; le journal ne perd aucune ligne ; `revise:`
et les trois listes du frontmatter sont mises à jour ; un lot devenu caduc part en `### Lots abandonnés`
avec son motif. Écraser un plan détruit la seule trace de ce qui était déjà constaté.

**Validation mécanique avant handoff.** Six contrôles : IDs uniques sur les trois listes · chaque
`Dépend de` résout · aucun cycle · chaque lot présent au frontmatter **et** au tableau de bord · deux lots
ne déclarent jamais la même `Sortie` · chaque lot a ses cinq champs et au moins une commande en `Clôture`.

**Statut vs constat.** Le statut est déclaratif, le constat est mesuré. Le tableau de bord porte les deux
côte à côte précisément pour rendre visible un statut sans constat — c'est le mode d'échec le plus fréquent
à la reprise.

**Journal append-only.** On n'édite jamais une ligne passée. Une valeur renversée s'écrit en nouvelle ligne,
et si elle change une conclusion, elle ouvre une entrée dans `## Conclusions renversées` avec sa date et son
auteur. C'est ce qui rend le plan lisible comme une histoire plutôt que comme un état.

**Lots gelés.** Un lot bloqué (binaire à extraire, décision que l'utilisateur doit rendre, dépendance
externe) reste dans le plan, en dernier, marqué **gelé**, avec la phrase `Ne pas lancer avant <condition>`.
Le sortir du plan le fait oublier ; le laisser ouvert sans marque le fait lancer trop tôt.

**Quand le plan n'a qu'un lot.** Le format tient quand même : frontmatter, un lot, sa clôture, `## Mesures`.
Ce qui coûte cher n'est pas le gabarit, c'est de reconstruire l'analyse. En dessous d'un lot, il n'y a pas
de chantier — faire le geste, pas un plan.
