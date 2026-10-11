
import os

import psycopg
from dotenv import load_dotenv




import hashlib
import json
import uuid


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


def get_connection():
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is not configured in the .env file."
        )

    return psycopg.connect(DATABASE_URL)


def check_database_connection() -> bool:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
            result = cursor.fetchone()

    return result == (1,)




def get_document_hash(content: bytes) -> str:
    """Return a SHA-256 hash of the PDF bytes."""
    return hashlib.sha256(content).hexdigest()


class DuplicateDocumentError(Exception):
    """Raised when a document cannot be saved because another user owns identical content."""
    pass


def get_document_by_content_hash(content_hash: str) -> dict | None:
    """
    Lookup a document by its content hash.
    Return document metadata and chunk count if found, otherwise None.
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT d.id, d.filename, d.user_id, COUNT(c.chunk_id)
                FROM documents d
                LEFT JOIN document_chunks c ON c.document_id = d.id
                WHERE d.content_hash = %s
                GROUP BY d.id, d.filename, d.user_id;
                """,
                (content_hash,),
            )
            row = cursor.fetchone()
            if not row:
                return None

            return {
                "id": str(row[0]),
                "filename": row[1],
                "user_id": str(row[2]),
                "chunk_count": int(row[3]),
            }


def save_document(
    filename: str,
    content_hash: str,
    chunks: list[dict],
    user_id: str,
) -> str:
    """
    Save a document and its chunks to PostgreSQL.
    Return the document UUID as a string.

    If a document with the same content hash already exists:
    - If owned by the same user, return the existing document id.
    - If owned by a different user, raise DuplicateDocumentError.
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            # Check if a document with identical content already exists.
            cursor.execute(
                """
                SELECT id, user_id
                FROM documents
                WHERE content_hash = %s;
                """,
                (content_hash,),
            )
            existing = cursor.fetchone()

            if existing:
                existing_id, existing_user_id = existing
                if str(existing_user_id) == str(user_id):
                    return str(existing_id)
                raise DuplicateDocumentError(
                    "A document with this identical content already exists."
                )

            document_id = uuid.uuid4()

            try:
                cursor.execute(
                    """
                    INSERT INTO documents (
                        id,
                        filename,
                        content_hash,
                        user_id
                    )
                    VALUES (%s, %s, %s, %s);
                    """,
                    (
                        document_id,
                        filename,
                        content_hash,
                        user_id,
                    ),
                )
            except psycopg.errors.UniqueViolation:
                # Concurrent upload race condition: another transaction committed first
                connection.rollback()
                with connection.cursor() as retry_cursor:
                    retry_cursor.execute(
                        """
                        SELECT id, user_id
                        FROM documents
                        WHERE content_hash = %s;
                        """,
                        (content_hash,),
                    )
                    race_existing = retry_cursor.fetchone()
                    if race_existing:
                        existing_id, existing_user_id = race_existing
                        if str(existing_user_id) == str(user_id):
                            return str(existing_id)
                raise DuplicateDocumentError(
                    "A document with this identical content already exists."
                )

            for chunk in chunks:
                embedding = chunk["embedding"]

                # pgvector accepts vector values in textual form.
                embedding_value = "[" + ",".join(
                    str(float(value)) for value in embedding
                ) + "]"

                cursor.execute(
                    """
                    INSERT INTO document_chunks (
                        document_id,
                        chunk_id,
                        page_number,
                        content,
                        embedding
                    )
                    VALUES (%s, %s, %s, %s, %s::vector);
                    """,
                    (
                        document_id,
                        chunk["chunk_id"],
                        chunk["page_number"],
                        chunk["text"],
                        embedding_value,
                    ),
                )

    return str(document_id)


def load_document_chunks(document_id: str) -> list[dict]:
    """Load a document's chunks and embeddings from PostgreSQL."""
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT chunk_id, page_number, content, embedding::text
                FROM document_chunks
                WHERE document_id = %s
                ORDER BY chunk_id;
                """,
                (document_id,),
            )

            rows = cursor.fetchall()

    chunks = []

    for chunk_id, page_number, content, embedding_text in rows:
        chunks.append({
            "chunk_id": chunk_id,
            "page_number": page_number,
            "text": content,
            "embedding": json.loads(embedding_text),
        })

    return chunks





def list_documents(user_id: str) -> list[dict]:
    """
    Return metadata for all stored documents.
    Do not return document chunks or embeddings.
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, filename, created_at
                FROM documents
                WHERE user_id = %s
                ORDER BY created_at DESC;
                """,
                (user_id,),
            )
            rows = cursor.fetchall()

    return [
        {
            "id": str(document_id),
            "filename": filename,
            "created_at": created_at.isoformat(),
        }
        for document_id, filename, created_at in rows
    ]





def delete_document(
    document_id: str,
    user_id: str,
) -> bool:
    """
    Delete a document by its UUID.
    Associated chunks are deleted automatically through
    the ON DELETE CASCADE foreign-key constraint.

    Returns True if a document was deleted, otherwise False.
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                DELETE FROM documents
                WHERE id = %s
                AND user_id = %s
                RETURNING id;
                """,
                (document_id, user_id),
            )
            deleted = cursor.fetchone()

    return deleted is not None





def document_exists(
    document_id: str,
    user_id: str,
) -> bool:
    """
    Check whether a document exists and belongs to the given user.
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT 1
                FROM documents
                WHERE id = %s
                  AND user_id = %s;
                """,
                (document_id, user_id),
            )

            return cursor.fetchone() is not None



def search_similar_chunks(
    document_id: str,
    user_id: str,
    query_embedding: list[float],
    top_k: int = 20,
) -> list[dict]:
    """
    Retrieve the most similar chunks directly from PostgreSQL
    using pgvector cosine distance.
    """
    embedding_value = "[" + ",".join(
        str(float(value)) for value in query_embedding
    ) + "]"

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    chunk_id,
                    page_number,
                    content,
                    embedding::text,
                    1 - (embedding <=> %s::vector) AS similarity
                FROM document_chunks
                WHERE document_id = %s
                AND EXISTS (
                    SELECT 1
                    FROM documents
                    WHERE documents.id = document_chunks.document_id
                        AND documents.user_id = %s
                )
                ORDER BY embedding <=> %s::vector
                LIMIT %s;
                """,
                (
                    embedding_value,
                    document_id,
                    user_id,
                    embedding_value,
                    top_k,
                ),
            )

            rows = cursor.fetchall()

    chunks = []

    for (
        chunk_id,
        page_number,
        content,
        embedding_text,
        similarity,
    ) in rows:
        chunks.append({
            "chunk_id": chunk_id,
            "page_number": page_number,
            "text": content,
            "embedding": json.loads(embedding_text),
            "similarity": float(similarity),
        })

    return chunks





def create_user(
    name: str,
    email: str,
    password_hash: str,
) -> dict:
    """
    Create a new user and return basic user information.
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO users (name, email, password_hash)
                VALUES (%s, LOWER(TRIM(%s)), %s)
                RETURNING id, name, email;
                """,
                (name, email, password_hash),
            )

            user_id, user_name, user_email = cursor.fetchone()

    return {
        "id": str(user_id),
        "name": user_name,
        "email": user_email,
    }


def get_user_by_email(email: str):
    """
    Find a user by email address.
    Returns None if the user does not exist.
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, name, email, password_hash
                FROM users
                WHERE email = LOWER(TRIM(%s));
                """,
                (email,),
            )

            row = cursor.fetchone()

    if not row:
        return None

    user_id, name, email, password_hash = row

    return {
        "id": str(user_id),
        "name": name,
        "email": email,
        "password_hash": password_hash,
    }


def get_user_by_id(user_id: str):
    """
    Find a user by UUID.
    Returns None if the user does not exist.
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, name, email
                FROM users
                WHERE id = %s;
                """,
                (user_id,),
            )

            row = cursor.fetchone()

    if not row:
        return None

    user_id, name, email = row

    return {
        "id": str(user_id),
        "name": name,
        "email": email,
    }


def create_session(
    user_id: str,
    token_hash: str,
    expires_at,
) -> None:
    """
    Store a hashed session token for a user.
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO sessions (
                    user_id,
                    token_hash,
                    expires_at
                )
                VALUES (%s, %s, %s);
                """,
                (user_id, token_hash, expires_at),
            )


def get_user_by_session_token(token_hash: str):
    """
    Find the user associated with a valid session token.
    Returns None if the session is invalid or expired.
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    u.id,
                    u.name,
                    u.email
                FROM sessions s
                JOIN users u
                    ON u.id = s.user_id
                WHERE s.token_hash = %s
                  AND s.expires_at > NOW();
                """,
                (token_hash,),
            )

            row = cursor.fetchone()

    if not row:
        return None

    user_id, name, email = row

    return {
        "id": str(user_id),
        "name": name,
        "email": email,
    }


def delete_session(token_hash: str) -> None:
    """
    Delete a session using its hashed token.
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                DELETE FROM sessions
                WHERE token_hash = %s;
                """,
                (token_hash,),
            )


# ---------------------------------------------------------------------------
# Conversations and Messages
# ---------------------------------------------------------------------------

def create_conversation(
    user_id: str,
    document_id: str,
    title: str,
) -> dict:
    """
    Create a new conversation for a document belonging to user_id.
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO conversations (
                    user_id,
                    document_id,
                    title
                )
                VALUES (%s, %s, %s)
                RETURNING id, user_id, document_id, title, created_at, updated_at;
                """,
                (user_id, document_id, title),
            )
            row = cursor.fetchone()
            connection.commit()

    conv_id, u_id, doc_id, c_title, created_at, updated_at = row
    return {
        "id": str(conv_id),
        "user_id": str(u_id),
        "document_id": str(doc_id),
        "title": c_title,
        "created_at": created_at.isoformat(),
        "updated_at": updated_at.isoformat(),
    }


def list_conversations(
    user_id: str,
    document_id: str,
) -> list[dict]:
    """
    List conversations for a document owned by user_id, sorted by updated_at DESC.
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    id,
                    document_id,
                    title,
                    created_at,
                    updated_at
                FROM conversations
                WHERE user_id = %s
                  AND document_id = %s
                ORDER BY updated_at DESC;
                """,
                (user_id, document_id),
            )
            rows = cursor.fetchall()

    return [
        {
            "id": str(c_id),
            "document_id": str(doc_id),
            "title": c_title,
            "created_at": created_at.isoformat(),
            "updated_at": updated_at.isoformat(),
        }
        for c_id, doc_id, c_title, created_at, updated_at in rows
    ]


def get_conversation(
    conversation_id: str,
    user_id: str,
) -> dict | None:
    """
    Get a conversation and its messages if owned by user_id.
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    id,
                    document_id,
                    title,
                    created_at,
                    updated_at
                FROM conversations
                WHERE id = %s
                  AND user_id = %s;
                """,
                (conversation_id, user_id),
            )
            conv_row = cursor.fetchone()
            if not conv_row:
                return None

            cursor.execute(
                """
                SELECT
                    id,
                    role,
                    content,
                    sources,
                    created_at
                FROM messages
                WHERE conversation_id = %s
                ORDER BY created_at ASC;
                """,
                (conversation_id,),
            )
            msg_rows = cursor.fetchall()

    c_id, doc_id, c_title, created_at, updated_at = conv_row
    messages = [
        {
            "id": str(m_id),
            "role": role,
            "content": content,
            "sources": sources if sources is not None else [],
            "created_at": m_created.isoformat(),
        }
        for m_id, role, content, sources, m_created in msg_rows
    ]

    return {
        "id": str(c_id),
        "document_id": str(doc_id),
        "title": c_title,
        "created_at": created_at.isoformat(),
        "updated_at": updated_at.isoformat(),
        "messages": messages,
    }


def delete_conversation(
    conversation_id: str,
    user_id: str,
) -> bool:
    """
    Delete a conversation owned by user_id. Cascades to messages.
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                DELETE FROM conversations
                WHERE id = %s
                  AND user_id = %s
                RETURNING id;
                """,
                (conversation_id, user_id),
            )
            deleted = cursor.fetchone()
            connection.commit()

    return deleted is not None


def add_message(
    conversation_id: str,
    role: str,
    content: str,
    sources: list[dict] | None = None,
) -> dict:
    """
    Add a message to a conversation and touch updated_at on the conversation.
    """
    sources_json = json.dumps(sources) if sources is not None else None
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO messages (
                    conversation_id,
                    role,
                    content,
                    sources
                )
                VALUES (%s, %s, %s, %s)
                RETURNING id, conversation_id, role, content, sources, created_at;
                """,
                (conversation_id, role, content, sources_json),
            )
            msg_row = cursor.fetchone()

            cursor.execute(
                """
                UPDATE conversations
                SET updated_at = NOW()
                WHERE id = %s;
                """,
                (conversation_id,),
            )
            connection.commit()

    m_id, conv_id, m_role, m_content, m_sources, created_at = msg_row
    return {
        "id": str(m_id),
        "conversation_id": str(conv_id),
        "role": m_role,
        "content": m_content,
        "sources": m_sources if m_sources is not None else [],
        "created_at": created_at.isoformat(),
    }


def update_conversation_title(
    conversation_id: str,
    title: str,
) -> None:
    """
    Update title of a conversation.
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE conversations
                SET title = %s
                WHERE id = %s;
                """,
                (title, conversation_id),
            )
            connection.commit()


def get_dashboard_stats(user_id: str) -> dict:
    """
    Compute workspace dashboard statistics for the given user:
    - documents_count: total documents owned by this user
    - questions_count: total user questions asked in this user's conversations
    - last_activity_at: timestamp of the most recent message, falling back to
      the most recent conversation created_at, or None if no activity exists.
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    (SELECT COUNT(*) FROM documents WHERE user_id = %(user_id)s) AS documents_count,
                    (SELECT COUNT(*)
                     FROM messages m
                     JOIN conversations c ON m.conversation_id = c.id
                     WHERE c.user_id = %(user_id)s
                       AND m.role = 'user') AS questions_count,
                    (SELECT MAX(m.created_at)
                     FROM messages m
                     JOIN conversations c ON m.conversation_id = c.id
                     WHERE c.user_id = %(user_id)s) AS latest_message_at,
                    (SELECT MAX(c.created_at)
                     FROM conversations c
                     WHERE c.user_id = %(user_id)s) AS latest_conversation_at;
                """,
                {"user_id": user_id},
            )
            row = cursor.fetchone()

    if row:
        documents_count, questions_count, latest_message_at, latest_conversation_at = row
    else:
        documents_count, questions_count, latest_message_at, latest_conversation_at = 0, 0, None, None

    latest_activity = latest_message_at or latest_conversation_at
    if latest_activity is not None:
        last_activity_at = (
            latest_activity.isoformat()
            if hasattr(latest_activity, "isoformat")
            else str(latest_activity)
        )
    else:
        last_activity_at = None

    return {
        "documents_count": int(documents_count or 0),
        "questions_count": int(questions_count or 0),
        "last_activity_at": last_activity_at,
    }

