from datetime import datetime

from pydantic import BaseModel


class DamageZone(BaseModel):
    label: str
    confidence: float
    bbox: list[float]  # [x1, y1, x2, y2] normalised 0-1


class AnalysisResponse(BaseModel):
    id: int
    image_filename: str
    damage_score: float | None
    damage_zones: list[DamageZone]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
