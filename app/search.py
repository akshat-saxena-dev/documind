import math

MIN_RELEVANCE_SCORE = 0.60

def cosine_similarity(
    vector_a: list[float],
    vector_b: list[float],
) -> float:
    """Calculate cosine similarity between two vectors."""

    if len(vector_a) != len(vector_b):
        raise ValueError("Vectors must have the same dimensions.")

    dot_product = sum(
        a * b for a, b in zip(vector_a, vector_b)
    )

    magnitude_a = math.sqrt(sum(a * a for a in vector_a))
    magnitude_b = math.sqrt(sum(b * b for b in vector_b))

    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0

    return dot_product / (magnitude_a * magnitude_b)




def search_chunks(
    query_embedding: list[float],
    chunks: list[dict],
    top_k: int = 3,
    lambda_mult: float = 0.7,
) -> list[dict]:
    """
    Retrieve relevant chunks while balancing relevance and diversity.

    lambda_mult:
        1.0 = prioritize relevance only
        0.0 = prioritize diversity only
        0.7 = balance relevance with diversity
    """

    if top_k <= 0:
        raise ValueError("top_k must be positive.")

    if not 0.0 <= lambda_mult <= 1.0:
        raise ValueError("lambda_mult must be between 0 and 1.")

    if not chunks:
        return []

    # Step 1: Calculate relevance of every chunk to the query.
    candidates = []

    for chunk in chunks:
        similarity = cosine_similarity(
            query_embedding,
            chunk["embedding"],
        )

        candidates.append({
            **chunk,
            "similarity": similarity,
        })

    # Step 2: Filter out chunks that are not sufficiently relevant.
    min_relevance_score = MIN_RELEVANCE_SCORE

    remaining = [
        candidate
        for candidate in candidates
        if candidate["similarity"] >= MIN_RELEVANCE_SCORE
    ]

    # Step 3: Start selecting diverse, relevant chunks.
    selected = []

    while remaining and len(selected) < top_k:

        best_candidate = None
        best_score = float("-inf")

        for candidate in remaining:

            relevance = candidate["similarity"]

            # Step 3: Measure redundancy against already selected chunks.
            if selected:
                redundancy = max(
                    cosine_similarity(
                        candidate["embedding"],
                        chosen["embedding"],
                    )
                    for chosen in selected
                )
            else:
                redundancy = 0.0

            # Step 4: Combine relevance and diversity.
            mmr_score = (
                lambda_mult * relevance
                - (1 - lambda_mult) * redundancy
            )

            if mmr_score > best_score:
                best_score = mmr_score
                best_candidate = candidate

        # Step 5: Add the best balanced candidate.
        selected.append(best_candidate)
        remaining.remove(best_candidate)

    # Keep the original relevance score for downstream filtering.
    return [
        {
            "chunk_id": item.get("chunk_id"),
            "page_number": item.get("page_number"),
            "text": item["text"],
            "similarity": item["similarity"],
        }
        for item in selected
    ]
