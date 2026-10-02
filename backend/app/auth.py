"""Password hashing, bearer-token dependency and seed users."""
import hashlib
import hmac
import json
import secrets
from pathlib import Path

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import AuthSession, User

SEED_USERS_FILE = Path(__file__).resolve().parents[1] / "seed_users.json"

bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return f"scrypt${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, salt_hex, digest_hex = stored.split("$")
    except ValueError:
        return False
    digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt_hex), n=2**14, r=8, p=1)
    return hmac.compare_digest(digest.hex(), digest_hex)


def normalize_email(email: str) -> str:
    return email.strip().lower()


def issue_token(db: Session, user: User) -> str:
    token = secrets.token_urlsafe(32)
    db.add(AuthSession(token=token, user_id=user.id))
    db.commit()
    return token


def current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if creds is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = db.get(AuthSession, creds.credentials)
    user = db.get(User, session.user_id) if session else None
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if user.is_blocked:
        raise HTTPException(status_code=403, detail="Account blocked")
    return user


def load_seed_users() -> list[dict]:
    return json.loads(SEED_USERS_FILE.read_text())


def seed_users(db: Session) -> None:
    """Insert seed users when the users table is empty."""
    if db.query(User).first():
        return
    for u in load_seed_users():
        db.add(User(
            email=normalize_email(u["email"]),
            password_hash=hash_password(u["password"]),
            name=u.get("name"),
            role=u.get("role", "user"),
        ))
    db.commit()
