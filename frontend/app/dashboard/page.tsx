"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
};

type Document = {
  id: string;
  filename: string;
  created_at: string;
};

type DashboardStats = {
  documents_count: number;
  questions_count: number;
  last_activity_at: string | null;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "—";

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (isNaN(diffInSeconds) || diffInSeconds < 0) {
    return "Just now";
  }

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return "Yesterday";
  }
  if (diffInDays < 30) {
    return `${diffInDays} days ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return diffInYears === 1 ? "1 year ago" : `${diffInYears} years ago`;
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const meResponse = await fetch(`${API_URL}/api/v1/auth/me`, {
          credentials: "include",
        });

        if (!meResponse.ok) {
          router.replace("/login");
          return;
        }

        const meData = await meResponse.json();
        setUser(meData);

        const [documentsResponse, statsResponse] = await Promise.all([
          fetch(`${API_URL}/api/v1/documents`, { credentials: "include" }),
          fetch(`${API_URL}/api/v1/dashboard/stats`, { credentials: "include" }),
        ]);

        if (documentsResponse.ok) {
          const documentsData = await documentsResponse.json();
          setDocuments(documentsData.documents || []);
        }

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  async function handleUpload() {
    if (!selectedFile) {
      return;
    }

    setUploadError("");
    setUploadSuccess("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_URL}/api/v1/documents/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadError(data.detail || "Failed to upload document.");
        return;
      }

      setUploadSuccess("Document uploaded successfully.");
      setSelectedFile(null);

      // Refresh document list and dashboard stats
      const [documentsResponse, statsResponse] = await Promise.all([
        fetch(`${API_URL}/api/v1/documents`, { credentials: "include" }),
        fetch(`${API_URL}/api/v1/dashboard/stats`, { credentials: "include" }),
      ]);

      if (documentsResponse.ok) {
        const documentsData = await documentsResponse.json();
        setDocuments(documentsData.documents || []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Upload error:", error);

      setUploadError("Unable to upload the document. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await fetch(`${API_URL}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      router.replace("/login");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F7FC]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-sm font-medium text-[#737B8F]">
            Loading your workspace...
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#F7F7FC] text-[#20263A]">
      {/* Header */}
      <header className="border-b border-[#E8E9EE] bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          {/* Logo */}
          <a href="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="DocuMind"
              className="h-10 w-auto object-contain"
            />
          </a>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[#30364A]">
                {user.name}
              </p>
              <p className="text-xs text-[#8A90A0]">{user.email}</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8E9FF] text-sm font-bold text-[#6366F1]">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl border border-[#E2E4EA] bg-white px-4 py-2.5 text-sm font-medium text-[#596176] transition hover:border-[#A5A8F8] hover:bg-[#FAFAFF] hover:text-[#6366F1] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        {/* Welcome */}
        <section className="mb-8">
          <p className="text-sm font-semibold text-[#6366F1]">Your workspace</p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#20263A] sm:text-4xl">
            Welcome back, {user.name.split(" ")[0]} 👋
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#737B8F] sm:text-base">
            Upload your documents and use AI to understand them, search them,
            and ask questions naturally.
          </p>
        </section>

        {/* Stats */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#E8E9EE] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#737B8F]">Documents</p>

                <p className="mt-2 text-3xl font-bold text-[#20263A]">
                  {stats !== null ? stats.documents_count : documents.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8E9FF] text-lg text-[#6366F1]">
                📄
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E8E9EE] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#737B8F]">
                  Questions asked
                </p>

                <p className="mt-2 text-3xl font-bold text-[#20263A]">
                  {stats !== null ? stats.questions_count : "—"}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#DFF5EA] text-lg text-[#3B8064]">
                ✦
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E8E9EE] bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#737B8F]">
                  Recent activity
                </p>

                <p className="mt-2 text-3xl font-bold text-[#20263A]">
                  {stats !== null ? formatRelativeTime(stats.last_activity_at) : "—"}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF0F0] text-lg text-[#FF6363]">
                ↗
              </div>
            </div>
          </div>
        </section>

        {/* Upload */}
        <section className="mb-8 rounded-2xl border border-[#E8E9EE] bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-[#20263A]">
              Upload a document
            </h2>

            <p className="mt-1 text-sm text-[#737B8F]">
              Add a PDF to your DocuMind workspace.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-[#DCDFF0] bg-[#FAFAFF] p-8 text-center transition hover:border-[#A5A8F8]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8E9FF] text-2xl">
              📄
            </div>

            <h3 className="mt-4 text-sm font-semibold text-[#30364A]">
              {selectedFile ? selectedFile.name : "Choose a PDF document"}
            </h3>

            <p className="mt-2 text-xs text-[#8A90A0]">PDF files only</p>

            <label
              htmlFor="document-upload-area"
              className="mt-5 inline-flex cursor-pointer rounded-xl border border-[#E2E4EA] bg-white px-4 py-2.5 text-sm font-semibold text-[#6366F1] transition hover:border-[#A5A8F8] hover:bg-[#FAFAFF]"
            >
              Browse files
            </label>

            <input
              id="document-upload-area"
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;

                setUploadError("");
                setUploadSuccess("");

                if (file && file.type !== "application/pdf") {
                  setUploadError("Please select a PDF file.");
                  setSelectedFile(null);
                  return;
                }

                setSelectedFile(file);
              }}
            />
          </div>

          {selectedFile && (
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#E8E9EE] bg-[#FAFAFF] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#30364A]">
                  {selectedFile.name}
                </p>

                <p className="mt-1 text-xs text-[#8A90A0]">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="shrink-0 rounded-xl bg-[#6366F1] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4F46E5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? "Uploading..." : "Upload document"}
              </button>
            </div>
          )}

          {uploadError && (
            <div className="mt-4 rounded-xl border border-[#FFD6D6] bg-[#FFF5F5] px-4 py-3 text-sm text-[#D64545]">
              {uploadError}
            </div>
          )}

          {uploadSuccess && (
            <div className="mt-4 rounded-xl border border-[#CDEBD9] bg-[#F1FBF5] px-4 py-3 text-sm text-[#347A58]">
              {uploadSuccess}
            </div>
          )}
        </section>

        {/* Documents */}
        <section className="rounded-2xl border border-[#E8E9EE] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#E8E9EE] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-[#20263A]">
                Your documents
              </h2>

              <p className="mt-1 text-sm text-[#737B8F]">
                Documents available in your workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                document.getElementById("document-upload-area")?.click()
              }
              className="rounded-xl bg-[#6366F1] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#6366F1]/20 transition hover:bg-[#4F46E5]"
            >
              + Upload document
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8E9FF] text-2xl">
                📄
              </div>

              <h3 className="mt-5 text-base font-semibold text-[#30364A]">
                No documents yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8A90A0]">
                Upload your first PDF and start asking questions about it with
                DocuMind.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E8E9EE]">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF0F0] text-[#FF6363]">
                      PDF
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-[#30364A]">
                        {document.filename}
                      </h3>

                      <p className="mt-1 text-xs text-[#8A90A0]">
                        Added{" "}
                        {new Date(document.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      router.push(`/dashboard/documents/${document.id}`)
                    }
                    className="shrink-0 rounded-xl border border-[#E2E4EA] px-4 py-2.5 text-sm font-semibold text-[#6366F1] transition hover:border-[#A5A8F8] hover:bg-[#FAFAFF]"
                  >
                    Ask questions
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
