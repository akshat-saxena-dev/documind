"use client";

import { useState } from "react";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

          <div className="absolute right-16 top-32 h-3.5 w-3.5 rounded-full bg-[#6366F1] xl:right-20 xl:top-36 xl:h-4 xl:w-4" />

          {/* =================================================
              LOGO
          ================================================== */}
          <a
            href="/"
            className="relative z-10 flex w-fit items-center"
          >
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
                Document intelligence
              </p>
            </div>

            <h1 className="max-w-xl text-4xl font-bold leading-[1.08] tracking-tight text-[#20263A] xl:text-6xl">
              Your documents,
              <br />
              <span className="text-[#6366F1]">
                finally understood.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-[#596176] xl:mt-7 xl:text-lg xl:leading-8">
              Upload your documents, ask questions naturally, and discover
              exactly what you need without digging through endless pages.
            </p>

            {/* Feature cards */}
            <div className="mt-8 grid max-w-lg grid-cols-3 gap-2.5 xl:mt-10 xl:gap-3">

              <div className="rounded-2xl border border-white/80 bg-white/65 p-3.5 shadow-sm backdrop-blur-sm xl:p-4">
                <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8E9FF] text-xs font-bold text-[#6366F1] xl:mb-3 xl:h-9 xl:w-9 xl:text-sm">
                  01
                </div>

                <p className="text-xs font-semibold text-[#30364A] xl:text-sm">
                  Upload
                </p>

                <p className="mt-1 text-[11px] leading-4 text-[#737B8F] xl:text-xs xl:leading-5">
                  Your documents
                </p>
              </div>

              <div className="rounded-2xl border border-white/80 bg-white/65 p-3.5 shadow-sm backdrop-blur-sm xl:p-4">
                <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-[#DFF5EA] text-xs font-bold text-[#3B8064] xl:mb-3 xl:h-9 xl:w-9 xl:text-sm">
                  02
                </div>

                <p className="text-xs font-semibold text-[#30364A] xl:text-sm">
                  Search
                </p>

                <p className="mt-1 text-[11px] leading-4 text-[#737B8F] xl:text-xs xl:leading-5">
                  Find meaning
                </p>
              </div>

              <div className="rounded-2xl border border-white/80 bg-white/65 p-3.5 shadow-sm backdrop-blur-sm xl:p-4">
                <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF0F0] text-xs font-bold text-[#FF6363] xl:mb-3 xl:h-9 xl:w-9 xl:text-sm">
                  03
                </div>

                <p className="text-xs font-semibold text-[#30364A] xl:text-sm">
                  Ask
                </p>

                <p className="mt-1 text-[11px] leading-4 text-[#737B8F] xl:text-xs xl:leading-5">
                  Get answers
                </p>
              </div>

            </div>
          </div>

          {/* =================================================
              FOOTER
          ================================================== */}
          <div className="relative z-10 flex items-center justify-between">

            <p className="text-xs text-[#737B8F] xl:text-sm">
              © 2026 DocuMind
            </p>

            <div className="flex items-center gap-2 text-[11px] text-[#737B8F] xl:text-xs">
              <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
              AI-powered document intelligence
            </div>

          </div>
        </section>

        {/* =====================================================
            RIGHT SIDE — SIGNUP
        ====================================================== */}
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 sm:py-12 md:px-12 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">

            {/* =================================================
                MOBILE LOGO
            ================================================== */}
            <a
              href="/"
              className="mb-8 flex justify-center sm:mb-10 lg:hidden"
            >
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
                Get started
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#20263A] sm:text-3xl">
                Create your account
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#737B8F] sm:text-base">
                Start turning your documents into knowledge.
              </p>

            </div>

            {/* =================================================
                FORM
            ================================================== */}
            <form className="space-y-4 sm:space-y-5">

              {/* Full name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-[#30364A]"
                >
                  Full name
                </label>

                <input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  autoComplete="name"
                  className="w-full rounded-xl border border-[#E2E4EA] bg-white px-4 py-3.5 text-sm text-[#20263A] outline-none transition placeholder:text-[#A2A7B3] focus:border-[#818CF8] focus:ring-4 focus:ring-[#6366F1]/10"
                />
              </div>

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
                  className="w-full rounded-xl border border-[#E2E4EA] bg-white px-4 py-3.5 text-sm text-[#20263A] outline-none transition placeholder:text-[#A2A7B3] focus:border-[#818CF8] focus:ring-4 focus:ring-[#6366F1]/10"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-[#30364A]"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    autoComplete="new-password"
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

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-[#30364A]"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-[#E2E4EA] bg-white px-4 py-3.5 pr-20 text-sm text-[#20263A] outline-none transition placeholder:text-[#A2A7B3] focus:border-[#818CF8] focus:ring-4 focus:ring-[#6366F1]/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2 text-xs font-medium text-[#8A90A0] transition hover:text-[#6366F1]"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* =================================================
                  TERMS
              ================================================== */}
              <div className="flex items-start gap-3 pt-1">

                <input
                  id="terms"
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 rounded border-[#D5D8E0] accent-[#6366F1]"
                />

                <label
                  htmlFor="terms"
                  className="text-xs leading-5 text-[#737B8F] sm:text-sm sm:leading-6"
                >
                  I agree to the{" "}
                  <a
                    href="#"
                    className="font-medium text-[#6366F1] hover:text-[#4F46E5]"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="font-medium text-[#6366F1] hover:text-[#4F46E5]"
                  >
                    Privacy Policy
                  </a>
                  .
                </label>

              </div>

              {/* =================================================
                  SUBMIT
              ================================================== */}
              <button
                type="submit"
                className="w-full rounded-xl bg-[#6366F1] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#6366F1]/20 transition hover:-translate-y-0.5 hover:bg-[#4F46E5] hover:shadow-xl sm:text-base"
              >
                Create account
              </button>

            </form>

            {/* =================================================
                LOGIN
            ================================================== */}
            <p className="mt-7 text-center text-sm text-[#737B8F] sm:mt-8">
              Already have an account?{" "}
              <a
                href="/login"
                className="font-semibold text-[#6366F1] transition hover:text-[#4F46E5]"
              >
                Log in
              </a>
            </p>

          </div>
        </section>
      </div>
    </main>
  );
}