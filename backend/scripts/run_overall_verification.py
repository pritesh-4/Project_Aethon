"""Unified Master Verification Quality Gate for AETHON.

Executes live subprocesses and aggregates empirical evidence:
1. Environment & platform metadata (Python, Node, git commit).
2. Backend pytest test suite (executes live pytest, extracts dynamic pass/fail/skip totals).
3. Backend Ruff format and lint checks (executes live ruff format and ruff check).
4. Backend Mypy static type checking (executes live mypy app).
5. Frontend quality checks (Prettier format, ESLint, TypeScript tsc -b, node tests, Vite build).
6. Scientific synthetic benchmark smoke generation & checksum verification.
7. Offline demonstration pipeline runner verification.

Emits an authoritative machine-readable report to:
`reports/overall_verification_report.json`
"""

from __future__ import annotations

import argparse
import json
import os
import platform
import re
import shutil
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

script_dir = Path(__file__).resolve().parent
backend_root = script_dir.parent
repo_root = backend_root.parent


def get_git_commit(cwd: Path | None = None) -> str:
    """Retrieve current Git commit SHA."""
    try:
        res = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=str(cwd or repo_root),
            capture_output=True,
            text=True,
            check=True,
        )
        return res.stdout.strip()
    except Exception:
        return "unknown"


def get_node_version(cwd: Path | None = None) -> str:
    """Retrieve runtime Node.js version."""
    node_bin = shutil.which("node")
    if not node_bin:
        return "not_installed"
    try:
        res = subprocess.run(
            [node_bin, "--version"],
            cwd=str(cwd or repo_root),
            capture_output=True,
            text=True,
            check=True,
        )
        return res.stdout.strip()
    except Exception:
        return "unknown"


@dataclass
class GateResult:
    gate_name: str
    command: list[str]
    status: str  # "PASS", "FAIL", "SKIP", "NOT RUN"
    exit_code: int | None = None
    duration_seconds: float = 0.0
    stdout_summary: str = ""
    details: dict[str, Any] = field(default_factory=dict)
    error_message: str | None = None


def resolve_executable(cmd: list[str]) -> list[str]:
    """Resolve executable path, handling .cmd/.bat wrappers on Windows."""
    if not cmd:
        return cmd
    binary = cmd[0]
    resolved = shutil.which(binary)
    if resolved:
        return [resolved, *cmd[1:]]
    return cmd


def execute_gate_command(
    name: str,
    command: list[str],
    cwd: Path,
    timeout_seconds: float = 120.0,
    required: bool = True,
    env: dict[str, str] | None = None,
) -> GateResult:
    """Execute a quality gate command and parse its outcome empirically."""
    cmd_resolved = resolve_executable(command)
    cmd_display = " ".join(command)

    # Check for missing executable
    if not shutil.which(cmd_resolved[0]):
        return GateResult(
            gate_name=name,
            command=command,
            status="FAIL" if required else "SKIP",
            exit_code=127,
            error_message=f"Executable '{command[0]}' not found in system PATH.",
        )

    exec_env = os.environ.copy()
    if env:
        exec_env.update(env)

    start_time = time.perf_counter()
    try:
        res = subprocess.run(
            cmd_resolved,
            cwd=str(cwd),
            capture_output=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout_seconds,
            env=exec_env,
        )
        duration = round(time.perf_counter() - start_time, 2)
        status = "PASS" if res.returncode == 0 else "FAIL"

        # Provide a clean summary of stdout/stderr
        summary_lines = [
            line.strip() for line in (res.stdout + "\n" + res.stderr).splitlines() if line.strip()
        ]
        summary = " | ".join(summary_lines[-3:]) if summary_lines else "No output"

        return GateResult(
            gate_name=name,
            command=command,
            status=status,
            exit_code=res.returncode,
            duration_seconds=duration,
            stdout_summary=summary,
            details={"raw_stdout": res.stdout, "raw_stderr": res.stderr},
        )
    except subprocess.TimeoutExpired:
        duration = round(time.perf_counter() - start_time, 2)
        return GateResult(
            gate_name=name,
            command=command,
            status="FAIL",
            exit_code=-1,
            duration_seconds=duration,
            error_message=f"Command timed out after {timeout_seconds}s: {cmd_display}",
        )
    except Exception as err:
        duration = round(time.perf_counter() - start_time, 2)
        return GateResult(
            gate_name=name,
            command=command,
            status="FAIL",
            exit_code=-1,
            duration_seconds=duration,
            error_message=f"Execution error for '{cmd_display}': {err}",
        )


def parse_pytest_metrics(output: str) -> dict[str, Any]:
    """Dynamically parse test counts from pytest stdout."""
    metrics: dict[str, Any] = {
        "passed": 0,
        "failed": 0,
        "skipped": 0,
        "errors": 0,
        "total": 0,
    }
    passed_m = re.search(r"(\d+)\s+passed", output)
    failed_m = re.search(r"(\d+)\s+failed", output)
    skipped_m = re.search(r"(\d+)\s+skipped", output)
    errors_m = re.search(r"(\d+)\s+errors?", output)

    if passed_m:
        metrics["passed"] = int(passed_m.group(1))
    if failed_m:
        metrics["failed"] = int(failed_m.group(1))
    if skipped_m:
        metrics["skipped"] = int(skipped_m.group(1))
    if errors_m:
        metrics["errors"] = int(errors_m.group(1))

    metrics["total"] = (
        metrics["passed"] + metrics["failed"] + metrics["skipped"] + metrics["errors"]
    )
    return metrics


def parse_node_test_metrics(output: str) -> dict[str, Any]:
    """Dynamically parse test counts from node --test stdout."""
    metrics: dict[str, Any] = {
        "passed": 0,
        "failed": 0,
        "skipped": 0,
        "total": 0,
    }
    pass_m = re.search(r"\bpass\s+(\d+)", output)
    fail_m = re.search(r"\bfail\s+(\d+)", output)
    skip_m = re.search(r"\bskipped\s+(\d+)", output)
    total_m = re.search(r"\btests\s+(\d+)", output)

    if pass_m:
        metrics["passed"] = int(pass_m.group(1))
    if fail_m:
        metrics["failed"] = int(fail_m.group(1))
    if skip_m:
        metrics["skipped"] = int(skip_m.group(1))
    if total_m:
        metrics["total"] = int(total_m.group(1))
    else:
        metrics["total"] = metrics["passed"] + metrics["failed"] + metrics["skipped"]
    return metrics


def run_overall_verification(
    output_report: Path,
    include_frontend: bool = True,
    include_backend: bool = True,
    include_benchmarks: bool = True,
) -> dict[str, Any]:
    """Run genuine dynamic quality gates and compile authoritative audit report."""
    git_commit = get_git_commit()
    node_version = get_node_version()
    python_version = f"{sys.version.split()[0]} ({platform.platform()})"
    now_utc = datetime.now(UTC).isoformat()

    print("=====================================================================")
    print("      AETHON — Authoritative Dynamic Master Verification Gate        ")
    print("=====================================================================")
    print(f"Timestamp:       {now_utc}")
    print(f"Git Commit:      {git_commit}")
    print(f"Python Version:  {python_version}")
    print(f"Node.js Version: {node_version}")
    print("---------------------------------------------------------------------")

    gates: list[GateResult] = []

    # 1. Backend Gates
    if include_backend:
        print("\n[Gate 1/7] Running backend Pytest test suite...")
        res_pytest = execute_gate_command(
            name="backend_pytest",
            command=[sys.executable, "-m", "pytest", "-q"],
            cwd=backend_root,
            timeout_seconds=150.0,
        )
        res_pytest.details.update(parse_pytest_metrics(res_pytest.details.get("raw_stdout", "")))
        print(
            f"  Status: {res_pytest.status} (exit {res_pytest.exit_code}, {res_pytest.duration_seconds}s)"
        )
        print(
            f"  Summary: {res_pytest.details.get('passed', 0)} passed, {res_pytest.details.get('failed', 0)} failed"
        )
        gates.append(res_pytest)

        print("\n[Gate 2/7] Running backend Ruff format and lint checks...")
        res_ruff_fmt = execute_gate_command(
            name="backend_ruff_format",
            command=[sys.executable, "-m", "ruff", "format", "--check", "app", "tests"],
            cwd=backend_root,
            timeout_seconds=30.0,
        )
        print(f"  Ruff Format: {res_ruff_fmt.status} (exit {res_ruff_fmt.exit_code})")
        gates.append(res_ruff_fmt)

        res_ruff_lint = execute_gate_command(
            name="backend_ruff_lint",
            command=[sys.executable, "-m", "ruff", "check", "app", "tests"],
            cwd=backend_root,
            timeout_seconds=30.0,
        )
        print(f"  Ruff Lint:   {res_ruff_lint.status} (exit {res_ruff_lint.exit_code})")
        gates.append(res_ruff_lint)

        print("\n[Gate 3/7] Running backend Mypy static type checking...")
        res_mypy = execute_gate_command(
            name="backend_mypy",
            command=[sys.executable, "-m", "mypy", "app"],
            cwd=backend_root,
            timeout_seconds=45.0,
        )
        print(
            f"  Mypy Status: {res_mypy.status} (exit {res_mypy.exit_code}, {res_mypy.duration_seconds}s)"
        )
        gates.append(res_mypy)

    # 2. Frontend Gates
    if include_frontend:
        npm_bin = shutil.which("npm") or "npm"

        print("\n[Gate 4/7] Running frontend Prettier formatting check...")
        res_prettier = execute_gate_command(
            name="frontend_prettier",
            command=[npm_bin, "run", "format:check"],
            cwd=repo_root,
            timeout_seconds=60.0,
        )
        print(f"  Prettier: {res_prettier.status} (exit {res_prettier.exit_code})")
        gates.append(res_prettier)

        print("\n[Gate 5/7] Running frontend ESLint and TypeScript checks...")
        res_eslint = execute_gate_command(
            name="frontend_eslint",
            command=[npm_bin, "run", "lint"],
            cwd=repo_root,
            timeout_seconds=90.0,
        )
        print(f"  ESLint:     {res_eslint.status} (exit {res_eslint.exit_code})")
        gates.append(res_eslint)

        res_tsc = execute_gate_command(
            name="frontend_typecheck",
            command=[npm_bin, "run", "typecheck"],
            cwd=repo_root,
            timeout_seconds=60.0,
        )
        print(f"  TypeScript: {res_tsc.status} (exit {res_tsc.exit_code})")
        gates.append(res_tsc)

        print("\n[Gate 6/9] Running frontend unit tests and production build...")
        res_f_test = execute_gate_command(
            name="frontend_unit_tests",
            command=[npm_bin, "run", "test:unit"],
            cwd=repo_root,
            timeout_seconds=60.0,
        )
        res_f_test.details.update(parse_node_test_metrics(res_f_test.details.get("raw_stdout", "")))
        print(f"  Node Tests: {res_f_test.status} ({res_f_test.details.get('passed', 0)} passed)")
        gates.append(res_f_test)

        res_build = execute_gate_command(
            name="frontend_production_build",
            command=[npm_bin, "run", "build"],
            cwd=repo_root,
            timeout_seconds=90.0,
        )
        print(f"  Vite Build: {res_build.status} (exit {res_build.exit_code})")
        gates.append(res_build)

        print("\n[Gate 7/9] Running Playwright browser end-to-end acceptance suite...")
        res_e2e = execute_gate_command(
            name="browser_e2e_acceptance",
            command=[npm_bin, "run", "test:e2e"],
            cwd=repo_root,
            timeout_seconds=120.0,
        )
        res_e2e.details.update(parse_node_test_metrics(res_e2e.details.get("raw_stdout", "")))
        print(
            f"  Browser E2E: {res_e2e.status} (exit {res_e2e.exit_code}, {res_e2e.details.get('passed', 0)} journeys passed, {res_e2e.duration_seconds}s)"
        )
        gates.append(res_e2e)

    # 3. Scientific Verification & Offline Demo Gates
    if include_benchmarks:
        print("\n[Gate 8/9] Running scientific pipeline & benchmark evaluation suites...")
        res_pipeline = execute_gate_command(
            name="scientific_pipeline_verification",
            command=[
                sys.executable,
                str(backend_root / "scripts" / "verify_scientific_pipeline.py"),
            ],
            cwd=backend_root,
            timeout_seconds=60.0,
        )
        print(f"  Pipeline Verifier:  {res_pipeline.status} (exit {res_pipeline.exit_code})")
        gates.append(res_pipeline)

        res_eval = execute_gate_command(
            name="scientific_benchmark_evaluation",
            command=[
                sys.executable,
                str(backend_root / "scripts" / "run_benchmark_evaluation.py"),
            ],
            cwd=backend_root,
            timeout_seconds=60.0,
        )
        print(f"  Benchmark Evaluator: {res_eval.status} (exit {res_eval.exit_code})")
        gates.append(res_eval)

        print("\n[Gate 9/9] Running synthetic benchmark and offline demonstration...")
        with tempfile.TemporaryDirectory() as tmp_bench_dir:
            res_bench = execute_gate_command(
                name="synthetic_benchmark_smoke",
                command=[
                    sys.executable,
                    str(backend_root / "scripts" / "generate_synthetic_benchmark.py"),
                    "--output-dir",
                    tmp_bench_dir,
                    "--seed",
                    "42",
                    "--dataset-id",
                    "master_gate_smoke",
                    "--verify",
                ],
                cwd=repo_root,
                timeout_seconds=30.0,
            )
            print(f"  Benchmark Smoke:    {res_bench.status} (exit {res_bench.exit_code})")
            gates.append(res_bench)

        with tempfile.TemporaryDirectory() as tmp_demo_dir:
            res_demo = execute_gate_command(
                name="offline_demo_acceptance",
                command=[
                    sys.executable,
                    str(repo_root / "scripts" / "run_offline_demo.py"),
                    "--output-dir",
                    tmp_demo_dir,
                    "--seed",
                    "42",
                ],
                cwd=repo_root,
                timeout_seconds=45.0,
            )
            print(f"  Offline Demo:       {res_demo.status} (exit {res_demo.exit_code})")
            gates.append(res_demo)

    # Calculate overall gate status
    overall_status = "PASS"
    for g in gates:
        if g.status != "PASS":
            overall_status = "FAIL"
            break

    # Structure master report
    master_report: dict[str, Any] = {
        "report_id": "aethon_master_verification",
        "generated_at_utc": now_utc,
        "overall_status": overall_status,
        "environment": {
            "python_version": python_version,
            "node_version": node_version,
            "platform": platform.platform(),
            "git_commit": git_commit,
            "working_directory": str(repo_root),
        },
        "gates": [
            {
                "gate_name": g.gate_name,
                "status": g.status,
                "command": " ".join(g.command),
                "exit_code": g.exit_code,
                "duration_seconds": g.duration_seconds,
                "summary": g.stdout_summary,
                "error": g.error_message,
                "details": {k: v for k, v in g.details.items() if not k.startswith("raw_")},
            }
            for g in gates
        ],
        "summary": {
            "total_gates": len(gates),
            "passed_gates": sum(1 for g in gates if g.status == "PASS"),
            "failed_gates": sum(1 for g in gates if g.status == "FAIL"),
            "skipped_gates": sum(1 for g in gates if g.status == "SKIP"),
        },
    }

    # Write report
    output_report = Path(output_report)
    output_report.parent.mkdir(parents=True, exist_ok=True)
    with open(output_report, "w", encoding="utf-8") as f:
        json.dump(master_report, f, indent=2)

    # Also mirror into top-level canonical reports/ if output_report is elsewhere
    canonical_report = repo_root / "reports" / "overall_verification_report.json"
    if output_report.resolve() != canonical_report.resolve():
        canonical_report.parent.mkdir(parents=True, exist_ok=True)
        with open(canonical_report, "w", encoding="utf-8") as f:
            json.dump(master_report, f, indent=2)

    print("\n---------------------------------------------------------------------")
    print(f"Overall Verification Result: {overall_status}")
    print(
        f"Gates Passed: {master_report['summary']['passed_gates']}/{master_report['summary']['total_gates']}"
    )
    print(f"Report written: {output_report}")
    print("=====================================================================")

    return master_report


def validate_verification_report(
    report_path: Path,
    max_age_seconds: float = 300.0,
    expected_commit: str | None = None,
    must_pass: bool = True,
) -> tuple[bool, str]:
    """Validate that a report exists, is fresh, matches git commit, and passed.

    A previously generated report cannot be reused as proof of current run if:
    - Its generated_at_utc timestamp is older than max_age_seconds.
    - Its git_commit does not match current HEAD (or expected_commit).
    - Its overall_status is not 'PASS' (when must_pass is True).
    - Its JSON structure is invalid or corrupt.
    """
    path = Path(report_path)
    if not path.is_file():
        return False, f"Report file does not exist: {path}"

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as err:
        return False, f"Failed to parse report JSON: {err}"

    if data.get("report_id") != "aethon_master_verification":
        return False, f"Invalid report_id: {data.get('report_id')}"

    # Check commit
    target_commit = expected_commit or get_git_commit()
    report_commit = data.get("environment", {}).get("git_commit")
    if target_commit != "unknown" and report_commit != target_commit:
        return False, f"Report commit '{report_commit}' does not match expected '{target_commit}'"

    # Check age / timestamp freshness
    gen_time_str = data.get("generated_at_utc")
    if not gen_time_str:
        return False, "Report missing 'generated_at_utc' timestamp"

    try:
        gen_time = datetime.fromisoformat(gen_time_str)
        now = datetime.now(UTC)
        age = (now - gen_time).total_seconds()
        if age > max_age_seconds:
            return False, f"Report is stale ({age:.1f}s old, max allowed {max_age_seconds}s)"
        if age < -10.0:  # Clock skew safeguard
            return False, f"Report timestamp is in the future ({age:.1f}s ahead)"
    except Exception as err:
        return False, f"Invalid ISO timestamp '{gen_time_str}': {err}"

    if must_pass and data.get("overall_status") != "PASS":
        return False, f"Report overall_status is '{data.get('overall_status')}', expected 'PASS'"

    return True, "Report is valid and current"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run AETHON dynamic master verification quality gates."
    )
    parser.add_argument(
        "--output-report",
        type=Path,
        default=repo_root / "reports" / "overall_verification_report.json",
        help="Path to write master verification JSON report",
    )
    parser.add_argument(
        "--no-frontend",
        action="store_true",
        help="Skip frontend quality gates (Prettier, ESLint, tsc, npm test, Vite build)",
    )
    parser.add_argument(
        "--no-backend",
        action="store_true",
        help="Skip backend quality gates (pytest, ruff, mypy)",
    )
    parser.add_argument(
        "--no-benchmarks",
        action="store_true",
        help="Skip synthetic benchmark and offline demo smoke gates",
    )
    args = parser.parse_args()

    report = run_overall_verification(
        output_report=args.output_report.resolve(),
        include_frontend=not args.no_frontend,
        include_backend=not args.no_backend,
        include_benchmarks=not args.no_benchmarks,
    )

    if report["overall_status"] != "PASS":
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
