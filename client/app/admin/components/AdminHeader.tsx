"use client";

type Props = {
  adminId: number;
  title: string;
  mobileOpen: boolean;
  onOpenMenu: () => void;
  onSignOut: () => void;
  roleLabel?: string;
  workspaceLabel?: string;
};

export default function AdminHeader({
  adminId,
  title,
  mobileOpen,
  onOpenMenu,
  onSignOut,
  roleLabel = "Administrator",
  workspaceLabel = "Administration",
}: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#e2ebdf]/80 bg-[#f8fbf7]/85 backdrop-blur-xl supports-[backdrop-filter]:bg-[#f8fbf7]/70">
      <div className="mx-auto flex min-h-[68px] w-full max-w-[1800px] items-center justify-between gap-3 px-3 py-2 sm:min-h-[76px] sm:px-5 sm:py-3 lg:px-8">
        {/* Page title and mobile navigation */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            onClick={onOpenMenu}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e0eade] bg-white/80 text-[#3c7045] shadow-sm transition-colors duration-200 hover:bg-[#edf6e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60966a] focus-visible:ring-offset-2 active:scale-95 lg:hidden"
          >
            {mobileOpen ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            )}
          </button>

          <div className="min-w-0">
            <p className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#839384] sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#60986a]" />
              <span>UrbanSathi</span>
              <span className="text-[#bdc9ba]">/</span>
              <span className="truncate">{workspaceLabel}</span>
            </p>

            <h1 className="truncate text-base font-bold tracking-tight text-[#263e2b] sm:mt-1 sm:text-xl">
              {title}
            </h1>
          </div>
        </div>

        {/* Administrator identity and sign-out */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2.5 rounded-2xl border border-white/90 bg-white/75 px-3 py-2 shadow-[0_2px_10px_rgba(42,76,46,0.05)] sm:flex sm:gap-3 sm:px-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#e5f2df] to-[#d2e8cb] text-sm font-bold text-[#3d6d45]">
              {roleLabel.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="text-[10px] leading-4 text-[#879587]">
                Signed in as
              </p>
              <p className="max-w-[180px] truncate text-xs font-semibold text-[#35563a] sm:text-sm">
                {roleLabel} <span className="font-medium text-[#8a9a8b]"></span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="group inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#eadbd6] bg-white/80 px-2.5 text-xs font-semibold text-[#965b51] transition-colors duration-200 hover:border-[#dfc3ba] hover:bg-[#fff7f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9877d] focus-visible:ring-offset-2 active:scale-[0.98] sm:gap-2 sm:px-3.5 sm:text-sm"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 shrink-0"
            >
              <path
                d="M10 17l5-5-5-5M15 12H3m9-7h6a2 2 0 012 2v10a2 2 0 01-2 2h-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
