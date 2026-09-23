#!/usr/bin/env python3
"""ring.py — scan / collide / sweep / graph for the `ring` plugin.

Interface fixed by SPEC-ring.md §8.4. Standard library only.

It copies and computes; it never judges (reference_llm-extractif-verbatim-par-code).

Exit codes: 0 = nothing to report, 1 = collision or anomaly, 2 = usage error.
JSON on stdout for scan / collide / sweep. `graph` prints raw Mermaid text.
"""

import argparse
import json
import os
import re
import subprocess
import sys

FIND = "/usr/bin/find"

RING_FILENAME_RE = re.compile(r'^ring-(.+)-llm\.md$')
ISO_RE = re.compile(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$')
# "—" / "-" in a multivalued field is the documented "none" sentinel, never a value.
SENTINELS = {"—", "–", "-"}

ESCALADE_RE = re.compile(r'^\*\*escalade\*\*\s*[—–-]\s*(.+)$', re.MULTILINE)
VALID_STATUS = ("active", "parked", "done")
VALID_ESCALADE = ("human", "parent", "irreversible")
MULTI_KEYS = ("create", "writes", "children")


class UsageError(Exception):
    pass


# ---------------------------------------------------------------------------
# Header / file parsing
# ---------------------------------------------------------------------------

def parse_header(header_lines):
    """Parse the flat `key: value` header (before the first bare `---`).

    Multivalued keys (create/writes/children) accumulate one entry per
    matching line. A YAML-indented list under one of those keys is still
    captured (best effort) but flagged as an anomaly.
    """
    header = {}
    multi = {k: [] for k in MULTI_KEYS}
    anomalies = []
    last_key = None
    yaml_flagged = set()

    for raw in header_lines:
        line = raw.rstrip("\n")
        if not line.strip():
            continue
        if line[0] in (" ", "\t"):
            stripped = line.strip()
            if last_key in MULTI_KEYS and stripped.startswith("-"):
                val = stripped[1:].strip()
                if val and val not in SENTINELS:
                    multi[last_key].append(val)
                if last_key not in yaml_flagged:
                    anomalies.append(f"YAML list style under {last_key}:")
                    yaml_flagged.add(last_key)
            continue
        m = re.match(r'^([A-Za-z_]+):\s*(.*)$', line)
        if not m:
            continue
        key, val = m.group(1), m.group(2).strip()
        if key in MULTI_KEYS:
            last_key = key
            if val and val not in SENTINELS:
                multi[key].append(val)
        else:
            last_key = None
            header[key] = val
            if key == "owner":
                anomalies.append("owner: field present")

    return header, multi, anomalies


def slug_from_filename(fpath):
    base = os.path.basename(fpath)
    m = RING_FILENAME_RE.match(base)
    return m.group(1) if m else None


def parse_ring_file(fpath, location):
    with open(fpath, "r", encoding="utf-8") as f:
        text = f.read()
    lines = text.splitlines()

    header_lines = []
    body_start = len(lines)
    for i, l in enumerate(lines):
        if l.strip() == "---":
            body_start = i + 1
            break
        header_lines.append(l)

    header, multi, anomalies = parse_header(header_lines)
    body = "\n".join(lines[body_start:])

    slug_file = slug_from_filename(fpath)
    ring_field = header.get("ring")
    if ring_field is not None and slug_file is not None and ring_field != slug_file:
        anomalies.append(
            f"ring: '{ring_field}' does not match filename slug '{slug_file}'"
        )

    status = header.get("status")
    if status is not None and status not in VALID_STATUS:
        anomalies.append(f"status: invalid token '{status}'")
    if status == "active" and location == "done":
        anomalies.append("active ring found in done/")
    if status in ("parked", "done") and location == "root":
        anomalies.append(f"{status} ring found at root, expected in done/")

    opened = header.get("opened")
    if opened is not None and not ISO_RE.match(opened):
        anomalies.append(f"opened not ISO: '{opened}'")

    for val in multi["create"]:
        if not val.startswith("/"):
            anomalies.append(f"create: relative path '{val}'")
        elif not val.endswith("/"):
            anomalies.append(f"create: prefix without trailing slash '{val}'")
    for val in multi["writes"]:
        if not val.startswith("/"):
            anomalies.append(f"writes: relative path '{val}'")

    m = ESCALADE_RE.search(body)
    escalade = m.group(1).strip() if m else None
    vehicle = header.get("vehicle")
    if vehicle == "session" and (escalade is None or escalade not in VALID_ESCALADE):
        anomalies.append(
            f"session vehicle with invalid/missing escalade: '{escalade}'"
        )

    ring_slug = ring_field if ring_field is not None else slug_file

    return {
        "file": fpath,
        "location": location,
        "ring": ring_slug,
        "parent": header.get("parent"),
        "status": status,
        "vehicle": vehicle,
        "opened": opened,
        "saved": header.get("saved"),
        "closed": header.get("closed"),
        "children": multi["children"],
        "create": multi["create"],
        "writes": multi["writes"],
        "escalade": escalade,
        "anomalies": anomalies,
    }


def find_ring_files(root_dir):
    root_dir = os.path.realpath(root_dir)
    if not os.path.isdir(root_dir):
        raise UsageError(f"not a directory: {root_dir}")
    results = []
    for fname in sorted(os.listdir(root_dir)):
        fpath = os.path.join(root_dir, fname)
        if os.path.isfile(fpath) and RING_FILENAME_RE.match(fname):
            results.append((fpath, "root"))
    done_dir = os.path.join(root_dir, "done")
    if os.path.isdir(done_dir):
        for fname in sorted(os.listdir(done_dir)):
            fpath = os.path.join(done_dir, fname)
            if os.path.isfile(fpath) and RING_FILENAME_RE.match(fname):
                results.append((fpath, "done"))
    return results


def scan_dir(dir_path):
    files = find_ring_files(dir_path)
    rings = [parse_ring_file(fp, loc) for fp, loc in files]
    known_slugs = {r["ring"] for r in rings if r["ring"]}
    for r in rings:
        parent = r["parent"]
        if parent and parent != "root" and parent not in known_slugs:
            r["anomalies"].append(f"parent not found (phantom): '{parent}'")
    return rings


# ---------------------------------------------------------------------------
# collide
# ---------------------------------------------------------------------------

def normalize_claim(path):
    is_prefix = path.endswith("/")
    rp = os.path.realpath(path)
    if is_prefix and not rp.endswith("/"):
        rp = rp + "/"
    return rp


def claims_collide(a, b):
    if a == b:
        return True
    if a.endswith("/") and b.startswith(a):
        return True
    if b.endswith("/") and a.startswith(b):
        return True
    return False


def build_ancestors(slug, parent_map):
    ancestors = set()
    seen = set()
    cur = slug
    while True:
        p = parent_map.get(cur)
        if not p or p == "root" or p in seen:
            break
        ancestors.add(p)
        seen.add(p)
        cur = p
    return ancestors


def is_lineage(a_slug, b_slug, parent_map):
    anc_a = build_ancestors(a_slug, parent_map)
    anc_b = build_ancestors(b_slug, parent_map)
    return b_slug in anc_a or a_slug in anc_b


def collide_dir(dir_path, cand_slug=None, cand_parent=None,
                 cand_create=None, cand_writes=None):
    rings = scan_dir(dir_path)
    active = [r for r in rings if r["status"] in ("active", "parked")]

    parent_map = {}
    entities = []
    for r in active:
        parent_map[r["ring"]] = r["parent"]
        claims = list(r["create"]) + list(r["writes"])
        entities.append({"slug": r["ring"], "claims": claims})

    if cand_slug:
        parent_map[cand_slug] = cand_parent or "root"
        claims = list(cand_create or []) + list(cand_writes or [])
        entities.append({"slug": cand_slug, "claims": claims})

    pairs = []
    n = len(entities)
    for i in range(n):
        for j in range(i + 1, n):
            ea, eb = entities[i], entities[j]
            if ea["slug"] == eb["slug"]:
                continue
            for cv_a in ea["claims"]:
                na = normalize_claim(cv_a)
                for cv_b in eb["claims"]:
                    nb = normalize_claim(cv_b)
                    if claims_collide(na, nb):
                        relation = (
                            "lineage"
                            if is_lineage(ea["slug"], eb["slug"], parent_map)
                            else "none"
                        )
                        pairs.append({
                            "a": ea["slug"],
                            "b": eb["slug"],
                            "prefix_a": cv_a,
                            "prefix_b": cv_b,
                            "relation": relation,
                        })
    return pairs


# ---------------------------------------------------------------------------
# sweep
# ---------------------------------------------------------------------------

def run_find(args_list):
    cmd = [FIND] + args_list
    proc = subprocess.run(cmd, capture_output=True, text=True)
    return [l for l in proc.stdout.splitlines() if l.strip()]


def sweep(opened, prefixes, roots, excludes, ring_file):
    if not ISO_RE.match(opened):
        raise UsageError(
            f"--opened must be ISO YYYY-MM-DDTHH:MM:SSZ, got '{opened}'"
        )
    if not roots:
        raise UsageError("--root is required (at least one)")

    norm_prefixes = [os.path.realpath(p.rstrip("/")) for p in prefixes]
    norm_roots = [os.path.realpath(r) for r in roots]
    norm_ring_file = os.path.realpath(ring_file) if ring_file else None

    inventory = set()
    for p in norm_prefixes:
        inventory.update(run_find([p, "-newermt", opened, "-type", "f"]))

    review = set()
    for root in norm_roots:
        args = [root, "-newermt", opened, "-type", "f"]
        for p in norm_prefixes:
            args += ["-not", "-path", f"{p}/*"]
        default_excl = ["*/.git/*", f"{root}/.tmp/*", "*/build/*"]
        for e in default_excl + list(excludes or []):
            args += ["-not", "-path", e]
        if norm_ring_file:
            args += ["-not", "-path", norm_ring_file]
        review.update(run_find(args))

    return sorted(inventory), sorted(review)


# ---------------------------------------------------------------------------
# graph
# ---------------------------------------------------------------------------

def mermaid_id(slug):
    return "ring_" + re.sub(r'[^A-Za-z0-9_]', '_', slug)


def build_graph(dir_path):
    rings = scan_dir(dir_path)
    known = {r["ring"] for r in rings if r["ring"]}

    lines = ["flowchart TD"]
    node_ids = {}
    declared = set()

    def node_id(slug):
        if slug not in node_ids:
            node_ids[slug] = mermaid_id(slug)
        return node_ids[slug]

    def declare(slug, label, cls):
        nid = node_id(slug)
        if nid not in declared:
            lines.append(f'  {nid}["{label}"]')
            declared.add(nid)
            class_lines[nid] = cls
        elif cls != "phantom" and class_lines.get(nid) == "phantom":
            # the node was first met as a missing parent/child, then found for real
            class_lines[nid] = cls
        return nid

    class_lines = {}
    edges = []

    root_id = declare("root", "root", "rootcls")

    for r in rings:
        slug = r["ring"]
        vehicle = r["vehicle"] or "?"
        status = r["status"] if r["status"] in VALID_STATUS else "active"
        label = f'{slug}<br/>({vehicle})'
        nid = declare(slug, label, status)

        parent = r["parent"]
        if parent == "root" or not parent:
            edges.append((root_id, nid))
        elif parent in known:
            edges.append((node_id(parent), nid))
        else:
            pid = declare(parent, parent, "phantom")
            edges.append((pid, nid))

        for child in r["children"]:
            if child and child not in known:
                cid = declare(child, child, "phantom")
                edges.append((nid, cid))

    for a, b in edges:
        lines.append(f"  {a} --> {b}")

    lines.append("  classDef active fill:#90EE90,stroke:#333,color:#000")
    lines.append("  classDef parked fill:#FFD700,stroke:#333,color:#000")
    lines.append("  classDef done fill:#D3D3D3,stroke:#333,color:#000")
    lines.append(
        "  classDef phantom fill:#FFFFFF,stroke:#333,stroke-dasharray: 5 5,color:#000"
    )
    lines.append("  classDef rootcls fill:#87CEEB,stroke:#333,color:#000")
    for nid, cls in class_lines.items():
        lines.append(f"  class {nid} {cls}")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main(argv):
    parser = argparse.ArgumentParser(prog="ring.py")
    sub = parser.add_subparsers(dest="command", required=True)

    p_scan = sub.add_parser("scan")
    p_scan.add_argument("dir")

    p_collide = sub.add_parser("collide")
    p_collide.add_argument("dir")
    p_collide.add_argument("--slug")
    p_collide.add_argument("--parent")
    p_collide.add_argument("--create", action="append", default=[])
    p_collide.add_argument("--writes", action="append", default=[])

    p_sweep = sub.add_parser("sweep")
    p_sweep.add_argument("--opened", required=True)
    p_sweep.add_argument("--prefix", action="append", default=[])
    p_sweep.add_argument("--root", action="append", default=[])
    p_sweep.add_argument("--exclude", action="append", default=[])
    p_sweep.add_argument("--ring-file")

    p_graph = sub.add_parser("graph")
    p_graph.add_argument("dir")

    args = parser.parse_args(argv)

    try:
        if args.command == "scan":
            rings = scan_dir(args.dir)
            print(json.dumps(rings, indent=2))
            return 1 if any(r["anomalies"] for r in rings) else 0

        if args.command == "collide":
            pairs = collide_dir(
                args.dir, args.slug, args.parent, args.create, args.writes
            )
            print(json.dumps(pairs, indent=2))
            return 1 if any(p["relation"] == "none" for p in pairs) else 0

        if args.command == "sweep":
            inventory, review = sweep(
                args.opened, args.prefix, args.root, args.exclude, args.ring_file
            )
            print(json.dumps({"inventory": inventory, "review": review}, indent=2))
            return 1 if review else 0

        if args.command == "graph":
            print(build_graph(args.dir))
            return 0

    except UsageError as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        return 2
    except Exception as e:
        print(json.dumps({"error": f"unexpected: {e}"}), file=sys.stderr)
        return 2

    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
