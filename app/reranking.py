import concurrent.futures
import gc
import math
import logging
import threading
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from sentence_transformers import CrossEncoder

logger = logging.getLogger("app.reranking")

RERANKER_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"

# ms-marco CrossEncoder outputs raw logits (unbounded). We use -5.0 as a safety net
# that only rejects clearly irrelevant chunks.
MIN_RERANK_SCORE = -5.0

# Resource bounding for 512MB RAM instance:
# Rerank at most top 16 candidates (twice the context chunk count of 8)
# to keep memory footprint and CPU inference time strictly bounded.
MAX_RERANK_INPUT_CHUNKS = 16
RERANK_BATCH_SIZE = 4
RERANK_TIMEOUT_SECONDS = 6.0

_reranker = None
_reranker_failed = False
_reranker_lock = threading.Lock()


def get_reranker() -> Optional["CrossEncoder"]:
    """
    Load the cross-encoder lazily with thread-safety and bounded CPU threads.
    If loading fails or OOMs, marks _reranker_failed = True to avoid
    repeating expensive failures on subsequent requests.
    """
    global _reranker, _reranker_failed

    if _reranker is not None:
        return _reranker
    if _reranker_failed:
        return None

    with _reranker_lock:
        if _reranker is not None:
            return _reranker
        if _reranker_failed:
            return None

        try:
            # Enforce single-threaded PyTorch to prevent memory arenas per CPU core
            import torch
            torch.set_num_threads(1)
            torch.set_num_interop_threads(1)
        except Exception:
            pass

        try:
            logger.info("Initializing CrossEncoder model", extra={"event": "cross_encoder_init_started"})
            from sentence_transformers import CrossEncoder
            # Bound sequence length to 256 to limit activation tensor sizes on 512MB RAM
            _reranker = CrossEncoder(RERANKER_MODEL, max_length=256)
            logger.info("CrossEncoder model initialized successfully", extra={"event": "cross_encoder_init_completed"})
            return _reranker
        except Exception as exc:
            _reranker_failed = True
            logger.warning(
                "CrossEncoder failed to load; using lightweight semantic MMR fallback",
                extra={"event": "cross_encoder_init_failed", "error": str(exc)},
                exc_info=True,
            )
            return None


def _cosine(left: list[float], right: list[float]) -> float:
    if not left or not right or len(left) != len(right):
        return 0.0
    left_norm = math.sqrt(sum(value * value for value in left))
    right_norm = math.sqrt(sum(value * value for value in right))
    if not left_norm or not right_norm:
        return 0.0
    return sum(a * b for a, b in zip(left, right)) / (left_norm * right_norm)


def _semantic_mmr_selection(
    candidates: list[dict],
    top_k: int,
) -> list[dict]:
    """
    Greedy MMR combining relevance with semantic novelty and query coverage.
    Uses candidate['rerank_score'] (or similarity/rrf_score) as relevance.
    """
    if not candidates:
        return []

    # Ensure all candidates have a float rerank_score
    for chunk in candidates:
        if "rerank_score" not in chunk:
            chunk["rerank_score"] = float(chunk.get("similarity", chunk.get("rrf_score", 0.0)))

    scores = [item["rerank_score"] for item in candidates]
    low = min(scores, default=0.0)
    high = max(scores, default=1.0)

    selected = []
    covered_queries: set[int] = set()
    remaining = list(candidates)

    while remaining and len(selected) < top_k:
        best_item = None
        best_utility = float("-inf")
        for item in remaining:
            relevance = (item["rerank_score"] - low) / (high - low) if high > low else 1.0
            embedding = item.get("embedding", [])
            redundancy = max(
                (_cosine(embedding, chosen.get("embedding", [])) for chosen in selected),
                default=0.0,
            )
            query_ids = {index for index in item.get("retrieved_by", []) if index >= 0}
            new_query_ids = query_ids - covered_queries
            coverage = 0.3 if new_query_ids else 0.0
            utility = 0.75 * relevance - 0.25 * max(0.0, redundancy) + coverage
            if utility > best_utility:
                best_item, best_utility = item, utility

        if best_item is None:
            break

        selected.append(best_item)
        remaining.remove(best_item)
        covered_queries.update(
            index for index in best_item.get("retrieved_by", []) if index >= 0
        )

    return selected


def _fallback_semantic_rerank(
    chunks: list[dict],
    top_k: int,
) -> list[dict]:
    """
    Lightweight, bounded fallback that selects relevant chunks using
    vector similarities and MMR without loading any neural network models.
    """
    sorted_chunks = sorted(
        chunks,
        key=lambda item: item.get("rrf_score", item.get("similarity", 0.0)),
        reverse=True,
    )
    for item in sorted_chunks:
        if "rerank_score" not in item:
            item["rerank_score"] = float(item.get("similarity", item.get("rrf_score", 0.0)))

    selected = _semantic_mmr_selection(sorted_chunks[:MAX_RERANK_INPUT_CHUNKS], top_k=top_k)
    logger.info("Semantic MMR fallback completed", extra={
        "event": "semantic_fallback_completed",
        "input_count": len(chunks),
        "selected_count": len(selected),
        "selected_ids": [item["chunk_id"] for item in selected],
    })
    return selected


def rerank_chunks(
    question: str,
    chunks: list[dict],
    top_k: int = 8,
    score_gap: float = 5.0,
    min_score: float = MIN_RERANK_SCORE,
) -> list[dict]:
    """
    Rerank retrieved chunks using a cross-encoder with bounded resource usage
    and a lightweight semantic fallback.
    """
    if not question.strip():
        raise ValueError("Question must not be empty.")

    if top_k <= 0:
        raise ValueError("top_k must be positive.")

    if min_score < float("-inf"):
        raise ValueError("min_score must be a valid number.")

    if score_gap < 0:
        raise ValueError("score_gap must not be negative.")

    if not chunks:
        return []

    # Bound candidate count to prevent memory explosion on 512MB RAM
    bounded_chunks = chunks[:MAX_RERANK_INPUT_CHUNKS]

    reranker = get_reranker()
    if reranker is None:
        return _fallback_semantic_rerank(bounded_chunks, top_k=top_k)

    pairs = [
        (question.strip(), chunk["text"])
        for chunk in bounded_chunks
    ]

    try:
        import torch

        def _predict_pairs():
            with torch.inference_mode():
                return reranker.predict(
                    pairs,
                    batch_size=RERANK_BATCH_SIZE,
                    show_progress_bar=False,
                )

        # Protect against hanging inference with ThreadPoolExecutor timeout
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_predict_pairs)
            raw_scores = future.result(timeout=RERANK_TIMEOUT_SECONDS)

    except (concurrent.futures.TimeoutError, Exception) as exc:
        logger.warning(
            "CrossEncoder prediction timed out or failed; falling back to semantic MMR",
            extra={"event": "cross_encoder_prediction_failed", "error": str(exc)},
            exc_info=True,
        )
        return _fallback_semantic_rerank(bounded_chunks, top_k=top_k)
    finally:
        del pairs
        gc.collect()

    reranked = []
    for chunk, score in zip(bounded_chunks, raw_scores):
        reranked.append({
            **chunk,
            "rerank_score": float(score),
        })

    reranked.sort(
        key=lambda item: item["rerank_score"],
        reverse=True,
    )

    # Hard safety floor
    above_floor = [item for item in reranked if item["rerank_score"] >= min_score]

    # Soft distribution-aware pruning
    if above_floor:
        score_high = above_floor[0]["rerank_score"]
        score_low = above_floor[-1]["rerank_score"]
        score_range = score_high - score_low
        if score_range > 0:
            threshold = score_high - 0.60 * score_range
            soft_filtered = [item for item in above_floor if item["rerank_score"] >= threshold]
            relevant = soft_filtered if len(soft_filtered) >= top_k else above_floor[:max(top_k, len(soft_filtered))]
        else:
            relevant = above_floor
    else:
        relevant = []

    selected = _semantic_mmr_selection(relevant, top_k=top_k)

    logger.info("CrossEncoder reranking and MMR selection completed", extra={
        "event": "reranking_selection_completed",
        "top_candidate_scores": [
            {"chunk_id": item["chunk_id"], "score": round(item["rerank_score"], 4)}
            for item in reranked[:10]
        ],
        "selected_ids": [item["chunk_id"] for item in selected],
        "selected_pages": sorted({item.get("page_number") for item in selected}),
    })
    return selected

