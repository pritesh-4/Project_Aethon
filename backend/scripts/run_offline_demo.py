"""Lightweight wrapper to invoke the root offline demo script from backend directory."""

import sys
from pathlib import Path

script_dir = Path(__file__).resolve().parent
backend_root = script_dir.parent
repo_root = backend_root.parent

# Forward invocation to scripts/run_offline_demo.py
demo_script = repo_root / "scripts" / "run_offline_demo.py"
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Run deterministic offline demonstration of AETHON."
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=repo_root / "demo_output",
        help="Directory to save generated demo artifacts and SQLite database",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Deterministic random seed for beacon and noise realization",
    )
    args = parser.parse_args()

    from scripts.run_offline_demo import run_offline_demo

    run_offline_demo(output_dir=args.output_dir.resolve(), seed=args.seed)
