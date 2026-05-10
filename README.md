# MEVA App

AI-based vehicle damage recognition application for university group project.

## Project goal
The application allows users to upload or capture a vehicle photo, run AI-based damage detection, and view highlighted damage zones and analysis results.

## Planned stack
- Mobile: React Native + Expo
- Backend: Python + FastAPI
- AI: YOLOv8
- Database: SQLite / PostgreSQL

## Repository structure
- `mobile/` - mobile client application
- `backend/` - API and business logic
- `ai/` - model training and inference related files
- `docs/` - project documentation

## Running the project

### Prerequisites
- Python 3.9+
- Node 20 LTS
- Expo Go on your phone (optional, for device testing)

### Start everything

```bash
bash start.sh
```

This will free port 8000 if needed, start the backend, then launch Expo Metro. From the Metro prompt:
- `w` → open in browser at http://localhost:8081
- `i` → iOS simulator (macOS only)
- `a` → Android emulator
- Scan QR with Expo Go for a physical device

### First-time setup

```bash
# Backend dependencies
cd backend
pip install -r requirements.txt
cp .env.example .env
```

Mobile dependencies are installed automatically by `start.sh` (`npm install`).

### Backend only

```bash
cd backend
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Backend tests

```bash
cd backend
python3 -m pytest -v
```

### Network targets

| Client | Backend URL to set in Settings |
|---|---|
| Browser / iOS simulator | `http://localhost:8000` |
| Android emulator | `http://10.0.2.2:8000` |
| Physical phone (Expo Go) | `http://<your LAN IP>:8000` |

Set the backend URL in the app's **Settings tab**.

---

## Branch strategy
- `main` - stable version
- `develop` - integration branch
- `feature/*` - feature development branches

## Team workflow
All work should be done in `feature/*` branches.
Changes are merged into `develop` via pull requests.
Only stable and reviewed changes are merged into `main`.
