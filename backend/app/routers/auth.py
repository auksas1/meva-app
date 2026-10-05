import re

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.auth import bearer_scheme, current_user, hash_password, issue_token, load_seed_users, normalize_email, verify_password
from app.config import settings
from app.database import get_db
from app.models.user import AuthSession, User
from app.schemas.auth import AuthResponse, DevAccount, LoginRequest, RegisterRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])

_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
_MIN_PASSWORD_LENGTH = 6


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    email = normalize_email(body.email)
    if not _EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    if len(body.password) < _MIN_PASSWORD_LENGTH:
        raise HTTPException(status_code=400, detail=f"Password must be at least {_MIN_PASSWORD_LENGTH} characters.")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    name = (body.name or "").strip() or None
    user = User(email=email, password_hash=hash_password(body.password), name=name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return AuthResponse(token=issue_token(db, user), user=user)


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == normalize_email(body.email)).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    if user.is_blocked:
        raise HTTPException(status_code=403, detail="Account blocked")
    return AuthResponse(token=issue_token(db, user), user=user)


@router.post("/logout", status_code=204)
def logout(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    if creds:
        db.query(AuthSession).filter(AuthSession.token == creds.credentials).delete()
        db.commit()


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(current_user)):
    return user


@router.get("/dev-accounts", response_model=list[DevAccount])
def dev_accounts():
    """Seed credentials for the mobile dev quick-login menu. Off when DEV_MODE=false."""
    if not settings.dev_mode:
        raise HTTPException(status_code=404, detail="Not found")
    return load_seed_users()
