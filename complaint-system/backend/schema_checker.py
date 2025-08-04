#!/usr/bin/env python3
"""
SQLite Schema Checker

Dependencies:
- Standard library only (sqlite3, argparse, json, os, sys, typing)
- Optional: PyYAML (pip install pyyaml) if you want to load expected schema from YAML

Purpose:
1) Connects to a SQLite database using environment variables or default path.
2) Introspects and prints a structured summary of schema: tables, columns, types, nullable, defaults, PKs, uniques, FKs, indexes.
3) Compares the live schema to an expected schema (inline dict or from JSON/YAML when provided).
4) Returns non-zero exit code if mismatches are found; zero otherwise.
5) --format text|json, and --tables <comma-separated> to limit checks.

Environment variables:
- DB_ENGINE (must be 'sqlite3' for this checker; default: sqlite3)
- DB_PATH (path to SQLite file; default: 'database/complaints.db' resolved from repo root)
- EXPECTED_SCHEMA_FILE (optional: .json or .yaml/.yml)
- DB_SCHEMA (ignored for sqlite; present for API symmetry)

Usage examples:
  python complaint-system/backend/schema_checker.py --format text
  python complaint-system/backend/schema_checker.py --format json --tables complaints,companies
"""

import os
import sys
import json
import argparse
import sqlite3
from typing import Dict, Any, List, Optional

# Optional YAML support if user already has PyYAML, otherwise we avoid a hard dependency.
try:
    import yaml  # type: ignore
except Exception:
    yaml = None  # pragma: no cover


def env_or_default(name: str, default: Optional[str] = None) -> str:
    val = os.getenv(name, default)
    if val is None:
        raise SystemExit(f"ERROR: Missing required environment variable: {name}")
    return val


def resolve_db_path() -> str:
    # Allow override via DB_PATH; default to repo-level database/complaints.db
    db_path = os.getenv("DB_PATH")
    if not db_path:
        # Resolve relative to CWD; workspace root contains the 'database' dir
        db_path = os.path.join("database", "complaints.db")
    return db_path


def load_expected_schema(explicit_path: Optional[str]) -> Dict[str, Any]:
    """
    Load expected schema representation.
    Priority:
      1) If explicit_path provided and exists, load it (JSON or YAML).
      2) Else if EXPECTED_SCHEMA_FILE env is set, load it.
      3) Otherwise fall back to built-in minimal expected structure (empty).
    """
    path = explicit_path or os.getenv("EXPECTED_SCHEMA_FILE")
    if path and os.path.exists(path):
        lower = path.lower()
        try:
            with open(path, "r", encoding="utf-8") as f:
                if lower.endswith(".json"):
                    return json.load(f)
                elif lower.endswith(".yaml") or lower.endswith(".yml"):
                    if yaml is None:
                        raise SystemExit("ERROR: YAML expected schema provided but PyYAML not installed. Install pyyaml or use JSON.")
                    return yaml.safe_load(f) or {}
                else:
                    raise SystemExit("ERROR: EXPECTED_SCHEMA_FILE must be .json, .yaml, or .yml")
        except Exception as e:
            raise SystemExit(f"ERROR: Failed to load expected schema from {path}: {e}")
    # Default empty expected schema; users can update this structure as needed.
    return {
        "tables": {
            # Example target (edit for your project):
            # "companies": {
            #   "columns": {
            #       "id": {"type": "INTEGER", "nullable": False, "default": None},
            #       "name": {"type": "TEXT", "nullable": False, "default": None},
            #   },
            #   "primary_key": ["id"],
            #   "unique_constraints": [["name"]],
            #   "foreign_keys": [],
            #   "indexes": [{"name": "idx_companies_name", "columns": ["name"], "unique": False}]
            # }
        }
    }


def connect_sqlite(db_path: str) -> sqlite3.Connection:
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        # Ensure foreign keys PRAGMA visibility (for completeness)
        try:
            conn.execute("PRAGMA foreign_keys = ON")
        except Exception:
            pass
        return conn
    except sqlite3.OperationalError as e:
        raise SystemExit(f"ERROR: Failed to open SQLite database at {db_path}: {e}")
    except Exception as e:
        raise SystemExit(f"ERROR: Unexpected error opening SQLite database at {db_path}: {e}")


def fetch_schema_sqlite(conn: sqlite3.Connection, limit_tables: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Introspect SQLite schema.
    Returns a dict:
    {
      "tables": {
        "table_name": {
          "columns": { "col": {"type": "...", "nullable": bool, "default": "..."} },
          "primary_key": ["col1", ...],
          "unique_constraints": [["colA"], ["colB","colC"]],
          "foreign_keys": [{"columns":[...], "ref_table":"..", "ref_columns":[...], "on_update":"..", "on_delete":".."}],
          "indexes": [{"name":"...", "columns":["..."], "unique": bool}]
        }, ...
      }
    }
    """
    cur = conn.cursor()
    # tables
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    all_tables = [r["name"] for r in cur.fetchall()]
    if limit_tables:
        tables = [t for t in all_tables if t in set(limit_tables)]
    else:
        tables = all_tables

    result: Dict[str, Any] = {"tables": {}}

    for t in tables:
        # columns
        cur.execute(f"PRAGMA table_info('{t}')")
        cols_rows = cur.fetchall()
        columns: Dict[str, Dict[str, Any]] = {}
        # Construct PK list in order of 'pk' (if multiple, order by pk sequence > 0)
        pk_cols: List[str] = [r["name"] for r in cols_rows if r["pk"]]
        for r in cols_rows:
            columns[r["name"]] = {
                "type": r["type"],
                "nullable": (r["notnull"] == 0),
                "default": r["dflt_value"],
            }

        # unique constraints are not directly exposed; attempt to infer from indexes with 'unique=1'
        cur.execute(f"PRAGMA index_list('{t}')")
        idx_list = [dict(row) for row in cur.fetchall()]
        indexes: List[Dict[str, Any]] = []
        unique_constraints: List[List[str]] = []

        for idx in idx_list:
            idx_name = idx["name"]
            is_unique = bool(idx.get("unique", 0))
            # get indexed columns
            cur.execute(f"PRAGMA index_info('{idx_name}')")
            idx_cols = [x["name"] for x in cur.fetchall()]
            indexes.append({"name": idx_name, "columns": idx_cols, "unique": is_unique})
            if is_unique and idx_cols:
                unique_constraints.append(idx_cols)

        # foreign keys
        cur.execute(f"PRAGMA foreign_key_list('{t}')")
        fk_rows = [dict(row) for row in cur.fetchall()]
        # Group by 'id' to handle multi-column FKs
        fks_grouped: Dict[int, Dict[str, Any]] = {}
        for fr in fk_rows:
            fid = fr["id"]
            g = fks_grouped.setdefault(
                fid,
                {
                    "columns": [],
                    "ref_table": fr.get("table"),
                    "ref_columns": [],
                    "on_update": fr.get("on_update"),
                    "on_delete": fr.get("on_delete"),
                },
            )
            g["columns"].append(fr.get("from"))
            g["ref_columns"].append(fr.get("to"))
        foreign_keys = list(fks_grouped.values())

        result["tables"][t] = {
            "columns": columns,
            "primary_key": pk_cols,
            "unique_constraints": unique_constraints,
            "foreign_keys": foreign_keys,
            "indexes": indexes,
        }

    return result


def compare_schema(expected: Dict[str, Any], actual: Dict[str, Any], limit_tables: Optional[List[str]] = None) -> Dict[str, Any]:
    """Computes diffs between expected and actual schema."""
    diffs: Dict[str, Any] = {"missing_tables": [], "extra_tables": [], "tables": {}}

    exp_tables = expected.get("tables", {})
    act_tables = actual.get("tables", {})

    exp_set = set(exp_tables.keys())
    act_set = set(act_tables.keys())

    if limit_tables:
        exp_set = exp_set.intersection(set(limit_tables))
        act_set = act_set.intersection(set(limit_tables))

    missing_tables = sorted(list(exp_set - act_set))
    extra_tables = sorted(list(act_set - exp_set))
    diffs["missing_tables"] = missing_tables
    diffs["extra_tables"] = extra_tables

    common = exp_set.intersection(act_set)
    for t in sorted(common):
        tdiff: Dict[str, Any] = {}

        exp_cols = exp_tables[t].get("columns", {})
        act_cols = act_tables[t].get("columns", {})

        exp_col_set = set(exp_cols.keys())
        act_col_set = set(act_cols.keys())

        tdiff["missing_columns"] = sorted(list(exp_col_set - act_col_set))
        tdiff["extra_columns"] = sorted(list(act_col_set - exp_col_set))

        # Column property mismatches
        col_mismatches = {}
        for c in sorted(exp_col_set.intersection(act_col_set)):
            exp_c = exp_cols[c]
            act_c = act_cols[c]
            mismatches = {}
            # Normalize types and defaults to string for comparison simplicity
            for key in ("type", "nullable", "default"):
                if str(exp_c.get(key)) != str(act_c.get(key)):
                    mismatches[key] = {"expected": exp_c.get(key), "actual": act_c.get(key)}
            if mismatches:
                col_mismatches[c] = mismatches
        tdiff["column_mismatches"] = col_mismatches

        # PK compare
        exp_pk = exp_tables[t].get("primary_key", [])
        act_pk = act_tables[t].get("primary_key", [])
        if list(exp_pk) != list(act_pk):
            tdiff["primary_key_mismatch"] = {"expected": exp_pk, "actual": act_pk}

        # Unique constraints compare (as sorted sets of columns)
        def normalize_uniques(uniques: List[List[str]]) -> List[List[str]]:
            return sorted([sorted(u) for u in uniques])

        exp_uniques = normalize_uniques(exp_tables[t].get("unique_constraints", []))
        act_uniques = normalize_uniques(act_tables[t].get("unique_constraints", []))
        if exp_uniques != act_uniques:
            tdiff["unique_constraints_mismatch"] = {"expected": exp_uniques, "actual": act_uniques}

        # Foreign keys compare (ignore constraint names; compare shape)
        def normalize_fks(fks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
            norm = []
            for fk in fks:
                norm.append({
                    "columns": list(fk.get("columns", [])),
                    "ref_table": fk.get("ref_table"),
                    "ref_columns": list(fk.get("ref_columns", [])),
                    "on_update": fk.get("on_update"),
                    "on_delete": fk.get("on_delete"),
                })
            return sorted(norm, key=lambda x: (tuple(x["columns"]), x["ref_table"] or "", tuple(x["ref_columns"])))

        exp_fks = normalize_fks(exp_tables[t].get("foreign_keys", []))
        act_fks = normalize_fks(act_tables[t].get("foreign_keys", []))
        if exp_fks != act_fks:
            tdiff["foreign_keys_mismatch"] = {"expected": exp_fks, "actual": act_fks}

        # Index compare (ignore order; compare name, columns, uniqueness)
        def normalize_indexes(indexes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
            norm = []
            for idx in indexes:
                norm.append({
                    "name": idx.get("name"),
                    "columns": sorted(list(idx.get("columns", []))),
                    "unique": bool(idx.get("unique", False)),
                })
            return sorted(norm, key=lambda x: (x["name"] or "", tuple(x["columns"]), x["unique"]))

        exp_indexes = normalize_indexes(exp_tables[t].get("indexes", []))
        act_indexes = normalize_indexes(act_tables[t].get("indexes", []))
        if exp_indexes != act_indexes:
            tdiff["indexes_mismatch"] = {"expected": exp_indexes, "actual": act_indexes}

        # Keep tdiff if any content, else mark ok
        has_any = any(
            tdiff.get(k)
            for k in (
                "missing_columns", "extra_columns", "column_mismatches",
                "primary_key_mismatch", "unique_constraints_mismatch",
                "foreign_keys_mismatch", "indexes_mismatch"
            )
        )
        if has_any:
            diffs["tables"][t] = tdiff
        else:
            diffs["tables"][t] = {"ok": True}

    return diffs


def print_text_report(actual: Dict[str, Any], diffs: Dict[str, Any]) -> None:
    def section(title: str):
        print("=" * len(title))
        print(title)
        print("=" * len(title))

    section("Actual Schema Overview (SQLite)")
    for t, meta in actual.get("tables", {}).items():
        print(f"\nTable: {t}")
        cols = meta.get("columns", {})
        for c, cmeta in cols.items():
            print(f"  - {c}: type={cmeta.get('type')} nullable={cmeta.get('nullable')} default={cmeta.get('default')}")
        print(f"  PK: {meta.get('primary_key')}")
        if meta.get("unique_constraints"):
            print(f"  Unique: {meta.get('unique_constraints')}")
        if meta.get("foreign_keys"):
            print(f"  FKs: {meta.get('foreign_keys')}")
        if meta.get("indexes"):
            print(f"  Indexes:")
            for idx in meta.get("indexes", []):
                print(f"    * {idx.get('name')}: columns={idx.get('columns')} unique={idx.get('unique')}")

    section("Diffs vs Expected")
    if diffs.get("missing_tables"):
        print(f"Missing tables: {diffs['missing_tables']}")
    if diffs.get("extra_tables"):
        print(f"Extra tables: {diffs['extra_tables']}")
    for t, tdiff in diffs.get("tables", {}).items():
        if tdiff.get("ok"):
            print(f"[OK] {t}")
            continue
        print(f"[DIFF] {t}")
        for key in ("missing_columns", "extra_columns", "column_mismatches",
                    "primary_key_mismatch", "unique_constraints_mismatch",
                    "foreign_keys_mismatch", "indexes_mismatch"):
            if tdiff.get(key):
                print(f"  - {key}: {tdiff[key]}")


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Validate live SQLite DB schema against expected specification.")
    parser.add_argument("--format", choices=["text", "json"], default="text", help="Output format")
    parser.add_argument("--tables", type=str, help="Comma-separated list of tables to limit checks")
    parser.add_argument("--expected", type=str, help="Path to expected schema JSON or YAML")
    args = parser.parse_args(argv)

    engine = os.getenv("DB_ENGINE", "sqlite3").lower()
    if engine != "sqlite3":
        sys.stderr.write(f"ERROR: This checker is configured for sqlite3 only. Set DB_ENGINE=sqlite3 (got: {engine}).\n")
        return 2

    db_path = resolve_db_path()
    if not os.path.exists(db_path):
        sys.stderr.write(f"ERROR: SQLite database not found at: {db_path}\n")
        return 2

    # Restrict tables if requested
    limit_tables = [t.strip() for t in args.tables.split(",")] if args.tables else None

    # Connect and introspect
    try:
        conn = connect_sqlite(db_path)
    except SystemExit as e:
        sys.stderr.write(str(e) + "\n")
        return 2

    try:
        actual = fetch_schema_sqlite(conn, limit_tables=limit_tables)
    except sqlite3.OperationalError as e:
        sys.stderr.write(f"ERROR: Failed to introspect schema: {e}\n")
        try:
            conn.close()
        except Exception:
            pass
        return 2
    finally:
        try:
            conn.close()
        except Exception:
            pass

    # Load expected
    expected = load_expected_schema(args.expected)

    # Compare
    diffs = compare_schema(expected, actual, limit_tables=limit_tables)

    # Output
    if args.format == "json":
        print(json.dumps({"actual": actual, "diffs": diffs}, indent=2))
    else:
        print_text_report(actual, diffs)

    # Exit code: non-zero if any diffs detected
    has_diffs = bool(diffs.get("missing_tables") or diffs.get("extra_tables") or any(
        (v for t, v in diffs.get("tables", {}).items() if not v.get("ok"))
    ))
    return 1 if has_diffs else 0


if __name__ == "__main__":
    sys.exit(main())
