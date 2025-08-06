# Complaint Management System

Track and analyze part-order complaints. Backend: FastAPI (SQLite). Frontend: React + TypeScript + Tailwind. Auth with JWT. EN/FR UI.

Last Updated: 2025-08-06

## Run locally

1) Backend
```bash
cd complaint-system/backend
pip install -r requirements.txt
python scripts/create_user.py --username admin --role admin
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

2) Frontend
```bash
cd complaint-system/frontend
npm install
# optional: echo VITE_API_BASE_URL=http://127.0.0.1:8000 > .env
npm run dev
```

3) URLs
- App: http://localhost:3000
- API health: http://127.0.0.1:8000/health

## Key features
- JWT auth (HS256) with access/refresh; login at /login
- File uploads (PDF/images/txt), 10MB/file
- Companies/parts autocomplete, complaints list with filters
- Dashboard metrics and trends
- English/French language toggle

## Notes
- Backend listens on 8000; frontend dev server on 3000
- Auth routes work with and without trailing slash (/auth/login and /auth/login/)
- Frontend axios base URL comes from VITE_API_BASE_URL (default http://127.0.0.1:8000)

## CI (manual)
- .github/workflows: backend, frontend, e2e (run via workflow_dispatch)
- Badges template:
```
![Backend CI](https://github.com/OWNER/REPO/actions/workflows/ci-backend.yml/badge.svg)
![Frontend CI](https://github.com/OWNER/REPO/actions/workflows/ci-frontend.yml/badge.svg)
![E2E CI](https://github.com/OWNER/REPO/actions/workflows/ci-e2e.yml/badge.svg)
```

## Structure
```
complaint-system/
  backend/        # FastAPI app, databases (complaints.db, users.db), scripts/
  frontend/       # React app (src/services/api.ts, pages/LoginPage.tsx, i18n/)
```

More details: [ARCHITECTURE.md](ARCHITECTURE.md:1)
