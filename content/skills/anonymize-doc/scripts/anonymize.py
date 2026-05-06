#!/usr/bin/env python3
"""
PII and Business Data Anonymization Script

Anonymizes PII and sensitive business information using various strategies:
masking, hashing, pseudonymization, tokenization, or mixed.

Usage:
    python anonymize.py <file_path> --strategy <mask|hash|pseudo|token|mixed>

Output:
    - <file>-anonymized.<ext>: Anonymized file
    - <file>-audit-log.json: Audit trail with mappings (if reversible)
"""

import sys
import os
import json
import re
import hashlib
import secrets
import argparse
from pathlib import Path
from typing import List, Dict, Tuple
from datetime import datetime, timezone

try:
    import scrubadub
    import spacy
except ImportError:
    print("Error: Required packages not installed.", file=sys.stderr)
    print("Run: pip install scrubadub spacy faker", file=sys.stderr)
    print("     python -m spacy download en_core_web_sm", file=sys.stderr)
    sys.exit(1)

try:
    from faker import Faker
except ImportError:
    print("Error: faker not installed. Run: pip install faker", file=sys.stderr)
    sys.exit(1)

# Fix import: add scripts directory to path so detect.py can be found
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from detect import PIIDetector, BusinessDataDetector, get_line_column


# Mixed strategy severity-to-strategy mapping
MIXED_STRATEGY_MAP = {
    'high': 'hash',
    'medium': 'pseudo',
    'low': 'pseudo',
}


class Anonymizer:
    """Anonymizes entities using configurable strategies"""

    DEPT_MAPPING = {
        'engineering': 'Product Development',
        'development': 'Product Development',
        'dev': 'Product Development',
        'r&d': 'Innovation',
        'sales': 'Business Development',
        'marketing': 'Growth',
        'hr': 'People Operations',
        'human resources': 'People Operations',
        'finance': 'Accounting',
        'accounting': 'Financial Planning',
        'operations': 'Customer Success',
        'legal': 'Compliance',
        'compliance': 'Governance',
        'it': 'Infrastructure',
        'support': 'Client Services',
    }

    def __init__(self, strategy: str):
        self.strategy = strategy
        self.faker = Faker()
        self.token_cache = {}

    def anonymize_text(self, text: str, entities: List[Dict]) -> Tuple[str, List[Dict]]:
        """Anonymize text based on detected entities. Returns (anonymized_text, mappings)."""
        # Sort descending by position to avoid offset shifts
        entities_sorted = sorted(entities, key=lambda x: x['start'], reverse=True)

        anonymized_text = text
        mappings = []

        for entity in entities_sorted:
            original = entity['text']
            entity_type = entity['type']
            start, end = entity['start'], entity['end']

            # For mixed strategy, pick per-entity strategy based on severity
            effective_strategy = self.strategy
            if self.strategy == 'mixed':
                effective_strategy = MIXED_STRATEGY_MAP.get(entity['severity'], 'pseudo')

            replacement = self._apply_strategy(original, entity_type, entity['category'], effective_strategy)
            anonymized_text = anonymized_text[:start] + replacement + anonymized_text[end:]

            line, col = get_line_column(text, start)
            mappings.append({
                'type': entity_type,
                'category': entity['category'],
                'original': original,
                'replacement': replacement,
                'strategy': effective_strategy,
                'line': line,
                'column': col,
            })

        return anonymized_text, mappings

    def _apply_strategy(self, text: str, entity_type: str, category: str, strategy: str) -> str:
        if strategy == 'mask':
            return self._mask(text, entity_type)
        elif strategy == 'hash':
            return self._hash(text)
        elif strategy == 'pseudo':
            return self._pseudonymize(text, entity_type, category)
        elif strategy == 'token':
            return self._tokenize(text)
        return text

    def _mask(self, text: str, entity_type: str) -> str:
        if entity_type in ('EMAIL',) and '@' in text:
            username, domain = text.split('@', 1)
            tld = domain.rsplit('.', 1)[-1] if '.' in domain else ''
            return f"{'*' * len(username)}@***.{tld}" if tld else f"{'*' * len(username)}@***"

        if entity_type in ('PHONE',):
            return re.sub(r'\d', '*', text)

        if entity_type == 'SSN':
            return '***-**-****'

        if entity_type in ('REVENUE', 'COSTS', 'MARKET_SIZE', 'PRICING', 'MONETARY_VALUE'):
            return re.sub(r'[\d,]+\.?\d*', lambda m: '*' * len(m.group(0)), text)

        # Generic: mask each word
        return ' '.join('*' * len(word) for word in text.split())

    def _hash(self, text: str) -> str:
        return hashlib.sha256(text.encode('utf-8')).hexdigest()

    def _pseudonymize(self, text: str, entity_type: str, category: str) -> str:
        if entity_type == 'PERSON_NAME':
            return self.faker.name()
        if entity_type == 'EMAIL':
            return self.faker.email()
        if entity_type == 'PHONE':
            return self.faker.phone_number()
        if entity_type == 'ADDRESS':
            return self.faker.address().replace('\n', ', ')
        if entity_type == 'COMPANY':
            return self.faker.company()
        if entity_type == 'JOB_TITLE':
            return self.faker.job()
        if entity_type == 'DEPARTMENT':
            lower = text.lower()
            for key, value in self.DEPT_MAPPING.items():
                if key in lower:
                    return value
            return 'Operations'
        if entity_type in ('REVENUE', 'COSTS', 'MARKET_SIZE', 'PRICING', 'MONETARY_VALUE'):
            return self._generate_financial_variant(text)
        if entity_type == 'HEADCOUNT':
            match = re.search(r'\d+', text)
            if match:
                original_num = int(match.group(0))
                new_num = int(original_num * self.faker.random.uniform(0.8, 1.2))
                return text.replace(match.group(0), str(new_num))
            return text
        if entity_type == 'DATE':
            return self.faker.date()
        if entity_type == 'FINANCIAL_PCT':
            match = re.search(r'[\d.]+', text)
            if match:
                original_pct = float(match.group(0))
                new_pct = round(original_pct * self.faker.random.uniform(0.8, 1.2), 1)
                return text.replace(match.group(0), str(new_pct))
            return text
        return self.faker.word()

    def _generate_financial_variant(self, text: str) -> str:
        currency_match = re.search(r'(\$|€|£|USD|EUR|GBP)', text)
        num_match = re.search(r'([\d,]+\.?\d*)\s*([KMB])?', text)
        if not num_match:
            return text

        num_str = num_match.group(1).replace(',', '')
        suffix = num_match.group(2) or ''

        try:
            num = float(num_str)
        except ValueError:
            return text

        multipliers = {'K': 1e3, 'M': 1e6, 'B': 1e9}
        if suffix in multipliers:
            num *= multipliers[suffix]

        new_num = num * self.faker.random.uniform(0.8, 1.2)

        if new_num >= 1e9:
            formatted = f"{new_num / 1e9:.1f}B"
        elif new_num >= 1e6:
            formatted = f"{new_num / 1e6:.1f}M"
        elif new_num >= 1e3:
            formatted = f"{new_num / 1e3:.1f}K"
        else:
            formatted = f"{new_num:.0f}"

        return re.sub(r'([\d,]+\.?\d*)\s*([KMB])?', formatted, text, count=1)

    def _tokenize(self, text: str) -> str:
        if text in self.token_cache:
            return self.token_cache[text]
        token = f"TKN_{secrets.token_hex(4)}"
        self.token_cache[text] = token
        return token


def anonymize_file(file_path: str, strategy: str) -> Dict:
    """Anonymize a file and produce output files."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
    except Exception as e:
        return {'error': f'Failed to read file: {e}', 'file': file_path}

    # Detect entities
    all_entities = PIIDetector().detect(text) + BusinessDataDetector().detect(text)

    # Deduplicate
    unique_entities = []
    seen = set()
    for entity in sorted(all_entities, key=lambda x: x['start']):
        key = (entity['start'], entity['end'])
        if key not in seen:
            unique_entities.append(entity)
            seen.add(key)

    if not unique_entities:
        return {'error': 'No sensitive data detected. Nothing to anonymize.', 'file': file_path}

    # Anonymize
    anonymizer = Anonymizer(strategy)
    anonymized_text, mappings = anonymizer.anonymize_text(text, unique_entities)

    # Output paths
    fp = Path(file_path)
    anonymized_path = fp.parent / f"{fp.stem}-anonymized{fp.suffix}"
    audit_log_path = fp.parent / f"{fp.stem}-audit-log.json"

    try:
        with open(anonymized_path, 'w', encoding='utf-8') as f:
            f.write(anonymized_text)
    except Exception as e:
        return {'error': f'Failed to write anonymized file: {e}', 'file': file_path}

    # Determine reversibility
    if strategy == 'mixed':
        has_reversible = any(m['strategy'] in ('pseudo', 'token') for m in mappings)
    else:
        has_reversible = strategy in ('pseudo', 'token')

    # Build type counts
    by_type = {}
    for m in mappings:
        by_type[m['type']] = by_type.get(m['type'], 0) + 1

    pii_count = sum(1 for m in mappings if m['category'] == 'PII')
    business_count = sum(1 for m in mappings if m['category'] == 'BUSINESS')

    audit_log = {
        'original_file': file_path,
        'anonymized_file': str(anonymized_path),
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'strategy': strategy,
        'reversible': has_reversible,
        'mappings': mappings if has_reversible else [],
        'summary': {
            'total_entities': len(mappings),
            'by_category': {'PII': pii_count, 'BUSINESS': business_count},
            'by_type': by_type,
        },
    }

    try:
        with open(audit_log_path, 'w', encoding='utf-8') as f:
            json.dump(audit_log, f, indent=2)
    except Exception as e:
        return {'error': f'Failed to write audit log: {e}', 'file': file_path}

    return {
        'success': True,
        'original_file': file_path,
        'anonymized_file': str(anonymized_path),
        'audit_log': str(audit_log_path),
        'strategy': strategy,
        'summary': audit_log['summary'],
    }


def format_result(result: Dict) -> str:
    if 'error' in result:
        return f"Error: {result['error']}"

    lines = [
        "## Anonymization Complete",
        "",
        f"**Original:** {result['original_file']} (preserved)",
        f"**Anonymized:** {result['anonymized_file']}",
        f"**Audit Log:** {result['audit_log']}",
        f"**Strategy:** {result['strategy']}",
        "",
        "### Actions Taken",
    ]

    summary = result['summary']
    pii_types = {'PERSON_NAME', 'EMAIL', 'PHONE', 'SSN', 'CREDIT_CARD', 'ADDRESS', 'IP'}

    if summary['by_category']['PII'] > 0:
        lines.append(f"**Personal Data:** {summary['by_category']['PII']} entities")
        for etype, count in summary['by_type'].items():
            if etype in pii_types:
                lines.append(f"  - {count} {etype}")

    if summary['by_category']['BUSINESS'] > 0:
        lines.append(f"**Business Data:** {summary['by_category']['BUSINESS']} entities")
        for etype, count in summary['by_type'].items():
            if etype not in pii_types:
                lines.append(f"  - {count} {etype}")

    lines.extend([
        "",
        "### Safety Checks",
        "- Original file preserved",
        "- Audit log created",
        f"- {summary['total_entities']} entities anonymized",
    ])

    if result['strategy'] in ('pseudo', 'token', 'mixed'):
        lines.append("- WARNING: Reversible mapping in audit log - secure this file!")

    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description='Anonymize PII and business data in text files')
    parser.add_argument('file_path', help='Path to file to anonymize')
    parser.add_argument('--strategy', choices=['mask', 'hash', 'pseudo', 'token', 'mixed'],
                        default='mask', help='Anonymization strategy (default: mask)')
    args = parser.parse_args()

    if not Path(args.file_path).exists():
        print(f"Error: File not found: {args.file_path}", file=sys.stderr)
        sys.exit(1)

    print(f"Anonymizing {args.file_path} using strategy: {args.strategy}", file=sys.stderr)
    result = anonymize_file(args.file_path, args.strategy)

    print(json.dumps(result, indent=2))
    print("\n" + "=" * 60, file=sys.stderr)
    print(format_result(result), file=sys.stderr)
    print("=" * 60, file=sys.stderr)

    if 'error' in result:
        sys.exit(1)


if __name__ == '__main__':
    main()
