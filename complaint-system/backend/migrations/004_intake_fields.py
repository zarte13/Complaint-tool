#!/usr/bin/env python3
"""
Migration 004: Add intake fields to complaints
 - complaints.date_received (DATE, NOT NULL default to created_at date)
 - complaints.complaint_kind (TEXT, NOT NULL, 'official'|'notification', default 'notification')
 - complaints.ncr_number (TEXT, NULL)
"""

import sqlite3
from pathlib import Path


def column_exists(conn: sqlite3.Connection, table: str, column: str) -> bool:
    cur = conn.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cur.fetchall())


def migrate():
    db_path = Path(__file__).parent.parent / "database" / "complaints.db"
    if not db_path.exists():
        print(f"❌ Database not found at {db_path}")
        return False

    conn = sqlite3.connect(str(db_path))
    try:
        cur = conn.cursor()
        changed = False

        if not column_exists(conn, 'complaints', 'date_received'):
            # default to DATE(created_at) for existing rows
            cur.execute("ALTER TABLE complaints ADD COLUMN date_received DATE")
            cur.execute("UPDATE complaints SET date_received = DATE(created_at)")
            cur.execute("UPDATE complaints SET date_received = DATE('now') WHERE date_received IS NULL")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_complaints_date_received ON complaints(date_received)")
            changed = True

        if not column_exists(conn, 'complaints', 'complaint_kind'):
            cur.execute("ALTER TABLE complaints ADD COLUMN complaint_kind TEXT")
            cur.execute("UPDATE complaints SET complaint_kind = 'notification' WHERE complaint_kind IS NULL")
            changed = True

        if not column_exists(conn, 'complaints', 'ncr_number'):
            cur.execute("ALTER TABLE complaints ADD COLUMN ncr_number TEXT")
            changed = True

        # Add follow_up column if missing
        if not column_exists(conn, 'complaints', 'follow_up'):
            cur.execute("ALTER TABLE complaints ADD COLUMN follow_up TEXT")
            changed = True

        conn.commit()
        if changed:
            print("✅ Migration 004 applied: intake fields added")
        else:
            print("ℹ️ Migration 004: nothing to do")
        return True
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()


