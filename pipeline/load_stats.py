"""Load the Wisehockey per-player match statistics export."""
from __future__ import annotations

import csv
from pathlib import Path

from pipeline.schema import PlayerLine

ID_COLUMNS = {"Team", "Jersey", "LastName", "FirstName"}


def load_player_stats(path: Path) -> list[PlayerLine]:
    with open(path, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    lines = []
    for r in rows:
        stats = {k: float(v) for k, v in r.items() if k not in ID_COLUMNS and v not in ("", None)}
        lines.append(PlayerLine(r["Team"], int(r["Jersey"]), r["LastName"], r["FirstName"], stats))
    return lines
