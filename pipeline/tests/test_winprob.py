from pipeline.analytics.winprob import timeline, turning_point, win_probability
from pipeline.schema import Event


def goal(eid, period, clock, team):
    return Event("g", eid, clock, period, team, "goal", "5v5")


def test_tied_start_is_half():
    assert win_probability(0, 3600) == 0.5


def test_one_goal_lead_late_is_above_point_nine():
    assert win_probability(1, 60) > 0.9


def test_clock_zero_decides():
    assert win_probability(1, 0) == 1.0
    assert win_probability(-2, 0) == 0.0
    assert win_probability(0, 0) == 0.5


def test_turning_point_is_largest_swing():
    goals = [
        goal("a", 1, 100, "Home"),  # 1-0 early
        goal("b", 3, 1000, "Away"),  # 1-1 late: ties it, biggest swing
    ]
    tp = turning_point(goals)
    assert tp.goal_event_id == "b" and tp.team == "Away" and tp.clock_s == 2 * 1200 + 1000
    assert 0 < tp.delta < 1


def test_no_goals_returns_none():
    assert turning_point([]) is None


def test_single_goal_returns_none():
    assert turning_point([goal("a", 1, 10, "Home")]) is None


def test_timeline_starts_even_and_follows_goals():
    tl = timeline([goal("a", 1, 600, "Home"), goal("b", 2, 600, "Away")], "Home")
    assert tl[0] == (0, 0.5)
    assert tl[1][1] > 0.5
    assert abs(tl[2][1] - 0.5) < 1e-9
    assert [t for t, _ in tl] == [0, 600, 1800]
