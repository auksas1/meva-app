from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleListResponse, VehiclePatch, VehicleResponse

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.get("/", response_model=VehicleListResponse)
def list_vehicles(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    total = db.query(Vehicle).count()
    records = (
        db.query(Vehicle)
        .order_by(Vehicle.created_at.desc(), Vehicle.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return VehicleListResponse(items=records, total=total)


@router.post("/", response_model=VehicleResponse, status_code=201)
def create_vehicle(body: VehicleCreate, db: Session = Depends(get_db)):
    record = Vehicle(**body.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    record = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return record


@router.patch("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(vehicle_id: int, body: VehiclePatch, db: Session = Depends(get_db)):
    record = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{vehicle_id}", status_code=204)
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    record = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.delete(record)
    db.commit()
