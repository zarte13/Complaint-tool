# Complaint Management System - Complete Architecture Guide

**Last Updated**: 2025-07-15  
**Commit Hash**: Latest changes since last commit
**Version**: 2.0.0

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
18. [Troubleshooting](#troubleshooting)
19. [Glossary](#glossary)

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

##### 3. Complaints Table
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

#### Complaint Schemas
```python
class ComplaintCreate(BaseModel):
    company_id: int
    part_id: int
    issue_type: str = Field(..., pattern="^(wrong_quantity|wrong_part|damaged|other)$")
    details: str = Field(..., min_length=10)
    quantity_ordered: int = Field(..., ge=1)
    quantity_received: int = Field(..., ge=0)

class ComplaintResponse(BaseModel):
    id: int
    company_id: int
    part_id: int
    issue_type: str
    details: str
    quantity_ordered: int
    quantity_received: int
    status: str
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

// Complaint interface
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

### Translation Keys (Updated)
```typescript
// Navigation
navHome: string;
navComplaints: string;      // Updated from navSecond
navDashboard: string;
systemTitle: string;

// Page-specific translations
complaintManagement: string;
manageAndTrackAllComplaints: string;
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
- **Current**: No authentication (development mode)
- **Future**: JWT-based authentication planned

---

## Deployment Commands

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

#### Frontend Test Structure
```
frontend/src/
├── components/ComplaintDetailDrawer/
│   ├── ComplaintDetailDrawer.test.tsx    # Main drawer component tests
│   ├── ComplaintDetailView.test.tsx      # View mode component tests
│   ├── ComplaintEditForm.test.tsx        # Edit form component tests
│   ├── useKeyboardShortcuts.test.ts      # Keyboard shortcuts hook tests
│   └── useUndoRedo.test.ts               # Undo/redo functionality tests
├── pages/__tests__/
│   └── DashboardPage.test.tsx            # Dashboard page tests
└── test/
    └── setup.ts                          # Test configuration and mocks
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

## Recent Changes (Post-Last Commit)

### Database Layer Changes
- **Table Structure**: No changes to core table structure
- **Indexes**: Added performance indexes on foreign keys and timestamps
- **Constraints**: Maintained referential integrity with CASCADE delete

### Backend API Changes
- **Endpoints**: Added export endpoints for CSV/Excel generation
- **Validation**: Enhanced Pydantic schemas with stricter validation
- **File Handling**: Improved file upload with better error messages
- **Analytics**: Added comprehensive analytics endpoints

### Frontend Structural Changes
- **Page Renaming**: `SecondPage.tsx` → `ComplaintsPage.tsx`
- **Route Updates**: `/second` → `/complaints` for complaint management
- **Navigation Updates**: Updated navigation links and translations
- **Component Updates**: Enhanced component structure with better separation

### Component Changes
- **New Components**:
  - `AdvancedTable/ExportButton.tsx` - Export functionality
  - `ComplaintListView.tsx` - Dedicated complaint list view
- **Updated Components**:
  - `Navigation.tsx` - Updated routing and translations
  - `translations.ts` - Added new translation keys

### Routing Changes
- **Route**: `/second` → `/complaints`
- **Component**: `SecondPage` → `ComplaintsPage`
- **Navigation Label**: "Second" → "Complaints"
- **Translation Key**: `navSecond` → `navComplaints`

### File Structure Changes
- **Deleted**: `frontend/src/pages/SecondPage.tsx`
- **Added**: `frontend/src/pages/ComplaintsPage.tsx`
- **Updated**: `frontend/src/App.tsx` (route configuration)
- **Updated**: `frontend/src/components/Navigation/Navigation.tsx`
- **Updated**: `frontend/src/i18n/translations.ts`

### Build & Deployment Updates
- **Build Scripts**: No changes to build scripts
- **Environment Variables**: No new environment variables
- **Dependencies**: No new dependencies added

---

## Troubleshooting

### Common Issues
1. **White Screen on Load**: Check LanguageProvider context and router configuration
2. **API Connection Issues**: Verify backend is running on port 8000
3. **File Upload Failures**: Check file size and type restrictions
4. **Database Connection**: Ensure SQLite file permissions and path
5. **Route Not Found**: Verify `/complaints` route is properly configured

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