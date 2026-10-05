from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AdminUserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    role: str
    is_blocked: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminUserListResponse(BaseModel):
    items: list[AdminUserResponse]
    total: int


class AdminUserUpdate(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None


class AdminBlockRequest(BaseModel):
    blocked: bool


class AdminAuditResponse(BaseModel):
    id: int
    admin_user_id: int
    target_user_id: Optional[int] = None
    action: str
    details: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
