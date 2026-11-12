"""The hosted demo must never present the synthetic fixture players as real data."""
import csv
import json
import sys

from pipeline import build_days, markets
from pipeline.inputs import FIXTURES


def fixture_names() -> set[str]:
    with open(FIXTURES / "sample_stats.csv", newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    names = {f"{r['FirstName']} {r['LastName']}" for r in rows} | {r["LastName"] for r in rows}
    return {n for n in names if n.strip()}


def run(module, monkeypatch, out):
    monkeypatch.setattr(sys, "argv", ["x", "--demo", "--out", str(out)])
    module.main()


def test_demo_day_packs_have_no_fixture_players(tmp_path, monkeypatch):
    run(build_days, monkeypatch, tmp_path / "days")
    names = fixture_names()
    assert names
    files = list((tmp_path / "days").glob("*.json"))
    assert files
    for f in files:
        text = f.read_text(encoding="utf-8")
        for n in names:
            assert n not in text, f"{n} found in {f.name}"
    pack = json.loads((tmp_path / "days" / "2026-01-01.json").read_text(encoding="utf-8"))
    assert pack["depth"] == "results"


def test_demo_markets_have_no_fixture_players(tmp_path, monkeypatch):
    run(markets, monkeypatch, tmp_path / "markets")
    names = fixture_names()
    for f in (tmp_path / "markets").glob("*.json"):
        text = f.read_text(encoding="utf-8")
        for n in names:
            assert n not in text, f"{n} found in {f.name}"
