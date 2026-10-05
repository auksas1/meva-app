import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import current_user, normalize_email
from app.database import get_db
from app.models.admin_audit import AdminAudit
from app.models.user import User
from app.schemas.admin import (
    AdminAuditResponse,
    AdminBlockRequest,
    AdminUserListResponse,
    AdminUserResponse,
    AdminUserUpdate,
)

router = APIRouter(prefix="/admin", tags=["admin"])

_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
_ALLOWED_ROLES = {"user", "admin"}


def require_admin(user: User = Depends(current_user)) -> User:
    """Admin-only gate used by every endpoint in this router.

    Known requirement-test gap (intentional for the university testing task):
    denied admin access attempts are not persisted to the audit table yet.
    """
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    return user


def _audit(db: Session, admin: User, action: str, target_user_id: int | None, details: str | None = None) -> None:
    db.add(
        AdminAudit(
            admin_user_id=admin.id,
            target_user_id=target_user_id,
            action=action,
            details=details,
        )
    )


@router.get("/users", response_model=AdminUserListResponse)
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    q = db.query(User)
    total = q.count()
    users = q.order_by(User.created_at.desc(), User.id.desc()).offset(skip).limit(limit).all()
    return AdminUserListResponse(items=users, total=total)


@router.get("/users/{user_id}", response_model=AdminUserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/users/{user_id}", response_model=AdminUserResponse)
def update_user(
    user_id: int,
    body: AdminUserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")

    patch = body.model_dump(exclude_unset=True)

    if "email" in patch:
        email = normalize_email(patch["email"] or "")
        if not _EMAIL_RE.match(email):
            raise HTTPException(status_code=400, detail="Please enter a valid email address.")
        duplicate = db.query(User).filter(User.email == email, User.id != user_id).first()
        if duplicate:
            raise HTTPException(status_code=409, detail="An account with this email already exists.")
        target.email = email

    if "name" in patch:
        # Intentionally incomplete for requirement-based testing:
        # empty usernames are still accepted, so the corresponding validation
        # test should expose this defect.
        target.name = patch["name"]

    if "role" in patch:
        role = (patch["role"] or "").strip().lower()
        if role not in _ALLOWED_ROLES:
            raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'.")
        if target.id == admin.id and role != "admin":
            raise HTTPException(status_code=400, detail="You cannot remove your own admin role.")
        target.role = role

    _audit(
        db,
        admin,
        "USER_UPDATED",
        target.id,
        # Known gap for tests: this records changed field names only, not
        # before/after values.
        details=",".join(sorted(patch.keys())) or "no fields",
    )
    db.commit()
    db.refresh(target)
    return target


@router.patch("/users/{user_id}/blocked", response_model=AdminUserResponse)
def set_blocked(
    user_id: int,
    body: AdminBlockRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == admin.id and body.blocked:
        raise HTTPException(status_code=400, detail="You cannot block your own account.")

    target.is_blocked = body.blocked
    _audit(db, admin, "USER_BLOCKED" if body.blocked else "USER_UNBLOCKED", target.id)
    db.commit()
    db.refresh(target)
    return target


@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account.")

    _audit(db, admin, "USER_DELETED", target.id, details=target.email)
    db.delete(target)
    db.commit()


@router.get("/audit", response_model=list[AdminAuditResponse])
def list_audit(
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return (
        db.query(AdminAudit)
        .order_by(AdminAudit.created_at.desc(), AdminAudit.id.desc())
        .limit(limit)
        .all()
    )
