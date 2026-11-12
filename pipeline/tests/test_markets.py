import json
from pathlib import Path

import jsonschema
import pytest

from pipeline.editions import Game2025
from pipeline.markets import build_markets, build_results, odds_from_strength, team_strength
from pipeline.tests.synthetic import match

ROOT = Path(__file__).resolve().parents[2]
SCHEMA = json.loads((ROOT / "schema" / "markets.schema.json").read_text())

FINAL_BOX = {"power_play": {"home": [0, 1], "away": [2, 4]}}


def g(i, date, home, away, periods, stage="group"):
    return Game2025(i, date, "12:10", stage, "A" if stage == "group" else None, home, away, tuple(tuple(p) for p in periods))


FINAL = g(11, "2025-12-31", "U.S. Collegiate Selects", "HC Davos", [[1, 2], [2, 1], [0, 3]], "final")


def markets(games=None, **kw):
    stats, events = match()
    return build_markets("2025-12-31", games if games is not None else [FINAL], events, stats, final_box=FINAL_BOX, **kw)


def test_odds_reflect_strength_gap():
    strong, weak = odds_from_strength(1.0, -1.0)
    assert strong < weak


def test_odds_include_margin():
    a, b = odds_from_strength(0.0, 0.0)
    assert 1 / a + 1 / b > 1.0
    assert 1 / a + 1 / b == pytest.approx(1.1, abs=0.02)


def test_odds_floor_is_1_1():
    a, b = odds_from_strength(10.0, -10.0)
    assert a == 1.1 and b > 1.1


def test_no_games_gives_no_markets():
    assert markets(games=[]) == []
    assert build_results("2026-01-01", [], None, None) == {}


def test_final_has_winner_star_and_powerplay_markets():
    ms = markets()
    assert sorted(m.kind for m in ms) == ["powerplay", "star", "winner"]
    winner = next(m for m in ms if m.kind == "winner")
    assert winner.gameId == "g11" and winner.lockAt == "2025-12-31T12:10:00+01:00"
    assert [o["label"] for o in winner.options] == ["U.S. Collegiate Selects", "HC Davos"]
    jsonschema.validate([m.to_json() for m in ms], SCHEMA["definitions"]["markets"])


def test_results_cover_every_market():
    stats, events = match()
    ms = markets()
    res = build_results("2025-12-31", [FINAL], events, stats, final_box=FINAL_BOX)
    assert set(res) == {m.id for m in ms}
    for m in ms:
        assert res[m.id] in {o["id"] for o in m.options}


def test_winner_result_follows_score():
    res = build_results("2025-12-31", [FINAL], None, None)
    assert res == {"2025-12-31-g11-winner": "away"}


def test_star_market_options_include_best_player():
    stats, events = match()
    star = next(m for m in markets() if m.kind == "star")
    assert len(star.options) == 3
    res = build_results("2025-12-31", [FINAL], events, stats, final_box=FINAL_BOX)
    assert res[star.id] == "test-hal"


def test_powerplay_result_by_conversion():
    stats, events = match()
    pp = next(m for m in markets() if m.kind == "powerplay")
    assert build_results("2025-12-31", [FINAL], events, stats, final_box=FINAL_BOX)[pp.id] == "away"


def test_team_strength_is_goal_difference_per_game():
    played = [g(1, "2025-12-26", "A", "B", [[2, 0], [1, 0], [0, 0]]), g(2, "2025-12-27", "A", "C", [[0, 1], [0, 0], [0, 0]])]
    s = team_strength(played)
    assert s["A"] == pytest.approx(1.0) and s["B"] == pytest.approx(-3.0) and s["C"] == pytest.approx(1.0)


def test_day_markets_validate_as_file():
    ms = markets()
    stats, events = match()
    doc = {"date": "2025-12-31", "markets": [m.to_json() for m in ms],
           "results": build_results("2025-12-31", [FINAL], events, stats, final_box=FINAL_BOX)}
    jsonschema.validate(doc, SCHEMA)
