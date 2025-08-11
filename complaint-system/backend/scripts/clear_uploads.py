#!/usr/bin/env python3
"""
Clear uploaded files and purge the attachments table.

Usage (PowerShell):
  cd complaint-system/backend
  
  # Dry-run: show what would be deleted
  python scripts/clear_uploads.py --dry-run --all

  # Delete files only (keeps DB rows)
  python scripts/clear_uploads.py --clear-files

  # Delete DB rows only (keeps files)
  python scripts/clear_uploads.py --clear-db

  # Delete both DB rows and files
  python scripts/clear_uploads.py --all

Notes:
- Updates complaints.has_attachments to False when clearing the DB.
- Uploads root: backend/uploads/complaints/{complaint_id}/
"""

import argparse
import os
import shutil
from pathlib import Path
from typing import Tuple

# Ensure imports work when run directly
import sys
CURRENT_FILE = Path(__file__).resolve()
BACKEND_DIR = CURRENT_FILE.parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database.database import SessionLocal
from app.models.models import Complaint, ComplaintAttachment


def count_files_in_dir(path: Path) -> int:
    if not path.exists():
        return 0
    total = 0
    for _root, _dirs, files in os.walk(path):
        total += len(files)
    return total


def clear_files(uploads_root: Path, dry_run: bool) -> Tuple[int, int]:
    """Delete all files under uploads_root; returns (num_files, num_dirs_deleted)."""
    if not uploads_root.exists():
        return (0, 0)

    num_files = 0
    num_dirs = 0

    if dry_run:
        num_files = count_files_in_dir(uploads_root)
        # Count leaf dirs as approximation
        for _root, dirs, _files in os.walk(uploads_root):
            num_dirs += len(dirs)
        return (num_files, num_dirs)

    # Remove complaint subdirectories entirely for a clean slate
    for child in uploads_root.iterdir():
        try:
            if child.is_dir():
                num_files += count_files_in_dir(child)
                shutil.rmtree(child, ignore_errors=True)
                num_dirs += 1
            else:
                child.unlink(missing_ok=True)
                num_files += 1
        except Exception:
            # Continue best-effort; report totals
            pass

    return (num_files, num_dirs)


def clear_db(session: SessionLocal, dry_run: bool) -> Tuple[int, int]:
    """Delete all ComplaintAttachment rows; set complaints.has_attachments = False.
    Returns (num_attachments_deleted, num_complaints_updated).
    """
    # Count first
    attachments_count = session.query(ComplaintAttachment).count()
    # Complaints to update
    complaints_to_update = session.query(Complaint).filter(Complaint.has_attachments == True).count()

    if dry_run:
        return (attachments_count, complaints_to_update)

    # Delete attachments
    session.query(ComplaintAttachment).delete()
    # Reset has_attachments
    session.query(Complaint).filter(Complaint.has_attachments == True).update({Complaint.has_attachments: False})
    session.commit()

    return (attachments_count, complaints_to_update)


def main() -> int:
    parser = argparse.ArgumentParser(description="Clear uploaded files and/or attachments DB records")
    parser.add_argument('--dry-run', action='store_true', help='Show what would be deleted without making changes')
    parser.add_argument('--clear-files', action='store_true', help='Delete all uploaded files under uploads/complaints')
    parser.add_argument('--clear-db', action='store_true', help='Delete all ComplaintAttachment rows and reset complaints.has_attachments')
    parser.add_argument('--all', action='store_true', help='Shorthand for --clear-files and --clear-db')
    args = parser.parse_args()

    do_files = args.clear_files or args.all
    do_db = args.clear_db or args.all

    if not do_files and not do_db:
        print("Nothing to do. Pass --clear-files, --clear-db or --all (use --dry-run first).")
        return 0

    uploads_root = BACKEND_DIR / 'uploads' / 'complaints'

    if do_files:
        files, dirs = clear_files(uploads_root, args.dry_run)
        action = "(dry-run) Would delete" if args.dry_run else "Deleted"
        print(f"{action} {files} files and {dirs} directories under '{uploads_root}'.")

    if do_db:
        session = SessionLocal()
        try:
            deleted, updated = clear_db(session, args.dry_run)
            action = "(dry-run) Would delete" if args.dry_run else "Deleted"
            print(f"{action} {deleted} attachment rows; reset has_attachments on {updated} complaints.")
        finally:
            session.close()

    return 0


if __name__ == '__main__':
    raise SystemExit(main())


