## System Overview

The Complaint Management System is a full-stack web application for tracking part-order complaints.

- Backend: FastAPI + SQLAlchemy (SQLite)
- Frontend: React + TypeScript (Vite, Tailwind)
- Auth: JWT (access/refresh), role guards
- File Uploads: Local storage with metadata in DB
- Offline: Service Worker + IndexedDB queue for mutations

## Project Structure (current)

```
complaint-system/
├── backend/
│   ├── app/
│   │   ├── api/ (analytics, companies, complaints, follow_up_actions, parts, responsibles)
│   │   ├── auth/ (dependencies, models, router, schemas, security)
│   │   ├── database/ (database.py, users_db.py)
│   │   ├── models/ (models.py)
│   │   ├── schemas/ (schemas.py)
│   │   └── utils/ (file_handler.py)
│   ├── database/ (complaints.db, users.db)
│   ├── migrations/ (001_da004_..., 002_da008_...)
│   ├── scripts/ (clear_uploads.py, import_companies.py, import_parts.py, create_user.py)
│   ├── uploads/complaints/
│   ├── main.py, migrate_db.py, init_db.py
│   └── requirements*.txt
├── frontend/
│   ├── public/sw.js
│   ├── src/ (App.tsx, components/, pages/, hooks/, services/, stores/, i18n/, types/, utils/)
│   ├── e2e/ (dashboard.spec.ts, offline-mode.spec.ts)
│   └── config files (vite, vitest, tailwind, tsconfig)
└── ARCHITECTURE.md (index), docs/ (split docs)
```


