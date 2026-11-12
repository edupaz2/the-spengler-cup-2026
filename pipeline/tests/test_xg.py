import glob
from pathlib import Path

import pytest

from pipeline.analytics.xg import box_score, fallback_xg, goalie_line, player_impact, shot_xg
from pipeline.load_events import load_events
from pipeline.schema import Event

ROOT = Path(__file__).resolve().parents[2]


def ev(kind, name, clock=10, period=1, team="Away", **kw):
    return Event("g", f"{kind}-{name}-{clock}", clock, period, team, kind, "5v5", player_name=name, **kw)


def test_blank_xg_uses_fallback():
    e = ev("shot", "#9 A", x=20.0, y=0.0, result="saved", xg=None)
    assert shot_xg(e) == fallback_xg(20.0, 0.0)
    assert shot_xg(ev("shot", "#9 A", x=20.0, y=0.0, xg=0.3)) == 0.3


def test_fallback_slot_shot_beats_point_shot():
    assert fallback_xg(22.0, 1.0) > fallback_xg(8.0, 12.0)


def test_xg_within_unit_interval():
    for x, y in [(-30, 0), (0, 0), (25.9, 0), (25.9, 15), (10, -14)]:
        assert 0.0 <= fallback_xg(x, y) <= 1.0


def test_player_without_events_has_zero_impact():
    assert player_impact([ev("shot", "#9 A", x=20, y=0, xg=0.2)], "#99 Nobody") == 0.0


def test_pass_before_shot_credits_passer():
    events = [
        ev("pass", "#44 Passer", clock=100),
        ev("shot", "#19 Shooter", clock=103, x=22, y=0, xg=0.25, result="saved"),
        ev("shot", "#19 Shooter", clock=130, x=22, y=0, xg=0.5, result="saved"),  # too late
        ev("shot", "#13 Other", clock=102, team="Home", x=22, y=0, xg=0.4, result="saved"),  # other team
    ]
    assert player_impact(events, "#44 Passer") == pytest.approx(0.25)
    assert player_impact(events, "#19 Shooter") == pytest.approx(0.75)


def test_box_score_counts():
    events = [
        ev("shot", "#19 Shooter", xg=0.1, result="saved"),
        ev("shot", "#19 Shooter", xg=0.1, result="blocked"),
        ev("goal", "#19 Shooter", clock=50),
        ev("goal", "#7 Other", clock=60, assists=("#19 Shooter", "#3 X")),
    ]
    assert box_score(events, "#19 Shooter") == {"goals": 1, "assists": 1, "shots": 2}


def test_goalie_line_counts():
    events = [
        ev("shot", "#9 A", goalie_name="#30 G", result="saved"),
        ev("shot", "#9 A", goalie_name="#30 G", result="saved"),
        ev("shot", "#9 A", goalie_name="#30 G", result="goal"),
        ev("shot", "#9 A", goalie_name="#30 G", result="blocked"),
        ev("shot", "#9 A", goalie_name="#30 G", result="missed"),
        ev("shot", "#9 A", goalie_name=None, result="goal"),
    ]
    assert goalie_line(events, "#30 G") == {"saves": 2, "shots_against": 3, "goals_against": 1}


@pytest.mark.skipif(
    not glob.glob(str(ROOT / "OneDrive_1_29-10-2026" / "*Wisehockey_Match_Events_31_12_2025.csv")),
    reason="organizer data is not in the public repo",
)
def test_goalie_line_matches_report():
    path = glob.glob(str(ROOT / "OneDrive_1_29-10-2026" / "*Wisehockey_Match_Events_31_12_2025.csv"))[0]
    events = load_events(Path(path), "g11")
    gajan = goalie_line(events, "#30 Adam Gajan")
    assert gajan == {"saves": 26, "shots_against": 31, "goals_against": 5}
    aesch = goalie_line(events, "#29 Sandro Aeschlimann")
    assert abs(aesch["saves"] - 19) <= 1 and abs(aesch["shots_against"] - 22) <= 1 and aesch["goals_against"] == 3
