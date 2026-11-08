---
date: 2026-11-03
objective: C6 architectural conformance (code-review recipe)
sources_count: 33
status: research complete, not yet reviewed by Mat; evidence tags per entry; nothing implemented or run locally
principle: LLM designates (component ids, labels, rules file), code computes and copies; zero LLM at review time
target_repos: TS Claude Code plugin (explicit .ts imports, no package.json, no tsc, no test-runner config) + Python stdlib scripts
legend_toolchain: yes = regex/AST-lite or stdlib only | partial = needs a runtime already present (node, python, git) or a coverage file | no = needs npm/pip install or compiler
note_evidence: primary = tool doc / author text read via fetch; secondary = search-result summary or third-party; unverified = inferred, not found in a source
---

# 1. Shared computation base (reused by most checks)
```yaml
base:
  B1_import_graph:
    ts: regex over `import|export ... from '<rel>.ts'`, `import('<rel>.ts')`, `require`; explicit .ts means resolution = path join, no tsconfig
    py: stdlib `ast` (Import, ImportFrom with .level) -> module names; resolve relative by package path
    output: edges file->file, collapsed to component->component via file-to-component table
  B2_component_table:
    source: architecture rules file (section 4); first-match glob/prefix per file; unmatched files -> "unassigned" bucket (itself a signal)
  B3_diff:
    source: git diff --name-status / --numstat / -U0 (read-only verbs allowed per PLAN)
  B4_coverage_input:
    source: lcov or Cobertura/coverage.json produced by the repo's own test command; the review script never runs tests, it only reads the file if present, else grey card "no coverage data"
```

# 2. Checks
```yaml
checks:
  # ---------- patterns ----------
  - id: A01
    name: Layer direction violations
    short_description: Lists imports that go against the allowed layer order (e.g. domain importing adapters).
    sub_objective: patterns
    how_computed: B1 edges collapsed by B2; compare each component pair to allowed_to matrix from rules file; report forbidden edges, flag those NEW in the diff (edge present at HEAD, absent at base) vs pre-existing
    works_without_toolchain: yes (own ~60-line script); the same semantics exist natively in dependency-cruiser (needs node + npm install), import-linter (pip, Python only), Deptrac (PHP), eslint-plugin-boundaries (eslint)
    false_positive_risk: low for static imports; misses dynamic/computed imports; type-only imports can be legit (option to ignore)
    origin: Dependency rule - Martin Clean Architecture https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html ; rule engines https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md , https://import-linter.readthedocs.io/en/stable/contract_types/ , https://github.com/qossmic/deptrac/blob/2.0.x/docs/concepts.md
    evidence: primary (rule semantics: dependency-cruiser forbidden/allowed with path groups $1; Deptrac ruleset = whitelist, default all forbidden; Martin quote "source code dependencies can only point inwards")

  - id: A02
    name: Allow-list vs deny-list mode with uncovered edges
    short_description: Shows edges that the rules file says nothing about (neither allowed nor forbidden), so silent drift is visible.
    sub_objective: patterns
    how_computed: in whitelist mode every component pair absent from allowed_to is "uncovered"; count and list; new uncovered edges in diff = prompt to extend the rules file
    works_without_toolchain: yes (same script as A01)
    false_positive_risk: medium early on (rules file incomplete); decays as the file matures
    origin: Deptrac "uncovered dependencies" (--report-uncovered, --fail-on-uncovered) ; dependency-cruiser `allowed` + not-in-allowed https://github.com/qossmic/deptrac/blob/2.0.x/docs/concepts.md
    evidence: primary (Deptrac via search summary of docs; dep-cruiser rules reference fetched)

  - id: A03
    name: Port/adapter placement (hexagon boundary)
    short_description: Checks that anything touching the outside world sits in adapters and that the core only sees interfaces (ports).
    sub_objective: patterns
    how_computed: derived from A01 with roles: core may import only core+ports; adapters may import core+ports+external; core must not import any io_modules (A07). Optional: ports = files matching ports glob, expected to contain only type/interface/abstract declarations (regex `export (interface|type)` ; Python `Protocol|ABC`)
    works_without_toolchain: yes for import direction; partial for "ports contain only interfaces" (regex heuristic)
    false_positive_risk: medium; hexagonal article does not prescribe internal code layout, so mapping folders to roles is a repo convention
    origin: Cockburn https://alistaircockburn.com/Articles/Hexagonal-Architecture ; Bernhardt FCIS is described as a subset of hexagonal (forum summary)
    evidence: secondary (Cockburn page fetched but returned no body text; claim "no internal code layout prescribed" from search summary of commentators)

  - id: A04
    name: Sibling / slice independence
    short_description: Flags one feature or component importing another one that is meant to be independent.
    sub_objective: patterns
    how_computed: rules of kind "independent: [c1,c2,...]" or pattern `from ^src/([^/]+)/ to ^src/(?!\1)`; check edges both directions including transitive (BFS on component graph)
    works_without_toolchain: yes
    false_positive_risk: low-medium (shared kernel components need an allow list)
    origin: import-linter independence contract ; dependency-cruiser group matching $1 https://import-linter.readthedocs.io/en/stable/contract_types/
    evidence: primary

  - id: A05
    name: Entry-point reachability (orphans and dead new files)
    short_description: Flags new files that no entry point reaches, and files that became unreachable after the change.
    sub_objective: patterns
    how_computed: BFS from declared entries (stint: hooks/register.ts; Python: script mains) over B1; list files in diff not reached; list files that were reached at base and not at HEAD
    works_without_toolchain: yes
    false_positive_risk: medium (dynamic loading, files referenced by manifests like hooks.json or plugin.json are invisible to imports; list them as extra entries in rules file)
    origin: dependency-cruiser `reachable` and `orphan` rule conditions https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md
    evidence: primary

  - id: A06
    name: Component map drift vs declared architecture model
    short_description: Compares the components declared in the architecture model with the real folders and edges, and lists what is missing on either side.
    sub_objective: patterns
    how_computed: parse components + relationships from the rules file (or a Structurizr DSL text via regex on `->`); diff against B1 component graph: edge in code but not in model = undeclared; edge in model never seen = stale. Both ends are machine-readable, no LLM
    works_without_toolchain: yes if the model is the simple YAML of section 4; no/partial if the source of truth is Structurizr DSL (validation needs the Structurizr CLI, Java)
    false_positive_risk: medium (model granularity vs code granularity)
    origin: Structurizr validate https://docs.structurizr.com/validate ; fitness-function idea https://www.thoughtworks.com/en-us/insights/articles/fitness-function-driven-development
    evidence: secondary (Structurizr validate checks workspace rules, not code-vs-model conformance; the drift check is our composition, not an existing feature - unverified as prior art)

  # ---------- purity ----------
  - id: A07
    name: IO import in pure code
    short_description: Flags core/domain files that import modules reaching DB, network, filesystem, process, clock, or an LLM SDK.
    sub_objective: purity
    how_computed: io_modules list in rules file, grouped by category (fs, net, proc, clock, random, env, db, llm). From B1 take external specifiers per file (TS: `node:fs`, `fs`, `child_process`, `node:http`, `fetch` global not an import; Python: `os`, `subprocess`, `socket`, `urllib`, `http`, `sqlite3`, `pathlib`, `time`, `datetime`, `random`, `anthropic`...). For each file in a component marked pure, list matching categories
    works_without_toolchain: yes
    false_positive_risk: medium: `pathlib`/`os.path` used only for string manipulation; `datetime` used only as a type; mitigate by splitting list into "always IO" vs "IO if called" and routing the latter to A08
    origin: deny/allow lists of IO functions in purity analysers: mypy-pure https://pypi.org/project/mypy-pure/ ; pure_fun https://hex.pm/packages/pure_fun/0.1.0/files ; FCIS https://www.destroyallsoftware.com/talks/boundaries
    evidence: secondary (tools confirm the deny-list technique; no canonical module list found - we define it)

  - id: A08
    name: IO call-site and global-effect scan
    short_description: Greps pure files for calls that do IO without an import (fetch, Date.now, Math.random, process.env, console, print, open(), input()).
    sub_objective: purity
    how_computed: regex/token scan of added/changed lines (git diff -U0) and of pure-component files; TS patterns `\bfetch\(|Date\.now\(|new Date\(\)|Math\.random\(|process\.(env|cwd|exit)|console\.|Bun\.|Deno\.`; Python `\bopen\(|\bprint\(|\binput\(|time\.time\(|datetime\.now\(|os\.environ`. Python variant stronger via stdlib ast.Call/Attribute walk (ignores strings and comments)
    works_without_toolchain: yes (regex) / yes (Python ast)
    false_positive_risk: medium regex (comments, strings; strip them first); low with ast for Python; dynamic access (getattr, globalThis[...]) is a known blind spot
    origin: mypy-pure limits (misses getattr/eval, mutation of arguments, global state) https://pypi.org/project/mypy-pure/ ; debtmap purity detector (io, mutable params, unsafe, external state flags) https://docs.rs/crate/debtmap/0.17.0/source/src/analyzers/purity_detector/detector.rs
    evidence: secondary

  - id: A09
    name: Transitive impurity via callee files
    short_description: A pure file is flagged if it imports a file that itself does IO, even when it imports no IO module directly.
    sub_objective: purity
    how_computed: A07/A08 flags on each file, then propagate along B1 (reverse reachability): file is tainted if any file it imports (transitively) is tainted and not an allowed port. Equivalent to dependency-cruiser `reachable` rule with `to.path` = IO files
    works_without_toolchain: yes
    false_positive_risk: medium (taint over-propagates through barrel/index files; stop propagation at ports)
    origin: pure_fun propagates impurity through callees and has an "unknown" class for unresolved calls https://hex.pm/packages/pure_fun/0.1.0/files ; dep-cruiser reachable
    evidence: secondary

  - id: A10
    name: Pure-code test ratio (core covered, shell ignored)
    short_description: Shows coverage of the pure core separately from coverage of the IO shell, since the core is where tests are cheap and expected.
    sub_objective: purity
    how_computed: join A07 pure/impure classification with A12 per-file coverage; report core line coverage and shell line coverage side by side; new impure code inside the core = highlighted
    works_without_toolchain: partial (needs coverage file, B4)
    false_positive_risk: low; classification inherits A07 errors
    origin: Bernhardt Boundaries / FCIS (core = the part needing thorough unit tests) https://www.destroyallsoftware.com/talks/boundaries
    evidence: secondary (talk page fetched via search summary only; the join is our composition)

  # ---------- coverage ----------
  - id: A11
    name: Diff (patch) coverage
    short_description: Percentage of changed lines that tests execute, with the list of changed lines that never ran.
    sub_objective: coverage
    how_computed: intersect `git diff -U0` added line numbers with line hits from lcov/Cobertura; denominator = added lines that the coverage file knows as executable (non-executable lines are not counted). diff-cover does exactly this; own implementation = lcov parser (DA:<line>,<hits>) + diff hunk parser, ~80 lines
    works_without_toolchain: partial (needs an lcov/XML file produced by the repo's test command; Node >= 22 emits lcov natively via `node --test --experimental-test-coverage --test-reporter=lcov --test-reporter-destination=lcov.info` ; Python needs coverage.py (pip) or a sys.monitoring/trace hook; diff-cover itself needs pip)
    false_positive_risk: medium: multi-line statements missed (diff-cover has --expand-coverage-report), path mismatch between coverage file and git diff gives "no lines with coverage info"; TS run through a loader/strip-types may report transformed line numbers (unverified)
    origin: diff-cover https://pypi.org/project/diff-cover/ ; Codecov patch status https://docs.codecov.com/docs/commit-status ; Node coverage https://nodejs.org/en/learn/test-runner/collecting-code-coverage
    evidence: primary (diff-cover inputs: Cobertura, Clover, JaCoCo, LCov; Codecov patch = only changed lines)

  - id: A12
    name: Per-component coverage with delta
    short_description: Coverage of each component, shown against its value before the change, so a drop in one component is not hidden by the project average.
    sub_objective: coverage
    how_computed: sum lcov LF/LH (lines found/hit) per file, aggregate by B2 component; base value needs a coverage file at base (CI artifact or stored) - else show absolute value and diff coverage only
    works_without_toolchain: partial (coverage file; delta needs a stored baseline)
    false_positive_risk: low; files never loaded by tests are absent from lcov unless an include pattern forces them (Node --test-coverage-include) -> treat "component with source files but no lcov rows" as 0 %, not as missing
    origin: Codecov components (virtual path filters with own project/patch status) https://docs.codecov.com/docs/components
    evidence: primary (Codecov docs via search); the "absent files count as 0" rule is our assumption (unverified)

  - id: A13
    name: Touched-but-untested files
    short_description: Lists changed source files that have no matching test file and no coverage rows.
    sub_objective: coverage
    how_computed: pure path logic, no coverage file needed: for each changed non-test file look for a test counterpart by convention (x.ts -> x.test.ts / test/x.test.ts; foo.py -> test_foo.py / tests/); also show whether the diff touched any test file at all
    works_without_toolchain: yes
    false_positive_risk: medium-high (naming conventions vary; stint tests run via CLI plugin test, so counterpart files may not exist at all - then the check reports "no test convention declared")
    origin: heuristic; pairs with Codecov patch status as fallback when no coverage file exists https://docs.codecov.com/docs/commit-status
    evidence: unverified (no primary source for the heuristic; common practice)

  - id: A14
    name: Risk-weighted coverage gap
    short_description: Ranks uncovered changed lines by how risky their file is (churn, size, dependents), so the reviewer reads the dangerous gaps first.
    sub_objective: coverage
    how_computed: product/ordinal of A11 uncovered count x file churn (git log --numstat last N commits) x fan-in from B1; ordinal bands, no multiplication shown to the user (PLAN decision D5 caveat)
    works_without_toolchain: partial (coverage file)
    false_positive_risk: medium; weights arbitrary
    origin: CodeScene hotspots = churn x code health ; hotspot needs health measure alongside https://codescene.ta.philips.com/docs/guides/technical/hotspots.html
    evidence: secondary (CodeScene docs are a Philips-hosted copy)

  # ---------- structure ----------
  - id: A15
    name: Import cycles (new and existing)
    short_description: Finds groups of files or components that import each other in a loop, and marks those created by this change.
    sub_objective: structure
    how_computed: Tarjan SCC over B1 at file and component level; SCC size > 1 = cycle; compare with SCC set at base to mark new/grown ones
    works_without_toolchain: yes (Tarjan ~30 lines); madge needs npm + tsconfig for paths; jscycles uses ast-grep (binary); Python: grimp/import-linter need pip
    false_positive_risk: low for value imports; type-only cycles are benign in TS (separate flag)
    origin: Lattix DSM acyclicity criterion http://groups.csail.mit.edu/sdg/pubs/2005/oopsla05-dsm.pdf ; NDepend ND1400/ND1401 ; jscycles https://github.com/EnderHub/jscycles
    evidence: primary (OOPSLA'05 via search summary), secondary (others)

  - id: A16
    name: Coupling and instability change
    short_description: Fan-in, fan-out and instability (outgoing share of all links) per touched component, before vs after.
    sub_objective: structure
    how_computed: from component graph: Ca (incoming), Ce (outgoing), I = Ce/(Ce+Ca); optional A = abstract/total declarations (interfaces+types vs classes+functions, regex) and D = |A+I-1|; compute at base and HEAD from git show for the touched components only. Stable-dependencies rule: a component should depend on components at least as stable (dependency-cruiser `moreUnstable`)
    works_without_toolchain: yes (I); partial for A (regex heuristic on abstractness; in TS/Python-stdlib scripts A is often meaningless, show I only)
    false_positive_risk: medium-high on small repos (few components -> noisy ratios); thresholds vary by author (one source: preferred I in 0-0.3 or 0.7-1)
    origin: Martin package metrics https://en.wikipedia.org/wiki/Software_package_metrics ; dependency-cruiser metrics reporter + moreUnstable https://github.com/sverweij/dependency-cruiser/blob/main/doc/options-reference.md
    evidence: primary for formulas (Wikipedia + several), secondary for thresholds

  - id: A17
    name: Size and complexity growth of touched files
    short_description: Lines, function count and nesting depth of touched files before vs after, flagging files that cross a size limit.
    sub_objective: structure
    how_computed: LOC via git show base:file vs HEAD; TS functions via regex `function|=>` counts (crude); Python via ast: FunctionDef count, max nesting, McCabe-style branch count (ast.If/For/While/Try/BoolOp). Limits in rules file
    works_without_toolchain: yes (Python ast exact; TS heuristic only)
    false_positive_risk: medium for TS regex (arrow functions, strings); low for Python ast
    origin: fitness-function catalogue (code quality gates) https://www.thoughtworks.com/en-us/insights/articles/fitness-function-driven-development ; CodeScene code health patterns (complexity makes code harder to change) 
    evidence: secondary

  - id: A18
    name: Change coupling (files that co-change)
    short_description: Shows files that nearly always change together in git history, and whether this change touched one half of a pair but not the other.
    sub_objective: structure
    how_computed: git log --name-only over last N commits (read-only); count co-occurrence per file pair; coupling = shared commits / max(commits_a, commits_b); report pairs above threshold where only one side is in this diff. Not computable from code alone (CodeScene statement). Same idea feeds the existing "sync facts" grid
    works_without_toolchain: yes (git + script)
    false_positive_risk: medium-high: bulk commits (renames, formatting, multi-file features) inflate pairs; filter commits with > K files
    origin: CodeScene change coupling https://codescene.com/blog/change-coupling-visualize-the-cost-of-change ; glossary https://codescene.ta.philips.com/docs/terminology/codescene-terminology.html
    evidence: secondary

  - id: A19
    name: Dependency set change (new external modules and new edges)
    short_description: Lists external modules or components newly imported by this change, whatever the rules say.
    sub_objective: structure
    how_computed: set difference of B1 edges (and external specifiers) between base and HEAD restricted to touched files; no rules needed, so it works on day 1 before any rules file exists
    works_without_toolchain: yes
    false_positive_risk: low (noise only from renames/moves: match by content hash or git -M)
    origin: fitness-function "triggered, atomic" class: Ford/Parsons/Kua taxonomy https://lethain.com/building-evolutionary-architectures/ (atomic vs holistic, triggered vs continual)
    evidence: secondary (taxonomy via summaries; the check itself is our design)
```

# 3. Visual grammars
```yaml
grammars:
  - id: R01
    name: Layered strip diagram with violation arrows
    short_description: Components drawn as stacked bands in layer order; allowed edges are quiet, forbidden edges are red arrows going the wrong way.
    shows_checks: [A01, A02, A03, A04]
    data_required: component list with layer index, edge list with new/old and allowed/forbidden flags
    html_feasibility: {type: inline-svg, effort: med}
    scan_time: 3-5 s (count the red arrows)
    injection_rule: always when rules file declares layers (core); with 0 violations show a single "0 violations / N edges checked" line instead of the diagram
    anti_use: more than ~12 components (use R02); cyclic layouts with no natural order
    origin: Lattix/Understand layering view concept; Deptrac layer table https://github.com/qossmic/deptrac/blob/2.0.x/docs/formatters.md
    evidence: secondary (concept; exact visual is our adaptation)

  - id: R02
    name: Dependency structure matrix (DSM) with layer blocks
    short_description: Square grid, rows depend on columns, sorted by layer; filled cells on the wrong side of the diagonal are violations.
    shows_checks: [A01, A02, A15, A16]
    data_required: component x component counts, layer order, per-cell new flag
    html_feasibility: {type: table, effort: low}
    scan_time: 5-10 s once learned (needs a legend); good beyond 12 components where graphs become unreadable
    injection_rule: signal: component count > 12 or any cycle present (cycles show as symmetric cell pairs)
    anti_use: first-time reader without legend; < 6 components (a list is faster)
    origin: Sangal et al. OOPSLA 2005 http://groups.csail.mit.edu/sdg/pubs/2005/oopsla05-dsm.pdf ; Understand dependency matrix https://docs.scitools.com/help/dependencies/dependency-matrix.html ; NDepend blog (matrix beats graph on complex code) https://blog.ndepend.com/identify-net-code-structure-patterns-with-no-effort
    evidence: primary

  - id: R03
    name: Edge delta list (new / removed dependencies)
    short_description: Two short columns: component links added by this change and links removed, each tagged allowed, forbidden or uncovered.
    shows_checks: [A01, A02, A19]
    data_required: base vs HEAD edge sets with rule verdict
    html_feasibility: {type: table, effort: low}
    scan_time: 2-3 s
    injection_rule: core, always shown (empty = "no dependency change", itself useful information)
    anti_use: none; cheapest grammar
    origin: Codecov-style diff views of "what changed"; dependency-cruiser err reporter (violation list) https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md
    evidence: secondary

  - id: R04
    name: Hexagon / ports-and-adapters concentric map
    short_description: Core in the centre, ports as a ring, adapters outside; touched files placed as dots, IO-importing dots in the core are red.
    shows_checks: [A03, A07, A08, A09]
    data_required: file -> role (core/port/adapter/external), per-file IO categories
    html_feasibility: {type: inline-svg, effort: med}
    scan_time: 3 s (any red dot inside the inner ring)
    injection_rule: signal: repo declares roles core/ports/adapters in rules file, and diff touches core
    anti_use: flat script repos with no core concept (Python scripts); same data as R05 fits better
    origin: Cockburn https://alistaircockburn.com/Articles/Hexagonal-Architecture ; Martin concentric circles https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
    evidence: secondary

  - id: R05
    name: Purity badge row per touched file
    short_description: One chip per changed file: PURE, IO:fs, IO:net, IO:clock, IO:llm..., with a red mark when a pure-declared file carries an IO chip.
    shows_checks: [A07, A08, A09, A10]
    data_required: file, declared role, IO categories found, taint-through flag
    html_feasibility: {type: css, effort: low}
    scan_time: 2 s
    injection_rule: core when any touched file sits in a component marked pure; otherwise signal: diff adds a new IO category to any file (A19-style)
    anti_use: do not use color alone (V33 palette + glyph); never claim "pure" - say "no IO detected" (heuristic)
    origin: Bernhardt FCIS https://www.destroyallsoftware.com/talks/boundaries ; purity analysers https://pypi.org/project/mypy-pure/
    evidence: secondary

  - id: R06
    name: Changed-lines coverage strip (patch coverage bar)
    short_description: A bar per changed file split into covered and uncovered changed lines, plus one total percentage.
    shows_checks: [A11, A13]
    data_required: per file: added lines, covered added lines, uncovered line numbers
    html_feasibility: {type: css, effort: low}
    scan_time: 2 s; extends the existing per-file +/- bar (same row, second bar)
    injection_rule: core when a coverage file exists; else grey card with the A13 test-counterpart column
    anti_use: shown without the absolute count (100 % of 2 lines misleads); no coverage file -> do not show 0 %
    origin: diff-cover console/HTML report https://pypi.org/project/diff-cover/ ; Codecov patch status https://docs.codecov.com/docs/commit-status
    evidence: primary

  - id: R07
    name: Per-line coverage gutter in the diff hunk
    short_description: In the folded hunk view, each added line carries a green or red gutter mark (ran / never ran in tests).
    shows_checks: [A11]
    data_required: hunk lines with hit counts
    html_feasibility: {type: css, effort: low}
    scan_time: 5 s per file, on demand (unfold hunk)
    injection_rule: signal: file has uncovered changed lines (unfolded only for those)
    anti_use: whole-file view of covered code (noise); non-executable lines must be neutral not green
    origin: diff-cover --show-uncovered / HTML with show-covered https://pypi.org/project/diff-cover/ ; Codecov file view
    evidence: primary

  - id: R08
    name: Component coverage bars with delta tick
    short_description: One horizontal bar per component showing coverage, with a tick at the value before the change and an arrow if it moved.
    shows_checks: [A12, A10]
    data_required: per component: coverage now, coverage base (optional), touched flag
    html_feasibility: {type: css, effort: low}
    scan_time: 3 s
    injection_rule: signal: coverage file with base baseline exists; touched components sorted first; fallback shows absolute bars only
    anti_use: components with < ~20 executable lines (ratio is noise: show "n lines")
    origin: Codecov components docs https://docs.codecov.com/docs/components
    evidence: primary

  - id: R09
    name: Coverage sunburst / treemap of the repo
    short_description: Repo as nested folder rings or rectangles sized by lines and coloured red-to-green by coverage, touched files outlined.
    shows_checks: [A12, A11]
    data_required: file tree with executable lines and coverage ratio
    html_feasibility: {type: inline-svg, effort: high (sunburst arcs) / med (squarified treemap)}
    scan_time: 5-8 s; good for exploring, poor for verdict
    injection_rule: reserve (on demand); not part of the review default
    anti_use: small repos (< 30 files); red/green only without glyph/texture (colour-blind)
    origin: Codecov sunburst https://docs.codecov.com/docs/graphs ; coverage-plot treemap https://coverage-plot.readthedocs.io/en/latest/index.html
    evidence: primary (sunburst: slice size = tracked lines, colour green->red)

  - id: R10
    name: Cycle highlight on the component map
    short_description: The existing component map with cycle members ringed and the loop path shown as a bold chain.
    shows_checks: [A15]
    data_required: SCC membership, new-or-existing flag, loop path
    html_feasibility: {type: inline-svg, effort: low (reuses C4 map)}
    scan_time: 2 s
    injection_rule: signal: SCC size > 1 appears or grows at file or component level
    anti_use: type-only cycles (show muted); do not draw when no cycle (A15 = 0 -> one line)
    origin: NDepend ND1400/ND1401 cycle rules https://blog.ndepend.com/identify-net-code-structure-patterns-with-no-effort ; DSM symmetric cells (R02)
    evidence: secondary

  - id: R11
    name: Main-sequence scatter (abstractness vs instability)
    short_description: Dots for each component on an A-vs-I square with the diagonal ideal line; distance from the line is the problem score.
    shows_checks: [A16]
    data_required: per component A, I, touched flag, previous position (arrow)
    html_feasibility: {type: inline-svg, effort: med}
    scan_time: 5 s (needs learning); movement arrows make it a delta view
    injection_rule: reserve; only when >= 8 components and A is computable (typed languages with interfaces)
    anti_use: small plugin/scripts repos (A meaningless; dots cluster at A=0); as verdict without human reading
    origin: Martin metrics https://en.wikipedia.org/wiki/Software_package_metrics ; A vs I graphs https://depfind.sourceforge.io/AvsI.html
    evidence: primary for definition, our judgement for anti-use

  - id: R12
    name: Instability / coupling mini-table with before-after
    short_description: Rows for touched components with fan-in, fan-out, instability before and after, and an arrow when the stable-dependencies rule breaks.
    shows_checks: [A16, A17]
    data_required: per touched component Ca, Ce, I at base and HEAD
    html_feasibility: {type: table, effort: low}
    scan_time: 3 s
    injection_rule: signal: a touched component's Ca+Ce changed by >= 2 or I moved > 0.2
    anti_use: all components shown (noise)
    origin: dependency-cruiser metrics reporter https://github.com/sverweij/dependency-cruiser/blob/main/doc/options-reference.md
    evidence: primary

  - id: R13
    name: Change-coupling pair list ("you touched A, not B")
    short_description: Lists files that usually change together with a touched file but were left out of this change.
    shows_checks: [A18]
    data_required: co-change pairs above threshold, current diff file set
    html_feasibility: {type: table, effort: low}
    scan_time: 3 s
    injection_rule: signal: at least one pair with coupling >= threshold and one side untouched; absent otherwise
    anti_use: bulk/merge commits not filtered; very young repos (< ~30 commits)
    origin: CodeScene change coupling https://codescene.com/blog/change-coupling-visualize-the-cost-of-change
    evidence: secondary

  - id: R14
    name: Hotspot bubble (churn x size, touched ringed)
    short_description: Files as circles sized by lines and shaded by recent change frequency; the touched ones carry a ring.
    shows_checks: [A14, A17, A18]
    data_required: per file LOC, commits in window, touched flag
    html_feasibility: {type: inline-svg, effort: med (circle packing) / low (sorted bars)}
    scan_time: 5 s
    injection_rule: reserve; promote to signal when a touched file ranks in top 10 % churn and has uncovered changed lines
    anti_use: relevance is not defect: must be paired with a health or coverage measure (CodeScene guidance)
    origin: CodeScene hotspots https://codescene.ta.philips.com/docs/guides/technical/hotspots.html
    evidence: secondary

  - id: R15
    name: Rules-verdict summary line (fitness function scoreboard)
    short_description: One row per declared rule (layer order, purity, cycles, size limit, coverage floor) with pass, fail or not-evaluated, and counts.
    shows_checks: [A01, A07, A11, A15, A17, A19]
    data_required: rule id, status, count, link to the detail block
    html_feasibility: {type: table, effort: low}
    scan_time: 1-2 s
    injection_rule: core entry point of C6 (always); "not-evaluated" is explicit when input missing (no coverage, no rules file)
    anti_use: collapsing to a single score (hides which rule failed)
    origin: fitness-function set as automated checks run in pipeline https://www.thoughtworks.com/en-us/insights/articles/fitness-function-driven-development ; Deptrac summary table (violations, uncovered, allowed, errors) https://github.com/qossmic/deptrac/blob/2.0.x/docs/formatters.md
    evidence: primary / secondary
```

# 4. Recipe proposal
```yaml
recipe_proposal:
  core_max4:
    - R15 rules-verdict scoreboard   # always; states "not evaluated" explicitly
    - R03 edge delta list            # new/removed component links with verdicts (A01/A02/A19) - works day 1 without rules file
    - R05 purity badge row           # when any touched file is in a pure-declared component
    - R06 changed-lines coverage strip  # when coverage file exists, else grey card with A13
  signal_triggered:
    - {grammar: R01, trigger: rules file declares layers AND >=1 forbidden or uncovered edge in diff; else shown collapsed}
    - {grammar: R02, trigger: components > 12 OR any cycle}
    - {grammar: R10, trigger: new or grown cycle (A15)}
    - {grammar: R07, trigger: file with uncovered changed lines, unfolded in hunk}
    - {grammar: R08, trigger: coverage baseline available}
    - {grammar: R12, trigger: touched component Ca+Ce delta >= 2 or I delta > 0.2}
    - {grammar: R13, trigger: co-change pair with untouched partner}
    - {grammar: R04, trigger: repo declares core/ports/adapters roles and diff touches core}
  reserve_on_demand: [R09, R11, R14]
  build_order_cheapest_first: [B1 import graph + B2 table, A19, A01/A02, A15, A07/A08, A11 (lcov), A12, A18, A16/A17]
  zero_llm_note: all checks are deterministic; LLM only designates component ids/labels and writes the rules file once (reviewed by Mat), never at review time

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

# 5. Gaps
```yaml
gaps:
  - Stint tests run through "claude plugin test", not a runner producing lcov: whether any coverage file can be obtained for TS hooks is unknown. If not, A11/A12/A14/R06-R08 degrade to A13 (test counterpart) only. Must check on /repos/stint, not done here.
  - TS under Node type stripping / loaders: line numbers in lcov vs source lines not verified.
  - Bun and Deno lcov output not found in search; Python stdlib line coverage without coverage.py only via sys.monitoring hook (CPython Lib/test/cov.py as pattern) or trace module - not verified usable for review.
  - No canonical IO module list exists in any source found; the list in section 4 is ours and needs a pass by Mat.
  - Regex import parsing accuracy (multi-line imports, re-exports, `import type`, dynamic import) not benchmarked; no source found. With explicit .ts imports it should be adequate; needs a forced test case on the stint repo.
  - eslint-plugin-boundaries: search results disagree on rule name (element-types vs dependencies); not needed since npm install is out.
  - Structurizr DSL cannot tell code-vs-model conformance by itself (only workspace validation, Java CLI); A06 drift is our composition, no prior art confirmed.
  - Martin metrics thresholds vary by author; abstractness meaningless for script-style code.
  - Pure-core test benefit (A10) relies on Bernhardt talk; transcript not read, only page description.
  - Hexagonal original article body not retrieved (page fetch returned no text); intent taken from secondary summaries.
  - Not researched: mutation testing, branch coverage per component, API-surface/export-diff, secrets/security rules, runtime (dynamic) architecture checks (holistic/continual fitness functions are out of review-time scope).
  - Not tested: any of the scripts above; no code was run.

sources_list:
  - https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md
  - https://github.com/sverweij/dependency-cruiser/blob/main/doc/options-reference.md
  - https://import-linter.readthedocs.io/en/stable/contract_types/
  - https://github.com/seddonym/grimp/blob/master/docs/usage.rst
  - https://github.com/LukasNiessen/ArchUnitTS
  - https://pypi.org/project/diff-cover/
  - https://lethain.com/building-evolutionary-architectures/
  - https://www.thoughtworks.com/en-us/insights/articles/fitness-function-driven-development
  - https://en.wikipedia.org/wiki/Software_package_metrics
  - https://depfind.sourceforge.io/AvsI.html
  - https://www.destroyallsoftware.com/talks/boundaries
  - https://forum.elixirforum.com/t/boundaries-by-gary-bernhardt-ruby-conf-2012/13145
  - https://alistaircockburn.com/Articles/Hexagonal-Architecture
  - https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
  - https://github.com/qossmic/deptrac/blob/2.0.x/docs/concepts.md
  - https://github.com/qossmic/deptrac/blob/2.0.x/docs/formatters.md
  - https://github.com/javierbrea/eslint-plugin-boundaries
  - https://codescene.com/blog/change-coupling-visualize-the-cost-of-change
  - https://codescene.ta.philips.com/docs/guides/technical/hotspots.html
  - https://codescene.ta.philips.com/docs/terminology/codescene-terminology.html
  - https://nodejs.org/en/learn/test-runner/collecting-code-coverage
  - https://github.com/nodejs/node/commit/c9b92bba58
  - https://docs.codecov.com/docs/commit-status
  - https://docs.codecov.com/docs/components
  - https://docs.codecov.com/docs/graphs
  - https://coverage-plot.readthedocs.io/en/latest/index.html
  - http://groups.csail.mit.edu/sdg/pubs/2005/oopsla05-dsm.pdf
  - https://docs.scitools.com/help/dependencies/dependency-matrix.html
  - https://www.lattix.com/wp-content/uploads/2024/03/DesignRules.pdf
  - https://arxiv.org/pdf/2106.03079
  - https://blog.ndepend.com/identify-net-code-structure-patterns-with-no-effort
  - https://github.com/EnderHub/jscycles
  - https://remotebranch.eu/Stowage/cpython/raw/branch/main/Lib/test/cov.py
  - https://docs.structurizr.com/validate
  - https://pypi.org/project/mypy-pure/
  - https://hex.pm/packages/pure_fun/0.1.0/files
  - https://docs.rs/crate/debtmap/0.17.0/source/src/analyzers/purity_detector/detector.rs
```
