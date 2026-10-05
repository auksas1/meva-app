# E2E tests (KAN-1, KAN-4)

Python Playwright tests for the web build of the mobile app against the real FastAPI backend.
Only the YOLO model is replaced (`ai_stub_server.py`), so tests don't need the weights and
each test decides which damage zones, confidence, delay or failure the "model" returns.

## Setup (once)

```sh
cd mobile && npm install && cd ..
backend/.venv/bin/pip install -r backend/requirements.txt -r e2e/requirements.txt  # ultralytics may be skipped
backend/.venv/bin/python -m playwright install chromium
```

## Run

```sh
backend/.venv/bin/python -m pytest e2e            # add --headed to watch
backend/.venv/bin/python -m pytest e2e/test_kan4.py -k tc_kan4_02
```

The session exports the web app (`expo export`), serves it on :8766 and starts the API on :8765
with a throwaway SQLite DB. Each test registers a fresh user and signs in through the UI.

`xfail` tests: validation/upload error messages use `Alert.alert`, a no-op on react-native-web,
so the user sees nothing on web. They turn into XPASS failures once that is fixed.
