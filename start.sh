#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Prefer the backend virtualenv if one exists
PY=python3
[ -x "$ROOT/backend/.venv/bin/python" ] && PY="$ROOT/backend/.venv/bin/python"

if ! "$PY" -c "import fastapi, uvicorn" 2>/dev/null; then
  echo "Backend dependencies missing. Run first-time setup (see README):"
  echo "  cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt"
  exit 1
fi

[ -f "$ROOT/backend/.env" ] || cp "$ROOT/backend/.env.example" "$ROOT/backend/.env"
[ -f "$ROOT/backend/ai/best_vehicle_damage_yolov8s_30e.pt" ] || \
  echo "WARNING: model weights missing (backend/ai/best_vehicle_damage_yolov8s_30e.pt) — analysis will return 503."

# Free port 8000 if something is using it (e.g. Docker)
if lsof -ti :8000 &>/dev/null; then
  echo "Port 8000 in use — killing occupying process..."
  kill -9 $(lsof -ti :8000) 2>/dev/null || true
  sleep 2
fi

# Start backend in background
echo "Starting backend on http://0.0.0.0:8000 ..."
cd "$ROOT/backend"
"$PY" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
# Clean up backend when Expo exits (including Ctrl+C)
trap 'kill $BACKEND_PID 2>/dev/null || true' EXIT

# Start mobile (foreground — Expo Metro stays interactive)
echo "Starting mobile (Expo)..."
cd "$ROOT/mobile"
npm install --silent
npx expo start
