## Settings Panel Implementation Plan (Revised for Current App)

### Goals
- Provide an Admin-only Settings area to configure key aspects of the app without code changes.
- Support high-impact customization:
  - Complaint taxonomy management (categories and sub-types) with i18n labels.
  - Dashboard configuration using existing React chart cards (EvilCharts + standard charts) with toggles, ordering, time windows, and layout templates.
  - Company and Part master data management, with guardrails (CRUD with safety prompts).
- Persist changes centrally; apply globally and immediately (or via explicit publish) with audit history.

### Non-Goals (initial phase)
- Per-user personal preferences (dark mode, table density, etc.).
- Full-featured layout designer beyond the defined dashboard templates (can be a later phase).

### User Roles & Access
- Admin only: Access to Settings (route-gated and server-enforced).
- All other users: No access.

### Information Architecture (Settings Sections)
1) General (optional later)
   - App title/logo, localization defaults, pagination defaults
2) Complaint Taxonomy
   - Manage Issue Categories (dimensional, visual, packaging, other)
   - Manage Sub-types (add/remove/rename, sort order)
   - i18n labels for each category/sub-type (EN/FR)
   - Toggle active/inactive (inactive still recognized in legacy data, hidden from new entries)
3) Dashboard
   - Choose template (e.g., Standard, KPI-Heavy, Trends-First), implemented as saved layouts rendered by `DashboardPage.tsx`
   - Enable/disable individual cards (KPI counters, 12-week trend, failure modes/pies, stacked bars)
   - Default time window (e.g., last 12 weeks, 30/60/90 days)
   - Ordering and sizing presets (using the existing CSS grid/Tailwind layout)
4) Master Data (Admin Utilities)
   - Companies (list/create/rename/deactivate)
   - Parts (list/create/rename/deactivate)
   - CSV import/export shortcuts (existing APIs reused)
5) Publish & Audit
   - Pending changes vs Published state (optional later)
   - Change history with who/when

### Data Model & Persistence
- app_settings (KV store)
  - key: TEXT (PK)
  - value_json: TEXT (JSON)
  - updated_at: DATETIME
  - updated_by: TEXT (username)

- taxonomy_categories
  - id: INTEGER (PK)
  - key: TEXT (unique, e.g., "visual", "packaging")
  - label_en: TEXT
  - label_fr: TEXT
  - active: BOOLEAN
  - sort_order: INTEGER

- taxonomy_subtypes
  - id: INTEGER (PK)
  - category_key: TEXT (FK -> taxonomy_categories.key)
  - key: TEXT (unique within category, e.g., "wrong_box")
  - label_en: TEXT
  - label_fr: TEXT
  - active: BOOLEAN
  - sort_order: INTEGER

- dashboard_configs
  - id: INTEGER (PK)
  - name: TEXT (e.g., "Standard")
  - layout_json: TEXT (cards enabled, order, params)
  - is_default: BOOLEAN
  - updated_at, updated_by

Notes:
- Keep KV table for small app-wide settings; use dedicated tables for taxonomy for queryability and referential constraints.
- Continue to persist master data (companies, parts) with existing tables/APIs.
 - This aligns with `ARCHITECTURE.md`: FastAPI + SQLAlchemy backend, React + Zustand frontend.

### Backend Changes (FastAPI)
1) New endpoints (Admin-only)
   - GET/PUT /api/settings/app (KV by keys: dashboard_default, etc.)
   - Taxonomy
     - GET /api/settings/taxonomy/categories
     - POST/PUT/DELETE /api/settings/taxonomy/categories/{key}
     - GET /api/settings/taxonomy/subtypes?category_key=...
     - POST/PUT/DELETE /api/settings/taxonomy/subtypes/{id}
   - Dashboard configs
     - GET /api/settings/dashboard-configs
     - POST/PUT/DELETE /api/settings/dashboard-configs/{id}
     - POST /api/settings/dashboard-configs/{id}/make-default
   - All above endpoints protected via `require_admin`

2) Validation integration
   - Replace hard-coded subtype validation for visual/packaging in `schemas.py` with dynamic allowed sets loaded from DB. Keep today’s defaults when settings are empty to remain backward compatible.
   - Cache allowed sets for 60s (in-memory) to minimize DB hits; bust cache on taxonomy updates.
   - While saving a complaint:
     - If category is packaging, ensure subtypes belong to the configured set; validate packaging_received/expected for applicable subtypes as we do today.

3) Migration scripts
   - Create new tables: `app_settings`, `taxonomy_categories`, `taxonomy_subtypes`, `dashboard_configs`
   - Seed defaults from current constants (visual: [scratch, nicks, rust]; packaging: [wrong_box, wrong_bag, wrong_paper, wrong_part, wrong_quantity, wrong_tags]).

4) Audit
   - All settings/taxonomy updates write updated_by and updated_at.
   - Optionally maintain a simple change log table `settings_audit` for a history view (later phase).

### Frontend Changes (React + Zustand)
1) Route & Access
   - New route `/settings` visible only if `authStore.isAdmin()`; hide from `Navigation` for non-admins.
   - 3 tabs: Taxonomy, Dashboard, Master Data

2) Taxonomy UI
   - Categories table (key, EN, FR, active, sort, actions)
   - Subtypes table filtered by selected category (key, EN, FR, active, sort)
   - Create/Edit dialogs with validation and i18n fields
   - Save -> PATCH/POST -> refresh; show toasts
   - Visual preview chip list showing how labels appear in UI

3) Dashboard UI
   - Template selector (radio or select)
   - Toggles for cards (KPI counts, 12‑week trends, failure modes pie, stacked glowing bar)
   - Time window selector (last N weeks/days)
   - Ordering (drag handle up/down) and sizes (sm/md/lg presets)
   - Live preview area (reuse existing React cards in a preview container)
   - Save as new config; set as default

4) Master Data UI
   - Companies: list/create/rename/deactivate
   - Parts: list/create/rename/deactivate
   - Inline search, pagination
   - Reuse existing APIs (`companies`, `parts`), presented in Settings context

5) i18n
   - All settings labels, dialogs, and validations localized
   - Subtype/category labels editable for EN/FR

6) State & Caching
   - `useSettings` hook: fetch KV and taxonomy; provide save/update; optimistic UI where safe
   - Dashboard config applied to `DashboardPage.tsx` on load; fallback to default when not found

### Dashboard Customization: Detailed Design (EvilCharts + regular charts)

Current components (in `src/components/EvilCharts/`):
- `EvilBarChartCard.tsx`, `EvilLineChartCard.tsx`, `EvilPieChartCard.tsx`, `EvilStackedGlowingBarCard.tsx`
- Plus simple KPI cards already in `DashboardPage.tsx` (open/in_progress/closed counts) and failure modes breakdown

Card registry
- Define a client-side registry mapping a card `type` to a React component and default props:
  - `evil_line_trend` -> EvilLineChartCard (props: endpoint, xKey, yKey, palette, timeWindow)
  - `evil_bar_breakdown` -> EvilBarChartCard (props: endpoint, groupBy)
  - `evil_pie_failures` -> EvilPieChartCard (props: endpoint, sliceBy)
  - `evil_stacked_glow` -> EvilStackedGlowingBarCard (props: endpoint, groupBy, stackBy)
  - `kpi_counts` -> KPI row (props: endpoint(s), keys: open, in_progress, closed)

Config schema (stored in `dashboard_configs.layout_json`)
```
{
  "template": "standard|kpi_heavy|trends_first",
  "timeWindow": { "kind": "weeks", "value": 12 },
  "cards": [
    { "id": "kpis", "type": "kpi_counts", "enabled": true, "size": "lg", "order": 1 },
    { "id": "trend12w", "type": "evil_line_trend", "enabled": true, "size": "lg", "order": 2,
      "props": { "endpoint": "/api/analytics/weekly-type-trends/", "xKey": "week", "yKeys": ["total"], "palette": "blue" } },
    { "id": "fail_pie", "type": "evil_pie_failures", "enabled": true, "size": "md", "order": 3,
      "props": { "endpoint": "/api/analytics/failure-modes/", "sliceBy": "issue_category" } },
    { "id": "stacked", "type": "evil_stacked_glow", "enabled": false, "size": "lg", "order": 4,
      "props": { "endpoint": "/api/analytics/weekly-type-trends/", "groupBy": "issue_category", "stackBy": "status" } }
  ]
}
```

Rendering flow in `DashboardPage.tsx`
- Fetch default config via `/api/settings/dashboard-configs?default=true` (or KV key) on mount.
- Compute effective `timeWindow` for analytics calls; pass as query (e.g., `?weeks=12`).
- Sort `cards` by `order`, filter by `enabled`, map to components via the registry.
- Layout: Tailwind grid with responsive columns; `size` controls `col-span`.

Admin UI (Settings > Dashboard)
- Editor lists available cards from registry with toggles.
- Drag to order; select size; edit simple props (palette, grouping, endpoint if needed).
- Global time window selector; preview re-renders.
- Save button persists JSON to `/api/settings/dashboard-configs` and can mark as default.

Backend support
- Use existing analytics endpoints; extend to accept `?weeks=N` or `?days=N` if not already present.
- Add new endpoint to return failure modes counts if missing (e.g., `/api/analytics/failure-modes/`).

Performance & UX
- Debounce preview fetches; cache analytics per (endpoint, params) during editing.
- Defensive fallback: if a card fails to load, show a small error state but keep other cards.

### Security & Constraints
- Server-side admin enforcement on every settings endpoint.
- Validate keys to avoid collisions or invalid identifiers.
- Prevent deletion of taxonomy keys in use (soft-disable = inactive). Offer migration helper (later phase).

### Rollout Plan (Phased)
Phase 1 (MVP)
- DB migrations + default seed
- Backend endpoints for taxonomy + KV settings (read/write)
- Frontend `/settings` with Taxonomy tab (EN/FR labels, activate/deactivate)
- Dashboard: enable/disable cards + default timeframe (no complex layout designer yet). Render via registry and Tailwind grid.
- Apply dynamic taxonomy validation in complaint creation/update

Phase 2
- Dashboard templates with layout presets + live preview
- Master Data admin utilities (Companies/Parts) integrated in Settings
- Basic audit log of settings changes

Phase 3
- Versioned/publish workflow (draft vs published)
- Fine-grained permissions (Settings sub-sections)
- Export/import settings JSON

### Testing Strategy
- Backend
  - Unit tests for taxonomy CRUD, validation against dynamic sets, and settings cache
  - Integration tests for complaint submission using new taxonomy entries
- Frontend
  - Component tests for forms and lists (taxonomy tables)
  - E2E for a full admin flow: add subtype -> create complaint using it -> dashboard shows it
  - Dashboard editor: toggle a card, change time window, reorder; preview updates and save persists

### Acceptance Criteria (MVP)
- Admin can add a new visual subtype with EN/FR labels and immediately use it in the complaint form
- Admin can deactivate an existing packaging subtype; it disappears from new complaints while existing records remain valid
- Admin can toggle dashboard cards/time window; dashboard reflects changes after refresh
- All settings changes are admin-only and logged (updated_by/updated_at stored)

### Open Questions
- Should inactive subtypes be allowed in updates for legacy complaints? (Proposed: yes, but not suggested in UI.)
- Do we need per-tenant settings? (Out of scope currently.)
- Should dashboard config be per-role or global only? (Global for now.)


