"""Build the daily challenge packs from the 2025 edition data."""
from __future__ import annotations

import argparse
import datetime as dt
import glob
import json
from dataclasses import asdict, dataclass
from pathlib import Path

from pipeline.cards import STAGES
from pipeline.bank import BankQuestion, load_bank, pick_daily
from pipeline.inputs import event_and_stats_paths
from pipeline.editions import Edition2025, EditionRow, Game2025, load_edition2025, load_history
from pipeline.load_events import load_events
from pipeline.load_stats import load_player_stats
from pipeline.questions import (
    guess_player, hidden_hero, higher_lower_players, higher_lower_teams, higher_lower_titles, to_dict,
)
from pipeline.schema import Event, PlayerLine

ROOT = Path(__file__).resolve().parents[1]


@dataclass
class DayPack:
    date: str
    games: list[str]
    depth: str  # "events" when the day's player data is real, "results" when it is a classic spotlight
    questions: list[dict]

    def to_json(self) -> dict:
        return asdict(self)


def build_day(
    date: str,
    games: list[Game2025],
    events: list[Event] | None,
    stats: list[PlayerLine] | None,
    bank: list[BankQuestion],
    played: list[Game2025] | None = None,
    classic: bool = False,
    edition: Edition2025 | None = None,
    history: list[EditionRow] | None = None,
) -> DayPack:
    has_players = events is not None and stats is not None
    hh = hidden_hero(date, events, stats, classic) if has_players else None
    gp = guess_player(date, events, stats, classic) if has_players else None
    if has_players and not classic:
        hl = higher_lower_players(date, events, stats, classic)
    else:
        hl = higher_lower_teams(date, played or []) if played else None
        if hl is None and history:
            hl = higher_lower_titles(date, history, [t["name"] for t in edition.teams] if edition else None)
        if hl is None and has_players:
            hl = higher_lower_players(date, events, stats, classic)
    picks = {q.category: q for q in pick_daily(date, bank)}
    ordered = [
        picks.get("rules"), hh, hl, gp, picks.get("history"),
    ]
    questions = [to_dict(q) if not isinstance(q, BankQuestion) else asdict(q) for q in ordered if q is not None]
    return DayPack(date, [f"g{g.id}" for g in games], "results" if classic or not has_players else "events", questions)


def schedule(edition: Edition2025) -> list[dict]:
    """Every game of the edition with its final score, for the app's schedule."""
    return [
        {"id": f"g{g.id}", "date": g.date, "start": g.start, "stage": STAGES[g.stage], "group": g.group,
         "home": g.home, "away": g.away, "score": list(g.score)}
        for g in edition.games
    ]


def _next_day(date: str) -> str:
    return (dt.date.fromisoformat(date) + dt.timedelta(days=1)).isoformat()


def build_all(events, stats, edition: Edition2025, history, bank, out: Path) -> list[str]:
    """One pack per game day, plus a recap day after the Final that settles its bets."""
    final_date = max(g.date for g in edition.games)
    dates = sorted({g.date for g in edition.games}) + [_next_day(final_date)]
    out.mkdir(parents=True, exist_ok=True)
    used: set[str] = set()
    for d in dates:
        pack = build_day(
            d, [g for g in edition.games if g.date == d], events, stats,
            [q for q in bank if q.id not in used],
            played=[g for g in edition.games if g.date < d], classic=d <= final_date,
            edition=edition, history=history,
        )
        used |= {q["id"] for q in pack.questions if q["kind"] == "bank"}
        (out / f"{d}.json").write_text(json.dumps(pack.to_json(), ensure_ascii=False, indent=1), encoding="utf-8")
    (out / "index.json").write_text(json.dumps({"dates": dates}), encoding="utf-8")
    (out / "sample.json").write_text((out / f"{dates[1]}.json").read_text(encoding="utf-8"), encoding="utf-8")
    return dates


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--data", default=None, help="folder with the organizers' CSVs (default: ./raw)")
    p.add_argument("--demo", action="store_true", help="use the synthetic fixtures instead of organizer data")
    p.add_argument("--out", default=str(ROOT / "app" / "public" / "data" / "days"))
    a = p.parse_args()
    events_csv, stats_csv = event_and_stats_paths(a.data, a.demo)
    # The demo fixtures hold invented players on real teams: build only results-based content from them.
    events = None if a.demo else load_events(events_csv, "g11")
    stats = None if a.demo else load_player_stats(stats_csv)
    edition = load_edition2025(ROOT / "content" / "edition2025.yaml")
    dates = build_all(
        events, stats, edition,
        load_history(ROOT / "content" / "history" / "editions.csv"),
        load_bank(ROOT / "content" / "questions"), Path(a.out),
    )
    (Path(a.out).parent / "schedule.json").write_text(
        json.dumps({"games": schedule(edition)}, ensure_ascii=False, indent=1), encoding="utf-8")
    print("wrote", len(dates), "days to", a.out)


if __name__ == "__main__":
    main()
