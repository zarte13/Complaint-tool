import sqlite3

def column_exists(conn, table, column):
    cur = conn.cursor()
    cur.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cur.fetchall())

def table_exists(conn, table):
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
    return cur.fetchone() is not None

def migrate():
    conn = sqlite3.connect('database/complaints.db')
    cur = conn.cursor()
    changed = False

    # app_settings KV table
    if not table_exists(conn, 'app_settings'):
        cur.execute(
            """
            CREATE TABLE app_settings (
              key TEXT PRIMARY KEY,
              value_json TEXT NOT NULL,
              updated_at TEXT,
              updated_by TEXT
            )
            """
        )
        changed = True

    # taxonomy tables (placeholders for step 3b)
    if not table_exists(conn, 'taxonomy_categories'):
        cur.execute(
            """
            CREATE TABLE taxonomy_categories (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              key TEXT UNIQUE,
              label_en TEXT,
              label_fr TEXT,
              active INTEGER DEFAULT 1,
              sort_order INTEGER DEFAULT 0
            )
            """
        )
        changed = True

    if not table_exists(conn, 'taxonomy_subtypes'):
        cur.execute(
            """
            CREATE TABLE taxonomy_subtypes (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              category_key TEXT,
              key TEXT,
              label_en TEXT,
              label_fr TEXT,
              active INTEGER DEFAULT 1,
              sort_order INTEGER DEFAULT 0
            )
            """
        )
        changed = True

    if changed:
        conn.commit()
    conn.close()

if __name__ == '__main__':
    migrate()


