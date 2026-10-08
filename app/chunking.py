import re


def split_into_paragraphs(text: str) -> list[str]:
    """
    Split text into meaningful paragraph-like blocks.
    """

    text = text.replace("\r\n", "\n").replace("\r", "\n")

    blocks = re.split(r"\n\s*\n+", text)

    return [
        block.strip()
        for block in blocks
        if block.strip()
    ]



def get_overlap_text(
    text: str,
    overlap: int,
) -> str:
    """
    Return an overlap consisting of complete sentences
    rather than cutting through a sentence.
    """

    sentences = re.split(
        r"(?<=[.!?])\s+",
        text.strip(),
    )

    selected = []

    current_length = 0

    for sentence in reversed(sentences):
        sentence_length = len(sentence)

        if (
            selected
            and current_length + sentence_length + 1 > overlap
        ):
            break

        selected.insert(0, sentence)
        current_length += sentence_length + 1

    return " ".join(selected).strip()




def chunk_text(
    text: str,
    chunk_size: int = 1200,
    overlap: int = 200,
) -> list[str]:
    """
    Split text into chunks while trying to preserve paragraph boundaries.

    The chunker first groups complete paragraphs together.
    If a paragraph is too large, it is split by sentences/words.
    """

    if not text.strip():
        return []

    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive.")

    if overlap < 0 or overlap >= chunk_size:
        raise ValueError(
            "overlap must be >= 0 and smaller than chunk_size."
        )

    paragraphs = split_into_paragraphs(text)

    chunks = []
    current = ""

    for paragraph in paragraphs:

        # If adding this paragraph still fits,
        # keep it together.
        if len(current) + len(paragraph) + 2 <= chunk_size:
            if current:
                current += "\n\n"
            current += paragraph
            continue

        # Save the current chunk.
        if current:
            chunks.append(current.strip())

        # If the paragraph itself is too large,
        # split it further.
        if len(paragraph) > chunk_size:
            pieces = split_large_text(
                paragraph,
                chunk_size,
            )

            chunks.extend(pieces[:-1])
            current = pieces[-1]
        else:
            current = paragraph

    if current.strip():
        chunks.append(current.strip())

    # Add sentence-aware overlap between neighboring chunks.
    if overlap > 0 and len(chunks) > 1:
        overlapped_chunks = [chunks[0]]

        for i in range(1, len(chunks)):
            previous = chunks[i - 1]

            overlap_text = get_overlap_text(
                previous,
                overlap,
            )

            if overlap_text:
                combined = (
                    overlap_text
                    + "\n\n"
                    + chunks[i]
                )
            else:
                combined = chunks[i]

            overlapped_chunks.append(combined)

        chunks = overlapped_chunks

    return chunks


def split_large_text(
    text: str,
    chunk_size: int,
) -> list[str]:
    """
    Split an oversized paragraph using sentence boundaries first,
    then words when necessary.
    """

    sentences = re.split(
        r"(?<=[.!?])\s+",
        text.strip(),
    )

    chunks = []
    current = ""

    for sentence in sentences:

        if len(sentence) > chunk_size:
            if current:
                chunks.append(current.strip())
                current = ""

            words = sentence.split()
            word_chunk = ""

            for word in words:
                candidate = (
                    f"{word_chunk} {word}".strip()
                )

                if len(candidate) <= chunk_size:
                    word_chunk = candidate
                else:
                    if word_chunk:
                        chunks.append(
                            word_chunk.strip()
                        )

                    word_chunk = word

            if word_chunk:
                current = word_chunk

        elif len(current) + len(sentence) + 1 <= chunk_size:
            if current:
                current += " "

            current += sentence

        else:
            chunks.append(current.strip())
            current = sentence

    if current.strip():
        chunks.append(current.strip())

    return chunks


def chunk_pages(
    page_texts: list[str],
    chunk_size: int = 1200,
    overlap: int = 200,
) -> list[dict]:
    """
    Chunk each PDF page independently while preserving page numbers.
    """

    chunks = []
    global_chunk_id = 0

    for page_number, page_text in enumerate(
        page_texts,
        start=1,
    ):
        page_chunks = chunk_text(
            page_text,
            chunk_size=chunk_size,
            overlap=overlap,
        )

        for chunk in page_chunks:
            chunks.append(
                {
                    "chunk_id": global_chunk_id,
                    "page_number": page_number,
                    "text": chunk,
                }
            )

            global_chunk_id += 1

    return chunks