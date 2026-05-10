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


def _create(client, **kwargs) -> dict:
    payload = {"brand": "Toyota", "model": "Corolla", "year": 2020, **kwargs}
    r = client.post("/vehicles/", json=payload)
    assert r.status_code == 201
    return r.json()


# ---------------------------------------------------------------------------
# POST /vehicles/
# ---------------------------------------------------------------------------

class TestCreateVehicle:
    def test_returns_201_with_id(self, client):
        r = client.post("/vehicles/", json={"brand": "Toyota"})
        assert r.status_code == 201
        assert "id" in r.json()

    def test_all_fields_persisted(self, client):
        body = {"brand": "Ford", "model": "Focus", "year": 2019, "license_plate": "ABC123", "notes": "test"}
        r = client.post("/vehicles/", json=body)
        data = r.json()
        assert data["brand"] == "Ford"
        assert data["model"] == "Focus"
        assert data["year"] == 2019
        assert data["license_plate"] == "ABC123"
        assert data["notes"] == "test"

    def test_all_fields_optional(self, client):
        r = client.post("/vehicles/", json={})
        assert r.status_code == 201


# ---------------------------------------------------------------------------
# GET /vehicles/
# ---------------------------------------------------------------------------

class TestListVehicles:
    def test_empty_list(self, client):
        r = client.get("/vehicles/")
        assert r.status_code == 200
        assert r.json() == {"items": [], "total": 0}

    def test_returns_created_vehicles(self, client):
        _create(client)
        _create(client, brand="Honda")
        body = client.get("/vehicles/").json()
        assert body["total"] == 2
        assert len(body["items"]) == 2

    def test_ordered_newest_first(self, client):
        id1 = _create(client)["id"]
        id2 = _create(client)["id"]
        items = client.get("/vehicles/").json()["items"]
        assert items[0]["id"] == id2
        assert items[1]["id"] == id1

    def test_pagination(self, client):
        for _ in range(5):
            _create(client)
        body = client.get("/vehicles/?skip=2&limit=2").json()
        assert body["total"] == 5
        assert len(body["items"]) == 2


# ---------------------------------------------------------------------------
# GET /vehicles/{id}
# ---------------------------------------------------------------------------

class TestGetVehicle:
    def test_returns_vehicle(self, client):
        vehicle_id = _create(client)["id"]
        r = client.get(f"/vehicles/{vehicle_id}")
        assert r.status_code == 200
        assert r.json()["id"] == vehicle_id

    def test_missing_returns_404(self, client):
        assert client.get("/vehicles/9999").status_code == 404

    def test_invalid_id_returns_422(self, client):
        assert client.get("/vehicles/abc").status_code == 422


# ---------------------------------------------------------------------------
# PATCH /vehicles/{id}
# ---------------------------------------------------------------------------

class TestUpdateVehicle:
    def test_partial_update(self, client):
        vehicle_id = _create(client, brand="Toyota", model="Corolla")["id"]
        r = client.patch(f"/vehicles/{vehicle_id}", json={"brand": "Honda"})
        assert r.status_code == 200
        data = r.json()
        assert data["brand"] == "Honda"
        assert data["model"] == "Corolla"

    def test_missing_returns_404(self, client):
        assert client.patch("/vehicles/9999", json={"brand": "X"}).status_code == 404


# ---------------------------------------------------------------------------
# DELETE /vehicles/{id}
# ---------------------------------------------------------------------------

class TestDeleteVehicle:
    def test_delete_returns_204(self, client):
        vehicle_id = _create(client)["id"]
        assert client.delete(f"/vehicles/{vehicle_id}").status_code == 204

    def test_deleted_vehicle_not_found(self, client):
        vehicle_id = _create(client)["id"]
        client.delete(f"/vehicles/{vehicle_id}")
        assert client.get(f"/vehicles/{vehicle_id}").status_code == 404

    def test_missing_returns_404(self, client):
        assert client.delete("/vehicles/9999").status_code == 404
