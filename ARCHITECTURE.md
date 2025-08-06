# Complaint Management System - Complete Architecture Guide

**Last Updated**: 2025-07-17
**Commit Hash**: Comprehensive Code Review and Security Analysis
**Version**: 2.1.1

## Table of Contents
1. [System Overview](#system-overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Project Structure](#project-structure)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [Database Configuration](#database-configuration)
8. [API Endpoints](#api-endpoints)
9. [Data Models & Schemas](#data-models--schemas)
10. [File Upload Architecture](#file-upload-architecture)
11. [Internationalization](#internationalization)
12. [Routing & Navigation](#routing--navigation)
13. [Security Policies](#security-policies)
14. [Deployment Commands](#deployment-commands)
15. [Monitoring & Logging](#monitoring--logging)
16. [Testing Infrastructure](#testing-infrastructure)
17. [Recent Changes](#recent-changes)
18. [Enhanced Complaint Detail System](#enhanced-complaint-detail-system)
19. [Code Quality & Security Analysis](#code-quality--security-analysis)
20. [Troubleshooting](#troubleshooting)
21. [Glossary](#glossary)

---

## System Overview

The Complaint Management System is a full-stack web application for tracking part-order complaints with the following specifications:

- **Backend**: FastAPI with SQLite database
- **Frontend**: React + TypeScript with Tailwind CSS
- **File Upload**: Local storage with validation and MIME type checking
- **Real-time Updates**: Automatic refresh after submissions
- **Internationalization**: English/French language support with persistent toggle
- **Routing**: React Router with multi-page navigation
- **Web Port**: **3000** (frontend development server)
- **API Port**: **8000** (backend FastAPI server)

---

## Prerequisites

### Required Software
1. **Python 3.8+** - Backend runtime
2. **Node.js 18+** - Frontend runtime
3. **Git** - Version control
4. **PowerShell** - Command execution (Windows)

### System Requirements
- **RAM**: 4GB minimum
- **Storage**: 1GB free space
- **Network**: Local development ports 8000, 3000

---

## Environment Setup

### Step 1: Create Project Directory
```powershell
mkdir complaint-system
cd complaint-system
```

### Step 2: Initialize Git Repository
```powershell
git init
echo "node_modules/" > .gitignore
echo "__pycache__/" >> .gitignore
echo "*.pyc" >> .gitignore
echo ".env" >> .gitignore
echo "uploads/" >> .gitignore
echo "*.db" >> .gitignore
```

### Step 3: Create Virtual Environment
```powershell
python -m venv .venv
.venv\Scripts\activate
```

---

## Project Structure

```
complaint-system/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── analytics.py          # Analytics endpoints for dashboard
│   │   │   ├── companies.py          # Company CRUD operations
│   │   │   ├── parts.py              # Part CRUD operations
│   │   │   └── complaints.py         # Complaint management with file uploads
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   └── database.py           # SQLAlchemy configuration
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── models.py             # SQLAlchemy ORM models
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py            # Pydantic validation schemas
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── file_handler.py       # File upload utilities
│   ├── uploads/
│   │   └── complaints/               # Organized by complaint ID
│   ├── requirements.txt
│   ├── main.py                       # FastAPI application entry
│   ├── init_db.py                    # Database initialization script
│   └── migrate_db.py                 # Database migration script
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdvancedTable/
│   │   │   │   └── ExportButton.tsx
│   │   │   ├── CompanySearch/
│   │   │   │   └── CompanySearch.tsx
│   │   │   ├── ComplaintDetailDrawer/
│   │   │   │   ├── EnhancedComplaintDetailDrawer.tsx    # NEW: Enhanced 2-column drawer
│   │   │   │   ├── EnhancedComplaintDetailDrawer.test.tsx # NEW: Comprehensive tests
│   │   │   │   ├── ComplaintDetailView.tsx              # View mode component
│   │   │   │   ├── ComplaintDetailView.test.tsx         # View component tests
│   │   │   │   ├── ComplaintEditForm.tsx                # Edit form component
│   │   │   │   ├── ComplaintEditForm.test.tsx           # Edit form tests
│   │   │   │   ├── InlineEditField.tsx                  # NEW: Inline editing component
│   │   │   │   ├── useKeyboardShortcuts.ts              # Keyboard shortcuts hook
│   │   │   │   ├── useKeyboardShortcuts.test.ts         # Hook tests
│   │   │   │   ├── useUndoRedo.ts                       # Undo/redo functionality
│   │   │   │   └── useUndoRedo.test.ts                  # Undo/redo tests
│   │   │   ├── ComplaintForm/
│   │   │   │   └── ComplaintForm.tsx
│   │   │   ├── ComplaintList/
│   │   │   │   └── ComplaintList.tsx
│   │   │   ├── FileUpload/
│   │   │   │   └── FileUpload.tsx
│   │   │   ├── LanguageToggle/
│   │   │   │   └── LanguageToggle.tsx
│   │   │   ├── Navigation/
│   │   │   │   └── Navigation.tsx
│   │   │   ├── PartAutocomplete/
│   │   │   │   └── PartAutocomplete.tsx
│   │   │   └── Tooltip/
│   │   │       └── Tooltip.tsx
│   │   ├── contexts/
│   │   │   └── LanguageContext.tsx   # Global language state management
│   │   ├── hooks/
│   │   │   ├── useCompanies.ts       # Company data fetching
│   │   │   ├── useComplaints.ts      # Complaint data fetching
│   │   │   └── useParts.ts           # Part data fetching
│   │   ├── i18n/
│   │   │   └── translations.ts       # EN/FR translation strings
│   │   ├── pages/
│   │   │   ├── ComplaintListView.tsx
│   │   │   ├── ComplaintsPage.tsx   # Renamed from SecondPage.tsx
│   │   │   ├── DashboardPage.tsx     # Command center with RAR metrics
│   │   │   └── HomePage.tsx          # Main complaint form and list
│   │   ├── services/
│   │   │   └── api.ts                # API client with consistent trailing slashes
│   │   ├── test/
│   │   │   └── setup.ts              # Test configuration and mocks
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript type definitions
│   │   ├── utils/
│   │   │   └── index.ts              # Utility functions
│   │   ├── App.tsx                   # Main application component with routing
│   │   └── main.tsx                  # React entry point
│   ├── e2e/
│   │   └── *.spec.ts                 # End-to-end test files
│   ├── package.json
│   ├── vite.config.ts                # Vite configuration
│   ├── vitest.config.ts              # Vitest test configuration
│   ├── playwright.config.ts          # Playwright E2E configuration
│   ├── tailwind.config.js            # Tailwind CSS configuration
│   └── tsconfig.json
├── ARCHITECTURE.md                   # This file
├── BUGS.md                          # Bug tracking documentation
├── README.md                        # Project overview
└── TASKS.md                        # Task tracking
```

---

## Backend Setup

### Step 1: Create Backend Directory
```powershell
mkdir backend
cd backend
```

### Step 2: Create Requirements File
Create `requirements.txt`:
```
fastapi==0.116.1
uvicorn[standard]==0.35.0
sqlalchemy==2.0.41
alembic==1.16.4
pydantic==2.11.7
python-multipart==0.0.20
aiofiles==24.1.0
pillow==11.3.0
python-magic==0.4.27
pytest==8.3.4
pytest-cov==6.0.0
```

### Step 3: Install Dependencies
```powershell
pip install -r requirements.txt
```

### Step 4: Create Directory Structure
```powershell
mkdir app
mkdir app/api app/database app/models app/schemas app/utils
mkdir uploads
New-Item -ItemType File -Path app/__init__.py
New-Item -ItemType File -Path app/api/__init__.py
New-Item -ItemType File -Path app/database/__init__.py
New-Item -ItemType File -Path app/models/__init__.py
New-Item -ItemType File -Path app/schemas/__init__.py
New-Item -ItemType File -Path app/utils/__init__.py
```

---

## Frontend Setup

### Step 1: Create Frontend Directory
```powershell
cd ..
mkdir frontend
cd frontend
```

### Step 2: Initialize React Project
```powershell
npm create vite@latest . -- --template react-ts
npm install
```

### Step 3: Install Dependencies
```powershell
npm install axios react-hook-form @hookform/resolvers zod lucide-react react-dropzone react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

## Database Configuration

### Schema Validation Status (SQLite)

This section captures the current live database schema vs the target expected schema and enumerates actionable diffs. Source of truth DB: database/complaints.db.

Command used:
- Text: [`bash.python`](complaint-system/backend/schema_checker.py:1) invocation
  - python complaint-system/backend/schema_checker.py --format text --expected complaint-system/backend/schema_expected.json --tables complaints,companies,parts,complaint_attachments,follow_up_actions,action_history,responsible_persons,action_dependencies

Current results summary:
- Present tables: companies, parts, complaints, complaint_attachments
- Missing tables: follow_up_actions, action_history, responsible_persons, action_dependencies
- complaints indexes: only ix_complaints_id exists
- complaint_attachments columns/types differ; FK on_delete is NO ACTION

Actionable diffs vs expected:
- Missing tables: ['action_dependencies', 'action_history', 'follow_up_actions', 'responsible_persons']
- complaint_attachments:
  - Add column size or update expected to standardize on file_size naming
  - Align types: filename TEXT; mime_type TEXT NULLABLE
  - FK on_delete CASCADE (requires SQLite table recreate)
  - Add index idx_attachments_complaint_id(complaint_id)
- complaints:
  - Add indexes: idx_complaints_company_id(company_id), idx_complaints_part_id(part_id), idx_complaints_status(status), idx_complaints_created_at(created_at)

CI quality gate:
- Run schema_checker with --expected; fail build on diffs for both fresh and migrated DBs.


### Database Schema (SQLite)

#### Tables

##### 1. Companies Table
```sql
CREATE TABLE companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### 2. Parts Table
```sql
CREATE TABLE parts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    part_number VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### 3. Complaints Table (Updated)
```sql
CREATE TABLE complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    part_id INTEGER NOT NULL,
    issue_type VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    quantity_ordered INTEGER NOT NULL,
    quantity_received INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    work_order_number VARCHAR(100),
    occurrence VARCHAR(100),
    part_received VARCHAR(100),
    human_factor BOOLEAN DEFAULT FALSE,
    last_edit TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (part_id) REFERENCES parts(id)
);
```

##### 4. Attachments Table
```sql
CREATE TABLE attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
);
```

#### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_complaints_company_id ON complaints(company_id);
CREATE INDEX idx_complaints_part_id ON complaints(part_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_created_at ON complaints(created_at);
CREATE INDEX idx_attachments_complaint_id ON attachments(complaint_id);
```

#### Relationships
- **One-to-Many**: Company → Complaints
- **One-to-Many**: Part → Complaints
- **One-to-Many**: Complaint → Attachments

---

## API Endpoints

### Authentication
- POST `/auth/login` — Body: { username, password }
  - Validates password policy on create via CLI; at login verifies bcrypt hash
  - Returns: { access_token, refresh_token, token_type: "bearer", expires_in }
- POST `/auth/refresh` — Body: { refresh_token }
  - Verifies and rotates refresh token, returns new access/refresh pair

### Follow-up Actions and Responsables (in progress)
- GET `/api/responsible-persons/` — Auth required; supports search and active filter
- Planned admin-only:
  - POST `/api/responsible-persons/` — Create responsable
  - PUT `/api/responsible-persons/{id}` — Update responsable
  - DELETE `/api/responsible-persons/{id}` — Soft-deactivate responsable
- Action create/update endpoints require auth and will validate responsible_person against active responsables

### Base URL
```
http://localhost:8000/api/
```

### Companies Endpoints
| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| GET | `/companies/` | List all companies | `search` (optional), `limit` (default: 10) |
| POST | `/companies/` | Create new company | `{"name": "string"}` |
| GET | `/companies/{id}/` | Get company by ID | Path parameter |
| PUT | `/companies/{id}/` | Update company | Path parameter + body |
| DELETE | `/companies/{id}/` | Delete company | Path parameter |

### Parts Endpoints
| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| GET | `/parts/` | List all parts | `search` (optional), `limit` (default: 10) |
| POST | `/parts/` | Create new part | `{"part_number": "string", "description": "string"}` |
| GET | `/parts/{id}/` | Get part by ID | Path parameter |
| PUT | `/parts/{id}/` | Update part | Path parameter + body |
| DELETE | `/parts/{id}/` | Delete part | Path parameter |

### Complaints Endpoints
| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| GET | `/complaints/` | List complaints | `search`, `status`, `issue_type`, `skip`, `limit` |
| POST | `/complaints/` | Create complaint | ComplaintCreate schema |
| GET | `/complaints/{id}/` | Get complaint | Path parameter |
| PUT | `/complaints/{id}/` | Update complaint | Path parameter + body |
| DELETE | `/complaints/{id}/` | Delete complaint | Path parameter |
| POST | `/complaints/{id}/attachments/` | Upload attachment | Multipart form data |
| DELETE | `/complaints/{id}/attachments/{attachment_id}/` | Delete attachment | Path parameters |

### Analytics Endpoints
| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| GET | `/analytics/rar-metrics/` | Return/Authorization/Rejection rates | None |
| GET | `/analytics/failure-modes/` | Top 3 failure modes | None |
| GET | `/analytics/trend-data/` | Complaint trends | `days` (default: 30) |

### Export Endpoints
| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| GET | `/complaints/export/csv/` | Export complaints as CSV | Query filters |
| GET | `/complaints/export/xlsx/` | Export complaints as Excel | Query filters |

---

## Data Models & Schemas

### Backend Pydantic Schemas

#### Company Schemas
```python
class CompanyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)

class CompanyResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
```

#### Part Schemas
```python
class PartCreate(BaseModel):
    part_number: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class PartResponse(BaseModel):
    id: int
    part_number: str
    description: Optional[str]
    created_at: datetime
```

#### Complaint Schemas (Updated)
```python
class ComplaintCreate(BaseModel):
    company_id: int
    part_id: int
    issue_type: str = Field(..., pattern="^(wrong_quantity|wrong_part|damaged|other)$")
    details: str = Field(..., min_length=10)
    quantity_ordered: int = Field(..., ge=1)
    quantity_received: int = Field(..., ge=0)
    work_order_number: Optional[str] = Field(None, max_length=100)
    occurrence: Optional[str] = Field(None, max_length=100)
    part_received: Optional[str] = Field(None, max_length=100)
    human_factor: bool = False

class ComplaintResponse(BaseModel):
    id: int
    company_id: int
    part_id: int
    issue_type: str
    details: str
    quantity_ordered: int
    quantity_received: int
    status: str
    work_order_number: Optional[str]
    occurrence: Optional[str]
    part_received: Optional[str]
    human_factor: bool
    last_edit: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    company: CompanyResponse
    part: PartResponse
    attachments: List[AttachmentResponse]
```

#### Attachment Schemas
```python
class AttachmentResponse(BaseModel):
    id: int
    complaint_id: int
    filename: str
    original_filename: str
    file_path: str
    file_size: Optional[int]
    mime_type: Optional[str]
    created_at: datetime
```

### Frontend TypeScript Types

#### Core Types
```typescript
// Company interface
export interface Company {
  id: number;
  name: string;
  created_at: string;
}

// Part interface
export interface Part {
  id: number;
  part_number: string;
  description: string;
  created_at: string;
}

// Complaint interface (Updated)
export interface Complaint {
  id: number;
  company_id: number;
  part_id: number;
  issue_type: string;
  details: string;
  quantity_ordered: number;
  quantity_received: number;
  status: string;
  created_at: string;
  updated_at: string;
  work_order_number?: string;
  occurrence?: string;
  part_received?: string;
  human_factor?: boolean;
  last_edit?: string;
  company: Company;
  part: Part;
  attachments: Attachment[];
}

// Attachment interface
export interface Attachment {
  id: number;
  complaint_id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

// Form data interfaces
export interface ComplaintFormData {
  company_id: number;
  part_id: number;
  issue_type: string;
  details: string;
  quantity_ordered: number;
  quantity_received: number;
  work_order_number?: string;
  occurrence?: string;
  part_received?: string;
  human_factor?: boolean;
}

// Issue types
export type IssueType = 'wrong_quantity' | 'wrong_part' | 'damaged' | 'other';
export type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
```

---

## File Upload Architecture

### Storage Structure
```
uploads/
└── complaints/
    └── {complaint_id}/
        ├── {uuid}.pdf
        ├── {uuid}.jpg
        └── {uuid}.png
```

### File Validation Rules
- **Allowed Types**: PDF, JPG, PNG, JPEG, TXT, DOC, DOCX
- **Size Limit**: 10MB per file
- **MIME Type**: Verified using python-magic library
- **Filename**: Sanitized and UUID-based for security
- **Directory Structure**: Organized by complaint ID

### Upload Process
1. Client uploads file via multipart/form-data
2. Backend validates file type and size
3. File saved to `uploads/complaints/{complaint_id}/`
4. Database record created with metadata
5. Response includes file details for display

---

## Internationalization

### Language Support
- **Languages**: English (EN) and French (FR)
- **Implementation**: React Context API with persistent language preference
- **Storage**: localStorage for language persistence across sessions
- **Toggle**: Top-right corner navigation with EN/FR buttons

### Translation Structure
```
frontend/src/i18n/
└── translations.ts          # EN/FR translation strings
```

### Translation Keys (Updated for Enhanced Drawer)
```typescript
// Navigation
navHome: string;
navComplaints: string;
navDashboard: string;
systemTitle: string;

// Enhanced Drawer
edit: string;
save: string;
cancel: string;
close: string;
workOrderNumber: string;
occurrence: string;
quantityOrdered: string;
quantityReceived: string;
partReceived: string;
humanFactor: string;
additionalDetails: string;
orderInformation: string;
partInformation: string;
issueDetails: string;
validation: string;
fieldRequired: string;
invalidFormat: string;
undo: string;
redo: string;
unsavedChanges: string;
```

### Language Context
```
frontend/src/contexts/
└── LanguageContext.tsx     # Global language state management
```

---

## Routing & Navigation

### Routes (Updated)
- `/` - Home page (complaint form and list)
- `/dashboard` - Command center dashboard with RAR metrics and real-time sparklines
- `/complaints` - Complaints management page (renamed from `/second`)

### Navigation Components
```
frontend/src/components/
├── Navigation/              # Top navigation bar with routing
├── LanguageToggle/        # EN/FR language switch
└── Tooltip/               # Descriptive form field tooltips
```

### Navigation Features
- **Active State Indicators**: Visual feedback for current route
- **Responsive Design**: Mobile-friendly navigation
- **Keyboard Accessibility**: Tab navigation support
- **Route Updates**: `/second` → `/complaints` for complaint management

---

## HTTP Routing Policy and 307 Redirect Mitigation

- Backend routing normalization:
  - FastAPI configured with redirect_slashes=False to prevent automatic 307 redirects between "/path" and "/path/".
    - See [`python.FastAPI()`](complaint-system/backend/main.py:13)
  - Collection endpoints accept both "" and "/" to return 200 for both "/api/{resource}" and "/api/{resource}/".
    - Complaints: [`python.@router.get("", ...)`](complaint-system/backend/app/api/complaints.py:43) and [`python.@router.get("/", ...)`](complaint-system/backend/app/api/complaints.py:43)
    - Companies: [`python.@router.get("", ...)`](complaint-system/backend/app/api/companies.py:10) and [`python.@router.get("/", ...)`](complaint-system/backend/app/api/companies.py:10)
    - Parts: [`python.@router.get("", ...)`](complaint-system/backend/app/api/parts.py:10) and [`python.@router.get("/", ...)`](complaint-system/backend/app/api/parts.py:10)
- Frontend canonicalization:
  - ensureTrailingSlash helper normalizes collection endpoints to include a trailing slash, avoiding client-triggered 307s.
    - See [`typescript.export function ensureTrailingSlash()`](complaint-system/frontend/src/services/api.ts:1)
  - Call sites refactored to axios + canonical paths:
    - [`typescript.useComplaints`](complaint-system/frontend/src/hooks/useComplaints.ts:1)
    - [`typescript.ComplaintsPage`](complaint-system/frontend/src/pages/ComplaintsPage.tsx:1)
    - [`typescript.ComplaintList`](complaint-system/frontend/src/components/ComplaintList/ComplaintList.tsx:1)

Validation/testing plan:
- Backend tests assert 200 for both '/api/complaints' and '/api/complaints/' with no intermediate 307.
- Frontend/E2E tests verify no 3xx during list and export actions.

## Security Policies

### File Upload Security
- **File Type Validation**: MIME type verification using python-magic
- **File Size Limits**: 10MB per file with clear error messages
- **Filename Sanitization**: UUID-based naming to prevent directory traversal
- **Path Validation**: Absolute path checking to prevent unauthorized access

### API Security
- **Input Validation**: Pydantic schemas with strict type checking
- **SQL Injection Prevention**: SQLAlchemy ORM with parameterized queries
- **File Path Validation**: Realpath checking to prevent directory traversal
- **CORS Configuration**: Restricted to localhost development

### Authentication & Authorization

Auth is implemented with FastAPI + JWT and a separate users database.

Backend auth modules:
- [`python.app/database/users_db.py`](complaint-system/backend/app/database/users_db.py:1) — separate SQLite engine (users.db), session factory, UsersBase metadata
- [`python.app/auth/models.py`](complaint-system/backend/app/auth/models.py:1) — User and RefreshToken SQLAlchemy models
- [`python.app/auth/schemas.py`](complaint-system/backend/app/auth/schemas.py:1) — Pydantic schemas for auth payloads
- [`python.app/auth/security.py`](complaint-system/backend/app/auth/security.py:1) — bcrypt hashing, JWT encode/decode, password policy
- [`python.app/auth/dependencies.py`](complaint-system/backend/app/auth/dependencies.py:1) — get_current_user and require_admin dependencies
- [`python.app/auth/router.py`](complaint-system/backend/app/auth/router.py:1) — /auth/login and /auth/refresh endpoints
- [`python.backend/main.py`](complaint-system/backend/main.py:1) — includes auth router

Datastores:
- Domain DB: complaints.db (existing domain models)
- Auth DB: users.db (users, refresh_tokens) isolated via separate engine

JWT:
- Algorithm HS256
- Access token TTL: 30 minutes
- Refresh token TTL: 14 days
- Rotation: refresh endpoint invalidates old token and issues new pair

Password policy:
- Min length 10, must include at least one uppercase, one lowercase, and one digit
- On failed logins: increment failed_login_count and log attempt; reset on successful login

Role-based access:
- get_current_user protects authenticated endpoints
- require_admin protects admin-only routes (e.g., responsables CRUD planned below)

Environment variables:
- JWT_SECRET: required (dev/test in CI uses test-secret)
- ACCESS_TTL_MIN, REFRESH_TTL_DAYS (optional overrides)
- ENV: dev/test/prod to tune logging

Frontend auth:
- Persisted auth store using Zustand with tokens in localStorage
- Axios interceptor injects Authorization header and auto-refreshes on 401
- Protected routes wrapper to gate access, with redirect to /login

---

## Deployment Commands

### Environment Variables
Create backend `.env` (or export in shell):
```
JWT_SECRET=change-me
ACCESS_TTL_MIN=30
REFRESH_TTL_DAYS=14
ENV=dev
```

### Bootstrap users and login
- Create initial user:
  - [`python.scripts/create_user.py`](complaint-system/backend/scripts/create_user.py:1)
  - Example:
    ```
    cd complaint-system/backend
    python scripts/create_user.py --username admin --role admin
    ```
  - You will be prompted for password; policy enforced

- Run backend:
  ```
  python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
  ```

- Run frontend:
  ```
  npm run dev --prefix complaint-system/frontend
  ```

- Login via UI at /login or via API:
  ```
  curl -X POST http://127.0.0.1:8000/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"YourPass123"}'
  ```

### Backend Development
```powershell
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```powershell
cd frontend
npm run dev
```

### Production Build
```powershell
# Frontend production build
cd frontend
npm run build

# Backend production
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## Testing Infrastructure

### Backend Testing
- **Framework**: pytest with FastAPI TestClient
- **Database**: SQLite in-memory testing with factory fixtures
- **Coverage**: pytest-cov for coverage reporting (target: 90%+)
- **Test Files**: `backend/tests/test_*.py`
- **Test Categories**: Unit, Integration, API

#### Backend Test Structure
```
backend/tests/
├── conftest.py                    # Centralized test fixtures and setup
├── test_analytics.py              # Analytics endpoints testing
├── test_companies.py              # Company CRUD operations testing
├── test_complaints.py             # Complaint management testing
└── test_parts.py                  # Part CRUD operations testing
```

#### Backend Test Features
- **Test Isolation**: Each test runs with a clean database using function-scoped fixtures
- **Centralized Setup**: `conftest.py` provides shared fixtures including `client` for API testing
- **Comprehensive Coverage**: Tests cover all API endpoints, error handling, and edge cases
- **Real API Testing**: Tests use actual FastAPI TestClient against real endpoint implementations
- **Database Testing**: Tests verify database operations, relationships, and constraints

#### Backend Test Categories
- **API Endpoint Tests**: Verify HTTP responses, status codes, and data formats
- **Database Integration Tests**: Test ORM operations and data persistence
- **Validation Tests**: Test Pydantic schema validation and error handling
- **Business Logic Tests**: Test filtering, search, pagination, and sorting functionality

### Frontend Testing
- **Unit Tests**: Vitest with React Testing Library
- **E2E Tests**: Playwright for end-to-end testing
- **Coverage**: 90%+ line and branch coverage threshold
- **Test Files**: `frontend/src/**/*.test.tsx` and `frontend/e2e/*.spec.ts`
- **Mocking**: MSW (Mock Service Worker) for API mocking

#### Frontend Test Structure (Updated)
```
frontend/src/
├── components/ComplaintDetailDrawer/
│   ├── EnhancedComplaintDetailDrawer.test.tsx    # NEW: 14 comprehensive tests
│   ├── ComplaintDetailView.test.tsx              # View mode component tests
│   ├── ComplaintEditForm.test.tsx                # Edit form component tests
│   ├── InlineEditField.test.tsx                  # NEW: Inline editing tests
│   ├── useKeyboardShortcuts.test.ts              # Keyboard shortcuts hook tests
│   └── useUndoRedo.test.ts                       # Undo/redo functionality tests
├── pages/__tests__/
│   └── DashboardPage.test.tsx                    # Dashboard page tests
└── test/
    └── setup.ts                                  # Test configuration and mocks
```

### Test Commands
```powershell
# Backend tests with coverage
cd backend
pytest tests/ -v --cov=app --cov-report=html

# Frontend unit tests
cd frontend
npm run test

# Frontend E2E tests
cd frontend
npm run test:e2e
```

### Test Coverage Reports
- **Backend**: HTML coverage report generated in `backend/htmlcov/`
- **Frontend**: Coverage reports available through Vitest
- **Target Coverage**: 90%+ for both backend and frontend

---

## Enhanced Complaint Detail System

### Overview
The EnhancedComplaintDetailDrawer represents a complete redesign of the complaint detail interface, featuring a professional 2-column layout, full edit capabilities for all fields, and comprehensive validation.

### Key Features
- **2-Column Responsive Layout**: CSS Grid-based design with mobile-first approach
- **Full Edit Capabilities**: All complaint fields are now editable inline
- **Professional Styling**: Modern design with consistent visual hierarchy
- **Field Grouping**: Logical organization of related information
- **Real-time Validation**: Immediate feedback with error handling
- **Undo/Redo Support**: 5-level undo/redo stack for all changes
- **Keyboard Navigation**: Full keyboard support with shortcuts
- **Responsive Design**: Optimized for mobile, tablet, and desktop

### Component Architecture

#### EnhancedComplaintDetailDrawer.tsx
- **Purpose**: Main container component for complaint details
- **Features**:
  - 2-column responsive layout using CSS Grid
  - Field grouping with visual sections
  - Inline editing for all complaint fields
  - Real-time validation and error handling
  - Undo/redo functionality
  - Keyboard shortcuts support
  - Mobile-responsive design

#### InlineEditField.tsx
- **Purpose**: Reusable inline editing component
- **Features**:
  - Text, number, and select input support
  - Real-time validation
  - Auto-save on blur
  - Loading states
  - Error handling
  - Accessibility support

#### Field Validation Rules
```typescript
// Validation rules by field type
const validationRules = {
  work_order_number: {
    maxLength: 100,
    required: false,
    pattern: /^[A-Za-z0-9-]+$/
  },
  occurrence: {
    maxLength: 100,
    required: false
  },
  quantity_ordered: {
    required: (issueType) => issueType === 'wrong_quantity',
    min: 1,
    max: 999999
  },
  quantity_received: {
    required: (issueType) => issueType === 'wrong_quantity',
    min: 0,
    max: 999999
  },
  part_received: {
    maxLength: 100,
    required: (issueType) => issueType === 'wrong_part'
  },
  human_factor: {
    type: 'boolean',
    default: false
  },
  details: {
    maxLength: 2000,
    required: true,
    minLength: 10
  }
}
```

### Responsive Design System
- **Mobile**: Single column layout with stacked fields
- **Tablet**: 2-column layout with adjusted spacing
- **Desktop**: Full 2-column layout with optimal spacing
- **Breakpoints**:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

### Data Flow
1. **Initial Load**: Complaint data fetched via useComplaints hook
2. **Edit Mode**: InlineEditField components handle individual field editing
3. **Validation**: Real-time validation with immediate feedback
4. **Save**: Auto-save on blur with optimistic updates
5. **Sync**: Real-time sync with backend via API calls
6. **Undo/Redo**: Local state management with 5-level stack

### Integration Points
- **ComplaintList.tsx**: Updated to use EnhancedComplaintDetailDrawer
- **ComplaintsPage.tsx**: Updated to use new drawer component
- **DashboardPage.tsx**: Updated to use new drawer component
- **LanguageContext.tsx**: Fixed to use correct translations file

### Deprecated Components
- **ComplaintDetailDrawer.tsx**: Replaced by EnhancedComplaintDetailDrawer
- **Old drawer components**: Removed from codebase

---

## Code Quality & Security Analysis

### Overview
A comprehensive code review conducted on 2025-07-17 identified multiple critical security vulnerabilities, performance issues, and architectural concerns that require immediate attention. This analysis covers the entire codebase with focus on the recently implemented EnhancedComplaintDetailDrawer system.

### Critical Security Issues

#### Authentication & Authorization
- **Status**: ❌ **CRITICAL** - No authentication system implemented
- **Impact**: All API endpoints are publicly accessible
- **Risk**: Complete system compromise, data breach
- **Files**: [`main.py`](complaint-system/backend/main.py), all API endpoints
- **Recommendation**: Implement JWT-based authentication with role-based access control

#### Input Validation & Sanitization
- **Status**: ❌ **HIGH** - Missing input sanitization in frontend
- **Impact**: XSS vulnerabilities in complaint detail fields
- **Risk**: Cross-site scripting attacks, data manipulation
- **Files**: [`EnhancedComplaintDetailDrawer.tsx:189-248`](complaint-system/frontend/src/components/ComplaintDetailDrawer/EnhancedComplaintDetailDrawer.tsx:189)
- **Recommendation**: Implement DOMPurify for input sanitization

#### File Upload Security
- **Status**: ⚠️ **HIGH** - Insufficient MIME type validation
- **Impact**: Potential malicious file upload
- **Risk**: Server compromise, malware distribution
- **Files**: [`file_handler.py:30-40`](complaint-system/backend/app/utils/file_handler.py:30)
- **Recommendation**: Implement python-magic for content-based validation

#### SQL Injection Prevention
- **Status**: ⚠️ **MEDIUM** - Needs verification
- **Impact**: Potential database compromise
- **Risk**: Data breach, unauthorized access
- **Files**: [`complaints.py:62-84`](complaint-system/backend/app/api/complaints.py:62)
- **Recommendation**: Audit all query construction for injection vulnerabilities

### Performance Issues

#### Database Optimization
- **Status**: ❌ **MEDIUM** - Missing critical indexes
- **Impact**: Poor query performance with large datasets
- **Risk**: System slowdown, timeout errors
- **Files**: [`models.py`](complaint-system/backend/app/models/models.py)
- **Recommendation**: Add indexes on `work_order_number`, `occurrence`, `part_received` fields

#### Memory Management
- **Status**: ⚠️ **LOW-MEDIUM** - Potential memory leaks
- **Impact**: Performance degradation over time
- **Risk**: Application crashes, poor user experience
- **Files**: [`useUndoRedo.ts:19-32`](complaint-system/frontend/src/components/ComplaintDetailDrawer/useUndoRedo.ts:19)
- **Recommendation**: Implement proper history cleanup and size limits

#### API Rate Limiting
- **Status**: ❌ **MEDIUM** - No rate limiting implemented
- **Impact**: Potential DoS attacks
- **Risk**: Service unavailability, resource exhaustion
- **Files**: [`main.py`](complaint-system/backend/main.py)
- **Recommendation**: Implement slowapi or similar rate limiting middleware

### Type Safety & Data Integrity

#### Frontend-Backend Type Alignment
- **Status**: ❌ **MEDIUM** - Type mismatches detected
- **Impact**: Runtime errors, data inconsistency
- **Risk**: Application crashes, data corruption
- **Files**: [`types/index.ts:49-56`](complaint-system/frontend/src/types/index.ts:49), backend schemas
- **Recommendation**: Align TypeScript interfaces with backend Pydantic schemas

#### Validation Consistency
- **Status**: ❌ **MEDIUM** - Inconsistent validation rules
- **Impact**: Data integrity issues, user confusion
- **Risk**: Invalid data persistence, poor UX
- **Files**: Frontend validation vs backend schemas
- **Recommendation**: Create shared validation schema or ensure consistency

### Code Quality Issues

#### Error Handling
- **Status**: ⚠️ **LOW** - Inconsistent error handling
- **Impact**: Poor user experience during errors
- **Risk**: Application crashes, unclear error messages
- **Files**: Multiple components
- **Recommendation**: Implement React Error Boundaries and centralized error handling

#### Accessibility Compliance
- **Status**: ⚠️ **MEDIUM** - Missing accessibility features
- **Impact**: Non-compliance with accessibility standards
- **Risk**: Legal compliance issues, poor user experience
- **Files**: [`EnhancedComplaintDetailDrawer.tsx`](complaint-system/frontend/src/components/ComplaintDetailDrawer/EnhancedComplaintDetailDrawer.tsx)
- **Recommendation**: Add proper ARIA attributes and focus management

### Data Quality Issues

#### Analytics Data Accuracy
- **Status**: ❌ **HIGH** - Incorrect status values in analytics
- **Impact**: Misleading business metrics
- **Risk**: Poor business decisions based on wrong data
- **Files**: [`analytics.py:16-18`](complaint-system/backend/app/api/analytics.py:16)
- **Recommendation**: Use correct status values: open, in_progress, resolved, closed

#### Timestamp Management
- **Status**: ❌ **HIGH** - Missing last_edit updates
- **Impact**: Cannot track when complaints were modified
- **Risk**: Audit trail gaps, poor change tracking
- **Files**: [`complaints.py:162-179`](complaint-system/backend/app/api/complaints.py:162)
- **Recommendation**: Add `complaint.last_edit = datetime.utcnow()` in update endpoint

### Configuration & Deployment Issues

#### Environment Configuration
- **Status**: ❌ **MEDIUM** - Hardcoded API URLs
- **Impact**: Deployment flexibility issues
- **Risk**: Difficult environment management
- **Files**: [`EnhancedComplaintDetailDrawer.tsx:136`](complaint-system/frontend/src/components/ComplaintDetailDrawer/EnhancedComplaintDetailDrawer.tsx:136)
- **Recommendation**: Use centralized API configuration

#### CSRF Protection
- **Status**: ❌ **HIGH** - No CSRF protection
- **Impact**: Cross-site request forgery vulnerability
- **Risk**: Unauthorized actions, data manipulation
- **Files**: All API endpoints
- **Recommendation**: Implement CSRF tokens for state-changing operations

### Testing Coverage Gaps

#### Integration Testing
- **Status**: ⚠️ **MEDIUM** - Limited integration test coverage
- **Impact**: Undetected integration issues
- **Risk**: Production bugs, system failures
- **Files**: Test suites
- **Recommendation**: Expand integration test coverage for critical workflows

#### Security Testing
- **Status**: ❌ **HIGH** - No security testing implemented
- **Impact**: Undetected security vulnerabilities
- **Risk**: Security breaches, data compromise
- **Files**: Test infrastructure
- **Recommendation**: Implement security testing with tools like OWASP ZAP

### Priority Recommendations

#### Immediate (Critical - Fix within 24 hours)
1. Implement basic authentication system
2. Add input sanitization to prevent XSS
3. Fix analytics data accuracy issues
4. Add last_edit timestamp updates

#### Short-term (High - Fix within 1 week)
1. Enhance file upload security validation
2. Add database performance indexes
3. Implement CSRF protection
4. Fix type alignment issues

#### Medium-term (Medium - Fix within 1 month)
1. Add comprehensive error boundaries
2. Implement rate limiting
3. Enhance accessibility compliance
4. Add security testing framework

#### Long-term (Low - Fix within 3 months)
1. Optimize memory management
2. Enhance integration test coverage
3. Implement centralized configuration
4. Add comprehensive monitoring

### Risk Assessment Matrix

| Issue Category | Severity | Likelihood | Impact | Priority |
|---------------|----------|------------|---------|----------|
| No Authentication | Critical | High | Critical | P0 |
| XSS Vulnerabilities | High | Medium | High | P1 |
| File Upload Security | High | Low | High | P1 |
| Analytics Data Issues | High | High | Medium | P1 |
| Database Performance | Medium | High | Medium | P2 |
| Type Safety Issues | Medium | Medium | Medium | P2 |
| Accessibility Issues | Medium | Low | Medium | P3 |
| Memory Leaks | Low | Low | Medium | P3 |

### Compliance & Standards

#### Security Standards
- **OWASP Top 10**: Multiple violations identified
- **Data Protection**: No encryption or access controls
- **Authentication**: No user authentication system

#### Code Quality Standards
- **TypeScript**: Inconsistent type usage
- **React Best Practices**: Missing error boundaries
- **API Design**: RESTful principles mostly followed

#### Accessibility Standards
- **WCAG 2.1**: Multiple accessibility issues
- **Keyboard Navigation**: Partially implemented
- **Screen Reader Support**: Missing ARIA labels

---

## Continuous Integration (CI)

Workflows located in `.github/workflows`:

- Backend CI: [`yaml.ci-backend.yml`](.github/workflows/ci-backend.yml:1)
  - Python 3.11
  - pytest with coverage (coverage.xml)
  - Coverage enforcement: 85% lines and branches
  - Caches pip based on requirements.txt

- Frontend CI: [`yaml.ci-frontend.yml`](.github/workflows/ci-frontend.yml:1)
  - Node 20
  - Vitest with coverage (coverage/coverage-summary.json)
  - Coverage enforcement: 80% lines and branches
  - Uses npm ci with cache

- E2E CI (Playwright): [`yaml.ci-e2e.yml`](.github/workflows/ci-e2e.yml:1)
  - Installs frontend/backend deps
  - Launches backend (uvicorn) and frontend (vite dev) on the runner
  - Waits for ports 8000 and 5173
  - Runs Playwright tests and uploads report artifact

- Performance (manual, Locust): [`yaml.ci-perf.yml`](.github/workflows/ci-perf.yml:1) [if present]
  - workflow_dispatch with inputs (users, spawn_rate, run_time)
  - Writes a minimal locustfile dynamically and runs headless
  - Uploads CSV artifacts (stats/failures/distribution)

Badge placement recommendation (README):
```
![Backend CI](https://github.com/OWNER/REPO/actions/workflows/ci-backend.yml/badge.svg)
![Frontend CI](https://github.com/OWNER/REPO/actions/workflows/ci-frontend.yml/badge.svg)
![E2E CI](https://github.com/OWNER/REPO/actions/workflows/ci-e2e.yml/badge.svg)
![Perf (Locust)](https://github.com/OWNER/REPO/actions/workflows/ci-perf.yml/badge.svg)
```

Coverage adjustment:
- Backend: edit “Enforce coverage threshold” Python step
- Frontend: edit Node “Enforce coverage thresholds” step

Secret considerations:
- None required for dev; JWT_SECRET is set inline in workflows for test runs
- For production environments, use GitHub Secrets and environment protection rules

## Monitoring & Logging

### Backend Logging
- **FastAPI Logging**: Built-in request/response logging
- **File Upload Progress**: Upload progress tracking
- **Error Handling**: Comprehensive error responses with stack traces
- **Database Queries**: SQLAlchemy query logging in debug mode

### Frontend Monitoring
- **React DevTools**: Component debugging and state inspection
- **Network Tab**: API request monitoring and response inspection
- **Console Errors**: Error tracking and debugging with source maps
- **Performance**: React Profiler for performance monitoring

---

## Recent Changes

### Code Review & Security Analysis (2025-07-17)
- **COMPLETED**: Comprehensive security vulnerability assessment
- **IDENTIFIED**: 15 critical security and performance issues
- **DOCUMENTED**: 25 detailed bug entries in BUGS.md with reproduction steps
- **ANALYZED**: Full codebase review covering backend, frontend, and testing infrastructure
- **PRIORITIZED**: Risk assessment matrix with P0-P3 priority classifications
- **UPDATED**: Architecture documentation with current system state and security analysis

### Security Findings
- **CRITICAL**: No authentication system - all endpoints publicly accessible
- **HIGH**: XSS vulnerabilities in complaint detail fields
- **HIGH**: Insufficient file upload validation using only MIME headers
- **HIGH**: Incorrect analytics data with hardcoded status values
- **MEDIUM**: Missing database indexes causing performance issues
- **MEDIUM**: Type mismatches between frontend and backend schemas

### Performance Issues
- **Database**: Missing indexes on frequently queried fields
- **Memory**: Potential memory leaks in undo/redo functionality
- **API**: No rate limiting protection against DoS attacks
- **Frontend**: Inconsistent error handling across components

### Code Quality Issues
- **Type Safety**: Misaligned TypeScript interfaces with backend schemas
- **Validation**: Inconsistent validation rules between frontend and backend
- **Accessibility**: Missing ARIA labels and keyboard navigation support
- **Configuration**: Hardcoded API URLs preventing flexible deployment

### Enhanced Complaint Detail System (2025-07-16)
- **NEW**: EnhancedComplaintDetailDrawer component with 2-column layout
- **NEW**: InlineEditField component for seamless field editing
- **NEW**: Comprehensive field validation system
- **NEW**: Undo/redo functionality with 5-level stack
- **NEW**: Keyboard navigation support
- **NEW**: Responsive design for all screen sizes
- **NEW**: 14 comprehensive test cases for EnhancedComplaintDetailDrawer
- **NEW**: Professional styling with modern design language

### Database Updates
- **ADDED**: last_edit column to complaints table
- **UPDATED**: Enhanced validation for new fields

### API Updates
- **ENHANCED**: PUT /complaints/{id}/ endpoint to handle all new fields
- **ADDED**: Validation for conditional required fields

### Frontend Updates
- **REPLACED**: All instances of old ComplaintDetailDrawer with EnhancedComplaintDetailDrawer
- **FIXED**: LanguageContext to use correct translations.ts file
- **UPDATED**: translations.ts with new UI strings
- **ENHANCED**: Field validation with conditional requirements

### Testing Updates
- **ADDED**: 14 new test cases for EnhancedComplaintDetailDrawer
- **ACHIEVED**: 100% test pass rate (42/42 tests passing)
- **ENHANCED**: Test coverage for new validation rules

### Bug Fixes
- **FIXED**: Last edit timestamp not updating when fields are edited
- **FIXED**: French translation missing for new UI elements
- **FIXED**: Quantity fields being required for all issue types instead of conditional

---

## Troubleshooting

### Common Issues
1. **White Screen on Load**: Check LanguageProvider context and router configuration
2. **API Connection Issues**: Verify backend is running on port 8000
3. **File Upload Failures**: Check file size and type restrictions
4. **Database Connection**: Ensure SQLite file permissions and path
5. **Route Not Found**: Verify `/complaints` route is properly configured
6. **Validation Errors**: Check field-specific validation rules in EnhancedComplaintDetailDrawer

### Debug Commands
```powershell
# Check backend health
curl http://localhost:8000/api/complaints/

# Check frontend routing
curl http://localhost:3000/complaints

# Check file upload
curl -X POST http://localhost:8000/api/complaints/1/attachments/ -F "file=@test.pdf"

# Check database
sqlite3 backend/database/complaints.db ".tables"

# Check enhanced drawer
curl -X PUT http://localhost:8000/api/complaints/1/ -H "Content-Type: application/json" -d '{"work_order_number":"WO-2024-001"}'
```

---

## Glossary

- **MCP**: Model Context Protocol
- **ORM**: Object-Relational Mapping
- **SPA**: Single Page Application
- **API**: Application Programming Interface
- **CRUD**: Create, Read, Update, Delete
- **MIME**: Multipurpose Internet Mail Extensions
- **RAR**: Return, Authorization, Rejection (metrics)
- **UUID**: Universally Unique Identifier
- **CORS**: Cross-Origin Resource Sharing
- **JWT**: JSON Web Token
- **CSS Grid**: Modern layout system for responsive design
- **Inline Editing**: Direct field editing without separate forms