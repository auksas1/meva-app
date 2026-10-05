"""KAN-4 — damage zones highlighted on the photo (TC-KAN-4-*)."""
import pytest
from playwright.sync_api import expect

from conftest import ALERT_NOOP, NO_DAMAGE, zone

THREE = [
    zone("Scratch", box=(0.05, 0.05, 0.25, 0.25)),
    zone("Dent", box=(0.40, 0.40, 0.60, 0.60)),
    zone("Broken Part", box=(0.70, 0.10, 0.90, 0.30)),
]
OVERLAP = [zone("Scratch", box=(0.20, 0.20, 0.50, 0.50)), zone("Dent", box=(0.35, 0.35, 0.65, 0.65))]


def grid(n):
    """n non-overlapping zones in a 4-column grid."""
    return [zone(box=(0.02 + 0.24 * (i % 4), 0.02 + 0.33 * (i // 4), 0.2 + 0.24 * (i % 4), 0.3 + 0.33 * (i // 4))) for i in range(n)]


def test_tc_kan4_setup(app):
    """Signed-in user sees an empty upload screen with analysis not yet possible."""
    expect(app.page.get_by_text("No photos yet", exact=True)).to_be_visible()
    expect(app.page.get_by_text("Submit / Analyze", exact=True).locator("..")).to_have_attribute("aria-disabled", "true")
    expect(app.frames()).to_have_count(0)


# --- TC-KAN-4-01 EP: zones framed on the original photo (AC1) ---

@pytest.mark.parametrize("zones", [[zone()], THREE, OVERLAP], ids=["one", "three", "overlap"])
def test_tc_kan4_01_each_zone_framed_on_original_photo(app, ai, images, zones):
    ai(zones)
    app.analyze(images / "car.jpg")
    expect(app.frames()).to_have_count(len(zones))
    boxes = [app.frames().nth(i).bounding_box() for i in range(len(zones))]
    assert len({(b["x"], b["y"]) for b in boxes}) == len(zones), "every zone gets its own frame"
    # Frames are an SVG overlay over the user's own photo (blob: URI), not baked into a served image.
    photo = app.page.locator("img").filter(visible=True).last
    assert photo.get_attribute("src").startswith("blob:")
    assert photo.evaluate("i => [i.naturalWidth, i.naturalHeight]") == [1024, 768]


# --- TC-KAN-4-02 BVA: number of zones on one photo (AC1, AC4) ---

@pytest.mark.parametrize("count", [0, 1, 9, 10, 11])
def test_tc_kan4_02_zone_count_boundaries(app, ai, images, count):
    ai(grid(count))
    app.analyze(images / "car.jpg")
    expect(app.frames()).to_have_count(count)
    expect(app.labels()).to_have_count(count)
    if count == 0:
        expect(app.visible(NO_DAMAGE)).to_be_visible()
    else:
        expect(app.visible(NO_DAMAGE)).to_have_count(0)


# --- TC-KAN-4-03 EP: damage type shown at every frame without interaction (AC2) ---

@pytest.mark.parametrize("width", [1280, 360])
def test_tc_kan4_03_type_label_at_each_frame(app, ai, images, width):
    app.page.set_viewport_size({"width": width, "height": 800})
    ai(THREE)
    app.analyze(images / "car.jpg")
    # No hover/click happened: labels are rendered as plain SVG text.
    expect(app.labels()).to_have_text(["Scratch 90%", "Dent 90%", "Broken part 90%"])
    for i in range(3):
        frame, label = app.frames().nth(i).bounding_box(), app.labels().nth(i).bounding_box()
        assert frame["x"] <= label["x"] <= frame["x"] + 10 and frame["y"] <= label["y"] <= frame["y"] + 20, "label sits at its own frame"
        assert label["x"] + label["width"] <= width, "label not cut off by the screen"


def test_tc_kan4_03_overlapping_labels_readable(app, ai, images):
    ai(OVERLAP)
    app.analyze(images / "car.jpg")
    expect(app.labels()).to_have_text(["Scratch 90%", "Dent 90%"])
    a, b = app.labels().nth(0).bounding_box(), app.labels().nth(1).bounding_box()
    assert a["y"] + a["height"] <= b["y"] or b["y"] + b["height"] <= a["y"], "labels do not overlap each other"


# --- TC-KAN-4-04 EP: preliminary price per damage and total (AC3) ---

def test_tc_kan4_04_single_zone_price_equals_total(app, ai, images):
    ai([zone("Scratch")])
    app.analyze(images / "car.jpg")
    assert app.money("Paint surface") == app.money("Total (this photo)") > 0


def test_tc_kan4_04_total_is_sum_of_parts(app, ai, images):
    ai(THREE)
    app.analyze(images / "car.jpg")
    parts = [app.money(p) for p in ("Paint surface", "Body panel", "Damaged component")]
    assert all(p > 0 for p in parts)
    assert app.money("Total (this photo)") == sum(parts)


def test_tc_kan4_04_other_type_is_priced(app, ai, images):
    ai([zone("Rust_Corrision")])
    app.analyze(images / "car.jpg")
    assert app.money("Body panel") == app.money("Total (this photo)") > 0


# --- TC-KAN-4-05 DT: no damage / invalid photo / system error (AC4, AC5) ---

def test_tc_kan4_05_r1_damage_shows_frames_and_price(app, ai, images):
    ai(THREE)
    app.analyze(images / "car.jpg")
    expect(app.frames()).to_have_count(3)
    expect(app.visible("Total (this photo)")).to_be_visible()
    expect(app.visible(NO_DAMAGE)).to_have_count(0)


def test_tc_kan4_05_r2_no_damage_shows_message_and_no_price(app, ai, images):
    ai([])
    app.analyze(images / "car.jpg")
    expect(app.visible(NO_DAMAGE)).to_be_visible()
    expect(app.frames()).to_have_count(0)
    # "Not calculated" means the price element is absent, not €0.
    expect(app.visible("Total (this photo)")).to_have_count(0)
    expect(app.visible("Affected parts")).to_have_count(0)


@pytest.mark.parametrize("bad", ["small.jpg", "not_image.jpg", "empty.jpg"])
def test_tc_kan4_05_r3_invalid_photo_not_analyzed(app, images, bad):
    app.pick(images / bad)
    app.submit()
    expect(app.page.get_by_text("Analyze 1 photo", exact=True)).to_be_visible()  # back to idle, photo kept for retry
    assert app.analyze_calls == [], "invalid photo must not reach the AI service"
    expect(app.page.get_by_text("Save to which vehicle?")).to_have_count(0)


def test_tc_kan4_05_r4_system_error_then_retry(app, ai, images):
    ai(error=True)
    app.pick(images / "car.jpg")
    app.submit()
    expect(app.page.get_by_text("Analyze 1 photo", exact=True)).to_be_visible()
    assert len(app.analyze_calls) == 1
    expect(app.page.get_by_text("Save to which vehicle?")).to_have_count(0)
    ai(THREE)
    app.submit()  # same photo still selected: re-upload
    expect(app.page.get_by_text("Save to which vehicle?")).to_be_visible()


@ALERT_NOOP
@pytest.mark.parametrize("bad", ["small.jpg", "not_image.jpg", "empty.jpg", "server_error"])
def test_tc_kan4_05_error_message_shown(app, ai, images, bad):
    ai(error=True)
    app.pick(images / ("car.jpg" if bad == "server_error" else bad))
    app.submit()
    expect(app.page.get_by_text("failed", exact=False)).to_be_visible(timeout=5_000)


# --- TC-KAN-4-06 BVA: zones displayed within 5 s (AC5, AC6) ---

@pytest.mark.parametrize("count", [1, 10])
def test_tc_kan4_06_analysis_within_5s(app, ai, images, count):
    ai(grid(count))
    assert app.analyze(images / "car.jpg") <= 5.0
    expect(app.frames()).to_have_count(count)


@pytest.mark.parametrize("delay", [4.9, 5.1])
def test_tc_kan4_06_slow_response_still_rendered(app, ai, images, delay):
    """No 5 s cut-off exists in the app (risk R-3): a slow answer is still shown."""
    ai([zone()], delay=delay)
    assert app.analyze(images / "car.jpg", timeout=15_000) >= delay
    expect(app.frames()).to_have_count(1)


def test_tc_kan4_06_repeated_three_times(app, ai, images):
    ai([zone()])
    assert all(app.analyze(images / "car.jpg") <= 5.0 for _ in range(3))
