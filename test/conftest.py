import os
from pathlib import Path

import pytest


# ── Marker registration ──────────────────────────────────────────────────────

def pytest_configure(config):
    config.addinivalue_line("markers", "structural: L2 structural tests (YAML, tokens, naming)")
    config.addinivalue_line("markers", "behavioral: L1/L3 behavioral tests (claude -p invocations)")


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
    output_dir = Path("/workspace/output")
    output_dir.mkdir(parents=True, exist_ok=True)
    yield output_dir
    # No teardown — output persists for the container run (cost.json accumulates across tests)


@pytest.fixture
def skills_dir():
    return Path("/workspace/skills")
