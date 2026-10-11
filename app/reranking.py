import math
import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sentence_transformers import CrossEncoder

logger = logging.getLogger("app.reranking")

RERANKER_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"

# ms-marco CrossEncoder outputs raw logits (unbounded).  A fixed 0.0 floor
# aggressively discards real evidence when the query is long or multi-aspect.
# We use -5.0 as a safety net that only rejects clearly irrelevant chunks;
# soft per-call pruning based on the score distribution is applied inside
# rerank_chunks instead of this hard floor.
MIN_RERANK_SCORE = -5.0

_reranker = None

def get_reranker() -> "CrossEncoder":
    """
    Load the cross-encoder lazily.
    """

    global _reranker

    if _reranker is None:
        from sentence_transformers import CrossEncoder
        _reranker = CrossEncoder(RERANKER_MODEL)

    return _reranker


def rerank_chunks(
    question: str,
    chunks: list[dict],
    top_k: int = 8,
    score_gap: float = 5.0,
    min_score: float = MIN_RERANK_SCORE,
) -> list[dict]:
    """
    Rerank retrieved chunks using a cross-encoder.

    score_gap:
        Retained for API compatibility. Relevance is controlled by
        min_score; score gaps alone do not reject otherwise relevant chunks.
    """

    if not question.strip():
        raise ValueError(
            "Question must not be empty."
        )

    if top_k <= 0:
        raise ValueError(
            "top_k must be positive."
        )

    if min_score < float("-inf"):
        raise ValueError("min_score must be a valid number.")

    if score_gap < 0:
        raise ValueError(
            "score_gap must not be negative."
        )

    if not chunks:
        return []

    reranker = get_reranker()

    pairs = [
        (
            question.strip(),
            chunk["text"],
        )
        for chunk in chunks
    ]

    raw_scores = reranker.predict(pairs)

    reranked = []

    for chunk, score in zip(chunks, raw_scores):
        reranked.append(
            {
                **chunk,
                "rerank_score": float(score),
            }
        )

    reranked.sort(
        key=lambda item: item["rerank_score"],
        reverse=True,
    )

    # Hard safety floor: reject genuinely off-topic chunks (e.g. diabetes
    # question against a stress-management document).
    above_floor = [item for item in reranked if item["rerank_score"] >= min_score]

    # Soft distribution-aware pruning: compute score range and drop chunks
    # whose score is more than 60% below the range from the top score.
    # This is gentler than an absolute 0.0 floor and adapts to each call's
    # score distribution, so a multi-aspect question does not lose lower-
    # scoring-but-valid evidence chunks.
    if above_floor:
        score_high = above_floor[0]["rerank_score"]
        score_low = above_floor[-1]["rerank_score"]
        score_range = score_high - score_low
        if score_range > 0:
            # Keep chunks whose score is within the top 60% of the range,
            # but always keep at least top_k candidates so MMR has room.
            threshold = score_high - 0.60 * score_range
            soft_filtered = [item for item in above_floor if item["rerank_score"] >= threshold]
            relevant = soft_filtered if len(soft_filtered) >= top_k else above_floor[:max(top_k, len(soft_filtered))]
        else:
            # All scores are identical — keep all above-floor chunks
            relevant = above_floor
    else:
        relevant = []

    selected = []
    covered_queries: set[int] = set()
    rerank_scores = [item["rerank_score"] for item in relevant]
    low = min(rerank_scores, default=0.0)
    high = max(rerank_scores, default=0.0)

    def cosine(left: list[float], right: list[float]) -> float:
        if not left or not right or len(left) != len(right):
            return 0.0
        left_norm = math.sqrt(sum(value * value for value in left))
        right_norm = math.sqrt(sum(value * value for value in right))
        if not left_norm or not right_norm:
            return 0.0
        return sum(a * b for a, b in zip(left, right)) / (left_norm * right_norm)

    # Greedy MMR combines normalized cross-encoder relevance with semantic
    # novelty. A small coverage bonus favors chunks retrieved by a focused
    # query that has not yet contributed evidence.
    # NOTE: index >= 0 (not > 0) so the original query (index 0) also
    # participates in coverage tracking.
    remaining = list(relevant)
    while remaining and len(selected) < top_k:
        best_item = None
        best_utility = float("-inf")
        for item in remaining:
            relevance = (item["rerank_score"] - low) / (high - low) if high > low else 1.0
            embedding = item.get("embedding", [])
            redundancy = max(
                (cosine(embedding, chosen.get("embedding", [])) for chosen in selected),
                default=0.0,
            )
            query_ids = {index for index in item.get("retrieved_by", []) if index >= 0}
            new_query_ids = query_ids - covered_queries
            coverage = 0.3 if new_query_ids else 0.0
            utility = 0.75 * relevance - 0.25 * max(0.0, redundancy) + coverage
            if utility > best_utility:
                best_item, best_utility = item, utility

        selected.append(best_item)
        remaining.remove(best_item)
        covered_queries.update(
            index for index in best_item.get("retrieved_by", []) if index >= 0
        )

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

