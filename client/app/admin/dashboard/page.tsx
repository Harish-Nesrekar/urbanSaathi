"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import OverviewStats from "../components/OverviewStats";
import ComplaintManagement from "../components/ComplaintManagement";
import ComplaintDetailsModal from "../components/ComplaintDetailsModal";
import RecentCitizens from "../components/RecentCitizens";
import WorkerManagement from "../components/WorkerManagement";
import CitizenManagement from "../components/CitizenManagement";
import CityResources from "../components/CityResources";
import ReportsAnalytics from "../components/ReportsAnalytics";

import {
  clearAdminToken,
  fetchComplaints,
  fetchDepartments,
  fetchOverview,
  updateComplaint,
  verifyAdmin,
} from "@/lib/admin/api";

import {
  getErrorMessage,
  isAuthenticationError,
} from "@/lib/admin/utils";

import type {
  AdminDepartment,
  AdminUser,
  AuthState,
  Complaint,
  ComplaintStatus,
  OverviewData,
} from "@/lib/admin/types";

const REFRESH_INTERVAL = 15_000;

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      {eyebrow && (
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#648567]">
          {eyebrow}
        </p>
      )}
      <h2 className="text-lg font-bold tracking-tight text-[#203b29] sm:text-xl">
        {title}
      </h2>
      {description && (
        <p className="mt-1 max-w-3xl text-sm leading-5 text-[#718174]">
          {description}
        </p>
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#edf3eb] px-5">
      <div className="w-full max-w-sm rounded-[30px] border border-white/80 bg-white/65 p-8 text-center shadow-[0_25px_80px_-35px_rgba(37,74,43,0.35)] backdrop-blur-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf3e5]">
          <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-[#cbdcc5] border-t-[#47784b]" />
        </div>
        <h1 className="mt-5 text-lg font-bold text-[#263b2a]">
          Verifying administrator access
        </h1>
        <p className="mt-2 text-sm text-[#7a887b]">
          Securely preparing your UrbanSaathi workspace…
        </p>
      </div>
    </main>
  );
}

export default function AdminDashboard() {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintsError, setComplaintsError] = useState("");
  const [complaintFilter, setComplaintFilter] = useState("ALL");

  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] =
    useState<number | "ALL">("ALL");

  const [selectedComplaint, setSelectedComplaint] =
    useState<Complaint | null>(null);
  const [updatingComplaintId, setUpdatingComplaintId] =
    useState<number | null>(null);
  const [complaintActionMessage, setComplaintActionMessage] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [refreshingAll, setRefreshingAll] = useState(false);

  const redirectToLogin = useCallback(() => {
    clearAdminToken();
    // The unified role-based login page is client/app/page.tsx.
    window.location.replace("/");
  }, []);

  const loadOverview = useCallback(async (silent = false) => {
    if (!silent) setOverviewLoading(true);
    setOverviewError("");

    try {
      setOverview(await fetchOverview());
    } catch (error) {
      if (isAuthenticationError(error)) return redirectToLogin();
      setOverviewError(getErrorMessage(error, "Unable to load dashboard."));
    } finally {
      if (!silent) setOverviewLoading(false);
    }
  }, [redirectToLogin]);

  const loadComplaints = useCallback(async (silent = false) => {
    if (!silent) setComplaintsLoading(true);
    setComplaintsError("");

    try {
      setComplaints(await fetchComplaints());
    } catch (error) {
      if (isAuthenticationError(error)) return redirectToLogin();
      setComplaintsError(getErrorMessage(error, "Unable to load complaints."));
    } finally {
      if (!silent) setComplaintsLoading(false);
    }
  }, [redirectToLogin]);

  const loadDepartments = useCallback(async (silent = false) => {
    if (!silent) setDepartmentsLoading(true);
    setDepartmentsError("");

    try {
      const data = await fetchDepartments();
      setDepartments(data);
      setSelectedDepartmentId((current) =>
        current === "ALL" || data.some((department) => department.id === current)
          ? current
          : "ALL"
      );
    } catch (error) {
      if (isAuthenticationError(error)) return redirectToLogin();
      setDepartmentsError(getErrorMessage(error, "Unable to load departments."));
    } finally {
      if (!silent) setDepartmentsLoading(false);
    }
  }, [redirectToLogin]);

  const refreshDashboard = useCallback(async (silent = false) => {
    if (!silent) setRefreshingAll(true);
    await Promise.all([
      loadOverview(silent),
      loadComplaints(silent),
      loadDepartments(silent),
    ]);
    setLastSyncedAt(new Date());
    if (!silent) setRefreshingAll(false);
  }, [loadOverview, loadComplaints, loadDepartments]);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      // Admin uses its own token so Citizen and Employee sessions remain independent.
      const storedAdminToken =
        localStorage.getItem("adminToken") ||
        sessionStorage.getItem("adminToken");

      if (!storedAdminToken) {
        redirectToLogin();
        return;
      }

      try {
        const verifiedAdmin = await verifyAdmin();
        if (cancelled) return;

        setAdmin(verifiedAdmin);
        setAuthState("authenticated");
        void refreshDashboard();
      } catch (error) {
        if (cancelled) return;
        if (isAuthenticationError(error)) return redirectToLogin();

        setErrorMessage(
          getErrorMessage(error, "Unable to verify administrator access.")
        );
        setAuthState("error");
      }
    }

    void initialize();
    return () => {
      cancelled = true;
    };
  }, [refreshDashboard, redirectToLogin]);

  // Keep the admin view in sync with status changes made by employees or citizens.
  useEffect(() => {
    if (authState !== "authenticated") return;
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshDashboard(true);
      }
    }, REFRESH_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, [authState, refreshDashboard]);

  async function handleComplaintSave(
    complaintId: number,
    status: ComplaintStatus,
    note: string
  ) {
    setUpdatingComplaintId(complaintId);
    setComplaintsError("");
    setComplaintActionMessage("");

    try {
      await updateComplaint(complaintId, {
        status,
        note: note.trim() || undefined,
      });

      setSelectedComplaint(null);
      setComplaintActionMessage(`Complaint status changed to ${status.replaceAll("_", " ")}.`);
      await refreshDashboard();
    } catch (error) {
      if (isAuthenticationError(error)) return redirectToLogin();
      setComplaintsError(
        getErrorMessage(error, "Unable to update complaint status.")
      );
    } finally {
      setUpdatingComplaintId(null);
    }
  }

  const filteredComplaints = useMemo(
    () => selectedDepartmentId === "ALL"
      ? complaints
      : complaints.filter((complaint) => complaint.department_id === selectedDepartmentId),
    [complaints, selectedDepartmentId]
  );

  const departmentCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const complaint of complaints) {
      if (typeof complaint.department_id === "number") {
        counts.set(complaint.department_id, (counts.get(complaint.department_id) ?? 0) + 1);
      }
    }
    return counts;
  }, [complaints]);

  const adminProfile = admin as (AdminUser & { full_name?: string; name?: string }) | null;
  const greetingName = adminProfile?.full_name?.trim() || adminProfile?.name?.trim() || "Administrator";

  if (authState === "checking") return <LoadingScreen />;

  if (authState === "error" || !admin) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#edf3eb] p-6">
        <section className="w-full max-w-lg rounded-[30px] border border-white/80 bg-white/65 p-8 text-center shadow-[0_25px_80px_-35px_rgba(37,74,43,0.3)] backdrop-blur-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-2xl text-rose-600">!</div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-[#263b2a]">Admin access unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-[#718174]">{errorMessage || "We couldn't verify your administrator session."}</p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <button onClick={() => window.location.reload()} className="rounded-xl border border-[#dce7d7] px-5 py-3 text-sm font-semibold text-[#416c45] transition hover:bg-[#f5f8f2]">Try again</button>
            <button onClick={redirectToLogin} className="rounded-xl bg-[#47784b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#38643d]">Return to sign in</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <AdminLayout adminId={admin.id} title="Dashboard overview" onSignOut={redirectToLogin}>
      <div className="space-y-5 pb-6 sm:space-y-6">
        {/* Premium dashboard welcome / command centre */}
        <section className="group relative isolate mt-1 overflow-hidden rounded-2xl border border-white/85 bg-gradient-to-br from-white/80 via-[#f7fbf4]/80 to-[#e5f1df]/70 p-4 shadow-[0_12px_38px_-28px_rgba(38,78,43,0.28)] backdrop-blur-xl sm:rounded-3xl sm:p-6 lg:p-7">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 -z-10 h-64 w-64 rounded-full bg-[#d5e9cb]/60 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-1/3 -z-10 h-48 w-48 rounded-full bg-white/90 blur-3xl" />
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/65 px-3.5 py-2 text-[11px] font-bold tracking-[0.12em] text-[#47784b] shadow-[0_5px_20px_-12px_rgba(48,86,53,0.3)] backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-[#5d9b61] shadow-[0_0_0_4px_rgba(93,155,97,0.12)]" />
                URBANSAATHI ADMIN WORKSPACE
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#203b29] sm:text-3xl">Good to see you, {greetingName.split(" ")[0]}.</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#6e806f] sm:text-base">
                Your city operations at a glance. Monitor public complaints, coordinate departments, and keep essential services moving.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-2xl border border-white/90 bg-white/55 px-4 py-3 shadow-sm backdrop-blur-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#879487]">Workspace status</p>
                <p className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-[#355e3a]"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Connected</p>
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#dce8d6]/80 pt-3 text-xs text-[#7b8b7b]">
            <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#7aa673]" /> Auto-sync every 15 seconds</span>
            <span>{lastSyncedAt ? `Last synced ${lastSyncedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : "Preparing live data…"}</span>
          </div>
        </section>

        {/* Key performance indicators */}
        <section aria-label="Dashboard statistics">
          <SectionHeading eyebrow="City at a glance" title="Operations overview" description="A live snapshot of complaints and the latest activity across your city services." />
          <OverviewStats overview={overview} loading={overviewLoading} />
          {overviewError && (
            <div role="alert" className="mt-4 flex flex-col gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/75 px-4 py-3 text-sm text-rose-700 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
              <span>{overviewError}</span>
              <button onClick={() => void loadOverview()} className="w-fit rounded-lg border border-rose-200 bg-white px-3 py-2 font-semibold transition hover:bg-rose-100">Retry overview</button>
            </div>
          )}
        </section>

        {/* Department filter cards */}
        <section className="scroll-mt-6 rounded-2xl border border-white/85 bg-white/60 p-3 shadow-[0_10px_35px_-28px_rgba(39,75,44,0.2)] backdrop-blur-xl transition-colors duration-200 sm:rounded-3xl sm:p-5" aria-labelledby="department-heading">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <SectionHeading eyebrow="Service teams" title="Department management" description="Choose a department to narrow the complaint queue. Counts update as complaint data refreshes." />
            <button
              type="button"
              onClick={() => void loadDepartments()}
              disabled={departmentsLoading}
              className="shrink-0 rounded-xl border border-[#dce7d7] bg-white px-4 py-2.5 text-sm font-semibold text-[#416c45] transition hover:bg-[#f2f7ef] disabled:opacity-60"
            >
              {departmentsLoading ? "Refreshing…" : "↻ Refresh teams"}
            </button>
          </div>

          {departmentsError && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{departmentsError}</p>}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <button
              type="button"
              aria-pressed={selectedDepartmentId === "ALL"}
              onClick={() => setSelectedDepartmentId("ALL")}
              className={`group rounded-2xl border p-4 text-left shadow-sm backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${selectedDepartmentId === "ALL" ? "border-[#8eb58a] bg-[#f0f7ed] shadow-sm ring-2 ring-[#47784b]/10" : "border-[#e5ece1] bg-white hover:border-[#c8ddc1]"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5f0df] text-lg text-[#47784b]">▦</span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${selectedDepartmentId === "ALL" ? "bg-[#47784b] text-white" : "bg-[#f0f4ed] text-[#6e806f]"}`}>{complaints.length} total</span>
              </div>
              <p className="mt-4 text-sm font-bold text-[#263b2a]">All departments</p>
              <p className="mt-1 text-xs text-[#849184]">View the complete complaint queue</p>
            </button>

            {departments.map((department) => {
              const count = departmentCounts.get(department.id) ?? 0;
              const active = selectedDepartmentId === department.id;
              return (
                <button
                  key={department.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedDepartmentId(department.id)}
                  className={`group rounded-2xl border p-4 text-left shadow-sm backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${active ? "border-[#8eb58a] bg-[#f0f7ed] shadow-sm ring-2 ring-[#47784b]/10" : "border-[#e5ece1] bg-white hover:border-[#c8ddc1]"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0f4ed] text-lg text-[#47784b]">⌂</span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${active ? "bg-[#47784b] text-white" : "bg-[#f0f4ed] text-[#6e806f]"}`}>{count} complaints</span>
                  </div>
                  <p className="mt-4 text-sm font-bold text-[#263b2a]">{department.name}</p>
                  <p className="mt-1 text-xs text-[#849184]">{active ? "Currently selected" : "Filter by this team"}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Complaint operations */}
        <section id="complaint-management" className="scroll-mt-6 rounded-2xl border border-white/85 bg-white/55 p-3 shadow-[0_10px_35px_-28px_rgba(39,75,44,0.2)] backdrop-blur-xl transition-colors duration-200 sm:rounded-3xl sm:p-5">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <SectionHeading eyebrow="Action centre" title="Complaint management" description="Review reports, inspect complaint details, and coordinate status updates across departments." />
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#e0eadd] bg-[#f5f8f2] px-3 py-1.5 text-xs font-semibold text-[#668067]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7aa673]" /> {filteredComplaints.length} shown
            </div>
          </div>
          {complaintActionMessage && (
            <div role="status" aria-live="polite" className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <span className="font-bold">✓</span><p>{complaintActionMessage}</p>
              <button type="button" onClick={() => setComplaintActionMessage("")} aria-label="Dismiss message" className="ml-auto text-lg leading-none text-emerald-700">×</button>
            </div>
          )}
          <ComplaintManagement
            complaints={filteredComplaints}
            loading={complaintsLoading}
            error={complaintsError}
            message=""
            filter={complaintFilter}
            onFilterChange={setComplaintFilter}
            onRefresh={() => void refreshDashboard()}
            onManage={(complaint) => {
              setSelectedComplaint(complaint);
              setComplaintsError("");
              setComplaintActionMessage("");
            }}
          />
        </section>

        {/* People and workforce */}
        <section id="citizen-management" className="scroll-mt-6 rounded-2xl border border-white/85 bg-white/55 p-3 shadow-[0_10px_35px_-28px_rgba(39,75,44,0.2)] backdrop-blur-xl transition-colors duration-200 sm:rounded-3xl sm:p-5">
          <SectionHeading eyebrow="Public engagement" title="Citizen management" description="Find citizen accounts and review participation in the city reporting process." />
          <CitizenManagement />
        </section>

        <section id="worker-management" className="scroll-mt-6 rounded-2xl border border-white/85 bg-white/55 p-3 shadow-[0_10px_35px_-28px_rgba(39,75,44,0.2)] backdrop-blur-xl transition-colors duration-200 sm:rounded-3xl sm:p-5">
          <SectionHeading eyebrow="Team coordination" title="Employee management" description="Manage the workforce responsible for delivering and resolving city services." />
          <WorkerManagement />
        </section>


        {/* Resource and analytics sections */}
        <section id="city-resources" className="scroll-mt-6 rounded-2xl border border-white/85 bg-white/55 p-3 shadow-[0_10px_35px_-28px_rgba(39,75,44,0.2)] backdrop-blur-xl transition-colors duration-200 sm:rounded-3xl sm:p-5">
          <SectionHeading eyebrow="Infrastructure" title="City resources" description="Review the resources supporting essential city services." />
          <CityResources />
        </section>

        <section id="reports-analytics" className="scroll-mt-6 rounded-2xl border border-white/85 bg-white/55 p-3 shadow-[0_10px_35px_-28px_rgba(39,75,44,0.2)] backdrop-blur-xl transition-colors duration-200 sm:rounded-3xl sm:p-5">
          <SectionHeading eyebrow="Performance insights" title="Reports & analytics" description="Understand complaint trends and service performance to make informed decisions." />
          <ReportsAnalytics overview={overview} loading={overviewLoading} />
        </section>

                <section className="scroll-mt-6 rounded-2xl border border-white/85 bg-white/55 p-3 shadow-[0_10px_35px_-28px_rgba(39,75,44,0.2)] backdrop-blur-xl transition-colors duration-200 sm:rounded-3xl sm:p-5">
          <SectionHeading eyebrow="Recently joined" title="Recent citizens" description="A quick look at the latest citizen accounts registered on UrbanSaathi." />
          <RecentCitizens
            citizens={overview?.recentCitizens ?? []}
            loading={overviewLoading}
            error={overviewError}
          />
        </section>

        <ComplaintDetailsModal
          complaint={selectedComplaint}
          saving={updatingComplaintId === selectedComplaint?.id}
          onClose={() => setSelectedComplaint(null)}
          onSave={handleComplaintSave}
        />
      </div>
    </AdminLayout>
  );
}
