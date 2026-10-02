"""
Demo-data endpoint.  Returns all backend analyses grouped by vehicle so the
mobile Settings screen can import them into AsyncStorage with one tap.
"""
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import current_user
from app.database import get_db
from app.models.analysis import Analysis
from app.models.user import User
from app.models.vehicle import Vehicle
from app.routers.analysis import _to_response

router = APIRouter(prefix="/demo", tags=["demo"])

class DemoPhoto(BaseModel):
    image_filename: str
    result: dict[str, Any]


class DemoSession(BaseModel):
    vehicle_id: int
    photos: list[DemoPhoto]


class DemoSessionsResponse(BaseModel):
    sessions: list[DemoSession]


@router.get("/sessions", response_model=DemoSessionsResponse)
def get_demo_sessions(db: Session = Depends(get_db), user: User = Depends(current_user)) -> DemoSessionsResponse:
    vehicles = db.query(Vehicle).filter(Vehicle.user_id == user.id).order_by(Vehicle.id).all()
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
            DemoPhoto(image_filename=a.image_filename, result=_to_response(a).model_dump(mode="json"))
            for a in analyses
        ]
        sessions.append(DemoSession(vehicle_id=vehicle.id, photos=photos))
    return DemoSessionsResponse(sessions=sessions)
