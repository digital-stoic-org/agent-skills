---
description: Convert PDF files to LLM-ready formats using Docling (markdown/DocTags/JSON)
# ⚠️ STATUS: needs-review (migrated from v0.1)
---

# Convert PDF Command

Convert PDF files to LLM-optimized formats using IBM's Docling toolkit.

## Default Settings

- **Output format**: Markdown (token-efficient, human-readable)
- **Image mode**: Placeholder (minimal tokens)
- **Output directory**: `./converted/`

## Instructions

1. **Check Docling installation**
   - Verify: `source .venv/bin/activate 2>/dev/null; python -m pip show docling`
   - If missing: Invoke `install-dependency` skill with package="docling" type="python"
   - The skill will create `.venv/` if needed and install docling properly

2. **Gather user requirements**
   - Files to convert (accept paths, globs, or current directory `*.pdf`)
   - Output format (default: markdown, options: doctags, json, html, text)
   - Special options: OCR needed? VLM pipeline for complex layouts?

3. **Prepare output directory**
   - Create `./converted/` if missing
   - Organize by format if multiple formats requested

4. **Process files**

   **Activate venv first**:
   ```bash
   source .venv/bin/activate
   ```

   **Single file**:
   ```bash
   docling --to markdown --image-export-mode placeholder input.pdf -o converted/
   ```

   **Batch processing**:
   ```bash
   docling --to markdown --image-export-mode placeholder --num-threads 8 *.pdf -o converted/
   ```

   **With VLM pipeline** (better quality for complex PDFs):
   ```bash
   docling --pipeline vlm --vlm-model granite_docling --to markdown input.pdf -o converted/
   ```

   **DocTags format** (most token-efficient):
   ```bash
   docling --to doctags --image-export-mode placeholder input.pdf -o converted/
   ```

5. **Report results**
   - List converted files with paths
   - Show file sizes (original vs converted)
   - Estimate token savings if format is doctags/markdown
   - Mention any errors or warnings

## Format Selection Guide

| Format | Best For | Token Efficiency |
|--------|----------|------------------|
| **doctags** | RAG, structured extraction | Highest (30-50% less than MD) |
| **markdown** | Human review, general LLM context | High (balanced) |
| **json** | Lossless structure preservation | Medium (verbose) |
| **html** | Web rendering | Low |

## Advanced Options

**OCR** (if PDF has scanned images):
```bash
docling --ocr --ocr-engine easyocr --to markdown input.pdf -o converted/
```

**Force OCR** (replace existing text):
```bash
docling --force-ocr --to markdown input.pdf -o converted/
```

**No table extraction** (faster):
```bash
docling --no-tables --to markdown input.pdf -o converted/
```

## Notes

- Default to markdown + placeholder images unless user specifies otherwise
- For batch jobs >10 files, use `--num-threads` to parallelize
- VLM pipeline is slower but more accurate for complex layouts
- DocTags is optimal for RAG pipelines and structured LLM workflows
