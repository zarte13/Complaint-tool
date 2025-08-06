#!/usr/bin/env python3
"""
CLI utility to create users in the auth users.db

Usage examples:
  python -m backend.scripts.create_user --username admin --password "Str0ngPassw0rd!" --role admin
  python -m backend.scripts.create_user -u johndoe -p "An0therStrong!" -r user

Environment variables:
  USERS_DATABASE_URL (optional): override users DB location (defaults to sqlite:///./backend/database/users.db)
  JWT_SECRET (required in non-dev): required for token routines, but not used here directly
  ENV=dev to skip strict secret requirement
"""

import argparse
import os
import sys
from datetime import datetime, timezone

# Ensure imports work regardless of invocation cwd
# Supports:
#  - repo root: python -m complaint-system.backend.scripts.create_user ...
#  - complaint-system dir: python -m backend.scripts.create_user ...
#  - backend dir: python scripts/create_user.py ...
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
REPO_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
COMPLAINT_SYSTEM_DIR = os.path.basename(REPO_ROOT).lower()

# Prefer adding backend dir so "app.*" is importable
for p in (BACKEND_DIR, REPO_ROOT):
    if p not in sys.path:
        sys.path.insert(0, p)

from sqlalchemy.orm import Session  # type: ignore

from app.database.users_db import UsersBase, users_engine, UsersSessionLocal
from app.auth.models import User
from app.auth.security import hash_password, validate_password_policy


def init_db():
    """Create users/auth tables if they don't exist."""
    UsersBase.metadata.create_all(bind=users_engine)


def create_user(username: str, password: str, role: str = "user", is_active: bool = True) -> int:
    ok, reason = validate_password_policy(password)
    if not ok:
        raise ValueError(f"Password policy failed: {reason}")

    username_l = username.strip().lower()
    if not username_l:
        raise ValueError("Username cannot be empty")

    if role not in ("admin", "user"):
        raise ValueError("Role must be 'admin' or 'user'")

    init_db()

    with UsersSessionLocal() as db:  # type: Session
        existing = db.query(User).filter(User.username == username_l).first()
        if existing:
            raise ValueError(f"User '{username_l}' already exists")

        user = User(
            username=username_l,
            password_hash=hash_password(password),
            role=role,
            is_active=is_active,
            failed_login_count=0,
            last_failed_login_at=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user.id


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create a user in users.db")
    parser.add_argument("-u", "--username", required=True, help="Username (will be lowercased)")
    parser.add_argument("-p", "--password", required=True, help="Password (>=10 chars, upper/lower/digit)")
    parser.add_argument("-r", "--role", default="user", choices=["admin", "user"], help="User role")
    parser.add_argument("--inactive", action="store_true", help="Create as inactive")
    return parser.parse_args()


def main():
    args = parse_args()
    try:
        user_id = create_user(
            username=args.username,
            password=args.password,
            role=args.role,
            is_active=not args.inactive,
        )
        print(f"Created user id={user_id}, username='{args.username.lower()}', role={args.role}, active={not args.inactive}")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()