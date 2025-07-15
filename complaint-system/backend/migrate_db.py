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

def migrate_database():
    """Add new columns to complaints table."""
    db_path = Path(__file__).parent / "database" / "complaints.db"
    
    if not db_path.exists():
        print(f"Database not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Add new columns
        cursor.execute("""
            ALTER TABLE complaints ADD COLUMN work_order_number VARCHAR(100) NOT NULL DEFAULT '';
        """)
        
        cursor.execute("""
            ALTER TABLE complaints ADD COLUMN occurrence VARCHAR(100);
        """)
        
        cursor.execute("""
            ALTER TABLE complaints ADD COLUMN part_received VARCHAR(100);
        """)
        
        cursor.execute("""
            ALTER TABLE complaints ADD COLUMN human_factor BOOLEAN DEFAULT 0;
        """)
        
        conn.commit()
        print("Database migration completed successfully!")
        
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Columns already exist. Migration skipped.")
        else:
            print(f"Migration error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()