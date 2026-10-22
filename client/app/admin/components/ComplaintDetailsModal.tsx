"use client";

import { useEffect, useState } from "react";
import type { Complaint, ComplaintStatus } from "@/lib/admin/types";
import { formatDate, formatStatus } from "@/lib/admin/utils";

type Props = {
  complaint: Complaint | null;
  saving: boolean;
  onClose: () => void;
  onSave: (id: number, status: ComplaintStatus, note: string) => Promise<void>;
};

const statuses: ComplaintStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
  "REOPENED",
];

function getStatusStyle(status: ComplaintStatus): string {
  switch (status) {
    case "RESOLVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REJECTED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "IN_PROGRESS":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "ASSIGNED":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "UNDER_REVIEW":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "REOPENED":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "SUBMITTED":
    default:
      return "border-[#dce8d8] bg-[#edf5e8] text-[#47784b]";
  }
}

export default function ComplaintDetailsModal({
  complaint,
  saving,
  onClose,
  onSave,
}: Props) {
  const [status, setStatus] = useState<ComplaintStatus>("SUBMITTED");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (complaint) {
      setStatus(complaint.status);
      setNote("");
    }
  }, [complaint]);

  useEffect(() => {
    if (!complaint) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [complaint, saving, onClose]);

  if (!complaint) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto overscroll-contain bg-[#14251a]/45 p-2 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="complaint-dialog-title"
        className="relative my-2 max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/90 bg-[#f9fcf7]/95 p-4 shadow-[0_24px_70px_-30px_rgba(10,30,15,0.35)] sm:my-auto sm:max-h-[90vh] sm:rounded-3xl sm:p-6"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-200/35 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 top-1/3 h-48 w-48 rounded-full bg-sky-100/40 blur-3xl"
        />

        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/65 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#718774] shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Complaint details
            </span>

            <p className="mt-3 break-all text-xs font-semibold tracking-wide text-[#8a998b]">
              {complaint.complaint_number}
            </p>

            <h2
              id="complaint-dialog-title"
              className="mt-2 break-words text-xl font-bold tracking-tight text-[#263b2a] sm:text-2xl"
            >
              {complaint.title}
            </h2>

            <div className="mt-3">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(complaint.status)}`}
              >
                {formatStatus(complaint.status)}
              </span>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close complaint details"
            disabled={saving}
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#dce7dc] bg-white/85 text-xl text-[#586b5a] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65976b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="relative mt-5 space-y-3 text-sm sm:mt-6 sm:space-y-4">
          <div className="rounded-2xl border border-white/90 bg-white/70 p-4 sm:p-5">
            <p className="flex items-center gap-2 font-semibold text-[#456348]">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#edf5e8] text-[#47784b]">
                ≡
              </span>
              Description
            </p>
            <p className="mt-3 whitespace-pre-wrap break-words leading-6 text-[#586b5a]">
              {complaint.description || "No description provided."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/90 bg-white/65 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8a998b]">
                Citizen
              </p>
              <p className="mt-2 break-words font-semibold text-[#304934]">
                {complaint.citizen_name || "Unknown citizen"}
              </p>
              <p className="mt-1 break-all text-xs leading-5 text-[#879287]">
                {complaint.citizen_email || "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/90 bg-white/65 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8a998b]">
                Category / Priority
              </p>
              <p className="mt-2 font-semibold text-[#304934]">
                {complaint.category_name || "Other"}
              </p>
              <span className="mt-2 inline-flex rounded-full border border-amber-200/80 bg-amber-50/80 px-2.5 py-1 text-xs font-semibold text-amber-800">
                {complaint.priority}
              </span>
            </div>

            <div className="rounded-2xl border border-white/90 bg-white/65 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8a998b]">
                Location
              </p>
              <p className="mt-2 break-words leading-5 text-[#586b5a]">
                {complaint.address || "Location not provided"}
              </p>

              {complaint.latitude != null &&
                complaint.longitude != null && (
                  <a
                    href={`https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#dce8d8] bg-[#f1f7ed] px-3 py-2 text-xs font-semibold text-[#47784b] transition-colors hover:bg-[#e5f0df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65976b]"
                  >
                    View location on map
                    <span aria-hidden="true">↗</span>
                  </a>
                )}
            </div>

            <div className="rounded-2xl border border-white/90 bg-white/65 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8a998b]">
                Submitted
              </p>
              <p className="mt-2 font-medium text-[#586b5a]">
                {formatDate(complaint.created_at)}
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#8a998b]">
                Current status
              </p>
              <p className="mt-2 font-semibold text-[#456348]">
                {formatStatus(complaint.status)}
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-5 rounded-2xl border border-white/90 bg-white/70 p-4 sm:p-5">
          <div className="border-b border-[#e6eee2]/90 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#819082]">
              Administrator controls
            </p>
            <h3 className="mt-1 text-lg font-bold tracking-tight text-[#263b2a]">
              Update complaint status
            </h3>
            <p className="mt-1 text-xs leading-5 text-[#879287]">
              Choose the new status and optionally add a note to the record.
            </p>
          </div>

          <label className="mt-4 block text-sm font-semibold text-[#456348]">
            New status
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as ComplaintStatus)
              }
              disabled={saving}
              className="mt-2 block min-h-11 w-full rounded-xl border border-[#dfe8da] bg-white/90 px-3 py-3 font-normal text-[#344b37] outline-none transition-colors focus:border-[#83ad86] focus:ring-2 focus:ring-[#dcebd7] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {formatStatus(item)}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-4 block text-sm font-semibold text-[#456348]">
            Admin note (optional)
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={1000}
              rows={3}
              disabled={saving}
              placeholder="Add a resolution note or explain the status change…"
              className="mt-2 block w-full resize-y rounded-xl border border-[#dfe8da] bg-white/90 px-3 py-3 font-normal leading-6 text-[#344b37] outline-none transition-colors placeholder:text-[#a0aca0] focus:border-[#83ad86] focus:ring-2 focus:ring-[#dcebd7] disabled:cursor-not-allowed disabled:opacity-60"
            />
            <span className="mt-1.5 block text-right text-[11px] font-normal text-[#94a094]">
              {note.length}/1000 characters
            </span>
          </label>

          <div className="mt-5 flex flex-col-reverse gap-3 border-t border-[#e6eee2]/90 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="min-h-11 rounded-xl border border-[#dce7dc] bg-white/85 px-5 py-3 text-sm font-semibold text-[#456348] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65976b] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => void onSave(complaint.id, status, note)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#47784b] bg-gradient-to-br from-[#58875c] to-[#3f7045] px-5 py-3 text-sm font-semibold text-white transition-colors hover:from-[#4d7d52] hover:to-[#345e3a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65976b] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
              )}
              {saving ? "Saving changes…" : "Save status"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
