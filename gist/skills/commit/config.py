"""gist:commit workspace config. Resolution: CLI flag > <git root of cwd>/.claude/gist-commit.json > defaults.
Without a config file the skill scans the git repo of the current folder only."""
import json, os, shutil, subprocess

CONFIG_NAME = os.path.join('.claude', 'gist-commit.json')
DEFAULTS = dict(
    control_dir=None,          # folder of the root holding one control folder per alias, e.g. "repos"
    data_repo=None,            # data repo pattern for an alias, e.g. "/repos/{alias}"; discovered when it is a git repo
    data_repos={},             # explicit alias -> data repo path (exceptions to the pattern)
    monorepos=[],              # repo names split by first sub-folder (one plugin = one project)
    out='build/commit-map.html',
    tmp='.tmp/commit',
    serve_url=None,            # e.g. "http://host:8000/{path}", {path} = out relative to root; none = print the file path
    commit_cmd=None,           # template with {path} (common dir of the project) and {repo}; none = ccommit if installed, else git commit
)


def git_root(path):
    r = subprocess.run(['git', '-C', path, 'rev-parse', '--show-toplevel'], capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else None


def load(cwd=None, root=None):
    """Return the resolved config: absolute root, out, tmp, plus every key of DEFAULTS."""
    cwd = os.path.abspath(cwd or os.getcwd())
    base = root or git_root(cwd) or cwd
    cfg = dict(DEFAULTS, data_repos={}, monorepos=[])
    path = os.path.join(base, CONFIG_NAME)
    if os.path.isfile(path):
        with open(path, encoding='utf-8') as fh:
            user = json.load(fh)
        unknown = set(user) - set(DEFAULTS) - {'root'}
        if unknown:
            raise SystemExit(f'{path}: unknown key(s) {sorted(unknown)}')
        cfg.update(user)
        cfg['config_file'] = path
    else:
        cfg['config_file'] = None
    cfg['root'] = os.path.abspath(cfg.get('root') or base)
    cfg['out'] = os.path.join(cfg['root'], cfg['out'])
    cfg['tmp'] = os.path.join(cfg['root'], cfg['tmp'])
    if not cfg['commit_cmd']:
        cfg['commit_cmd'] = 'ccommit {path}' if shutil.which('ccommit') else 'git -C {repo} commit'
    return cfg


def page_link(cfg, out):
    """URL when serve_url is set, else the file path."""
    if cfg.get('serve_url'):
        return cfg['serve_url'].format(path=os.path.relpath(os.path.abspath(out), cfg['root']))
    return os.path.abspath(out)
