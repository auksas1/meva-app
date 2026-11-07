"""Lab 3, M2 – self-explanatory user interface (ISO/IEC 25023 Lr-4-S) for MEVA functions F1 and F2.

Usage (from anywhere, servers running – see README.md):
  backend\\.venv\\Scripts\\python.exe e2e\\lab3\\tools\\learnability_steps.py --flows F1 F2
  ... --viewport 1280x800      (phone 412x915 by default)

A first-time user must find and understand every step without help. Each step is checked with:
  C1 label     – the control shows readable text (not only an icon) and the text is not cut off;
  C2 in view   – the control is visible without scrolling;
  C3 hint      – inputs: a visible field label and a placeholder with an example or format;
  C4 feedback  – actions: the next screen or a confirmation appears within 5 s.
A step is self-explanatory when all criteria that apply pass. X = self-explanatory steps / all steps.
"""
import argparse
import re

from playwright.sync_api import sync_playwright

import meva_web as m

OUT = m.HERE.parent / "results" / "learnability"

# (kind, target, value, feedback). kind: press | file | type (target = placeholder) | tab (bottom tab).
FLOWS = {
    "F1": [
        ("file", "Choose from Gallery", None, "1 photo"),
        ("press", "Analyze 1 photo", None, "Save to which vehicle?"),
        ("type", "e.g. ABC123", "{plate}", None),
        ("press", "Create vehicle and save", None, "Total estimate"),
    ],
    "F2": [
        ("tab", "History", None, "Vehicles"),
        ("press", "{plate}", None, "Edit vehicle"),
        ("press", re.compile(r"\d+ photos? ·"), None, "Repair log"),
        ("press", "Add repair", None, "Date performed"),
        ("type", "YYYY-MM-DD", "2026-11-03", None),
        ("type", "e.g. 580", "250", None),
        ("press", "Save", None, "€250"),
    ],
}

CHECK = """el => {
  const clean = s => (s || '').replace(/[\\uE000-\\uF8FF]/g, '').replace(/\\s+/g, ' ').trim();
  const r = el.getBoundingClientRect();
  // On top and inside the window: the element hit at its centre is this control (not a hidden screen).
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const hitEl = (x >= 0 && y >= 0 && x < innerWidth && y < innerHeight) ? document.elementFromPoint(x, y) : null;
  const hit = !!hitEl && (el.contains(hitEl) || hitEl.contains(el));
  // Is the label text cut off by the window or by a parent that hides overflow (tab bar labels)?
  let cut = false;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!clean(n.textContent)) continue;
    const range = document.createRange(); range.selectNodeContents(n);
    const t = range.getBoundingClientRect();
    if (t.height === 0) continue;
    if (t.bottom > innerHeight + 0.5) cut = true;
    for (let a = n.parentElement; a && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.overflowY !== 'visible' || s.overflowX !== 'visible') {
        const c = a.getBoundingClientRect();
        if (t.bottom > c.bottom + 0.5 || t.top < c.top - 0.5) cut = true;
      }
    }
  }
  // Field label: the text just above an input.
  const above = document.elementFromPoint(r.left + 4, r.top - 10);
  return {
    hit,
    text: clean(el.innerText || el.getAttribute('aria-label') || ''),
    textCut: cut,
    placeholder: el.getAttribute('placeholder') || '',
    label: clean(above && !el.contains(above) ? above.innerText : ''),
  };
}"""


def candidates(page, kind, target):
    if kind == "type":
        return page.get_by_placeholder(target).all()
    if kind == "tab":
        return page.get_by_role("tab", name=target).all()
    if isinstance(target, re.Pattern):
        return page.get_by_text(target).all()
    return page.get_by_text(target, exact=True).all()


def locate(page, kind, target):
    """The matching control of the screen the user sees. React Navigation keeps other screens mounted,
    so the right one is the one that is on top. Returns (locator, visible without scrolling)."""
    cands = candidates(page, kind, target)
    for loc in cands:
        if loc.evaluate(CHECK)["hit"]:
            return loc, True
    for loc in cands:
        if not loc.is_visible():
            continue
        loc.scroll_into_view_if_needed()
        if loc.evaluate(CHECK)["hit"]:
            return loc, False
    raise RuntimeError(f"{target!r} not found on the current screen")


def run_flow(page, flow, data, shots):
    rows = []
    for n, (kind, target, value, feedback) in enumerate(FLOWS[flow], 1):
        target = target.format(**data) if isinstance(target, str) else target
        page.screenshot(path=shots / f"{flow}-{n:02d}-{page.viewport_size['width']}.png")  # what the user sees
        loc, c2 = locate(page, kind, target)
        info = loc.evaluate(CHECK)
        c1 = bool(info["text"] or info["placeholder"]) and not info["textCut"]
        c3 = None
        if kind == "type":
            label_shown = len(info["label"]) > 0
            example = bool(re.search(r"e\.g\.|YYYY|\d", info["placeholder"]))
            c3 = label_shown and example
            loc.fill(value.format(**data))
        elif kind == "file":
            with page.expect_file_chooser() as chooser:
                loc.click()
            chooser.value.set_files(m.photo())
        else:
            loc.click()
        c4 = None
        if feedback:
            try:
                page.get_by_text(feedback, exact=not feedback.startswith("€")).filter(visible=True).first.wait_for(timeout=5000)
                c4 = True
            except Exception:
                c4 = False
        page.wait_for_timeout(400)
        ok = all(c is not False for c in (c1, c2, c3, c4))
        label = target.pattern if isinstance(target, re.Pattern) else target
        rows.append((n, kind, label, c1, c2, c3, c4, ok))
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--flows", nargs="+", default=["F1", "F2"], choices=list(FLOWS))
    ap.add_argument("--viewport", default="412x915")
    ap.add_argument("--theme", default="light")
    args = ap.parse_args()
    w, h = map(int, args.viewport.split("x"))
    OUT.mkdir(parents=True, exist_ok=True)
    data = {"plate": m.unique_plate()}
    tag = f"{args.viewport}"

    summary = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": w, "height": h})
        m.open_app(page, args.theme)
        m.login(page, *m.fresh_user())
        if "F2" in args.flows and "F1" not in args.flows:
            m.analyze_new_vehicle(page, data["plate"])
        for flow in [f for f in ["F1", "F2"] if f in args.flows]:
            rows = run_flow(page, flow, data, OUT)
            good = sum(r[-1] for r in rows)
            summary.append((flow, good, len(rows)))
            fmt = lambda c: "-" if c is None else ("yes" if c else "no")  # noqa: E731
            lines = [f"# {flow} – self-explanatory steps (viewport {args.viewport}, theme {args.theme})", "",
                     "| # | Step | Target | C1 label | C2 in view | C3 hint | C4 feedback | Self-explanatory |",
                     "|---|---|---|---|---|---|---|---|"]
            lines += [f"| {n} | {k} | {t} | {fmt(c1)} | {fmt(c2)} | {fmt(c3)} | {fmt(c4)} | {fmt(ok)} |"
                      for n, k, t, c1, c2, c3, c4, ok in rows]
            lines.append(f"\nX = {good}/{len(rows)} = {good / len(rows):.2f}")
            (OUT / f"{flow}-{tag}.md").write_text("\n".join(lines), encoding="utf-8")
            print("\n".join(lines), "\n")
            if flow == "F1":
                page.get_by_role("tab", name="Analyze").click()
        browser.close()


if __name__ == "__main__":
    with m.pretty_tables():
        main()
