#!/usr/bin/env python3
r"""
Import companies from a CSV file with headers.

CSV headers expected:
- name (required)
- company_short (optional)

Usage (PowerShell):
  cd complaint-system/backend
  python scripts/import_companies.py --csv C:\\path\\to\\companies.csv

Clear existing data (dangerous):
  # Fails if complaints exist unless you pass --cascade-complaints
  python scripts/import_companies.py --csv C:\\path\\to\\companies.csv --clear

Clear with cascade (also deletes all complaints):
  python scripts/import_companies.py --csv C:\\path\\to\\companies.csv --clear --cascade-complaints
"""

import argparse
import csv
import sys
from pathlib import Path
from typing import Optional, Dict, List

# Ensure running from any CWD works by adding backend dir to sys.path
CURRENT_FILE = Path(__file__).resolve()
BACKEND_DIR = CURRENT_FILE.parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database.database import SessionLocal
from app.models.models import Company, Complaint
from sqlalchemy import func


PREFERRED_ENCODINGS = [
    'utf-8-sig',
    'utf-8',
    'cp1252',
    'latin-1',
]


def _open_csv_for_reader(csv_path: Path, preferred: Optional[str] = None, delimiter: Optional[str] = None):
    encodings = [preferred] + PREFERRED_ENCODINGS if preferred else PREFERRED_ENCODINGS
    last_err: Optional[Exception] = None
    for enc in [e for e in encodings if e]:
        try:
            f = csv_path.open('r', newline='', encoding=enc)
            # Read a sample to sniff dialect
            sample = f.read(2048)
            f.seek(0)
            try:
                if delimiter:
                    dialect = csv.excel
                    dialect.delimiter = delimiter  # type: ignore[attr-defined]
                else:
                    sniffed = csv.Sniffer().sniff(sample, delimiters=[',', ';', '\t', '|'])
                    dialect = sniffed
            except Exception:
                dialect = csv.excel
            reader = csv.DictReader(f, dialect=dialect)
            return f, reader
        except Exception as e:
            last_err = e
            try:
                f.close()  # type: ignore
            except Exception:
                pass
            continue
    raise last_err or UnicodeDecodeError('codec', b'', 0, 1, 'Unable to decode CSV')


def _normalize_header(h: str) -> str:
    h = (h or '').strip().lower()
    # remove spaces, underscores, hyphens and non-alnum
    return ''.join(ch for ch in h if ch.isalnum())


def _build_header_map(fieldnames: Optional[List[str]]) -> Dict[str, str]:
    headers = fieldnames or []
    mapping: Dict[str, str] = {}
    for h in headers:
        mapping[_normalize_header(h)] = h
    return mapping


def import_companies(csv_path: Path, clear: bool, cascade_complaints: bool, dry_run: bool = False, encoding: Optional[str] = None,
                     name_column: Optional[str] = None, short_column: Optional[str] = None, delimiter: Optional[str] = None) -> int:
    if not csv_path.exists():
        print(f"❌ CSV not found: {csv_path}")
        return 1

    session = SessionLocal()
    try:
        # Optional clear step
        if clear:
            complaints_count = session.query(Complaint).count()
            if complaints_count > 0 and not cascade_complaints:
                print(
                    "❌ Refusing to clear companies because complaints exist. "
                    "Re-run with --cascade-complaints to also delete all complaints."
                )
                return 2

            if cascade_complaints:
                print(f"Deleting {complaints_count} complaints (cascade) ...")
                if not dry_run:
                    session.query(Complaint).delete()

            companies_count = session.query(Company).count()
            print(f"Deleting {companies_count} companies ...")
            if not dry_run:
                session.query(Company).delete()
                session.commit()

        # Read CSV and upsert by name
        created = 0
        updated = 0
        # Track names seen in this run to avoid duplicate inserts within a single import
        seen: Dict[str, Company] = {}
        f, reader = _open_csv_for_reader(csv_path, preferred=encoding, delimiter=delimiter)
        with f:
            header_map = _build_header_map(reader.fieldnames)
            # Resolve columns
            wanted_name = _normalize_header(name_column) if name_column else None
            wanted_short = _normalize_header(short_column) if short_column else None

            name_aliases = [
                'name', 'company', 'client', 'raisonsociale', 'nom', 'societe', 'société'
            ]
            short_aliases = [
                'companyshort', 'short', 'shortname', 'abbr', 'acronym', 'sigle', 'code'
            ]

            def resolve_col(aliases: List[str], forced: Optional[str]) -> Optional[str]:
                if forced and forced in header_map:
                    return header_map[forced]
                for a in aliases:
                    key = _normalize_header(a)
                    if key in header_map:
                        return header_map[key]
                return None

            name_col = resolve_col(name_aliases, wanted_name)
            short_col = resolve_col(short_aliases, wanted_short)

            if not name_col:
                print("❌ Could not find a company name column. Acceptable headers:")
                print("   - " + ", ".join(name_aliases))
                print("Tip: pass --name-column <header> to specify the exact column.")
                return 3
            print(f"Using columns: name='{name_col}'" + (f", company_short='{short_col}'" if short_col else ", company_short=<none>"))

            for row in reader:
                name_raw: Optional[str] = row.get(name_col) if name_col else None
                name_value = name_raw if name_raw is not None else row.get('name')
                name: Optional[str] = (name_value or '').strip()
                company_short: Optional[str] = ((row.get(short_col) or '').strip() if short_col else '') or None
                if not name:
                    print("Skipping row with empty name")
                    continue

                key = name.lower()

                # If we already processed this name in current run, update the in-memory object
                if key in seen:
                    existing = seen[key]
                    if company_short is not None and existing.company_short != company_short:
                        print(f"Update (batch): {name} company_short: {existing.company_short!r} -> {company_short!r}")
                        if not dry_run:
                            existing.company_short = company_short
                            session.add(existing)
                            updated += 1
                    continue

                # Look for existing in DB with case/whitespace-insensitive match
                existing: Optional[Company] = (
                    session.query(Company)
                    .filter(func.lower(func.trim(Company.name)) == name.lower())
                    .first()
                )

                if existing:
                    if company_short is not None and existing.company_short != company_short:
                        print(f"Update: {name} company_short: {existing.company_short!r} -> {company_short!r}")
                        if not dry_run:
                            existing.company_short = company_short
                            session.add(existing)
                            updated += 1
                    seen[key] = existing
                else:
                    print(f"Create: {name} (company_short={company_short!r})")
                    if not dry_run:
                        n = Company(name=name, company_short=company_short)
                        session.add(n)
                        # Flush to catch unique errors early and make subsequent queries see this row
                        try:
                            session.flush()
                        except Exception:
                            session.rollback()
                            # If unique constraint hit due to race or aliasing, fetch and update instead
                            existing2 = (
                                session.query(Company)
                                .filter(func.lower(func.trim(Company.name)) == name.lower())
                                .first()
                            )
                            if existing2:
                                if company_short is not None and existing2.company_short != company_short:
                                    existing2.company_short = company_short
                                    session.add(existing2)
                                    updated += 1
                                seen[key] = existing2
                                continue
                            else:
                                # Re-raise if truly unexpected
                                raise
                        created += 1
                        seen[key] = n

        if not dry_run:
            session.commit()

        print(f"✅ Done. Created={created}, Updated={updated}.")
        return 0
    except Exception as e:
        session.rollback()
        print(f"❌ Error: {e}")
        return 10
    finally:
        session.close()


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Import companies from CSV")
    parser.add_argument('--csv', dest='csv_path', required=True, help='Path to CSV file')
    parser.add_argument('--clear', action='store_true', help='Delete all companies before import')
    parser.add_argument('--cascade-complaints', action='store_true', help='Also delete all complaints when clearing')
    parser.add_argument('--dry-run', action='store_true', help='Simulate actions without writing to DB')
    parser.add_argument('--encoding', dest='encoding', help='Force CSV encoding (e.g., cp1252, utf-8)')
    parser.add_argument('--delimiter', dest='delimiter', help='Force CSV delimiter (e.g., ; , \t |)')
    parser.add_argument('--name-column', dest='name_column', help='Header name for company name')
    parser.add_argument('--short-column', dest='short_column', help='Header name for company_short')
    args = parser.parse_args(argv)

    csv_path = Path(args.csv_path)
    return import_companies(
        csv_path=csv_path,
        clear=args.clear,
        cascade_complaints=args.cascade_complaints,
        dry_run=args.dry_run,
        encoding=args.encoding,
        name_column=args.name_column,
        short_column=args.short_column,
        delimiter=args.delimiter,
    )


if __name__ == '__main__':
    sys.exit(main())


