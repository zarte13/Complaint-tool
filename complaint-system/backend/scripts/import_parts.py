#!/usr/bin/env python3
r"""
Import parts from a CSV file with headers.

CSV headers supported:
- part_number (required)
- description (optional)

Usage (PowerShell):
  cd complaint-system/backend
  python scripts/import_parts.py --csv C:\\path\\to\\parts.csv

Clear existing data (dangerous):
  # Fails if complaints exist unless you pass --cascade-complaints
  python scripts/import_parts.py --csv C:\\path\\to\\parts.csv --clear

Clear with cascade (also deletes all complaints):
  python scripts/import_parts.py --csv C:\\path\\to\\parts.csv --clear --cascade-complaints
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
from app.models.models import Part, Complaint


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
    return ''.join(ch for ch in h if ch.isalnum())


def _build_header_map(fieldnames: Optional[List[str]]) -> Dict[str, str]:
    headers = fieldnames or []
    mapping: Dict[str, str] = {}
    for h in headers:
        mapping[_normalize_header(h)] = h
    return mapping


def import_parts(
    csv_path: Path,
    clear: bool,
    cascade_complaints: bool,
    dry_run: bool = False,
    encoding: Optional[str] = None,
    delimiter: Optional[str] = None,
    part_number_column: Optional[str] = None,
    description_column: Optional[str] = None,
) -> int:
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
                    "❌ Refusing to clear parts because complaints exist. "
                    "Re-run with --cascade-complaints to also delete all complaints."
                )
                return 2

            if cascade_complaints:
                print(f"Deleting {complaints_count} complaints (cascade) ...")
                if not dry_run:
                    session.query(Complaint).delete()

            parts_count = session.query(Part).count()
            print(f"Deleting {parts_count} parts ...")
            if not dry_run:
                session.query(Part).delete()
                session.commit()

        # Read CSV and upsert by part_number
        created = 0
        updated = 0
        f, reader = _open_csv_for_reader(csv_path, preferred=encoding, delimiter=delimiter)
        with f:
            header_map = _build_header_map(reader.fieldnames)

            wanted_num = _normalize_header(part_number_column) if part_number_column else None
            wanted_desc = _normalize_header(description_column) if description_column else None

            num_aliases = [
                'partnumber', 'pn', 'number', 'numero', 'numéro', 'ref', 'reference'
            ]
            desc_aliases = [
                'description', 'desc', 'label', 'libelle', 'libellé', 'designation'
            ]

            def resolve_col(aliases: List[str], forced: Optional[str]) -> Optional[str]:
                if forced and forced in header_map:
                    return header_map[forced]
                for a in aliases:
                    key = _normalize_header(a)
                    if key in header_map:
                        return header_map[key]
                return None

            num_col = resolve_col(num_aliases, wanted_num) or header_map.get('partnumber')
            desc_col = resolve_col(desc_aliases, wanted_desc)

            if not num_col:
                print("❌ Could not find a part number column. Acceptable headers:")
                print("   - part_number, " + ", ".join(num_aliases))
                print("Tip: pass --part-number-column <header> to specify the exact column.")
                return 3
            print(f"Using columns: part_number='{num_col}'" + (f", description='{desc_col}'" if desc_col else ", description=<none>"))

            for row in reader:
                part_number: Optional[str] = (row.get(num_col) or '').strip()
                description: Optional[str] = ((row.get(desc_col) or '').strip() if desc_col else '') or None
                if not part_number:
                    print("Skipping row with empty part_number")
                    continue

                existing: Optional[Part] = (
                    session.query(Part).filter(Part.part_number.ilike(part_number)).first()
                )
                if existing:
                    if description is not None and existing.description != description:
                        print(f"Update: {part_number} description: {existing.description!r} -> {description!r}")
                        if not dry_run:
                            existing.description = description
                            session.add(existing)
                            updated += 1
                    else:
                        # No change
                        pass
                else:
                    print(f"Create: {part_number} (description={description!r})")
                    if not dry_run:
                        n = Part(part_number=part_number, description=description)
                        session.add(n)
                        created += 1

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
    parser = argparse.ArgumentParser(description="Import parts from CSV")
    parser.add_argument('--csv', dest='csv_path', required=True, help='Path to CSV file')
    parser.add_argument('--clear', action='store_true', help='Delete all parts before import')
    parser.add_argument('--cascade-complaints', action='store_true', help='Also delete all complaints when clearing')
    parser.add_argument('--dry-run', action='store_true', help='Simulate actions without writing to DB')
    parser.add_argument('--encoding', dest='encoding', help='Force CSV encoding (e.g., cp1252, utf-8)')
    parser.add_argument('--delimiter', dest='delimiter', help='Force CSV delimiter (e.g., ; , \t |)')
    parser.add_argument('--part-number-column', dest='part_number_column', help='Header name for part_number')
    parser.add_argument('--description-column', dest='description_column', help='Header name for description')
    args = parser.parse_args(argv)

    csv_path = Path(args.csv_path)
    return import_parts(
        csv_path=csv_path,
        clear=args.clear,
        cascade_complaints=args.cascade_complaints,
        dry_run=args.dry_run,
        encoding=args.encoding,
        delimiter=args.delimiter,
        part_number_column=args.part_number_column,
        description_column=args.description_column,
    )


if __name__ == '__main__':
    sys.exit(main())


