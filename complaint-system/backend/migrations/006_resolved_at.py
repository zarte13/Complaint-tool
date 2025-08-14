import sqlite3

def column_exists(conn, table, column):
    cur = conn.cursor()
    cur.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cur.fetchall())

def migrate():
    conn = sqlite3.connect('database/complaints.db')
    cur = conn.cursor()
    changed = False
    if not column_exists(conn, 'complaints', 'resolved_at'):
        cur.execute("ALTER TABLE complaints ADD COLUMN resolved_at TEXT")
        changed = True
    if changed:
        conn.commit()
    conn.close()

if __name__ == '__main__':
    migrate()



