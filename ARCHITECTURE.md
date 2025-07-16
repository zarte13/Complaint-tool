# Complaint Management System - Complete Architecture Guide

**Last Updated**: 2025-07-16  
**Commit Hash**: EnhancedComplaintDetailDrawer implementation
**Version**: 2.1.0

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
19. [Troubleshooting](#troubleshooting)
20. [Glossary](#glossary)

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

## Recent Changes (2025-07-16)

### Enhanced Complaint Detail System
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