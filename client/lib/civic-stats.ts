
export type CivicStats = {
  activeCitizens: number;
  activeEmployees: number;
  totalComplaints: number | null;
  resolvedComplaints: number | null;
};

export async function fetchCivicStats(): Promise<CivicStats> {
  const apiBase = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5001"
  ).replace(/\/+$/, "");

  const response = await fetch(`${apiBase}/api/stats`);

  if (!response.ok) {
    throw new Error("Unable to load civic statistics");
  }

  return response.json() as Promise<CivicStats>;
}
