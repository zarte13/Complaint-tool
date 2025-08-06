import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Users/auth database configuration
# Resolve to an absolute path under the backend working directory to avoid CWD issues.
# When running `uvicorn main:app` from complaint-system/backend, this will resolve to
# complaint-system/backend/database/users.db
DEFAULT_USERS_DB_REL = os.path.normpath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "database", "users.db"))
DEFAULT_USERS_DB_URL = f"sqlite:///{DEFAULT_USERS_DB_REL.replace(os.sep, '/')}"
USERS_DATABASE_URL = os.getenv("USERS_DATABASE_URL") or os.getenv("USERS_DB_URL") or DEFAULT_USERS_DB_URL

# Ensure the parent directory exists (sqlite will not create intermediate dirs)
users_db_dir = os.path.dirname(DEFAULT_USERS_DB_REL)
os.makedirs(users_db_dir, exist_ok=True)

# Create engine for users DB (separate from domain DB)
users_engine = create_engine(
    USERS_DATABASE_URL,
    connect_args={"check_same_thread": False} if USERS_DATABASE_URL.startswith("sqlite") else {}
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