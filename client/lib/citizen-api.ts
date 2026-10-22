
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

function redirectToLogin() {
  if (typeof window !== "undefined") {
    window.location.replace("/");
  }
}

function clearCitizenToken() {
  localStorage.removeItem("citizenToken");
  sessionStorage.removeItem("citizenToken");
}

export async function citizenFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (typeof window === "undefined") {
    throw new Error("This request must run in the browser.");
  }

  const token =
    localStorage.getItem("citizenToken") ||
    sessionStorage.getItem("citizenToken");

  if (!token) {
    redirectToLogin();
    throw new Error("Please sign in to continue.");
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/json");

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  // A 401 means the server did not accept the authentication credentials.
  // Clear only the citizen session.
  if (response.status === 401) {
    clearCitizenToken();
    redirectToLogin();
    throw new Error("Your session has expired. Please sign in again.");
  }

  // A 403 means the account is authenticated but not permitted
  // to perform this action. Preserve the session.
  if (response.status === 403) {
    throw new Error(
      data.message || "You do not have permission to perform this action."
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message || "The request could not be completed."
    );
  }

  return data as T;
}

export function logoutCitizen() {
  clearCitizenToken();
  redirectToLogin();
}
