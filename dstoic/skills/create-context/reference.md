# create-context Reference

## Manifest Schema (.ctx/manifest.yaml)

```yaml
project: string                    # Auto-inferred from directory
created: ISO8601                   # Timestamp of creation
source_folder: .in/                # Reference to immutable bootstrap folder

sources:
  high:                            # ≤1500 tokens inline, >1500 summarized
    - file: string                 # Path relative to .in/
      desc: string                 # Human-readable description
      action: inline|summarized    # Auto-set based on size
  medium:                          # ≤2500 tokens inline, >2500 summarized
    - file: string
      desc: string
      action: inline|summarized
  low:                             # Reference only, no content copied
    - file: string
      desc: string

tags:                              # Optional categorization
  category_name: [file1, file2]
```

## Context Sizing Behavior

| Priority | Token Count | Action |
|----------|-------------|--------|
| HIGH | ≤1500 | Copy to `.ctx/`, inline in baseline |
| HIGH | >1500, ≤25K | Copy to `.ctx/`, summarize directly |
| HIGH | >25K | Copy to `.ctx/`, summarize via sub-agent |
| MEDIUM | ≤2500 | Copy to `.ctx/`, inline in baseline |
| MEDIUM | >2500, ≤25K | Copy to `.ctx/`, summarize directly |
| MEDIUM | >25K | Copy to `.ctx/`, summarize via sub-agent |
| LOW | any | Reference only (path to `.in/`, no copy) |

**Token estimation**: `tokens ≈ words / 0.75` (using `wc -w`)

**25K limit**: Files exceeding this use `summarize-for-context` sub-agent with chunked reads.

## Baseline Template (CONTEXT-baseline-llm.md)

```markdown
# Baseline Context

saved: {ISO 8601 timestamp}
stream: baseline
manifest: .ctx/manifest.yaml
source: .in/

## Project

ref: .ctx/manifest.yaml
source_folder: .in/
files: {total_count}

## Sources (inline)

### {filename}
{Full content from .ctx/{file}}

## Sources (summarized)

### {filename}
See: `.ctx/{nn}-{basename}-summary-llm.md`

## Sources (reference only)

- `.in/{path}`: {description}

## Refs

manifest: .ctx/manifest.yaml
summaries: [.ctx/01-*.md, .ctx/02-*.md, ...]
source: .in/
```

**Token budget**: ≤2000 tokens total.

## Validation Rules

1. **Required**: project, created, source_folder, sources (high/medium/low)
2. **File paths**: Relative to `.in/`, must exist at generation time
3. **Descriptions**: Required, non-empty, concise (1-2 sentences)
4. **Action field**: Auto-set, user can override
5. **Tags**: Optional, keys alphanumeric/hyphens/underscores
6. **All priority sections**: Must be present (can be empty arrays)

## Security

Auto-skipped: `.env*`, `*credentials*`, `*secrets*`, `*token*`, `*.key`, `*.pem`, `*.crt`

## RISEN INPUT Table (output)

```markdown
| Priority | File | Description |
|----------|------|-------------|
| 1 (HIGH) | @.ctx/proposal.md | Main objectives |
| 2 (MED) | @.ctx/style-guide.md | Style reference |
| 3 (LOW) | @.in/old-notes.md | Background (ref only) |
```

## Scripts

- `scripts/scan-in-folder.sh` — Scan .in/ for supported files
- `scripts/validate-manifest.sh` — Validate manifest schema

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
