"""Lab 3 helpers: drive the MEVA web build (http://127.0.0.1:8766) with Playwright.

Needs the API on :8000 (e2e/ai_stub_server.py) and the exported web app on :8766 – see README.md.
"""
import contextlib
import io
import json
import sys
import textwrap
import time
import urllib.request
import uuid
from pathlib import Path

from PIL import Image
from playwright.sync_api import Page, expect

URL = "http://127.0.0.1:8766"
API = "http://127.0.0.1:8000"
USER = ("demo@meva.lt", "demo123")
THEME_KEY = "autodamage.theme.pref"  # AsyncStorage key of the theme preference (light | dark | system)
HERE = Path(__file__).resolve().parent


def photo(name="car.jpg", size=(1024, 768)) -> Path:
    path = HERE / "data" / name
    if not path.exists():
        path.parent.mkdir(exist_ok=True)
        Image.new("RGB", size, (90, 110, 130)).save(path)
    return path


def visible(page: Page, text: str):
    # React Navigation keeps earlier screens mounted (hidden) on web, so filter to the visible one.
    return page.get_by_text(text, exact=True).filter(visible=True)


def open_app(page: Page, theme: str = "light"):
    page.goto(URL)
    page.evaluate("([k, v]) => localStorage.setItem(k, v)", [THEME_KEY, theme])
    page.reload()
    page.wait_for_timeout(1500)


def fresh_user() -> tuple:
    """Register a new empty account through the API, so every run starts from the same state."""
    email = f"lab3-{uuid.uuid4().hex[:8]}@meva.lt"
    body = json.dumps({"email": email, "password": "lab3pass", "name": "Lab 3"}).encode()
    req = urllib.request.Request(f"{API}/auth/register", body, {"Content-Type": "application/json"})
    urllib.request.urlopen(req).close()
    return email, "lab3pass"


def login(page: Page, email=USER[0], password=USER[1]):
    page.get_by_placeholder("you@example.com").fill(email)
    page.get_by_placeholder("Your password").fill(password)
    visible(page, "Sign in").last.click()
    expect(visible(page, "Choose from Gallery")).to_be_visible(timeout=10_000)


def analyze_new_vehicle(page: Page, plate: str):
    """F1: pick a gallery photo, analyze it and save it to a new vehicle."""
    with page.expect_file_chooser() as chooser:
        visible(page, "Choose from Gallery").click()
    chooser.value.set_files(photo())
    visible(page, "Analyze 1 photo").click()
    expect(visible(page, "Save to which vehicle?")).to_be_visible(timeout=15_000)
    new_vehicle = visible(page, "+ New vehicle")
    if new_vehicle.count():
        new_vehicle.click()
    page.get_by_placeholder("e.g. ABC123").filter(visible=True).fill(plate)
    visible(page, "Create vehicle and save").click()
    page.wait_for_timeout(1500)


def unique_plate() -> str:
    return f"LAB{int(time.time()) % 100000:05d}"


CELL_WIDTH = 42  # longer cells wrap onto several lines


def _render_table(md_rows):
    """Markdown table rows -> aligned ASCII table with borders; long cells wrap."""
    rows = [[c.strip() for c in r.strip().strip("|").split("|")] for r in md_rows]
    rows = [r for r in rows if not all(set(c) <= set("-: ") and c for c in r)]  # drop |---|---|
    n = max(len(r) for r in rows)
    rows = [r + [""] * (n - len(r)) for r in rows]
    cells = [[textwrap.wrap(c, CELL_WIDTH) or [""] for c in r] for r in rows]
    widths = [max(len(line) for r in cells for line in r[i]) for i in range(n)]
    rule = lambda ch: "+" + "+".join(ch * (w + 2) for w in widths) + "+"  # noqa: E731
    multiline = any(len(c) > 1 for r in cells[1:] for c in r)
    out = [rule("-")]
    for k, r in enumerate(cells):
        for j in range(max(len(c) for c in r)):
            out.append("| " + " | ".join((c[j] if j < len(c) else "").ljust(w) for c, w in zip(r, widths)) + " |")
        if k == 0:
            out.append(rule("="))
        elif multiline and k < len(cells) - 1:
            out.append(rule("-"))
    out.append(rule("-"))
    return out


def pretty(text):
    """Print text, drawing every markdown table in it as a bordered table."""
    out, block = [], []
    for line in text.splitlines() + [""]:
        if line.startswith("|"):
            block.append(line)
            continue
        if block:
            out += _render_table(block)
            block = []
        out.append(line)
    print("\n".join(out).rstrip())


@contextlib.contextmanager
def pretty_tables():
    """Collect everything a script prints and show its markdown tables as bordered tables."""
    buf = io.StringIO()
    real = sys.stdout
    sys.stdout = buf
    try:
        yield
    finally:
        sys.stdout = real
        pretty(buf.getvalue())
