from pathlib import Path

from pipeline.build_days import schedule
from pipeline.editions import load_edition2025

ROOT = Path(__file__).resolve().parents[2]


def test_schedule_lists_all_games_with_scores():
    games = schedule(load_edition2025(ROOT / "content" / "edition2025.yaml"))
    assert len(games) == 11
    assert games[0] == {"id": "g1", "date": "2025-12-26", "start": "15:10", "stage": "Group stage", "group": "A",
                        "home": "HC Fribourg-Gottéron", "away": "HC Sparta Praha", "score": [5, 2]}
    assert games[-1]["stage"] == "Final" and games[-1]["group"] is None and games[-1]["score"] == [3, 6]
