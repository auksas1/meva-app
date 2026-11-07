"""Lab 3, M3b – Lighthouse accessibility score (0-100) for MEVA web screens.

Usage (from anywhere, servers running – see README.md):
  backend\\.venv\\Scripts\\python.exe e2e\\lab3\\tools\\lighthouse_audit.py --themes light dark
  ... --form-factor desktop

Lighthouse reloads the page it audits, so only screens reachable by URL can be measured: the login
screen (no session) and the Analyze home screen (signed in – the session is kept in localStorage,
hence one Chrome profile shared with Lighthouse and --disable-storage-reset). For any other screen use
Chrome DevTools -> Lighthouse -> "Snapshot" mode by hand.
"""
import argparse
import json
import subprocess
import tempfile

from playwright.sync_api import sync_playwright

import meva_web as m

OUT = m.HERE.parent / "results" / "lighthouse"
CLI = m.HERE / "node_modules" / "lighthouse" / "cli" / "index.js"
PORT = 9222


def lighthouse(name, form_factor):
    out = OUT / name
    cmd = ["node", str(CLI), m.URL, f"--port={PORT}", "--only-categories=accessibility", "--disable-storage-reset",
           f"--form-factor={form_factor}", "--output=json", "--output=html", f"--output-path={out}", "--quiet"]
    if form_factor == "desktop":
        cmd.append("--preset=desktop")
    subprocess.run(cmd, check=True)
    report = json.loads(out.with_suffix(".report.json").read_text(encoding="utf-8"))
    failed = [a for a in report["audits"].values() if a.get("score") == 0 and a.get("scoreDisplayMode") == "binary"]
    return round(report["categories"]["accessibility"]["score"] * 100), sorted(a["id"] for a in failed), report["lighthouseVersion"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--themes", nargs="+", default=["light", "dark"])
    ap.add_argument("--form-factor", default="mobile", choices=["mobile", "desktop"])
    args = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)

    rows = []
    with sync_playwright() as p:
        for theme in args.themes:
            with tempfile.TemporaryDirectory() as profile:
                ctx = p.chromium.launch_persistent_context(profile, args=[f"--remote-debugging-port={PORT}"])
                page = ctx.pages[0] if ctx.pages else ctx.new_page()
                m.open_app(page, theme)
                rows.append(("login", theme, *lighthouse(f"login-{theme}-{args.form_factor}", args.form_factor)))
                m.open_app(page, theme)
                m.login(page, *m.fresh_user())
                rows.append(("analyze", theme, *lighthouse(f"analyze-{theme}-{args.form_factor}", args.form_factor)))
                ctx.close()

    print(f"Lighthouse {rows[0][4]}, accessibility category, form factor {args.form_factor}")
    print("| Screen | Theme | Score | Failed audits |")
    print("|---|---|---|---|")
    for screen, theme, score, failed, _ in rows:
        print(f"| {screen} | {theme} | {score} | {', '.join(failed) or '-'} |")


if __name__ == "__main__":
    with m.pretty_tables():
        main()
