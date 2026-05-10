import json

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.analysis import Analysis
from app.schemas.analysis import AnalysisResponse
from app.services.ai_service import run_inference

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await file.read()
    inference_result = run_inference(image_bytes)

    record = Analysis(
        image_filename=file.filename or "upload",
        damage_score=inference_result["damage_score"],
        damage_zones=json.dumps([z.model_dump() for z in inference_result["damage_zones"]]),
        status="completed",
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return AnalysisResponse(
        id=record.id,
        image_filename=record.image_filename,
        damage_score=record.damage_score,
        damage_zones=inference_result["damage_zones"],
        status=record.status,
        created_at=record.created_at,
    )


@router.get("/{analysis_id}", response_model=AnalysisResponse)
def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    record = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found")

    damage_zones = json.loads(record.damage_zones) if record.damage_zones else []
    return AnalysisResponse(
        id=record.id,
        image_filename=record.image_filename,
        damage_score=record.damage_score,
        damage_zones=damage_zones,
        status=record.status,
        created_at=record.created_at,
    )
