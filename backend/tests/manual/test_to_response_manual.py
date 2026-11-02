import json
from datetime import datetime
from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from app.routers.analysis import _to_response


def make_record(**overrides):
    values = {
        "id": 1, "vehicle_id": None, "image_filename": "car.jpg",
        "damage_score": 0.2, "damage_zones": None, "affected_parts": None,
        "total_estimated_cost": None, "repair_recommendation": None,
        "status": "completed", "created_at": datetime(2026, 1, 1, 12, 0),
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def zone(label, confidence=0.5):
    return {"label": label, "confidence": confidence, "bbox": [0.1, 0.1, 0.5, 0.5]}


# ternary False šaka: nėra zonų (None)
def test_to_response_missing_damage_zones_gives_no_detections():
    r = _to_response(make_record(damage_zones=None))
    assert (r.damage_zones, r.primary_damage, r.detections_count) == ([], None, 0)


# ternary True šaka + `if damage_zones` False: JSON tuščias sąrašas
def test_to_response_empty_json_list_gives_no_detections():
    r = _to_response(make_record(damage_zones="[]"))
    assert (r.damage_zones, r.primary_damage, r.detections_count) == ([], None, 0)


def test_to_response_affected_parts_json_is_decoded():
    parts = [{"name": "Bumper cover", "estimated_cost": 120.0}]
    r = _to_response(make_record(affected_parts=json.dumps(parts)))
    assert r.model_dump()["affected_parts"] == parts


def test_to_response_missing_affected_parts_stays_none():
    assert _to_response(make_record(affected_parts=None)).affected_parts is None


# didžiausias confidence yra viduryje, kad nepagautų „pirmas“ ar „paskutinis“
def test_to_response_primary_damage_is_highest_confidence_zone():
    zones = [zone("Scratch", 0.4), zone("Dent", 0.9), zone("Rust", 0.6)]
    r = _to_response(make_record(damage_zones=json.dumps(zones)))
    assert r.primary_damage == "Dent"


def test_to_response_equal_confidence_picks_first_zone():
    zones = [zone("Scratch", 0.5), zone("Dent", 0.5)]
    r = _to_response(make_record(damage_zones=json.dumps(zones)))
    assert r.primary_damage == "Scratch"


def test_to_response_detections_count_matches_zone_count():
    zones = [zone("Scratch"), zone("Dent"), zone("Rust")]
    r = _to_response(make_record(damage_zones=json.dumps(zones)))
    assert r.detections_count == 3


@pytest.mark.parametrize("score, expected", [(0.69, False), (0.7, True), (0.71, True)])
def test_to_response_score_threshold_controls_manual_review(score, expected):
    r = _to_response(make_record(damage_score=score))
    assert r.requires_manual_review is expected


@pytest.mark.parametrize("label", ["Broken Part", "Tire Damage", "Crack"])
def test_to_response_serious_class_forces_review_with_low_score(label):
    r = _to_response(make_record(damage_score=0.1, damage_zones=json.dumps([zone(label)])))
    assert r.requires_manual_review is True


def test_to_response_minor_class_with_low_score_skips_review():
    r = _to_response(make_record(damage_score=0.1, damage_zones=json.dumps([zone("Scratch")])))
    assert r.requires_manual_review is False


# damage_score None: atsakyme lieka None, bet `or 0.0` neįjungia peržiūros
def test_to_response_missing_damage_score_is_kept_and_skips_review():
    r = _to_response(make_record(damage_score=None))
    assert (r.damage_score, r.requires_manual_review) == (None, False)


def test_to_response_copies_plain_fields():
    created = datetime(2026, 3, 4, 10, 30)
    r = _to_response(make_record(
        id=7, vehicle_id=3, image_filename="a.jpg", total_estimated_cost=350.0,
        repair_recommendation="Replace bumper", status="completed", created_at=created,
    ))
    assert r.model_dump(include={
        "id", "vehicle_id", "image_filename", "total_estimated_cost",
        "repair_recommendation", "status", "created_at",
    }) == {
        "id": 7, "vehicle_id": 3, "image_filename": "a.jpg",
        "total_estimated_cost": 350.0, "repair_recommendation": "Replace bumper",
        "status": "completed", "created_at": created,
    }


@pytest.mark.parametrize("field", ["damage_zones", "affected_parts"])
def test_to_response_invalid_json_raises_decode_error(field):
    with pytest.raises(json.JSONDecodeError):
        _to_response(make_record(**{field: "{invalid"}))


# tikras modelis atmeta zoną be bbox (to mock'as nepagautų)
def test_to_response_zone_without_bbox_raises_validation_error():
    record = make_record(damage_zones=json.dumps([{"label": "Dent", "confidence": 0.9}]))
    with pytest.raises(ValidationError):
        _to_response(record)