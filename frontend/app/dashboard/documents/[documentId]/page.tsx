"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────

type DocInfo = {
  id: string;
  filename: string;
  created_at: string;
};

type ConversationSummary = {
  id: string;
  document_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type Source = {
  chunk_id: number;
  page_number: number;
  similarity: number;
  text: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: Source[];
  streaming?: boolean;
  error?: string;
};

import { API_URL } from "@/lib/apiConfig";

// ─── Inline Markdown Renderer ─────────────────────────────────────────────────
// Safe inline renderer with zero external dependencies and zero dangerouslySetInnerHTML.
// Supports **bold**, *italic*, headings (#, ##, ###), lists (- or 1.), and paragraphs.

function MarkdownLine({ line }: { line: string }) {
  const parts: React.ReactNode[] = [];
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(line)) !== null) {
    if (m.index > last) parts.push(line.slice(last, m.index));
    if (m[2]) parts.push(<strong key={m.index}>{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={m.index}>{m[3]}</em>);
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return <>{parts}</>;
}

function MarkdownBlock({ text }: { text: string }) {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  function flushList() {
    if (!listItems.length) return;
    if (listType === "ul") {
      nodes.push(
        <ul key={nodes.length} className="my-2 space-y-1 pl-5 text-sm leading-7 text-[#30364A]">
          {listItems.map((item, i) => (
            <li key={i} className="list-disc">
              <MarkdownLine line={item} />
            </li>
          ))}
        </ul>
      );
    } else {
      nodes.push(
        <ol key={nodes.length} className="my-2 space-y-1 pl-5 text-sm leading-7 text-[#30364A]">
          {listItems.map((item, i) => (
            <li key={i} className="list-decimal">
              <MarkdownLine line={item} />
            </li>
          ))}
        </ol>
      );
    }
    listItems = [];
    listType = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // Headings
    const h3 = trimmed.match(/^###\s+(.*)/);
    const h2 = trimmed.match(/^##\s+(.*)/);
    const h1 = trimmed.match(/^#\s+(.*)/);
    if (h3 || h2 || h1) {
      flushList();
      const content = (h1 || h2 || h3)![1];
      const cls = h1
        ? "mt-4 mb-1 text-base font-bold text-[#20263A]"
        : h2
        ? "mt-3 mb-1 text-sm font-bold text-[#20263A]"
        : "mt-2 mb-0.5 text-sm font-semibold text-[#30364A]";
      nodes.push(
        <p key={i} className={cls}>
          <MarkdownLine line={content} />
        </p>
      );
      continue;
    }

    // Unordered list
    const ulMatch = trimmed.match(/^[-*]\s+(.*)/);
    if (ulMatch) {
      if (listType === "ol") flushList();
      listType = "ul";
      listItems.push(ulMatch[1]);
      continue;
    }

    // Ordered list
    const olMatch = trimmed.match(/^\d+\.\s+(.*)/);
    if (olMatch) {
      if (listType === "ul") flushList();
      listType = "ol";
      listItems.push(olMatch[1]);
      continue;
    }

    // Blank line
    if (!trimmed) {
      flushList();
      nodes.push(<div key={`br-${i}`} className="my-1" />);
      continue;
    }

    // Regular line
    flushList();
    nodes.push(
      <p key={i} className="text-sm leading-7 text-[#30364A]">
        <MarkdownLine line={trimmed} />
      </p>
    );
  }
  flushList();
  return <div className="space-y-0.5">{nodes}</div>;
}

// ─── Relevance Badge Component ────────────────────────────────────────────────

function RelevanceLabel({ similarity }: { similarity: number }) {
  let label: string;
  let cls: string;
  if (similarity >= 0.78) {
    label = "High relevance";
    cls = "text-[#347A58] bg-[#F1FBF5] border-[#CDEBD9]";
  } else if (similarity >= 0.70) {
    label = "Good match";
    cls = "text-[#6366F1] bg-[#F0F0FF] border-[#DCDFF0]";
  } else {
    label = "Related source";
    cls = "text-[#737B8F] bg-[#F7F7FC] border-[#E8E9EE]";
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${cls}`}>
      {label}
    </span>
  );
}

// ─── Polished Source Card (Milestone 7) ───────────────────────────────────────

function SourceCard({
  source,
  index,
  isTop,
  filename,
}: {
  source: Source;
  index: number;
  isTop: boolean;
  filename: string;
}) {
  const [open, setOpen] = useState(false);
  const cleanText = source.text.replace(/^.*?Page \d+\s*/i, "").trim();
  const excerpt = cleanText.length > 170 ? cleanText.slice(0, 167) + "…" : cleanText;

  return (
    <div
      className={`overflow-hidden rounded-xl border transition-all ${
        isTop
          ? "border-[#A5A8F8] bg-[#FAFAFF] shadow-sm shadow-[#6366F1]/10"
          : "border-[#E8E9EE] bg-white hover:border-[#D0D4E4]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {isTop && (
            <span className="rounded-full bg-[#6366F1] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Top source
            </span>
          )}
          <span className="text-xs font-bold text-[#30364A]">
            Source {index + 1}
          </span>
          <span className="text-[#D0D3DC]">·</span>
          <span className="rounded-md bg-[#FFF0F0] px-2 py-0.5 text-xs font-semibold text-[#FF5757]">
            Page {source.page_number}
          </span>
          <span className="text-[#D0D3DC]">·</span>
          <RelevanceLabel similarity={source.similarity} />
        </div>

        <button
          onClick={() => setOpen((prev) => !prev)}
          className="text-[11px] font-semibold text-[#6366F1] transition hover:text-[#4F46E5]"
          aria-expanded={open}
        >
          {open ? "Show less ↑" : "Show excerpt ↓"}
        </button>
      </div>

      <div className="border-t border-[#F0F1F6] px-4 py-2.5 bg-white/60">
        <div className="flex items-center gap-1.5 text-[11px] text-[#8A90A0]">
          <span>📄</span>
          <span className="truncate max-w-[260px] font-medium sm:max-w-md">{filename}</span>
          <span>(Page {source.page_number})</span>
        </div>
      </div>

      {!open ? (
        <p className="px-4 pb-3.5 pt-1 text-xs leading-5 text-[#596176] line-clamp-2">
          &ldquo;{excerpt}&rdquo;
        </p>
      ) : (
        <div className="border-t border-[#E8E9EE] bg-[#FDFDFE] px-4 py-3.5">
          <p className="whitespace-pre-wrap text-xs leading-6 text-[#30364A]">
            {cleanText}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Thinking Animation ───────────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="h-2 w-2 animate-pulse rounded-full bg-[#6366F1]" />
      <span className="h-2 w-2 animate-pulse rounded-full bg-[#6366F1] [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-pulse rounded-full bg-[#6366F1] [animation-delay:300ms]" />
      <span className="ml-1 text-xs font-medium text-[#8A90A0]">Retrieving and reasoning…</span>
    </div>
  );
}

// ─── Main Document Page ───────────────────────────────────────────────────────

function DocumentPageContent() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;

  const [document, setDocument] = useState<DocInfo | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [asking, setAsking] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  // Load document & conversation list
  useEffect(() => {
    async function init() {
      try {
        const meRes = await fetch(`${API_URL}/api/v1/auth/me`, { credentials: "include" });
        if (!meRes.ok) {
          router.replace("/login");
          return;
        }

        const docsRes = await fetch(`${API_URL}/api/v1/documents`, { credentials: "include" });
        if (!docsRes.ok) throw new Error("Failed to load documents.");
        const docsData = await docsRes.json();
        const found = (docsData.documents || []).find((d: DocInfo) => d.id === documentId);
        if (!found) {
          router.replace("/dashboard");
          return;
        }
        setDocument(found);

        // Load conversations
        const convsRes = await fetch(`${API_URL}/api/v1/documents/${documentId}/conversations`, {
          credentials: "include",
        });

        if (convsRes.ok) {
          const convsData = await convsRes.json();
          const list: ConversationSummary[] = convsData.conversations || [];
          setConversations(list);

          if (list.length > 0) {
            setActiveConversationId(list[0].id);
          } else {
            // Automatically create the initial conversation
            const createRes = await fetch(`${API_URL}/api/v1/documents/${documentId}/conversations`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ title: "New conversation" }),
            });
            if (createRes.ok) {
              const newConv = await createRes.json();
              setConversations([newConv]);
              setActiveConversationId(newConv.id);
            }
          }
        }
      } catch (err) {
        console.error("Init error:", err);
        setGlobalError("Unable to load document conversations.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [documentId, router]);

  // Load messages whenever activeConversationId changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    async function loadConvMessages() {
      setLoadingMessages(true);
      try {
        const res = await fetch(`${API_URL}/api/v1/conversations/${activeConversationId}`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          const rawMsgs = data.messages || [];
          setMessages(
            rawMsgs.map((m: { id: string; role: "user" | "assistant"; content: string; sources: Source[] }) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              sources: m.sources || [],
              streaming: false,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load conversation messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    }

    loadConvMessages();
  }, [activeConversationId]);

  // Handle creating a new conversation
  async function handleNewConversation() {
    if (asking) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/documents/${documentId}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: "New conversation" }),
      });
      if (res.ok) {
        const newConv = await res.json();
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        setMessages([]);
      }
    } catch (err) {
      console.error("Create conversation failed:", err);
    }
  }

  // Handle deleting a conversation
  async function handleDeleteConversation(e: React.MouseEvent, convId: string) {
    e.stopPropagation();
    if (asking) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/conversations/${convId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        const updated = conversations.filter((c) => c.id !== convId);
        setConversations(updated);
        if (activeConversationId === convId) {
          if (updated.length > 0) {
            setActiveConversationId(updated[0].id);
          } else {
            handleNewConversation();
          }
        }
      }
    } catch (err) {
      console.error("Delete conversation failed:", err);
    }
  }

  // Ask question with streaming & persistent storage
  async function handleAsk(event?: React.FormEvent) {
    event?.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || asking || !activeConversationId) return;

    setGlobalError("");
    setAsking(true);
    setQuestion("");

    const tempUserId = `user-${Date.now()}`;
    const tempAssistantId = `assistant-${Date.now()}`;

    // Immediately reflect the user message & empty assistant placeholder in state
    setMessages((prev) => [
      ...prev,
      {
        id: tempUserId,
        role: "user",
        content: trimmed,
        sources: [],
      },
      {
        id: tempAssistantId,
        role: "assistant",
        content: "",
        sources: [],
        streaming: true,
      },
    ]);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const formData = new FormData();
      formData.append("question", trimmed);

      const res = await fetch(`${API_URL}/api/v1/conversations/${activeConversationId}/messages`, {
        method: "POST",
        credentials: "include",
        body: formData,
        signal: abort.signal,
      });

      if (!res.ok) {
        let detail = "Failed to get an answer.";
        try {
          const errData = await res.json();
          detail = errData.detail || detail;
        } catch { /* ignore */ }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempAssistantId ? { ...m, streaming: false, error: detail } : m
          )
        );
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const block of events) {
          const eventLine = block.match(/^event:\s*(.+)$/m)?.[1]?.trim();
          const dataLine = block.match(/^data:\s*(.+)$/m)?.[1]?.trim();
          if (!eventLine || !dataLine) continue;

          let payload: Record<string, unknown>;
          try {
            payload = JSON.parse(dataLine);
          } catch {
            continue;
          }

          if (eventLine === "token") {
            const tokenText = (payload.text as string) || "";
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempAssistantId ? { ...m, content: m.content + tokenText } : m
              )
            );
          } else if (eventLine === "sources") {
            const srcList = (payload.sources as Source[]) || [];
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempAssistantId ? { ...m, sources: srcList } : m
              )
            );
          } else if (eventLine === "error") {
            const detail = (payload.detail as string) || "An error occurred.";
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempAssistantId ? { ...m, streaming: false, error: detail } : m
              )
            );
          } else if (eventLine === "done") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempAssistantId ? { ...m, streaming: false } : m
              )
            );
          }
        }
      }

      // Refresh conversation title if needed
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConversationId && c.title === "New conversation") {
            const newTitle = trimmed.length <= 45 ? trimmed : trimmed.slice(0, 42) + "...";
            return { ...c, title: newTitle };
          }
          return c;
        })
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("Streaming error:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempAssistantId
            ? { ...m, streaming: false, error: "Connection interrupted. Please try again." }
            : m
        )
      );
    } finally {
      setAsking(false);
      abortRef.current = null;
    }
  }

  function handleRetry(failedQuestion: string) {
    setQuestion(failedQuestion);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F7FC] px-5">
        <p className="text-sm font-medium text-[#737B8F]">Loading document and conversations…</p>
      </main>
    );
  }

  if (!document) return null;

  return (
    <main className="min-h-screen bg-[#F7F7FC] text-[#20263A]">
      {/* Top Navigation */}
      <header className="border-b border-[#E8E9EE] bg-white sticky top-0 z-10">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex shrink-0 items-center gap-2 text-sm font-medium text-[#596176] transition hover:text-[#6366F1]"
          >
            <span className="text-lg">←</span>
            <span className="hidden sm:inline">Back to documents</span>
            <span className="sm:hidden">Back</span>
          </button>
          <img src="/logo.png" alt="DocuMind" className="h-8 w-auto object-contain" />
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
        {/* Document Header Banner */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E8E9EE] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF0F0] text-xs font-bold text-[#FF6363] sm:h-12 sm:w-12 sm:text-sm">
              PDF
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-[#20263A] sm:text-xl">
                {document.filename}
              </h1>
              <p className="mt-0.5 text-xs text-[#8A90A0]">
                {conversations.length} conversation{conversations.length === 1 ? "" : "s"} · Persistent across sessions
              </p>
            </div>
          </div>

          <button
            onClick={handleNewConversation}
            disabled={asking}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#6366F1] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4F46E5] disabled:opacity-50"
          >
            <span>+</span>
            <span>New conversation</span>
          </button>
        </div>

        {/* 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Conversation Sidebar (Desktop) & Switcher (Mobile) */}
          <aside className="lg:col-span-1">
            <div className="rounded-2xl border border-[#E8E9EE] bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#8A90A0]">
                  Conversations
                </h2>
                <span className="rounded-full bg-[#F0F1F6] px-2 py-0.5 text-[10px] font-semibold text-[#596176]">
                  {conversations.length}
                </span>
              </div>

              {conversations.length === 0 ? (
                <p className="py-4 text-center text-xs text-[#A2A7B3]">No conversations yet.</p>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-[460px] overflow-y-auto pr-0.5">
                  {conversations.map((c) => {
                    const isActive = c.id === activeConversationId;
                    return (
                      <div
                        key={c.id}
                        onClick={() => !asking && setActiveConversationId(c.id)}
                        className={`group relative flex cursor-pointer items-center justify-between rounded-xl p-3 text-left transition ${
                          isActive
                            ? "bg-[#6366F1] text-white shadow-sm"
                            : "hover:bg-[#F7F7FC] text-[#30364A]"
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className={`truncate text-xs font-medium ${isActive ? "text-white" : "text-[#20263A]"}`}>
                            {c.title}
                          </p>
                          <p className={`text-[10px] mt-0.5 ${isActive ? "text-indigo-200" : "text-[#8A90A0]"}`}>
                            {new Date(c.updated_at).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDeleteConversation(e, c.id)}
                          title="Delete conversation"
                          className={`shrink-0 rounded-lg p-1.5 text-xs transition ${
                            isActive
                              ? "text-indigo-200 hover:bg-white/20 hover:text-white"
                              : "text-[#C0C3CC] hover:bg-[#FFF0F0] hover:text-[#FF6363] opacity-0 group-hover:opacity-100"
                          }`}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          {/* Active Conversation Main Q&A Area */}
          <section className="lg:col-span-3">
            <div className="overflow-hidden rounded-2xl border border-[#E8E9EE] bg-white shadow-sm flex flex-col min-h-[580px]">
              {/* Header */}
              <div className="border-b border-[#E8E9EE] px-5 py-4">
                <h3 className="truncate text-sm font-bold text-[#20263A] sm:text-base">
                  {conversations.find((c) => c.id === activeConversationId)?.title || "Document Q&A"}
                </h3>
                <p className="mt-0.5 text-xs text-[#737B8F]">
                  Answers are grounded strictly in excerpts from <span className="font-medium text-[#20263A]">{document.filename}</span>.
                </p>
              </div>

              {/* Message List */}
              <div className="flex-1 px-4 py-6 sm:px-6 sm:py-7 overflow-y-auto">
                {loadingMessages ? (
                  <div className="flex min-h-[300px] items-center justify-center">
                    <p className="text-xs font-medium text-[#8A90A0]">Loading messages…</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex min-h-[350px] flex-col items-center justify-center px-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8E9FF] text-2xl">
                      ✦
                    </div>
                    <h4 className="mt-4 text-base font-bold text-[#20263A]">
                      Start a conversation
                    </h4>
                    <p className="mt-1.5 max-w-md text-xs leading-5 text-[#8A90A0]">
                      Ask anything about this PDF. Responses will stream in real-time and remain saved to your account.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {messages.map((msg, index) => {
                      if (msg.role === "user") {
                        return (
                          <div key={msg.id || index} className="flex justify-end">
                            <div className="max-w-[88%] rounded-2xl rounded-br-sm bg-[#6366F1] px-4 py-3 text-sm leading-6 text-white sm:max-w-[75%] shadow-sm">
                              {msg.content}
                            </div>
                          </div>
                        );
                      }

                      // Assistant Response
                      return (
                        <div key={msg.id || index} className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8E9FF] text-sm text-[#6366F1]">
                            ✦
                          </div>

                          <div className="min-w-0 flex-1 space-y-4">
                            <div className="rounded-2xl rounded-tl-sm bg-[#F7F7FC] px-4 py-4 border border-[#EAEBf2]">
                              {msg.streaming && !msg.content ? (
                                <ThinkingDots />
                              ) : msg.error ? (
                                <div className="space-y-3">
                                  <p className="text-xs text-[#D64545] font-medium">{msg.error}</p>
                                  {index > 0 && messages[index - 1]?.role === "user" && (
                                    <button
                                      onClick={() => handleRetry(messages[index - 1].content)}
                                      className="rounded-lg border border-[#FFD6D6] bg-white px-3 py-1.5 text-xs font-semibold text-[#D64545] transition hover:bg-[#FFF5F5]"
                                    >
                                      ↺ Retry question
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="relative">
                                  <MarkdownBlock text={msg.content} />
                                  {msg.streaming && (
                                    <span className="ml-1 inline-block h-4 w-1 animate-pulse rounded-full bg-[#6366F1] align-middle" />
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Milestone 7 Source Cards */}
                            {!msg.streaming && !msg.error && msg.sources && msg.sources.length > 0 && (
                              <div className="space-y-2 pt-1">
                                <p className="text-xs font-bold uppercase tracking-wider text-[#8A90A0]">
                                  Retrieved Sources ({msg.sources.length})
                                </p>
                                <div className="space-y-2.5">
                                  {msg.sources.map((src, sIdx) => (
                                    <SourceCard
                                      key={`${src.chunk_id}-${sIdx}`}
                                      source={src}
                                      index={sIdx}
                                      isTop={sIdx === 0}
                                      filename={document.filename}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              {/* Global Error Notice */}
              {globalError && (
                <div className="px-5 pb-3">
                  <div className="rounded-xl border border-[#FFD6D6] bg-[#FFF5F5] px-4 py-2.5 text-xs text-[#D64545]">
                    {globalError}
                  </div>
                </div>
              )}

              {/* Input Form */}
              <div className="border-t border-[#E8E9EE] bg-white p-4 sm:p-5">
                <form onSubmit={handleAsk} className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={asking || !activeConversationId}
                    placeholder="Ask a question about this document…"
                    className="min-w-0 flex-1 rounded-xl border border-[#E2E4EA] bg-white px-4 py-3.5 text-sm text-[#20263A] outline-none transition placeholder:text-[#A2A7B3] focus:border-[#818CF8] focus:ring-4 focus:ring-[#6366F1]/10 disabled:bg-[#F7F7FC]"
                  />
                  <button
                    type="submit"
                    disabled={!question.trim() || asking || !activeConversationId}
                    className="rounded-xl bg-[#6366F1] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#4F46E5] disabled:cursor-not-allowed disabled:opacity-50 sm:shrink-0"
                  >
                    {asking ? "Answering…" : "Send"}
                  </button>
                </form>
                <p className="mt-2 text-[11px] text-[#A2A7B3]">
                  All conversations and citations are saved to your account.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function DocumentPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F7F7FC] px-5">
          <p className="text-sm font-medium text-[#737B8F]">Loading document…</p>
        </main>
      }
    >
      <DocumentPageContent />
    </Suspense>
  );
}