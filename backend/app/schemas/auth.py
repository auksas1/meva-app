from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class DevAccount(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    role: str
