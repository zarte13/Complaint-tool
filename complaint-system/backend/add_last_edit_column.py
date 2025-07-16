#!/usr/bin/env python3
"""
Migration script to add the last_edit column to the complaints table.
This script should be run once to update the existing database schema.
"""

import sqlite3
import os
from datetime import datetime

def add_last_edit_column():
    # Get the database path
    db_path = os.path.join(os.path.dirname(__file__), "database", "complaints.db")
    
    if not os.path.exists(db_path):
        print(f"Database file not found at {db_path}")
        print("Please make sure the database exists or run the application first to create it.")
        return False
    
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if the column already exists
        cursor.execute("PRAGMA table_info(complaints)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'last_edit' in columns:
            print("Column 'last_edit' already exists in the complaints table.")
            conn.close()
            return True
        
        # Add the last_edit column
        print("Adding 'last_edit' column to complaints table...")
        cursor.execute("ALTER TABLE complaints ADD COLUMN last_edit DATETIME")
        
        # Commit the changes
        conn.commit()
        print("Successfully added 'last_edit' column to complaints table.")
        
        # Verify the column was added
        cursor.execute("PRAGMA table_info(complaints)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'last_edit' in columns:
            print("Migration completed successfully!")
            return True
        else:
            print("Error: Column was not added successfully.")
            return False
            
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    print("Running database migration to add last_edit column...")
    success = add_last_edit_column()
    if success:
        print("Migration completed successfully!")
    else:
        print("Migration failed!")