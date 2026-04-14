# Backend

FastAPI backend for image analysis and API endpoints.

## To get started:
```
cd backend
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Tests:

Run the full suite:
```
python3 -m pytest
```

Run with verbose output to see each test name:
```
python3 -m pytest -v
```

Run a specific file or test class:
```
pytest tests/test_analysis.py -v
pytest tests/test_analysis.py::TestAnalyzeEndpoint -v
pytest tests/test_analysis.py::TestAnalyzeEndpoint::test_happy_path_returns_200 -v
```

Tests use an in-memory SQLite database — no setup needed and `meva.db` is never touched.

### What's covered

| File | Tests |
|---|---|
| `tests/test_health.py` | `GET /health` returns `{"status": "ok"}` |
| `tests/test_analysis.py` | `POST /analysis/analyze` — happy path, response shape, damage zone fields, DB persistence, rejection of non-image files |
| | `GET /analysis/{id}` — retrieval by ID, filename preserved, 404 on missing ID, 422 on non-integer ID |

The AI stub in `services/ai_service.py` has a clear comment explaining exactly where to drop in the real YOLOv8 model once it's ready.
