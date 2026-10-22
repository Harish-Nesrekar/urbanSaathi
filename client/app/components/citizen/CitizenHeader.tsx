"use client";

import { usePathname } from "next/navigation";
import { logoutCitizen } from "@/lib/citizen-api";

const titles: Record<string, string> = {
  "/citizen/dashboard": "Overview",
  "/citizen/report": "Report an issue",
  "/citizen/complaints": "My complaints",
  "/citizen/account": "Profile & Settings",
  "/citizen/profile": "Profile details",
  "/citizen/settings": "Security settings",
};

interface CitizenHeaderProps {
  title?: string;
  subtitle?: string;
  onToggleSidebar?: () => void;
}

export default function CitizenHeader({
  title,
  subtitle,
  onToggleSidebar,
}: CitizenHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex min-h-[72px] items-center justify-between gap-4 border-b border-[#e1ece0] bg-white/90 px-4 backdrop-blur-md sm:px-8">
      {/* Brand & Menu Trigger */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex items-center gap-2 rounded-xl border border-[#d6e5d3] bg-[#f5f9f4] px-3.5 py-2 text-xs font-bold text-[#2e5232] transition hover:bg-[#eaf4e8] lg:hidden"
            aria-label="Open navigation menu"
          >
            <span className="text-base leading-none">☰</span>
            <span>Menu</span>
          </button>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-black tracking-tight text-[#233d26]">
              UrbanSaathi
            </span>
            <span className="rounded-md border border-[#d8e6d5] bg-[#f1f7ef] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#3d6c42]">
              Citizen Panel
            </span>
          </div>
          <p className="hidden text-xs text-[#6e8271] sm:block">
            {subtitle || titles[pathname] || "Smart city civic services"}
          </p>
        </div>
      </div>

      {/* Logout Action (as specified in Figma wireframe) */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={logoutCitizen}
          className="group inline-flex items-center gap-2 rounded-xl border border-[#ebdcdc] bg-white px-3.5 py-2 text-xs font-bold text-[#863e37] shadow-2xs transition hover:border-[#dfc3c0] hover:bg-[#fff6f6] hover:text-[#9e2c24]"
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