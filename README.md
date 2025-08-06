# Complaint Management System

A production-ready web app for tracking part-order complaints with authentication, analytics, file uploads, and bilingual UI.

Last Updated: 2025-08-06

## Quick Start

### 1) Backend (FastAPI)
```bash
cd complaint-system/backend
pip install -r requirements.txt

# Create an initial admin (policy: >=10 chars, 1 upper, 1 lower, 1 digit)
python scripts/create_user.py --username admin --role admin

# Run API
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 2) Frontend (Vite + React)
```bash
cd complaint-system/frontend
npm install

# Optional: configure backend base URL for dev
# echo VITE_API_BASE_URL=http://127.0.0.1:8000 > .env

npm run dev
```

### 3) Open Browser
- Frontend: http://localhost:3000
- API: http://127.0.0.1:8000/health

## Authentication

- JWT (HS256) with access/refresh tokens
- Access TTL: 30 minutes; Refresh TTL: 14 days (rotation on refresh)
- Bcrypt password hashing; password policy enforced on user creation
- Separate SQLite DB for users/tokens at backend/database/users.db
  - Path is resolved absolutely and parent dir auto-created
  - Override with USERS_DATABASE_URL or USERS_DB_URL
  - See [`python.app/database/users_db.py`](complaint-system/backend/app/database/users_db.py:1)

Endpoints:
- POST /auth/login and /auth/login/
- POST /auth/refresh and /auth/refresh/

Frontend:
- Zustand store persists tokens to localStorage
- Axios interceptor injects Authorization and auto-refreshes on 401
- Login page at /login redirects to /dashboard on success
- Navigation shows i18n’d Login/Logout

## HTTP Routing and URL Normalization

- FastAPI app uses redirect_slashes=False to avoid 307 redirect loops
- Critical routes (auth) are registered with and without trailing slash
- Axios client:
  - Base URL from VITE_API_BASE_URL or window.__API_BASE_URL__ (defaults to http://127.0.0.1:8000)
  - Request interceptor normalizes trailing slashes except for multipart/form-data
  - Rewrites accidental absolute URLs pointing to localhost:3000 to backend base
  - See [`typescript.api.ts`](complaint-system/frontend/src/services/api.ts:1)

## Internationalization (EN/FR)

- Language toggle in the top nav; persisted in localStorage
- Translations include navigation, forms, drawer, dashboard, attachments, and login strings
- See [`typescript.translations`](complaint-system/frontend/src/i18n/translations.ts:1)

## What You Can Do

- Submit complaints with file attachments (PDF, images, txt; 10MB/file)
- Search companies and parts with autocomplete
- View, filter, and paginate complaints
- Analyze trends and KPIs on the dashboard
- Authenticate and manage sessions with auto token refresh

## Tech Stack

- Backend: FastAPI + SQLAlchemy + SQLite
  - Domain DB: backend/database/complaints.db
  - Auth DB: backend/database/users.db
- Frontend: React + TypeScript + Tailwind CSS
- Testing: Pytest (backend), Vitest and Playwright (frontend)
- Build: Vite

## CI Workflows

Note: Currently configured as manual (workflow_dispatch) only.

This repository includes GitHub Actions workflows for automated quality checks:

- Backend CI: .github/workflows/ci-backend.yml — pytest with coverage gate
- Frontend CI: .github/workflows/ci-frontend.yml — vitest with coverage gate
- E2E CI: .github/workflows/ci-e2e.yml — spins up backend+frontend and runs Playwright
- Performance (manual): .github/workflows/ci-perf.yml — optional Locust run

Badges (replace OWNER/REPO with your GitHub org/repo):
```
![Backend CI](https://github.com/OWNER/REPO/actions/workflows/ci-backend.yml/badge.svg)
![Frontend CI](https://github.com/OWNER/REPO/actions/workflows/ci-frontend.yml/badge.svg)
![E2E CI](https://github.com/OWNER/REPO/actions/workflows/ci-e2e.yml/badge.svg)
![Perf (Locust)](https://github.com/OWNER/REPO/actions/workflows/ci-perf.yml/badge.svg)
```

How CI runs (currently manual only via workflow_dispatch):
- Backend CI can be run on demand
- Frontend CI can be run on demand
- E2E CI can be run on demand
- Performance workflow is manual with inputs to control run size

## Troubleshooting

- Login fails with 500 / “unable to open database file”:
  - Users DB parent dir is auto-created now; ensure you’re running uvicorn from complaint-system/backend
  - Confirm env overrides (USERS_DATABASE_URL) if customized
- 404 calling /auth/login from the frontend:
  - Ensure VITE_API_BASE_URL points to http://127.0.0.1:8000
  - Auth routes support both /auth/login and /auth/login/
- Unexpected 307 redirects:
  - redirect_slashes=False is set; use ensureTrailingSlash where needed on collection endpoints
- Tests fail due to window undefined in hooks:
  - Shared test setup in frontend/src/test/setup.ts provides minimal stubs

## Project Structure
```
complaint-system/
├── backend/
│   ├── app/
│   │   ├── api/…
│   │   ├── auth/…
│   │   ├── database/…
│   │   └── …
│   ├── database/
│   │   ├── complaints.db
│   │   └── users.db
│   └── scripts/create_user.py
├── frontend/
│   ├── src/
│   │   ├── components/…
│   │   ├── i18n/translations.ts
│   │   ├── pages/LoginPage.tsx
│   │   └── services/api.ts
│   └── …
└── README.md
```

For deeper technical details, see the architecture guide:
- [ARCHITECTURE.md](ARCHITECTURE.md:1)
