# 3 LD – išmokstamumo ir prieinamumo matavimo įrankiai (Mantas Einoris)

Visos komandos – PowerShell, iš `meva-app` šakninio aplanko, nebent nurodyta kitaip.
`PY` – backend'o Python su Playwright:
```
$PY = "$PWD\backend\.venv\Scripts\python.exe"
```

## 0. Vieną kartą

```
cd e2e\lab3\tools
npm install                      # axe-core 4.10.2, Lighthouse 12.2.1
& $PY -m playwright install chromium
cd ..\..\..\mobile
npx expo export --platform web --output-dir ..\e2e\lab3\web
cd ..
```
Web versiją reikia sugeneruoti iš naujo, jei pasikeitė mobile kodas.

## 1. Paleisti programėlę (du atskiri langai)

**API su YOLO stub'u** (`:8000` – web versija jį naudoja pagal nutylėjimą):
```
$env:DATABASE_URL="sqlite:///e2e/lab3/meva.db"; $env:AI_STUB_FILE="$PWD\e2e\lab3\ai_stub.json"
& $PY e2e\ai_stub_server.py 8000
```

**Web versija** (`:8766`):
```
& $PY -m http.server 8766 --bind 127.0.0.1 --directory e2e\lab3\web
```
Naršyklėje: http://127.0.0.1:8766 (demo vartotojas `demo@meva.lt` / `demo123`).

## 2. Matavimai (iš `e2e\lab3\tools`)

| Metrika | Komanda | Ką galima keisti gynime |
|---|---|---|
| M1 klaidų pranešimai | `& $PY error_messages.py` | `--sets A` / `--sets B`, `--only A4 B4`, `--theme dark` |
| M2 savaime suprantami žingsniai | `& $PY learnability_steps.py` | `--viewport 1280x800`, `--flows F2`, `--theme dark` |
| M3 axe-core (WCAG) | `& $PY axe_audit.py` | `--themes dark`, `--screens login vehicle`, `--viewport 1280x800`, `--tags wcag2a wcag2aa` |
| M3 Lighthouse | `& $PY lighthouse_audit.py` | `--themes light`, `--form-factor desktop` |
| M4 tik klaviatūra | `& $PY keyboard_audit.py` | `--flows F2`, `--theme dark`, `--max-tabs 20` |
| M4 ekrano skaitytuvas | `& $PY screen_reader_audit.py` | `--screens history vehicle`, `--viewport 412x915` |

Kiekvienas paleidimas registruoja naują tuščią vartotoją, todėl rezultatai nepriklauso nuo ankstesnių paleidimų.
Rezultatai, ekrano kopijos ir JSON/HTML ataskaitos – `e2e\lab3\results\<metrika>\`, testiniai paveikslėliai –
`tools\data\`. Abu aplankai sugeneruojami ir į git nekeliami.

**Rankiniu būdu (gynimui):** Chrome → F12 → Lighthouse → Mode „Snapshot“ → Accessibility – bet kuriam ekranui po prisijungimo.
Klaviatūros testas rankomis: Tab / Shift+Tab / Enter. Ekrano skaitytuvas: Windows Narrator (Ctrl+Win+Enter).
