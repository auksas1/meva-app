"""Basis path tests for current_user (CC 5)."""
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.auth import current_user
from app.database import Base
from app.models.user import AuthSession, User


@pytest.fixture
def db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


def _creds(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


def _add_user(db: Session, token: str, is_blocked: bool = False) -> User:
    user = User(email="a@b.lt", password_hash="x", is_blocked=is_blocked)
    db.add(user)
    db.flush()
    db.add(AuthSession(token=token, user_id=user.id))
    db.commit()
    return user


def _status(creds, db) -> tuple[int, str]:
    with pytest.raises(HTTPException) as exc:
        current_user(creds, db)
    return exc.value.status_code, exc.value.detail


def test_missing_credentials_return_401(db):
    assert _status(None, db) == (401, "Not authenticated")


def test_unknown_token_returns_401(db):
    assert _status(_creds("unknown"), db) == (401, "Invalid or expired token")


def test_session_without_user_returns_401(db):
    db.add(AuthSession(token="orphan", user_id=999))
    db.commit()

    assert _status(_creds("orphan"), db) == (401, "Invalid or expired token")


def test_blocked_user_returns_403(db):
    _add_user(db, "tok", is_blocked=True)

    assert _status(_creds("tok"), db) == (403, "Account blocked")


def test_valid_token_returns_user(db):
    user = _add_user(db, "tok")

    assert current_user(_creds("tok"), db) is user
