from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class VehicleCreate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    license_plate: Optional[str] = None
    notes: Optional[str] = None


class VehiclePatch(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    license_plate: Optional[str] = None
    notes: Optional[str] = None


class VehicleResponse(BaseModel):
    id: int
    brand: Optional[str]
    model: Optional[str]
    year: Optional[int]
    license_plate: Optional[str]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class VehicleListResponse(BaseModel):
    items: list[VehicleResponse]
    total: int
