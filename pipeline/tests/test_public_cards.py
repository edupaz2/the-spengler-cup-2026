from pathlib import Path

import jsonschema
import yaml

from pipeline.cards import build_catalog
from pipeline.editions import load_edition2025, load_history
from pipeline.tests.synthetic import match
from pipeline.tests.test_cards import SCHEMA

ROOT = Path(__file__).resolve().parents[2]
TIERS = ("normal", "silver", "gold", "diamond")


def public_catalog():
    stats, events = match()
    load = lambda f: yaml.safe_load((ROOT / "content" / f).read_text(encoding="utf-8"))
    return build_catalog(
        events, stats, load("rules.yaml"), load("achievements.yaml"),
        load_edition2025(ROOT / "content" / "edition2025.yaml"),
        load_history(ROOT / "content" / "history" / "editions.csv"),
        public=load("cards_public.yaml"),
    )


def test_public_catalog_has_the_56_cards():
    cards = public_catalog()
    assert len(cards) == 56
    assert sum(c.category == "player" for c in cards) == 20
    assert {c.title for c in cards if c.category == "goalie"} == {"Adam Gajan", "Sandro Aeschlimann"}


def test_public_catalog_hides_dataset_stats():
    for c in public_catalog():
        assert c.back["gold"]["visual"] == "table"
        if c.category in ("player", "goalie") and "Key player" not in c.front:
            assert c.statsHidden and c.back["gold"]["data"] == {"rows": []}
    fink = next(c for c in public_catalog() if c.title == "Aiden Fink")
    assert fink.front == ["#18 · U.S. Collegiate Selects"] and fink.rarity == "legendary"


def test_every_public_card_has_images_on_disk():
    cards_dir = ROOT / "app" / "public" / "cards"
    for c in public_catalog():
        for size in ("thumb", "full"):
            for tier in TIERS:
                assert (cards_dir / size / f"front_{c.image}_{tier}.webp").exists(), c.id
    for prefix in ("player", "goalie", "team", "moment", "achievement", "rules-and-concepts", "game-of-the-day"):
        assert (cards_dir / "thumb" / f"locked_{prefix}.webp").exists()
        for tier in TIERS:
            assert (cards_dir / "full" / f"back_{prefix}_{tier}.webp").exists()


def test_public_catalog_validates_against_schema():
    jsonschema.validate({"cards": [c.to_json() for c in public_catalog()], "sets": []}, SCHEMA)


def test_public_rule_cards_hide_stats():
    rules = [c for c in public_catalog() if c.category == "rule"]
    assert rules
    for c in rules:
        assert c.statsHidden and c.back["gold"]["data"] == {"rows": []}
