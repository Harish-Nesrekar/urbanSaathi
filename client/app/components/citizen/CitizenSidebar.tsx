"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutCitizen } from "@/lib/citizen-api";

const links = [
  { href: "/citizen/dashboard", label: "Overview", icon: "⌂" },
  { href: "/citizen/report", label: "Report issue", icon: "＋" },
  { href: "/citizen/complaints", label: "Complaints", icon: "▤" },
  { href: "/citizen/account", label: "Profile & Settings", icon: "◎" },
];

export default function CitizenSidebar({
  onClose,
}: {
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col bg-white p-3 sm:p-4">
      {/* Brand Header */}
      <div className="mb-6 flex items-center justify-between border-b border-[#eef3ec] pb-4">
        <Link
          href="/citizen/dashboard"
          onClick={onClose}
          className="flex items-center gap-2.5 rounded-xl transition hover:opacity-90"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#3e7843] to-[#2a552e] text-lg font-black text-white shadow-xs">
            U
          </span>

          <span className="min-w-0">
            <strong className="block truncate text-base font-black text-[#263b2a]">
              UrbanSaathi
            </strong>
            <small className="block text-[11px] font-bold uppercase tracking-wider text-[#48784d]">
              Citizen Panel
            </small>
          </span>
        </Link>

        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-[#f1f6ef] hover:text-[#254228] lg:hidden"
          >
            ✕
          </button>
        )}
      </div>

      <p className="mb-2.5 px-3 text-[10px] font-bold uppercase tracking-widest text-[#889987]">
        Menu
      </p>

      {/* Nav List */}
      <nav aria-label="Citizen navigation" className="space-y-1.5">
        {links.map((item) => {
          const active =
            pathname === item.href ||
            (item.href === "/citizen/account" &&
              (pathname === "/citizen/profile" ||
                pathname === "/citizen/settings"));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                active
                  ? "bg-[#eaf4e7] text-[#2c5b32] shadow-2xs font-bold"
                  : "text-[#586b5a] hover:bg-[#f5f8f3] hover:text-[#223925]"
              }`}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm transition ${
                  active
                    ? "bg-[#3f7a44] text-white shadow-2xs"
                    : "bg-[#f1f7ee] text-[#47784b] group-hover:bg-[#e4efe0]"
                }`}
              >
                {item.icon}
              </span>

              <span>{item.label}</span>

              {active && (
                <span className="ml-auto h-2 w-2 rounded-full bg-[#3f7a44]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="mt-auto pt-6">
        <div className="rounded-2xl border border-[#dce8db] bg-gradient-to-br from-[#ebf5ea] to-[#f4f9f2] p-4 text-xs">
          <p className="font-bold text-[#2a552e]">Civic Companion Active</p>
          <p className="mt-1 leading-5 text-[#637d66]">
            Every complaint logged directly supports municipal field teams.
          </p>
        </div>

        <button
          onClick={logoutCitizen}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#ecdcdc] bg-white px-3 py-2.5 text-xs font-bold text-[#863e37] transition hover:bg-red-50 hover:text-red-700"
        >
          <span aria-hidden="true">↪</span>
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}