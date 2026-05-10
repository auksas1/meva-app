from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    image_filename: Mapped[str] = mapped_column(String, nullable=False)
    damage_score: Mapped[float] = mapped_column(Float, nullable=True)
    damage_zones: Mapped[str] = mapped_column(String, nullable=True)  # JSON string
    affected_parts: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # JSON string
    total_estimated_cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    repair_recommendation: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="pending")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
