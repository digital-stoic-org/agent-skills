#!/usr/bin/env python3
"""
PII and Business Data Detection Script

Detects PII and sensitive business information using Scrubadub, spaCy NER,
and custom regex patterns.

Usage:
    python detect.py <file_path>

Output:
    JSON report to stdout, formatted report to stderr
"""

import sys
import json
import re
from pathlib import Path
from typing import List, Dict, Tuple

try:
    import scrubadub
except ImportError:
    print("Error: scrubadub not installed. Run: pip install scrubadub", file=sys.stderr)
    sys.exit(1)

try:
    import spacy
except ImportError:
    print("Error: spacy not installed. Run: pip install spacy", file=sys.stderr)
    sys.exit(1)

try:
    from langdetect import detect, LangDetectException
except ImportError:
    print("Error: langdetect not installed. Run: pip install langdetect", file=sys.stderr)
    sys.exit(1)


class PIIDetector:
    """Detects PII using Scrubadub"""

    SEVERITY_MAP = {
        'high': {'SSN', 'CREDIT_CARD', 'PASSWORD'},
        'medium': {'EMAIL', 'PHONE', 'ADDRESS', 'IP'},
    }

    def __init__(self):
        self.scrubber = scrubadub.Scrubber()

    def detect(self, text: str) -> List[Dict]:
        entities = []
        for filth in self.scrubber.iter_filth(text):
            entity_type = filth.type.upper()
            entities.append({
                'type': entity_type,
                'category': 'PII',
                'text': filth.text,
                'start': filth.beg,
                'end': filth.end,
                'severity': self._get_severity(entity_type)
            })
        return entities

    def _get_severity(self, entity_type: str) -> str:
        for level, types in self.SEVERITY_MAP.items():
            if entity_type in types:
                return level
        return 'low'


class BusinessDataDetector:
    """Detects business entities using spaCy NER and custom patterns"""

    # Supported language models
    LANGUAGE_MODELS = {
        'en': 'en_core_web_md',
        'fr': 'fr_core_news_md',
    }

    NAME_PATTERNS = [
        # Structured contexts with name labels
        r'(?:Name|Author|Contact|Owner|Manager|Director|CEO|CTO|CFO|VP|President|Leader):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)',
        # Email-like patterns (extract name before @)
        r'\b([A-Z][a-z]+\.[A-Z][a-z]+)@',
        # Possessive forms
        r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'s\b",
        # Initials with periods (J. Doe, J.R.R. Tolkien)
        r'\b([A-Z]\.(?:\s*[A-Z]\.)*\s+[A-Z][a-z]+)\b',
        # By/From patterns
        r'(?:by|from|written by|created by|submitted by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)',
    ]

    FINANCIAL_PATTERNS = {
        'REVENUE': [
            r'(\$|€|£|USD|EUR|GBP)\s*[\d,]+\.?\d*\s*([KMB])?\s*(revenue|annual revenue|ARR|MRR|sales)',
        ],
        'COSTS': [
            r'(\$|€|£|USD|EUR|GBP)\s*[\d,]+\.?\d*\s*([KMB])?\s*(cost|costs|operating costs|budget|expenses|OPEX|CAPEX)',
        ],
        'MARKET_SIZE': [
            r'(\$|€|£|USD|EUR|GBP)\s*[\d,]+\.?\d*\s*([KMB])?\s*(market|market size|TAM|SAM|SOM)',
            r'[\d.]+%\s*(market share|of market|market penetration)',
        ],
        'PRICING': [
            r'(\$|€|£|USD|EUR|GBP)\s*[\d,]+\.?\d*\s*(per|/)\s*(month|year|license|user|seat|day)',
        ],
        'FINANCIAL_PCT': [
            r'[\d.]+%\s*(margin|profit margin|growth|CAGR|ROI|return|increase|decrease)',
        ],
        'HEADCOUNT': [
            r'\d+\s*(employees|FTEs|staff|team members|headcount)',
            r'team of \d+',
        ],
    }

    DEPARTMENTS = [
        'Engineering', 'Development', 'Dev', 'R&D', 'Product Engineering',
        'Sales', 'Business Development', 'BD',
        'Marketing', 'Growth', 'Demand Gen',
        'Human Resources', 'HR', 'People Ops', 'Talent',
        'Finance', 'Accounting', 'FP&A',
        'Operations', 'Ops', 'Customer Success', 'Support',
        'Legal', 'Compliance',
        'IT', 'Information Technology', 'Infrastructure',
        'Executive', 'Leadership', 'C-Suite',
    ]

    BUSINESS_SEVERITY = {
        'high': {'REVENUE', 'COSTS', 'MARKET_SIZE', 'MONETARY_VALUE'},
        'medium': {'PRICING', 'FINANCIAL_PCT', 'HEADCOUNT', 'DEPARTMENT'},
    }

    SPACY_LABEL_MAP = {
        'ORG': ('COMPANY', 'BUSINESS', 'high'),
        'PERSON': ('PERSON_NAME', 'PII', 'medium'),
        'MONEY': ('MONETARY_VALUE', 'BUSINESS', 'high'),
        'DATE': ('DATE', 'BUSINESS', 'low'),
    }

    def __init__(self, text: str = None):
        """Initialize detector with optional text for language detection"""
        self.nlp = None
        self.detected_language = None

        if text:
            self._load_model_for_text(text)
        else:
            # Default to English if no text provided
            self._load_model('en')

    def _detect_language(self, text: str) -> str:
        """Detect language of text, return language code"""
        try:
            # Use first 1000 chars for detection (performance)
            sample = text[:1000]
            lang = detect(sample)

            # Map to supported languages, default to 'en'
            if lang in self.LANGUAGE_MODELS:
                return lang
            else:
                print(f"Detected language '{lang}' not supported, falling back to English", file=sys.stderr)
                return 'en'
        except LangDetectException:
            print("Language detection failed, defaulting to English", file=sys.stderr)
            return 'en'

    def _load_model_for_text(self, text: str):
        """Detect language and load appropriate model"""
        self.detected_language = self._detect_language(text)
        self._load_model(self.detected_language)

    def _load_model(self, lang_code: str):
        """Load spaCy model for given language code"""
        model_name = self.LANGUAGE_MODELS.get(lang_code, 'en_core_web_md')
        try:
            self.nlp = spacy.load(model_name)
            print(f"Loaded spaCy model: {model_name} (language: {lang_code})", file=sys.stderr)
        except OSError:
            print(f"Error: spaCy model '{model_name}' not found.", file=sys.stderr)
            print(f"Run: python -m spacy download {model_name}", file=sys.stderr)
            sys.exit(1)

    def detect(self, text: str) -> List[Dict]:
        entities = []

        # spaCy NER
        doc = self.nlp(text)
        for ent in doc.ents:
            if ent.label_ in self.SPACY_LABEL_MAP:
                etype, category, severity = self.SPACY_LABEL_MAP[ent.label_]
                entities.append({
                    'type': etype,
                    'category': category,
                    'text': ent.text,
                    'start': ent.start_char,
                    'end': ent.end_char,
                    'severity': severity,
                })

        # Name regex patterns (fallback for structured contexts)
        for pattern in self.NAME_PATTERNS:
            for match in re.finditer(pattern, text):
                # Extract the name group (group 1 in all patterns)
                name_text = match.group(1) if match.lastindex >= 1 else match.group(0)
                # Calculate actual position of the name within the match
                name_start = match.start() + match.group(0).index(name_text)
                name_end = name_start + len(name_text)
                entities.append({
                    'type': 'PERSON_NAME',
                    'category': 'PII',
                    'text': name_text,
                    'start': name_start,
                    'end': name_end,
                    'severity': 'medium',
                })

        # Financial regex patterns
        for pattern_type, patterns in self.FINANCIAL_PATTERNS.items():
            for pattern in patterns:
                for match in re.finditer(pattern, text, re.IGNORECASE):
                    entities.append({
                        'type': pattern_type,
                        'category': 'BUSINESS',
                        'text': match.group(0),
                        'start': match.start(),
                        'end': match.end(),
                        'severity': self._get_severity(pattern_type),
                    })

        # Departments
        for dept in self.DEPARTMENTS:
            for match in re.finditer(r'\b' + re.escape(dept) + r'\b', text, re.IGNORECASE):
                entities.append({
                    'type': 'DEPARTMENT',
                    'category': 'BUSINESS',
                    'text': match.group(0),
                    'start': match.start(),
                    'end': match.end(),
                    'severity': 'medium',
                })

        return entities

    def _get_severity(self, entity_type: str) -> str:
        for level, types in self.BUSINESS_SEVERITY.items():
            if entity_type in types:
                return level
        return 'low'


def get_line_column(text: str, position: int) -> Tuple[int, int]:
    """Convert character position to line and column number"""
    lines = text[:position].split('\n')
    return len(lines), len(lines[-1]) + 1


def detect_all(file_path: str) -> Dict:
    """Detect all PII and business entities in a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
    except Exception as e:
        return {'error': f'Failed to read file: {e}', 'file': file_path}

    pii_entities = PIIDetector().detect(text)
    business_detector = BusinessDataDetector(text=text)
    business_entities = business_detector.detect(text)

    # Deduplicate by position
    unique_entities = []
    seen_positions = set()
    for entity in sorted(pii_entities + business_entities, key=lambda x: x['start']):
        pos_key = (entity['start'], entity['end'])
        if pos_key not in seen_positions:
            unique_entities.append(entity)
            seen_positions.add(pos_key)

    # Add line/column info
    for entity in unique_entities:
        entity['line'], entity['column'] = get_line_column(text, entity['start'])

    # Sort by severity then position
    severity_order = {'high': 0, 'medium': 1, 'low': 2}
    unique_entities.sort(key=lambda e: (severity_order.get(e['severity'], 3), e['line'], e['column']))

    high_sev = [e for e in unique_entities if e['severity'] == 'high']
    medium_sev = [e for e in unique_entities if e['severity'] == 'medium']
    low_sev = [e for e in unique_entities if e['severity'] == 'low']
    pii_count = sum(1 for e in unique_entities if e['category'] == 'PII')
    business_count = sum(1 for e in unique_entities if e['category'] == 'BUSINESS')

    return {
        'file': file_path,
        'total_entities': len(unique_entities),
        'by_severity': {'high': len(high_sev), 'medium': len(medium_sev), 'low': len(low_sev)},
        'by_category': {'PII': pii_count, 'BUSINESS': business_count},
        'entities': {'high_severity': high_sev, 'medium_severity': medium_sev, 'low_severity': low_sev},
        'recommendation': _get_recommendation(high_sev, medium_sev, low_sev),
    }


def _get_recommendation(high, medium, low) -> str:
    if high:
        return "High severity PII and/or confidential business data detected. Anonymize before sharing."
    elif medium:
        return "Medium severity sensitive data detected. Consider anonymization before sharing."
    elif low:
        return "Low severity entities detected. Review and anonymize if needed."
    return "No sensitive data detected."


def format_report(report: Dict) -> str:
    if 'error' in report:
        return f"Error: {report['error']}"

    lines = [
        "## PII & Business Data Detection Report",
        "",
        f"**File:** {report['file']}",
        f"**Total Entities:** {report['total_entities']}",
        "",
    ]

    if report['total_entities'] == 0:
        lines.append("No sensitive data detected.")
        return '\n'.join(lines)

    lines.append(f"**By Category:** PII: {report['by_category']['PII']}, Business: {report['by_category']['BUSINESS']}")
    lines.append("")

    for severity_label in ['high', 'medium', 'low']:
        key = f"{severity_label}_severity"
        entities = report['entities'][key]
        if entities:
            lines.append(f"### {severity_label.title()} Severity ({len(entities)})")
            for ent in entities:
                lines.append(f"- **{ent['type']}** ({ent['category']}): Line {ent['line']}, Col {ent['column']} - \"{ent['text'][:50]}\"")
            lines.append("")

    lines.append(f"**Recommendation:** {report['recommendation']}")
    return '\n'.join(lines)


def main():
    if len(sys.argv) != 2:
        print("Usage: python detect.py <file_path>", file=sys.stderr)
        sys.exit(1)

    file_path = sys.argv[1]
    if not Path(file_path).exists():
        print(f"Error: File not found: {file_path}", file=sys.stderr)
        sys.exit(1)

    print(f"Detecting PII and business data in: {file_path}", file=sys.stderr)
    report = detect_all(file_path)

    print(json.dumps(report, indent=2))
    print("\n" + "=" * 60, file=sys.stderr)
    print(format_report(report), file=sys.stderr)
    print("=" * 60, file=sys.stderr)


if __name__ == '__main__':
    main()
