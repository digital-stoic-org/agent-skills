---
description: Create baseline context from .in/ folder with manifest-driven organization (run once per project)
allowed-tools:
  - Read
  - Write
  - Glob
  - Bash
  - AskUserQuestion
  - Task
argument-hint: "[--force to overwrite existing .ctx/]"
---

# Create Context

Bootstrap project context from `.in/` folder → `.ctx/` snapshot + baseline + RISEN INPUT table.

## Folder Architecture

- **`.in/`**: Immutable bootstrap (user dumps raw docs here, never modified by commands)
- **`.ctx/`**: Actionable snapshot (generated: manifest + summaries + copied files)

## Workflow

### 1. Prerequisites

```bash
[ -d .in/ ] || error "No .in/ folder found. Create it and add source files first."
[ -d .ctx/ ] && [ "$1" != "--force" ] && error ".ctx/ exists. Use --force to recreate."
```

**Skip security-sensitive files**: `.env*`, `*credentials*`, `*secrets*`, `*token*`, `*.key`, `*.pem`, `*.crt`

### 2. Scan & Prioritize

1. **Glob**: `.in/**/*.{md,txt,csv,yaml,json}` (includes subdirs like `google-in/`)
2. **AskUserQuestion** per file:

| Option | Action |
|--------|--------|
| HIGH | Copy to `.ctx/`, inline if ≤1500 tokens, else summarize |
| MEDIUM | Copy to `.ctx/`, inline if ≤2500 tokens, else summarize |
| LOW | Reference only (path to `.in/`, no content copied) |

3. Ask brief description (1-2 sentences) per file

### 3. Create .ctx/ Snapshot

```bash
mkdir -p .ctx
```

### 4. Generate Manifest

Write `.ctx/manifest.yaml`:

```yaml
project: {basename $PWD}
created: {ISO 8601}
source_folder: .in/
sources:
  high: [{file: path, desc: description, action: inline|summarized}]
  medium: [{file: path, desc: description, action: inline|summarized}]
  low: [{file: path, desc: description}]
tags: {}
```

### 5. Context Sizing & Copy

**Token estimation**:
```bash
# Get word count and estimate tokens
words=$(wc -w < ".in/{file}")
tokens=$((words * 100 / 75))  # words / 0.75, using integer math
```

**Sizing decision matrix**:

```
For each file with assigned priority:

IF priority == LOW:
    → reference[] (no copy, path only)

IF priority == HIGH:
    IF tokens ≤ 1500:
        → inline[] (copy + embed in baseline)
    ELIF tokens ≤ 25000:
        → summarize_direct[] (copy + summarize directly)
    ELSE:
        → summarize_agent[] (copy + delegate to sub-agent)

IF priority == MEDIUM:
    IF tokens ≤ 2500:
        → inline[] (copy + embed in baseline)
    ELIF tokens ≤ 25000:
        → summarize_direct[] (copy + summarize directly)
    ELSE:
        → summarize_agent[] (copy + delegate to sub-agent)
```

**Copy HIGH/MEDIUM files to `.ctx/`**:
```bash
# Preserve subdirectory structure
for file in inline[] + summarize_direct[] + summarize_agent[]:
    mkdir -p ".ctx/$(dirname $file)"
    cp ".in/$file" ".ctx/$file"
```

**Report sizing results**:
```
Context sizing complete:
- Inline (embed): {n} files ({total_tokens} tokens)
- Summarize direct: {n} files (≤25K each)
- Summarize via agent: {n} files (>25K each)
- Reference only: {n} files (LOW priority)
```

### 6. Summarize (if needed)

**Direct summarization** (files in `summarize_direct[]`, ≤25K tokens):

For each file:
1. Read entire file content
2. Generate summary (~500 tokens target)
3. Write to `.ctx/{nn}-{basename}-summary-llm.md` (nn = sequence number)

```markdown
# Summary: {filename}

{file_desc from manifest}

## Key Points

- [extracted point 1]
- [extracted point 2]
...

---
*Source: .in/{original_path} ({token_count} tokens)*
```

**Sub-agent summarization** (files in `summarize_agent[]`, >25K tokens):

For each file:
```
Task(
  subagent_type="summarize-for-context",
  prompt="Summarize this file for context baseline:
- file_path: {absolute_path_to_.ctx/file}
- target_tokens: 500
- file_desc: {description from manifest}",
  model="haiku"
)
```

Write returned summary to `.ctx/{nn}-{basename}-summary-llm.md`

**Naming convention**: `01-`, `02-`, etc. for sort order in `.ctx/`

### 7. Write Baseline

Create `CONTEXT-baseline-llm.md`:

```markdown
# Baseline Context

saved: {ISO 8601 timestamp}
stream: baseline
manifest: .ctx/manifest.yaml
source: .in/

## Project

```yaml
ref: .ctx/manifest.yaml
source_folder: .in/
files: {total_count}
```

## Sources (inline)

{For each file in inline[]:}
### {filename}

{Full content from .ctx/{file}}

## Sources (summarized)

{For each file in summarize_direct[] + summarize_agent[]:}
### {filename}

See: `.ctx/{nn}-{basename}-summary-llm.md`

{Include summary content OR reference path}

## Sources (reference only)

{For each file in reference[]:}
- `.in/{path}`: {description}

## Refs

```yaml
manifest: .ctx/manifest.yaml
summaries: [.ctx/01-*.md, .ctx/02-*.md, ...]
source: .in/
```
```

**Token budget**: Aim for ≤2000 tokens total (inline content is the variable)

### 8. Output

```
✅ Baseline created: CONTEXT-baseline-llm.md
📁 .ctx/ snapshot created:
   - manifest.yaml
   - {n} copied files
   - {n} summaries
📋 Files: {n} inline, {n} summarized, {n} referenced

🎯 RISEN INPUT (copy-paste):
| Priority | File | Description |
|----------|------|-------------|
| 1 (HIGH) | @.ctx/{path} | {desc} |
| 2 (MED)  | @.ctx/{path} | {desc} |
| 3 (LOW)  | @.in/{path} | {desc} |

Next: Review manifest → /save-context baseline
```

## Error Messages

| Check | Message |
|-------|---------|
| `[ -d .in/ ]` | "No .in/ folder found. Create it and add source files first." |
| `ls .in/` empty | "No files in .in/ folder. Add documents first." |
| `[ -d .ctx/ ]` | ".ctx/ exists. Use --force to recreate." |

## Related

- `/save-context [stream]` - Save session to named stream
- `/load-context [stream]` - Load saved stream
- `scripts/validate-manifest.sh` - Validate manifest schema
- `.claude/agents/summarize-for-context.md` - Sub-agent for large files
