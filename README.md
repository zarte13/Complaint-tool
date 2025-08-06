# Complaint Management System

A simple web app for tracking part-order complaints with analytics dashboard.

## Quick Start

### 1. Setup Backend
```bash
cd complaint-system/backend
pip install -r requirements.txt
python init_db.py
python main.py
```

### 2. Setup Frontend
```bash
cd complaint-system/frontend
npm install
npm run dev
```

### 3. Open Browser
Visit http://localhost:3000

## Continuous Integration (CI)

This repository includes GitHub Actions workflows for automated quality checks:

- Backend CI: `.github/workflows/ci-backend.yml` — pytest with coverage and enforcement (85% lines/branches)
- Frontend CI: `.github/workflows/ci-frontend.yml` — Vitest with coverage and enforcement (80% lines/branches)
- E2E CI: `.github/workflows/ci-e2e.yml` — spins up backend and frontend, then runs Playwright tests
- Performance (manual): `.github/workflows/ci-perf.yml` — manual Locust run against the backend

Badges (replace OWNER/REPO with your GitHub org/repo):
```
![Backend CI](https://github.com/OWNER/REPO/actions/workflows/ci-backend.yml/badge.svg)
![Frontend CI](https://github.com/OWNER/REPO/actions/workflows/ci-frontend.yml/badge.svg)
![E2E CI](https://github.com/OWNER/REPO/actions/workflows/ci-e2e.yml/badge.svg)
![Perf (Locust)](https://github.com/OWNER/REPO/actions/workflows/ci-perf.yml/badge.svg)
```

How CI runs:
- Backend CI triggers on pushes/PRs that touch complaint-system/backend/**
- Frontend CI triggers on pushes/PRs that touch complaint-system/frontend/**
- E2E CI triggers on pushes/PRs that touch complaint-system/**
- Performance workflow is manual (workflow_dispatch) to control minutes

Trigger the performance (Locust) workflow:
1) On GitHub → Actions → “Performance (Locust - manual)”
2) Click “Run workflow”
3) Optional inputs:
   - users (default 50)
   - spawn_rate (default 5)
   - run_time (default 2m)
4) The job starts backend, generates a simple locustfile, runs headless, and uploads CSV artifacts:
   - locust-report_stats.csv
   - locust-report_failures.csv
   - locust-report_distribution.csv

Coverage reports:
- Backend: coverage.xml generated; thresholds enforced in workflow
- Frontend: coverage/coverage-summary.json; thresholds enforced in workflow

To adjust thresholds:
- Backend: edit the “Enforce coverage threshold” Python step in `.github/workflows/ci-backend.yml`
- Frontend: edit the Node step “Enforce coverage thresholds” in `.github/workflows/ci-frontend.yml`

## What's New

### 📊 Command Center Dashboard
- **RAR Metrics**: Real-time Return, Authorization, and Rejection rates
- **Live Charts**: Sparklines update every 30 seconds
- **Top Issues**: See the 3 most common failure modes
- **Navigate**: Click "Dashboard" in the top menu

### 🧪 Testing Suite
- **Unit Tests**: 90%+ coverage with Vitest
- **E2E Tests**: Playwright browser automation
- **Run Tests**: `npm test` or `npm run test:e2e`

## What You Can Do

- **Submit complaints** with title, description, severity
- **Search companies** and parts with auto-complete
- **Upload files** (images, PDFs, text) up to 10MB
- **View all complaints** in real-time
- **Analyze trends** in the dashboard

## Tech Stack

- **Backend**: FastAPI + SQLite
- **Frontend**: React + TypeScript + Tailwind CSS
- **Charts**: Recharts for real-time analytics
- **File Storage**: Local filesystem
- **Testing**: Vitest + Playwright

## Development

Backend runs on http://localhost:8000  
Frontend runs on http://localhost:5173

## Troubleshooting

- Port in use? Check `ARCHITECTURE.md` for fixes
- Missing dependencies? Run install commands again
- Database issues? Delete `complaints.db` and run `python init_db.py`
- Tests failing? Ensure backend is running for E2E tests

## Project Structure
```
complaint-system/
├── backend/          # FastAPI server
├── frontend/         # React app
└── uploads/          # File storage
README.md         # This file