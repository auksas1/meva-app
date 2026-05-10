import io
import json

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def _minimal_png() -> bytes:
    """Return the smallest valid 1×1 PNG (67 bytes)."""
    return (
        b"\x89PNG\r\n\x1a\n"
        b"\x00\x00\x00\rIHDR"
        b"\x00\x00\x00\x01"
        b"\x00\x00\x00\x01"
        b"\x08\x02"
        b"\x00\x00\x00"
        b"\x90wS\xde"
        b"\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N"
        b"\x00\x00\x00\x00IEND\xaeB`\x82"
    )


# ---------------------------------------------------------------------------
# POST /analysis/analyze
# ---------------------------------------------------------------------------

class TestAnalyzeEndpoint:
    def test_happy_path_returns_200(self, client):
        response = client.post(
            "/analysis/analyze",
            files={"file": ("car.png", io.BytesIO(_minimal_png()), "image/png")},
        )
        assert response.status_code == 200

    def test_response_shape(self, client):
        response = client.post(
            "/analysis/analyze",
            files={"file": ("car.png", io.BytesIO(_minimal_png()), "image/png")},
        )
        body = response.json()
        assert "id" in body
        assert "damage_score" in body
        assert "damage_zones" in body
        assert "status" in body
        assert "created_at" in body
        assert body["status"] == "completed"

    def test_damage_zones_have_expected_fields(self, client):
        response = client.post(
            "/analysis/analyze",
            files={"file": ("car.png", io.BytesIO(_minimal_png()), "image/png")},
        )
        zones = response.json()["damage_zones"]
        assert isinstance(zones, list)
        assert len(zones) > 0
        for zone in zones:
            assert "label" in zone
            assert "confidence" in zone
            assert "bbox" in zone
            assert len(zone["bbox"]) == 4

    def test_optional_fields_present(self, client):
        response = client.post(
            "/analysis/analyze",
            files={"file": ("car.png", io.BytesIO(_minimal_png()), "image/png")},
        )
        body = response.json()
        assert isinstance(body["affected_parts"], list)
        assert len(body["affected_parts"]) > 0
        assert isinstance(body["total_estimated_cost"], (int, float))
        assert isinstance(body["repair_recommendation"], str)

    def test_result_is_persisted(self, client):
        post_response = client.post(
            "/analysis/analyze",
            files={"file": ("car.png", io.BytesIO(_minimal_png()), "image/png")},
        )
        analysis_id = post_response.json()["id"]
        get_response = client.get(f"/analysis/{analysis_id}")
        assert get_response.status_code == 200
        assert get_response.json()["id"] == analysis_id

    def test_non_image_file_returns_400(self, client):
        response = client.post(
            "/analysis/analyze",
            files={"file": ("doc.pdf", io.BytesIO(b"%PDF-1.4 fake"), "application/pdf")},
        )
        assert response.status_code == 400

    def test_text_file_returns_400(self, client):
        response = client.post(
            "/analysis/analyze",
            files={"file": ("notes.txt", io.BytesIO(b"hello"), "text/plain")},
        )
        assert response.status_code == 400

    def test_oversized_file_returns_413(self, client):
        big_payload = b"\x00" * (10 * 1024 * 1024 + 1)
        response = client.post(
            "/analysis/analyze",
            files={"file": ("big.png", io.BytesIO(big_payload), "image/png")},
        )
        assert response.status_code == 413


# ---------------------------------------------------------------------------
# GET /analysis/{id}
# ---------------------------------------------------------------------------

class TestGetAnalysisEndpoint:
    def _create_analysis(self, client) -> int:
        response = client.post(
            "/analysis/analyze",
            files={"file": ("car.png", io.BytesIO(_minimal_png()), "image/png")},
        )
        assert response.status_code == 200
        return response.json()["id"]

    def test_returns_stored_result(self, client):
        analysis_id = self._create_analysis(client)
        response = client.get(f"/analysis/{analysis_id}")
        assert response.status_code == 200
        assert response.json()["id"] == analysis_id

    def test_response_preserves_filename(self, client):
        client.post(
            "/analysis/analyze",
            files={"file": ("mycar.png", io.BytesIO(_minimal_png()), "image/png")},
        )
        response = client.get("/analysis/1")
        assert response.json()["image_filename"] == "mycar.png"

    def test_optional_fields_persisted(self, client):
        analysis_id = self._create_analysis(client)
        response = client.get(f"/analysis/{analysis_id}")
        body = response.json()
        assert isinstance(body["affected_parts"], list)
        assert isinstance(body["total_estimated_cost"], (int, float))
        assert isinstance(body["repair_recommendation"], str)

    def test_missing_id_returns_404(self, client):
        response = client.get("/analysis/9999")
        assert response.status_code == 404

    def test_non_integer_id_returns_422(self, client):
        response = client.get("/analysis/abc")
        assert response.status_code == 422
