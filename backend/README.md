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
```
pytest
```

The AI stub in services/ai_service.py has a clear comment explaining exactly where to drop in the real YOLOv8 model once it's ready.
