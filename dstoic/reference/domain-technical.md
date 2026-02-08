# Technical Domain Framework

Use this framework when analyzing sessions focused on technical work: coding, architecture, debugging, tool adoption, and technical decision-making.

## Analysis Dimensions

### 1. Architecture & Design Decisions

**Key questions:**
- What architectural patterns were discovered, adopted, or abandoned?
- What design decisions were made and what was their rationale?
- What trade-offs were considered between different architectural approaches?
- How did design decisions impact implementation complexity or maintainability?
- What would you do differently knowing what you know now?

**Look for:**
- Component boundaries and interaction patterns
- Data flow and state management approaches
- API design choices and their consequences
- Scalability and performance considerations
- Separation of concerns and modularity decisions

### 2. Code Quality & Patterns

**Key questions:**
- What coding patterns emerged as effective or problematic?
- What refactoring opportunities were identified or executed?
- What technical debt was discovered, created, or paid down?
- What code smells or anti-patterns were encountered?
- What quality improvements had the most impact?

**Look for:**
- Naming conventions and code organization
- Error handling and validation patterns
- Testing strategies and coverage decisions
- Code reusability and DRY principle applications
- Readability vs. performance trade-offs

### 3. Tools & Libraries

**Key questions:**
- What tools or libraries were adopted and why?
- What tools or libraries were abandoned and why?
- What integration challenges were encountered?
- What developer experience improvements were gained or lost?
- What would you recommend to others facing similar choices?

**Look for:**
- Build tools and workflow automation
- Testing frameworks and utilities
- Development dependencies and their impact
- Tool configuration and customization
- Migration paths and compatibility issues

### 4. Bugs & Edge Cases

**Key questions:**
- What bugs revealed gaps in understanding?
- What edge cases were discovered that weren't initially considered?
- What debugging approaches were effective or ineffective?
- What preventive measures could avoid similar issues?
- What lessons from this bug apply more broadly?

**Look for:**
- Root cause patterns (logic errors, race conditions, data issues)
- Assumptions that turned out to be wrong
- Missing validation or error handling
- Test coverage gaps
- Documentation or specification ambiguities

### 5. Technical Debt & Trade-offs

**Key questions:**
- What shortcuts were taken consciously and why?
- What technical debt was inherited vs. created?
- What is the actual vs. perceived cost of this debt?
- What debt should be prioritized for paydown?
- What "quick fixes" created more problems than they solved?

**Look for:**
- Time pressure decisions and their consequences
- Temporary solutions that became permanent
- Refactoring opportunities identified
- Maintenance burden assessments
- Cost-benefit analysis of paydown efforts

## Start/Stop/Continue Framework (Technical)

### Start (New Practices to Adopt)
- New architectural patterns that proved effective
- Testing strategies that caught important issues
- Tools or workflows that improved productivity
- Design approaches that reduced complexity
- Code quality practices worth institutionalizing

### Stop (Practices to Eliminate)
- Anti-patterns that caused problems
- Tools or dependencies that created more friction than value
- Design approaches that increased complexity unnecessarily
- Technical shortcuts that backfired
- Debugging approaches that wasted time

### Continue (Effective Practices to Maintain)
- Architectural decisions that continue to serve well
- Code quality practices that are paying dividends
- Tools and workflows that remain productive
- Testing strategies that provide good ROI
- Technical practices that prevent issues proactively

## Output Structure for Technical Insights

When writing technical domain retrospectives, structure your analysis as:

1. **Architecture Insights**: Key design decisions and their outcomes
2. **Code Quality Learnings**: Patterns, refactorings, and debt observations
3. **Tool Effectiveness**: What tools helped or hindered progress
4. **Bug Lessons**: What bugs taught about the system and approach
5. **Technical Start/Stop/Continue**: Concrete recommendations for future work

Focus on **extracting lessons that apply beyond this specific codebase** - patterns and anti-patterns that inform future technical decision-making.
