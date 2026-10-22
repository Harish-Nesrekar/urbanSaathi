export type AdminUser = {
  id: number;
  role: string;
};

export type AuthState = "checking" | "authenticated" | "error";

export type Citizen = {
  userId: number;
  fullName: string;
  email: string;
  status: string;
  createdAt: string;
};

export type ComplaintStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "REJECTED"
  | "REOPENED";

export type ComplaintPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type Complaint = {
  id: number;
  department_id: number | null;
  complaint_number: string;
  title: string;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  address: string;
  created_at: string;
  category_name: string;
  citizen_name: string;
  citizen_email: string;
  latitude: number | null;
  longitude: number | null;
  assigned_admin_name?: string | null;
};

export type OverviewData = {
  stats: {
    totalCitizens: number;
    totalComplaints: number | null;
    pendingComplaints: number | null;
    resolvedComplaints: number | null;
  };
  availability: {
    complaints: boolean;
  };
  recentCitizens: Citizen[];
};

export type ApiError = Error & {
  status?: number;
};
export type AdminDepartment = {
  id: number;
  name: string;
  description: string | null;
  totalComplaints: number;
  activeComplaints: number;
  resolvedComplaints: number;
};

export type AdminEmployee = {
  employeeId: number;
  userId: number;
  employeeCode: string;
  fullName: string;
  email: string;
  departmentId: number;
  departmentName: string;
  isActive: boolean;
  accountStatus: "ACTIVE" | "INACTIVE" | "BLOCKED";
  activeComplaints: number;
  resolvedComplaints: number;
  createdAt: string;
};

export type CreateEmployeeInput = {
  full_name: string;
  email: string;
  password: string;
  department_id: number;
};
