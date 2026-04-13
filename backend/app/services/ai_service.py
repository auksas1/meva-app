"""
AI inference service.

Currently a stub — replace the body of `run_inference` with actual
YOLOv8 model loading and prediction once the model is available.

Expected swap:
    from ultralytics import YOLO
    model = YOLO("path/to/best.pt")
    results = model(image)  # then parse results into DamageZone objects
"""

from app.schemas.analysis import DamageZone


def run_inference(image_bytes: bytes) -> dict:
    """Run damage detection on raw image bytes.

    Returns a dict with:
        damage_score  float  0-1 overall damage severity
        damage_zones  list[DamageZone]
    """
    # --- STUB: replace with real YOLOv8 inference ---
    stub_zones = [
        DamageZone(label="dent", confidence=0.91, bbox=[0.1, 0.2, 0.4, 0.5]),
        DamageZone(label="scratch", confidence=0.78, bbox=[0.5, 0.3, 0.8, 0.6]),
    ]
    return {
        "damage_score": 0.65,
        "damage_zones": stub_zones,
    }
