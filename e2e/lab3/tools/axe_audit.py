"""Lab 3, M3a – automated WCAG check with axe-core on MEVA web screens.

Usage (from the meva-app root, servers running – see README.md):
  backend\\.venv\\Scripts\\python.exe e2e\\lab3\\tools\\axe_audit.py --themes light dark
  ... --screens login analyze --viewport 1280x800 --tags wcag2a wcag2aa

For every screen x theme it prints the number of violated rules and affected elements by impact,
and saves the full axe JSON and a screenshot to results/axe/.
"""
import argparse
import json
import re
from collections import Counter
from pathlib import Path

from playwright.sync_api import sync_playwright, expect

import meva_web as m

AXE = m.HERE / "node_modules" / "axe-core" / "axe.min.js"
OUT = m.HERE.parent / "results" / "axe"
SCREENS = ["login", "analyze", "results", "history", "vehicle", "repair"]
IMPACTS = ["critical", "serious", "moderate", "minor"]


def run_axe(page, tags):
    page.add_script_tag(path=str(AXE))
    return page.evaluate("tags => axe.run(document, {runOnly: {type: 'tag', values: tags}})", tags)


def go_to(page, screen, plate):
    """Navigate from the previous screen in SCREENS order to `screen`."""
    if screen == "analyze":
        m.login(page, *m.fresh_user())
    elif screen == "results":
        m.analyze_new_vehicle(page, plate)
        expect(m.visible(page, "Total estimate")).to_be_visible()
    elif screen == "history":
        page.get_by_role("tab", name="History").click()
        expect(m.visible(page, "Vehicles").first).to_be_visible()
    elif screen == "vehicle":
        m.visible(page, plate).first.click()
        page.wait_for_timeout(1000)
    elif screen == "repair":
        page.get_by_text(re.compile(r"^\d+ photos? ·")).filter(visible=True).first.click()  # session card
        page.wait_for_timeout(1000)
        m.visible(page, "Add repair").last.click()
        expect(m.visible(page, "Date performed")).to_be_visible()
    page.wait_for_timeout(800)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--themes", nargs="+", default=["light", "dark"])
    ap.add_argument("--screens", nargs="+", default=SCREENS, choices=SCREENS)
    ap.add_argument("--viewport", default="412x915", help="WxH, default = Pixel 7 size")
    ap.add_argument("--tags", nargs="+", default=["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    args = ap.parse_args()
    w, h = map(int, args.viewport.split("x"))
    OUT.mkdir(parents=True, exist_ok=True)
    wanted = set(args.screens)
    last = max(SCREENS.index(s) for s in wanted)

    rows = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for theme in args.themes:
            page = browser.new_page(viewport={"width": w, "height": h})
            m.open_app(page, theme)
            plate = m.unique_plate()
            for screen in SCREENS[: last + 1]:
                if screen != "login":
                    go_to(page, screen, plate)
                if screen not in wanted:
                    continue
                res = run_axe(page, args.tags)
                name = f"{screen}-{theme}"
                (OUT / f"{name}.json").write_text(json.dumps(res["violations"], indent=1), encoding="utf-8")
                page.screenshot(path=OUT / f"{name}.png")
                nodes = Counter()
                for v in res["violations"]:
                    nodes[v["impact"]] += len(v["nodes"])
                rows.append((screen, theme, len(res["violations"]), nodes, len(res["passes"]),
                             sorted({v["id"] for v in res["violations"]})))
            page.close()
        browser.close()

    print(f"axe-core {json.loads((AXE.parent / 'package.json').read_text())['version']}, tags: {' '.join(args.tags)}, viewport {args.viewport}")
    print("| Screen | Theme | Violated rules | Elements: critical / serious / moderate / minor | Passed rules | Rules |")
    print("|---|---|---|---|---|---|")
    for screen, theme, n, nodes, passes, ids in rows:
        counts = " / ".join(str(nodes[i]) for i in IMPACTS)
        print(f"| {screen} | {theme} | {n} | {counts} | {passes} | {', '.join(ids)} |")


if __name__ == "__main__":
    with m.pretty_tables():
        main()
