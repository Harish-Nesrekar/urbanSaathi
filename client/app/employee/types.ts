export type Attachment = {
  id: number;
  mime_type?: string;
};

export type Complaint = {
  id: number;
  title?: string;
  description?: string;
  status: string;
  category?: string;
  category_name?: string;
  priority?: string;
  location?: string;
  address?: string;
  created_at?: string;
  citizen_name?: string;
  citizen_email?: string;
  attachments?: Attachment[] | string | null;
};

export type DepartmentResponse = {
  department?: string | { name?: string };
  department_name?: string;
  complaints?: Complaint[];
  message?: string;
};

export type EmployeeUser = {
  id?: number;
  user_id?: number;
  full_name?: string;
  name?: string;
  email?: string;
  role?: string;
};

export type ActiveTab = "ALL" | "PENDING" | "IN_PROGRESS" | "RESOLVED";