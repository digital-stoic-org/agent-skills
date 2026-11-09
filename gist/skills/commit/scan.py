#!/usr/bin/env python3
"""gist:commit scan: read-only git snapshot of the workspace root + its alias data repos -> scan JSON.
Classifies every changed file (taxonomy.py), groups files into projects by path, runs the deterministic
detectors (secret, deleted with no copy, half-staged move, reopened checkbox, to-reread marker, generated)
and the decisions whose answers change the commands. Never stages, never commits, never reads a secret path.

usage: scan.py [-o scan.json] [--repo PATH ...] [--no-discover]
  repos: the workspace root (config.py) + every data_repo of an alias that has a control folder + data_repos + --repo
  no config file: the git repo of the current folder only"""
import argparse, datetime, json, os, posixpath, re, subprocess, sys
from collections import Counter
sys.dont_write_bytecode = True  # no __pycache__ inside the skill dir (plugin cache, data repo)
from taxonomy import K, classify, repo_plane, is_secret, slug
import config

MARKER_RE = re.compile(r'(?i)\b(à|a) relire\b|\bto re-?read\b')
MAX_DIFF = 400_000                  # bytes of diff read per file, above that the content detectors skip it


def git(root, *args):
    r = subprocess.run(['git', '-C', root, *args], capture_output=True)
    if r.returncode != 0:
        raise RuntimeError(f'git {" ".join(args)} failed in {root}: {r.stderr.decode(errors="replace").strip()}')
    return r.stdout


def discover(cfg):
    """Root + data repos: the pattern for each alias control folder, then explicit data_repos. Returns (repos, skipped)."""
    cand = []
    ctl = os.path.join(cfg['root'], cfg['control_dir']) if cfg['control_dir'] else None
    if ctl and cfg['data_repo'] and os.path.isdir(ctl):
        cand += [cfg['data_repo'].format(alias=n) for n in sorted(os.listdir(ctl)) if os.path.isdir(os.path.join(ctl, n)) and not n.startswith('.')]
    explicit = list(cfg['data_repos'].values())
    repos, seen, skipped = [cfg['root']], {os.path.realpath(cfg['root'])}, []
    for d in cand + explicit:
        if os.path.realpath(d) in seen: continue
        if os.path.isdir(os.path.join(d, '.git')):
            repos.append(d); seen.add(os.path.realpath(d))
        elif d in explicit:
            skipped.append(d)  # pattern misses are normal; an explicit entry that is not a repo is reported
    return repos, skipped


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


def group_key(is_root, repo, path, cfg):
    """Project = path rule, never a guess: projects/<x>, projects/_archive/<x>, <control_dir>/<alias>[/<plugin>], first segment."""
    seg = path.rstrip('/').split('/')
    ctl, mono = (cfg['control_dir'] or '').strip('/'), set(cfg['monorepos'])
    if is_root:
        if seg[0] == 'projects' and len(seg) > 2 and seg[1] == '_archive':
            return f'archive-{slug(seg[2])}', f'{seg[2]} archive'
        if seg[0] == 'projects' and len(seg) > 1:
            return slug(seg[1]), seg[1]
        if ctl and seg[0] == ctl and len(seg) > 1:
            if seg[1] in mono and len(seg) > 3:
                return f'ctl-{slug(seg[1])}-{slug(seg[2])}', f'{seg[2]} (control)'
            return f'ctl-{slug(seg[1])}', f'{seg[1]} (control)'
        if len(seg) == 1 or seg[0] in ('.claude', '.mcp.json'):
            return f'{slug(repo)}-root', f'{repo} root'
        return f'{slug(repo)}-{slug(seg[0])}', seg[0].lstrip('.') or repo
    if repo in mono and len(seg) > 1:
        return f'{slug(repo)}-{slug(seg[0])}', f'{seg[0]} ({repo})'
    return slug(repo), repo


def diff_text(root, path, tracked):
    try:
        b = git(root, 'diff', 'HEAD', '--no-ext-diff', '--', path) if tracked else b''
    except RuntimeError:
        b = b''
    return b[:MAX_DIFF].decode(errors='replace')


def scan(roots, cfg):
    snap = datetime.datetime.now().astimezone()
    repos, projects = [], {}
    for root in roots:
        top = git(root, 'rev-parse', '--show-toplevel').decode().strip()
        is_root = os.path.realpath(top) == os.path.realpath(cfg['root'])
        name = os.path.basename(os.path.realpath(top))
        disp = cfg['root'] if is_root else root
        branch = git(root, 'symbolic-ref', '--short', '-q', 'HEAD').decode().strip() if subprocess.run(['git', '-C', root, 'symbolic-ref', '-q', 'HEAD'], capture_output=True).returncode == 0 else 'detached'
        entries = porcelain(root)
        repos.append(dict(name=name, root=disp, branch=branch, head=git(root, 'rev-parse', '--short', 'HEAD').decode().strip(), changed=len(entries)))
        if not entries: continue
        known = Counter(posixpath.basename(f) for f in git(root, 'ls-files', '-z').decode(errors='replace').split('\0') if f)
        for x, y, path, orig in entries:
            pid, pname = group_key(is_root, name, path, cfg)
            p = projects.setdefault(pid, dict(id=pid, name=pname, repo=name, root=disp, files=[], alerts=[], readers=[], others=0, decisions=[]))
            n = 1
            if path.endswith('/') and x == '?':
                n = len([f for f in git(root, 'ls-files', '--others', '--exclude-standard', '-z', '--', path).decode(errors='replace').split('\0') if f]) or 1
            kind, rule = classify(path, is_root, top, cfg['control_dir'])
            rp, rdesc = repo_plane(is_root, disp, path, cfg['control_dir'])
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
    rootname = os.path.basename(os.path.realpath(cfg['root']))
    keep = {k: cfg[k] for k in ('root', 'out', 'tmp', 'serve_url', 'commit_cmd', 'config_file')}
    return dict(generated_at=snap.isoformat(timespec='seconds'), config=keep, repos=repos, projects=sorted(projects.values(), key=lambda p: (p['repo'] != rootname, p['repo'], p['id'])))


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
    ap.add_argument('-o', '--out', help='default: <tmp>/scan.json from the config')
    ap.add_argument('--repo', action='append', default=[], help='extra repo root')
    ap.add_argument('--no-discover', action='store_true', help='scan only the workspace root and --repo')
    a = ap.parse_args()
    cfg = config.load()
    roots, skipped = ([cfg['root']], []) if a.no_discover else discover(cfg)
    roots += a.repo
    a.out = a.out or os.path.join(cfg['tmp'], 'scan.json')
    data = scan(roots, cfg)
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    with open(a.out, 'w', encoding='utf-8') as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1)
    np = len(data['projects']); nf = sum(len(p['files']) for p in data['projects']); na = sum(len(p['alerts']) for p in data['projects'])
    print(f'{a.out}: {len(data["repos"])} repos, {np} projects, {nf} entries, {na} script alerts · snapshot {data["generated_at"]} · config {cfg["config_file"] or "none (single repo)"}')
    for s in skipped: print(f'  skipped, not a git repo: {s}')
    for p in data['projects']:
        print(f'  {p["id"]:28} ' + ' '.join(f'{f["kind"]}{"↔" if f["mism"] else ""}:{posixpath.basename(f["path"].rstrip("/"))}' for f in p['files'][:6]) + (f' (+{len(p["files"]) - 6})' if len(p['files']) > 6 else ''))
