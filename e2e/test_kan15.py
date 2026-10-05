"""KAN-15 — submitting photos of a damage case for analysis (TC-KAN-15-*)."""
import re

import pytest
from playwright.sync_api import expect

from conftest import API, zone
from selected_photos import FORMAT, LIMIT, SIZE, case, defect, exact_images  # noqa: F401  (fixtures)

DEF01 = "DEF-01: invalid photo is added; validated only on submit"
DEF02 = "DEF-02: no 10-photo limit"
DEF03 = "DEF-03: selected photo cannot be opened in a preview"
DEF04 = "DEF-04: no cancel action during upload"
DEF05 = "DEF-05: Alert.alert is a no-op on react-native-web, error reason not shown"
DEF08 = "DEF-08: analysis result not linked to case A on the server (vehicle_id is null)"
DEF09 = "DEF-09: no confirmation shown after a successful submission"


# --- TC-KAN-15-01 EP: both photo sources, linked to A, progress, successful result (AC1, AC4, AC5) ---

@pytest.mark.parametrize("source,file", [
    defect("gallery", "valid.jpg", id="D1", reason=f"{DEF08}; {DEF09}"),
    defect("camera", "valid.png", id="D2", reason=f"{DEF08}; {DEF09}"),
])
def test_tc_kan15_01_add_and_submit(case, ai, source, file):
    ai([zone("Scratch", conf=0.9)], delay=0.75)  # slowed down so progress is observable
    if source == "gallery":
        case.gallery([file])
    else:
        case.capture(file)
        case.use_photo()
    case.expect_count(1)
    case.successful_submit(case.selected_sources(), control_case=True)
    case.done()


# --- TC-KAN-15-02 EP BVA: format and 10 MiB size limit (AC2) ---

@pytest.mark.parametrize("file,accepted,reason", [
    pytest.param("size-below.jpg", True, None, id="D1"),  # JPEG M-1
    pytest.param("size-at.jpg", True, None, id="D2"),  # JPEG M
    defect("size-above.jpg", False, SIZE, id="D3", reason=DEF01),  # JPEG M+1
    pytest.param("valid.png", True, None, id="D4"),  # PNG 1 MB
    defect("invalid.gif", False, FORMAT, id="D5", reason=DEF01),  # GIF 1 MB
])
def test_tc_kan15_02_format_and_size(case, file, accepted, reason):
    case.gallery([file])
    if accepted:
        case.expect_count(1)
        case.expect_submit_enabled()
    else:
        case.rejection(0, reason)
    assert case.requests == []
    case.assert_no_analyses()
    case.done()


# --- TC-KAN-15-03 BVA: at most 10 photos (AC2) ---

@pytest.mark.parametrize("initial,final", [
    pytest.param(8, 9, id="D1"),
    pytest.param(9, 10, id="D2"),
    defect(10, 10, id="D3", reason=DEF02),
])
def test_tc_kan15_03_photo_count_limit(case, initial, final):
    case.seed_photos(initial)
    previous = case.selected_sources()
    case.gallery(["photo-11.jpg"])
    if initial < 10:
        case.expect_count(final)
    else:
        case.rejection(final, LIMIT)
    assert case.selected_sources()[:initial] == previous, "PRODUCT: previous photos retained"
    case.assert_no_analyses()
    case.done()


# --- TC-KAN-15-04 DT: preview, removal, submit enabled only with photos (AC3) ---

@pytest.mark.parametrize("initial,remaining", [
    defect(1, 0, id="D1", reason=DEF03),  # try to submit an empty list
    defect(2, 1, id="D2", reason=DEF03),  # submit the remaining photo
])
def test_tc_kan15_04_preview_remove_submit_state(case, ai, initial, remaining):
    case.seed_photos(initial)
    before = case.selected_sources()
    case.thumbnails().first.click()
    # Requirement asks to OPEN the chosen photo, not merely see its 92 px thumbnail.
    largest = """([uri]) => Math.max(0, ...[...document.images].filter(i => i.getAttribute('src') === uri)
                                             .map(i => i.getBoundingClientRect().width))"""
    case.check(lambda: case.eventually(lambda: case.page.evaluate(largest, [before[0]]), lambda w: w > 92),
               "selected P opens in a larger preview")
    case.remove(0)
    case.expect_count(remaining)
    assert case.selected_sources() == before[1:]
    if remaining == 0:
        expect(case.submit()).to_have_attribute("aria-disabled", "true")
        case.submit().click(force=True)
        assert case.requests == []
        case.assert_no_analyses()
    else:
        ai([zone("Scratch", conf=0.9)], delay=0.75)
        case.successful_submit(before[1:])
    case.done()


# --- TC-KAN-15-05 EP: cancelled / failed upload keeps photos, retry succeeds (AC4) ---

@pytest.mark.parametrize("event,reason", [
    defect("cancel", re.compile("cancel", re.I), id="D1", reason=f"{DEF04}; {DEF05}"),
    defect("network", re.compile("network|connection|internet|fetch", re.I), id="D2", reason=DEF05),
    defect("server", re.compile(r"server|50\d", re.I), id="D3", reason=DEF05),
])
def test_tc_kan15_05_failed_upload_and_retry(case, ai, event, reason):
    case.seed_photos(2)
    before = case.selected_sources()
    held = []
    if event == "server":
        ai(error=True, delay=1.5)  # real API answers 503 after the stubbed model fails
    else:
        case.page.route(f"{API}/analysis/analyze", held.append)  # hold the first upload before it reaches the API
    case.submit().click()
    expect(case.page.get_by_text("Uploading 1 of 2…", exact=True)).to_be_visible()
    if event == "cancel":
        cancel = case.page.get_by_text(re.compile(r"^(Cancel upload|Cancel|Atšaukti siuntimą)$", re.I)).filter(visible=True)
        case.check(lambda: expect(cancel).to_be_visible(), "user can cancel an in-flight upload")
        if cancel.is_visible():
            cancel.click()
    if event != "server":
        case.eventually(lambda: len(held), bool)
        held[0].abort("internetdisconnected" if event == "network" else "aborted")
    case.expect_submit_enabled()
    case.expect_count(2)
    assert case.selected_sources() == before
    case.assert_no_analyses()
    case.check(lambda: case.eventually(lambda: case.selection().inner_text() + "\n".join(case.dialogs), reason.search),
               "upload failure reason visible and retry available")
    case.page.unroute(f"{API}/analysis/analyze")
    ai([zone("Scratch", conf=0.9)], delay=0.75)
    case.successful_submit(before)
    case.done()
