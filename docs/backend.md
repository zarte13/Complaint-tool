## Backend

### Tech Stack
- FastAPI (ASGI)
- SQLAlchemy ORM (SQLite)
- Pydantic v2 schemas

### Database Configuration
- Canonical DB path: `complaint-system/backend/database/complaints.db`
- Users DB: `complaint-system/backend/database/users.db`
- Config: `app/database/database.py`

### Data Model (SQL summary)
```
companies(id PK, name UNIQUE NOT NULL, company_short, created_at)
parts(id PK, part_number UNIQUE NOT NULL, description, created_at)
complaints(
  id PK,
  company_id FK->companies,
  part_id FK->parts,
  issue_type NOT NULL,
  issue_category, issue_subtypes JSON, packaging_received JSON, packaging_expected JSON,
  details NOT NULL,
  date_received NOT NULL,
  complaint_kind NOT NULL,
  ncr_number,
  quantity_ordered, quantity_received,
  status DEFAULT 'open',
  work_order_number NOT NULL,
  occurrence, part_received,
  human_factor DEFAULT 0,
  has_attachments DEFAULT 0,
  last_edit, created_at DEFAULT now, updated_at DEFAULT now
)
complaint_attachments(
  id PK,
  complaint_id FK->complaints ON DELETE CASCADE,
  filename, original_filename, file_path, file_size, mime_type, created_at DEFAULT now
)
```

Indexes:
- `idx_complaints_company_id`, `idx_complaints_part_id`, `idx_complaints_status`, `idx_complaints_created_at`
- `idx_attachments_complaint_id`

### API Endpoints (high-level)
- Auth: `/auth/login`, `/auth/refresh`
- Companies: `/api/companies` (GET search by `name`/`company_short`, POST create), `/api/companies/all`
- Parts: `/api/parts` (search/create)
- Complaints: `/api/complaints` (CRUD, attachments subroutes)
- Analytics: `/api/analytics/*`
- Responsible Persons: `/api/responsible-persons` (directory)

### Maintenance Scripts
- `scripts/clear_uploads.py` — clear files and/or `complaint_attachments` and reset `has_attachments`
- `scripts/import_companies.py` — CSV import with encoding/delimiter/header options
- `scripts/import_parts.py` — CSV import with encoding/delimiter/header options


