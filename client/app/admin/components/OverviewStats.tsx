"use client";

import type { OverviewData } from "@/lib/admin/types";
import { formatCount } from "@/lib/admin/utils";

type Props = {
  overview: OverviewData | null;
  loading: boolean;
};

export default function OverviewStats({ overview, loading }: Props) {
  const stats = [
    {
      label: "Total Citizens",
      value: formatCount(overview?.stats.totalCitizens),
      description: "Registered citizen accounts",
      icon: "♙",
      available: true,
      iconStyle:
        "border-[#dce8d8] bg-gradient-to-br from-white to-[#edf5e8] text-[#47784b]",
      glowStyle: "bg-emerald-200/35",
    },
    {
      label: "Total Complaints",
      value: formatCount(overview?.stats.totalComplaints),
      description: "All recorded complaints",
      icon: "▤",
      available: overview?.availability.complaints === true,
      iconStyle:
        "border-[#e3e9df] bg-gradient-to-br from-white to-[#f0f4ec] text-[#58745a]",
      glowStyle: "bg-lime-200/30",
    },
    {
      label: "Pending Complaints",
      value: formatCount(overview?.stats.pendingComplaints),
      description: "Awaiting resolution",
      icon: "◷",
      available: overview?.availability.complaints === true,
      iconStyle:
        "border-[#eee4c9] bg-gradient-to-br from-white to-[#fbf5e8] text-[#94723a]",
      glowStyle: "bg-amber-200/30",
    },
    {
      label: "Resolved Complaints",
      value: formatCount(overview?.stats.resolvedComplaints),
      description: "Completed complaints",
      icon: "✓",
      available: overview?.availability.complaints === true,
      iconStyle:
        "border-[#dce8d8] bg-gradient-to-br from-white to-[#edf5e8] text-[#47784b]",
      glowStyle: "bg-emerald-200/30",
    },
  ];

  return (
    <section aria-label="City overview statistics" className="min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[#29432e]">
            City overview
          </h2>
          <p className="mt-1 text-sm text-[#7d8c7e]">
            Key figures from your connected database.
          </p>
        </div>

        <span
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/90 bg-white/70 px-3 py-1.5 text-xs font-medium text-[#728174]"
          role="status"
          aria-live="polite"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              loading ? "animate-pulse bg-amber-400" : "bg-emerald-500"
            }`}
          />
          {loading ? "Updating data…" : "Dashboard statistics"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        {stats.map((stat, index) => (
          <article
            key={stat.label}
            className="group relative isolate min-w-0 overflow-hidden rounded-2xl border border-white/90 bg-white/65 p-4 shadow-[0_10px_30px_-25px_rgba(39,72,43,0.2)] backdrop-blur-xl transition-colors duration-200 hover:bg-white/85 sm:p-5"
          >
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute -right-8 -top-10 -z-10 h-28 w-28 rounded-full ${stat.glowStyle} opacity-70 blur-2xl`}
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
            />

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-5 text-[#718174]">
                  {stat.label}
                </p>

                <p className="mt-4 break-words text-3xl font-bold tracking-tight text-[#263b2a] sm:text-[32px]">
                  {loading && !overview ? (
                    <span className="inline-block h-9 w-20 animate-pulse rounded-lg bg-[#e4ece1]" />
                  ) : (
                    stat.value
                  )}
                </p>
              </div>

              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-lg ${stat.iconStyle}`}
                aria-hidden="true"
              >
                {stat.icon}
              </span>
            </div>

            <div className="mt-4 flex min-h-10 items-start gap-2 border-t border-[#e8eee5]/90 pt-3">
              <span
                className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                  !stat.available && !loading
                    ? "bg-amber-500"
                    : "bg-[#79a67a]"
                }`}
              />

              <p className="text-xs leading-5 text-[#819082]">
                {!stat.available && !loading
                  ? "Complaint data is currently unavailable"
                  : stat.description}
              </p>
            </div>

            <span className="sr-only">
              Card {index + 1} of {stats.length}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
