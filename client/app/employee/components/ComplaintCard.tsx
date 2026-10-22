"use client";

import { Complaint } from "../types";
import {
  parseAttachments,
  statusClass,
  formatStatus,
  formatDate,
  statusOptions,
} from "../utils";

type ComplaintCardProps = {
  complaint: Complaint;
  selectedStatus: string;
  onStatusChange: (complaintId: number, status: string) => void;
  note: string;
  onNoteChange: (complaintId: number, note: string) => void;
  isSaving: boolean;
  message?: string;
  onUpdateStatus: (complaintId: number) => void;
  imageUrls: Record<string, string>;
  imageErrors: Record<string, boolean>;
  onPreviewImage: (url: string) => void;
};

export default function ComplaintCard({
  complaint,
  selectedStatus,
  onStatusChange,
  note,
  onNoteChange,
  isSaving,
  message,
  onUpdateStatus,
  imageUrls,
  imageErrors,
  onPreviewImage,
}: ComplaintCardProps) {
  const attachments = parseAttachments(complaint.attachments);

  return (
    <article className="overflow-hidden rounded-3xl border border-[#e1ece0] bg-white shadow-2xs transition-all hover:border-[#cbddca]">
      {/* Header & Details */}
      <div className="border-b border-[#edf4ec] p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-[#eef7ec] px-2.5 py-1 text-xs font-bold text-[#35633a]">
                #{complaint.id}
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
                  complaint.status
                )}`}
              >
                {formatStatus(complaint.status)}
              </span>
            </div>

            <h4 className="mt-3 text-lg font-bold text-[#233d26]">
              {complaint.title ||
                complaint.category_name ||
                complaint.category ||
                `Complaint #${complaint.id}`}
            </h4>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#5b735e]">
              {complaint.description || "No description provided."}
            </p>
          </div>

          <span className="shrink-0 text-xs font-semibold text-[#879989]">
            {formatDate(complaint.created_at)}
          </span>
        </div>

        {/* Metadata Grid */}
        <div className="mt-5 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-[#e6eee3] bg-[#f8faf6] p-3">
            <span className="font-bold text-[#809683]">Category</span>
            <p className="mt-0.5 text-sm font-bold text-[#356138]">
              {complaint.category_name || complaint.category || "Not specified"}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e6eee3] bg-[#f8faf6] p-3">
            <span className="font-bold text-[#809683]">Priority</span>
            <p className="mt-0.5 text-sm font-bold text-[#356138]">
              {complaint.priority || "Not specified"}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e6eee3] bg-[#f8faf6] p-3 sm:col-span-2 xl:col-span-1">
            <span className="font-bold text-[#809683]">Location</span>
            <p className="mt-0.5 truncate text-sm font-bold text-[#356138]">
              {complaint.location || complaint.address || "Not specified"}
            </p>
          </div>
        </div>

        {(complaint.citizen_name || complaint.citizen_email) && (
          <div className="mt-3 rounded-2xl border border-[#edf4ec] bg-white p-3 text-xs">
            <span className="text-[#849987]">Citizen Reporter:</span>{" "}
            <strong className="text-[#2b4c2e]">
              {complaint.citizen_name || "Citizen"}
            </strong>
            {complaint.citizen_email && (
              <span className="ml-2 text-[#647c67]">
                ({complaint.citizen_email})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Attachments Section */}
      <div className="border-b border-[#edf4ec] bg-[#fcfdfb] p-5 sm:p-7">
        <h5 className="text-xs font-bold uppercase tracking-wider text-[#637d67]">
          Attached Inspection Evidence ({attachments.length})
        </h5>

        {attachments.length === 0 ? (
          <p className="mt-2 text-xs text-[#879989]">
            No photos attached to this ticket.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-3">
            {attachments.map((attachment) => {
              const key = `${complaint.id}-${attachment.id}`;
              const imageUrl = imageUrls[key];

              return (
                <div key={attachment.id}>
                  {imageUrl ? (
                    <button
                      type="button"
                      onClick={() => onPreviewImage(imageUrl)}
                      className="group block overflow-hidden rounded-2xl border border-[#dce8db] bg-white p-1 shadow-2xs transition hover:border-[#3f7a44]"
                    >
                      <img
                        src={imageUrl}
                        alt={`Complaint ${complaint.id} attachment`}
                        className="h-28 w-36 rounded-xl object-cover transition duration-200 group-hover:scale-105"
                      />
                      <span className="block px-2 py-1 text-center text-[11px] font-bold text-[#356138]">
                        Enlarge ↗
                      </span>
                    </button>
                  ) : (
                    <div className="flex h-32 w-36 flex-col items-center justify-center rounded-2xl border border-dashed border-[#dce7d7] bg-[#f6faf5] p-3 text-center">
                      <span className="text-xs text-[#718774]">
                        {imageErrors[key] ? "Unavailable" : "Loading…"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Triage / Update Form */}
      <div className="bg-[#f9fbf8] p-5 sm:p-7">
        <h5 className="text-xs font-bold uppercase tracking-wider text-[#356138]">
          Triage & Status Action
        </h5>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label
              htmlFor={`status-${complaint.id}`}
              className="mb-1.5 block text-xs font-bold text-[#27442a]"
            >
              Set Stage
            </label>
            <select
              id={`status-${complaint.id}`}
              value={selectedStatus}
              onChange={(e) => onStatusChange(complaint.id, e.target.value)}
              className="w-full rounded-xl border border-[#dce7dc] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#243e27] outline-none focus:border-[#3f7a44] focus:ring-4 focus:ring-[#3f7a44]/10"
            >
              {statusOptions.map((st) => (
                <option key={st} value={st}>
                  {formatStatus(st)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={`note-${complaint.id}`}
              className="mb-1.5 block text-xs font-bold text-[#27442a]"
            >
              Progress Note / Field Observation (Optional)
            </label>
            <textarea
              id={`note-${complaint.id}`}
              rows={2}
              maxLength={1000}
              value={note}
              onChange={(e) => onNoteChange(complaint.id, e.target.value)}
              placeholder="e.g. Field inspection complete. Team dispatched for pipe repair..."
              className="w-full rounded-xl border border-[#dce7dc] bg-white px-3.5 py-2 text-sm text-[#243e27] outline-none placeholder:text-[#99aa9a] focus:border-[#3f7a44] focus:ring-4 focus:ring-[#3f7a44]/10"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p role="status" className="text-xs font-semibold text-[#38643d]">
            {message}
          </p>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => onUpdateStatus(complaint.id)}
            className="shrink-0 rounded-xl bg-[#3f7a44] px-5 py-2.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#326436] disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Commit Status Update →"}
          </button>
        </div>
      </div>
    </article>
  );
}