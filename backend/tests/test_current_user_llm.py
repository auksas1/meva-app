from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.auth import current_user
from app.models.user import AuthSession, User


def make_credentials(token="valid-token"):
    return HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials=token,
    )


def test_current_user_returns_user_for_valid_session():
    db = MagicMock()
    credentials = make_credentials()
    session = MagicMock(spec=AuthSession)
    session.user_id = 42
    user = MagicMock(spec=User)
    user.is_blocked = False

    db.get.side_effect = [session, user]

    result = current_user(creds=credentials, db=db)

    assert result is user
    assert db.get.call_count == 2
    db.get.assert_any_call(AuthSession, "valid-token")
    db.get.assert_any_call(User, 42)


def test_current_user_raises_401_when_credentials_are_missing():
    db = MagicMock()

    with pytest.raises(HTTPException) as exc_info:
        current_user(creds=None, db=db)

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Not authenticated"
    db.get.assert_not_called()


def test_current_user_raises_401_when_session_does_not_exist():
    db = MagicMock()
    db.get.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        current_user(creds=make_credentials(), db=db)

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Invalid or expired token"
    db.get.assert_called_once_with(AuthSession, "valid-token")


def test_current_user_raises_401_when_session_user_does_not_exist():
    db = MagicMock()
    session = MagicMock(spec=AuthSession)
    session.user_id = 42
    db.get.side_effect = [session, None]

    with pytest.raises(HTTPException) as exc_info:
        current_user(creds=make_credentials(), db=db)

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Invalid or expired token"
    assert db.get.call_count == 2
    db.get.assert_any_call(AuthSession, "valid-token")
    db.get.assert_any_call(User, 42)


def test_current_user_raises_403_when_user_is_blocked():
    db = MagicMock()
    session = MagicMock(spec=AuthSession)
    session.user_id = 42
    user = MagicMock(spec=User)
    user.is_blocked = True
    db.get.side_effect = [session, user]

    with pytest.raises(HTTPException) as exc_info:
        current_user(creds=make_credentials(), db=db)

    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "Account blocked"
    assert db.get.call_count == 2
    db.get.assert_any_call(AuthSession, "valid-token")
    db.get.assert_any_call(User, 42)


def test_current_user_does_not_load_user_when_session_is_missing():
    db = MagicMock()
    db.get.return_value = None

    with pytest.raises(HTTPException):
        current_user(creds=make_credentials(), db=db)

    assert db.get.call_count == 1
    db.get.assert_called_once_with(AuthSession, "valid-token")


def test_current_user_does_not_query_database_when_credentials_are_missing():
    db = MagicMock()

    with pytest.raises(HTTPException):
        current_user(creds=None, db=db)

    assert db.get.call_count == 0
