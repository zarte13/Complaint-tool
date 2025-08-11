# DB Implementation Plan: Redirect Loops, Schema Drift, Idempotent Migrations

This document operationalizes the orchestration plan into executable steps, optimized for speed with safeguards to maintain quality.

## 1) Summary of Issues and Objectives

- Redirect loops (307): Caused by trailing slash mismatch between FastAPI collection routes (defined at "/") and frontend slashless requests. Objective: eliminate loops by backend dual-acceptance of "" and "/" and frontend normalization to a canonical trailing slash.
- Schema drift: Live SQLite (complaint-system/backend/database/complaints.db) includes companies, complaints, parts, but may lack constraints and tables (status enum constraint, attachments, follow-up actions, search indexes). Objective: codify target schema in complaint-system/backend/schema_expected.json and converge with idempotent, rollbackable migrations.
- Migration reliability: Objective: migrations are idempotent, transactional, fast, and verified by schema_checker.py in CI.

## 2) Prioritized Task List

| # | Task | Owner | Inputs | Deps | Effort | Impact |
|---|------|-------|--------|------|--------|--------|
| 1 | Define Target Schema | Backend | schema_actual.json, ARCHITECTURE.md, migrations | - | S | High |
| 2 | Stabilize Backend Routing | Backend | app/api routers, FastAPI config | - | S | High |
| 3 | Standardize Frontend Requests | Frontend | services/api.ts, hooks/pages | 2 | S | High |
| 4 | Update Checker (use expected) | Backend/DevOps | schema_checker.py, schema_expected.json | 1 | S | High |
| 5 | Idempotent Migrations | Backend | migrations, expected schema | 1,4 | M | High |
| 6 | Data Normalization/Backfill | Backend | scripts for status mapping, FKs | 5 | M | Medium |
| 7 | QA Tests (Unit/Integration/E2E) | QA | routes, migrations, e2e flows | 2–6 | M | High |
| 8 | CI/CD Enhancements | DevOps | checker, tests, audits | 4–7 | S | Medium |
| 9 | Operational Playbook | DevOps | backup, rollback | 5 | S | Medium |

## 3) Fast-Track Timeline

Critical Path: Define expected → Checker vs expected → Migrations → Normalize/backfill → QA → Release.

Parallelization:
- Day 1: Routing fixes (Backend) + Frontend URL normalization + Define expected schema.
- Day 2–3: Migrations in parallel with CI skeleton + test authoring.

Milestones:
- M1 (D1): schema_expected.json drafted; routing stabilized; FE normalized.
- M2 (D2): checker wired with expected; initial migrations authored.
- M3 (D3): migrations validated on test DBs; backfill ready.
- M4 (D4): CI green across unit/integration/e2e; perf/security pass.
- M5 (D5): Deploy, migrate, verify with checker; release.

Gantt-lite:
- Day 1: Tasks 1–3, 8(skeleton)
- Day 2: Task 4, start Task 5, Task 7(specs)
- Day 3: Finish Task 5, Task 6, Task 8(integration)
- Day 4: Task 7(execution) + fixes
- Day 5: Task 9 + release

## 4) Risks, Mitigations, Rollback

- Data violating new constraints
  - Mitigation: Pre-migration audit; transform (e.g., map closed→resolved); run on DB copy.
  - Rollback: Backup complaint-system/backend/database/complaints.db; restore on failure.

- Legacy clients using slashless paths
  - Mitigation: Dual-accept routes; frontend normalization; monitor redirects.
  - Rollback: Re-enable redirect_slashes or revert aliases.

- Performance regression from indexes/constraints
  - Mitigation: Add essential, simple indexes; measure before/after.
  - Rollback: Drop introduced indexes; revert constraint migration.

- CI vs local drift
  - Mitigation: Pin tool versions; include schema_expected.json; reuse checker and migration steps in CI.

## 5) Quality Gates and Test Strategy

Definition of Done:
- Routing: Both "/api/complaints" and "/api/complaints/" return 200; no 307 in tests.
- Schema: schema_checker.py shows zero diffs vs schema_expected.json on fresh and migrated DB.
- Migrations: Idempotent, transactional, rollback steps documented.
- Frontend: All collection calls use canonical trailing slash; E2E shows no 3xx in navigations.
- Perf/Security: No latency regression; npm/pip audits pass.

Tests:
- Unit: Route alias tests; checker diff logic; migration guard utilities.
- Integration: Apply migrations to ephemeral DB; verify constraints and indexes; CRUD basic flows.
- E2E: Playwright flows including listing/search/create/update; assert 2xx and no redirects.
- Perf: Timings on list endpoints with filters; compare baseline.
- Security: CORS unchanged; dependency audits.

## 6) Communication Plan

- Daily 15-min standups (Backend, Frontend, DevOps, QA).
- Updates at milestones M1–M5 with checker results, test reports, migration logs.
- Decision points: Approve schema_expected.json; confirm canonical route style; Go/No-Go for production.

Stakeholders: Eng Lead, Product Owner, Ops, QA Lead.

## 7) Resources and Tooling

- DB: complaint-system/backend/database/complaints.db; backend/test_*.db for ephemeral runs.
- CI: schema_checker.py with EXPECTED_SCHEMA_FILE; migrations; pytest; vitest/playwright; npm/pip audit.
- Linters/Formatters: ruff/flake8 + black; eslint + prettier.
- Observability: log 3xx counts; basic DB query timing for spot checks.

## 8) Immediate Next Actions (Start Now)

Backend:
- Create complaint-system/backend/schema_expected.json by augmenting actual schema with:
  - complaints.status CHECK constraint values ['open','in_progress','resolved'] and map closed→resolved.
  - Indexes: complaints(status, created_at, company_id, part_id).
  - Attachments: complaint_attachments (if required), FK to complaints, indexes, and optional trigger to maintain has_attachments.
  - Follow-up actions (if required): follow_up_actions, action_history, responsible_persons, action_dependencies with appropriate indexes.

- Implement dual-accept routes for "" and "/" on collection endpoints; consider app = FastAPI(redirect_slashes=False).

Frontend:
- Add ensureTrailingSlash() in services/api.ts and refactor calls in hooks/pages.

DevOps:
- Add CI checker step with EXPECTED_SCHEMA_FILE; fail on diffs; archive report.

QA:
- Draft E2E network assertions to ensure no 3xx during core flows.

Assumptions and Trade-offs:
- Canonical trailing slash for collections; backend accepts both. Trade-off: minor duplication mitigated by alias; lowest risk.
- Default status enum: ['open','in_progress','resolved']; legacy 'closed' mapped to 'resolved'.
- Include attachments and follow-up actions unless explicitly out-of-scope.