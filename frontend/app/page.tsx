const features = [
  {
    number: "01",
    title: "Upload Documents",
    description:
      "Drop your PDFs into DocuMind and let it turn your documents into searchable knowledge.",
    className: "bg-[#DBFFCB]",
  },
  {
    number: "02",
    title: "Search Intelligently",
    description:
      "Find the most relevant information using semantic search instead of relying on exact keywords.",
    className: "bg-[#BEE4D0]",
  },
  {
    number: "03",
    title: "Ask Questions",
    description:
      "Ask questions naturally and get answers grounded in the content of your documents.",
    className: "bg-[#FFF0F0]",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FFFCFA] text-[#202020]">
      {/* =====================================================
          NAVBAR
      ====================================================== */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-6 sm:py-6 lg:px-8">
        {/* Logo */}
        <a href="/" className="flex items-center">
          <img
            src="/logo.png"
            alt="DocuMind"
            className="h-10 w-auto object-contain sm:h-12"
          />
        </a>

        {/* Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <a
            href="/login"
            className="rounded-xl px-3 py-2.5 text-sm font-medium text-[#444] transition hover:bg-[#FFF0F0] hover:text-[#FF6363] sm:px-4"
          >
            Login
          </a>

          <a
            href="/signup"
            className="rounded-xl bg-[#FF6363] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#F45151] hover:shadow-md sm:px-5"
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="relative overflow-hidden px-5 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-28 lg:pt-24">
        {/* Decorative background */}
        <div className="pointer-events-none absolute -left-32 top-16 h-64 w-64 rounded-full bg-[#DBFFCB] opacity-70 blur-3xl sm:h-80 sm:w-80" />

        <div className="pointer-events-none absolute -right-32 -top-10 h-72 w-72 rounded-full bg-[#BEE4D0] opacity-60 blur-3xl sm:h-96 sm:w-96" />

        <div className="relative mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="mx-auto mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-[#FF8282]/30 bg-[#FFF0F0] px-3.5 py-2 text-xs font-medium text-[#E95555] sm:mb-7 sm:px-4 sm:text-sm">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#FF6363]" />

            <span>AI-powered document intelligence</span>
          </div>

          {/* Heading */}
          <h1 className="text-[2.7rem] font-bold leading-[1.06] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Your documents.
            <br />
            <span className="text-[#FF6363]">Understood.</span>
          </h1>

          {/* Description */}
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#666] sm:mt-6 sm:text-lg sm:leading-8 lg:text-xl">
            Upload your documents, ask questions in natural language, and
            discover the information that matters — without digging through
            pages of text.
          </p>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:items-center">
            <a
              href="/signup"
              className="rounded-xl bg-[#FF6363] px-6 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-[#FF6363]/20 transition hover:-translate-y-0.5 hover:bg-[#F45151] sm:px-7 sm:text-base"
            >
              Start using DocuMind →
            </a>

            <a
              href="#how-it-works"
              className="rounded-xl border border-[#E5E5E5] bg-white px-6 py-3.5 text-center text-sm font-semibold text-[#444] transition hover:border-[#FF8282] hover:bg-[#FFF8F8] sm:px-7 sm:text-base"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* =================================================
            PRODUCT PREVIEW
        ================================================== */}
        <div className="relative mx-auto mt-12 max-w-5xl sm:mt-16 lg:mt-20">
          {/* Glow */}
          <div className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-r from-[#FF8282]/20 via-[#DBFFCB]/30 to-[#BEE4D0]/30 blur-xl sm:-inset-4 sm:rounded-[2rem] sm:blur-2xl" />

          <div className="relative overflow-hidden rounded-2xl border border-[#EAEAEA] bg-white shadow-xl shadow-[#FF6363]/10 sm:rounded-3xl sm:shadow-2xl">
            {/* Browser bar */}
            <div className="flex items-center gap-1.5 border-b border-[#EEEEEE] px-4 py-3 sm:gap-2 sm:px-5 sm:py-4">
              <div className="h-2.5 w-2.5 rounded-full bg-[#FF8282]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#FFCC80]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#BEE4D0]" />

              <div className="ml-2 flex-1 truncate rounded-lg bg-[#F8F8F8] px-3 py-1.5 text-left text-[10px] text-[#999] sm:ml-4 sm:px-4 sm:text-xs">
                app.documind.ai
              </div>
            </div>

            {/* App preview */}
            <div className="min-h-0 md:grid md:grid-cols-[210px_1fr]">
              {/* Sidebar */}
              <div className="hidden border-r border-[#EEEEEE] bg-[#FCFCFC] p-5 md:block">
                <div className="mb-8 text-sm font-bold">
                  Docu<span className="text-[#FF6363]">Mind</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="rounded-xl bg-[#FFF0F0] px-3 py-2.5 font-medium text-[#E95555]">
                    Dashboard
                  </div>

                  <div className="px-3 py-2.5 text-[#888]">
                    Documents
                  </div>

                  <div className="px-3 py-2.5 text-[#888]">
                    Settings
                  </div>
                </div>
              </div>

              {/* Chat */}
              <div className="bg-[#FFFEFD] p-4 sm:p-6 md:p-8 lg:p-9">
                <div className="mb-5 sm:mb-7 md:mb-8">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[#999] sm:text-xs">
                    Document chat
                  </p>

                  <h3 className="mt-1 text-lg font-bold sm:text-xl">
                    Ask your document
                  </h3>
                </div>

                <div className="space-y-4 sm:space-y-5">
                  {/* User message */}
                  <div className="ml-auto max-w-[92%] rounded-2xl rounded-br-md bg-[#FF6363] p-3.5 text-left text-xs leading-5 text-white sm:max-w-lg sm:p-4 sm:text-sm sm:leading-6">
                    What are the main reasons behind India&apos;s geopolitical
                    approach?
                  </div>

                  {/* AI response */}
                  <div className="max-w-[95%] rounded-2xl rounded-bl-md border border-[#E8E8E8] bg-white p-4 text-left shadow-sm sm:max-w-xl sm:p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#DBFFCB] text-xs font-bold text-[#456B45]">
                        D
                      </div>

                      <span className="text-sm font-semibold">
                        DocuMind
                      </span>
                    </div>

                    <p className="text-xs leading-6 text-[#555] sm:text-sm sm:leading-7">
                      The document identifies several reasons, including
                      strategic autonomy, protecting national interests,
                      maintaining defence ties with Russia, and preserving
                      economic relationships with the US and Europe.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-lg bg-[#DBFFCB] px-2.5 py-1.5 text-[10px] font-medium text-[#456B45] sm:px-3 sm:text-xs">
                        Page 5
                      </span>

                      <span className="rounded-lg bg-[#BEE4D0] px-2.5 py-1.5 text-[10px] font-medium text-[#365C4D] sm:px-3 sm:text-xs">
                        Page 6
                      </span>
                    </div>
                  </div>

                  {/* Input */}
                  <div className="flex items-center gap-2 rounded-2xl border border-[#E5E5E5] bg-white p-1.5 shadow-sm sm:gap-3 sm:p-2">
                    <div className="min-w-0 flex-1 truncate px-2 text-xs text-[#AAA] sm:px-3 sm:text-sm">
                      Ask anything about your document...
                    </div>

                    <button className="shrink-0 rounded-xl bg-[#FF6363] px-3.5 py-2 text-xs font-medium text-white sm:px-4 sm:py-2.5 sm:text-sm">
                      Ask
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          HOW IT WORKS
      ====================================================== */}
      <section
        id="how-it-works"
        className="border-y border-[#EEEEEE] bg-white px-5 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#FF6363] sm:text-sm">
              How it works
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              From document to answer
              <span className="text-[#FF6363]">.</span>
            </h2>

            <p className="mt-4 text-base leading-7 text-[#777] sm:mt-5 sm:text-lg sm:leading-8">
              DocuMind handles the hard part. You simply upload a document and
              start asking questions.
            </p>
          </div>

          {/* Feature cards */}
          <div className="mt-10 grid gap-4 sm:mt-12 sm:gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.number}
                className={`rounded-3xl p-6 sm:p-7 ${feature.className}`}
              >
                <span className="text-sm font-bold text-[#555]">
                  {feature.number}
                </span>

                <h3 className="mt-10 text-xl font-bold sm:mt-14 sm:text-2xl">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#555] sm:mt-4 sm:text-base sm:leading-7">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ====================================================== */}
      <section className="px-5 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-[#FF6363] px-6 py-12 text-center text-white shadow-xl shadow-[#FF6363]/20 sm:rounded-[2rem] sm:px-12 sm:py-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Stop searching.
            <br />
            Start understanding.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/85 sm:mt-5 sm:text-lg sm:leading-8">
            Turn your documents into an intelligent knowledge base with
            DocuMind.
          </p>

          <a
            href="/signup"
            className="mt-7 inline-flex rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[#E95555] transition hover:bg-[#FFF5F5] sm:mt-8 sm:px-7 sm:text-base"
          >
            Get Started →
          </a>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <footer className="border-t border-[#EEEEEE] bg-white px-5 py-7 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center text-sm text-[#999] sm:flex-row sm:text-left">
          <div className="font-semibold text-[#444]">
            Docu<span className="text-[#FF6363]">Mind</span>
          </div>

          <p>AI-powered document intelligence.</p>

          <p>© 2026 DocuMind</p>
        </div>
      </footer>
    </main>
  );
}