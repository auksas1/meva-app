"""Lab 3, M4b – what a screen reader can announce for every keyboard-focusable control on a screen.

Usage (from the meva-app root, servers running – see README.md):
  backend\\.venv\\Scripts\\python.exe e2e\\lab3\\tools\\screen_reader_audit.py
  ... --screens analyze vehicle --theme dark

Tabs through each screen until focus returns to the first control and records the role and the
accessible name of every stop. A control is announced correctly when it has a role (button, link,
tab, textbox, ...) and a name (aria-label or visible text). X = correct controls / all controls.
"""
import argparse
from pathlib import Path

from playwright.sync_api import sync_playwright

import meva_web as m
from axe_audit import SCREENS, go_to

OUT = m.HERE.parent / "results" / "screen-reader"

STOP_INFO = """() => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const implicit = {BUTTON: 'button', A: 'link', INPUT: 'textbox', TEXTAREA: 'textbox', SELECT: 'combobox'};
  const role = el.getAttribute('role') || implicit[el.tagName] || '';
  // Icon-font glyphs (Ionicons) are Unicode private-use characters: a screen reader cannot read them.
  const clean = s => (s || '').replace(/[\\uE000-\\uF8FF]/g, '').replace(/\\s+/g, ' ').trim();
  const name = clean(el.getAttribute('aria-label')) || clean(el.getAttribute('placeholder')) || clean(el.innerText);
  if (!el.dataset.lab3) el.dataset.lab3 = Math.random().toString(36).slice(2);
  // Focus can land in screens React Navigation keeps mounted but hides (other tabs, earlier screens).
  const r = el.getBoundingClientRect();
  const visible = el.checkVisibility({opacityProperty: true, visibilityProperty: true})
    && r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth
    && !el.closest('[aria-hidden="true"]');
  return {id: el.dataset.lab3, role, name: name.slice(0, 50), visible};
}"""


def tab_cycle(page, max_tabs):
    stops, seen = [], set()
    page.locator("body").click(position={"x": 1, "y": 1})  # start from the top of the page
    for _ in range(max_tabs):
        page.keyboard.press("Tab")
        info = page.evaluate(STOP_INFO)
        if not info:
            continue
        if info["id"] in seen:
            break
        seen.add(info["id"])
        stops.append(info)
    return stops


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--screens", nargs="+", default=SCREENS, choices=SCREENS)
    ap.add_argument("--theme", default="light")
    ap.add_argument("--viewport", default="1280x800")
    ap.add_argument("--max-tabs", type=int, default=80)
    args = ap.parse_args()
    w, h = map(int, args.viewport.split("x"))
    OUT.mkdir(parents=True, exist_ok=True)
    wanted = set(args.screens)
    last = max(SCREENS.index(s) for s in wanted)

    summary = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": w, "height": h})
        m.open_app(page, args.theme)
        plate = m.unique_plate()
        for screen in SCREENS[: last + 1]:
            if screen != "login":
                go_to(page, screen, plate)
            if screen not in wanted:
                continue
            all_stops = tab_cycle(page, args.max_tabs)
            stops = [s for s in all_stops if s["visible"]]
            hidden = len(all_stops) - len(stops)
            ok = [s for s in stops if s["role"] and s["name"]]
            no_role = [s["name"] for s in stops if not s["role"]]
            no_name = [s["role"] or "-" for s in stops if not s["name"]]
            summary.append((screen, len(ok), len(stops), no_role, no_name, hidden))
            lines = [f"# {screen} – focus stops (theme {args.theme}, viewport {args.viewport})", "",
                     "| # | Visible | Role | Accessible name | Announced correctly |", "|---|---|---|---|---|"]
            lines += [f"| {i} | {'yes' if s['visible'] else 'no (hidden screen)'} | {s['role'] or 'none'} | {s['name'] or '(empty)'} | "
                      f"{'yes' if s['visible'] and s['role'] and s['name'] else 'no'} |"
                      for i, s in enumerate(all_stops, 1)]
            (OUT / f"{screen}.md").write_text("\n".join(lines), encoding="utf-8")
            page.screenshot(path=OUT / f"{screen}.png")
        browser.close()

    print("| Screen | Correct / visible focus stops | X | Without role | Without name | Stops in hidden screens |")
    print("|---|---|---|---|---|---|")
    for screen, ok, total, no_role, no_name, hidden in summary:
        x = ok / total if total else 0
        print(f"| {screen} | {ok}/{total} | {x:.2f} | {len(no_role)} | {len(no_name)} | {hidden} |")
    total_ok = sum(s[1] for s in summary)
    total = sum(s[2] for s in summary)
    print(f"\nAll screens: X = {total_ok}/{total} = {total_ok / total:.2f}")


if __name__ == "__main__":
    with m.pretty_tables():
        main()
