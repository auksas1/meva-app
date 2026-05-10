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

# Maps damage zone labels → (part name, estimated cost in EUR)
_PARTS_MAP: dict[str, tuple[str, float]] = {
    "dent": ("Front bumper", 320),
    "scratch": ("Door panel", 150),
    "crack": ("Hood", 480),
    "bumper damage": ("Front bumper", 520),
    "broken light": ("Headlight assembly", 280),
}


def run_inference(image_bytes: bytes) -> dict:
    """Run damage detection on raw image bytes.

    Returns a dict with:
        damage_score          float              0-1 overall damage severity
        damage_zones          list[DamageZone]
        affected_parts        list[dict]         [{name, estimated_cost}]
        total_estimated_cost  float
        repair_recommendation str
    """
    # --- STUB: replace with real YOLOv8 inference ---
    stub_zones = [
        DamageZone(label="dent", confidence=0.91, bbox=[0.1, 0.2, 0.4, 0.5]),
        DamageZone(label="scratch", confidence=0.78, bbox=[0.5, 0.3, 0.8, 0.6]),
    ]
    damage_score = 0.65

    # Derive affected parts — dedup by name, keep highest cost per part
    parts: dict[str, float] = {}
    for zone in stub_zones:
        entry = _PARTS_MAP.get(zone.label.lower())
        if entry:
            name, cost = entry
            if name not in parts or cost > parts[name]:
                parts[name] = cost

    affected_parts = [{"name": name, "estimated_cost": cost} for name, cost in parts.items()]
    total_estimated_cost = sum(parts.values()) if parts else None

    if damage_score <= 0.33:
        repair_recommendation = "Minor damage — cosmetic repair recommended."
    elif damage_score <= 0.66:
        repair_recommendation = "Moderate damage — body shop inspection recommended."
    else:
        repair_recommendation = "Significant damage — professional repair required."

    return {
        "damage_score": damage_score,
        "damage_zones": stub_zones,
        "affected_parts": affected_parts,
        "total_estimated_cost": total_estimated_cost,
        "repair_recommendation": repair_recommendation,
    }
