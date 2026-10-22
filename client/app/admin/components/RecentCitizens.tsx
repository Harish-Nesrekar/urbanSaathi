"use client";

import type { Citizen } from "@/lib/admin/types";
import { formatDate } from "@/lib/admin/utils";

type Props = {
  citizens: Citizen[];
  loading: boolean;
  error: string;
};

export default function RecentCitizens({
  citizens,
  loading,
  error,
}: Props) {
  return (
    <section className="relative mt-5 min-w-0 overflow-hidden rounded-2xl border border-white/85 bg-white/65 p-3 shadow-[0_10px_35px_-28px_rgba(39,72,43,0.22)] backdrop-blur-xl sm:mt-6 sm:rounded-3xl sm:p-5 lg:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-emerald-200/25 blur-3xl"
      />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-[#29432e]">
              Recent registrations
            </h2>
            <span className="rounded-full border border-white/90 bg-white/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#819082]">
              Citizens
            </span>
          </div>

          <p className="mt-1 text-sm text-[#7d8c7e]">
            The latest citizen accounts recorded by UrbanSathi.
          </p>
        </div>

        <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-white/90 bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#47784b]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {citizens.length.toLocaleString()}{" "}
          {citizens.length === 1 ? "record" : "records"}
        </span>
      </div>

      {error && citizens.length > 0 && (
        <p
          role="status"
          className="relative mt-4 rounded-xl border border-amber-200/80 bg-amber-50/80 p-3 text-sm text-amber-800"
        >
          {error}
        </p>
      )}

      {/* Compact table on larger screens; readable record cards on phones. */}
      <div className="relative mt-4 hidden overflow-hidden rounded-2xl border border-white/90 bg-white/60 sm:block">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e5ece1]/90 bg-white/70 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#849184]">
                <th scope="col" className="px-4 py-3.5">Citizen</th>
                <th scope="col" className="px-4 py-3.5">Email</th>
                <th scope="col" className="px-4 py-3.5">Status</th>
                <th scope="col" className="px-4 py-3.5">Registered</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#e9efe6]/80">
              {loading && citizens.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-[#879287]">
                    <span className="mx-auto mb-3 block h-6 w-6 animate-spin rounded-full border-2 border-[#dce8d8] border-t-[#5c8b60]" />
                    Loading registrations…
                  </td>
                </tr>
              ) : citizens.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-[#879287]">
                    <span className="block font-medium text-[#526b55]">
                      {error || "No citizen registrations found yet."}
                    </span>
                  </td>
                </tr>
              ) : (
                citizens.map((citizen) => (
                  <tr key={citizen.userId} className="transition-colors duration-150 hover:bg-white/75">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#dce8d8] bg-gradient-to-br from-white to-[#eaf3e5] text-sm font-bold text-[#47784b]"
                        >
                          {(citizen.fullName || "?").trim().charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="break-words font-semibold text-[#304934]">{citizen.fullName}</p>
                          <p className="mt-1 text-[11px] text-[#91a091]">User #{citizen.userId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-xs break-all px-4 py-3.5 text-[#586b5a]">{citizen.email}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[11px] font-semibold ${
                        citizen.status === "ACTIVE"
                          ? "border-emerald-200/80 bg-emerald-50/80 text-emerald-700"
                          : "border-amber-200/80 bg-amber-50/80 text-amber-800"
                      }`}>
                        <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${citizen.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500"}`} />
                        {citizen.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-[#586b5a]">{formatDate(citizen.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="relative mt-4 space-y-2.5 sm:hidden">
        {loading && citizens.length === 0 ? (
          <div role="status" className="rounded-xl border border-white/90 bg-white/70 p-5 text-center text-sm text-[#879287]">
            <span className="mx-auto mb-3 block h-6 w-6 animate-spin rounded-full border-2 border-[#dce8d8] border-t-[#5c8b60]" />
            Loading registrations…
          </div>
        ) : citizens.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#dce7dc] bg-white/45 p-5 text-center text-sm text-[#526b55]">
            {error || "No citizen registrations found yet."}
          </div>
        ) : (
          citizens.map((citizen) => (
            <article key={citizen.userId} className="rounded-xl border border-white/90 bg-white/75 p-3.5">
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#dce8d8] bg-gradient-to-br from-white to-[#eaf3e5] text-sm font-bold text-[#47784b]">
                  {(citizen.fullName || "?").trim().charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-[#304934]">{citizen.fullName}</p>
                      <p className="mt-1 text-[11px] text-[#91a091]">User #{citizen.userId}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-semibold ${
                      citizen.status === "ACTIVE"
                        ? "border-emerald-200/80 bg-emerald-50/80 text-emerald-700"
                        : "border-amber-200/80 bg-amber-50/80 text-amber-800"
                    }`}>
                      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${citizen.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500"}`} />
                      {citizen.status}
                    </span>
                  </div>
                  <p className="mt-2 break-all text-sm text-[#586b5a]">{citizen.email}</p>
                  <p className="mt-2 text-xs text-[#819082]">Registered {formatDate(citizen.createdAt)}</p>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <p className="relative mt-3 text-xs text-[#98a397]">
        Citizen registration records from your connected database.
      </p>
    </section>
  );
}
