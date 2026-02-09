# Research Protocol

Multi-angle investigation for each sub-problem. Goal: evidence-based understanding, not guessing.

## Kepner-Tregoe IS / IS NOT

Systematically bound the problem space before theorizing.

### Template

| Dimension | IS (observed) | IS NOT (not observed) | Implication |
|-----------|---------------|----------------------|-------------|
| **What** | What objects/data are affected? | What similar objects are NOT? | |
| **Where** | Where does it occur? | Where does it NOT? | |
| **When** | When does it happen? | When does it NOT? | |
| **Extent** | How much/many? | How much is NOT affected? | |

### How to use

1. Fill IS column first (facts only, not theories)
2. Fill IS NOT column (what you'd expect to be affected but isn't)
3. **The gap between IS and IS NOT reveals the cause** — what's unique about the IS cases?
4. Generate hypotheses that explain ALL IS facts and NONE of the IS NOT facts

### Example: Data bar inaccuracy

| Dimension | IS | IS NOT | Implication |
|-----------|-----|--------|-------------|
| What | 1-min bars show wrong OHLC | Daily bars are accurate | Aggregation or real-time feed issue |
| Where | Live paper trading | Backtesting with same data | Environment-specific (feed vs historical) |
| When | During high-volume market open | During low-volume midday | Likely related to tick volume/latency |
| Extent | ~5% of bars affected | 95% are correct | Intermittent — race condition or timeout |

## Multi-Source Research Strategy

### For each sub-problem

1. **WebSearch** (3 targeted queries):
   - `[technology] [specific problem] best practice`
   - `[technology] [problem] production experience site:github.com OR site:stackoverflow.com`
   - `[technology] [problem] pitfall OR gotcha OR lesson`

2. **Codebase analysis** (if applicable):
   - Glob: Find relevant source files
   - Grep: Search for related patterns, config, error handling
   - Read: Understand actual implementation

3. **Documentation check**:
   - Official docs for the technology
   - Known limitations / caveats sections

### Synthesize into findings matrix

| Sub-problem | Approach A | Approach B | Evidence |
|-------------|-----------|-----------|----------|
| Sub-problem 1 | Option... | Option... | Source... |
| Sub-problem 2 | Option... | Option... | Source... |

## OODA for Iterative Probing

When initial research is insufficient, iterate:

```
Observe → Orient → Decide → Act → (loop)
```

- **Observe**: What did the research reveal? What's still unknown?
- **Orient**: Update mental model. What hypotheses survive the evidence?
- **Decide**: What's the highest-value next query/experiment?
- **Act**: Execute the search or analysis
- **Loop**: Max 3 iterations before moving to Design with current knowledge

## Parallel Research with Sub-Agents

For independent sub-problems, use Task tool to launch parallel investigations:

```
Task(subagent_type="Explore", prompt="Research [sub-problem X]: ...")
Task(subagent_type="Explore", prompt="Research [sub-problem Y]: ...")
```

Merge findings into unified matrix before Design phase.
