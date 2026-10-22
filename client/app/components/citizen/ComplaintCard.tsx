"use client";

import { useEffect, useState } from "react";

export type ComplaintAttachment = {
  id: number;
  mime_type?: string;
  mimeType?: string;
};

export type Complaint = {
  id: number;
  complaint_number?: string;
  title: string;
  description: string;
  category_name?: string;
  category?: string;
  priority: string;
  status: string;
  address?: string | null;
  created_at: string;
  attachments?: ComplaintAttachment[];
};

export function statusClass(status: string) {
  switch (status.toUpperCase()) {
    case "RESOLVED":
      return "border-[#cce5c9] bg-[#eef8ed] text-[#28663a]";
    case "REJECTED":
      return "border-[#fcdad7] bg-[#fff5f4] text-[#a13227]";
    case "IN_PROGRESS":
      return "border-[#cce2f7] bg-[#f0f7ff] text-[#1d65a6]";
    case "ASSIGNED":
    case "UNDER_REVIEW":
      return "border-[#fbe4be] bg-[#fff9ed] text-[#9c6418]";
    default:
      return "border-[#dbe9d8] bg-[#f1f7ee] text-[#3d6e42]";
  }
}

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"
).replace(/\/$/, "");

export default function ComplaintCard({
  complaint,
  onViewDetails,
}: {
  complaint: Complaint;
  onViewDetails: (complaint: Complaint) => void;
}) {
  const date = new Date(complaint.created_at);
  const [imageUrls, setImageUrls] = useState<{ id: number; url: string }[]>([]);
  const [imageError, setImageError] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];

    async function loadImages() {
      setImageError(false);
      setImageUrls([]);

      const attachments = complaint.attachments || [];
      if (attachments.length === 0) return;

      const token =
        localStorage.getItem("citizenToken") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("citizenToken");

      if (!token) {
        setImageError(true);
        return;
      }

      try {
        const results = await Promise.all(
          attachments.map(async (attachment) => {
            const response = await fetch(
              `${API_BASE}/api/complaints/${complaint.id}/attachments/${attachment.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
              }
            );

            if (!response.ok) {
              throw new Error("Unable to load complaint images.");
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            objectUrls.push(url);

            return { id: attachment.id, url };
          })
        );

        if (cancelled) {
          objectUrls.forEach((url) => URL.revokeObjectURL(url));
          return;
        }

        setImageUrls(results);
      } catch {
        if (!cancelled) setImageError(true);
        objectUrls.forEach((url) => URL.revokeObjectURL(url));
      }
    }

    void loadImages();

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [complaint.id, complaint.attachments]);

  useEffect(() => {
    if (!previewUrl) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setPreviewUrl(null);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [previewUrl]);

  return (
    <>
      <article className="group flex flex-col justify-between rounded-3xl border border-[#e1ece0] bg-white p-6 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#cbddca] hover:shadow-md">
        <div>
          {/* Header Bar */}
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#829684]">
                {complaint.complaint_number || `Complaint #${complaint.id}`}
              </span>

              <h3 className="mt-1 break-words text-lg font-bold text-[#233d26]">
                {complaint.title}
              </h3>
            </div>

            <span
              className={`w-fit shrink-0 rounded-full border px-3.5 py-1 text-xs font-bold ${statusClass(
                complaint.status
              )}`}
            >
              {complaint.status.replaceAll("_", " ")}
            </span>
          </div>

          <p className="mt-2.5 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#5b715e]">
            {complaint.description}
          </p>

          {/* Tags */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8e6d5] bg-[#f2f8f0] px-3 py-1.5 text-xs font-semibold text-[#326137]">
              <span>🏷️</span>
              {complaint.category_name ||
                complaint.category ||
                "Civic complaint"}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#e5ede3] bg-[#f8faf7] px-3 py-1.5 text-xs font-semibold text-[#556b57]">
              <span>⚡</span>
              {complaint.priority} priority
            </span>
          </div>

          {complaint.address && (
            <p className="mt-3 flex items-start gap-1.5 text-xs text-[#637a66]">
              <span className="shrink-0 text-sm">📍</span>
              <span className="break-words">{complaint.address}</span>
            </p>
          )}

          {/* Attached photos */}
          {(complaint.attachments?.length ?? 0) > 0 && (
            <div className="mt-4 border-t border-[#edf4ec] pt-3.5">
              <span className="text-xs font-bold text-[#355238]">
                Attached photos ({complaint.attachments?.length})
              </span>

              {imageError && (
                <p className="mt-1 text-xs text-amber-700">
                  Could not load images. Please check your connection.
                </p>
              )}

              <div className="mt-2 flex flex-wrap gap-2.5">
                {imageUrls.map((image) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setPreviewUrl(image.url)}
                    className="group/img relative overflow-hidden rounded-xl border border-[#dce8db] bg-[#f7faf5] shadow-2xs transition hover:border-[#3f7a44]"
                    aria-label="View attached photo"
                  >
                    <img
                      src={image.url}
                      alt={`Photo attached to complaint ${complaint.id}`}
                      className="h-20 w-24 object-cover transition-transform duration-200 group-hover/img:scale-105"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="mt-5 border-t border-[#edf4ec] pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[#879989]">
              Submitted:{" "}
              {Number.isNaN(date.getTime())
                ? "Date unavailable"
                : date.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
            </span>

            <button
              type="button"
              onClick={() => onViewDetails(complaint)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#3f7a44] px-4 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-[#326436]"
            >
              <span>View details</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </article>

      {/* Lightbox Preview */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setPreviewUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Attached photo preview"
        >
          <button
            type="button"
            onClick={() => setPreviewUrl(null)}
            className="absolute right-5 top-5 rounded-full bg-white/20 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/30"
          >
            ✕ Close
          </button>

          <img
            src={previewUrl}
            alt="Full size complaint attachment"
            className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}