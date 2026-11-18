"""
test_cost_cap_enforcement.py — Verify cost cap guard skips tests at $0.48 threshold.

Injects a running total of $0.48 into cost.yaml, then asserts check_cost_cap() raises
pytest.skip.Exception with the correct warning message.
"""
import yaml

import pytest

from harness import behavioral
from harness.behavioral import COST_WARN_THRESHOLD, check_cost_cap


@pytest.mark.behavioral
def test_cost_cap_skips_at_threshold(workspace, tmp_path):
    """Injecting $0.48 running total causes check_cost_cap to skip."""
    # Inject a running total just at the warn threshold
    injected_total = 0.48
    assert injected_total >= COST_WARN_THRESHOLD, (
        f"Test assumes {injected_total} >= {COST_WARN_THRESHOLD}"
    )

    # Save original cost state so we can restore it
    original_state = None
    if behavioral.COST_FILE.exists():
        original_state = behavioral.COST_FILE.read_text()

    try:
        # Inject the high running total
        behavioral.COST_FILE.parent.mkdir(parents=True, exist_ok=True)
        behavioral.COST_FILE.write_text(yaml.dump({
            "tests": {"injected_cap_test": injected_total},
            "running_total": injected_total,
        }, default_flow_style=False, sort_keys=False))

        # check_cost_cap should raise pytest.skip.Exception
        with pytest.raises(pytest.skip.Exception, match="WARNING: cost cap reached"):
            check_cost_cap("cap_enforcement_test")

    finally:
        # Restore original cost state so subsequent tests aren't affected
        if original_state is not None:
            behavioral.COST_FILE.write_text(original_state)
        elif behavioral.COST_FILE.exists():
            behavioral.COST_FILE.unlink()
