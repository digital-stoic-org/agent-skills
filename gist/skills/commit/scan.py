#!/usr/bin/env python3
"""gist:commit scan: read-only git snapshot of /praxis + alias data repos -> scan JSON.
Classifies every changed file (taxonomy.py), groups files into projects by path, runs the deterministic
detectors (secret, deleted with no copy, half-staged move, reopened checkbox, to-reread marker, generated)
and the decisions whose answers change the commands. Never stages, never commits, never reads a secret path.

usage: scan.py [-o scan.json] [--repo PATH ...] [--no-discover]
  default repos: /praxis + every /repos/<alias> that is a git repo and has a /praxis/repos/<alias> control folder"""
import argparse, datetime, json, os, posixpath, re, subprocess, sys
from collections import Counter
sys.dont_write_bytecode = True  # no __pycache__ inside the skill dir (plugin cache, data repo)
from taxonomy import K, classify, repo_plane, is_secret, slug

PRAXIS = '/praxis'
MONOREPOS = {'agent-skills'}       # split by first sub-folder (one plugin = one project)
MARKER_RE = re.compile(r'(?i)\b(à|a) relire\b|\bto re-?read\b')
MAX_DIFF = 400_000                  # bytes of diff read per file, above that the content detectors skip it


def git(root, *args):
    r = subprocess.run(['git', '-C', root, *args], capture_output=True)
    if r.returncode != 0:
        raise RuntimeError(f'git {" ".join(args)} failed in {root}: {r.stderr.decode(errors="replace").strip()}')
    return r.stdout


def discover():
    repos = [PRAXIS]
    for n in sorted(os.listdir(os.path.join(PRAXIS, 'repos'))):
        d = f'/repos/{n}'
        if os.path.isdir(os.path.join(PRAXIS, 'repos', n)) and os.path.isdir(os.path.join(d, '.git')):
            repos.append(d)
    return repos


def porcelain(root):
    """[(X, Y, path, orig)] from git status -z; untracked folders stay collapsed (path ends with /)."""
    raw = git(root, 'status', '--porcelain=v1', '-z', '--untracked-files=normal').split(b'\0')
    out, i = [], 0
    while i < len(raw):
        e = raw[i].decode(errors='replace'); i += 1
        if len(e) < 4: continue
        x, y, path, orig = e[0], e[1], e[3:], None
        if x in 'RC':
            orig = raw[i].decode(errors='replace'); i += 1
        out.append((x, y, path, orig))
    return out


def status_letter(x, y):
    if x == '?': return 'A'
    if x in 'RC' or y in 'RC': return 'R'
    return x if x != ' ' else y


def group_key(is_praxis, repo, path):
    """Project = path rule, never a guess: projects/<x>, projects/_archive/<x>, repos/<alias>[/<plugin>], first segment."""
    seg = path.rstrip('/').split('/')
    if is_praxis:
        if seg[0] == 'projects' and len(seg) > 2 and seg[1] == '_archive':
            return f'archive-{slug(seg[2])}', f'{seg[2]} archive'
        if seg[0] == 'projects' and len(seg) > 1:
            return slug(seg[1]), seg[1]
        if seg[0] == 'repos' and len(seg) > 1:
            if seg[1] in MONOREPOS and len(seg) > 3:
                return f'ctl-{slug(seg[1])}-{slug(seg[2])}', f'{seg[2]} (control)'
            return f'ctl-{slug(seg[1])}', f'{seg[1]} (control)'
        if len(seg) == 1 or seg[0] in ('.claude', '.mcp.json'):
            return 'praxis-root', 'praxis root'
        return f'praxis-{slug(seg[0])}', seg[0].lstrip('.') or 'praxis'
    if repo in MONOREPOS and len(seg) > 1:
        return f'{slug(repo)}-{slug(seg[0])}', f'{seg[0]} ({repo})'
    return slug(repo), repo


def diff_text(root, path, tracked):
    try:
        b = git(root, 'diff', 'HEAD', '--no-ext-diff', '--', path) if tracked else b''
    except RuntimeError:
        b = b''
    return b[:MAX_DIFF].decode(errors='replace')


def scan(roots):
    snap = datetime.datetime.now().astimezone()
    repos, projects = [], {}
    for root in roots:
        top = git(root, 'rev-parse', '--show-toplevel').decode().strip()
        is_praxis = os.path.realpath(top) == os.path.realpath(PRAXIS)
        name = 'praxis' if is_praxis else os.path.basename(top)
        disp = PRAXIS if is_praxis else root
        branch = git(root, 'symbolic-ref', '--short', '-q', 'HEAD').decode().strip() if subprocess.run(['git', '-C', root, 'symbolic-ref', '-q', 'HEAD'], capture_output=True).returncode == 0 else 'detached'
        entries = porcelain(root)
        repos.append(dict(name=name, root=disp, branch=branch, head=git(root, 'rev-parse', '--short', 'HEAD').decode().strip(), changed=len(entries)))
        if not entries: continue
        known = Counter(posixpath.basename(f) for f in git(root, 'ls-files', '-z').decode(errors='replace').split('\0') if f)
        for x, y, path, orig in entries:
            pid, pname = group_key(is_praxis, name, path)
            pid = pid if is_praxis else pid  # ids are already repo-prefixed for data repos
            p = projects.setdefault(pid, dict(id=pid, name=pname, repo=name, root=disp, files=[], alerts=[], readers=[], others=0, decisions=[]))
            n = 1
            if path.endswith('/') and x == '?':
                n = len([f for f in git(root, 'ls-files', '--others', '--exclude-standard', '-z', '--', path).decode(errors='replace').split('\0') if f]) or 1
            kind, rule = classify(path, is_praxis, top)
            rp, rdesc = repo_plane(is_praxis, disp, path)
            f = dict(path=path, orig=orig, st=status_letter(x, y), xy=x + y, staged=x not in ' ?', unstaged=(y != ' ') or x == '?', n=n,
                     kind=kind, rule=rule, plane=K[kind]['plane'], repo_desc=rdesc, mism=rp is not None and rp != K[kind]['plane'], secret=is_secret(path))
            p['files'].append(f)
            if f['secret']:
                p['alerts'].append(dict(rule='sensitive path: never read, never staged by this page', evidence=f'{f["st"]} {path}', source='script'))
                continue
            # deleted with no copy: no file of the same name left anywhere in the index
            if f['st'] == 'D' and not path.endswith('/') and known[posixpath.basename(path)] <= 1:
                p['alerts'].append(dict(rule='deleted with no copy: no other file with this name in the repo', evidence=f'D {path}', source='script'))
            # content detectors on Markdown: reopened checkbox, to-reread marker
            if path.endswith('.md'):
                if f['st'] == 'A' and x == '?':
                    try:
                        with open(os.path.join(top, path), encoding='utf-8', errors='replace') as fh:
                            head = ''.join(fh.readline() for _ in range(8))
                    except OSError:
                        head = ''
                    if MARKER_RE.search(head):
                        p['alerts'].append(dict(rule='to-reread marker near the top of a new file', evidence=f'A {path}', source='script'))
                    continue
                d = diff_text(top, path, True)
                added = [l[1:] for l in d.splitlines() if l.startswith('+') and not l.startswith('+++')]
                removed = [l[1:] for l in d.splitlines() if l.startswith('-') and not l.startswith('---')]
                done = {m.group(1).strip() for l in removed for m in [re.match(r'\s*[-*] \[[xX]\] (.+)', l)] if m}
                reopened = [m.group(1).strip() for l in added for m in [re.match(r'\s*[-*] \[ \] (.+)', l)] if m and m.group(1).strip() in done]
                if reopened:
                    p['alerts'].append(dict(rule='reopened checkbox: a [x] became [ ]', evidence=f'M {path}: "- [ ] {reopened[0][:80]}"' + (f' (+{len(reopened) - 1})' if len(reopened) > 1 else ''), source='script'))
                if any(MARKER_RE.search(l) for l in added):
                    p['alerts'].append(dict(rule='to-reread marker added', evidence=f'M {path}', source='script'))
    for p in projects.values():
        decide(p)
    return dict(generated_at=snap.isoformat(timespec='seconds'), repos=repos, projects=sorted(projects.values(), key=lambda p: (p['repo'] != 'praxis', p['repo'], p['id'])))


def decide(p):
    """Decisions only where each answer yields a different git add. Each option lists what it EXCLUDES; exclusions of all decisions add up."""
    usable = [f['path'] for f in p['files'] if not f['secret']]
    gen = [f['path'] for f in p['files'] if f['kind'] == 'gen' and not f['secret']]
    if gen and len(gen) < len(usable):
        p['decisions'].append(dict(id=f'dec-{p["id"]}-generated', q='Commit the generated files?', reco='A',
                                   why=f'{len(gen)} regenerable file(s); rebuild them from their generator',
                                   opts=[dict(id='A', label='Skip generated', effect='generated files stay out of git add: ' + ', '.join(posixpath.basename(g) for g in gen[:3]), exclude=gen),
                                         dict(id='B', label='Include', effect='the regenerable files go into the commit', exclude=[])]))
    staged_add = {posixpath.basename(f['path'].rstrip('/')) for f in p['files'] if f['xy'][0] == 'A'}
    loose_del = [f['path'] for f in p['files'] if f['xy'] == ' D' and posixpath.basename(f['path'].rstrip('/')) in staged_add]
    if loose_del:
        p['alerts'].append(dict(rule='half-staged move: copies staged, deletion of the originals not staged', evidence=f'{len(loose_del)} unstaged D, e.g. {loose_del[0]}', source='script'))
        p['decisions'].append(dict(id=f'dec-{p["id"]}-move', q='Half-staged move', reco='A', why='otherwise the files exist twice',
                                   opts=[dict(id='A', label='Stage both', effect='git add -A on copies and originals: the move is committed whole', exclude=[]),
                                         dict(id='B', label='Copies only', effect='originals stay in git: files exist twice', exclude=loose_del)]))


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('-o', '--out', default='/praxis/.tmp/commit/scan.json')
    ap.add_argument('--repo', action='append', default=[], help='extra repo root (e.g. a data repo outside /repos)')
    ap.add_argument('--no-discover', action='store_true', help='scan only /praxis and --repo')
    a = ap.parse_args()
    roots = ([PRAXIS] if a.no_discover else discover()) + a.repo
    data = scan(roots)
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    with open(a.out, 'w', encoding='utf-8') as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1)
    np = len(data['projects']); nf = sum(len(p['files']) for p in data['projects']); na = sum(len(p['alerts']) for p in data['projects'])
    print(f'{a.out}: {len(data["repos"])} repos, {np} projects, {nf} entries, {na} script alerts · snapshot {data["generated_at"]}')
    for p in data['projects']:
        print(f'  {p["id"]:28} ' + ' '.join(f'{f["kind"]}{"↔" if f["mism"] else ""}:{posixpath.basename(f["path"].rstrip("/"))}' for f in p['files'][:6]) + (f' (+{len(p["files"]) - 6})' if len(p['files']) > 6 else ''))
