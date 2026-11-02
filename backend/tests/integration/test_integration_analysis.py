"""Lab 2, task 6c – integration test: photo upload -> analysis -> database -> read back.

Exercised together: auth router + current_user, analysis router (analyze_image, get_analysis),
ai_service.run_inference (scoring, parts, cost), Analysis model + SQLite, _to_response.
Requirements: KAN-15 (submit a photo for analysis, 10 MB limit, error on failure), KAN-1/KAN-4 (types, price).
"""
from conftest import jpeg

from app.database import SessionLocal
from app.models.analysis import Analysis

SCRATCH = ("Scratch", 0.9, (0.1, 0.1, 0.3, 0.3))
DENT = ("Dent", 0.8, (0.5, 0.5, 0.7, 0.7))
TEN_MB = 10 * 1024 * 1024


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_uploaded_photo_is_analysed_saved_and_read_back(client, token, model):
    model([SCRATCH, DENT])

    created = client.post("/analysis/analyze", headers=auth(token),
                          files={"file": ("car.jpg", jpeg(), "image/jpeg")})

    assert created.status_code == 200
    body = created.json()
    assert body["status"] == "completed"
    assert [z["label"] for z in body["damage_zones"]] == ["Scratch", "Dent"]
    assert body["primary_damage"] == "Scratch"
    assert {p["name"]: p["estimated_cost"] for p in body["affected_parts"]} == {"Paint surface": 120, "Body panel": 280}
    assert body["total_estimated_cost"] == 400

    read = client.get(f"/analysis/{body['id']}", headers=auth(token))
    assert read.status_code == 200
    assert read.json() == body

    with SessionLocal() as db:
        record = db.get(Analysis, body["id"])
        assert record is not None and record.image_filename == "car.jpg" and record.total_estimated_cost == 400


def test_photo_without_damage_is_saved_without_price(client, token, model):
    model([])

    r = client.post("/analysis/analyze", headers=auth(token), files={"file": ("car.jpg", jpeg(), "image/jpeg")})

    assert r.status_code == 200
    assert r.json()["damage_zones"] == [] and r.json()["total_estimated_cost"] is None


def test_non_image_file_is_rejected_with_400(client, token, model):
    model([SCRATCH])

    r = client.post("/analysis/analyze", headers=auth(token), files={"file": ("notes.txt", b"hello", "text/plain")})

    assert r.status_code == 400


def test_file_over_10_mb_is_rejected_with_413(client, token, model):
    model([SCRATCH])

    r = client.post("/analysis/analyze", headers=auth(token),
                    files={"file": ("big.jpg", b"\0" * (TEN_MB + 1), "image/jpeg")})

    assert r.status_code == 413


def test_unavailable_model_returns_503_and_saves_nothing(client, token, model):
    model(None)
    with SessionLocal() as db:
        before = db.query(Analysis).count()

    r = client.post("/analysis/analyze", headers=auth(token), files={"file": ("car.jpg", jpeg(), "image/jpeg")})

    assert r.status_code == 503
    with SessionLocal() as db:
        assert db.query(Analysis).count() == before


def test_upload_without_login_is_rejected_with_401(client, model):
    model([SCRATCH])

    r = client.post("/analysis/analyze", files={"file": ("car.jpg", jpeg(), "image/jpeg")})

    assert r.status_code == 401
