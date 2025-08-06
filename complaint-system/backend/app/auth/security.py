import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Tuple

import bcrypt
import jwt
from fastapi import HTTPException, status

# Configuration (env-driven with safe defaults for dev)
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGO = os.getenv("JWT_ALGO", "HS256")
ACCESS_TTL_MIN = int(os.getenv("ACCESS_TTL_MIN", "30"))
REFRESH_TTL_DAYS = int(os.getenv("REFRESH_TTL_DAYS", "14"))

if not JWT_SECRET and os.getenv("ENV", "dev") != "dev":
    raise RuntimeError("JWT_SECRET is required in non-dev environments")


# Password policy: >=10 chars, at least one upper, lower, and digit
PASSWORD_POLICY_REGEX = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$")


def validate_password_policy(password: str) -> Tuple[bool, str | None]:
    if not PASSWORD_POLICY_REGEX.match(password or ""):
        return (
            False,
            "Password must be at least 10 characters and include upper, lower, and digit",
        )
    return True, None


def hash_password(plain_password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(plain_password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _exp_in(minutes: int = 30) -> datetime:
    return _now_utc() + timedelta(minutes=minutes)


def _exp_days(days: int) -> datetime:
    return _now_utc() + timedelta(days=days)


def create_access_token(user_id: int, username: str, role: str) -> Tuple[str, int]:
    exp = _exp_in(ACCESS_TTL_MIN)
    payload = {
        "sub": str(user_id),
        "username": username,
        "role": role,
        "type": "access",
        "exp": int(exp.timestamp()),
        "iat": int(_now_utc().timestamp()),
    }
    token = jwt.encode(payload, JWT_SECRET or "dev-secret", algorithm=JWT_ALGO)
    return token, int(timedelta(minutes=ACCESS_TTL_MIN).total_seconds())


def create_refresh_token(user_id: int, jti: str | None = None) -> Tuple[str, str, datetime]:
    jti_val = jti or uuid.uuid4().hex
    exp = _exp_days(REFRESH_TTL_DAYS)
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "jti": jti_val,
        "exp": int(exp.timestamp()),
        "iat": int(_now_utc().timestamp()),
    }
    token = jwt.encode(payload, JWT_SECRET or "dev-secret", algorithm=JWT_ALGO)
    return token, jti_val, exp


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET or "dev-secret", algorithms=[JWT_ALGO])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")