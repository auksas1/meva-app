"""Lab 3, M4 – can a user complete MEVA functions with the keyboard only (Tab / Enter / typing)?

Usage (from the meva-app root, servers running – see README.md):
  backend\\.venv\\Scripts\\python.exe e2e\\lab3\\tools\\keyboard_audit.py --flows login F1 F2
  ... --flows F2 --theme dark --max-tabs 60

For every step the script presses Tab until the target control gets focus, then activates it with
Enter (or types into it). A step that cannot be reached or activated is done with the mouse so the
next steps can still be checked. For every focused target it also records the role a screen reader
would announce and whether focus is visible. Results: results/keyboard/<flow>.md + screenshots.
"""
import argparse
import re
from pathlib import Path

from playwright.sync_api import sync_playwright, expect

import meva_web as m

OUT = m.HERE.parent / "results" / "keyboard"

# (action, target, value, done-check). action: press = activate a control, type = fill an input
# (target = placeholder), file = control that opens the file picker. done-check: text visible after the step.
FLOWS = {
    "login": [
        ("type", "you@example.com", "{email}", None),
        ("type", "Your password", "{password}", None),
        ("press", "Sign in", None, "Choose from Gallery"),
    ],
    "F1": [
        ("file", "Choose from Gallery", None, "1 photo"),
        ("press", "Analyze 1 photo", None, "Save to which vehicle?"),
        ("type", "e.g. ABC123", "{plate}", None),
        ("press", "Create vehicle and save", None, "Total estimate"),
    ],
    "F2": [
        ("press", "History", None, "Vehicles"),
        ("press", "{plate}", None, "Edit vehicle"),
        ("press", re.compile(r"\d+ photos? ·"), None, "Repair log"),
        ("press", "Add repair", None, "Date performed"),
        ("type", "YYYY-MM-DD", "2026-11-03", None),
        ("type", "e.g. 580", "250", None),
        ("press", "Save", None, "€250"),
    ],
}

FOCUS_INFO = """() => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  // Focus is visible if the element looks different while focused (outline, shadow, border or background).
  const look = () => { const s = getComputedStyle(el); return [s.outlineStyle, s.outlineWidth, s.outlineColor, s.boxShadow, s.borderColor, s.backgroundColor].join('|'); };
  const focused = look();
  el.blur();
  const blurred = look();
  el.focus({ focusVisible: true });
  return {
    tag: el.tagName.toLowerCase(),
    role: el.getAttribute('role') || (el.tagName === 'BUTTON' ? 'button' : el.tagName === 'A' ? 'link' : el.tagName === 'INPUT' ? 'textbox' : ''),
    name: el.getAttribute('aria-label') || '',
    text: (el.innerText || '').replace(/[ \\t]+/g, ' ').trim().slice(0, 120),
    placeholder: el.getAttribute('placeholder') || '',
    focusVisible: focused !== blurred,
  };
}"""


def matches(info, target):
    if not info:
        return False
    if isinstance(target, re.Pattern):
        return bool(target.search(info["text"]))
    # A card's text has several lines (e.g. plate, findings, sessions), so a line equal to the target also counts.
    lines = [line.strip() for line in info["text"].splitlines()]
    return target in (info["placeholder"], info["text"], info["name"]) or target in lines


def tab_to(page, target, max_tabs):
    for i in range(1, max_tabs + 1):
        page.keyboard.press("Tab")
        info = page.evaluate(FOCUS_INFO)
        if matches(info, target):
            return info, i
    return None, max_tabs


def mouse_fallback(page, action, target, value):
    loc = page.get_by_placeholder(target) if action == "type" else page.get_by_text(target, exact=not isinstance(target, re.Pattern))
    loc = loc.filter(visible=True).last
    if action == "type":
        loc.fill(value)
    elif action == "file":
        with page.expect_file_chooser() as chooser:
            loc.click()
        chooser.value.set_files(m.photo())
    else:
        loc.click()


def run_flow(page, flow, data, max_tabs, shots):
    rows = []
    for n, (action, target, value, done) in enumerate(FLOWS[flow], 1):
        target = target.format(**data) if isinstance(target, str) else target
        value = value.format(**data) if value else value
        info, tabs = tab_to(page, target, max_tabs)
        page.screenshot(path=shots / f"{flow}-{n:02d}.png")  # the focused target, before it is activated
        ok = False
        if info:
            try:
                if action == "type":
                    page.keyboard.type(value)
                    ok = True
                elif action == "file":
                    with page.expect_file_chooser(timeout=3000) as chooser:
                        page.keyboard.press("Enter")
                    chooser.value.set_files(m.photo())
                    ok = True
                else:
                    page.keyboard.press("Enter")
                    ok = True
                if done:
                    expect(m.visible(page, done).first).to_be_visible(timeout=10_000) if not done.startswith("€") \
                        else expect(page.get_by_text(done).filter(visible=True).first).to_be_visible(timeout=10_000)
            except Exception:
                ok = False
        if not ok:
            mouse_fallback(page, action, target, value)
            if done:
                page.get_by_text(done).filter(visible=True).first.wait_for(timeout=15_000)
        page.wait_for_timeout(500)
        label = target.pattern if isinstance(target, re.Pattern) else target
        rows.append((n, action, label, info is not None, tabs if info else "-", ok,
                     (info or {}).get("role") or "none", (info or {}).get("focusVisible")))
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--flows", nargs="+", default=["login", "F1", "F2"], choices=list(FLOWS))
    ap.add_argument("--theme", default="light")
    ap.add_argument("--viewport", default="1280x800", help="keyboard users are usually on desktop")
    ap.add_argument("--max-tabs", type=int, default=40)
    args = ap.parse_args()
    w, h = map(int, args.viewport.split("x"))
    OUT.mkdir(parents=True, exist_ok=True)
    email, password = m.fresh_user()
    data = {"email": email, "password": password, "plate": m.unique_plate()}

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": w, "height": h})
        m.open_app(page, args.theme)
        flows = list(args.flows)
        # F1 and F2 need a signed-in user, F2 also needs a saved vehicle: prepare them with the mouse.
        if "login" not in flows:
            m.login(page, email, password)
        if "F2" in flows and "F1" not in flows:
            m.analyze_new_vehicle(page, data["plate"])
        order = [f for f in ["login", "F1", "F2"] if f in flows]
        summary = []
        for flow in order:
            rows = run_flow(page, flow, data, args.max_tabs, OUT)
            done = sum(r[5] for r in rows)
            summary.append((flow, done, len(rows)))
            lines = [f"# {flow} – keyboard only (theme {args.theme}, viewport {args.viewport}, max {args.max_tabs} Tab)", "",
                     "| # | Action | Target | Reached with Tab | Tab presses | Done with keyboard | Role announced | Focus visible |",
                     "|---|---|---|---|---|---|---|---|"]
            lines += [f"| {n} | {a} | {t} | {'yes' if r else 'no'} | {k} | {'yes' if ok else 'no'} | {role} | {fv} |"
                      for n, a, t, r, k, ok, role, fv in rows]
            lines.append(f"\nX = {done}/{len(rows)} = {done / len(rows):.2f}")
            (OUT / f"{flow}.md").write_text("\n".join(lines), encoding="utf-8")
            print("\n".join(lines), "\n")
            if flow == "F1":
                page.get_by_role("tab", name="Analyze").click()  # F2 starts from the tab bar
        browser.close()
    print("| Flow | Steps done with keyboard | X |")
    print("|---|---|---|")
    for flow, done, total in summary:
        print(f"| {flow} | {done}/{total} | {done / total:.2f} |")


if __name__ == "__main__":
    with m.pretty_tables():
        main()
