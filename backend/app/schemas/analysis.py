from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DamageZone(BaseModel):
    label: str
    confidence: float
    bbox: list[float]  # [x1, y1, x2, y2] normalised 0-1


class AffectedPart(BaseModel):
    name: str
    estimated_cost: Optional[float] = None


class AnalysisResponse(BaseModel):
    id: int
    image_filename: str
    damage_score: Optional[float]
    damage_zones: list[DamageZone]
    status: str
    created_at: datetime
    affected_parts: Optional[list[AffectedPart]] = None
    total_estimated_cost: Optional[float] = None
    repair_recommendation: Optional[str] = None

    class Config:
        from_attributes = True
