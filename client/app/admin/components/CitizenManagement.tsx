
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminRequest } from "@/lib/admin/api";

type Citizen = {
  userId: number;
  fullName: string;
  email: string;
  phone: string | null;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  createdAt: string;
  totalComplaints: number;
  activeComplaints: number;
  resolvedComplaints: number;
};

type CitizenComplaint = {
  id: number;
  complaint_number: string;
  title: string;
  status: string;
  priority: string;
  address: string | null;
  created_at: string;
  category_name: string | null;
};

const statuses = ["ALL", "ACTIVE", "INACTIVE", "BLOCKED"];

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

export default function CitizenManagement() {
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [history, setHistory] = useState<CitizenComplaint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const loadCitizens = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status !== "ALL") params.set("status", status);

      const query = params.toString();
      const data = await adminRequest<{ citizens?: Citizen[] }>(
        `/api/admin/citizens${query ? `?${query}` : ""}`,
      );

      setCitizens(Array.isArray(data.citizens) ? data.citizens : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load citizens.",
      );
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCitizens();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadCitizens]);

  async function updateStatus(citizen: Citizen) {
    const nextStatus =
      citizen.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    const confirmed = window.confirm(
      `Are you sure you want to set ${citizen.fullName}'s account to ${nextStatus}?`,
    );

    if (!confirmed) return;

    setUpdatingId(citizen.userId);
    setError("");
    setMessage("");

    try {
      const result = await adminRequest<{ message?: string }>(
        `/api/admin/citizens/${citizen.userId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        },
      );

      setMessage(result.message || "Citizen status updated.");
      await loadCitizens();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update citizen.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function viewHistory(citizen: Citizen) {
    setSelectedCitizen(citizen);
    setHistory([]);
    setHistoryError("");
    setHistoryLoading(true);

    try {
      const data = await adminRequest<{
        complaints?: CitizenComplaint[];
      }>(`/api/admin/citizens/${citizen.userId}/complaints`);

      setHistory(Array.isArray(data.complaints) ? data.complaints : []);
    } catch (err) {
      setHistoryError(
        err instanceof Error
          ? err.message
          : "Unable to load complaint history.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  const summary = useMemo(
    () => ({
      total: citizens.length,
      active: citizens.filter((c) => c.status === "ACTIVE").length,
      inactive: citizens.filter((c) => c.status !== "ACTIVE").length,
    }),
    [citizens],
  );

  return (
    <section
      id="citizen-management"
      className="relative mt-5 scroll-mt-24 overflow-hidden rounded-2xl border border-white/80 bg-white/65 p-3 shadow-[0_10px_35px_-28px_rgba(39,72,43,0.22)] backdrop-blur-xl sm:mt-6 sm:rounded-3xl sm:p-5 lg:p-6"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-200/25 blur-3xl" />
      <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#66836a]">
            Account administration
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-[#263b2a] sm:text-2xl">
            Citizen Management
          </h2>
          <p className="mt-1 text-sm text-[#728174]">
            Search citizens, review complaint history, and manage account status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadCitizens()}
          disabled={loading}
          className="rounded-2xl border border-white/90 bg-white/70 px-4 py-2.5 text-sm font-semibold text-[#456348] shadow-sm backdrop-blur-xl transition hover:bg-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="relative mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Matching citizens", value: summary.total },
          { label: "Active accounts", value: summary.active },
          { label: "Inactive / blocked", value: summary.inactive },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/90 bg-white/65 p-4 shadow-sm transition-colors duration-200 hover:bg-white/90"
          >
            <p className="text-sm text-[#728174]">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-[#263b2a]">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="relative mt-4 grid gap-3 rounded-2xl border border-white/80 bg-white/45 p-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:p-4">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by citizen name or email…"
          className="min-w-0 w-full rounded-xl border border-[#dfe8da] bg-white/90 px-3.5 py-3 text-sm text-[#263b2a] outline-none transition-colors focus:border-[#83ad86] focus:ring-2 focus:ring-[#dcebd7] sm:px-4"
        />

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="min-w-0 w-full rounded-xl border border-[#dfe8da] bg-white/90 px-3 py-3 text-sm text-[#263b2a] outline-none transition-colors focus:border-[#83ad86] focus:ring-2 focus:ring-[#dcebd7] sm:px-4"
        >
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item === "ALL"
                ? "All account statuses"
                : item.charAt(0) + item.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {message && (
        <p role="status" className="mt-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-3 text-sm text-emerald-800">
          {message}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-2xl border border-rose-200/80 bg-rose-50/75 p-3 text-sm text-rose-800">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-6 rounded-2xl border border-white/90 bg-white/55 p-6 text-sm text-[#728174] shadow-sm backdrop-blur-xl">
          Loading citizens…
        </p>
      ) : citizens.length === 0 ? (
        <div className="mt-6 rounded-[22px] border border-dashed border-[#dce7dc] bg-white/35 p-8 text-center backdrop-blur-xl">
          <p className="font-semibold text-[#456348]">No citizens found</p>
          <p className="mt-2 text-sm text-[#879287]">
            Try another search or account-status filter.
          </p>
        </div>
      ) : (
        <div className="relative mt-5 max-w-full overflow-x-auto overscroll-x-contain rounded-2xl border border-white/90 bg-white/65 shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-white/60 text-[10px] uppercase tracking-[0.12em] text-[#819082]">
              <tr>
                <th className="px-4 py-3">Citizen</th>
                <th className="px-4 py-3">Complaints</th>
                <th className="px-4 py-3">Account status</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#e9efe6]/80">
              {citizens.map((citizen) => (
                <tr key={citizen.userId} className="align-top transition-colors duration-200 hover:bg-white/65">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-[#263b2a]">
                      {citizen.fullName}
                    </p>
                    <p className="mt-1 text-xs text-[#728174]">{citizen.email}</p>
                    <p className="mt-1 text-xs text-[#879287]">
                      {citizen.phone || "No phone provided"}
                    </p>
                    <p className="mt-1 text-xs text-[#879287]">

                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-semibold text-[#263b2a]">
                      {citizen.totalComplaints} total
                    </p>
                    <p className="mt-1 text-xs text-[#728174]">
                      {citizen.activeComplaints} active · {citizen.resolvedComplaints} resolved
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        citizen.status === "ACTIVE"
                          ? "bg-[#e9f5e6] text-[#416c45]"
                          : "bg-[#fff1ed] text-[#9c5148]"
                      }`}
                    >
                      {citizen.status}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-[#728174]">
                    {formatDate(citizen.createdAt)}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-col items-start gap-2">
                      <button
                        type="button"
                        onClick={() => void viewHistory(citizen)}
                        className="min-h-9 rounded-xl border border-[#dce7dc] bg-white/85 px-3 py-2 text-xs font-semibold text-[#47784b] transition-colors hover:bg-[#f2f8ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65976b]"
                      >
                        View complaints
                      </button>

                      {citizen.status !== "BLOCKED" && (
                        <button
                          type="button"
                          disabled={updatingId === citizen.userId}
                          onClick={() => void updateStatus(citizen)}
                          className="min-h-9 rounded-xl border border-[#e0e9dc] bg-white/80 px-3 py-2 text-xs font-semibold text-[#586b5a] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65976b] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updatingId === citizen.userId
                            ? "Updating…"
                            : citizen.status === "ACTIVE"
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-[#879287]">
        Showing {citizens.length} matching citizen accounts.
      </p>

      {selectedCitizen && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto overscroll-contain bg-[#14251a]/45 p-2 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedCitizen(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="citizen-history-title"
            className="relative my-2 max-h-[calc(100dvh-1rem)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/90 bg-[#f9fcf7]/95 p-4 shadow-[0_24px_70px_-30px_rgba(10,30,15,0.35)] sm:my-auto sm:max-h-[85vh] sm:rounded-3xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#879287]">
                  Citizen complaint history
                </p>
                <h3 id="citizen-history-title" className="mt-2 text-xl font-bold text-[#263b2a]">
                  {selectedCitizen.fullName}
                </h3>
                <p className="mt-1 text-sm text-[#728174]">
                  {selectedCitizen.email}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCitizen(null)}
                aria-label="Close complaint history"
                className="rounded-lg border border-[#dce7dc] px-3 py-1 text-xl text-[#456348]"
              >
                ×
              </button>
            </div>

            {historyLoading ? (
              <p className="mt-6 p-5 text-sm text-[#728174]">
                Loading complaint history…
              </p>
            ) : historyError ? (
              <p role="alert" className="mt-6 rounded-2xl border border-rose-200/80 bg-rose-50/75 p-4 text-sm text-rose-800">
                {historyError}
              </p>
            ) : history.length === 0 ? (
              <p className="mt-6 rounded-xl bg-[#f8fbf6] p-5 text-sm text-[#728174]">
                This citizen has not submitted any complaints.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {history.map((complaint) => (
                  <article
                    key={complaint.id}
                    className="rounded-2xl border border-white/90 bg-white/70 p-4 transition-colors hover:bg-white/90"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#263b2a]">
                          {complaint.title}
                        </p>
                        <p className="mt-1 text-xs text-[#879287]">
                          {complaint.complaint_number} · {complaint.category_name || "Other"}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#edf5e8] px-2.5 py-1 text-xs font-semibold text-[#47784b]">
                        {complaint.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-[#586b5a]">
                      {complaint.address || "Location not provided"}
                    </p>
                    <p className="mt-2 text-xs text-[#879287]">
                      Priority: {complaint.priority} · Submitted: {formatDate(complaint.created_at)}
                    </p>
                  </article>
                ))}
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCitizen(null)}
                className="rounded-2xl bg-gradient-to-br from-[#58875c] to-[#3f7045] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:from-[#4d7d52] hover:to-[#345e3a] hover:shadow-md"
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
