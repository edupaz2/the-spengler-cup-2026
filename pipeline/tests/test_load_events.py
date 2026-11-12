from pathlib import Path

from pipeline.load_events import load_events
from pipeline.load_stats import load_player_stats
from pipeline.schema import SIDES, join_key

FIX = Path(__file__).parent / "fixtures"


def events():
    return load_events(FIX / "sample_events.csv", game_id="t")


def by_kind(evs, kind):
    return [e for e in evs if e.kind == kind]


def test_maps_raw_kinds_to_canonical():
    kinds = [e.kind for e in events()]
    for k in ["faceoff", "control", "pass", "entry", "dump", "clear", "shot", "goal", "penalty", "stoppage"]:
        assert k in kinds


def test_unknown_kind_becomes_other():
    assert [e.kind for e in events() if e.player_name == "#13 Test Homer"][-2] == "other"


def test_normalises_attack_direction():
    shots = by_kind(events(), "shot")
    away_p1 = next(e for e in shots if e.period == 1 and e.team == "Away" and e.xg == 0.12)
    home_p2 = next(e for e in shots if e.period == 2 and e.team == "Home")
    assert away_p1.x == 20 and away_p1.y == -1  # raw (-20, 1) rotated so the team attacks +x
    assert home_p2.x == 22 and home_p2.y == 1.5
    home_p1 = next(e for e in shots if e.period == 1 and e.team == "Home")
    assert home_p1.x == 21 and home_p1.y == 3  # already attacking +x


def test_missing_coordinates_are_none():
    goal = by_kind(events(), "goal")[0]
    assert goal.x is None and goal.y is None


def test_blank_xg_is_none_and_zero_speed_is_missing():
    shots = by_kind(events(), "shot")
    assert any(e.result == "goal" and e.xg is None for e in shots)
    blocked = next(e for e in shots if e.result == "blocked")
    assert blocked.speed_kmh is None and blocked.xg == 0.004
    saved = next(e for e in shots if e.xg == 0.12)
    assert saved.speed_kmh == 98.5 and saved.result == "saved"


def test_shot_rows_carry_goalie_name():
    shots = by_kind(events(), "shot")
    assert next(e for e in shots if e.xg == 0.12).goalie_name == "#30 Test Goalie"
    assert next(e for e in shots if e.xg == 0.5).goalie_name is None  # empty net


def test_goal_assists_are_resolved_to_names():
    goal = by_kind(events(), "goal")[0]
    assert goal.assists == ("#44 Test Passer", "#7 Test Third")
    assert goal.clock_s == 141 and goal.strength == "5v5" and goal.team == "Away"


def test_penalty_and_stoppage_reasons_are_kept():
    evs = events()
    assert by_kind(evs, "penalty")[0].reason == "HighSticking"
    assert by_kind(evs, "stoppage")[0].reason == "Icing"


def test_player_stats_join_on_team_and_jersey():
    lines = {(p.team, p.jersey): p for p in load_player_stats(FIX / "sample_stats.csv")}
    assert join_key("Away", "#19 Test Awayer") == (SIDES["Away"], 19)
    p = lines[join_key("Away", "#19 Test Awayer")]
    assert p.last_name == "Awayer" and p.stats["G"] == 2 and p.stats["TOI (s)"] == 943
