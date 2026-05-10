from fastapi import FastAPI

from app.database import Base, engine
from app.routers import analysis, health

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MEVA API", version="0.1.0")

app.include_router(health.router)
app.include_router(analysis.router)
