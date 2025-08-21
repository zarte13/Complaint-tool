"""
Migration 007: Settings Tables Implementation

This migration creates the database tables required for the settings system:
- app_settings: Key-value store for application settings
- taxonomy_categories: Complaint issue categories with i18n support
- taxonomy_subtypes: Sub-types for each category with i18n support
- dashboard_configs: Dashboard layout configurations
- settings_audit: Audit trail for settings changes
"""

from sqlalchemy import create_engine, text
import sqlite3
import json
from datetime import datetime


def upgrade():
    """Apply the migration"""
    conn = sqlite3.connect('database/complaints.db')
    cursor = conn.cursor()
    
    # Create app_settings table (KV store)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value_json TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_by TEXT NOT NULL
        )
    ''')
    
    # Create taxonomy_categories table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS taxonomy_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            label_en TEXT NOT NULL,
            label_fr TEXT NOT NULL,
            active BOOLEAN DEFAULT 1,
            sort_order INTEGER DEFAULT 0
        )
    ''')
    
    # Create taxonomy_subtypes table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS taxonomy_subtypes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_key TEXT NOT NULL,
            key TEXT NOT NULL,
            label_en TEXT NOT NULL,
            label_fr TEXT NOT NULL,
            active BOOLEAN DEFAULT 1,
            sort_order INTEGER DEFAULT 0,
            FOREIGN KEY (category_key) REFERENCES taxonomy_categories(key) ON DELETE CASCADE,
            UNIQUE(category_key, key)
        )
    ''')
    
    # Create dashboard_configs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dashboard_configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            layout_json TEXT NOT NULL,
            is_default BOOLEAN DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_by TEXT NOT NULL
        )
    ''')
    
    # Create settings_audit table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings_audit (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name TEXT NOT NULL,
            record_id TEXT NOT NULL,
            action TEXT NOT NULL,
            old_values TEXT,
            new_values TEXT,
            changed_by TEXT NOT NULL,
            changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create indexes for performance
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_taxonomy_categories_key ON taxonomy_categories(key)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_taxonomy_subtypes_category ON taxonomy_subtypes(category_key)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_dashboard_configs_default ON dashboard_configs(is_default)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_settings_audit_table ON settings_audit(table_name, record_id)')
    
    # Seed default taxonomy data
    seed_default_taxonomy(cursor)
    
    conn.commit()
    conn.close()


def seed_default_taxonomy(cursor):
    """Seed default taxonomy data"""
    
    # Default categories
    categories = [
        ('visual', 'Visual', 'Visuel'),
        ('packaging', 'Packaging', 'Emballage'),
        ('dimensional', 'Dimensional', 'Dimensionnel'),
        ('other', 'Other', 'Autre')
    ]
    
    for key, en_label, fr_label in categories:
        cursor.execute('''
            INSERT OR IGNORE INTO taxonomy_categories (key, label_en, label_fr, sort_order)
            VALUES (?, ?, ?, ?)
        ''', (key, en_label, fr_label, 0))
    
    # Default subtypes for visual
    visual_subtypes = [
        ('scratch', 'Scratch', 'Rayure'),
        ('nicks', 'Nicks', 'Entailles'),
        ('rust', 'Rust', 'Rouille'),
        ('dent', 'Dent', 'Bosselure'),
        ('discoloration', 'Discoloration', 'Décoloration')
    ]
    
    for key, en_label, fr_label in visual_subtypes:
        cursor.execute('''
            INSERT OR IGNORE INTO taxonomy_subtypes (category_key, key, label_en, label_fr, sort_order)
            VALUES (?, ?, ?, ?, ?)
        ''', ('visual', key, en_label, fr_label, 0))
    
    # Default subtypes for packaging
    packaging_subtypes = [
        ('wrong_box', 'Wrong Box', 'Mauvaise boîte'),
        ('wrong_bag', 'Wrong Bag', 'Mauvais sac'),
        ('wrong_paper', 'Wrong Paper', 'Mauvais papier'),
        ('wrong_part', 'Wrong Part', 'Mauvaise pièce'),
        ('wrong_quantity', 'Wrong Quantity', 'Mauvaise quantité'),
        ('wrong_tags', 'Wrong Tags', 'Mauvaises étiquettes')
    ]
    
    for key, en_label, fr_label in packaging_subtypes:
        cursor.execute('''
            INSERT OR IGNORE INTO taxonomy_subtypes (category_key, key, label_en, label_fr, sort_order)
            VALUES (?, ?, ?, ?, ?)
        ''', ('packaging', key, en_label, fr_label, 0))
    
    # Seed default dashboard config
    default_config = {
        "template": "standard",
        "timeWindow": {"kind": "weeks", "value": 12},
        "cards": [
            {"id": "kpis", "type": "kpi_counts", "enabled": True, "size": "lg", "order": 1},
            {"id": "trend12w", "type": "evil_line_trend", "enabled": True, "size": "lg", "order": 2,
             "props": {"endpoint": "/api/analytics/weekly-type-trends/", "xKey": "week", "yKeys": ["total"], "palette": "blue"}},
            {"id": "fail_pie", "type": "evil_pie_failures", "enabled": True, "size": "md", "order": 3,
             "props": {"endpoint": "/api/analytics/failure-modes/", "sliceBy": "issue_category"}},
            {"id": "stacked", "type": "evil_stacked_glow", "enabled": False, "size": "lg", "order": 4,
             "props": {"endpoint": "/api/analytics/weekly-type-trends/", "groupBy": "issue_category", "stackBy": "status"}}
        ]
    }
    
    cursor.execute('''
        INSERT OR IGNORE INTO dashboard_configs (name, layout_json, is_default, updated_by)
        VALUES (?, ?, ?, ?)
    ''', ('Standard', json.dumps(default_config), True, 'system'))


def downgrade():
    """Revert the migration"""
    conn = sqlite3.connect('database/complaints.db')
    cursor = conn.cursor()
    
    cursor.execute('DROP TABLE IF EXISTS settings_audit')
    cursor.execute('DROP TABLE IF EXISTS dashboard_configs')
    cursor.execute('DROP TABLE IF EXISTS taxonomy_subtypes')
    cursor.execute('DROP TABLE IF EXISTS taxonomy_categories')
    cursor.execute('DROP TABLE IF EXISTS app_settings')
    
    conn.commit()
    conn.close()


if __name__ == '__main__':
    upgrade()
    print("Settings tables migration completed successfully")

