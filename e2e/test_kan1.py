"""KAN-1 — damage type classification by the AI model (TC-KAN-1-*)."""
import pytest
from playwright.sync_api import expect

from conftest import ALERT_NOOP, LOW_CONFIDENCE, NO_DAMAGE, zone

# Model class -> label the app shows.
CLASSES = {
    "Scratch": "Scratch",
    "Dent": "Dent",
    "Crack": "Crack",
    "Paint Damage": "Paint damage",
    "Broken Part": "Broken part",
    "Rust_Corrision": "Rust / corrosion",
    "Tire Damage": "Tire damage",
}
MIXED = [
    zone("Scratch", box=(0.05, 0.05, 0.25, 0.25)),
    zone("Dent", box=(0.40, 0.40, 0.60, 0.60)),
    zone("Crack", box=(0.70, 0.10, 0.90, 0.30)),
]


def test_tc_kan1_setup(app, ai, images):
    """Signed-in user's analysis is saved as a case for a vehicle identified by plate/VIN."""
    expect(app.page.get_by_text("No photos yet", exact=True)).to_be_visible()
    app.analyze(images / "car.jpg", plate="TESTVIN0000000001", open_result=False)
    expect(app.visible("Photo 1")).to_be_visible()
    expect(app.page.get_by_text("· TESTVIN0000000001").filter(visible=True)).to_be_visible()


# --- TC-KAN-1-01 EP: every damage class (AC1, AC2) ---

@pytest.mark.parametrize("label", CLASSES)
def test_tc_kan1_01_each_class_labelled(app, ai, images, label):
    ai([zone(label, conf=0.92)])
    app.analyze(images / "car.jpg")
    expect(app.labels()).to_have_text([f"{CLASSES[label]} 92%"])
    expect(app.visible(CLASSES[label])).to_be_visible()  # "Detected damage" row
    expect(app.visible(NO_DAMAGE)).to_have_count(0)


def test_tc_kan1_01_mixed_types_each_zone_own_label(app, ai, images):
    ai(MIXED)
    app.analyze(images / "car.jpg")
    expect(app.labels()).to_have_text(["Scratch 90%", "Dent 90%", "Crack 90%"])


# --- TC-KAN-1-02 BVA: confidence threshold 60 % (AC1, AC2, AC4) ---

@pytest.mark.parametrize("conf,worded", [
    (0.35, "Low confidence"),
    (0.599, "Low confidence"),
    (0.60, "Medium confidence"),
    (0.601, "Medium confidence"),
    (0.80, "High confidence"),
    (1.0, "High confidence"),
])
def test_tc_kan1_02_confidence_boundaries(app, ai, images, conf, worded):
    ai([zone("Scratch", conf=conf)])
    app.analyze(images / "car.jpg")
    expect(app.visible(worded)).to_be_visible()
    expect(app.visible(f"{round(conf * 100)}%")).to_be_visible()
    # Below 60 %: user is told to review / upload a clearer image.
    expect(app.visible(LOW_CONFIDENCE)).to_have_count(1 if conf < 0.6 else 0)


def test_tc_kan1_02_below_model_cutoff_is_not_a_detection(app, ai, images):
    ai([zone("Scratch", conf=0.34)])  # YOLO drops anything under 0.35
    app.analyze(images / "car.jpg")
    expect(app.frames()).to_have_count(0)
    expect(app.visible(NO_DAMAGE)).to_be_visible()


# --- TC-KAN-1-03 EP: type and confidence presented at the zone (AC2) ---

@pytest.mark.parametrize("width", [1280, 360])
def test_tc_kan1_03_type_and_confidence_at_zone(app, ai, images, width):
    app.page.set_viewport_size({"width": width, "height": 800})
    ai(MIXED)
    app.analyze(images / "car.jpg")
    for i in range(3):
        frame, label = app.frames().nth(i).bounding_box(), app.labels().nth(i).bounding_box()
        assert frame["x"] <= label["x"] <= frame["x"] + 10 and frame["y"] <= label["y"] <= frame["y"] + 20
        assert label["x"] + label["width"] <= width, "label stays on screen"
    expect(app.visible("High confidence")).to_have_count(3)
    expect(app.visible("90%")).to_have_count(3)


# --- TC-KAN-1-04 DT: preliminary price from the classification (AC3, AC5) ---

def test_tc_kan1_04_r1_price_depends_on_type(app, ai, images):
    ai([zone("Scratch", conf=0.92)])
    app.analyze(images / "car.jpg")
    scratch = app.money("Total (this photo)")
    ai([zone("Dent", conf=0.90)])
    app.analyze(images / "car.jpg")
    dent = app.money("Total (this photo)")
    assert scratch > 0 and dent > 0 and scratch != dent


def test_tc_kan1_04_r1_multi_zone_total_is_sum(app, ai, images):
    ai(MIXED)
    app.analyze(images / "car.jpg")
    parts = [app.money(p) for p in ("Paint surface", "Body panel")]  # Dent + Crack share "Body panel"
    assert app.money("Total (this photo)") == sum(parts)


def test_tc_kan1_04_r4_no_damage_no_price(app, ai, images):
    ai([])
    app.analyze(images / "car.jpg")
    expect(app.visible(NO_DAMAGE)).to_be_visible()
    expect(app.visible("Total (this photo)")).to_have_count(0)


# --- TC-KAN-1-05 EP: unsuitable photos (AC5) ---

@pytest.mark.parametrize("bad", ["small.jpg", "not_image.jpg", "empty.jpg", "huge.jpg"])
def test_tc_kan1_05_unsuitable_photo_rejected_before_ai(app, images, bad):
    app.pick(images / bad)
    app.submit()
    expect(app.page.get_by_text("Analyze 1 photo", exact=True)).to_be_visible()
    assert app.analyze_calls == [], "AI service must not be called"
    expect(app.page.get_by_text("Save to which vehicle?")).to_have_count(0)


@ALERT_NOOP
@pytest.mark.parametrize("bad,reason", [
    ("small.jpg", "Image too small"),
    ("not_image.jpg", "Could not read image"),
    ("empty.jpg", "Could not read image"),
    ("huge.jpg", "Image too large"),
])
def test_tc_kan1_05_rejection_reason_shown(app, images, bad, reason):
    app.pick(images / bad)
    app.submit()
    expect(app.page.get_by_text(reason, exact=False)).to_be_visible()


# --- TC-KAN-1-06 EP: AI service failure (AC1, AC3, AC5) ---

def test_tc_kan1_06_ai_error_keeps_photo_and_retry_succeeds(app, ai, images):
    ai(error=True)
    app.pick(images / "car.jpg")
    app.submit()
    expect(app.page.get_by_text("Analyze 1 photo", exact=True)).to_be_visible()
    expect(app.page.get_by_text("1 photo", exact=True)).to_be_visible()  # uploaded photo not lost
    expect(app.page.get_by_text("Save to which vehicle?")).to_have_count(0)  # nothing priced/saved
    ai([zone("Scratch", conf=0.92)])
    app.analyze(images / "car.jpg")
    expect(app.labels()).to_have_text(["Scratch 92%"])
    assert app.money("Total (this photo)") > 0


@ALERT_NOOP
def test_tc_kan1_06_ai_error_message_shown(app, ai, images):
    ai(error=True)
    app.pick(images / "car.jpg")
    app.submit()
    expect(app.page.get_by_text("Upload failed")).to_be_visible()
