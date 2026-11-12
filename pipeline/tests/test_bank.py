from pathlib import Path

import pytest
import yaml

from pipeline.bank import BankError, load_bank, pick_daily

ROOT = Path(__file__).resolve().parents[2]
REAL = ROOT / "content" / "questions"

GOOD = {
    "id": "r-x", "prompt": "Q?", "options": ["a", "b", "c", "d"], "answerIndex": 1,
    "why": "Because.", "difficulty": 1, "source": "test",
}


def write(tmp_path, rules=None, history=None):
    (tmp_path / "rules.yaml").write_text(yaml.safe_dump(rules or []), encoding="utf-8")
    (tmp_path / "history.yaml").write_text(yaml.safe_dump(history or []), encoding="utf-8")
    return tmp_path


def test_missing_why_is_an_error(tmp_path):
    bad = {k: v for k, v in GOOD.items() if k != "why"}
    with pytest.raises(BankError) as e:
        load_bank(write(tmp_path, rules=[bad]))
    assert "r-x" in str(e.value) and "why" in str(e.value)


def test_answer_index_out_of_range_is_an_error(tmp_path):
    with pytest.raises(BankError, match="answerIndex"):
        load_bank(write(tmp_path, rules=[{**GOOD, "answerIndex": 7}]))


def test_duplicate_ids_rejected(tmp_path):
    with pytest.raises(BankError, match="duplicate"):
        load_bank(write(tmp_path, rules=[GOOD], history=[GOOD]))


def test_every_invalid_entry_is_listed(tmp_path):
    bad1 = {**GOOD, "id": "r-1", "options": ["a", "b"]}
    bad2 = {**GOOD, "id": "r-2", "difficulty": 9}
    with pytest.raises(BankError) as e:
        load_bank(write(tmp_path, rules=[bad1, bad2]))
    assert "r-1" in str(e.value) and "r-2" in str(e.value)


def test_each_category_has_at_least_eight():
    bank = load_bank(REAL)
    for cat in ("rules", "history"):
        assert sum(q.category == cat for q in bank) >= 8
    assert all(q.why and len(q.options) == 4 and 0 <= q.answerIndex < 4 for q in bank)


def test_generated_history_answers_match_the_data():
    q = next(q for q in load_bank(REAL) if q.id == "h-winner-2025")
    assert q.options[q.answerIndex] == "HC Davos" and len(set(q.options)) == 4


def test_pick_daily_is_deterministic():
    bank = load_bank(REAL)
    assert pick_daily("2025-12-26", bank) == pick_daily("2025-12-26", bank)
    assert pick_daily("2025-12-26", bank) != pick_daily("2025-12-27", bank)


def test_pick_daily_one_per_category():
    picked = pick_daily("2025-12-28", load_bank(REAL))
    assert sorted(q.category for q in picked) == ["history", "rules"]
