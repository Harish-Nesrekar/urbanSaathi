import type {
  AdminUser,
  AdminDepartment,
  AdminEmployee,
  CreateEmployeeInput,
  Complaint,
  OverviewData,
} from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;

  return (
    localStorage.getItem("adminToken") ||
    sessionStorage.getItem("adminToken")
  );
}

export function clearAdminToken(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem("adminToken");
  sessionStorage.removeItem("adminToken");
}

export async function adminRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAdminToken();

  if (!token) {
    const error = new Error("Your session has expired.") as Error & {
      status?: number;
    };
    error.status = 401;
    throw error;
  }

  const headers = new Headers(options.headers);

  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/json");

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    clearAdminToken();

    const error = new Error(
      data?.message || "Your session has expired. Please sign in again.",
    ) as Error & { status?: number };

    error.status = 401;
    throw error;
  }

  if (response.status === 403) {
    const error = new Error(
      data?.message || "You do not have permission to perform this action.",
    ) as Error & { status?: number };

    error.status = 403;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || "The request could not be completed.",
    ) as Error & { status?: number };

    error.status = response.status;
    throw error;
  }

  return data as T;
}

export async function verifyAdmin(): Promise<AdminUser> {
  const data = await adminRequest<{
    user: { id: number; role: string };
  }>("/api/test/admin-only");

  if (data.user?.role !== "ADMIN") {
    throw new Error("This account does not have administrator access.");
  }

  return {
    id: Number(data.user.id),
    role: data.user.role,
  };
}

export function fetchOverview(): Promise<OverviewData> {
  return adminRequest<OverviewData>("/api/admin/overview");
}

export async function fetchComplaints(): Promise<Complaint[]> {
  const data = await adminRequest<{ complaints?: Complaint[] }>(
    "/api/complaints",
  );

  return Array.isArray(data.complaints) ? data.complaints : [];
}

export function updateComplaint(
  complaintId: number,
  update: object,
): Promise<unknown> {
  return adminRequest(`/api/complaints/${complaintId}/status`, {
    method: "PATCH",
    body: JSON.stringify(update),
  });
}

export async function fetchDepartments(): Promise<AdminDepartment[]> {
  const data = await adminRequest<{
    departments?: AdminDepartment[];
  }>("/api/admin/departments");

  return Array.isArray(data.departments)
    ? data.departments
    : [];
}

export async function fetchEmployees(): Promise<AdminEmployee[]> {
  const data = await adminRequest<{
    employees?: AdminEmployee[];
  }>("/api/admin/employees");

  return Array.isArray(data.employees)
    ? data.employees
    : [];
}

export function createEmployee(
  employee: CreateEmployeeInput,
): Promise<{
  message: string;
  employee: {
    user_id: number;
    employee_code: string;
    full_name: string;
    email: string;
    department_id: number;
    department_name: string;
  };
}> {
  return adminRequest("/api/admin/employees", {
    method: "POST",
    body: JSON.stringify(employee),
  });
}