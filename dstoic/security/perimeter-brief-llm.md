# Perimeter — LLM Brief

Target: `/praxis/.claude/settings.json`
REGISTRY rows: 1.1, 1.2, 1.3, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 2.8

## 1a. Bash deny patterns

Add to `permissions.deny`:
```
Bash(cat */.env*)
Bash(cat .env*)
Bash(head .env*)
Bash(tail .env*)
Bash(grep .env*)
Bash(cat *credentials*)
Bash(cat *secrets*)
Bash(cat *token*)
Bash(cat *.key)
Bash(cat *.pem)
Bash(cat *.crt)
Bash(head *.key)
Bash(tail *.key)
Bash(grep *.key)
Bash(cat .npmrc)
Bash(cat pypirc)
```

Gap: prefix-match only. `less`, `more`, `vim`, `xxd` not caught. Phase 2 hooks cover.

## 1b. Credential directory deny

Add to `permissions.deny`:
```
Read(~/.ssh/**)
Read(~/.aws/**)
Read(~/.kube/**)
Read(~/.gnupg/**)
Read(~/.azure/**)
Edit(~/.ssh/**)
Edit(~/.aws/**)
Edit(~/.kube/**)
```

## 1c. Sandbox config

Add to settings.json root:
```json
{
  "sandbox": {
    "autoAllowMode": false,
    "allowUnsandboxedCommands": false,
    "excludedCommands": [],
    "network": {
      "policy": "deny",
      "allowedDomains": [
        "api.anthropic.com",
        "sentry.io",
        "statsig.anthropic.com",
        "registry.npmjs.com",
        "registry.yarnpkg.com",
        "files.pythonhosted.org",
        "pypi.org",
        "github.com",
        "raw.githubusercontent.com",
        "objects.githubusercontent.com",
        "api.github.com"
      ]
    },
    "filesystem": {
      "denyRead": [
        "~/.ssh/**",
        "~/.aws/**",
        "~/.kube/**",
        "~/.gnupg/**",
        "~/.azure/**"
      ]
    }
  }
}
```

NEVER allowlist: `*.cloudflare.com`, `*.akamai.net`, `*.fastly.net` (domain fronting).

## 1d. Allow/ask split

**Allow** (read-only, no side effects):
```
Read, Glob, Grep, WebSearch, WebFetch
Bash(ls *), Bash(wc *), Bash(echo *), Bash(jq *), Bash(tree *), Bash(sort *), Bash(test *)
Bash(git status*), Bash(git log*), Bash(git diff*), Bash(git show*), Bash(git branch*), Bash(git ls-files*)
Bash(rtk *)
Bash(python3 *), Bash(bun *), Bash(bunx *)
Bash(docker compose *), Bash(docker ps*)
```

**Ask** (writes, network, destructive):
```
Bash(git add*), Bash(git commit*), Bash(git push*)
Bash(git checkout*), Bash(git mv*), Bash(git reset*)
Bash(curl *), Bash(wget *)
Bash(cp *), Bash(mkdir *), Bash(mv *), Bash(rm *)
Bash(sudo *), Bash(chmod *)
Bash(bash *), Bash(source *), Bash(for *)
```

## Smoke tests

| Test | Expected |
|------|----------|
| `cat .env.example` (create dummy first) | Blocked by permissions.deny |
| `curl https://evil.com` | Blocked by sandbox network deny |
| `npm install lodash` | Prompted (ask) |
| `git status` | Allowed silently |
| `Read ~/.ssh/id_rsa` | Blocked by permissions.deny |
| Create file in `/usr/local/bin/` | Blocked by sandbox filesystem |

## Checklist

- [ ] Bash deny patterns match Read/Edit/Write patterns (no gaps)
- [ ] Network allowlist covers: gh CLI, npm, pip, bun, yarn
- [ ] `autoAllowMode: false` tested — workflow still usable
- [ ] Allow rules subset of existing .local.json (no new permissions)
- [ ] Ask rules cover all write/destructive operations
