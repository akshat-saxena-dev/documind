# DocuMind

DocuMind is a production-oriented document intelligence and RAG application that allows users to upload documents, ask questions about them, and receive source-grounded answers with page-level references.

It combines structure-aware document chunking, semantic vector retrieval, CrossEncoder reranking, Gemini-powered generation, persistent conversations, authentication, and streaming responses into a single full-stack application.

---

## Features

- 📄 Document upload and processing
- 🧩 Structure-aware document chunking
- 🔎 Semantic vector search using PostgreSQL + pgvector
- 🎯 CrossEncoder-based reranking
- 🤖 Gemini-powered answer generation
- 📚 Source-grounded answers with page references
- ✨ Streaming AI responses using Server-Sent Events (SSE)
- 💬 Persistent conversations and message history
- 🔐 User authentication with server-side sessions
- 👤 Per-user document ownership and authorization
- 📊 RAG evaluation benchmark
- 📈 Dashboard with document and question statistics
- 🐳 Dockerized backend
- 🩺 Health-check endpoint
- 📱 Responsive frontend
- 🔁 Retry handling for transient AI failures

---

## Architecture

```text
                         ┌──────────────────────┐
                         │      Next.js UI      │
                         │  React + TypeScript  │
                         └──────────┬───────────┘
                                    │
                              HTTP / SSE
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      FastAPI API     │
                         │      + Sessions      │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┼────────────────┐
                    │               │                │
                    ▼               ▼                ▼
             ┌───────────┐   ┌────────────┐   ┌─────────────┐
             │ PostgreSQL│   │  Gemini AI │   │ CrossEncoder│
             │ + pgvector│   │            │   │  Reranker   │
             └─────┬─────┘   └────────────┘   └─────────────┘
                   │
                   ▼
          Documents / Chunks /
          Embeddings / Sessions /
          Conversations / Messages