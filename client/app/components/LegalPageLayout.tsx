
import type { ReactNode } from "react";
import Link from "next/link";

type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

type LegalPageLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  updated: string;
  sections: LegalSection[];
};

export default function LegalPageLayout({
  eyebrow,
  title,
  description,
  updated,
  sections,
}: LegalPageLayoutProps) {
  return (
    <main className="min-h-screen bg-[#f5f8fc] text-[#142947]">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-sky-500 text-sm font-extrabold text-white shadow-lg shadow-blue-900/15">
              US
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-[0.13em] text-[#142947]">
                URBANSAATHI
              </p>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500">
                SMART MUNICIPAL NETWORK
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden text-sm font-semibold text-slate-600 transition hover:text-blue-700 sm:block"
            >
              Home
            </Link>
            <Link
              href="/"
              className="rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-blue-800"
            >
              Back to platform
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-blue-100 bg-gradient-to-br from-white via-[#f1f7ff] to-[#e7f1ff]">
        <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-sky-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-800 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {eyebrow}
            </div>

            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.12] tracking-tight text-[#102542] sm:text-5xl lg:text-6xl">
              {title}
              <span className="text-blue-700">.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              {description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                UrbanSaathi Platform
              </span>
              <span>•</span>
              <span>Last updated: {updated}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Document */}
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-12 lg:py-16">
        <article className="min-w-0 space-y-5">
          {sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-28 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_5px_25px_rgba(15,40,75,0.035)] transition hover:border-blue-200 sm:p-8"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-extrabold text-blue-700">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold tracking-tight text-[#142947] sm:text-xl">
                    {section.title}
                  </h2>
                  <div className="mt-4 space-y-4 text-[15px] leading-8 text-slate-600 [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_strong]:font-semibold [&_strong]:text-slate-800">
                    {section.content}
                  </div>
                </div>
              </div>
            </section>
          ))}

          {/* Contact card */}
          <div className="rounded-2xl bg-gradient-to-r from-[#102542] to-[#174d86] p-7 text-white shadow-xl shadow-blue-950/10 sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
              Need assistance?
            </p>
            <h2 className="mt-3 text-2xl font-bold">
              We're here to help.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-7 text-blue-100">
              For questions about this document or the UrbanSaathi platform,
              contact our support email.
            </p>
            <a
              href="mailto:verifyyourdetails123@gmail.com"
              className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-800 transition hover:bg-blue-50"
            >
              Contact support →
            </a>
          </div>
        </article>

        {/* Contents panel */}
        <aside className="order-first lg:order-last">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_5px_25px_rgba(15,40,75,0.035)] lg:sticky lg:top-28">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">
              On this page
            </p>

            <nav className="mt-5 space-y-1">
              {sections.map((section, index) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="group flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition hover:bg-blue-50 hover:text-blue-800"
                >
                  <span className="pt-0.5 text-xs font-bold text-slate-400 group-hover:text-blue-600">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-medium leading-5">
                    {section.title}
                  </span>
                </a>
              ))}
            </nav>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="text-xs leading-6 text-slate-500">
                UrbanSaathi — connecting citizens and city operations through
                one unified platform.
              </p>
            </div>
          </div>
        </aside>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-sm sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-extrabold tracking-[0.12em] text-[#142947]">
              URBANSAATHI
            </p>
            <p className="mt-1 text-xs text-slate-500">
              SMART MUNICIPAL NETWORK
            </p>
          </div>

          <div className="flex flex-wrap gap-5 text-slate-500">
            <Link href="/" className="transition hover:text-blue-700">
              Home
            </Link>
            <Link
              href="/privacy-policy"
              className="transition hover:text-blue-700"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="transition hover:text-blue-700"
            >
              Terms of Service
            </Link>
          </div>

          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} UrbanSaathi
          </p>
        </div>
      </footer>
    </main>
  );
}
