import json
from pathlib import Path

import jsonschema
import pytest

from pipeline.bank import BankQuestion
from pipeline.build_days import build_day
from pipeline.editions import EditionRow, Game2025
from pipeline.schema import SIDES, Event, PlayerLine

ROOT = Path(__file__).resolve().parents[2]
SCHEMA = json.loads((ROOT / "schema" / "day.schema.json").read_text())


def bank():
    out = []
    for cat in ("rules", "history"):
        for i in range(4):
            out.append(BankQuestion(f"{cat[0]}-{i}", cat, f"{cat} q{i}?", ["a", "b", "c", "d"], i % 4, "why", 1, "t"))
    return out


NAMES = ["Ann", "Bob", "Cid", "Dee", "Eli", "Fay", "Gus", "Hal"]


def players():
    """Eight skaters (4 a side) with distinct impact, plus #99 who has stats but no events."""
    lines, events = [], []
    for i, n in enumerate(NAMES, start=1):
        side = "Home" if i <= 4 else "Away"
        lines.append(PlayerLine(SIDES[side], i, n, "Test", {
            "TOI (s)": 800 + i * 10, "Shifts": 20 + i, "SPD TOP (km/h)": 30 + i * 0.5,
            "S": i, "G": i % 2, "A": 1, "P": 1 + i % 2, "PIM": 2 * (i % 3), "Dist (m)": 4000 + i,
        }))
        for k in range(i):  # i shots of 0.1 xG, so impact rises with i
            events.append(Event("g", f"s{i}-{k}", 100 + k, 1, side, "shot", "5v5", player_name=f"#{i} {n} Test",
                                result="saved", xg=0.1, goalie_name="#30 G"))
    lines.append(PlayerLine(SIDES["Home"], 99, "Ghost", "Test", {"TOI (s)": 5, "Shifts": 1, "SPD TOP (km/h)": 40, "S": 50, "G": 9, "A": 9, "P": 18, "PIM": 0}))
    return lines, events


def game(i, date, home, away, periods):
    return Game2025(i, date, "15:10", "group", "A", home, away, tuple(tuple(p) for p in periods))


GAMES = [
    game(1, "2025-12-26", "HC Davos", "Team Canada", [[1, 0], [1, 0], [1, 0]]),  # 3-0
    game(2, "2025-12-26", "IFK Helsinki", "HC Sparta Praha", [[0, 1], [0, 0], [0, 1]]),  # 0-2
    game(3, "2025-12-27", "HC Davos", "IFK Helsinki", [[5, 0], [0, 0], [0, 0]]),  # 5-0, not yet played on 12-27
]
HISTORY = [EditionRow(2024, ("HC Davos",), "X", None), EditionRow(2023, ("Team Canada",), "Y", None),
           EditionRow(2022, ("HC Davos",), "Z", None), EditionRow(2021, ("IFK Helsinki",), "Z", None)]


def day(date="2025-12-28", classic=False, games=None, played=None, with_data=True):
    lines, events = players()
    return build_day(date, games if games is not None else [], events if with_data else None,
                     lines if with_data else None, bank(), played=played or [], classic=classic, history=HISTORY)


def test_pack_validates_against_schema():
    for classic in (False, True):
        jsonschema.validate(json.loads(json.dumps(day(classic=classic).to_json())), SCHEMA)


def test_pack_has_one_question_per_category():
    kinds = [q["kind"] if q["kind"] != "bank" else q["category"] for q in day().to_json()["questions"]]
    assert kinds == ["rules", "hidden_hero", "higher_lower", "guess_player", "history"]


def test_hidden_hero_excludes_players_without_events():
    for d in range(20, 30):
        for q in day(f"2025-12-{d}").to_json()["questions"]:
            if q["kind"] == "hidden_hero":
                assert "Ghost" not in json.dumps(q)


def test_hidden_hero_answer_has_highest_impact():
    for d in range(20, 30):
        q = next(q for q in day(f"2025-12-{d}").to_json()["questions"] if q["kind"] == "hidden_hero")
        impacts = [r["impact"] for r in q["reveal"]]
        assert impacts[q["answerIndex"]] == max(impacts) and impacts.count(max(impacts)) == 1


def test_higher_lower_never_has_equal_values():
    for d in range(20, 30):
        for g in ([], GAMES[:2]):
            q = next((q for q in day(f"2025-12-{d}", games=g, played=GAMES[:2] if d > 26 else []).to_json()["questions"]
                      if q["kind"] == "higher_lower"), None)
            assert q and q["a"]["value"] != q["b"]["value"]
            assert q["answer"] == ("a" if q["a"]["value"] > q["b"]["value"] else "b")


def test_guess_player_clues_never_contain_the_name():
    for d in range(20, 30):
        q = next(q for q in day(f"2025-12-{d}").to_json()["questions"] if q["kind"] == "guess_player")
        assert len(q["clues"]) == 5 and len(q["options"]) == 4
        for clue in q["clues"]:
            for name in NAMES + ["Test"]:
                assert name.lower() not in clue.lower()
        assert q["options"][q["answerIndex"]].split()[-1] in NAMES


def test_day_without_games_has_only_bank_questions():
    pack = build_day("2026-01-05", [], None, None, bank())
    assert sorted(q["category"] for q in pack.to_json()["questions"]) == ["history", "rules"]


def test_pack_is_deterministic():
    assert day("2025-12-28").to_json() == day("2025-12-28").to_json()
    assert day("2025-12-28").to_json() != day("2025-12-29").to_json()


def test_results_depth_day_still_has_five_questions():
    pack = day("2025-12-27", classic=True, games=GAMES[2:], played=GAMES[:2]).to_json()
    assert len(pack["questions"]) == 5 and pack["depth"] == "results" and pack["games"] == ["g3"]


def test_results_depth_player_questions_are_flagged_classic():
    qs = day("2025-12-27", classic=True, games=GAMES[2:], played=GAMES[:2]).to_json()["questions"]
    flagged = {q["kind"]: q.get("classic") for q in qs if q["kind"] in ("hidden_hero", "guess_player")}
    assert flagged == {"hidden_hero": True, "guess_player": True}
    live = day("2025-12-28").to_json()["questions"]
    assert not any(q.get("classic") for q in live)


def test_results_depth_higher_lower_uses_only_played_games():
    qs = day("2025-12-27", classic=True, games=GAMES[2:], played=GAMES[:2]).to_json()["questions"]
    hl = next(q for q in qs if q["kind"] == "higher_lower")
    assert hl["metric"] == "team_goals"
    pairs = {(hl["a"]["label"], hl["a"]["value"]), (hl["b"]["label"], hl["b"]["value"])}
    assert all(v in (3, 0, 2) for _, v in pairs) and ("HC Davos", 5) not in pairs and ("HC Davos", 8) not in pairs
