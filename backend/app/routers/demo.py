"""
Demo-data endpoint.  Returns all backend analyses grouped by vehicle so the
mobile Settings screen can import them into AsyncStorage with one tap.
"""
import json
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.analysis import Analysis
from app.models.vehicle import Vehicle

router = APIRouter(prefix="/demo", tags=["demo"])

_SERIOUS = {"Broken Part", "Tire Damage", "Crack"}


def _build_result(record: Analysis) -> dict[str, Any]:
    damage_zones = json.loads(record.damage_zones) if record.damage_zones else []
    affected_parts = json.loads(record.affected_parts) if record.affected_parts else []

    primary_damage = None
    if damage_zones:
        best = max(damage_zones, key=lambda z: z.get("confidence", 0))
        primary_damage = best.get("label")

    damage_score = record.damage_score or 0.0
    requires_review = (
        damage_score >= 0.7
        or any(z.get("label") in _SERIOUS for z in damage_zones)
    )

    return {
        "id": record.id,
        "vehicle_id": record.vehicle_id,
        "image_filename": record.image_filename,
        "damage_score": record.damage_score,
        "damage_zones": damage_zones,
        "affected_parts": affected_parts,
        "total_estimated_cost": record.total_estimated_cost,
        "repair_recommendation": record.repair_recommendation,
        "status": record.status,
        "created_at": record.created_at.isoformat(),
        "primary_damage": primary_damage,
        "detections_count": len(damage_zones),
        "requires_manual_review": requires_review,
    }


class DemoPhoto(BaseModel):
    image_filename: str
    result: dict[str, Any]


class DemoSession(BaseModel):
    vehicle_id: int
    photos: list[DemoPhoto]


class DemoSessionsResponse(BaseModel):
    sessions: list[DemoSession]


@router.get("/sessions", response_model=DemoSessionsResponse)
def get_demo_sessions(db: Session = Depends(get_db)) -> DemoSessionsResponse:
    vehicles = db.query(Vehicle).order_by(Vehicle.id).all()
    sessions: list[DemoSession] = []
    for vehicle in vehicles:
        analyses = (
            db.query(Analysis)
            .filter(Analysis.vehicle_id == vehicle.id)
            .order_by(Analysis.id)
            .all()
        )
        if not analyses:
            continue
        photos = [
            DemoPhoto(image_filename=a.image_filename, result=_build_result(a))
            for a in analyses
        ]
        sessions.append(DemoSession(vehicle_id=vehicle.id, photos=photos))
    return DemoSessionsResponse(sessions=sessions)
