"""Tests for AETHON Master Verification Quality Gate.

Proves:
1. A failed subprocess makes the overall gate fail.
2. A missing required command makes the gate fail.
3. Test totals are derived from current output instead of hardcoded constants.
4. A report records the correct current commit and timestamp.
5. A previously generated report cannot be reused as proof of the current run.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path
from unittest.mock import patch

from scripts.run_overall_verification import (
    GateResult,
    execute_gate_command,
    get_git_commit,
    parse_node_test_metrics,
    parse_pytest_metrics,
    run_overall_verification,
    validate_verification_report,
)


def test_failed_subprocess_makes_overall_gate_fail(tmp_path: Path) -> None:
    """Proves that any failed subprocess in a gate makes the overall verification FAIL."""
    report_file = tmp_path / "test_report.json"

    def mock_gate_executor(
        name: str,
        command: list[str],
        cwd: Path,
        **kwargs,
    ) -> GateResult:
        if name == "backend_ruff_lint":
            return GateResult(
                gate_name=name,
                command=command,
                status="FAIL",
                exit_code=1,
                error_message="Lint errors found in app/datasets/archive_client.py",
            )
        return GateResult(
            gate_name=name,
            command=command,
            status="PASS",
            exit_code=0,
            duration_seconds=0.1,
            stdout_summary="Command succeeded",
        )

    with patch(
        "scripts.run_overall_verification.execute_gate_command",
        side_effect=mock_gate_executor,
    ):
        report = run_overall_verification(
            output_report=report_file,
            include_frontend=False,
            include_benchmarks=False,
        )

    assert report["overall_status"] == "FAIL"
    assert report["summary"]["failed_gates"] == 1
    failed_gate = next(g for g in report["gates"] if g["gate_name"] == "backend_ruff_lint")
    assert failed_gate["status"] == "FAIL"
    assert failed_gate["exit_code"] == 1


def test_missing_required_command_makes_gate_fail(tmp_path: Path) -> None:
    """Proves that a missing required command executable causes the gate to fail with code 127."""
    res = execute_gate_command(
        name="missing_tool",
        command=["non_existent_binary_tool_xyz_9999", "--version"],
        cwd=tmp_path,
        required=True,
    )
    assert res.status == "FAIL"
    assert res.exit_code == 127
    assert res.error_message is not None
    assert "not found in system PATH" in res.error_message


def test_test_totals_derived_dynamically_from_output() -> None:
    """Proves that test counts are dynamically parsed from tool stdout, not hardcoded."""
    # Pytest output parsing
    sample_pytest_1 = "================== 245 passed, 4 skipped in 12.34s =================="
    metrics_1 = parse_pytest_metrics(sample_pytest_1)
    assert metrics_1["passed"] == 245
    assert metrics_1["skipped"] == 4
    assert metrics_1["failed"] == 0
    assert metrics_1["errors"] == 0
    assert metrics_1["total"] == 249

    sample_pytest_failures = (
        "================== 18 passed, 3 failed, 2 errors, 1 skipped in 5.2s =================="
    )
    metrics_f = parse_pytest_metrics(sample_pytest_failures)
    assert metrics_f["passed"] == 18
    assert metrics_f["failed"] == 3
    assert metrics_f["errors"] == 2
    assert metrics_f["skipped"] == 1
    assert metrics_f["total"] == 24

    # Node test output parsing (using unicode escapes to prevent ambiguous character warnings)
    sample_node = (
        "\u2714 integration assertion passed (12.3ms)\n"
        "\u2139 tests 42\n"
        "\u2139 pass 40\n"
        "\u2139 fail 1\n"
        "\u2139 skipped 1\n"
    )
    node_metrics = parse_node_test_metrics(sample_node)
    assert node_metrics["total"] == 42
    assert node_metrics["passed"] == 40
    assert node_metrics["failed"] == 1
    assert node_metrics["skipped"] == 1


def test_report_records_correct_commit_and_timestamp(tmp_path: Path) -> None:
    """Proves that a generated report records the real git commit and an accurate UTC timestamp."""
    report_file = tmp_path / "timestamp_commit_report.json"

    mock_gate = GateResult(
        gate_name="test_gate",
        command=["python", "--version"],
        status="PASS",
        exit_code=0,
        duration_seconds=0.05,
    )

    with patch("scripts.run_overall_verification.execute_gate_command", return_value=mock_gate):
        report = run_overall_verification(
            output_report=report_file,
            include_frontend=False,
            include_benchmarks=False,
        )

    # Check git commit
    current_commit = get_git_commit()
    assert report["environment"]["git_commit"] == current_commit
    assert len(current_commit) >= 7

    # Check timestamp is ISO-8601 UTC and fresh (within 10 seconds of now)
    gen_time_str = report["generated_at_utc"]
    gen_time = datetime.fromisoformat(gen_time_str)
    now = datetime.now(UTC)
    assert abs((now - gen_time).total_seconds()) < 10.0


def test_previously_generated_report_cannot_be_reused_as_proof(tmp_path: Path) -> None:
    """Proves that stale reports, mismatched commit reports, or failing reports cannot be reused."""
    report_file = tmp_path / "stale_report.json"
    current_commit = get_git_commit()

    # 1. Report from 2 hours ago is rejected as stale
    old_time = (datetime.now(UTC) - timedelta(hours=2)).isoformat()
    stale_payload = {
        "report_id": "aethon_master_verification",
        "generated_at_utc": old_time,
        "overall_status": "PASS",
        "environment": {"git_commit": current_commit},
    }
    report_file.write_text(json.dumps(stale_payload), encoding="utf-8")
    valid, reason = validate_verification_report(report_file, max_age_seconds=300.0)
    assert not valid
    assert "stale" in reason.lower()

    # 2. Report from a different commit is rejected
    fresh_time = datetime.now(UTC).isoformat()
    mismatched_payload = {
        "report_id": "aethon_master_verification",
        "generated_at_utc": fresh_time,
        "overall_status": "PASS",
        "environment": {"git_commit": "0000000000000000000000000000000000000000"},
    }
    report_file.write_text(json.dumps(mismatched_payload), encoding="utf-8")
    valid, reason = validate_verification_report(
        report_file,
        max_age_seconds=300.0,
        expected_commit=current_commit,
    )
    assert not valid
    assert "commit" in reason.lower()

    # 3. Report with FAIL status is rejected
    failing_payload = {
        "report_id": "aethon_master_verification",
        "generated_at_utc": fresh_time,
        "overall_status": "FAIL",
        "environment": {"git_commit": current_commit},
    }
    report_file.write_text(json.dumps(failing_payload), encoding="utf-8")
    valid, reason = validate_verification_report(report_file, max_age_seconds=300.0)
    assert not valid
    assert "overall_status is 'fail'" in reason.lower()

    # 4. Genuine fresh, passing report for current commit is accepted
    passing_payload = {
        "report_id": "aethon_master_verification",
        "generated_at_utc": fresh_time,
        "overall_status": "PASS",
        "environment": {"git_commit": current_commit},
    }
    report_file.write_text(json.dumps(passing_payload), encoding="utf-8")
    valid, reason = validate_verification_report(report_file, max_age_seconds=300.0)
    assert valid
    assert "valid and current" in reason
