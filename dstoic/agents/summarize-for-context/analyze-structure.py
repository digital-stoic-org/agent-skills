#!/usr/bin/env python3
"""
Analyze file structure for summarization.
Outputs JSON with file metadata and section breakdown.

Usage: python3 analyze-structure.py <file_path>
"""

import sys
import json
import re
from pathlib import Path

def detect_file_type(content: str, filename: str) -> str:
    """Detect file type from content and extension."""
    ext = Path(filename).suffix.lower()

    if ext == '.csv':
        return 'csv'
    if ext in ('.md', '.markdown'):
        # Transcript: [S1], [S 1], [ S1 ], etc. - flexible spacing
        if re.search(r'\[\s*S\s*\d+', content[:2000]):
            return 'transcript'
        if re.search(r'^#{1,3}\s', content, re.MULTILINE):
            return 'markdown'
        return 'markdown'
    if ext == '.txt':
        return 'text'
    return 'unknown'

def extract_sections_markdown(content: str) -> list:
    """Extract sections from markdown headers."""
    sections = []
    pattern = r'^(#{1,3})\s+(.+?)$'
    matches = list(re.finditer(pattern, content, re.MULTILINE))

    for i, match in enumerate(matches):
        level = len(match.group(1))
        title = match.group(2).strip()
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(content)
        section_content = content[start:end].strip()
        word_count = len(section_content.split())

        sections.append({
            'level': level,
            'title': title[:80],
            'word_count': word_count,
            'preview': section_content[:150].replace('\n', ' ')
        })

    return sections[:30]  # Limit to 30 sections

def extract_sections_transcript(content: str) -> list:
    """Extract sections from transcript format [S1], [S2], etc. with flexible spacing."""
    sections = []
    # Match [S1], [S 1], [ S 1- 2], etc.
    pattern = r'\[\s*S\s*(\d+)[^\]]*\]\s*([^\[]+?)(?=\[\s*S|\Z)'
    matches = re.findall(pattern, content, re.DOTALL)

    for num, section_content in matches[:30]:
        # Clean up the content (remove excessive whitespace)
        cleaned = ' '.join(section_content.split())
        words = cleaned.split()
        title = ' '.join(words[:10]) if words else ''
        word_count = len(words)
        preview = ' '.join(words[:25])

        sections.append({
            'section_num': int(num),
            'title': title[:80],
            'word_count': word_count,
            'preview': preview[:150]
        })

    return sections

def extract_sections_csv(content: str) -> list:
    """Extract CSV structure."""
    lines = content.strip().split('\n')
    if not lines:
        return []

    header = lines[0] if lines else ''
    columns = [c.strip() for c in header.split(',')]

    return [{
        'type': 'csv',
        'columns': columns[:10],
        'row_count': len(lines) - 1,
        'preview': '\n'.join(lines[:3])
    }]

def analyze_file(file_path: str) -> dict:
    """Main analysis function."""
    path = Path(file_path)

    if not path.exists():
        return {'error': f'File not found: {file_path}'}

    try:
        content = path.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        return {'error': 'Binary file detected, cannot summarize'}

    if not content.strip():
        return {'error': 'Empty file, no content to summarize'}

    lines = content.split('\n')
    words = content.split()
    estimated_tokens = int(len(words) * 100 / 75)

    file_type = detect_file_type(content, path.name)

    if file_type == 'transcript':
        sections = extract_sections_transcript(content)
    elif file_type == 'csv':
        sections = extract_sections_csv(content)
    else:
        sections = extract_sections_markdown(content)

    return {
        'file': path.name,
        'path': str(path.absolute()),
        'type': file_type,
        'lines': len(lines),
        'words': len(words),
        'estimated_tokens': estimated_tokens,
        'sections': sections,
        'needs_chunking': len(lines) > 2000,
        'chunk_count': max(1, (len(lines) + 1949) // 1950)
    }

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Usage: analyze-structure.py <file_path>'}))
        sys.exit(1)

    result = analyze_file(sys.argv[1])
    print(json.dumps(result, indent=2, ensure_ascii=False))
