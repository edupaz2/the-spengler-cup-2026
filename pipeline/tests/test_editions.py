from pathlib import Path

from pipeline.editions import load_edition2025, load_history, standings, titles

ROOT = Path(__file__).resolve().parents[2]
HISTORY = ROOT / "content" / "history" / "editions.csv"
E2025 = ROOT / "content" / "edition2025.yaml"


def test_history_covers_1923_to_2025():
    years = [r.year for r in load_history(HISTORY)]
    assert years == list(range(1923, 2026))


def test_shared_1932_title_counts_for_both():
    t = titles(load_history(HISTORY))
    row = next(r for r in load_history(HISTORY) if r.year == 1932)
    assert set(row.winners) == {"LTC Prague", "Oxford University"}
    assert t["Oxford University"] == 4 and t["LTC Prague"] == 7


def test_titles_total_matches_known_counts():
    t = titles(load_history(HISTORY))
    assert t["HC Davos"] == 17 and t["Team Canada"] == 16 and t["LTC Prague"] == 7


def test_unplayed_years_have_no_winner():
    rows = {r.year: r for r in load_history(HISTORY)}
    for y in (1939, 1949, 1956, 2020, 2021):
        assert rows[y].winners == () and rows[y].note


def test_2025_has_eleven_games():
    games = load_edition2025(E2025).games
    assert [g.id for g in games] == list(range(1, 12))
    assert games[-1].stage == "final" and games[-1].score == (3, 6)


def test_period_scores_sum_to_final_score():
    for g in load_edition2025(E2025).games:
        assert len(g.periods) == 3
        assert (sum(p[0] for p in g.periods), sum(p[1] for p in g.periods)) == g.score, g.id


def test_group_tables_match_report():
    games = load_edition2025(E2025).games
    a = standings(games, "A")
    assert [(r.team, r.points, r.gf, r.ga) for r in a] == [
        ("HC Fribourg-Gottéron", 6, 9, 5),
        ("HC Sparta Praha", 3, 6, 6),
        ("IFK Helsinki", 0, 4, 8),
    ]
    b = standings(games, "B")
    assert [r.team for r in b] == ["U.S. Collegiate Selects", "HC Davos", "Team Canada"]
    assert all(r.points == 3 for r in b)
