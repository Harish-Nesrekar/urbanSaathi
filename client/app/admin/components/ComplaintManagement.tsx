"use client";

import type { Complaint, ComplaintStatus } from "@/lib/admin/types";
import { formatDate, formatStatus } from "@/lib/admin/utils";

type Props = {
  complaints: Complaint[];
  loading: boolean;
  error: string;
  message: string;
  filter: string;
  onFilterChange: (filter: string) => void;
  onRefresh: () => void;
  onManage: (complaint: Complaint) => void;
};

const filters: { label: string; value: string }[] = [
  { label: "All complaints", value: "ALL" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Under review", value: "UNDER_REVIEW" },
  { label: "Assigned", value: "ASSIGNED" },
  { label: "In progress", value: "IN_PROGRESS" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Reopened", value: "REOPENED" },
];

function countStatus(
  complaints: Complaint[],
  statuses: ComplaintStatus[],
): number {
  return complaints.filter((complaint) => statuses.includes(complaint.status))
    .length;
}

function getStatusStyle(status: ComplaintStatus): string {
  switch (status) {
    case "RESOLVED":
      return "border-emerald-200/70 bg-emerald-50/80 text-emerald-700";
    case "REJECTED":
      return "border-rose-200/70 bg-rose-50/80 text-rose-700";
    case "IN_PROGRESS":
      return "border-sky-200/70 bg-sky-50/80 text-sky-700";
    case "ASSIGNED":
      return "border-violet-200/70 bg-violet-50/80 text-violet-700";
    case "UNDER_REVIEW":
      return "border-amber-200/70 bg-amber-50/80 text-amber-700";
    case "REOPENED":
      return "border-orange-200/70 bg-orange-50/80 text-orange-700";
    case "SUBMITTED":
    default:
      return "border-[#dce8d8] bg-[#edf5e8]/90 text-[#47784b]";
  }
}

export default function ComplaintManagement({
  complaints,
  loading,
  error,
  message,
  filter,
  onFilterChange,
  onRefresh,
  onManage,
}: Props) {
  const visible =
    filter === "ALL"
      ? complaints
      : complaints.filter((complaint) => complaint.status === filter);

  const summaries = [
    {
      label: "Total",
      value: complaints.length,
      accent: "from-sky-200/50",
    },
    {
      label: "Pending",
      value: countStatus(complaints, [
        "SUBMITTED",
        "UNDER_REVIEW",
        "REOPENED",
      ]),
      accent: "from-amber-200/50",
    },
    {
      label: "In progress",
      value: countStatus(complaints, ["ASSIGNED", "IN_PROGRESS"]),
      accent: "from-violet-200/50",
    },
    {
      label: "Resolved",
      value: countStatus(complaints, ["RESOLVED"]),
      accent: "from-emerald-200/50",
    },
  ];

  return (
    <section
      id="complaint-management"
      className="relative mt-5 scroll-mt-24 overflow-hidden rounded-2xl border border-white/80 bg-white/65 p-3 shadow-[0_10px_35px_-28px_rgba(39,72,43,0.22)] backdrop-blur-xl sm:mt-6 sm:rounded-3xl sm:p-5 lg:p-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-200/25 blur-3xl"
      />

      <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-[#29432e]">
              Complaint Management
            </h2>
            <span className="rounded-full border border-white/90 bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#789078]">
              Administration
            </span>
          </div>
          <p className="mt-1 text-sm text-[#7d8c7e]">
            Review citizen complaints and update their status.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/90 bg-white/85 px-4 py-2.5 text-sm font-semibold text-[#416c45] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65976b] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          >
            <path
              d="M20 7v5h-5M4 17v-5h5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5.6 9A7 7 0 0 1 18 6.5L20 12M4 12l2 5.5A7 7 0 0 0 18.4 15"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {loading ? "Refreshing…" : "Refresh complaints"}
        </button>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaries.map((item) => (
          <div
            key={item.label}
            className="group relative overflow-hidden rounded-2xl border border-white/90 bg-white/65 p-3.5 transition-colors duration-200 hover:bg-white/85 sm:p-4"
          >
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-gradient-to-br ${item.accent} to-transparent blur-2xl transition-transform duration-500 group-hover:scale-125`}
            />
            <p className="relative text-xs font-medium text-[#7b8b7c]">
              {item.label}
            </p>
            <p className="relative mt-2 text-2xl font-bold tracking-tight text-[#29432e] sm:text-3xl">
              {item.value.toLocaleString()}
            </p>
            <div className="relative mt-3 h-1 w-9 rounded-full bg-[#cbdcc5] transition-all duration-300 group-hover:w-14" />
          </div>
        ))}
      </div>

      <div className="relative mt-5 flex flex-col gap-3 rounded-2xl border border-white/80 bg-white/45 p-3 sm:flex-row sm:items-end sm:justify-between sm:p-4">
        <label className="block text-sm font-semibold text-[#456348]">
          Filter by status
          <select
            value={filter}
            onChange={(event) => onFilterChange(event.target.value)}
            className="mt-2 block min-h-11 w-full rounded-xl border border-[#dfe8da] bg-white/90 px-3 py-2.5 text-sm font-normal text-[#344b37] outline-none transition-colors focus:border-[#83ad86] focus:ring-2 focus:ring-[#dcebd7] sm:w-64"
          >
            {filters.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <p className="text-sm text-[#819082]" aria-live="polite">
          Showing{" "}
          <span className="font-semibold text-[#456348]">
            {visible.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-[#456348]">
            {complaints.length}
          </span>{" "}
          complaints
        </p>
      </div>

      {message && (
        <p
          role="status"
          className="relative mt-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 text-sm text-emerald-800 shadow-sm backdrop-blur-xl"
        >
          <span className="mr-2 font-bold">✓</span>
          {message}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="relative mt-4 rounded-2xl border border-rose-200/80 bg-rose-50/75 p-4 text-sm text-rose-800 shadow-sm backdrop-blur-xl"
        >
          <span className="mr-2 font-bold">!</span>
          {error}
        </p>
      )}

      <div className="relative mt-5 max-w-full overflow-hidden rounded-2xl border border-white/90 bg-white/60 shadow-sm">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e5ece1]/90 bg-white/55 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#849184]">
                <th scope="col" className="px-4 py-4">
                  Complaint
                </th>
                <th scope="col" className="px-4 py-4">
                  Citizen
                </th>
                <th scope="col" className="px-4 py-4">
                  Category / Priority
                </th>
                <th scope="col" className="px-4 py-4">
                  Status
                </th>
                <th scope="col" className="px-4 py-4">
                  Submitted
                </th>
                <th scope="col" className="px-4 py-4">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#e9efe6]/80">
              {loading && complaints.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-14 text-center text-[#879287]"
                  >
                    <span className="mx-auto mb-3 block h-6 w-6 animate-spin rounded-full border-2 border-[#dce8d8] border-t-[#5c8b60]" />
                    Loading complaints…
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-14 text-center text-[#879287]"
                  >
                    <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-white bg-white/70 text-lg text-[#91a291] shadow-sm">
                      ◌
                    </span>
                    <span className="block font-medium text-[#526b55]">
                      {error
                        ? "Complaints could not be loaded."
                        : "No complaints found for this status."}
                    </span>
                    <span className="mt-1 block text-xs text-[#96a196]">
                      {error
                        ? "Try refreshing the complaint list."
                        : "Choose another status filter to see more results."}
                    </span>
                  </td>
                </tr>
              ) : (
                visible.map((complaint) => (
                  <tr
                    key={complaint.id}
                    className="align-top transition-colors duration-200 hover:bg-white/65"
                  >
                    <td className="max-w-xs px-4 py-5">
                      <p className="font-semibold leading-5 text-[#304934]">
                        {complaint.title}
                      </p>
                      <p className="mt-1.5 text-[11px] font-medium tracking-wide text-[#91a091]">
                        {complaint.complaint_number}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#728174]">
                        {complaint.description}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-[#819082]">
                        {complaint.address}
                      </p>
                    </td>

                    <td className="px-4 py-5">
                      <p className="font-medium text-[#304934]">
                        {complaint.citizen_name || "Unknown citizen"}
                      </p>
                      <p className="mt-1 break-all text-xs leading-5 text-[#879287]">
                        {complaint.citizen_email || "—"}
                      </p>
                    </td>

                    <td className="px-4 py-5">
                      <p className="font-medium text-[#456348]">
                        {complaint.category_name || "Other"}
                      </p>
                      <span className="mt-2 inline-flex rounded-full border border-amber-200/70 bg-amber-50/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                        {complaint.priority}
                      </span>
                    </td>

                    <td className="px-4 py-5">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[11px] font-semibold ${getStatusStyle(complaint.status)}`}
                      >
                        <span
                          aria-hidden="true"
                          className="mr-1.5 mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current"
                        />
                        {formatStatus(complaint.status)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-5 text-xs text-[#586b5a]">
                      {formatDate(complaint.created_at)}
                    </td>

                    <td className="px-4 py-5">
                      <button
                        type="button"
                        onClick={() => onManage(complaint)}
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-[#dce7dc] bg-white/85 px-3 py-2 text-xs font-semibold text-[#47784b] transition-colors hover:border-[#c4d9bf] hover:bg-[#f2f8ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65976b]"
                      >
                        Manage
                        <span aria-hidden="true">↗</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="relative mt-3 text-xs text-[#98a397]">
        Complaint records and actions are loaded from your connected database.
      </p>
    </section>
  );
}
