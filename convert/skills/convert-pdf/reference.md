# convert-pdf Reference

## Format Selection Guide

| Format | Best For | Token Efficiency |
|--------|----------|------------------|
| **doctags** | RAG, structured extraction | Highest (30-50% less than MD) |
| **markdown** | Human review, general LLM context | High (balanced) |
| **json** | Lossless structure preservation | Medium (verbose) |
| **html** | Web rendering | Low |

## Batch Processing

```bash
source .venv/bin/activate
docling --to markdown --image-export-mode placeholder --num-threads 8 *.pdf -o converted/
```

For batch jobs >10 files, use `--num-threads` to parallelize.

## VLM Pipeline (Complex Layouts)

Better quality for complex PDFs (slower):

```bash
docling --pipeline vlm --vlm-model granite_docling --to markdown input.pdf -o converted/
```

## DocTags Format (Most Token-Efficient)

```bash
docling --to doctags --image-export-mode placeholder input.pdf -o converted/
```

## OCR Options

**Standard OCR** (scanned images):
```bash
docling --ocr --ocr-engine easyocr --to markdown input.pdf -o converted/
```

**Force OCR** (replace existing text):
```bash
docling --force-ocr --to markdown input.pdf -o converted/
```

## Performance

**No table extraction** (faster):
```bash
docling --no-tables --to markdown input.pdf -o converted/
```

## Notes

- Default to markdown + placeholder images unless user specifies otherwise
- VLM pipeline is slower but more accurate for complex layouts
- DocTags is optimal for RAG pipelines and structured LLM workflows
