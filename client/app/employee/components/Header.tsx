"use client";

type HeaderProps = {
  onOpenSidebar: () => void;
  onRefresh: () => void;
  onSignOut: () => void;
  refreshing: boolean;
  loading: boolean;
};

export default function Header({
  onOpenSidebar,
  onRefresh,
  onSignOut,
  refreshing,
  loading,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b border-white/80 bg-white/75 px-4 shadow-sm backdrop-blur-2xl sm:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="flex items-center gap-2 rounded-xl border border-[#d6e5d3] bg-[#f5f9f4] px-3.5 py-2 text-xs font-bold text-[#2e5232] transition hover:bg-[#eaf4e8] lg:hidden"
        >
          <span>☰</span>
          <span>Menu</span>
        </button>

        <div className="hidden sm:block">
          <span className="text-xs font-bold uppercase tracking-wider text-[#4d7b51]">
            Municipal Portal
          </span>
          <h1 className="text-sm font-black text-[#233d26]">
            UrbanSaathi Employee Panel
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#dbe7da] bg-[#f9fbf8] px-3.5 py-2 text-xs font-bold text-[#356138] transition hover:bg-[#eff6ed]"
        >
          <span>{refreshing ? "◌" : "↻"}</span>
          <span className="hidden sm:inline">Refresh Sync</span>
        </button>

        <button
          type="button"
          onClick={onSignOut}
          className="group inline-flex items-center gap-2 rounded-xl border border-[#ebdcdc] bg-white px-4 py-2 text-xs font-bold text-[#863e37] shadow-2xs transition hover:border-[#dfc3c0] hover:bg-[#fff6f6] hover:text-[#9e2c24]"
        >
          <span className="transition-transform group-hover:translate-x-0.5">
            ↪
          </span>
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}