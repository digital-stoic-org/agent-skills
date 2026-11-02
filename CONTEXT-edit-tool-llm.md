# Session Context: edit-tool prompt-audit + context: fix

saved: 2026-10-04T18:57:09Z
stream: edit-tool
status: building
predecessor: none
focus: edit-tool aligné sur l'audit officiel (/claude-api prompt-audit, comme edit-claude) + modèle context: corrigé contre la doc officielle ; étapes 1-7 faites et vérifiées disque, étape 8 en attente de Mat.
goal: edit-tool enseigne ce que la doc Claude Code dit, et appelle prompt-audit en Optimize + création non triviale.

---

## Project

ref: n/a
type: skill-authoring (agent-skills repo, plugins toolsmith + dstoic ; /repos/agent-skills = symlink /home/mat/dev/agent-skills)

## Next

- étape 8 (gated, go Mat) : A = retirer `context:` des 97 SKILL.md (reco, 0 changement de comportement) · B = A + fork au cas par cas (biz×4, convert/transcribe, dump-output ; pas gtd) · C = ne rien toucher, noter la dette
- decision-pending: Q1 prouvé — context: main/subagent/inherit ignorés = inline (CC 2.1.287) ; étape 8 reco A = retirer le champ des 97 (0 changement de comportement) ; Q2 non testable en -p, TUI requis seulement si fork gtd
- Q2 : test TUI (skill context:fork qui appelle AskUserQuestion) — seulement si un skill gtd doit passer en fork
- Mat : relire, commit lui-même (jamais par moi) ; redémarrer CC (cache plugin encore 0.53.0)
- non fait : rendu Mermaid SKILL.md · ancres TOC skill-guide :11/:13 non vues dans un lecteur · "fork" nu restant pick-workflow/reference.md:94 · `Task(...)` en deny inféré de l'alias (non confirmé) · marketplace metadata 0.47.1 = choix de l'agent bump-plugins, à valider

## Session

progression:
  - relais edit-tool reçu → [READY] ; Mat recadre le but (prompt-audit officiel, pas la dérive Q1/étape 8) ; go « tout en sub-agents »
  - 6 sub-agents parallèles : et-frameworks, et-skillguide (Opus), et-skillmd, et-agentguide, pw-reference, q1-probe (Sonnet) ; 1 writer/fichier
  - relecture croisée final-review (Opus, lecture seule) : 3 BLOCKERs + ~10 MINOR → corrigés par les mêmes writers, vérifiés disque (grep vestiges = 0)
  - bump-plugins via /edit-plugin : toolsmith 0.37.5→0.38.0, dstoic 0.53.0→0.53.1, marketplace 0.47.0→0.47.1 ; aucun git
decisions:
  - [10-02] [P1] go Mat « tout en sub-agents » → étapes 1-5,7 + Q1 lancés en parallèle (1 writer/fichier) ; bumps 6/7 après vérif disque ; étape 8 = reco seulement, édition des 97 skills gated
  - [10-02] [P1] étapes 1-7 faites et vérifiées disque ; toolsmith 0.38.0, dstoic 0.53.1, marketplace 0.47.1 (choix agent) ; open: étape 8 A/B/C, Q2 TUI, rendu Mermaid non fait
thinking:
unexpected:
  - [10-02] but recadré par Mat = intégrer prompt-audit officiel dans edit-tool comme edit-claude (étape 4+6) ; Q1/étape 8 = hors périmètre, ouvert : A (4+6) vs B (+1-3,5)

## Learnings

- [10-02] « fork » = 2 mécanismes opposés — skill context:fork isolé vs Agent-tool fork hérite de l'historique ; edit-tool doit les distinguer ; à vérifier en relecture finale
- [10-02] paquet relais faux sur env — CLAUDE_CODE_FORK_SUBAGENT existe (fork mode), FORK_MODE inexistant ; agent: défaut general-purpose documenté ; fork skill background=true → toolset réduit, background:false garde tout
- [10-02] edit-tool/pick-workflow enseignaient aussi nesting OFF et foreground par défaut — tous deux réfutés (depth défaut 3 depuis v2.1.219 ; background = défaut, prompts remontent au main) ; corrigés hors plan initial

## Standing

- [10-02] [constraint] aucun git (commits = Mat) ; bumps seulement via /edit-plugin ; un writer par fichier
- [10-02] [constraint] hands_off : toolsmith/skills/edit-claude/ et tous les autres SKILL.md (étape 8 = go Mat requis)
- [10-02] [assumption] doc officielle relue 2026-10-02 (skills, sub-agents, env-vars) ; les dates écrites dans les fichiers disent « (doc officielle, 2026-09-23) » par consigne

## Hot Files

- [P1] /repos/agent-skills/toolsmith/skills/edit-tool/SKILL.md: pointeurs prompt-audit (~:65/:74), arbre Mermaid 2 modes, 119 lignes
- [P1] /repos/agent-skills/toolsmith/skills/edit-tool/references/frameworks.md: § Context Execution Mode (L24-102), § Fork vs Subagent, ### Prompt-audit pass (~L610)
- [P1] /repos/agent-skills/toolsmith/skills/edit-tool/references/skill-guide.md: table frontmatter (:34-41), Frequency-First + Basis
- [P2] /repos/agent-skills/toolsmith/skills/edit-tool/references/agent-guide.md: Agent(...) syntaxe, nesting :360, fg/bg :389+
- [P2] /repos/agent-skills/dstoic/skills/pick-workflow/reference.md: :58 nesting, :62 context, :171-176 background
- [P2] /repos/agent-skills/.claude-plugin/marketplace.json: bumps toolsmith 0.38.0 / dstoic 0.53.1 / metadata 0.47.1

## Drop

- schéma Mermaid et ancres : non rendus, ne pas re-vérifier sans demande
- rapports des sub-agents : lus via transcripts, pas besoin de relancer

## Dead Ends

- [10-02] convertir les 12 skills `subagent` en fork à l'aveugle : skills gtd interactifs, `background` par défaut + toolset réduit (AskUserQuestion absent) → comportement changé
- [10-02] « edit-claude:147 faux sur la position » : réfuté, seule règle officielle = longs docs (>20k tokens) en haut

## Refs

- docs : code.claude.com/docs/en/skills · /sub-agents · /env-vars
- rapports pré-relais : /home/mat/.claude/projects/-home-mat-dev-praxis-repos-agent-skills/d8b01630-edd5-4fe3-b420-bfef349c93ce/subagents/*.jsonl (scout-edit-claude, scout-edit-tool, synth-edit-tool-reco, verif-edit-tool-claims, crosscheck-context-fork, scan-context-usages)
- modèle d'intégration : /repos/agent-skills/toolsmith/skills/edit-claude/SKILL.md:22,23,27
