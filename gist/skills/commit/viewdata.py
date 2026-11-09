"""gist:commit viewer data: per changed file, what the file viewer (commit-view.html) shows, taken at scan time.
Diff vs HEAD (word diff for prose, line diff otherwise), HEAD content of deleted files, content copy of files the
http server cannot reach (data repos), FNV-1a hash of live files so the viewer can flag a file changed since the
snapshot. Untracked folders unfold into their files (capped). Sensitive paths: path only, never read."""
import base64, os, posixpath, re, subprocess
from taxonomy import is_secret

MAX_DIFF = 200_000        # chars of diff kept per file; beyond: "too big", the viewer offers Raw
MAX_TEXT = 400_000        # bytes of text content copied per file (deleted files, data repos)
MAX_IMG = 1_500_000       # bytes of image copied as data URL (data repos, deleted)
MAX_HASH = 8_000_000      # bytes hashed per live file; bigger files get no "changed since" check
MAX_UNFOLD = 60           # files listed per untracked folder
PROSE = ('.md', '.markdown', '.txt')
LANG = {'.md': 'md', '.markdown': 'md', '.mmd': 'mmd', '.mermaid': 'mmd', '.html': 'html', '.htm': 'html', '.svg': 'svg', '.pdf': 'pdf',
        '.png': 'img', '.jpg': 'img', '.jpeg': 'img', '.gif': 'img', '.webp': 'img', '.avif': 'img'}
MIME = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif',
        '.svg': 'image/svg+xml', '.pdf': 'application/pdf'}
HUNK_RE = re.compile(r'^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@ ?(.*)$')


def _git(root, *args):
    r = subprocess.run(['git', '-C', root, *args], capture_output=True)
    return r.stdout if r.returncode == 0 else None


def fnv(data):
    """FNV-1a 32 bits over the raw bytes, same as commit-view.js (no crypto.subtle on a plain-http origin)."""
    h = 0x811c9dc5
    for b in data:
        h = ((h ^ b) * 0x01000193) & 0xffffffff
    return f'{h:08x}'


def lang_of(path, data=None):
    ext = posixpath.splitext(path)[1].lower()
    if ext in LANG: return LANG[ext]
    if data is not None and b'\0' in data[:8000]: return 'bin'
    return 'code'


def parse_diff(text, word):
    """Unified diff -> hunks [{h, a, b, lines: [[[type, text], ...], ...]}]; type ' ' '+' '-'.
    word=True reads --word-diff=porcelain, where one source line holds several segments and '~' ends it."""
    hunks, cur, line = [], None, []
    for l in text.split('\n'):
        m = HUNK_RE.match(l)
        if m:
            if cur is not None and line: cur['lines'].append(line)
            cur, line = dict(h=m.group(3), a=int(m.group(1)), b=int(m.group(2)), lines=[]), []
            hunks.append(cur); continue
        if cur is None or not l or l[0] not in ' +-~': continue
        if word:
            if l[0] == '~':
                cur['lines'].append(line or [[' ', '']]); line = []
            else:
                line.append([l[0], l[1:]])
        else:
            cur['lines'].append([[l[0], l[1:]]])
    if cur is not None and line: cur['lines'].append(line)
    return hunks


def diff_of(top, path, orig):
    word = path.lower().endswith(PROSE)
    paths = [orig, path] if orig else [path]
    args = ['diff', 'HEAD', '--no-ext-diff', '--no-color', '-M'] + (['--word-diff=porcelain'] if word else []) + ['--', *paths]
    raw = _git(top, *args)
    if raw is None: return None
    text = raw.decode(errors='replace')
    if 'Binary files' in text[:2000] and '@@' not in text: return dict(note='binary')
    num = (_git(top, 'diff', 'HEAD', '--numstat', '-M', '--', *paths) or b'').decode(errors='replace').split('\t')
    add, dele = (int(num[0]), int(num[1])) if len(num) > 2 and num[0].isdigit() and num[1].isdigit() else (None, None)
    if len(text) > MAX_DIFF: return dict(note='too big', size=len(text), add=add, dele=dele)
    return dict(mode='word' if word else 'line', add=add, dele=dele, hunks=parse_diff(text, word))


def content_of(data, path):
    """Snapshot copy for the viewer: text, or a data URL for images and PDF, within the caps."""
    lang = lang_of(path, data)
    ext = posixpath.splitext(path)[1].lower()
    if lang in ('img', 'pdf') or (lang == 'svg' and len(data) > MAX_TEXT):
        if len(data) > MAX_IMG: return None, 'too big'
        return dict(url=f'data:{MIME[ext]};base64,' + base64.b64encode(data).decode()), None
    if lang == 'bin': return None, 'binary'
    if len(data) > MAX_TEXT: return None, 'too big'
    return dict(text=data.decode(errors='replace')), None


def entry(top, path, st, orig, kind, staged, unstaged, live, head, folder=None):
    e = dict(path=path, st=st, orig=orig, kind=kind, partial=bool(staged and unstaged), folder=folder, secret=is_secret(path))
    if e['secret']:
        e.update(lang=lang_of(path), src='none'); return e
    full = os.path.join(top, path)
    now = None
    if st != 'D':
        try:
            with open(full, 'rb') as fh: now = fh.read()
        except OSError:
            now = None
    before = None
    if st != 'A':
        sz = _git(top, 'cat-file', '-s', f'HEAD:{orig or path}')
        before = int(sz) if sz and sz.strip().isdigit() else None
    e.update(lang=lang_of(path, now), size_before=before, size_after=len(now) if now is not None else None)
    if st == 'D':
        data = _git(top, 'show', f'HEAD:{path}') or b''
        e['lang'] = lang_of(path, data)
        e['snap'], e['note'] = content_of(data, path)
        e.update(src='snap', rev=head)
    elif live:
        e.update(src='live', hash=fnv(now) if now is not None and len(now) <= MAX_HASH else None)
    else:
        e['snap'], e['note'] = content_of(now, path) if now is not None else (None, 'unreadable')
        e['src'] = 'snap'
    if st == 'A':
        e['lines'] = now.count(b'\n') + (0 if now.endswith(b'\n') else 1) if now and e['lang'] != 'bin' else None
    elif st != 'D' and e['lang'] not in ('img', 'pdf', 'bin'):
        e['diff'] = diff_of(top, path, orig)
    return e


def entries(top, f, x, is_root, head, git_fn):
    """Viewer entries for one scan entry f; an untracked folder unfolds into its files (capped, kind of the folder)."""
    if f['path'].endswith('/') and x == '?':
        out = git_fn(top, 'ls-files', '--others', '--exclude-standard', '-z', '--', f['path']).decode(errors='replace').split('\0')
        files = sorted(p for p in out if p)
        res = [entry(top, p, 'A', None, f['kind'], False, True, is_root, head, folder=f['path']) for p in files[:MAX_UNFOLD]]
        if len(files) > MAX_UNFOLD:
            res.append(dict(path=f['path'] + '…', st='A', kind=f['kind'], folder=f['path'], secret=False, lang='none', src='none', note=f'{len(files) - MAX_UNFOLD} more files not listed'))
        return res
    return [entry(top, f['path'], f['st'], f.get('orig'), f['kind'], f['staged'], f['unstaged'], is_root, head)]
