# Complaint Management System - Complete Architecture Guide

**Note:** SPA root component fails to mount due to an unhandled runtime exception thrown inside the router's lazy-loaded chunk.

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
16. [Troubleshooting](#troubleshooting)
17. [Glossary](#glossary)

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
│   └── init_db.py                    # Database initialization script
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ComplaintForm/        # Complete complaint submission form
│   │   │   ├── ComplaintList/        # Real-time complaint display
│   │   │   ├── CompanySearch/        # Autocomplete company search
│   │   │   ├── PartAutocomplete/     # Autocomplete part search
│   │   │   ├── FileUpload/           # Drag-and-drop file upload
│   │   │   ├── Navigation/           # Multi-page navigation
│   │   │   ├── LanguageToggle/       # EN/FR language switch
│   │   │   └── Tooltip/              # Descriptive form field tooltips
│   │   ├── contexts/
│   │   │   └── LanguageContext.tsx   # Global language state
│   │   ├── hooks/
│   │   │   ├── useCompanies.ts       # Company data fetching
│   │   │   └── useParts.ts           # Part data fetching
│   │   ├── i18n/
│   │   │   └── translations.ts       # English/French translations
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx     # Command center with RAR metrics
│   │   │   ├── HomePage.tsx          # Main complaint form and list
│   │   │   └── SecondPage.tsx        # Placeholder for future features
│   │   ├── services/
│   │   │   └── api.ts                # API client with consistent trailing slashes
│   │   ├── test/
│   │   │   └── setup.ts              # Test configuration and mocks
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript type definitions
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
└── BUGS.md                          # Bug tracking documentation
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

### Step 1: Create Database Models
Create `backend/app/models/models.py`:
```python
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    complaints = relationship("Complaint", back_populates="company")

class Part(Base):
    __tablename__ = "parts"
    id = Column(Integer, primary_key=True, index=True)
    part_number = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    complaints = relationship("Complaint", back_populates="part")

class Complaint(Base):
    __tablename__ = "complaints"
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    part_id = Column(Integer, ForeignKey("parts.id"), nullable=False)
    issue_type = Column(String(100), nullable=False)
    details = Column(Text, nullable=False)
    quantity_ordered = Column(Integer, nullable=False)
    quantity_received = Column(Integer, nullable=False)
    status = Column(String(20), default="open")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    company = relationship("Company", back_populates="complaints")
    part = relationship("Part", back_populates="complaints")
    attachments = relationship("Attachment", back_populates="complaint", cascade="all, delete-orphan")

class Attachment(Base):
    __tablename__ = "attachments"
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    mime_type = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    complaint = relationship("Complaint", back_populates="attachments")
```

### Step 2: Initialize Database
```powershell
python init_db.py
```

---

## API Endpoints

### Companies
- `GET /api/companies/?search={query}&limit=10` - Search companies with autocomplete
- `POST /api/companies/` - Create new company

### Parts
- `GET /api/parts/?search={query}&limit=10` - Search parts with autocomplete
- `POST /api/parts/` - Create new part

### Complaints
- `GET /api/complaints/` - List all complaints with company and part details
- `POST /api/complaints/` - Create new complaint with validation
- `POST /api/complaints/{id}/attachments/` - Upload file attachment to complaint
- `DELETE /api/complaints/{id}/attachments/{attachment_id}/` - Remove attachment

### Analytics
- `GET /api/analytics/rar-metrics` - Get Return, Authorization, and Rejection rates
- `GET /api/analytics/failure-modes` - Get top 3 failure modes by frequency
- `GET /api/analytics/trend-data` - Get complaint trends for sparkline charts

---

## Data Models & Schemas

### Backend Pydantic Schemas
```python
# Complaint Creation Schema
class ComplaintCreate(BaseModel):
    company_id: int
    part_id: int
    issue_type: str
    details: str
    quantity_ordered: int = Field(..., ge=1)
    quantity_received: int = Field(..., ge=0)

# Complaint Response Schema
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

### Frontend TypeScript Types
```typescript
// Complaint interface matching backend schema
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

// Form data interface
export interface ComplaintFormData {
  company_id: number;
  part_id: number;
  issue_type: string;
  details: string;
  quantity_ordered: number;
  quantity_received: number;
}
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

### File Validation
- **Allowed Types**: PDF, JPG, PNG, JPEG, TXT, DOC, DOCX
- **Size Limit**: 10MB per file
- **MIME Type**: Verified using python-magic library
- **Filename**: Sanitized and UUID-based for security

### Upload Process
1. Client uploads file via multipart/form-data
2. Backend validates file type and size
3. File saved

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

### Language Context
```
frontend/src/contexts/
└── LanguageContext.tsx     # Global language state management
```

---

## Routing & Navigation

### Routes
- `/` - Home page (complaint form and list)
- `/dashboard` - Command center dashboard with RAR metrics and real-time sparklines
- `/second` - Second page (placeholder for future features)

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

---

## Security Policies

### File Upload Security
- **File Type Validation**: MIME type verification
- **File Size Limits**: 10MB per file
- **Filename Sanitization**: UUID-based naming
- **Directory Traversal Prevention**: Path validation

### API Security
- **Input Validation**: Pydantic schemas
- **SQL Injection Prevention**: SQLAlchemy ORM
- **File Path Validation**: Absolute path checking

---

## Deployment Commands

### Backend
```powershell
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```powershell
cd frontend
npm run dev
```

---

## Testing Infrastructure

### Backend Testing
- **Framework**: pytest with FastAPI TestClient
- **Database**: SQLite in-memory testing
- **Coverage**: pytest-cov for coverage reporting
- **Test Files**: `backend/tests/test_*.py`

### Frontend Testing
- **Unit Tests**: Vitest with React Testing Library
- **E2E Tests**: Playwright for end-to-end testing
- **Coverage**: 90%+ line and branch coverage threshold
- **Test Files**: `frontend/src/**/*.test.tsx` and `frontend/e2e/*.spec.ts`

### Test Commands
```powershell
# Backend tests
cd backend
pytest tests/ -v --cov=app --cov-report=html

# Frontend unit tests
cd frontend
npm run test

# Frontend E2E tests
cd frontend
npm run test:e2e
```

## Monitoring & Logging

### Backend Logging
- **FastAPI Logging**: Built-in request/response logging
- **File Upload Progress**: Upload progress tracking
- **Error Handling**: Comprehensive error responses

### Frontend Monitoring
- **React DevTools**: Component debugging
- **Network Tab**: API request monitoring
- **Console Errors**: Error tracking and debugging

---

## Troubleshooting

### Common Issues
1. **White Screen on Load**: Check LanguageProvider context
2. **API Connection Issues**: Verify backend is running on port 8000
3. **File Upload Failures**: Check file size and type restrictions
4. **Database Connection**: Ensure SQLite file permissions

### Debug Commands
```powershell
# Check backend
curl http://localhost:8000/api/complaints/

# Check frontend
curl http://localhost:3000
```

---

## Glossary

- **MCP**: Model Context Protocol
- **ORM**: Object-Relational Mapping
- **SPA**: Single Page Application
- **API**: Application Programming Interface
- **CRUD**: Create, Read, Update, Delete
- **MIME**: Multipurpose Internet Mail Extensions