#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Free port 8000 if something is using it (e.g. Docker)
if lsof -ti :8000 &>/dev/null; then
  echo "Port 8000 in use — killing occupying process..."
  kill -9 $(lsof -ti :8000) 2>/dev/null || true
  sleep 2
fi

# Start backend in background
echo "Starting backend on http://0.0.0.0:8000 ..."
cd "$ROOT/backend"
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start mobile (foreground — Expo Metro stays interactive)
echo "Starting mobile (Expo)..."
cd "$ROOT/mobile"
npm install --silent
npx expo start

# Clean up backend when Expo exits
kill $BACKEND_PID 2>/dev/null || true
