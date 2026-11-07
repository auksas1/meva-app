"""Lab 3, M1 – error message understandability (ISO/IEC 25023 Lr-3-S) on the MEVA web app.

Usage (from anywhere, servers running – see README.md):
  backend\\.venv\\Scripts\\python.exe e2e\\lab3\\tools\\error_messages.py --sets A B
  ... --sets B --only B4 B5

Every scenario causes one error through the UI and checks whether its message appears on screen.
The message text comes from the code (on a phone it is shown; on web Alert.alert does nothing).
A message is understandable when it states the reason AND what to do (or the valid rule/format):
  X(content) = understandable messages / all messages      – what a phone user would read
  X(web)     = understandable messages shown on web / all   – what a web user actually gets
"""
import argparse
import json
import os

from playwright.sync_api import sync_playwright, expect

import meva_web as m

OUT = m.HERE.parent / "results" / "errors"
STUB = m.HERE.parent / "ai_stub.json"


def images():
    from PIL import Image
    d = m.HERE / "data"
    d.mkdir(exist_ok=True)
    (d / "not_image.jpg").write_text("plain text document renamed to .jpg")
    if not (d / "small.jpg").exists():
        Image.new("RGB", (320, 240), (90, 110, 130)).save(d / "small.jpg")
    if not (d / "huge.jpg").exists():
        Image.frombytes("RGB", (4000, 3000), os.urandom(4000 * 3000 * 3)).save(d / "huge.jpg", quality=100)
    return d


# id: (set, situation, shown via, expected message, states reason, states what to do)
SCENARIOS = {
    "A1": ("A", "Wrong password at sign-in", "inline", "Incorrect email or password.", True, False),
    "A2": ("A", "Register: passwords differ", "inline", "Passwords do not match.", True, False),
    "A3": ("A", "Register: password too short", "inline", "Password must be at least 6 characters.", True, True),
    "A4": ("A", "New vehicle: year 1800", "Alert", "Invalid year – Year must be a valid number between 1900 and 2100.", True, True),
    "A5": ("A", "Repair: date 03/11/2026", "Alert", "Invalid date – Use format YYYY-MM-DD (e.g. 2026-05-10).", True, True),
    "A6": ("A", "Repair: cost -5", "Alert", "Invalid cost – Cost must be a positive number.", True, True),
    "B1": ("B", "Upload a text file renamed .jpg", "Alert", "Validation failed – Could not read image dimensions. No photos were uploaded.", False, False),
    "B2": ("B", "Upload a 320x240 photo", "Alert", "Validation failed – Image too small (320x240). Minimum 640x480. No photos were uploaded.", True, True),
    "B3": ("B", "Upload a photo over 10 MB", "Alert", "Validation failed – Image too large (… MB). Maximum 10 MB. No photos were uploaded.", True, True),
    "B4": ("B", "AI model fails (HTTP 503)", "Alert", "Upload failed – <exception text> Check the backend URL in Settings and try again.", False, False),
    "B5": ("B", "Server unreachable at sign-in", "inline", "Cannot reach the server. Check the backend URL.", True, True),
}
# Text that proves the message is on screen.
PROOF = {"A1": "Incorrect email or password.", "A2": "Passwords do not match.", "A3": "Password must be at least 6",
         "A4": "Year must be a valid number", "A5": "Use format YYYY-MM-DD", "A6": "Cost must be a positive number",
         "B1": "Could not read image", "B2": "Image too small", "B3": "Image too large", "B4": "Upload failed",
         "B5": "Cannot reach the server"}


def upload(page, file):
    with page.expect_file_chooser() as chooser:
        m.visible(page, "Choose from Gallery").click()
    chooser.value.set_files(file)
    m.visible(page, "Analyze 1 photo").click()


def register(page, password, confirm):
    m.visible(page, "Register").last.click()
    page.get_by_placeholder("you@example.com").filter(visible=True).fill(f"lab3-err-{os.urandom(3).hex()}@meva.lt")
    page.get_by_placeholder("At least 6 characters").fill(password)
    page.get_by_placeholder("Re-enter your password").fill(confirm)
    m.visible(page, "Create account").last.click()


def repair_form(page):
    m.login(page, *m.fresh_user())
    m.analyze_new_vehicle(page, m.unique_plate())
    m.visible(page, "Add repair").last.click()
    expect(m.visible(page, "Date performed")).to_be_visible()


def trigger(page, sid, data):
    if sid == "A1":
        page.get_by_placeholder("you@example.com").fill(m.USER[0])
        page.get_by_placeholder("Your password").fill("wrong-password")
        m.visible(page, "Sign in").last.click()
    elif sid == "A2":
        register(page, "abcdef", "abcdeg")
    elif sid == "A3":
        register(page, "abc", "abc")
    elif sid == "A4":
        m.login(page, *m.fresh_user())
        upload(page, m.photo())
        expect(m.visible(page, "Save to which vehicle?")).to_be_visible(timeout=15_000)
        page.get_by_placeholder("e.g. 2018").fill("1800")
        page.get_by_placeholder("e.g. ABC123").fill(m.unique_plate())
        m.visible(page, "Create vehicle and save").last.click()
    elif sid in ("A5", "A6"):
        repair_form(page)
        page.get_by_placeholder("YYYY-MM-DD").fill("03/11/2026" if sid == "A5" else "2026-11-03")
        page.get_by_placeholder("e.g. 580").fill("250" if sid == "A5" else "-5")
        m.visible(page, "Save").last.click()
    elif sid in ("B1", "B2", "B3"):
        m.login(page, *m.fresh_user())
        upload(page, data / {"B1": "not_image.jpg", "B2": "small.jpg", "B3": "huge.jpg"}[sid])
    elif sid == "B4":
        m.login(page, *m.fresh_user())
        STUB.write_text(json.dumps({"zones": [], "delay": 0, "error": True}))
        try:
            upload(page, m.photo())
            page.wait_for_timeout(2500)
        finally:
            STUB.write_text(json.dumps({"zones": [{"label": "Scratch", "conf": 0.88, "box": [0.15, 0.2, 0.4, 0.45]},
                                                  {"label": "Dent", "conf": 0.74, "box": [0.55, 0.5, 0.8, 0.75]}],
                                        "delay": 0.5, "error": False}))
    elif sid == "B5":
        m.visible(page, "Change").last.click()
        page.get_by_placeholder("http://10.0.2.2:8000").fill("http://127.0.0.1:9")
        m.visible(page, "Save server").last.click()
        page.get_by_placeholder("you@example.com").fill(m.USER[0])
        page.get_by_placeholder("Your password").fill(m.USER[1])
        m.visible(page, "Sign in").last.click()
    page.wait_for_timeout(2500)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sets", nargs="+", default=["A", "B"], choices=["A", "B"])
    ap.add_argument("--only", nargs="*", help="scenario ids, e.g. A4 B4")
    ap.add_argument("--theme", default="light")
    args = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    data = images()
    ids = [s for s, v in SCENARIOS.items() if v[0] in args.sets and (not args.only or s in args.only)]

    rows = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for sid in ids:
            page = browser.new_page(viewport={"width": 412, "height": 915})
            m.open_app(page, args.theme)
            trigger(page, sid, data)
            shown = page.get_by_text(PROOF[sid]).filter(visible=True).count() > 0
            page.screenshot(path=OUT / f"{sid}.png")
            rows.append((sid, *SCENARIOS[sid], shown))
            page.close()
        browser.close()

    print("| # | Situation | Shown via | Message (from code) | Reason | What to do | Understandable | Shown on web |")
    print("|---|---|---|---|---|---|---|---|")
    for sid, _, situation, via, msg, reason, action, shown in rows:
        yn = lambda b: "yes" if b else "no"  # noqa: E731
        print(f"| {sid} | {situation} | {via} | {msg} | {yn(reason)} | {yn(action)} | {yn(reason and action)} | {yn(shown)} |")
    for s in args.sets:
        sub = [r for r in rows if r[1] == s]
        if not sub:
            continue
        good = sum(r[5] and r[6] for r in sub)
        good_web = sum(r[5] and r[6] and r[7] for r in sub)
        print(f"\nSet {s}: X(content) = {good}/{len(sub)} = {good / len(sub):.2f}; X(web) = {good_web}/{len(sub)} = {good_web / len(sub):.2f}")


if __name__ == "__main__":
    with m.pretty_tables():
        main()
