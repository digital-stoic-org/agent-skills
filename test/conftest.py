import os
from datetime import datetime, timezone
from pathlib import Path

import yaml

import pytest


# ── Run folder (session-scoped, timestamp-prefixed) ──────────────────────────

_OUTPUT_BASE = Path("/workspace/output")
_RUN_DIR: Path | None = None


def _get_run_dir() -> Path:
    """Return the per-run output folder, creating it on first call."""
    global _RUN_DIR
    if _RUN_DIR is None:
        ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
        _RUN_DIR = _OUTPUT_BASE / ts
        _RUN_DIR.mkdir(parents=True, exist_ok=True)
    return _RUN_DIR


# ── Marker registration ──────────────────────────────────────────────────────

def pytest_configure(config):
    config.addinivalue_line("markers", "structural: L2 structural tests (YAML, tokens, naming)")
    config.addinivalue_line("markers", "behavioral: L1/L3 behavioral tests (claude -p invocations)")

    # Initialize run dir early so harness can use it
    run_dir = _get_run_dir()

    # Configure harness to use run dir
    from harness import behavioral
    behavioral.set_run_dir(run_dir)


# ── L2-before-L1/L3 guard ────────────────────────────────────────────────────

_structural_failures: list[str] = []


def pytest_collection_modifyitems(session, config, items):
    """Reorder: structural tests run before behavioral tests."""
    structural = [i for i in items if i.get_closest_marker("structural")]
    behavioral = [i for i in items if i.get_closest_marker("behavioral")]
    other = [i for i in items if not i.get_closest_marker("structural") and not i.get_closest_marker("behavioral")]
    items[:] = structural + other + behavioral


def pytest_runtest_logreport(report):
    """Track structural failures so behavioral tests can be skipped."""
    if report.when == "call" and report.failed and hasattr(report, "nodeid"):
        # We need to detect if this was a structural test — check via nodeid pattern
        # or store nodeid in the failures list when we know it's structural
        pass


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()
    if report.when == "call" and report.failed:
        if item.get_closest_marker("structural"):
            _structural_failures.append(item.nodeid)


@pytest.hookimpl(tryfirst=True)
def pytest_runtest_setup(item):
    """Skip behavioral tests if any structural test has already failed."""
    if item.get_closest_marker("behavioral") and _structural_failures:
        pytest.skip(
            f"Skipped: {len(_structural_failures)} structural test(s) failed — fix L2 before running behavioral"
        )


# ── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def api_key():
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        pytest.skip("ANTHROPIC_API_KEY not set")
    return key


@pytest.fixture
def workspace():
    run_dir = _get_run_dir()
    run_dir.mkdir(parents=True, exist_ok=True)
    yield run_dir
    # No teardown — output persists for the container run (cost.yaml accumulates across tests)


@pytest.fixture
def skills_dir():
    return Path("/workspace/skills")


@pytest.fixture
def gtd_skills_dir():
    return Path("/workspace/gtd-skills")


# ── Suite-end cost reconciliation (ADR-5) ────────────────────────────────────

def pytest_sessionfinish(session, exitstatus):
    """Write cost reconciliation report after all tests complete."""
    run_dir = _get_run_dir()
    cost_file = run_dir / "cost.yaml"
    reconciliation_file = run_dir / "cost-reconciliation.yaml"

    estimated_total = 0.0
    if cost_file.exists():
        try:
            state = yaml.safe_load(cost_file.read_text()) or {}
            estimated_total = state.get("running_total", 0.0)
        except (yaml.YAMLError, OSError):
            pass

    reconciliation = {
        "estimated_total": estimated_total,
        "api_reported_total": None,
        "drift_pct": None,
    }

    reconciliation_file.parent.mkdir(parents=True, exist_ok=True)
    reconciliation_file.write_text(yaml.dump(reconciliation, default_flow_style=False, sort_keys=False))
