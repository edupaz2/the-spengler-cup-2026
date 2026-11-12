"""Locate the input files: the organizers' data kept locally, or the synthetic demo fixtures."""
from __future__ import annotations

import glob
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FIXTURES = ROOT / "pipeline" / "tests" / "fixtures"


def event_and_stats_paths(data_dir: str | None, demo: bool) -> tuple[Path, Path]:
    """Return (events csv, stats csv). `demo` uses the synthetic fixtures committed to the repo."""
    if demo:
        return FIXTURES / "sample_events.csv", FIXTURES / "sample_stats.csv"
    base = Path(data_dir) if data_dir else ROOT / "raw"
    events = glob.glob(f"{base}/*Wisehockey_Match_Events_31_12_2025.csv")
    stats = glob.glob(f"{base}/*Statistics_31_12_2025 All.csv")
    if not events or not stats:
        raise SystemExit(
            f"Organizer data not found in {base}. Put the match-event and statistics CSVs there "
            "(or pass --data DIR), or run with --demo to use the synthetic sample."
        )
    return Path(events[0]), Path(stats[0])
