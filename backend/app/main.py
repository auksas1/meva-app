from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.auth import current_user, seed_users
from app.database import Base, SessionLocal, engine
from app.models import user  # noqa: F401  (register users/sessions tables)
from app.models import admin_audit  # noqa: F401  (register admin audit table)
from app.routers import admin, analysis, auth, demo, health, prices, vehicles

Base.metadata.create_all(bind=engine)
with SessionLocal() as _db:
    seed_users(_db)

app = FastAPI(title="MEVA API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(analysis.router)
app.include_router(vehicles.router)
app.include_router(prices.router, dependencies=[Depends(current_user)])
app.include_router(demo.router)

# Serve demo photos so mobile can display them as image thumbnails.
_DEMO_DIR = Path(__file__).resolve().parents[2] / "demo"
if _DEMO_DIR.exists():
    app.mount("/demo-photos", StaticFiles(directory=str(_DEMO_DIR)), name="demo-photos")
