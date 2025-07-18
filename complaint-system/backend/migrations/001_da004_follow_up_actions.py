#!/usr/bin/env python3
"""
DA-004 Database Migration: Follow-up Actions Module

This migration creates the necessary tables for the follow-up actions system:
- follow_up_actions: Main actions table with sequential ordering
- action_history: Audit trail for compliance tracking
- responsible_persons: List of available assignees (AL, JF, FC, etc.)
- action_dependencies: Sequential dependencies between actions

Created: 2025-01-17
Author: DA-004 Implementation
"""

import sqlite3
import os
from pathlib import Path
from datetime import datetime

def migrate_da004_follow_up_actions():
    """Create follow-up actions tables and initial data."""
    
    # Use the database from the database directory
    db_path = Path(__file__).parent.parent / "database" / "complaints.db"
    
    if not db_path.exists():
        print(f"❌ Database not found at {db_path}")
        print("📝 Please run init_db.py first to create the database")
        return False
    
    print(f"🗄️  Connecting to database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("🚀 Starting DA-004 Follow-up Actions migration...")
        
        # 1. Create follow_up_actions table
        print("📋 Creating follow_up_actions table...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS follow_up_actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                complaint_id INTEGER NOT NULL,
                action_number INTEGER NOT NULL,
                action_text TEXT NOT NULL,
                responsible_person VARCHAR(255) NOT NULL,
                due_date DATE,
                status VARCHAR(20) DEFAULT 'open',
                priority VARCHAR(10) DEFAULT 'medium',
                notes TEXT,
                completion_percentage INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                started_at TIMESTAMP NULL,
                completed_at TIMESTAMP NULL,
                FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
                UNIQUE(complaint_id, action_number)
            )
        ''')
        
        # 2. Create action_history table for audit trail
        print("📜 Creating action_history table...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS action_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action_id INTEGER NOT NULL,
                field_changed VARCHAR(100) NOT NULL,
                old_value TEXT,
                new_value TEXT,
                changed_by VARCHAR(255) NOT NULL,
                changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                change_reason TEXT,
                FOREIGN KEY (action_id) REFERENCES follow_up_actions(id) ON DELETE CASCADE
            )
        ''')
        
        # 3. Create responsible_persons table
        print("👤 Creating responsible_persons table...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS responsible_persons (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255),
                department VARCHAR(100),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 4. Create action_dependencies table
        print("🔗 Creating action_dependencies table...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS action_dependencies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action_id INTEGER NOT NULL,
                depends_on_action_id INTEGER NOT NULL,
                dependency_type VARCHAR(20) DEFAULT 'sequential',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (action_id) REFERENCES follow_up_actions(id) ON DELETE CASCADE,
                FOREIGN KEY (depends_on_action_id) REFERENCES follow_up_actions(id) ON DELETE CASCADE
            )
        ''')
        
        # 5. Create indexes for performance
        print("🔍 Creating database indexes...")
        indexes = [
            'CREATE INDEX IF NOT EXISTS idx_actions_complaint_id ON follow_up_actions(complaint_id)',
            'CREATE INDEX IF NOT EXISTS idx_actions_status ON follow_up_actions(status)',
            'CREATE INDEX IF NOT EXISTS idx_actions_responsible ON follow_up_actions(responsible_person)',
            'CREATE INDEX IF NOT EXISTS idx_actions_due_date ON follow_up_actions(due_date)',
            'CREATE INDEX IF NOT EXISTS idx_actions_number ON follow_up_actions(action_number)',
            'CREATE INDEX IF NOT EXISTS idx_history_action_id ON action_history(action_id)',
            'CREATE INDEX IF NOT EXISTS idx_history_changed_at ON action_history(changed_at)',
            'CREATE INDEX IF NOT EXISTS idx_dependencies_action ON action_dependencies(action_id)',
            'CREATE INDEX IF NOT EXISTS idx_persons_active ON responsible_persons(is_active)'
        ]
        
        for index in indexes:
            cursor.execute(index)
        
        # 6. Seed responsible persons with initial data (from French action plan image)
        print("🌱 Seeding responsible persons...")
        default_persons = [
            ('AL', 'al@company.com', 'Quality Assurance', True),
            ('JF', 'jf@company.com', 'Engineering', True), 
            ('FC', 'fc@company.com', 'Management', True),
            ('Système', 'system@company.com', 'System', True),
            ('Admin', 'admin@company.com', 'Administration', True)
        ]
        
        cursor.executemany('''
            INSERT OR IGNORE INTO responsible_persons (name, email, department, is_active) 
            VALUES (?, ?, ?, ?)
        ''', default_persons)
        
        # 7. Create trigger to update updated_at timestamp
        print("⚡ Creating update triggers...")
        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS update_action_timestamp 
            AFTER UPDATE ON follow_up_actions
            BEGIN
                UPDATE follow_up_actions 
                SET updated_at = CURRENT_TIMESTAMP 
                WHERE id = NEW.id;
            END
        ''')
        
        conn.commit()
        
        # 8. Verify table creation
        print("✅ Verifying table creation...")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%action%' OR name LIKE '%responsible%'")
        tables = cursor.fetchall()
        
        expected_tables = ['follow_up_actions', 'action_history', 'responsible_persons', 'action_dependencies']
        created_tables = [table[0] for table in tables]
        
        print(f"📊 Created tables: {created_tables}")
        
        for expected in expected_tables:
            if expected in created_tables:
                print(f"✅ {expected} - Created successfully")
            else:
                print(f"❌ {expected} - Failed to create")
                return False
        
        # 9. Verify seed data
        cursor.execute("SELECT COUNT(*) FROM responsible_persons")
        person_count = cursor.fetchone()[0]
        print(f"👥 Seeded {person_count} responsible persons")
        
        print(f"🎉 DA-004 migration completed successfully!")
        print(f"📅 Migration timestamp: {datetime.now().isoformat()}")
        
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Migration failed with SQLite error: {e}")
        conn.rollback()
        return False
    except Exception as e:
        print(f"❌ Migration failed with error: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def rollback_da004_migration():
    """Rollback DA-004 migration by dropping all created tables."""
    db_path = Path(__file__).parent.parent / "database" / "complaints.db"
    
    if not db_path.exists():
        print(f"❌ Database not found at {db_path}")
        return False
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("🔄 Rolling back DA-004 migration...")
        
        # Drop tables in reverse dependency order
        tables_to_drop = [
            'action_dependencies',
            'action_history', 
            'follow_up_actions',
            'responsible_persons'
        ]
        
        for table in tables_to_drop:
            cursor.execute(f'DROP TABLE IF EXISTS {table}')
            print(f"🗑️  Dropped table: {table}")
        
        # Drop triggers
        cursor.execute('DROP TRIGGER IF EXISTS update_action_timestamp')
        print("🗑️  Dropped triggers")
        
        conn.commit()
        print("✅ DA-004 rollback completed successfully!")
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Rollback failed: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "rollback":
        success = rollback_da004_migration()
    else:
        success = migrate_da004_follow_up_actions()
    
    if not success:
        sys.exit(1)
    
    print("\n📖 Usage:")
    print("  python 001_da004_follow_up_actions.py        # Run migration")
    print("  python 001_da004_follow_up_actions.py rollback  # Rollback migration") 