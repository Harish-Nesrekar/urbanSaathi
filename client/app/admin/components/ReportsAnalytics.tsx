"use client";

import type { OverviewData } from "@/lib/admin/types";

type Props = {
  overview: OverviewData | null;
  loading: boolean;
};

export default function ReportsAnalytics({ overview, loading }: Props) {
  const stats = overview?.stats;

  const total = stats?.totalComplaints ?? 0;
  const resolved = stats?.resolvedComplaints ?? 0;
  const pending = stats?.pendingComplaints ?? 0;
  const citizens = stats?.totalCitizens ?? 0;

  const resolutionRate =
    total > 0 ? Math.min(100, Math.round((resolved / total) * 100)) : 0;

  const reports = [
    {
      label: "Total Complaints",
      value: total,
      icon: "▤",
      iconStyle:
        "border-[#dce8d8] bg-gradient-to-br from-white to-[#edf5e8] text-[#47784b]",
      glowStyle: "bg-emerald-200/30",
    },
    {
      label: "Pending Complaints",
      value: pending,
      icon: "◷",
      iconStyle:
        "border-[#eee4c9] bg-gradient-to-br from-white to-[#fbf5e8] text-[#94723a]",
      glowStyle: "bg-amber-200/25",
    },
    {
      label: "Resolved Complaints",
      value: resolved,
      icon: "✓",
      iconStyle:
        "border-[#dce8d8] bg-gradient-to-br from-white to-[#edf5e8] text-[#47784b]",
      glowStyle: "bg-emerald-200/30",
    },
    {
      label: "Registered Citizens",
      value: citizens,
      icon: "♙",
      iconStyle:
        "border-[#e3e9df] bg-gradient-to-br from-white to-[#f0f4ec] text-[#58745a]",
      glowStyle: "bg-lime-200/25",
    },
  ];

  return (
    <section
      id="reports-analytics"
      className="relative scroll-mt-24 overflow-hidden rounded-2xl border border-white/85 bg-white/65 p-3 shadow-[0_10px_35px_-28px_rgba(39,72,43,0.22)] backdrop-blur-xl sm:rounded-3xl sm:p-5 lg:p-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-200/20 blur-3xl"
      />

      <div className="relative mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-[#263b2a]">
              Reports &amp; Analytics
            </h2>
            <span className="rounded-full border border-white/90 bg-white/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#819082]">
              Insights
            </span>
          </div>
          <p className="mt-1 text-sm text-[#728174]">
            Overview of civic complaints and citizen activity.
          </p>
        </div>

        <span
          className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-white/90 bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#47784b]"
          role="status"
          aria-live="polite"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              loading ? "animate-pulse bg-amber-400" : "bg-emerald-500"
            }`}
          />
          {loading ? "Updating reports" : "Live dashboard data"}
        </span>
      </div>

      {loading ? (
        <div
          className="relative grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          role="status"
          aria-label="Loading reports"
        >
          {reports.map((report) => (
            <div
              key={report.label}
              className="rounded-2xl border border-white/90 bg-white/65 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="h-4 w-32 animate-pulse rounded-md bg-[#e4ece1]" />
                <div className="h-10 w-10 animate-pulse rounded-xl bg-[#e4ece1]" />
              </div>
              <div className="mt-5 h-9 w-24 animate-pulse rounded-lg bg-[#e4ece1]" />
            </div>
          ))}
          <p className="sr-only">Loading reports…</p>
        </div>
      ) : (
        <>
          <div className="relative grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {reports.map((report) => (
              <article
                key={report.label}
                className="group relative isolate min-w-0 overflow-hidden rounded-2xl border border-white/90 bg-white/65 p-4 transition-colors duration-200 hover:bg-white/85 sm:p-5"
              >
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute -right-8 -top-10 -z-10 h-28 w-28 rounded-full ${report.glowStyle} blur-2xl`}
                />

                <div className="flex items-start justify-between gap-3">
                  <p className="max-w-[160px] text-sm font-medium leading-5 text-[#728174]">
                    {report.label}
                  </p>

                  <span
                    aria-hidden="true"
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg ${report.iconStyle}`}
                  >
                    {report.icon}
                  </span>
                </div>

                <p className="mt-4 break-words text-3xl font-bold tracking-tight text-[#263b2a]">
                  {report.value.toLocaleString()}
                </p>
              </article>
            ))}
          </div>

          <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/90 bg-white/65 p-4 sm:mt-5 sm:p-5">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-200/25 blur-3xl"
            />

            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#dce8d8] bg-gradient-to-br from-white to-[#edf5e8] text-[#47784b]">
                    ↗
                  </span>
                  <h3 className="font-semibold text-[#263b2a]">
                    Complaint Resolution Rate
                  </h3>
                </div>

                <p className="mt-2 text-sm text-[#728174]">
                  Percentage of complaints marked resolved.
                </p>
              </div>

              <div className="flex items-baseline gap-1 sm:shrink-0">
                <span className="text-4xl font-bold tracking-tight text-[#47784b]">
                  {resolutionRate}
                </span>
                <span className="text-xl font-semibold text-[#729477]">%</span>
              </div>
            </div>

            <div
              className="relative mt-4 h-2.5 overflow-hidden rounded-full border border-white/90 bg-[#e8efe5]"
              role="progressbar"
              aria-label="Complaint resolution rate"
              aria-valuenow={resolutionRate}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#8bb98b] to-[#47784b] transition-[width] duration-500 ease-out"
                style={{ width: `${resolutionRate}%` }}
              />
            </div>

            <div className="relative mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-[#728174]">
                <span className="font-semibold text-[#456348]">
                  {resolved.toLocaleString()}
                </span>{" "}
                resolved out of{" "}
                <span className="font-semibold text-[#456348]">
                  {total.toLocaleString()}
                </span>{" "}
                total complaints.
              </p>

              <span className="w-fit rounded-full border border-white/90 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-[#66836a]">
                {total === 0
                  ? "No complaints yet"
                  : resolutionRate === 100
                    ? "All complaints resolved"
                    : `${(100 - resolutionRate).toLocaleString()}% remaining`}
              </span>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
