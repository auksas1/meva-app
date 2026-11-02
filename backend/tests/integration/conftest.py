"""Lab 2, task 6c. Integration-test harness for the MEVA API.

Real components: FastAPI app and routers, auth, ai_service.run_inference post-processing,
SQLAlchemy models and a SQLite database. Only the YOLO model is replaced by a stub
(same idea as e2e/ai_stub_server.py), because the weights are not in the repository.
Run from backend/:  .venv/Scripts/python.exe -m pytest tests/integration -v
"""
import io
import os
import sys
import tempfile
from pathlib import Path
from types import SimpleNamespace

# Point the app at a throw-away database BEFORE app.config is imported.
_DB_DIR = tempfile.mkdtemp(prefix="meva-lab2-")
os.environ["DATABASE_URL"] = f"sqlite:///{Path(_DB_DIR, 'meva.db').as_posix()}"
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))  # backend/

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from PIL import Image  # noqa: E402

from app.main import app  # noqa: E402
from app.services import ai_service  # noqa: E402

CLASS_ID = {name: cls for cls, name in ai_service._CLASS_NAMES.items()}


class _Tensor(list):
    def tolist(self):
        return list(self)


def stub_model(zones):
    """A stand-in for the YOLO model returning the given zones: (label, confidence, normalised box)."""
    def model(image, conf, verbose=False):
        w, h = image.size
        boxes = [
            SimpleNamespace(cls=[CLASS_ID[label]], conf=[c], xyxy=[_Tensor([x1 * w, y1 * h, x2 * w, y2 * h])])
            for label, c, (x1, y1, x2, y2) in zones
            if c >= conf
        ]
        return [SimpleNamespace(boxes=boxes)]
    return model


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def token(client):
    """Registers a fresh user through the real /auth/register endpoint."""
    import uuid

    r = client.post("/auth/register", json={"email": f"lab2-{uuid.uuid4().hex}@test.lt", "password": "test1234"})
    assert r.status_code == 201
    return r.json()["token"]


@pytest.fixture
def model(monkeypatch):
    """Lets a test choose what the stubbed model returns (or remove it)."""
    def use(zones=None):
        monkeypatch.setattr(ai_service, "_model", None if zones is None else stub_model(zones))
    return use


def jpeg(width=1024, height=768) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (width, height), (90, 110, 130)).save(buf, format="JPEG")
    return buf.getvalue()
