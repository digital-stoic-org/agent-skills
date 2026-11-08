---
date: 2026-11-03
axis: A (representation vocabularies, diagram/chart grammars)
sources: 21 web searches (snippet-level, no full page fetched); ~45 distinct URLs surfaced; 0 primary PDFs/books read in full
grammars: 36
status: draft; evidence mostly secondary (search snippets). Rule of thumb: origin = primary named, evidence = what snippets showed. Entries marked synthesis = my adaptation, not a source claim.
conventions:
  feasibility: css | inline-svg | table ; effort low|med|high (effort = generator code, not reader)
  scan_time: seconds to get the main message
  global_constraints:
    - status never by color alone: pair color with glyph/shape/label (Okabe-Ito palette, V33)
    - use CSS custom properties for light/dark; fills need explicit text color
    - SVG viewBox + width:100% for phone; wrap/stack columns <600px
    - LLM designates ids/ranks/status; code computes geometry and copies text verbatim
---

# catalog

```yaml
- id: V01
  name: Segmented status bar (stacked proportion bar)
  origin: FT Visual Vocabulary, part-to-whole family. https://gijn.org/resource/document-of-the-day-visual-vocabulary/
  question: What share of items is ok / revise / no / question / unseen?
  objectives: [G3, T2, T3, D3, G1]
  data: list of {status, count}; fixed status order
  html_feasibility: {type: css, effort: low}   # flex children with width % or one inline-svg rect row
  scan_time: 1-2 s
  injection_rule: any page with >=4 blocks or >=5 test cases; put at top as synthesis strip; always include "unseen" segment
  anti_use: <4 items (use plain counts); >6 categories
  evidence: FT lists part-to-whole as one of 9 relationship categories (secondary summary of the poster). Cleveland-McGill (V32) ranks length below position, so label counts in-segment.

- id: V02
  name: Bullet graph (measure vs target vs qualitative bands)
  origin: Stephen Few, Bullet Graph Design Specification (Perceptual Edge, 2008). http://www.perceptualedge.com/articles/misc/Bullet_Graph_Design_Spec.pdf
  question: How far is a value from its target, relative to acceptable bands?
  objectives: [G1, G3, X3, C5]
  data: {label, value, target, bands:[{upto,name}]}
  html_feasibility: {type: css, effort: low}   # 3 nested divs; or svg rects
  scan_time: 2 s
  injection_rule: one scalar with a known budget/target (reviewer minutes vs budget, tests passed vs required, evidence strength vs threshold)
  anti_use: no target or no meaningful bands; categorical data
  evidence: spec exists, designed as replacement for gauges (secondary summaries). Single-hue graded bands recommended per a blog paraphrase (unverified against PDF).

- id: V03
  name: Status tile grid (small multiples of blocks)
  origin: Tufte small multiples (Visual Display of Quantitative Information, 2nd ed., p.168 as quoted). Secondary: https://maxmasnick.nfshost.com/projects/datatips/guidelines/small-multiples
  question: Which blocks/cases are in which state, and where to look first?
  objectives: [G1, G3, G4, D3, T2, G5]
  data: list of {id, short_label<=3 words, status, changed_since_last:bool, severity?}
  html_feasibility: {type: css, effort: low}   # CSS grid, tiles are anchors to blocks
  scan_time: 2 s
  injection_rule: always as the page navigator; order exceptions first (revise/no/question), ok last and dimmed; mark changed tiles with a corner glyph for round 2
  anti_use: >60 items (aggregate to V01 + exceptions list)
  evidence: small multiples = same design repeated indexed by another variable (Tufte quote via secondary). Exception-first ordering is prior research, not this source.

- id: V04
  name: Sparkline / trajectory micro-chart
  origin: Tufte, Beautiful Evidence (2006) (attribution via secondary sources). https://gist.github.com/uhop/bdd5ba8e488ddc4459da89c2775d9530
  question: How did a number evolve (rounds, runs, versions)?
  objectives: [G4, G5, T2, D2]
  data: ordered series of numbers (>=4 points) + optional markers for min/max/current
  html_feasibility: {type: inline-svg, effort: low}   # one polyline, 100x20 viewBox, inline with text
  scan_time: 1 s
  injection_rule: a metric has history across rounds/runs (pass rate per run, open comments per round)
  anti_use: <3 points; categorical data; when exact values matter (add number beside)
  evidence: Tufte definition: small, high-resolution graphic embedded in words/numbers (secondary quote). Secondary only.

- id: V05
  name: Slopegraph (two-point before/after)
  origin: Tufte (Beautiful Evidence per general attribution; UNVERIFIED, searches returned nothing on slopegraphs)
  question: Which figures moved between previous version and this one, and how much?
  objectives: [D2, G4, X1]
  data: list of {label, before, after, unit}; <=12 rows
  html_feasibility: {type: inline-svg, effort: med}   # two columns of text, lines between; sort/collision-avoid labels in code
  scan_time: 3 s
  injection_rule: >=3 numeric claims changed between versions/rounds; colour only the lines that changed beyond threshold
  anti_use: single change (use inline old->new text); >12 lines; different units per row
  evidence: UNVERIFIED in this session. Related secondary: connected dot plots suit few categories across few time points (r-bloggers/Domo snippets).

- id: V06
  name: Diverging delta bar (deviation from reference)
  origin: FT Visual Vocabulary, deviation family. https://gijn.org/resource/document-of-the-day-visual-vocabulary/
  question: Above/below a fixed reference (previous value, target, budget) by how much?
  objectives: [D2, G4, C5, T2]
  data: list of {label, value, reference}
  html_feasibility: {type: css, effort: low}   # zero line + signed-width bars; or svg
  scan_time: 2 s
  injection_rule: numbers with a natural reference and sign matters (+/- vs previous round, over/under budget)
  anti_use: no meaningful reference; values spanning orders of magnitude
  evidence: FT defines deviation as emphasising positive/negative variation from fixed reference such as 0, target, average (secondary summary).

- id: V07
  name: Cleveland dot plot (ranked values on common scale)
  origin: Cleveland and McGill 1984 JASA graphical perception; dot plot per Cleveland. https://info3312.infosci.cornell.edu/slides/04-graphical-perception.html (secondary)
  question: Compare a few values precisely, e.g. option scores, metric per module.
  objectives: [X1, D2, T2, C3]
  data: list of {label, value}, optional second value (before/after) per row
  html_feasibility: {type: inline-svg, effort: low}   # or CSS grid with positioned dots
  scan_time: 3 s
  injection_rule: 4-15 labelled values where exact comparison matters; prefer over bars when baseline not zero
  anti_use: part-to-whole; fewer than 3 items
  evidence: position on a common scale ranked most accurate; Heer-Bostock replication largely held; later work questions ranking for some tasks (multi-value averages). Secondary.

- id: V08
  name: Weighted decision matrix with graded cells
  origin: Decision-matrix method. https://en.wikipedia.org/wiki/Decision-matrix_method
  question: How do N options score on weighted criteria, and which wins?
  objectives: [X1, X3]
  data: criteria[{name, weight}], options[], scores[option][criterion] (0-3 or 0-5), optional note per cell
  html_feasibility: {type: table, effort: low}   # table; cell shading + Harvey-ball-like glyph via CSS conic-gradient; totals row
  scan_time: 5 s
  injection_rule: >=2 options AND >=3 criteria with comparable scale; show weights in header, total with bar
  anti_use: criteria not independent; scores invented without evidence (false precision; flag assumptions)
  evidence: each option scored per criterion then multiplied by weight (secondary). Biases in weights/criteria persist (same snippet). Harvey balls: no source found.

- id: V09
  name: Pugh matrix (options vs baseline: better / same / worse)
  origin: Pugh method. https://en.wikipedia.org/wiki/Decision-matrix_method (secondary)
  question: Versus the status quo, where is each option better or worse?
  objectives: [X1, X2]
  data: baseline name, criteria[], options[], rating in {+,0,-} per cell
  html_feasibility: {type: table, effort: low}
  scan_time: 3 s
  injection_rule: a baseline exists (current state, default) and criteria are qualitative; best as first pass with 3+ options
  anti_use: need final numeric ranking; no real baseline
  evidence: Pugh +1/0/-1 vs baseline; used early to screen, weighted matrix for finalists (secondary snippets).

- id: V10
  name: Option profile cards (side-by-side, same slots)
  origin: Tufte small multiples applied to options (synthesis)
  question: What are the 2-4 options, each in the same fixed slots (what, cost, risk, reversibility)?
  objectives: [X1, X3, X2]
  data: options[{name, one_line, pros[<=3], cons[<=3], cost, reversibility, recommended:bool}]
  html_feasibility: {type: css, effort: low}   # grid of equal cards; stack on phone; recommended card outlined + glyph
  scan_time: 5 s
  injection_rule: 2-4 options with prose-like attributes; use V08 when >=3 numeric criteria
  anti_use: >4 options
  evidence: synthesis; relies on small-multiple principle (same structure so differences pop).

- id: V11
  name: 2x2 matrix (quadrant plot)
  origin: Eisenhower/Covey priority matrix; generic 2x2. https://corporatefinanceinstitute.com/resources/uncategorized/eisenhower-matrix/ (secondary). Grid origin contested per snippet.
  question: Where do items sit on two axes, e.g. reversibility x cost of being wrong, impact x effort?
  objectives: [X2, D5, X3, D3]
  data: axes[{name, low_label, high_label}], items[{id, label, x:0..1, y:0..1}], quadrant action labels
  html_feasibility: {type: inline-svg, effort: med}   # label collision handling in code; numbered dots + legend for >8 items
  scan_time: 3 s
  injection_rule: exactly two orthogonal ordinal dimensions per item and quadrants imply different actions (e.g. high cost-of-wrong + irreversible = ask human)
  anti_use: axes correlated; >12 items; precision claimed from ordinal input
  evidence: quadrant->action mapping (do/schedule/delegate/delete) documented (secondary). Eisenhower authorship of grid disputed in snippet.

- id: V12
  name: Risk matrix (likelihood x impact heat grid)
  origin: ISO 31000 practice; critique Cox 2008 Risk Analysis, DOI 10.1111/j.1539-6924.2008.01030.x. Summary https://en.wikipedia.org/wiki/Risk_matrix
  question: Which risks are likely and severe?
  objectives: [D5]
  data: risks[{id, label, likelihood:1..5, impact:1..5, mitigation?}]
  html_feasibility: {type: table, effort: low}   # 5x5 table, risk ids placed in cells, colour + glyph
  scan_time: 3 s
  injection_rule: >=3 risks already rated on two ordinal scales by the author; keep scale labels explicit
  anti_use: risk score by multiplying ordinals; few risks (use list with chips); rating is invented by the agent without basis
  evidence: Cox: poor resolution, ambiguous inputs/outputs, can rank worse than random; Thomas et al. 2013 arbitrary rankings (secondary summary). Prefer V11 with named axes when only two dimensions matter.

- id: V13
  name: Decision path / decision tree (default branch highlighted)
  origin: data-to-viz decision tree (chart-choice); generic decision trees. https://github.com/compbioNJU/data_to_viz (repo mirror, secondary)
  question: If condition A then B; what happens by default if the reviewer does not answer?
  objectives: [X2, T1, X3]
  data: nodes[{id, question|outcome}], edges[{from, to, label}], default_path:[ids]
  html_feasibility: {type: inline-svg, effort: med}   # tidy tree layout in code; or nested <ul> with CSS connectors (low effort)
  scan_time: 5 s
  injection_rule: >=2 branching conditions or a stated default-if-silent; nested-list fallback when depth>3
  anti_use: linear steps; cyclic flows
  evidence: data-to-viz groups charts by data format as a decision tree (secondary). Use as pattern, not as content source.

- id: V14
  name: GSN argument tree (goal - strategy - evidence)
  origin: Goal Structuring Notation Community Standard v3 (SCSC, 2021). https://scsc.uk/gsn
  question: Is the top claim supported by sub-claims down to evidence, and where is it undeveloped?
  objectives: [D4, X3, D2, D5, C4]
  data: nodes[{id, type: goal|strategy|solution|context|assumption, text<=15 words, status: supported|undeveloped|challenged}], edges[{parent, child}]
  html_feasibility: {type: inline-svg, effort: high}   # or nested <details> tree with typed chips (low effort fallback)
  scan_time: 5-8 s
  injection_rule: deliverable makes a causal/safety/quality claim chain with sources (audit, recommendation, migration safety); show "undeveloped" diamonds as exceptions
  anti_use: narrative docs without verifiable claims; non-expert audience unfamiliar with symbols (use plain labels, keep type glyphs)
  evidence: claim = goal, strategy partitions argument, solutions = evidence; maintained by SCSC (secondary summary; standard not read). CAE (Adelard) is the parallel notation.

- id: V15
  name: Toulmin argument cell (claim, grounds, warrant, rebuttal)
  origin: Toulmin model. https://owl.purdue.edu/owl/general_writing/academic_writing/historical_perspectives_on_argumentation/toulmin_argument.html
  question: For one key claim, what grounds support it, what bridges grounds to claim, what would falsify it?
  objectives: [D4, X3, D2]
  data: per claim {claim, grounds[], warrant, backing?, qualifier?, rebuttal[]}
  html_feasibility: {type: css, effort: low}   # fixed 2x3 grid per claim
  scan_time: 5 s
  injection_rule: 1-5 central claims where the implicit warrant is the contestable part; one cell per claim
  anti_use: descriptive content; >5 claims (use V14 or V16)
  evidence: 3 core + 3 supporting parts; layouts vary across handouts, no standard layout (secondary).

- id: V16
  name: Claim outline tree (indented, status chips)
  origin: synthesis from argument-map/GSN structure; pyramid-style outline (UNVERIFIED origin)
  question: What is the structure of the document/argument and which node needs me?
  objectives: [D4, D3, D1]
  data: tree nodes[{id, level, title<=8 words, kind: claim|evidence|open, status, children}]
  html_feasibility: {type: css, effort: low}   # nested <details>/<ul>; exceptions auto-expanded
  scan_time: 3-5 s
  injection_rule: doc has hierarchical sections; always preferred over V14 when no evidence typing is needed; collapse ok branches
  anti_use: flat documents
  evidence: synthesis; exception-first expand rule from prior research.

- id: V17
  name: C4 system context diagram
  origin: Simon Brown, C4 model. https://c4model.com/diagrams
  question: What is the system, who uses it, and which external systems touch it?
  objectives: [C1, G2, D1]
  data: system, people[], external_systems[], edges[{from,to,label}]
  html_feasibility: {type: inline-svg, effort: med}   # centred box + radial/columns layout is easy; avoid general graph layout
  scan_time: 5 s
  injection_rule: new or reshaped system/integration; also for mandate/audience context (people around the deliverable)
  anti_use: pure refactor within one container
  evidence: levels context/container/component/code; context+container enough for most teams; notation independent (secondary via search summary of c4model.com).

- id: V18
  name: C4 container/component box diagram with change overlay
  origin: C4 model. https://c4model.com/diagrams
  question: Which parts exist, how do they connect, which did the change touch?
  objectives: [C1, C2, C3, C4]
  data: nodes[{id, name, kind, parent?, changed: none|modified|added|removed, owned:bool}], edges[{from,to,label}]
  html_feasibility: {type: inline-svg, effort: med}   # layered layout by code (columns by depth); CSS grid fallback with edge list
  scan_time: 5-8 s
  injection_rule: >=3 components and >=1 relationship change; dim unchanged, thick outline + glyph on changed, dashed on out-of-ownership
  anti_use: >12 boxes (split by level)
  evidence: container = deployable/data store; component = encapsulated functionality (secondary). Change overlay is synthesis.

- id: V19
  name: Architecture view selector (building block / runtime / deployment)
  origin: arc42 sections 5-7. https://examples.arc42.org/sections/
  question: Which view type answers the reviewer question: static structure, behaviour, or where it runs?
  objectives: [C1, C2]
  data: choice among {building_block, runtime_scenario, deployment}; content per chosen view
  html_feasibility: {type: css, effort: low}   # tabs via radio inputs, no JS
  scan_time: n/a (meta)
  injection_rule: code review with structure AND behaviour changes: show V18 first, V20 for 1-3 critical scenarios, deployment only if infra touched
  anti_use: single-view changes
  evidence: arc42 advises few runtime scenarios, level-1 building blocks for most stakeholders (secondary snippet).

- id: V20
  name: Sequence diagram (messages over time between participants)
  origin: UML sequence diagram. https://static1.creately.com/guides/flowchart-vs-sequence-diagram
  question: In what order do components/agents exchange messages in this scenario?
  objectives: [C2, T1, G2]
  data: participants[], messages[{from, to, label<=5 words, kind: call|return|async, changed:bool}]
  html_feasibility: {type: inline-svg, effort: med}   # column x, row y: deterministic layout, easy to generate
  scan_time: 5-8 s
  injection_rule: control flow across >=3 participants with ordering that matters; max 8 participants, 15 messages
  anti_use: pure data transformation (use V22); ownership emphasis (use V21)
  evidence: messages over time between participants (secondary). Deterministic layout makes it the cheapest diagram to generate.

- id: V21
  name: Swimlane diagram (steps grouped by owner)
  origin: swimlane/flowchart variant. https://miro.com/blog/swimlane-diagram/
  question: Who or what performs each step; where are handoffs (agent -> reviewer)?
  objectives: [C2, G1, G2, D1]
  data: lanes[], steps[{id, lane, label, order}], edges[{from,to}]
  html_feasibility: {type: inline-svg, effort: med}   # CSS grid rows=lanes also works
  scan_time: 5 s
  injection_rule: >=2 actors with handoffs; reviewer lane highlighted to show what is asked of him
  anti_use: >5 lanes (gets messy per source); single actor
  evidence: use when ownership matters beyond sequence; messy with many participants (secondary).

- id: V22
  name: Sankey / flow bands (quantity flow)
  origin: Sankey diagram. https://www.metabase.com/glossary/sankey-diagram
  question: How does a quantity split and merge across stages (items in -> categories -> outcomes)?
  objectives: [C2, G3, D2]
  data: nodes[], links[{source,target,value}], single consistent unit
  html_feasibility: {type: inline-svg, effort: high}   # layout needs a node-ordering algorithm; limit to 3 columns to stay feasible
  scan_time: 5 s
  injection_rule: single-unit counts passing through >=2 stages (files by type -> changed/unchanged; findings by severity -> verdict)
  anti_use: mixed units, many small categories, cycles, time series
  evidence: width encodes quantity; fails with mixed units/clutter/circular flow (secondary snippets).

- id: V23
  name: Dependency structure matrix (DSM / adjacency matrix)
  origin: Eppinger and Browning, Design Structure Matrix Methods and Applications (MIT Press 2012). https://stuff.mit.edu/people/eppinger/SDE-MIT/DSM_Book.html
  question: Which module depends on which; what clusters or cycles exist?
  objectives: [C3, C5, C1, T2]
  data: nodes[], edges[{from,to,weight?}], changed set
  html_feasibility: {type: table, effort: low}   # n x n table; cells coloured; changed rows/cols highlighted
  scan_time: 5-8 s (matrix needs a legend)
  injection_rule: >=8 modules with dense dependencies where node-link diagram would tangle; highlight rows of changed modules to read dependents in column
  anti_use: <6 nodes; sparse trees; audience unfamiliar (add one-line how-to-read)
  evidence: static DSM = N2 chart = adjacency matrix; applied to software architecture (Sookocheff, Stevens thesis) (secondary).

- id: V24
  name: Blast-radius rings (touched / 1-hop / 2-hop)
  origin: impact-analysis tools: pyblastradius tiers direct/indirect/tertiary; impact_analyzer_dashboard rings view. https://pypi.org/project/pyblastradius/0.4.2/
  question: What did the change touch and how far does impact propagate?
  objectives: [C3]
  data: changed[], dependents[{id, hop:1|2|3, path_to_changed?}], tests_covering?
  html_feasibility: {type: inline-svg, effort: med}   # concentric circles; angular placement by group; or 3 CSS columns as fallback
  scan_time: 3 s
  injection_rule: always for code review with a computed dependency graph; counts per ring in header; rings with uncovered nodes flagged
  anti_use: graph not computed (agent must not guess dependents); >40 nodes (show counts + top N)
  evidence: tools model impact as distance tiers with decay (morpharch weights by 1/(1+d)^2) (secondary snippet). No authoritative guidance on ring layout.

- id: V25
  name: Treemap (area = size, colour = change)
  origin: Ben Shneiderman, tree-maps (UMD). https://drum.lib.umd.edu/items/06e28bc9-08ff-41c1-943e-27d74e663e6a/full
  question: Where in the codebase/doc tree is the volume of change or coverage concentrated?
  objectives: [C3, C4, T3]
  data: hierarchy[{path, size, status|delta}]; squarified layout computed in code
  html_feasibility: {type: inline-svg, effort: med}   # absolute-positioned divs also OK; labels clipped on small cells
  scan_time: 3 s
  injection_rule: >=20 files/dirs with one numeric size (lines changed, test count); colour = in-scope/out-of-scope or covered/uncovered
  anti_use: <10 nodes; exact comparison needed (area is weak per V32)
  evidence: area from leaf attribute, colour second channel, thousands of items legible (secondary snippet). Area ranks low in Cleveland-McGill.

- id: V26
  name: Coverage / traceability matrix
  origin: requirements traceability matrix practice (MathWorks, Katalon, Modern Requirements docs). https://www.mathworks.com/help/slrequirements/gs/identify-and-address-traceability-gaps.html
  question: Which requirements/behaviours have tests, which have none?
  objectives: [T3, C5, C4]
  data: rows (requirements or behaviours, with priority), columns (tests or files), links[{row,col,state: pass|fail|notrun}]
  html_feasibility: {type: table, effort: low}   # empty rows rendered as a red/hatched "no coverage" row, sorted first
  scan_time: 3-5 s
  injection_rule: a list of things-to-verify AND a list of verifications exist; sort uncovered MUST items first; per-row coverage bar
  anti_use: no source of truth for the requirement list (agent-invented rows hide real gaps)
  evidence: vendors colour mapped/unexecuted/unmapped cells; filter to missing links; uncovered MUST = critical (secondary vendor docs).

- id: V27
  name: Sync-fact grid (fact x location, value match/mismatch)
  origin: synthesis; related to traceability matrix and DSM
  question: Does the same fact have the same value in every place that must agree (version in 3 files)?
  objectives: [C5, G5]
  data: facts[{name, locations[{path, value, line?}], expected?}]
  html_feasibility: {type: table, effort: low}   # rows=facts, cols=locations; mismatch cell red + glyph; code computes equality, never the LLM
  scan_time: 2 s
  injection_rule: project rules declare sync constraints; show even when all match (one green row proves the check ran)
  anti_use: facts without declared constraints
  evidence: synthesis (no external source). Equality is computed by code per "LLM designates, code copies".

- id: V28
  name: Scope-boundary file list (in / out of owned paths)
  origin: synthesis; indented tree + ownership gutter
  question: Did the change stay inside the mandate's owned paths?
  objectives: [C4]
  data: mandate.owned_globs[], touched[{path, lines_added, lines_removed, owned:bool}]
  html_feasibility: {type: css, effort: low}   # tree grouped by directory, out-of-scope rows first with red gutter; ownership computed by code glob match
  scan_time: 3 s
  injection_rule: a mandate with owned paths exists; if zero out-of-scope files show a single explicit "0 outside" line
  anti_use: no declared ownership
  evidence: synthesis; pair with V25 and V40.

- id: V29
  name: Timeline (rounds, events, freshness)
  origin: Dan Roam, Back of the Napkin: "when" -> timeline. https://www.publishersweekly.com/9781591841999
  question: What happened when; how old is each source or round?
  objectives: [G5, G4, G3]
  data: events[{t (ISO), label, kind, source?}], now
  html_feasibility: {type: inline-svg, effort: low}   # linear time axis; or CSS list with relative age chips ("3 d old") if span is irregular
  scan_time: 3 s
  injection_rule: >=3 dated events, or sources with differing dates; flag stale sources (age > threshold) with glyph
  anti_use: single date (use a chip)
  evidence: W-question to picture mapping (Who/What portrait, How much chart, Where map, When timeline) per secondary summary; exact book framework not verified.

- id: V30
  name: Six-W context card (who / what / how much / where / when / why)
  origin: Dan Roam, Back of the Napkin (six W's, SQVID). https://www.publishersweekly.com/9781591841999
  question: What is the objective, audience, mandate, sources of this deliverable at a glance?
  objectives: [G2, D1, G1]
  data: slots {who (audience), what (deliverable), why (objective), when (deadline/freshness), where (scope/paths/sources), how_much (size, time to review)}
  html_feasibility: {type: css, effort: low}   # fixed-slot grid, one short line per slot, icon+label
  scan_time: 3 s
  injection_rule: every page header; fixed slot order so the reviewer learns positions
  anti_use: none; omit empty slots rather than fill
  evidence: sources disagree on exact six (5W1H variants); SQVID expansion not confirmed. Use only as slot structure.

- id: V31
  name: Chart-choice rule sets (FT Visual Vocabulary, Abela chooser, data-to-viz)
  origin: FT https://gijn.org/resource/document-of-the-day-visual-vocabulary/ ; Abela (via https://slidemodel.com/free-powerpoint-templates/free-abelas-chart-chooser-powerpoint-template/) ; data-to-viz (https://github.com/compbioNJU/data_to_viz)
  question: Meta: given the message (deviation, correlation, ranking, distribution, change over time, magnitude, part-to-whole, spatial, flow), which chart?
  objectives: [all numeric blocks]
  data: per numeric block a declared "message" enum
  html_feasibility: {type: css, effort: low}   # selection logic only, no rendering
  scan_time: n/a
  injection_rule: use as the generator's lookup: message type -> grammar (deviation->V06, ranking->V07, part-to-whole->V01, change over time->V04/V29, flow->V22, magnitude->V07)
  anti_use: do not expose the chooser to the reviewer
  evidence: FT: 9 categories; Abela: composition, relationship, comparison, distribution; data-to-viz: tree by data format (all secondary). Lengler-Eppler Periodic Table (~100 methods, IASTED 2007) found only through secondary summaries; not adopted (too broad).

- id: V32
  name: Encoding hierarchy (Bertin visual variables + Cleveland-McGill ranking)
  origin: Bertin, Semiologie graphique (1967); Cleveland and McGill, JASA 1984. https://axismaps.com/guide/visual-variables ; https://info3312.infosci.cornell.edu/slides/04-graphical-perception.html
  question: Meta: which visual channel for which kind of information?
  objectives: [all]
  data: none; rule table
  html_feasibility: {type: css, effort: low}
  scan_time: n/a
  injection_rule: position/length for quantities; hue + shape for categories (status); value (lightness) for order; size/area only for coarse magnitude; texture/pattern as redundant channel; never rely on one channel
  anti_use: do not use area/angle (pie) for precise comparison
  evidence: Bertin 7 variables (position, size, shape, value, hue, orientation, texture); selective vs associative vs dissociative; Cleveland-McGill order position > length > angle > area > saturation, largely replicated (Heer-Bostock) but contested for some tasks (secondary).

- id: V33
  name: Colour-blind-safe status palette with redundant glyphs
  origin: Okabe and Ito colour universal design. https://jfly.uni-koeln.de/color/text.html
  question: Meta: how to colour ok/revise/no/question/unseen in light and dark and be unambiguous
  objectives: [all status displays]
  data: status enum -> {color_light, color_dark, glyph, pattern}
  html_feasibility: {type: css, effort: low}   # CSS variables under prefers-color-scheme; glyph via ::before text
  scan_time: n/a
  injection_rule: define once; every status chip = colour + glyph + word. Unseen = hatched/outlined (absence is a state)
  anti_use: red/green only
  evidence: palette unambiguous to colour-blind and non-colour-blind viewers (primary page title); redundant colour+shape not always better than expected, per 2026 arXiv Tseng et al. (https://arxiv.org/abs/2602.06792v1), so test the glyph set.

- id: V34
  name: Step table with expected vs observed result
  origin: test-case / traceability report tables (Katalon, TestCollab). https://docs.katalon.com/katalon-platform/analyze/reports/requirement-traceability-report
  question: For each step, what is expected, what happened, what is the state?
  objectives: [T1, T2]
  data: steps[{n, action<=12 words, expected<=12 words, observed?, state: pass|fail|blocked|notrun, evidence_ref?}]
  html_feasibility: {type: table, effort: low}   # two-line rows; failures first-expanded; state glyph in first column
  scan_time: 3-5 s
  injection_rule: any ordered procedure; collapse passing runs of consecutive steps into "steps 3-9 pass"
  anti_use: >30 steps without grouping
  evidence: chained requirement-test-execution-defect tables with coverage filters (secondary vendor docs).

- id: V35
  name: Unit chart / icon array (ISOTYPE-style, waffle)
  origin: Neurath, ISOTYPE. UNVERIFIED (searches returned nothing on ISOTYPE)
  question: How many individual things, each shown as one mark, in which state?
  objectives: [G3, T2, T3]
  data: items[{id, state}] (<=100)
  html_feasibility: {type: css, effort: low}   # grid of small squares/circles; each = a block or test
  scan_time: 2 s
  injection_rule: counts 10-100 where each unit is individually reviewable; a tile grid (V03) with links covers the same need with navigation
  anti_use: >100; need exact proportions (V01)
  evidence: UNVERIFIED in this session; counting-by-icon claim not backed by a fetched source. Low priority, likely redundant with V03.

- id: V36
  name: Cynefin domain tag (clear / complicated / complex / chaotic)
  origin: Snowden and Boone, HBR 2007; https://en.wikipedia.org/wiki/Cynefin_framework
  question: How knowable is the problem, so how much to trust analysis vs probing?
  objectives: [X2, D5]
  data: per decision {domain: clear|complicated|complex|chaotic|confusion}
  html_feasibility: {type: css, effort: low}   # a 4-cell mini-map with one cell lit
  scan_time: 2 s
  injection_rule: only when the decision sheet asserts uncertainty class; low priority, V11 usually enough
  anti_use: reviewers unfamiliar with the vocabulary; domain assigned by LLM with no basis
  evidence: ordered (clear, complicated) vs unordered (complex, chaotic); domain names changed over time (secondary).

- id: V37
  name: Wardley map (value chain x evolution)
  origin: Simon Wardley. https://www.wardleymaps.com/intro
  question: Which components are novel vs commodity, hence build vs buy?
  objectives: [C1, X1]
  data: components[{id, visibility 0..1, evolution 0..1}], edges
  html_feasibility: {type: inline-svg, effort: med}
  scan_time: 8+ s
  injection_rule: rarely; only for build-vs-buy strategy decisions
  anti_use: general code/doc review; needs trained reader. Verdict: not recommended for this use.
  evidence: axes: visibility (vertical), evolution genesis->commodity (horizontal) (secondary).

- id: V38
  name: Diff-stat bar (per-file added/removed proportion)
  origin: VCS diff stat convention (synthesis; UNVERIFIED as a source)
  question: How big is the change per file, and is it additive or destructive?
  objectives: [C3, C4]
  data: files[{path, added, removed, owned:bool}]
  html_feasibility: {type: css, effort: low}   # two flex segments, width in sqrt or capped scale
  scan_time: 3 s
  injection_rule: list of touched files; sort by out-of-scope first then by size
  anti_use: >50 files (use V25)
  evidence: none fetched; included because it reuses V01 mechanics.

- id: V39
  name: Round-diff chips (since-your-feedback markers)
  origin: synthesis from small multiples; sparklines
  question: For each block you commented on, was it addressed, rejected by the agent, or untouched?
  objectives: [G4, D2, D3]
  data: feedback_items[{block_id, verdict_prev, agent_response: fixed|declined|unchanged|new, diff_ref?}]
  html_feasibility: {type: table, effort: low}   # one row per previous comment: old comment, agent response chip, jump link
  scan_time: 3 s
  injection_rule: round >= 2; unchanged-but-flagged rows first (silent ignores)
  anti_use: round 1
  evidence: synthesis; closes gap on "what changed since feedback" together with V05.
```

# matrix

```yaml
G1: [{id: V03, why: tiles sorted exceptions-first show what needs the reviewer}, {id: V02, why: reviewer time vs budget as one bar}, {id: V30, why: how-much slot states the ask}]
G2: [{id: V30, why: fixed slots for audience/objective/mandate/sources}, {id: V17, why: system and actors around it}, {id: V21, why: who does what between agent and reviewer}]
G3: [{id: V01, why: seen/unseen share in one bar}, {id: V03, why: per-block state with unseen as hatched tile}, {id: V35, why: unit counts, weakest (unverified)}]
G4: [{id: V39, why: per-comment agent response, catches silent ignores}, {id: V05, why: changed figures before->after}, {id: V03, why: changed-corner marker on tiles}]
G5: [{id: V29, why: dated sources and rounds on one axis, stale flagged}, {id: V27, why: values checked by code at generation time}, {id: V04, why: trajectory across rounds}]
D1: [{id: V30, why: objective/audience slots}, {id: V16, why: outline shows what doc is for}, {id: V21, why: roles}]
D2: [{id: V05, why: before/after for >=3 figures}, {id: V06, why: signed delta vs reference}, {id: V07, why: precise comparison on common scale}]
D3: [{id: V16, why: tree with decided/open chips}, {id: V03, why: grid of decisions by state}, {id: V01, why: decided share}]
D4: [{id: V16, why: cheap and scannable structure}, {id: V14, why: claim-to-evidence support, undeveloped nodes visible}, {id: V15, why: expose warrant and rebuttal of key claims}]
D5: [{id: V11, why: 2 named axes, quadrant implies action}, {id: V12, why: only if author supplied ordinal likelihood x impact; Cox caveat}, {id: V14, why: risks as undeveloped claims}]
C1: [{id: V18, why: boxes and edges with change overlay}, {id: V17, why: context level for new integrations}, {id: V19, why: pick view type}]
C2: [{id: V20, why: ordered messages across participants, deterministic layout}, {id: V21, why: handoffs and ownership}, {id: V22, why: quantity flow, narrow use}]
C3: [{id: V24, why: touched/1-hop/2-hop rings}, {id: V23, why: dense dependents readable as a column}, {id: V25, why: where change concentrates}]
C4: [{id: V28, why: in/out of owned paths explicit}, {id: V38, why: size per file}, {id: V25, why: spatial view of scope}]
C5: [{id: V27, why: fact x location equality grid}, {id: V26, why: link coverage view}, {id: V06, why: numeric drift between copies}]
T1: [{id: V34, why: step, expected, observed, state}, {id: V20, why: when steps are message exchanges}, {id: V13, why: branching procedures}]
T2: [{id: V01, why: pass/fail/blocked/notrun share}, {id: V03, why: per-case tile}, {id: V04, why: pass rate across runs}]
T3: [{id: V26, why: uncovered rows first}, {id: V25, why: coverage by area}, {id: V01, why: covered share}]
X1: [{id: V08, why: weighted criteria, totals}, {id: V09, why: vs baseline, qualitative}, {id: V10, why: fixed-slot cards when criteria are prose}]
X2: [{id: V11, why: reversibility x cost of being wrong}, {id: V13, why: default-if-no-answer branch}, {id: V09, why: change vs status quo}]
X3: [{id: V10, why: recommended card outlined}, {id: V14, why: support for recommendation}, {id: V02, why: confidence vs threshold as one bar}]
```

# generator_notes

```yaml
always_on: [V33 palette, V30 header card, V03 tile navigator, V01 strip]
by_page_type:
  doc_review: [V16, V05, V15|V14, V11|V12]
  code_review: [V24, V18, V28, V27, V23|V25, V20]
  test_plan: [V34, V01, V26, V03]
  decision_sheet: [V10 or V08, V11, V13, V02]
cost_order_for_build: [V01, V03, V30, V27, V34, V08, V09, V10, V16, V23 (table), V06, V02, V04, V29, V11, V20, V24, V25, V18, V14, V22]
llm_vs_code:
  llm_designates: [grammar id, node ids, status, hop levels from a computed graph, quadrant coordinates as ordinals]
  code_computes: [equality (V27), globs (V28), hops (V24), geometry/layout, counts, verbatim text copy]
```

# gaps

```yaml
- objective: X3 confidence
  state: no source-backed grammar found for "recommendation + confidence". V02 (bullet vs threshold) and V10 (outlined card) are workarounds. Candidate to design: ordinal 3-level chip + count of supporting evidence nodes from V14. Not researched: forecasting/GRADE evidence-quality ladders.
- objective: G1 the ask
  state: no grammar found; it is a text card (V30 slots) plus counts (V03/V01). Time estimate has no known visual idiom beyond V02.
- objective: G4 round-2 diff of prose
  state: V05/V39 cover numbers and comments only; rendered prose diff is prior research (not covered here).
- objective: D5 risks
  state: V12 is contested (Cox 2008); V11 and V14 are workarounds; no better grammar found (e.g. bow-tie diagram, FMEA table not searched).
- not found/verified: slopegraph origin (V05), ISOTYPE/unit charts (V35), Harvey balls (V08), waterfall/bridge charts, Gantt/CSS timelines, Likert diverging bars. Primary texts (Bertin, Tufte, Few PDF, GSN standard, Cox paper, Okabe-Ito paper) were NOT read; all evidence is from search snippets.
```
