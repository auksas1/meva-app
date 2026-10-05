"""KAN-15 / KAN-20 helpers: case A with its "Selected photos" list, exact-size images, gallery and camera."""
import base64
import hashlib
import io
import json
import re
import struct
import time
import zlib

import pytest
from PIL import Image, ImageDraw
from playwright.sync_api import Page, expect

from conftest import API

M = 10_485_760  # agreed 10 MB limit = 10 MiB, in bytes
MB = 1_048_576
LIMIT = re.compile(r"limit|maximum|at most|cannot add|no more than", re.I)
SIZE = re.compile(r"size|large|10\s*M", re.I)
FORMAT = re.compile(r"format|JPEG|PNG", re.I)
RESOLUTION = re.compile(r"resolution|small|1280|720", re.I)


def defect(*values, id, reason):
    """Dataset that currently hits a known defect (see DEF-xx in the reason)."""
    return pytest.param(*values, id=id, marks=pytest.mark.xfail(strict=True, reason=reason))


def native(*values, id, reason):
    """Dataset that needs a real Android/iOS device; not reproducible in the web build."""
    return pytest.param(*values, id=id, marks=pytest.mark.skip(reason=f"NATIVE: {reason}"))


# --- exact-size images ---

def _exact_image(fmt, width, height, size, label):
    """Decodable image of exactly `size` bytes; padding goes into legal comment/ancillary data."""
    image = Image.new("RGB", (width, height), "#426882")
    ImageDraw.Draw(image).text((30, 30), "MEVA SYNTHETIC TEST " + label, fill="white")
    stream = io.BytesIO()
    image.save(stream, format=fmt)
    raw = stream.getvalue()
    missing = size - len(raw)
    assert missing >= 16
    if fmt == "JPEG":
        segments = []
        while missing:
            n = min(missing, 65537)
            if 0 < missing - n < 4:
                n -= 4
            segments.append(b"\xff\xfe" + struct.pack(">H", n - 2) + b"X" * (n - 4))
            missing -= n
        raw = raw[:2] + b"".join(segments) + raw[2:]
    elif fmt == "PNG":
        chunk = b"meVa" + b"X" * (missing - 12)
        raw = raw[:-12] + struct.pack(">I", len(chunk) - 4) + chunk + struct.pack(">I", zlib.crc32(chunk)) + raw[-12:]
    else:  # GIF comment extension
        remaining, blocks = missing - 3, []
        while remaining:
            n = min(256, remaining)
            if remaining - n == 1:
                n -= 1
            blocks.append(bytes([n - 1]) + b"X" * (n - 1))
            remaining -= n
        raw = raw[:-1] + b"\x21\xfe" + b"".join(blocks) + b"\x00" + raw[-1:]
    assert len(raw) == size
    with Image.open(io.BytesIO(raw)) as check:
        check.load()
        assert check.size == (width, height) and check.format == fmt
    return raw


@pytest.fixture(scope="session")
def exact_images(tmp_path_factory):
    d = tmp_path_factory.mktemp("exact_images")
    specs = [("valid.jpg", "JPEG", 1920, 1080, MB), ("valid.png", "PNG", 1920, 1080, MB), ("invalid.gif", "GIF", 1920, 1080, MB)]
    specs += [(f"size-{tag}.jpg", "JPEG", 1920, 1080, M + delta) for tag, delta in [("below", -1), ("at", 0), ("above", 1)]]
    specs += [(f"width-{w}.jpg", "JPEG", w, 1080, MB) for w in (1279, 1280, 1281)]
    specs += [(f"height-{h}.jpg", "JPEG", 1920, h, MB) for h in (719, 720, 721)]
    specs += [(f"photo-{i:02}.jpg", "JPEG", 1920, 1080, MB) for i in range(1, 12)]
    for name, fmt, width, height, size in specs:
        (d / name).write_bytes(_exact_image(fmt, width, height, size, name))
    return d


# --- case A ---

class Case:
    """TC-KAN-15-SETUP / TC-KAN-20-SETUP: signed-in user, cases A and B, A's "Selected photos" list open."""

    def __init__(self, app, images):
        self.app, self.page, self.images = app, app.page, images
        self.requests, self.dialogs, self.failures = [], [], []
        page = self.page
        self.token = page.evaluate("localStorage.getItem('meva.auth.token')")
        self.user = json.loads(page.evaluate("localStorage.getItem('meva.auth.user')"))
        self.vehicle_a, self.vehicle_b = (self._vehicle(key) for key in "AB")
        self.history_key = f"meva.history.{self.user['id']}"
        sessions = [
            {"id": "E2E-A", "vehicleId": str(self.vehicle_a["id"]), "createdAt": "2026-01-02T12:00:00Z", "photos": []},
            {"id": "E2E-B", "vehicleId": str(self.vehicle_b["id"]), "createdAt": "2026-01-03T12:00:00Z", "photos": []},
        ]
        self.baseline_b = sessions[1]
        page.evaluate("([key, value]) => localStorage.setItem(key, value)", [self.history_key, json.dumps(sessions)])
        page.on("request", self._track)
        page.on("dialog", self._dialog)
        page.goto(app.base_url)
        page.get_by_text("History", exact=True).click()
        page.get_by_text("MEVA CASE-A", exact=True).click()
        page.get_by_text("0 photos · 0 damages", exact=True).click()
        page.get_by_text("Add", exact=True).click()
        expect(page.get_by_text("Add photos to this session", exact=True)).to_be_visible()
        self.expect_count(0)

    def _vehicle(self, key):
        res = self.page.request.post(f"{API}/vehicles/", headers=self.headers(), data={"brand": "MEVA", "model": f"CASE-{key}", "notes": "Synthetic e2e data"})
        assert res.status == 201, "SETUP vehicle"
        return res.json()

    def _track(self, request):
        if request.url.startswith(API) and request.method not in ("GET", "OPTIONS"):
            self.requests.append(request.url)

    def _dialog(self, dialog):
        self.dialogs.append(dialog.message)
        dialog.dismiss()

    def headers(self):
        return {"Authorization": f"Bearer {self.token}"}

    # Soft checks: record the product mismatch and keep verifying the remaining steps.
    def check(self, condition, message):
        try:
            condition()
        except AssertionError as error:
            self.failures.append(f"{message}: {error}")

    def eventually(self, value, test, timeout=5.0):
        end = time.monotonic() + timeout
        while True:
            current = value()
            if test(current):
                return current
            if time.monotonic() > end:
                raise AssertionError(f"last value: {current!r}")
            self.page.wait_for_timeout(100)  # lets Playwright deliver pending events

    def done(self):
        assert not self.failures, "PRODUCT:\n" + "\n".join(self.failures)

    # --- selected photos list ---
    def selection(self):
        return self.page.get_by_text("Add photos to this session", exact=True).locator("..")

    def thumbnails(self):
        # Scoped to A: React Navigation keeps inactive screens in the DOM.
        return self.selection().locator("img")

    def submit(self):
        return self.selection().get_by_text("Upload and append", exact=True).locator("..")

    def expect_submit_enabled(self):
        # RN-web Pressable is a div; to_be_enabled() does not read aria-disabled on it.
        expect(self.submit()).not_to_have_attribute("aria-disabled", "true")
        expect(self.submit()).to_have_attribute("tabindex", "0")

    def expect_count(self, count):
        text = "No photos yet" if not count else f"{count} {'photo' if count == 1 else 'photos'}"
        expect(self.selection().get_by_text(text, exact=True)).to_be_visible()
        expect(self.thumbnails()).to_have_count(count)

    def selected_sources(self):
        return self.thumbnails().evaluate_all("imgs => imgs.map(img => img.getAttribute('src'))")

    def gallery(self, names):
        with self.page.expect_file_chooser() as chooser:
            self.selection().get_by_text("Choose from Gallery", exact=True).click()
        chooser.value.set_files([self.images / n for n in names])
        expect(self.page.locator('input[type="file"]')).to_have_count(0)
        self.page.evaluate("() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")

    def seed_photos(self, count):
        if count:
            self.gallery([f"photo-{i + 1:02}.jpg" for i in range(count)])
        self.expect_count(count)

    def remove(self, index):
        control = self.thumbnails().nth(index).locator("../..").locator('[tabindex="0"]')
        expect(control, "HARNESS: unique thumbnail removal control").to_have_count(1)
        control.click()

    def rejection(self, count, reason):
        self.check(lambda: expect(self.thumbnails()).to_have_count(count), "invalid photo must not be added")
        self.check(lambda: self.eventually(lambda: self.selection().inner_text() + "\n" + "\n".join(self.dialogs), reason.search),
                   "rejection reason must be visible")

    def assert_no_analyses(self):
        res = self.page.request.get(f"{API}/analysis/", headers=self.headers())
        assert res.json()["total"] == 0, "PRODUCT: no analysis records created"

    # --- camera (synthetic stream at the getUserMedia boundary; app code unchanged) ---
    def virtual_camera(self):
        self.page.evaluate("""() => {
          navigator.mediaDevices.getUserMedia = async () => {
            const permission = await navigator.permissions.query({ name: 'camera' });
            if (permission.state !== 'granted') throw new DOMException('Test permission denied', 'NotAllowedError');
            const canvas = document.createElement('canvas');
            canvas.width = 1920; canvas.height = 1080;
            const ctx = canvas.getContext('2d');
            const draw = () => {
              ctx.fillStyle = '#426882'; ctx.fillRect(0, 0, 1920, 1080);
              ctx.fillStyle = '#ffffff'; ctx.font = '40px sans-serif';
              ctx.fillText('MEVA SYNTHETIC CAMERA ' + performance.now().toFixed(0), 40, 100);
            };
            draw();
            const timer = setInterval(draw, 100);
            const stream = canvas.captureStream(10);
            stream.getVideoTracks()[0].addEventListener('ended', () => clearInterval(timer));
            return stream;
          };
        }""")

    def wait_video_ready(self):
        self.page.wait_for_function("() => [...document.querySelectorAll('video')].some(v => v.readyState === 4)")

    def camera_open(self):
        self.page.context.grant_permissions(["camera"])
        self.virtual_camera()
        self.selection().get_by_text("Take Photo", exact=True).click()
        expect(self.page.locator("video")).to_be_visible()
        self.wait_video_ready()

    def camera_output(self, name):
        """The canvas drawn from the video serializes to the fixture bytes (hardware boundary only)."""
        raw = (self.images / name).read_bytes()
        mime = "image/png" if name.endswith(".png") else "image/gif" if name.endswith(".gif") else "image/jpeg"
        uri = f"data:{mime};base64,{base64.b64encode(raw).decode()}"
        self.page.evaluate("""uri => {
          const videoCanvases = new WeakSet();
          const draw = CanvasRenderingContext2D.prototype.drawImage;
          CanvasRenderingContext2D.prototype.drawImage = function (...args) {
            if (args[0] instanceof HTMLVideoElement) videoCanvases.add(this.canvas);
            return draw.apply(this, args);
          };
          const serialize = HTMLCanvasElement.prototype.toDataURL;
          HTMLCanvasElement.prototype.toDataURL = function (...args) {
            return videoCanvases.has(this) ? uri : serialize.apply(this, args);
          };
        }""", uri)
        return uri

    def shutter(self):
        return self.page.locator('[tabindex="0"][style*="width: 76px"][style*="height: 76px"]')

    def capture(self, name="valid.jpg"):
        self.camera_open()
        uri = self.camera_output(name)
        self.shutter().click()
        expect(self.page.get_by_text("Use photo", exact=True)).to_be_visible()
        preview = self.page.get_by_text("Use photo", exact=True).locator("../../..").locator("img")
        expect(preview).to_have_count(1)
        assert preview.get_attribute("src") == uri, "HARNESS: camera delivered exact fixture bytes"
        return uri

    def use_photo(self):
        self.page.get_by_text("Use photo", exact=True).click()
        expect(self.selection()).to_be_visible()

    def close_camera(self):
        chips = self.page.locator('[tabindex="0"][style*="width: 40px"][style*="height: 40px"]')
        expect(chips).to_have_count(2)
        chips.first.click()
        expect(self.selection()).to_be_visible()

    # --- submission ---
    def history(self):
        return self.page.evaluate("key => JSON.parse(localStorage.getItem(key) ?? '[]')", self.history_key)

    def successful_submit(self, expected_uris, control_case=False):
        """Submit and verify the photos reached detection/classification and the result belongs to A."""
        encoded = self.page.evaluate("""uris => Promise.all(uris.map(async uri => {
          const blob = await (await fetch(uri)).blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = () => resolve(String(reader.result).split(',')[1]);
            reader.readAsDataURL(blob);
          });
        }))""", expected_uris)
        expected = [base64.b64decode(e) for e in encoded]
        sent = []

        def observe(route):
            body = route.request.post_data_buffer or b""
            sent.extend(hashlib.sha256(b).hexdigest() for b in expected if b in body)
            route.continue_()

        self.page.route(f"{API}/analysis/analyze", observe)
        analyze_before = len(self.app.analyze_calls)
        self.submit().click()
        expect(self.page.get_by_text(re.compile(r"Uploading \d+ of \d+"))).to_be_visible()
        self.eventually(lambda: next((len(s["photos"]) for s in self.history() if s["id"] == "E2E-A"), 0),
                        lambda n: n == len(expected_uris), timeout=30)
        a = next(s for s in self.history() if s["id"] == "E2E-A")
        assert a["vehicleId"] == str(self.vehicle_a["id"])
        assert [p["localUri"] for p in a["photos"]] == expected_uris
        assert sorted(sent) == sorted(hashlib.sha256(b).hexdigest() for b in expected)
        assert len(self.app.analyze_calls) - analyze_before == len(expected_uris)
        for photo in a["photos"]:
            assert photo["result"]["status"] == "completed"
            assert isinstance(photo["result"]["damage_zones"], list)
            record = self.page.request.get(f"{API}/analysis/{photo['result']['id']}", headers=self.headers()).json()
            self.check(lambda: _equal(record.get("vehicle_id"), self.vehicle_a["id"]), "backend result linked to A vehicle")
            self.check(lambda: _true(isinstance(photo["result"].get("total_estimated_cost"), (int, float))), "preliminary estimate returned")
        self.check(lambda: expect(self.page.get_by_text(re.compile("success|uploaded|saved successfully", re.I))).to_be_visible(),
                   "successful submission confirmation")
        self.page.unroute(f"{API}/analysis/analyze", observe)
        if control_case:
            self.assert_b_unchanged()

    def assert_b_unchanged(self):
        assert next(s for s in self.history() if s["id"] == "E2E-B") == self.baseline_b
        assert self.page.request.get(f"{API}/vehicles/{self.vehicle_b['id']}", headers=self.headers()).json() == self.vehicle_b
        assert self.page.request.get(f"{API}/analysis/?vehicle_id={self.vehicle_b['id']}", headers=self.headers()).json()["total"] == 0


def _equal(actual, expected):
    assert actual == expected, f"{actual!r} != {expected!r}"


def _true(value):
    assert value


@pytest.fixture
def case(app, exact_images) -> Case:
    return Case(app, exact_images)
