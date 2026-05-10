import json

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.analysis import Analysis
from app.schemas.analysis import AnalysisListResponse, AnalysisResponse
from app.services.ai_service import run_inference

router = APIRouter(prefix="/analysis", tags=["analysis"])

_MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.get("/", response_model=AnalysisListResponse)
def list_analyses(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    total = db.query(Analysis).count()
    records = (
        db.query(Analysis)
        .order_by(Analysis.created_at.desc(), Analysis.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    items = []
    for record in records:
        damage_zones = json.loads(record.damage_zones) if record.damage_zones else []
        affected_parts = json.loads(record.affected_parts) if record.affected_parts else None
        items.append(AnalysisResponse(
            id=record.id,
            image_filename=record.image_filename,
            damage_score=record.damage_score,
            damage_zones=damage_zones,
            affected_parts=affected_parts,
            total_estimated_cost=record.total_estimated_cost,
            repair_recommendation=record.repair_recommendation,
            status=record.status,
            created_at=record.created_at,
        ))
    return AnalysisListResponse(items=items, total=total)


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await file.read()

    if len(image_bytes) > _MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 10 MB limit")

    inference_result = run_inference(image_bytes)

    record = Analysis(
        image_filename=file.filename or "upload",
        damage_score=inference_result["damage_score"],
        damage_zones=json.dumps([z.model_dump() for z in inference_result["damage_zones"]]),
        affected_parts=json.dumps(inference_result.get("affected_parts") or []),
        total_estimated_cost=inference_result.get("total_estimated_cost"),
        repair_recommendation=inference_result.get("repair_recommendation"),
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
        affected_parts=inference_result.get("affected_parts"),
        total_estimated_cost=inference_result.get("total_estimated_cost"),
        repair_recommendation=inference_result.get("repair_recommendation"),
        status=record.status,
        created_at=record.created_at,
    )


@router.get("/{analysis_id}", response_model=AnalysisResponse)
def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    record = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found")

    damage_zones = json.loads(record.damage_zones) if record.damage_zones else []
    affected_parts = json.loads(record.affected_parts) if record.affected_parts else None
    return AnalysisResponse(
        id=record.id,
        image_filename=record.image_filename,
        damage_score=record.damage_score,
        damage_zones=damage_zones,
        affected_parts=affected_parts,
        total_estimated_cost=record.total_estimated_cost,
        repair_recommendation=record.repair_recommendation,
        status=record.status,
        created_at=record.created_at,
    )
