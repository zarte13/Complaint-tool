## Data Import (Companies and Parts)

### Prerequisites
- Ensure DB schema is migrated:
```
cd complaint-system/backend
python migrate_db.py
```

### Companies Import
- CSV headers:
  - Required: `name`
  - Optional: `company_short`
- Examples:
```
python scripts/import_companies.py --csv .\scripts\imports\Clients.csv --dry-run --encoding cp1252 --delimiter ';'
python scripts/import_companies.py --csv .\scripts\imports\Clients.csv --clear --encoding cp1252 --delimiter ';'
python scripts/import_companies.py --csv .\scripts\imports\Clients.csv --name-column "Client" --short-column "Abbrev"
```
- Behavior: upsert by `name` (case-insensitive); updates `company_short` if changed. `--clear` refuses if complaints exist unless `--cascade-complaints`.

### Parts Import
- CSV headers:
  - Required: `part_number`
  - Optional: `description`
- Examples:
```
python scripts/import_parts.py --csv .\scripts\imports\Parts.csv --dry-run --encoding cp1252 --delimiter ';'
python scripts/import_parts.py --csv .\scripts\imports\Parts.csv --clear --encoding cp1252 --delimiter ';'
python scripts/import_parts.py --csv .\scripts\imports\Parts.csv --part-number-column "PN"
```
- Behavior: upsert by `part_number` (case-insensitive); updates `description` if changed. `--clear` refuses if complaints exist unless `--cascade-complaints`.

### Clear Uploads (files and/or DB)
```
python scripts/clear_uploads.py --dry-run --all
python scripts/clear_uploads.py --clear-files
python scripts/clear_uploads.py --clear-db
python scripts/clear_uploads.py --all
```
Deletes `uploads/complaints/*` and/or purges `complaint_attachments` then resets `complaints.has_attachments`.


