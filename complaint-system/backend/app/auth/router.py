from datetime import datetime, timezone
from typing import Tuple

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.users_db import UsersBase, users_engine, get_users_db
from app.auth.models import User, RefreshToken
from app.auth.schemas import LoginRequest, TokenPair, RefreshRequest, UserOut
from app.auth.security import (
  validate_password_policy,
  verify_password,
  hash_password,
  create_access_token,
  create_refresh_token,
  decode_token,
)

# NOTE: Avoid creating tables at import time to prevent DB errors during test collection
# Tables are created by app startup scripts or explicit migrations/tests.
router = APIRouter(prefix="/auth", tags=["Auth"])


def _issue_tokens(user: User, db: Session) -> TokenPair:
    access, expires_in = create_access_token(user.id, user.username, user.role)
    refresh, jti, exp = create_refresh_token(user.id)

    db_token = RefreshToken(user_id=user.id, jti=jti, expires_at=exp, revoked=False)
    db.add(db_token)
    db.commit()

    return TokenPair(access_token=access, refresh_token=refresh, expires_in=expires_in)


# Accept both "/auth/login" and "/auth/login/" to be resilient to trailing slashes
@router.post("/login", response_model=TokenPair)
@router.post("/login/", response_model=TokenPair)
def login(payload: LoginRequest, db: Session = Depends(get_users_db)) -> TokenPair:
    # Basic password policy check to avoid timing hints; full policy enforced at creation time too
    ok, reason = validate_password_policy(payload.password)
    if not ok:
        # Do not leak policy details; still return 401 to avoid enumeration
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user: User | None = db.query(User).filter(User.username == payload.username.lower()).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not verify_password(payload.password, user.password_hash):
        # Increment failed login metrics
        user.failed_login_count = (user.failed_login_count or 0) + 1
        user.last_failed_login_at = datetime.now(timezone.utc)
        db.add(user)
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # Reset failed metrics on success
    user.failed_login_count = 0
    user.last_failed_login_at = None
    db.add(user)
    db.commit()

    return _issue_tokens(user, db)


# Accept both "/auth/refresh" and "/auth/refresh/" to be resilient to trailing slashes
@router.post("/refresh", response_model=TokenPair)
@router.post("/refresh/", response_model=TokenPair)
def refresh(payload: RefreshRequest, db: Session = Depends(get_users_db)) -> TokenPair:
    data = decode_token(payload.refresh_token)
    if data.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    sub = data.get("sub")
    jti = data.get("jti")
    if not sub or not jti:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    # Validate stored refresh token record
    record: RefreshToken | None = db.query(RefreshToken).filter(RefreshToken.jti == jti).first()
    if not record or record.revoked:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token revoked")

    if record.expires_at and datetime.now(timezone.utc) > record.expires_at:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

    user: User | None = db.query(User).filter(User.id == int(sub)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive or missing user")

    # Rotate refresh token: revoke old, issue new
    record.revoked = True
    db.add(record)
    db.commit()

    return _issue_tokens(user, db)


@router.get("/me", response_model=UserOut)
def me(db: Session = Depends(get_users_db), token_data: dict = Depends(lambda: {})) -> UserOut:
    # This endpoint is intentionally simple; clients should use bearer to call protected resources
    # If needed later, we can add a dependency to parse and return current user info.
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Not implemented")


# Utility for admin to set password hash (not exposed as API; used by script)
def _set_user_password(user: User, new_password: str) -> Tuple[bool, str | None]:
    ok, reason = validate_password_policy(new_password)
    if not ok:
        return False, reason
    user.password_hash = hash_password(new_password)
    user.updated_at = datetime.now(timezone.utc)
    return True, None