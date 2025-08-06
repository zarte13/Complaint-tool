from datetime import datetime
from pydantic import BaseModel, Field, constr


# Request schemas
class LoginRequest(BaseModel):
    username: constr(strip_whitespace=True, min_length=3, max_length=150)
    password: constr(min_length=10)  # policy enforced further (upper/lower/digit)


# Response schemas
class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(..., description="Access token lifetime in seconds")


class UserOut(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class RefreshRequest(BaseModel):
    refresh_token: str


class AuthLogEntry(BaseModel):
    username: str
    success: bool
    reason: str | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)