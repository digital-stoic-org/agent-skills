---
description: Convert PowerPoint (.pptx) files to clean markdown for LLM context (uses markitdown)
argument-hint: <pptx-file> [output-dir]
allowed-tools: Bash, Read, Write, Skill
model: haiku
---

Convert the PowerPoint file at $1 to clean markdown format optimized for LLM context.

## Steps

1. **Install dependency**: Use the `dstoic:install-dependency` skill to ensure `markitdown` Python package is installed in the project venv
2. **Parse arguments**:
   - Input file: $1 (required)
   - Output directory: $2 (optional, defaults to `./converted/`)
3. **Prepare output directory**: Create `$2` (or `./converted/` if not specified)
4. **Convert PPTX**:
   ```bash
   source .venv/bin/activate && python -m markitdown "$1" -o "$OUTPUT_DIR/output.md"
   ```
   Where `$OUTPUT_DIR` is the resolved output directory from step 3.

5. **Report results**:
   - Output location and file paths
   - File sizes (original vs converted)
   - Structure summary: slide count, headings, tables, images found
   - Any warnings (missing content, unsupported elements)

## Goal

Extract clean, structured markdown suitable for LLM context — analysis, summarization, or question-answering. NOT for visual rendering or round-tripping back to PPTX.

## Usage Examples

```bash
/convert-pptx path/to/presentation.pptx
/convert-pptx slides.pptx ./my-output/
```

## Notes

- No content is sent to any LLM during conversion (pure script-based extraction)
- markitdown extracts text, tables, and structure — images become placeholders
