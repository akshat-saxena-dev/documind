import time
import logging

from google import genai
from google.genai import types


logger = logging.getLogger("app.embeddings")


EMBEDDING_MODEL = "gemini-embedding-001"

TRANSIENT_STATUS_CODES = {429, 500, 502, 503, 504}


def generate_embeddings(
    client: genai.Client,
    texts: list[str],
    max_attempts: int = 3,
) -> list[list[float]]:
    if not texts:
        return []

    if any(not text.strip() for text in texts):
        raise ValueError("Texts must not contain empty strings.")

    if max_attempts <= 0:
        raise ValueError("max_attempts must be positive.")

    last_error = None

    for attempt in range(max_attempts):
        try:
            response = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=texts,
                config=types.EmbedContentConfig(
                    task_type="RETRIEVAL_DOCUMENT"
                ),
            )

            if not response.embeddings:
                raise RuntimeError(
                    "The embedding model returned no embeddings."
                )

            vectors = [
                embedding.values
                for embedding in response.embeddings
            ]

            if len(vectors) != len(texts):
                raise RuntimeError(
                    "The number of embeddings does not match "
                    "the input texts."
                )

            logger.info("Gemini embeddings generated", extra={
                "event": "gemini_operation_completed",
                "operation": "embed_documents", "count": len(vectors),
            })
            return vectors

        except Exception as error:
            last_error = error

            status_code = getattr(error, "status_code", None)

            if status_code not in TRANSIENT_STATUS_CODES:
                logger.exception("Gemini document embedding failed", extra={
                    "event": "gemini_operation_failed",
                    "operation": "embed_documents",
                })
                raise

            if attempt == max_attempts - 1:
                logger.exception("Gemini document embedding failed", extra={
                    "event": "gemini_operation_failed",
                    "operation": "embed_documents",
                })
                raise

            delay = 2 ** attempt

            logger.warning("Gemini embedding request will be retried", extra={
                "event": "gemini_retry", "operation": "embed_documents",
                "status": status_code, "attempt": attempt + 2,
            })

            time.sleep(delay)

    raise RuntimeError(
        "Failed to generate embeddings."
    ) from last_error


def generate_query_embedding(
    client: genai.Client,
    query: str,
    max_attempts: int = 3,
) -> list[float]:
    if not query.strip():
        raise ValueError("Query must not be empty.")

    if max_attempts <= 0:
        raise ValueError("max_attempts must be positive.")

    last_error = None

    for attempt in range(max_attempts):
        try:
            response = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=query.strip(),
                config=types.EmbedContentConfig(
                    task_type="RETRIEVAL_QUERY"
                ),
            )

            if not response.embeddings:
                raise RuntimeError(
                    "The embedding model returned no embeddings."
                )

            vector = response.embeddings[0].values
            logger.info("Gemini query embedding generated", extra={
                "event": "gemini_operation_completed", "operation": "embed_query"
            })
            return vector

        except Exception as error:
            last_error = error

            status_code = getattr(error, "status_code", None)

            if status_code not in TRANSIENT_STATUS_CODES:
                logger.exception("Gemini query embedding failed", extra={
                    "event": "gemini_operation_failed",
                    "operation": "embed_query",
                })
                raise

            if attempt == max_attempts - 1:
                logger.exception("Gemini query embedding failed", extra={
                    "event": "gemini_operation_failed",
                    "operation": "embed_query",
                })
                raise

            delay = 2 ** attempt

            logger.warning("Gemini query embedding will be retried", extra={
                "event": "gemini_retry", "operation": "embed_query",
                "status": status_code, "attempt": attempt + 2,
            })

            time.sleep(delay)

    raise RuntimeError(
        "Failed to generate query embedding."
    ) from last_error


def generate_query_embeddings(
    client: genai.Client,
    queries: list[str],
    max_attempts: int = 3,
) -> list[list[float]]:
    """Embed several retrieval queries in one Gemini API request."""
    if not queries:
        return []
    if any(not query.strip() for query in queries):
        raise ValueError("Queries must not contain empty strings.")
    if max_attempts <= 0:
        raise ValueError("max_attempts must be positive.")

    last_error = None
    for attempt in range(max_attempts):
        try:
            response = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=[query.strip() for query in queries],
                config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
            )
            if not response.embeddings or len(response.embeddings) != len(queries):
                raise RuntimeError(
                    "The number of query embeddings does not match the queries."
                )
            return [embedding.values for embedding in response.embeddings]
        except Exception as error:
            last_error = error
            status_code = getattr(error, "status_code", None)
            if status_code not in TRANSIENT_STATUS_CODES or attempt == max_attempts - 1:
                logger.exception("Gemini query embedding batch failed", extra={
                    "event": "gemini_operation_failed", "operation": "embed_queries",
                })
                raise
            time.sleep(2 ** attempt)

    raise RuntimeError("Failed to generate query embeddings.") from last_error
