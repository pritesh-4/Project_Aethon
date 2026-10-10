"""CLI script to generate a reproducible synthetic radio benchmark suite with exact ground truth."""

import argparse
import sys
from pathlib import Path

# Ensure backend root is on sys.path when invoked directly as a script
script_dir = Path(__file__).resolve().parent
backend_root = script_dir.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.synthetic.dataset import BenchmarkDatasetGenerator, load_benchmark_dataset


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate a reproducible synthetic benchmark dataset with exact ground truth."
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=backend_root / "data" / "synthetic_benchmark",
        help="Target directory to write observation arrays and ground-truth manifest.json",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Base random seed for deterministic generation",
    )
    parser.add_argument(
        "--dataset-id",
        type=str,
        default="aethon_standard_benchmark",
        help="Identifier for the generated benchmark suite",
    )
    parser.add_argument(
        "--verify",
        action="store_true",
        default=True,
        help="Verify SHA-256 checksums by reloading generated files immediately",
    )

    args = parser.parse_args()

    output_dir: Path = args.output_dir.resolve()
    print(f"Generating synthetic benchmark suite '{args.dataset_id}'...")
    print(f"Output directory: {output_dir}")
    print(f"Base seed: {args.seed}")

    generator = BenchmarkDatasetGenerator(base_seed=args.seed)
    manifest = generator.generate_and_save_suite(output_dir=output_dir, dataset_id=args.dataset_id)

    print("\n--- Benchmark Generation Summary ---")
    print(f"Dataset ID:                {manifest.dataset_id}")
    print(f"Generator Version:         {manifest.generator_version}")
    print(f"Total Observations:        {manifest.total_observations}")
    print(f"Positive Observations:     {manifest.positive_observations_count}")
    print(f"Negative Controls:         {manifest.negative_control_count}")
    print(f"Total Injected Targets:    {manifest.total_injected_targets}")
    print(f"Manifest Path:             {output_dir / 'manifest.json'}")

    if args.verify:
        print("\nVerifying SHA-256 checksums from disk...")
        _loaded_manifest, arrays = load_benchmark_dataset(output_dir, verify_checksums=True)
        print(f"Verified {len(arrays)} observation files successfully.")

    print("\nGeneration completed successfully. All artifacts marked as synthetic.")


if __name__ == "__main__":
    main()
