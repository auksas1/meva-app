from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine
from app.routers import analysis, demo, health, prices, vehicles

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MEVA API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(analysis.router)
app.include_router(vehicles.router)
app.include_router(prices.router)
app.include_router(demo.router)

# Serve demo photos so mobile can display them as image thumbnails.
_DEMO_DIR = Path(__file__).resolve().parents[2] / "demo"
if _DEMO_DIR.exists():
    app.mount("/demo-photos", StaticFiles(directory=str(_DEMO_DIR)), name="demo-photos")
