#!/usr/bin/env python3
"""
Migration 003: Add created_by audit fields
- complaints.created_by (TEXT)
- follow_up_actions.created_by (TEXT)
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

        # complaints.created_by
        if not column_exists(conn, 'complaints', 'created_by'):
            print("Adding complaints.created_by ...")
            cur.execute("ALTER TABLE complaints ADD COLUMN created_by TEXT")
            changed = True

        # follow_up_actions.created_by
        if not column_exists(conn, 'follow_up_actions', 'created_by'):
            print("Adding follow_up_actions.created_by ...")
            cur.execute("ALTER TABLE follow_up_actions ADD COLUMN created_by TEXT")
            changed = True

        if changed:
            conn.commit()
            print("✅ Migration 003 completed")
        else:
            print("ℹ️  Migration 003: no changes; columns already exist")
        return True
    except Exception as e:
        print(f"❌ Migration 003 failed: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()


if __name__ == "__main__":
    ok = migrate()
    if not ok:
        raise SystemExit(1)


