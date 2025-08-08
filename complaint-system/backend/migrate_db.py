#!/usr/bin/env python3
"""
Database migration script to add new complaint fields.

This script adds the following fields to the complaints table:
- work_order_number (required)
- occurrence (optional)
- part_received (optional)
- human_factor (boolean, default False)
"""

import sqlite3
import os
from pathlib import Path

def has_column(conn: sqlite3.Connection, table: str, column: str) -> bool:
    cur = conn.cursor()
    cur.execute(f"PRAGMA table_info({table})")
    cols = [row[1] for row in cur.fetchall()]
    return column in cols


def migrate_database():
    """Add new columns to complaints table (idempotent)."""
    db_path = Path(__file__).parent / "database" / "complaints.db"
    
    if not db_path.exists():
        print(f"Database not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Work in small, idempotent steps so one failure doesn't stop others
    try:
        if not has_column(conn, 'complaints', 'work_order_number'):
            cursor.execute("ALTER TABLE complaints ADD COLUMN work_order_number VARCHAR(100) NOT NULL DEFAULT '';")
    except sqlite3.OperationalError as e:
        print(f"Skipping work_order_number: {e}")

    try:
        if not has_column(conn, 'complaints', 'occurrence'):
            cursor.execute("ALTER TABLE complaints ADD COLUMN occurrence VARCHAR(100);")
    except sqlite3.OperationalError as e:
        print(f"Skipping occurrence: {e}")

    try:
        if not has_column(conn, 'complaints', 'part_received'):
            cursor.execute("ALTER TABLE complaints ADD COLUMN part_received VARCHAR(100);")
    except sqlite3.OperationalError as e:
        print(f"Skipping part_received: {e}")

    try:
        if not has_column(conn, 'complaints', 'human_factor'):
            cursor.execute("ALTER TABLE complaints ADD COLUMN human_factor BOOLEAN DEFAULT 0;")
    except sqlite3.OperationalError as e:
        print(f"Skipping human_factor: {e}")

    # Ensure soft delete column exists
    try:
        if not has_column(conn, 'complaints', 'is_deleted'):
            cursor.execute("ALTER TABLE complaints ADD COLUMN is_deleted BOOLEAN DEFAULT 0;")
    except sqlite3.OperationalError as e:
        print(f"Skipping is_deleted: {e}")

    # FF-002: Issue taxonomy columns (category/subtypes + packaging details)
    try:
        if not has_column(conn, 'complaints', 'issue_category'):
            cursor.execute("ALTER TABLE complaints ADD COLUMN issue_category VARCHAR(20);")
    except sqlite3.OperationalError as e:
        print(f"Skipping issue_category: {e}")

    try:
        if not has_column(conn, 'complaints', 'issue_subtypes'):
            cursor.execute("ALTER TABLE complaints ADD COLUMN issue_subtypes TEXT;")  # JSON-serialized list
    except sqlite3.OperationalError as e:
        print(f"Skipping issue_subtypes: {e}")

    try:
        if not has_column(conn, 'complaints', 'packaging_received'):
            cursor.execute("ALTER TABLE complaints ADD COLUMN packaging_received TEXT;")  # JSON-serialized map
    except sqlite3.OperationalError as e:
        print(f"Skipping packaging_received: {e}")

    try:
        if not has_column(conn, 'complaints', 'packaging_expected'):
            cursor.execute("ALTER TABLE complaints ADD COLUMN packaging_expected TEXT;")  # JSON-serialized map
    except sqlite3.OperationalError as e:
        print(f"Skipping packaging_expected: {e}")

    conn.commit()
    print("Migration completed.")
    conn.close()

if __name__ == "__main__":
    migrate_database()