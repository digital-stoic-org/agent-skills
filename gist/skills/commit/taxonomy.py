"""gist:commit taxonomy: 2 planes x 6 kinds, ordered path rules (first match wins). Shared by scan.py and make-page.py."""
import os, posixpath, re

KINDS = [  # id, label, plane, risk weight, definition
    ('har', 'harness', 'control', 3, 'changes how agents behave: CLAUDE.md, settings, rules, skills, agents, hooks, live scripts'),
    ('stg', 'steering', 'control', 2, 'deliverables of the control plane: plans, briefs, mandates, 00-* steering files, wip'),
    ('trc', 'trace', 'control', 0.25, 'session record: stint journals and notes'),
    ('dlv', 'deliverable', 'data', 2, 'the work itself: docs, slides, product code, reports'),
    ('inp', 'input', 'data', 1, 'material read, not written: in/, .in/, anti-library, raw meetings'),
    ('gen', 'generated', 'data', 0.5, 'regenerable output: build/, HTML produced by a make-*.py next to it'),
]
K = {k[0]: dict(label=k[1], plane=k[2], w=k[3], define=k[4]) for k in KINDS}
PLANES = ['control', 'data']

HARNESS_RE = re.compile(r'(^|/)(CLAUDE\.md|AGENTS\.md|\.mcp\.json)$|(^|/)\.claude/|(^|/)(rules|skills|agents|hooks)/|^code/live/')
STEER_RE = re.compile(r'(^|/)(00-[^/]*\.md|PLAN-[^/]*|BRIEF-[^/]*|MANDATE-[^/]*|CONTEXT-[^/]*-llm\.md|[^/]*-tasks\.md)$|(^|/)wip/')
INPUT_RE = re.compile(r'(^|/)(in|\.in|anti-library)/')
# same list as /praxis/code/live/ccommit: these paths are never read, never staged by the page
SECRET_RE = re.compile(r'(^|/)(\.env[^/]*|[^/]*\.pem|[^/]*\.key|id_rsa[^/]*|id_ed25519[^/]*|\.npmrc|\.pypirc|[^/]*credentials[^/]*\.json|[^/]*service-account[^/]*\.json)$')


def is_secret(path):
    return bool(SECRET_RE.search(path.rstrip('/')))


def has_generator(root, path):
    """An .html file is generated when a make-*.py sits in the same folder on disk."""
    if not path.endswith('.html'):
        return False
    d = os.path.join(root, posixpath.dirname(path))
    try:
        return any(n.startswith('make-') and n.endswith('.py') for n in os.listdir(d))
    except OSError:
        return False


def classify(path, is_root, root, control_dir=None):
    """Ordered path rules, first match wins. Returns (kind, rule text)."""
    if HARNESS_RE.search(path): return 'har', 'r1 harness path (CLAUDE.md, .claude/, rules/, skills/, agents/, hooks/, code/live/)'
    if '/.stint/' in '/' + path: return 'trc', 'r2 .stint/'
    if '/build/' in '/' + path or has_generator(root, path): return 'gen', 'r3 build/ or HTML next to a make-*.py'
    if STEER_RE.search(path): return 'stg', 'r4 steering name (00-*.md, PLAN-, BRIEF-, MANDATE-, CONTEXT-*-llm, *-tasks) or wip/'
    if INPUT_RE.search(path): return 'inp', 'r5 in/, .in/, anti-library/'
    if is_root and control_dir and path.startswith(control_dir.rstrip('/') + '/'): return 'stg', f'r6 default: alias control folder {control_dir}/<alias>'
    return 'dlv', 'r6 default: project or data repo content'


def repo_plane(is_root, repo, path, control_dir=None):
    """Plane given by the location: alias control folder, alias data repo, or the workspace root (both)."""
    if not is_root: return 'data', f'data repo {repo}'
    if control_dir and path.startswith(control_dir.rstrip('/') + '/'): return 'control', f'control folder {control_dir}/{path.split("/")[1]}'
    return None, 'workspace root (control and data in one repo)'


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-') or 'root'
