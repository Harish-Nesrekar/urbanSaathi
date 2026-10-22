import { Attachment, Complaint } from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

export const statusOptions = [
  "UNDER_REVIEW",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
];

export function parseAttachments(
  attachments: Complaint["attachments"]
): Attachment[] {
  if (Array.isArray(attachments)) {
    return attachments.filter(
      (item): item is Attachment => Boolean(item) && typeof item.id === "number"
    );
  }

  if (typeof attachments === "string") {
    try {
      const parsed: unknown = JSON.parse(attachments);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is Attachment =>
            Boolean(item) && typeof item.id === "number"
        );
      }
    } catch {
      return [];
    }
  }

  return [];
}

export function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export function statusClass(status: string) {
  switch (status.toUpperCase()) {
    case "RESOLVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REJECTED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "IN_PROGRESS":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "UNDER_REVIEW":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "ASSIGNED":
      return "border-violet-200 bg-violet-50 text-violet-700";
    default:
      return "border-[#e3e8df] bg-[#f5f8f2] text-[#586b5a]";
  }
}

export function formatDate(value?: string) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}