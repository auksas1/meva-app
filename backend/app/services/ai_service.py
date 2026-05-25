"""
AI inference service — YOLOv8 vehicle damage detection.

Model file: backend/ai/best_vehicle_damage_yolov8s_30e.pt
Classes:    0 Broken Part · 1 Crack · 2 Dent · 3 Paint Damage
            4 Rust_Corrision · 5 Scratch · 6 Tire Damage
"""

import io
import logging
from pathlib import Path

from PIL import Image

from app.schemas.analysis import DamageZone

logger = logging.getLogger(__name__)

_MODEL_PATH = Path(__file__).resolve().parents[2] / "ai" / "best_vehicle_damage_yolov8s_30e.pt"
_CONFIDENCE_THRESHOLD = 0.35

_CLASS_NAMES: dict[int, str] = {
    0: "Broken Part",
    1: "Crack",
    2: "Dent",
    3: "Paint Damage",
    4: "Rust_Corrision",
    5: "Scratch",
    6: "Tire Damage",
}

_LABEL_LT: dict[str, str] = {
    "Broken Part": "Sulaužyta dalis",
    "Crack": "Įtrūkimas",
    "Dent": "Įlenkimas",
    "Paint Damage": "Dažų pažeidimas",
    "Rust_Corrision": "Rūdys / korozija",
    "Scratch": "Įbrėžimas",
    "Tire Damage": "Padangos pažeidimas",
}

# Weight reflects severity: higher = more critical damage type
_SEVERITY_WEIGHT: dict[str, float] = {
    "Broken Part": 1.0,
    "Crack": 0.9,
    "Tire Damage": 0.8,
    "Rust_Corrision": 0.7,
    "Dent": 0.6,
    "Paint Damage": 0.4,
    "Scratch": 0.3,
}

_PARTS_MAP: dict[str, tuple[str, float]] = {
    "Broken Part": ("Damaged component", 450),
    "Crack": ("Body panel", 380),
    "Dent": ("Body panel", 280),
    "Paint Damage": ("Paint surface", 180),
    "Rust_Corrision": ("Body panel", 350),
    "Scratch": ("Paint surface", 120),
    "Tire Damage": ("Tire / wheel", 220),
}

_model = None
try:
    from ultralytics import YOLO  # type: ignore[import-untyped]

    if _MODEL_PATH.exists():
        _model = YOLO(str(_MODEL_PATH))
        logger.info("YOLOv8 model loaded from %s", _MODEL_PATH)
    else:
        logger.warning("Model file not found at %s", _MODEL_PATH)
except Exception:
    logger.exception("Failed to load YOLOv8 model")


def _confidence_text(conf: float) -> str:
    if conf >= 0.8:
        return "High"
    if conf >= 0.6:
        return "Medium"
    return "Low"


def run_inference(image_bytes: bytes) -> dict:
    """Run YOLOv8 damage detection on raw image bytes."""
    if _model is None:
        raise RuntimeError("AI model is not loaded — check that the model file exists and ultralytics is installed")

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    w, h = image.size

    results = _model(image, conf=_CONFIDENCE_THRESHOLD, verbose=False)[0]

    zones: list[DamageZone] = []
    for box in results.boxes:
        cls_id = int(box.cls[0])
        label = _CLASS_NAMES.get(cls_id, f"class_{cls_id}")
        confidence = round(float(box.conf[0]), 4)
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        zones.append(DamageZone(
            label=label,
            confidence=confidence,
            bbox=[round(x1 / w, 4), round(y1 / h, 4), round(x2 / w, 4), round(y2 / h, 4)],
            label_lt=_LABEL_LT.get(label),
            confidence_text=_confidence_text(confidence),
        ))

    # damage_score: sum of (severity × confidence) normalised so two heavy detections ≈ 1.0
    if zones:
        weighted = sum(_SEVERITY_WEIGHT.get(z.label, 0.5) * z.confidence for z in zones)
        damage_score = round(min(1.0, weighted / 2.0), 4)
    else:
        damage_score = 0.0

    # Affected parts: dedup by name, keep highest cost
    parts: dict[str, float] = {}
    for zone in zones:
        entry = _PARTS_MAP.get(zone.label)
        if entry:
            name, cost = entry
            if name not in parts or cost > parts[name]:
                parts[name] = cost

    affected_parts = [{"name": name, "estimated_cost": cost} for name, cost in parts.items()]
    total_estimated_cost = round(sum(parts.values()), 2) if parts else None

    if damage_score <= 0.33:
        repair_recommendation = "Minor damage — cosmetic repair recommended."
    elif damage_score <= 0.66:
        repair_recommendation = "Moderate damage — body shop inspection recommended."
    else:
        repair_recommendation = "Significant damage — professional repair required."

    return {
        "damage_score": damage_score,
        "damage_zones": zones,
        "affected_parts": affected_parts,
        "total_estimated_cost": total_estimated_cost,
        "repair_recommendation": repair_recommendation,
    }
