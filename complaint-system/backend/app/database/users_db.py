import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Users/auth database configuration
USERS_DATABASE_URL = os.getenv("USERS_DATABASE_URL", "sqlite:///./backend/database/users.db")

# Create engine for users DB (separate from domain DB)
users_engine = create_engine(
    USERS_DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in USERS_DATABASE_URL else {}
)

# Session factory for users DB
UsersSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=users_engine)

# Base for users/auth models
UsersBase = declarative_base()


def get_users_db():
    """Dependency to get users database session"""
    db = UsersSessionLocal()
    try:
        yield db
    finally:
        db.close()