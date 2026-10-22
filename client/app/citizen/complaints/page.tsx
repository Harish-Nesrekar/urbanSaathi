"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import CitizenLayout from "../../components/citizen/CitizenLayout";
import ComplaintCard, {
  type Complaint,
  statusClass,
} from "../../components/citizen/ComplaintCard";
import { API_BASE, citizenFetch } from "../../../lib/citizen-api";

type Attachment = {
  id: number;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  created_at: string;
};

type HistoryItem = {
  id: number;
  previous_status: string | null;
  new_status: string;
  changed_by_user_id: number | null;
  changed_by_name: string | null;
  note: string | null;
  created_at: string;
};

type ComplaintDetails = Complaint & {
  latitude?: number | null;
  longitude?: number | null;
  updated_at?: string;
  resolved_at?: string | null;
  citizen_name?: string;
  citizen_email?: string;
  assigned_admin_name?: string | null;
};

type DetailsResponse = {
  complaint: ComplaintDetails;
  attachments: Attachment[];
  history: HistoryItem[];
};

export default function ComplaintsPage() {
  const [items, setItems] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState<"ALL" | "OPEN" | "RESOLVED" | "REJECTED">("ALL");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [details, setDetails] = useState<DetailsResponse | null>(null);
  const [detailsBusy, setDetailsBusy] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});
  const [imageError, setImageError] = useState("");

  const load = useCallback(async () => {
    setBusy(true);
    setError("");

    try {
      const data = await citizenFetch<{ complaints: Complaint[] }>(
        "/api/complaints/my"
      );
      setItems(data.complaints || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load complaints.");
    } finally {
      setBusy(false);
    }
  }, []);

  const openDetails = async (complaint: Complaint) => {
    setSelected(complaint);
    setDetails(null);
    setDetailsError("");
    setImageError("");
    setDetailsBusy(true);

    try {
      const data = await citizenFetch<DetailsResponse>(
        `/api/complaints/${complaint.id}`
      );
      setDetails(data);
    } catch (e) {
      setDetailsError(
        e instanceof Error ? e.message : "Unable to load complaint details."
      );
    } finally {
      setDetailsBusy(false);
    }
  };

  useEffect(() => {
    void load();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 15000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];

    async function loadImages() {
      if (!details || !selected) return;

      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("citizenToken") ||
        sessionStorage.getItem("citizenToken");

      if (!token) {
        setImageError("Please log in again to view complaint images.");
        return;
      }

      const nextUrls: Record<number, string> = {};

      for (const attachment of details.attachments) {
        try {
          const response = await fetch(
            `${API_BASE}/api/complaints/${selected.id}/attachments/${attachment.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store",
            }
          );

          if (!response.ok) {
            throw new Error(`Unable to load image (${response.status}).`);
          }

          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          urls.push(url);
          nextUrls[attachment.id] = url;
        } catch {
          if (!cancelled) {
            setImageError("One or more complaint images could not be loaded.");
          }
        }
      }

      if (!cancelled) {
        setImageUrls(nextUrls);
      } else {
        urls.forEach((url) => URL.revokeObjectURL(url));
      }
    }

    setImageUrls({});
    setImageError("");
    void loadImages();

    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [details, selected]);

  const filtered = items.filter((c) => {
    const s = c.status?.toUpperCase() || "";
    if (filter === "RESOLVED") return s === "RESOLVED";
    if (filter === "REJECTED") return s === "REJECTED";
    if (filter === "OPEN") return s !== "RESOLVED" && s !== "REJECTED";
    return true;
  });

  return (
    <CitizenLayout>
      <div className="space-y-6">
        {/* Header with Title and Filtering */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#233c26] sm:text-3xl">
              My Complaints
            </h1>
            <p className="mt-1 text-sm text-[#617764]">
              Follow real-time status and resolutions from the municipal field team.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(["ALL", "OPEN", "RESOLVED", "REJECTED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  filter === tab
                    ? "bg-[#3e7843] text-white shadow-2xs"
                    : "border border-[#dce8db] bg-white text-[#526a55] hover:bg-[#f2f7f0]"
                }`}
              >
                {tab}
              </button>
            ))}

            <button
              onClick={() => void load()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#dce7dc] bg-white px-4 py-2 text-xs font-bold text-[#456348] shadow-2xs transition hover:bg-[#f5f8f3] disabled:opacity-50"
            >
              <span>{busy ? "◌" : "↻"}</span>
              <span>{busy ? "Refreshing…" : "Refresh"}</span>
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Content Section */}
        {busy && items.length === 0 ? (
          <div className="flex items-center justify-center rounded-3xl border border-[#e1ece0] bg-white p-12 text-[#68806b]">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#d5e7d3] border-t-[#3f7a44]" />
            <span className="ml-3 text-sm font-semibold">Loading your complaints…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#d5e3d2] bg-white p-10 text-center sm:p-14">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#edf6eb] text-2xl text-[#3f7a44]">
              📋
            </div>
            <h3 className="mt-4 font-bold text-[#233d26]">
              {items.length === 0 ? "No complaints yet" : `No ${filter.toLowerCase()} complaints`}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[#6c806e]">
              When you submit a civic issue, tracking updates and timeline details will display here.
            </p>
            <Link
              href="/citizen/report"
              className="mt-5 inline-flex rounded-xl bg-[#3f7a44] px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[#326436]"
            >
              ＋ Report an issue
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filtered.map((complaint) => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                onViewDetails={openDetails}
              />
            ))}
          </div>
        )}

        {/* Details Modal */}
        {selected && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-2xs"
            onClick={() => {
              setSelected(null);
              setDetails(null);
              setImageUrls({});
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="complaint-details-title"
              className="my-8 w-full max-w-3xl rounded-3xl border border-[#d6e5d3] bg-white p-6 shadow-2xl sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-[#eef4ed] pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#48784d]">
                    {selected.complaint_number || `Complaint #${selected.id}`}
                  </span>
                  <h2 id="complaint-details-title" className="mt-1 text-2xl font-black text-[#233d26]">
                    Complaint Details
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    setDetails(null);
                    setImageUrls({});
                  }}
                  className="rounded-xl border border-[#dce7dc] p-2 text-sm font-bold text-[#456348] hover:bg-[#f2f7f0]"
                >
                  ✕
                </button>
              </div>

              {detailsBusy ? (
                <div className="flex items-center justify-center py-14 text-sm text-[#6c806e]">
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#d5e7d3] border-t-[#3f7a44]" />
                  <span className="ml-3 font-semibold">Loading complaint details…</span>
                </div>
              ) : detailsError ? (
                <div role="alert" className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-800">
                  {detailsError}
                </div>
              ) : details ? (
                <div className="mt-6 max-h-[75vh] space-y-7 overflow-y-auto pr-1">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-xl font-bold text-[#233d26]">
                        {details.complaint.title}
                      </h3>
                      <span
                        className={`rounded-full px-3.5 py-1 text-xs font-bold ${statusClass(
                          details.complaint.status
                        )}`}
                      >
                        {details.complaint.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#586b5c]">
                      {details.complaint.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-xl bg-[#eef7ec] px-3 py-1.5 text-xs font-bold text-[#356139]">
                        {details.complaint.category || "Civic complaint"}
                      </span>
                      <span className="rounded-xl bg-[#f5f8f3] px-3 py-1.5 text-xs font-bold text-[#556958]">
                        {details.complaint.priority} priority
                      </span>
                    </div>

                    {details.complaint.address && (
                      <p className="mt-3 break-words text-sm text-[#586b5c]">
                        📍 <span className="font-semibold text-[#253f28]">Location:</span> {details.complaint.address}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#7e9180]">
                      <span>
                        Submitted: {new Date(details.complaint.created_at).toLocaleString("en-IN")}
                      </span>
                      {details.complaint.resolved_at && (
                        <span>
                          Resolved: {new Date(details.complaint.resolved_at).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Attached Images */}
                  <div className="border-t border-[#edf4ec] pt-5">
                    <h3 className="text-base font-bold text-[#233d26]">Attached Images</h3>

                    {details.attachments.length === 0 ? (
                      <p className="mt-2 text-sm text-[#7e9180]">
                        No images attached to this complaint.
                      </p>
                    ) : (
                      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {details.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="overflow-hidden rounded-2xl border border-[#e1ece0] bg-[#f8faf7]"
                          >
                            {imageUrls[attachment.id] ? (
                              <a
                                href={imageUrls[attachment.id]}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <img
                                  src={imageUrls[attachment.id]}
                                  alt={attachment.file_name}
                                  className="h-48 w-full object-cover transition-transform hover:scale-102"
                                />
                              </a>
                            ) : (
                              <div className="flex h-44 items-center justify-center text-xs text-[#7e9180]">
                                Loading image…
                              </div>
                            )}
                            <p className="truncate p-2.5 text-xs text-[#5f7362]">
                              {attachment.file_name}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {imageError && (
                      <p role="alert" className="mt-2 text-xs font-semibold text-red-700">
                        {imageError}
                      </p>
                    )}
                  </div>

                  {/* Progress Timeline */}
                  <div className="border-t border-[#edf4ec] pt-5">
                    <h3 className="text-base font-bold text-[#233d26]">Status Timeline</h3>

                    {details.history.length === 0 ? (
                      <p className="mt-2 text-sm text-[#7e9180]">
                        No status transitions recorded yet.
                      </p>
                    ) : (
                      <ol className="mt-4 space-y-4">
                        {details.history.map((entry) => (
                          <li key={entry.id} className="relative pl-6">
                            <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-[#3e7843] ring-4 ring-[#e5f1e4]" />
                            <p className="font-bold text-[#27442a]">
                              {entry.previous_status
                                ? `${entry.previous_status.replaceAll("_", " ")} → `
                                : ""}
                              {entry.new_status.replaceAll("_", " ")}
                            </p>
                            <p className="text-xs text-[#7c9280]">
                              {new Date(entry.created_at).toLocaleString("en-IN")}
                              {entry.changed_by_name ? ` · By: ${entry.changed_by_name}` : ""}
                            </p>
                            {entry.note && (
                              <p className="mt-1.5 text-sm text-[#546b57]">
                                {entry.note}
                              </p>
                            )}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        )}
      </div>
    </CitizenLayout>
  );
}