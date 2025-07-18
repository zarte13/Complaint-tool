#!/usr/bin/env python3
"""
DA-008: Status Field Schema & Filtering Enhancement
Migration to add enum constraint for status field.

This migration adds a CHECK constraint to the complaints table
to enforce only valid status values: open, in_progress, resolved.
"""

import sqlite3
import os
from pathlib import Path

def migrate_da008_status_enum():
    """Add enum constraint to status field in complaints table."""
    
    # Find database files
    possible_db_paths = [
        Path(__file__).parent.parent / "database" / "complaints.db",
        Path(__file__).parent.parent / "complaints.db",
        Path(__file__).parent.parent.parent / "database" / "complaints.db"
    ]
    
    db_path = None
    for path in possible_db_paths:
        if path.exists():
            db_path = path
            break
    
    if not db_path:
        print(f"❌ Database not found. Searched paths:")
        for path in possible_db_paths:
            print(f"   - {path}")
        return
    
    print(f"📁 Using database: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("🚀 Starting DA-008 Status Enum migration...")
        
        # Check if status field has default value 'open'
        print("🔍 Checking current status field configuration...")
        cursor.execute("SELECT status FROM complaints WHERE status IS NULL LIMIT 1")
        null_status_exists = cursor.fetchone() is not None
        
        # Set default status to 'open' for any NULL values
        if null_status_exists:
            print("🔧 Setting default status 'open' for NULL values...")
            cursor.execute("UPDATE complaints SET status = 'open' WHERE status IS NULL OR status = ''")
            
        # Update 'closed' status to 'resolved' to match new enum
        print("🔄 Updating 'closed' status to 'resolved' to match new enum...")
        cursor.execute("UPDATE complaints SET status = 'resolved' WHERE status = 'closed'")
        
        # Create new table with CHECK constraint
        print("📋 Creating new complaints table with status enum constraint...")
        cursor.execute("""
            CREATE TABLE complaints_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id INTEGER NOT NULL,
                part_id INTEGER NOT NULL,
                issue_type VARCHAR(50) NOT NULL,
                details TEXT NOT NULL,
                quantity_ordered INTEGER,
                quantity_received INTEGER,
                status VARCHAR(20) NOT NULL DEFAULT 'open' 
                    CHECK (status IN ('open', 'in_progress', 'resolved')),
                has_attachments BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                work_order_number VARCHAR(100) NOT NULL DEFAULT '',
                occurrence VARCHAR(100),
                part_received VARCHAR(100),
                human_factor BOOLEAN DEFAULT 0,
                last_edit DATETIME,
                FOREIGN KEY (company_id) REFERENCES companies(id),
                FOREIGN KEY (part_id) REFERENCES parts(id)
            )
        """)
        
        # Copy data from old table to new table
        print("📤 Migrating data to new table...")
        cursor.execute("""
            INSERT INTO complaints_new 
            SELECT * FROM complaints
        """)
        
        # Drop old table and rename new table
        print("🔄 Replacing old table with new table...")
        cursor.execute("DROP TABLE complaints")
        cursor.execute("ALTER TABLE complaints_new RENAME TO complaints")
        
        # Recreate indexes
        print("🔗 Recreating indexes...")
        cursor.execute("CREATE INDEX idx_complaints_company_id ON complaints(company_id)")
        cursor.execute("CREATE INDEX idx_complaints_part_id ON complaints(part_id)")
        cursor.execute("CREATE INDEX idx_complaints_status ON complaints(status)")
        cursor.execute("CREATE INDEX idx_complaints_created_at ON complaints(created_at)")
        
        # Verify constraint works
        print("✅ Verifying enum constraint...")
        try:
            cursor.execute("INSERT INTO complaints (company_id, part_id, issue_type, details, work_order_number, status) VALUES (1, 1, 'test', 'test', 'test', 'invalid_status')")
            cursor.execute("DELETE FROM complaints WHERE issue_type = 'test'")  # Cleanup test
            print("❌ ERROR: Constraint not working - invalid status was accepted!")
            conn.rollback()
            return
        except sqlite3.IntegrityError:
            print("✅ Enum constraint working correctly - invalid status rejected")
        
        conn.commit()
        print("✅ DA-008 Status Enum migration completed successfully!")
        
        # Show final status distribution
        print("\n📊 Current status distribution:")
        cursor.execute("SELECT status, COUNT(*) FROM complaints GROUP BY status ORDER BY COUNT(*) DESC")
        for status, count in cursor.fetchall():
            print(f"   {status}: {count} complaints")
            
    except Exception as e:
        print(f"❌ Migration error: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_da008_status_enum() 