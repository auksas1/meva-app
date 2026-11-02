import json
from types import SimpleNamespace

import pytest
import app.routers.analysis as analysis
from app.routers.analysis import _to_response


@pytest.fixture
def capture_response_constructor(monkeypatch):
    monkeypatch.setattr(analysis, "AnalysisResponse", SimpleNamespace)


def _make_record(**overrides):
    values = {
        "id": 1,
        "vehicle_id": 2,
        "image_filename": "image.jpg",
        "damage_score": None,
        "damage_zones": None,
        "affected_parts": None,
        "total_estimated_cost": 0,
        "repair_recommendation": None,
        "status": "pending",
        "created_at": None,
    }
    return SimpleNamespace(**(values | overrides))


# Tuščias damage_zones sąrašas po JSON iškodavimo nepasirenka pirminės žalos.
def test_to_response_empty_damage_zones_returns_no_primary_damage(
    capture_response_constructor,
):
    # Arrange
    record = _make_record(damage_zones="[]")

    # Act
    response = _to_response(record)

    # Assert
    assert response.primary_damage is None


# Tuščias damage_zones sąrašas reiškia, kad aptikimų nėra.
def test_to_response_empty_damage_zones_returns_zero_detections(
    capture_response_constructor,
):
    # Arrange
    record = _make_record(damage_zones="[]")

    # Act
    response = _to_response(record)

    # Assert
    assert response.detections_count == 0


# Netuščias affected_parts JSON tekstas iškoduojamas į objektą.
def test_to_response_encoded_affected_parts_returns_decoded_value(
    capture_response_constructor,
):
    # Arrange
    record = _make_record(affected_parts='["door", "bumper"]')

    # Act
    response = _to_response(record)

    # Assert
    assert response.affected_parts == ["door", "bumper"]


# Tuščias affected_parts laukas pateikia None.
def test_to_response_missing_affected_parts_returns_none(
    capture_response_constructor,
):
    # Arrange
    record = _make_record(affected_parts=None)

    # Act
    response = _to_response(record)

    # Assert
    assert response.affected_parts is None


# Iš kelių zonų parenkama didžiausią confidence turinti zona.
def test_to_response_multiple_damage_zones_returns_highest_confidence_label(
    capture_response_constructor,
):
    # Arrange
    record = _make_record(
        damage_zones=(
            '[{"label": "scratch", "confidence": 0.4}, '
            '{"label": "dent", "confidence": 0.9}]'
        )
    )

    # Act
    response = _to_response(record)

    # Assert
    assert response.primary_damage == "dent"


# Trūkstamas confidence vertinamas kaip nulis renkant pirminę zoną.
def test_to_response_missing_confidence_returns_first_zone_label(
    capture_response_constructor,
):
    # Arrange
    record = _make_record(
        damage_zones='[{"label": "first"}, {"label": "second"}]'
    )

    # Act
    response = _to_response(record)

    # Assert
    assert response.primary_damage == "first"


# None damage_score paverčiamas į 0.0.
def test_to_response_missing_damage_score_returns_zero(
    capture_response_constructor,
):
    # Arrange
    record = _make_record(damage_score=None)

    # Act
    response = _to_response(record)

    # Assert
    assert response.requires_manual_review is False


# damage_score, lygus 0.7, įjungia rankinės peržiūros vėliavą.
def test_to_response_damage_score_at_threshold_requires_manual_review(
    capture_response_constructor,
):
    # Arrange
    record = _make_record(damage_score=0.7)

    # Act
    response = _to_response(record)

    # Assert
    assert response.requires_manual_review is True


# Mažesnis už 0.7 damage_score be rimtų klasių neįjungia rankinės peržiūros.
def test_to_response_low_damage_score_without_serious_class_skips_manual_review(
    capture_response_constructor,
):
    # Arrange
    record = _make_record(
        damage_score=0.69,
        damage_zones='[{"label": "scratch", "confidence": 0.8}]',
    )

    # Act
    response = _to_response(record)

    # Assert
    assert response.requires_manual_review is False


# Rimtos klasės žala įjungia rankinę peržiūrą net esant mažam damage_score.
def test_to_response_serious_damage_class_requires_manual_review(
    capture_response_constructor,
    monkeypatch,
):
    # Arrange
    monkeypatch.setattr(analysis, "_SERIOUS_CLASSES", {"serious"})
    record = _make_record(
        damage_score=0.1,
        damage_zones='[{"label": "serious", "confidence": 0.2}]',
    )

    # Act
    response = _to_response(record)

    # Assert
    assert response.requires_manual_review is True


# Neteisingas damage_zones JSON sukelia JSONDecodeError.
def test_to_response_invalid_damage_zones_json_raises_decode_error(
    capture_response_constructor,
):
    # Arrange
    record = _make_record(damage_zones="{invalid")

    # Act / Assert
    with pytest.raises(json.JSONDecodeError):
        _to_response(record)


# Neteisingas affected_parts JSON sukelia JSONDecodeError.
def test_to_response_invalid_affected_parts_json_raises_decode_error(
    capture_response_constructor,
):
    # Arrange
    record = _make_record(affected_parts="{invalid")

    # Act / Assert
    with pytest.raises(json.JSONDecodeError):
        _to_response(record) 
