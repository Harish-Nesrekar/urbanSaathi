
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createEmployee,
  fetchDepartments,
  fetchEmployees,
} from "@/lib/admin/api";
import type {
  AdminDepartment,
  AdminEmployee,
  CreateEmployeeInput,
} from "@/lib/admin/types";

const emptyForm: CreateEmployeeInput = {
  full_name: "",
  email: "",
  password: "",
  department_id: 0,
};

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

export default function WorkerManagement() {
  const [employees, setEmployees] = useState<AdminEmployee[]>([]);
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateEmployeeInput>(emptyForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [employeeData, departmentData] = await Promise.all([
        fetchEmployees(),
        fetchDepartments(),
      ]);

      setEmployees(employeeData);
      setDepartments(departmentData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load employee information.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesDepartment =
        departmentFilter === "ALL" ||
        employee.departmentId === Number(departmentFilter);

      const matchesSearch =
        !query ||
        employee.fullName.toLowerCase().includes(query) ||
        employee.email.toLowerCase().includes(query) ||
        employee.employeeCode.toLowerCase().includes(query);

      return matchesDepartment && matchesSearch;
    });
  }, [employees, search, departmentFilter]);

  async function handleCreateEmployee(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.department_id) {
      setError("Please select a department.");
      return;
    }

    setSaving(true);

    try {
      const result = await createEmployee(form);

      setSuccess(result.message || "Employee created successfully.");
      setForm(emptyForm);
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create employee.",
      );
    } finally {
      setSaving(false);
    }
  }

  const activeEmployees = employees.filter(
    (employee) =>
      employee.isActive && employee.accountStatus === "ACTIVE",
  ).length;

  return (
    <section
      id="worker-management"
      className="relative mt-5 scroll-mt-24 overflow-hidden rounded-2xl border border-white/85 bg-white/65 p-3 shadow-[0_10px_35px_-28px_rgba(39,72,43,0.22)] backdrop-blur-xl sm:mt-6 sm:rounded-3xl sm:p-5 lg:p-6"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="inline-flex rounded-full border border-white/90 bg-white/65 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#718774]">
            Workforce administration
          </p>
          <h2 className="mt-3 text-xl font-bold tracking-tight text-[#263b2a] sm:text-2xl">
            Worker Management
          </h2>
          <p className="mt-1 text-sm text-[#728174]">
            Create employee accounts and organize staff by department.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="min-h-10 rounded-xl border border-white/90 bg-white/85 px-4 py-2.5 text-sm font-semibold text-[#456348] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65976b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowForm((value) => !value);
              setError("");
              setSuccess("");
            }}
            className="min-h-10 rounded-xl border border-[#47784b] bg-gradient-to-br from-[#58875c] to-[#3f7045] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:from-[#4d7d52] hover:to-[#345e3a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65976b]"
          >
            {showForm ? "Cancel" : "+ Add employee"}
          </button>
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="group relative overflow-hidden rounded-2xl border border-white/90 bg-white/70 p-4 transition-colors duration-200 hover:bg-white/90">
          <p className="text-sm text-[#728174]">Total employees</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#263b2a]">
            {employees.length}
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-white/90 bg-white/70 p-4 transition-colors duration-200 hover:bg-white/90">
          <p className="text-sm text-[#728174]">Active employees</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#47784b]">
            {activeEmployees}
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-white/90 bg-white/70 p-4 transition-colors duration-200 hover:bg-white/90">
          <p className="text-sm text-[#728174]">Departments</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#263b2a]">
            {departments.length}
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-rose-200/80 bg-rose-50/75 p-4 text-sm text-rose-800 shadow-sm backdrop-blur-xl"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mt-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/75 p-4 text-sm text-emerald-800 shadow-sm backdrop-blur-xl"
        >
          {success}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreateEmployee}
          className="mt-5 rounded-2xl border border-white/90 bg-white/70 p-3 sm:p-5"
        >
          <h3 className="font-bold text-[#263b2a]">
            Create employee account
          </h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-[#456348]">
              Full name
              <input
                required
                maxLength={100}
                value={form.full_name}
                onChange={(event) =>
                  setForm({ ...form, full_name: event.target.value })
                }
                autoComplete="name"
                className="mt-1.5 w-full rounded-xl border border-[#dce7dc] bg-white/90 px-3 py-3 text-[#263b2a] outline-none transition-colors focus:border-[#83ad86] focus:ring-2 focus:ring-[#dcebd7]"
                placeholder="Employee full name"
              />
            </label>

            <label className="block text-sm font-medium text-[#456348]">
              Email address
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                autoComplete="email"
                className="mt-1.5 w-full rounded-xl border border-[#dce7dc] bg-white/90 px-3 py-3 text-[#263b2a] outline-none transition-colors focus:border-[#83ad86] focus:ring-2 focus:ring-[#dcebd7]"
                placeholder="employee@example.com"
              />
            </label>

            <label className="block text-sm font-medium text-[#456348]">
              Temporary password
              <input
                required
                type="password"
                minLength={8}
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
                autoComplete="new-password"
                className="mt-1.5 w-full rounded-xl border border-[#dce7dc] bg-white/90 px-3 py-3 text-[#263b2a] outline-none transition-colors focus:border-[#83ad86] focus:ring-2 focus:ring-[#dcebd7]"
                placeholder="Use uppercase, lowercase, number & symbol"
              />
              <span className="mt-1 block text-xs font-normal text-[#879287]">
                At least 8 characters, with uppercase, lowercase, number and
                special character; no spaces.
              </span>
            </label>

            <label className="block text-sm font-medium text-[#456348]">
              Department
              <select
                required
                value={form.department_id || ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    department_id: Number(event.target.value),
                  })
                }
                className="mt-1.5 w-full rounded-xl border border-[#dce7dc] bg-white/90 px-3 py-3 text-[#263b2a] outline-none transition-colors focus:border-[#83ad86] focus:ring-2 focus:ring-[#dcebd7]"
              >
                <option value="">Select a department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm(emptyForm);
              }}
              className="min-h-10 rounded-xl border border-[#dce7dc] bg-white/80 px-4 py-2.5 text-sm font-semibold text-[#456348] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65976b]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || departments.length === 0}
              className="min-h-10 rounded-xl bg-[#47784b] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#38643d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65976b] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create employee"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_240px]">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, email, or employee code..."
          className="min-w-0 w-full rounded-xl border border-[#dce7dc] bg-white/90 px-4 py-3 text-sm text-[#263b2a] outline-none transition-colors focus:border-[#83ad86] focus:ring-2 focus:ring-[#dcebd7]"
        />

        <select
          value={departmentFilter}
          onChange={(event) => setDepartmentFilter(event.target.value)}
          className="min-w-0 w-full rounded-xl border border-[#dce7dc] bg-white/90 px-3 py-3 text-sm text-[#263b2a] outline-none transition-colors focus:border-[#83ad86] focus:ring-2 focus:ring-[#dcebd7]"
        >
          <option value="ALL">All departments</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="mt-6 rounded-[22px] border border-white/90 bg-white/55 p-5 text-sm text-[#728174] shadow-sm backdrop-blur-xl">
          Loading employees...
        </p>
      ) : filteredEmployees.length === 0 ? (
        <div className="mt-6 rounded-[22px] border border-dashed border-[#dce7dc] bg-white/45 p-8 text-center backdrop-blur-xl">
          <p className="font-semibold text-[#456348]">
            {employees.length === 0
              ? "No employees have been added yet."
              : "No employees match your search."}
          </p>
          <p className="mt-2 text-sm text-[#879287]">
            Add an employee or change your search filters.
          </p>
        </div>
      ) : (
        <>
        <div className="mt-5 hidden max-w-full overflow-hidden rounded-2xl border border-white/90 bg-white/60 shadow-sm sm:block">
          <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-white/65 text-[10px] uppercase tracking-[0.12em] text-[#728174]">
              <tr>
                <th className="px-4 py-3 font-semibold">Employee</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">Complaints</th>
                <th className="px-4 py-3 font-semibold">Account status</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#e9efe6]/80">
              {filteredEmployees.map((employee) => (
                <tr key={employee.employeeId} className="transition-colors duration-200 hover:bg-white/65">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-[#263b2a]">
                      {employee.fullName}
                    </p>
                    <p className="mt-1 text-xs text-[#728174]">
                      {employee.email}
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#47784b]">
                      {employee.employeeCode}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-[#456348]">
                    {employee.departmentName}
                  </td>

                  <td className="px-4 py-4">
                    <p className="text-[#263b2a]">
                      {employee.activeComplaints} active
                    </p>
                    <p className="mt-1 text-xs text-[#728174]">
                      {employee.resolvedComplaints} resolved
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        employee.isActive &&
                        employee.accountStatus === "ACTIVE"
                          ? "bg-[#e9f5e6] text-[#416c45]"
                          : "bg-[#fff1ed] text-[#9c5148]"
                      }`}
                    >
                      {employee.isActive
                        ? employee.accountStatus
                        : "INACTIVE"}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-[#728174]">
                    {formatDate(employee.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        <div className="mt-5 space-y-3 sm:hidden">
          {filteredEmployees.map((employee) => (
            <article key={employee.employeeId} className="rounded-2xl border border-white/90 bg-white/75 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words font-semibold text-[#263b2a]">{employee.fullName}</p>
                  <p className="mt-1 break-all text-xs text-[#728174]">{employee.email}</p>
                  <p className="mt-1 text-xs font-semibold text-[#47784b]">{employee.employeeCode}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  employee.isActive && employee.accountStatus === "ACTIVE"
                    ? "bg-[#e9f5e6] text-[#416c45]"
                    : "bg-[#fff1ed] text-[#9c5148]"
                }`}>
                  {employee.isActive ? employee.accountStatus : "INACTIVE"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#e9efe6] pt-3 text-sm">
                <div>
                  <p className="text-xs text-[#879287]">Department</p>
                  <p className="mt-1 break-words font-medium text-[#456348]">{employee.departmentName}</p>
                </div>
                <div>
                  <p className="text-xs text-[#879287]">Complaints</p>
                  <p className="mt-1 font-medium text-[#263b2a]">{employee.activeComplaints} active</p>
                  <p className="mt-0.5 text-xs text-[#728174]">{employee.resolvedComplaints} resolved</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-[#879287]">Joined</p>
                  <p className="mt-1 text-sm text-[#586b5a]">{formatDate(employee.createdAt)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
        </>
      )}

      <p className="relative mt-3 text-xs leading-5 text-[#879287]">
        Showing {filteredEmployees.length} of {employees.length} employees.
        Complaint counts are department-wide totals, not individually assigned
        employee workloads.
      </p>
    </section>
  );
}
