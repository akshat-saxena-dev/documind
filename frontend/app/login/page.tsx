"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
  `${API_URL}/api/v1/auth/login`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      email,
      password,
    }),
  }
);

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Login failed.");
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setError(
        "Unable to connect to DocuMind. Make sure the backend is running.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FFFCFA]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* =====================================================
            LEFT SIDE — BRANDING
        ====================================================== */}
        <section className="relative hidden overflow-hidden bg-[#EEF0FF] px-10 py-8 lg:flex lg:flex-col lg:justify-between xl:px-16 xl:py-10">
          {/* Decorative blobs */}
          <div className="absolute -right-32 -top-32 h-[360px] w-[360px] rounded-full bg-[#D9DCFF] xl:h-[420px] xl:w-[420px]" />

          <div className="absolute -bottom-40 -left-32 h-[360px] w-[360px] rounded-full bg-[#DFF5EA] xl:h-[420px] xl:w-[420px]" />

          <div className="absolute bottom-24 right-16 h-24 w-24 rounded-full bg-[#E8F8DE] xl:bottom-28 xl:right-24 xl:h-32 xl:w-32" />

          {/* Blue accent dot */}
          <div className="absolute right-16 top-32 h-3.5 w-3.5 rounded-full bg-[#6366F1] xl:right-20 xl:top-36 xl:h-4 xl:w-4" />

          {/* =================================================
              LOGO
          ================================================== */}
          <a href="/" className="relative z-10 flex w-fit items-center">
            <img
              src="/logo.png"
              alt="DocuMind"
              className="h-10 w-auto object-contain xl:h-12"
            />
          </a>

          {/* =================================================
              MAIN BRANDING
          ================================================== */}
          <div className="relative z-10 max-w-xl">
            <div className="mb-5 flex items-center gap-3 xl:mb-6">
              <span className="h-px w-7 bg-[#6366F1] xl:w-8" />

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6366F1] xl:text-sm xl:tracking-[0.2em]">
                Welcome back
              </p>
            </div>

            <h1 className="max-w-xl text-4xl font-bold leading-[1.08] tracking-tight text-[#20263A] xl:text-6xl">
              Your knowledge,
              <br />
              <span className="text-[#6366F1]">always within reach.</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-[#596176] xl:mt-7 xl:text-lg xl:leading-8">
              Continue exploring your documents, asking questions, and
              discovering insights with DocuMind.
            </p>

            {/* Feature cards */}
            <div className="mt-8 grid max-w-lg grid-cols-3 gap-2.5 xl:mt-10 xl:gap-3">
              {/* Intelligent */}
              <div className="rounded-2xl border border-white/80 bg-white/65 p-3.5 shadow-sm backdrop-blur-sm xl:p-4">
                <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8E9FF] text-xs font-bold text-[#6366F1] xl:mb-3 xl:h-9 xl:w-9 xl:text-sm">
                  AI
                </div>

                <p className="text-xs font-semibold text-[#30364A] xl:text-sm">
                  Intelligent
                </p>

                <p className="mt-1 text-[11px] leading-4 text-[#737B8F] xl:text-xs xl:leading-5">
                  Answers
                </p>
              </div>

              {/* Semantic */}
              <div className="rounded-2xl border border-white/80 bg-white/65 p-3.5 shadow-sm backdrop-blur-sm xl:p-4">
                <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-[#DFF5EA] text-xs font-bold text-[#3B8064] xl:mb-3 xl:h-9 xl:w-9 xl:text-sm">
                  ↗
                </div>

                <p className="text-xs font-semibold text-[#30364A] xl:text-sm">
                  Semantic
                </p>

                <p className="mt-1 text-[11px] leading-4 text-[#737B8F] xl:text-xs xl:leading-5">
                  Search
                </p>
              </div>

              {/* Reliable */}
              <div className="rounded-2xl border border-white/80 bg-white/65 p-3.5 shadow-sm backdrop-blur-sm xl:p-4">
                <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF0F0] text-xs font-bold text-[#FF6363] xl:mb-3 xl:h-9 xl:w-9 xl:text-sm">
                  ✓
                </div>

                <p className="text-xs font-semibold text-[#30364A] xl:text-sm">
                  Reliable
                </p>

                <p className="mt-1 text-[11px] leading-4 text-[#737B8F] xl:text-xs xl:leading-5">
                  Sources
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              FOOTER
          ================================================== */}
          <div className="relative z-10 flex items-center justify-between">
            <p className="text-xs text-[#737B8F] xl:text-sm">© 2026 DocuMind</p>

            <div className="flex items-center gap-2 text-[11px] text-[#737B8F] xl:text-xs">
              <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
              AI-powered document intelligence
            </div>
          </div>
        </section>

        {/* =====================================================
            RIGHT SIDE — LOGIN
        ====================================================== */}
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 sm:py-12 md:px-12 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">
            {/* =================================================
                MOBILE LOGO
            ================================================== */}
            <a href="/" className="mb-8 flex justify-center sm:mb-10 lg:hidden">
              <img
                src="/logo.png"
                alt="DocuMind"
                className="h-10 w-auto object-contain sm:h-12"
              />
            </a>

            {/* =================================================
                HEADING
            ================================================== */}
            <div className="mb-7 sm:mb-8">
              <p className="text-sm font-semibold text-[#6366F1]">
                Welcome back
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#20263A] sm:text-3xl">
                Log in to DocuMind
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#737B8F] sm:text-base">
                Continue where you left off.
              </p>
            </div>

            {/* =================================================
                LOGIN FORM
            ================================================== */}
            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-[#30364A]"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-[#E2E4EA] bg-white px-4 py-3.5 text-sm text-[#20263A] outline-none transition placeholder:text-[#A2A7B3] focus:border-[#818CF8] focus:ring-4 focus:ring-[#6366F1]/10"
                />
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[#30364A]"
                  >
                    Password
                  </label>

                  <a
                    href="#"
                    className="shrink-0 text-xs font-medium text-[#6366F1] transition hover:text-[#4F46E5]"
                  >
                    Forgot password?
                  </a>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-[#E2E4EA] bg-white px-4 py-3.5 pr-20 text-sm text-[#20263A] outline-none transition placeholder:text-[#A2A7B3] focus:border-[#818CF8] focus:ring-4 focus:ring-[#6366F1]/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2 text-xs font-medium text-[#8A90A0] transition hover:text-[#6366F1]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 shrink-0 rounded border-[#D5D8E0] accent-[#6366F1]"
                />

                <label htmlFor="remember" className="text-sm text-[#737B8F]">
                  Remember me
                </label>
              </div>

              {error && (
                <div className="rounded-xl border border-[#FFD6D6] bg-[#FFF5F5] px-4 py-3 text-sm text-[#D64545]">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#6366F1] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#6366F1]/20 transition hover:-translate-y-0.5 hover:bg-[#4F46E5] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
              >
                {loading ? "Logging in..." : "Log in"}
              </button>
            </form>

            {/* =================================================
                DIVIDER
            ================================================== */}
            <div className="my-6 flex items-center gap-3 sm:my-7 sm:gap-4">
              <div className="h-px flex-1 bg-[#E8E9EE]" />

              <span className="shrink-0 text-[11px] text-[#A2A7B3] sm:text-xs">
                New to DocuMind?
              </span>

              <div className="h-px flex-1 bg-[#E8E9EE]" />
            </div>

            {/* =================================================
                SIGNUP
            ================================================== */}
            <a
              href="/signup"
              className="flex w-full items-center justify-center rounded-xl border border-[#E2E4EA] bg-white px-5 py-3.5 text-sm font-semibold text-[#30364A] transition hover:border-[#A5A8F8] hover:bg-[#FAFAFF]"
            >
              Create an account
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
