import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Request, Response
from pwdlib import PasswordHash

from app.database import (
    create_session,
    delete_session,
    get_user_by_email,
    get_user_by_session_token,
)


password_hash = PasswordHash.recommended()


SESSION_COOKIE_NAME = "documind_session"
SESSION_DAYS = 7


def hash_password(password: str) -> str:
    """
    Hash a password using Argon2.
    """
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against its Argon2 hash.
    """
    return password_hash.verify(password, hashed_password)


def generate_session_token() -> str:
    """
    Generate a cryptographically secure random session token.
    """
    return secrets.token_urlsafe(48)


def hash_session_token(token: str) -> str:
    """
    Hash the session token before storing it in the database.
    """
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


def create_user_session(user_id: str) -> str:
    """
    Create a new session for a user.

    The raw token is returned to the caller so it can be
    stored in the user's HttpOnly cookie.

    Only the SHA-256 hash is stored in PostgreSQL.
    """
    token = generate_session_token()

    token_hash = hash_session_token(token)

    expires_at = (
        datetime.now(timezone.utc)
        + timedelta(days=SESSION_DAYS)
    )

    create_session(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
    )

    return token


def set_session_cookie(
    response: Response,
    token: str,
) -> None:
    """
    Store the session token in an HttpOnly cookie.
    """
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=SESSION_DAYS * 24 * 60 * 60,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    """
    Remove the authentication cookie.
    """
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
    )


def get_current_user(request: Request) -> dict:
    """
    Read the session cookie and return the logged-in user.

    Raises HTTP 401 if the user is not authenticated.
    """
    token = request.cookies.get(SESSION_COOKIE_NAME)

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated.",
        )

    token_hash = hash_session_token(token)

    user = get_user_by_session_token(token_hash)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Session expired or invalid.",
        )

    return user


def logout_user(request: Request) -> None:
    """
    Delete the current user's session from the database.
    """
    token = request.cookies.get(SESSION_COOKIE_NAME)

    if not token:
        return

    token_hash = hash_session_token(token)

    delete_session(token_hash)