"""Shared harness: real API (YOLO stubbed, see ai_stub_server.py) + static Expo web build."""
import http.server
import json
import os
import subprocess
import sys
import threading
import time
import urllib.request
import uuid
from functools import partial
from pathlib import Path

import pytest
from PIL import Image
from playwright.sync_api import Page, expect

ROOT = Path(__file__).resolve().parents[1]
API = "http://127.0.0.1:8765"
WEB_PORT = 8766
FRAME = 'svg rect[stroke="#00e5ff"]'  # BboxOverlay damage-zone frame
LABEL = "svg text"  # BboxOverlay per-zone label
NO_DAMAGE = "No visible damage was detected."
LOW_CONFIDENCE = "Low-confidence result. Please review the highlighted areas or upload a clearer image."
# RN-web's Alert.alert is a no-op, so validation/upload errors never reach the user on web.
ALERT_NOOP = pytest.mark.xfail(strict=True, reason="Alert.alert is a no-op on react-native-web")


def zone(label="Scratch", conf=0.9, box=(0.1, 0.1, 0.3, 0.3)):
    return {"label": label, "conf": conf, "box": list(box)}


def _wait(url, timeout=30):
    end = time.monotonic() + timeout
    while True:
        try:
            urllib.request.urlopen(url)
            return
        except OSError:
            if time.monotonic() > end:
                raise
            time.sleep(0.2)


@pytest.fixture(scope="session")
def stub_file(tmp_path_factory):
    return tmp_path_factory.mktemp("stub") / "ai_stub.json"


@pytest.fixture(scope="session", autouse=True)
def api_server(tmp_path_factory, stub_file):
    db = tmp_path_factory.mktemp("api") / "meva.db"
    env = {**os.environ, "DATABASE_URL": f"sqlite:///{db}", "AI_STUB_FILE": str(stub_file)}
    proc = subprocess.Popen([sys.executable, str(Path(__file__).with_name("ai_stub_server.py")), API.rsplit(":", 1)[1]], env=env)
    try:
        _wait(f"{API}/health")
        yield
    finally:
        proc.terminate()
        proc.wait()


class _QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


@pytest.fixture(scope="session")
def base_url(tmp_path_factory):
    out = tmp_path_factory.mktemp("web")
    subprocess.run(["npx", "expo", "export", "--platform", "web", "--output-dir", str(out)], cwd=ROOT / "mobile", check=True)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", WEB_PORT), partial(_QuietHandler, directory=str(out)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{WEB_PORT}"
    server.shutdown()


@pytest.fixture(scope="session")
def images(tmp_path_factory):
    d = tmp_path_factory.mktemp("images")
    Image.new("RGB", (1024, 768), (90, 110, 130)).save(d / "car.jpg")
    Image.new("RGB", (320, 240), (90, 110, 130)).save(d / "small.jpg")
    Image.frombytes("RGB", (4000, 3000), os.urandom(4000 * 3000 * 3)).save(d / "huge.jpg", quality=100)
    assert (d / "huge.jpg").stat().st_size > 10 * 1024 * 1024
    (d / "not_image.jpg").write_text("plain text document renamed to .jpg")
    (d / "empty.jpg").write_bytes(b"")
    return d


@pytest.fixture
def ai(stub_file):
    """Sets what the stubbed model returns for the next uploads."""
    def configure(zones=(), delay=0.0, error=False):
        stub_file.write_text(json.dumps({"zones": list(zones), "delay": delay, "error": error}))
    configure()
    return configure


class App:
    def __init__(self, page: Page, base_url: str):
        self.page, self.base_url = page, base_url
        self.analyze_calls = []
        page.on("request", lambda r: r.url.endswith("/analysis/analyze") and self.analyze_calls.append(r.url))

    def home(self):
        self.page.goto(self.base_url)
        expect(self.page.get_by_text("Choose from Gallery", exact=True)).to_be_visible()

    def pick(self, image):
        with self.page.expect_file_chooser() as chooser:
            self.page.get_by_text("Choose from Gallery", exact=True).click()
        chooser.value.set_files(image)
        expect(self.page.get_by_text("1 photo", exact=True)).to_be_visible()

    def submit(self):
        self.page.get_by_text("Analyze 1 photo", exact=True).click()

    def analyze(self, image, plate="TESTVIN0000000001", timeout=10_000, open_result=True) -> float:
        """Upload one photo, save it to a new vehicle and open its result. Returns analysis seconds."""
        self.home()
        self.pick(image)
        start = time.monotonic()
        self.submit()
        expect(self.page.get_by_text("Save to which vehicle?")).to_be_visible(timeout=timeout)
        elapsed = time.monotonic() - start
        new_vehicle = self.page.get_by_text("+ New vehicle", exact=True)
        if new_vehicle.is_visible():
            new_vehicle.click()
        self.page.get_by_placeholder("e.g. ABC123").fill(plate)
        self.page.get_by_text("Create vehicle and save", exact=True).click()
        if not open_result:
            return elapsed
        self.page.get_by_text("Photo 1", exact=True).click()
        expect(self.visible("Delete photo")).to_be_visible()
        return elapsed

    def visible(self, text):
        # React Navigation keeps earlier screens mounted (hidden) on web.
        return self.page.get_by_text(text, exact=True).filter(visible=True)

    def frames(self):
        return self.page.locator(FRAME)

    def labels(self):
        return self.page.locator(LABEL)

    def money(self, label) -> int:
        """Euro value of an EstimateLineItem row, e.g. 'Paint surface  €120' -> 120."""
        return int(self.visible(label).locator("xpath=../..").inner_text().rsplit("€", 1)[1])


@pytest.fixture
def app(page: Page, base_url, ai) -> App:
    """TC-*-SETUP: a registered user signs in through the UI and lands on the upload screen."""
    email, password = f"e2e-{uuid.uuid4().hex}@test.lt", "test1234"
    assert page.request.post(f"{API}/auth/register", data={"email": email, "password": password}).status == 201
    page.add_init_script(f"localStorage.setItem('meva.backend_url', '{API}')")
    page.goto(base_url)
    page.get_by_placeholder("you@example.com").fill(email)
    page.get_by_placeholder("Your password").fill(password)
    page.get_by_placeholder("Your password").press("Enter")
    expect(page.get_by_text("Choose from Gallery", exact=True)).to_be_visible()
    return App(page, base_url)
