import type { ComplaintStatus } from "./types";

export function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatCount(
  value: number | null | undefined,
): string {
  return value == null ? "—" : value.toLocaleString("en-IN");
}

export function formatStatus(status: ComplaintStatus | string): string {
  return status.replaceAll("_", " ");
}

export function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error ? error.message : fallback;
}

export function isAuthenticationError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    ((error as { status?: number }).status === 401 ||
      (error as { status?: number }).status === 403)
  );
}