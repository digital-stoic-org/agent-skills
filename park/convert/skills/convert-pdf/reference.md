# convert-pdf Reference

## Backend Comparison

| | pdftotext | docling |
|---|---|---|
| Speed | ~1s | 10-60s |
| Token output | 3-10x smaller | Verbose |
| Text PDFs | ✅ | Overkill |
| Scanned/OCR | ❌ | ✅ |
| Complex tables | ⚠️ Alignment only | ✅ Structured |
| Multi-column | ⚠️ Approximate | ✅ Layout-aware |
| Install | `poppler-utils` (pre-installed) | `pip install docling` |

## Auto-Detect Decision Tree

```
Input PDF
  ├─ --docling / --ocr / --complex → docling
  ├─ pdftotext 3-page probe < 100 chars → docling (scanned)
  └─ default → pdftotext + post-process
```

## Docling Advanced Options

```bash
# Force OCR (replace existing text)
docling --to md --force-ocr --output DIR input.pdf

# VLM pipeline (best quality, slowest)
docling --pipeline vlm --vlm-model granite_docling --to md --output DIR input.pdf

# Skip table extraction (faster)
docling --to md --no-tables --output DIR input.pdf
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| 0-byte output | stdout redirect on docling | Use `--output DIR`, no `>` |
| Empty markdown | Scanned PDF + pdftotext | Retry with `--ocr` |
| Files in project root | Missing `--output` | Always pass `--output ./converted/` |
| `command not found` | docling not in PATH | `toolsmith:install-dependency docling` |
| Wrong format | `--to markdown` | Use `--to md` |
