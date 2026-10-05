"""KAN-20 — taking a photo in the app (TC-KAN-20-*)."""
import re

import pytest
from playwright.sync_api import expect

from conftest import zone
from selected_photos import FORMAT, LIMIT, RESOLUTION, SIZE, case, defect, exact_images, native  # noqa: F401  (fixtures)

DEF01 = "DEF-01: invalid photo is added; validated only on submit"
DEF02 = "DEF-02: no 10-photo limit"
DEF06 = "DEF-06: camera preview has no Cancel action"
DEF07 = "DEF-07: no specific camera-unavailable message"
DEF08 = "DEF-08: analysis result not linked to case A on the server (vehicle_id is null)"
DEF09 = "DEF-09: no confirmation shown after a successful submission"
CANCEL = re.compile(r"^(Cancel|Atšaukti)$")


# --- TC-KAN-20-01 EP: camera opening, permission request and failures (AC1, AC4) ---

def _permission(page):
    return page.evaluate("async () => (await navigator.permissions.query({ name: 'camera' })).state")


@pytest.mark.parametrize("state", [
    pytest.param("granted", id="D1"),
    pytest.param("ask-grant", id="D2"),
    pytest.param("ask-deny", id="D3"),
    native("denied-permanently", id="D4", reason="OS permanent denial / settings are not browser camera permissions; run on a device"),
    defect("unavailable", id="D5", reason=DEF07),
    native("save-fails", id="D6", reason="Expo web capture returns a data URI; there is no native save that could fail; run on a device"),
])
def test_tc_kan20_01_camera_permissions_and_failures(case, state):
    page, origin = case.page, case.app.base_url
    case.seed_photos(1)
    q = case.selected_sources()
    if state == "granted":
        case.camera_open()
        case.close_camera()
    elif state.startswith("ask"):
        page.context.clear_permissions()
        case.virtual_camera()
        case.selection().get_by_text("Take Photo", exact=True).click()
        expect(page.get_by_text("Camera access required", exact=True)).to_be_visible()
        if state == "ask-grant":
            page.context.grant_permissions(["camera"])
        else:
            page.context.grant_permissions([], origin=origin)
            assert _permission(page) == "denied"
        page.get_by_text("Grant permission", exact=True).click()
        if state == "ask-grant":
            expect(page.locator("video")).to_be_visible()
            case.wait_video_ready()
        else:
            expect(page.get_by_text("Camera access required", exact=True)).to_be_visible()
            expect(page.locator("video")).to_have_count(0)
            # Exercise the offered retry action.
            page.context.grant_permissions(["camera"], origin=origin)
            assert _permission(page) == "granted"
            page.get_by_text("Grant permission", exact=True).click()
            expect(page.locator("video")).to_be_visible()
        case.close_camera()
    else:  # camera unavailable
        page.context.grant_permissions(["camera"])
        page.evaluate("() => { navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('Test camera unavailable', 'NotReadableError'); }; }")
        case.selection().get_by_text("Take Photo", exact=True).click()
        message = page.get_by_text(re.compile(r"camera.*(unavailable|not available)|could not.*camera", re.I))
        case.check(lambda: expect(message).to_be_visible(), "specific camera-unavailable message")
        case.close_camera()
    case.expect_count(1)
    assert case.selected_sources() == q
    case.assert_no_analyses()
    case.done()


# --- TC-KAN-20-02 DT: preview actions x file validity (AC2, AC3) ---

@pytest.mark.parametrize("file,action", [
    defect("valid.jpg", "use", id="D1", reason=DEF06),
    defect("valid.png", "use", id="D2", reason=DEF06),
    defect("invalid.gif", "use", id="D3", reason=f"{DEF06}; {DEF01}"),
    defect("valid.jpg", "retake", id="D4", reason=DEF06),
    defect("invalid.gif", "retake", id="D5", reason=DEF06),
    defect("valid.jpg", "cancel", id="D6", reason=DEF06),
    defect("invalid.gif", "cancel", id="D7", reason=DEF06),
])
def test_tc_kan20_02_preview_actions(case, file, action):
    page = case.page
    uri = case.capture(file)
    expect(page.get_by_text("Retake", exact=True)).to_be_visible()
    expect(page.get_by_text("Use photo", exact=True)).to_be_visible()
    case.check(lambda: expect(page.get_by_text(CANCEL)).to_be_visible(), "preview offers Cancel")
    if action == "use":
        case.use_photo()
        if file.endswith(".gif"):
            case.rejection(0, FORMAT)
        else:
            case.expect_count(1)
            assert case.selected_sources() == [uri]
    elif action == "retake":
        page.get_by_text("Retake", exact=True).click()
        expect(page.locator("video")).to_be_visible()
        expect(case.shutter()).to_be_enabled()
        # Actually capture again, not just assert that a button exists.
        case.wait_video_ready()
        case.shutter().click()
        expect(page.get_by_text("Use photo", exact=True)).to_be_visible()
        page.get_by_text("Retake", exact=True).click()
        case.close_camera()
        case.expect_count(0)
    else:
        cancel = page.get_by_text(CANCEL)
        expect(cancel, "PRODUCT: cannot cancel preview without Cancel action").to_be_visible()
        cancel.click()
        case.expect_count(0)
    case.assert_no_analyses()
    case.done()


# --- TC-KAN-20-03 BVA: size and resolution of a taken photo (AC3) ---

@pytest.mark.parametrize("file,accepted,reason", [
    pytest.param("size-below.jpg", True, None, id="D1"),
    pytest.param("size-at.jpg", True, None, id="D2"),
    defect("size-above.jpg", False, SIZE, id="D3", reason=DEF01),
    defect("width-1279.jpg", False, RESOLUTION, id="D4", reason=DEF01),
    pytest.param("width-1280.jpg", True, None, id="D5"),
    pytest.param("width-1281.jpg", True, None, id="D6"),
    defect("height-719.jpg", False, RESOLUTION, id="D7", reason=DEF01),
    pytest.param("height-720.jpg", True, None, id="D8"),
    pytest.param("height-721.jpg", True, None, id="D9"),
])
def test_tc_kan20_03_size_and_resolution(case, file, accepted, reason):
    uri = case.capture(file)
    case.use_photo()
    if accepted:
        case.expect_count(1)
        assert case.selected_sources() == [uri]
    else:
        case.rejection(0, reason)
    assert case.requests == []
    case.assert_no_analyses()
    case.done()


# --- TC-KAN-20-04 BVA: taking a photo at the 10-photo limit (AC3) ---

@pytest.mark.parametrize("initial,final", [
    pytest.param(8, 9, id="D1"),
    pytest.param(9, 10, id="D2"),
    defect(10, 10, id="D3", reason=DEF02),
])
def test_tc_kan20_04_camera_at_photo_limit(case, initial, final):
    case.seed_photos(initial - 1)  # part of them from the device ...
    case.capture("valid.png")  # ... and one from the camera
    case.use_photo()
    case.expect_count(initial)
    previous = case.selected_sources()
    case.capture()
    case.use_photo()
    if initial < 10:
        case.expect_count(final)
    else:
        case.rejection(final, LIMIT)
    assert case.selected_sources()[:initial] == previous
    case.assert_no_analyses()
    case.done()


# --- TC-KAN-20-05 EP: removing a taken photo, analysis of what is left (AC5) ---

@pytest.mark.parametrize("remove_p", [
    defect(True, id="D1", reason=f"{DEF08}; {DEF09}"),  # only Q is sent
    defect(False, id="D2", reason=f"{DEF08}; {DEF09}"),  # P and Q are sent
])
def test_tc_kan20_05_remove_and_analyze(case, ai, remove_p):
    ai([zone("Scratch", conf=0.9)], delay=0.75)
    case.seed_photos(1)  # Q from the device
    case.capture()  # P from the camera
    case.use_photo()
    case.expect_count(2)
    if remove_p:
        case.remove(1)
        case.expect_count(1)
    case.successful_submit(case.selected_sources(), control_case=True)
    case.done()
