"""
Seed demo data: clears the DB, creates vehicles, runs real YOLOv8 inference
on demo photos, and inserts linked analysis records.

Run from backend/: python3 seed_demo.py
"""
import asyncio
import json
import sys
from pathlib import Path

# Make sure app imports resolve
sys.path.insert(0, str(Path(__file__).parent))

from app.database import Base, SessionLocal, engine
from app.models.analysis import Analysis
from app.models.vehicle import Vehicle
from app.services.ai_service import run_inference
from app.services.price_service import search_price_links

DEMO_DIR = Path(__file__).parents[1] / "demo"

# ── vehicle definitions ─────────────────────────────────────────────────────
VEHICLES = [
    dict(brand="Volkswagen", model="Golf", year=2019, license_plate="ABC 123"),
    dict(brand="Toyota",     model="Corolla", year=2021, license_plate="DEF 456"),
    dict(brand="Ford",       model="Focus", year=2018,  license_plate="GHI 789"),
]

# ── photo assignments (vehicle index 0/1/2  →  demo filenames, no extension) ─
# Grouped to give each vehicle a realistic multi-photo session.
PHOTO_GROUPS = [
    # VW Golf  — paint / scratch damage
    [
        "36b7732b-16c7-423b-98d9-2a2dc307298c",   # subtle scratches on white
        "5684d3a1-7868-40d3-a770-4cf69f80f453",   # scratch on gold panel
        "14a6cceb-9777-4726-b978-2512ce523683",   # cracked paint on gray
    ],
    # Toyota Corolla — rust + paint peeling
    [
        "7210d896-ee97-47ce-b041-cb48c26d2393",   # rust on white panel
        "be9e6ea3-de8f-4f76-b44e-190695dffd71",   # rust/corrosion gray panel
        "173b3d7e-b029-4d85-b967-c90b6e2a9694",   # paint peeling silver fender
    ],
    # Ford Focus — tire damage + heavy collision
    [
        "6a3d32ba-723c-4d1f-a2dd-c522531b8f36",   # flat tire + rust yellow car
        "7a2ffecc-84a9-427a-8305-03d47d8fd272",   # flat tire + dent blue car
        "8456668a-3f45-4963-8564-5d2126f82652",   # broken front + dent blue
        "a57fe6e0-aa36-42c0-827b-2356144c462a",   # cracked white bumper
        "43e0176a-59f1-42d4-beba-4ae8ee67968c",   # major dent + broken SUV
    ],
]


def clear_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("DB cleared and tables recreated.")


def seed(db):
    created_vehicles = []
    for vd in VEHICLES:
        v = Vehicle(**vd)
        db.add(v)
        db.flush()
        created_vehicles.append(v)
        print(f"  Vehicle {v.id}: {v.brand} {v.model} {v.year}")

    total_analyses = 0
    for v_idx, (vehicle, filenames) in enumerate(zip(created_vehicles, PHOTO_GROUPS)):
        print(f"\nProcessing {vehicle.brand} {vehicle.model} ({len(filenames)} photos):")
        for fname in filenames:
            path = DEMO_DIR / f"{fname}.jpeg"
            if not path.exists():
                print(f"  SKIP {fname} — file not found")
                continue
            image_bytes = path.read_bytes()
            try:
                result = run_inference(image_bytes)
                zones = result["damage_zones"]
                parts = result["affected_parts"]
                a = Analysis(
                    vehicle_id=vehicle.id,
                    image_filename=f"{fname}.jpeg",
                    damage_score=result["damage_score"],
                    damage_zones=json.dumps([z.model_dump() for z in zones]),
                    affected_parts=json.dumps(parts),
                    total_estimated_cost=result["total_estimated_cost"],
                    repair_recommendation=result["repair_recommendation"],
                    status="completed",
                )
                db.add(a)
                db.flush()
                labels = [z.label for z in zones] or ["—"]
                cost = result["total_estimated_cost"]
                print(f"  [{fname[:8]}…] score={result['damage_score']:.2f}  "
                      f"zones={len(zones)}  parts={len(parts)}  "
                      f"cost={f'€{cost:.0f}' if cost else '—'}  "
                      f"detected={labels}")
                total_analyses += 1
            except Exception as e:
                print(f"  ERROR on {fname}: {e}")

    db.commit()
    print(f"\nSeeded {len(created_vehicles)} vehicles, {total_analyses} analyses.")
    return created_vehicles, total_analyses


async def test_price_finder(db):
    print("\n── Price finder smoke test ─────────────────────────────────────────")
    # Collect unique part names across all analyses
    rows = db.query(Analysis.affected_parts, Analysis.vehicle_id).all()
    part_names = set()
    for parts_json, _ in rows:
        if parts_json:
            for p in json.loads(parts_json):
                part_names.add(p["name"])

    if not part_names:
        print("No detected parts — skipping price finder test.")
        return

    query = "Volkswagen Golf 2019"
    print(f"Parts to search: {sorted(part_names)}")
    print(f"Car query: '{query}'\n")

    resp = await search_price_links(list(part_names), query)
    all_ok = True
    for r in resp.results:
        print(f"  {r.part_name_en} ({r.part_name_lt}): {len(r.results)} results")
        for item in r.results:
            print(f"    • {item.title[:70]}")
            print(f"      {item.url[:80]}")
        if not r.results:
            print("    ⚠ no results")
            all_ok = False
    print("\nPrice finder:", "OK" if all_ok else "PARTIAL — some parts returned 0 results")


if __name__ == "__main__":
    clear_db()

    db = SessionLocal()
    try:
        print("\nSeeding vehicles and running inference on demo photos...")
        seed(db)
        asyncio.run(test_price_finder(db))
    finally:
        db.close()

    print("\nDone. Run the app and check the history tab.")
