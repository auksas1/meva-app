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

## Branch strategy
- `main` - stable version
- `develop` - integration branch
- `feature/*` - feature development branches

## Team workflow
All work should be done in `feature/*` branches.
Changes are merged into `develop` via pull requests.
Only stable and reviewed changes are merged into `main`.
