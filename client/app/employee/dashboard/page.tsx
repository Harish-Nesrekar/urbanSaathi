"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import {
  DepartmentResponse,
  EmployeeUser,
  ActiveTab,
} from "../types";
import {
  API_BASE,
  statusOptions,
  parseAttachments,
} from "../utils";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import HeroOverview from "../components/HeroOverview";
import AnalyticsSection from "../components/AnalyticsSection";
import ComplaintList from "../components/ComplaintList";
import ImagePreviewModal from "../components/ImagePreviewModal";

export default function EmployeeDashboardPage() {
  const [employee, setEmployee] = useState<EmployeeUser | null>(null);
  const [data, setData] = useState<DepartmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("ALL");

  const [selectedStatuses, setSelectedStatuses] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [savingIds, setSavingIds] = useState<number[]>([]);
  const [messages, setMessages] = useState<Record<number, string>>({});

  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const handleSignOut = useCallback(() => {
    localStorage.removeItem("employeeToken");
    sessionStorage.removeItem("employeeToken");
    localStorage.removeItem("employeeUser");
    sessionStorage.removeItem("employeeUser");
    window.location.replace("/");
  }, []);

  const loadComplaints = useCallback(
    async (showRefresh = false, silent = false) => {
      const token =
        localStorage.getItem("employeeToken") ||
        sessionStorage.getItem("employeeToken");

      if (!token) {
        window.location.replace("/");
        return;
      }

      if (showRefresh) setRefreshing(true);
      else if (!silent) setLoading(true);

      if (!silent) setError("");

      try {
        const response = await fetch(`${API_BASE}/api/complaints/department`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const result = await response.json().catch(() => ({}));

        if (response.status === 401) {
          handleSignOut();
          return;
        }

        if (response.status === 403) {
          setError(
            result.message ||
              "Your employee account does not have permission to access these complaints."
          );
          return;
        }

        if (!response.ok) {
          throw new Error(
            result.message || "Unable to load department complaints."
          );
        }

        const payload = result as DepartmentResponse;
        const complaints = Array.isArray(payload.complaints)
          ? payload.complaints.map((complaint) => ({
              ...complaint,
              attachments: parseAttachments(complaint.attachments),
            }))
          : [];

        setData({
          ...payload,
          complaints,
        });

        setSelectedStatuses((previous) => {
          const next = { ...previous };
          for (const complaint of complaints) {
            if (!(complaint.id in next)) {
              next[complaint.id] = statusOptions.includes(complaint.status)
                ? complaint.status
                : "UNDER_REVIEW";
            }
          }
          return next;
        });
      } catch (err) {
        if (!silent) {
          setError(
            err instanceof Error ? err.message : "Unable to connect to the server."
          );
        }
      } finally {
        if (!silent) setLoading(false);
        if (showRefresh) setRefreshing(false);
      }
    },
    [handleSignOut]
  );

  useEffect(() => {
    try {
      const storedUser =
        localStorage.getItem("employeeUser") ||
        sessionStorage.getItem("employeeUser");

      if (storedUser) {
        setEmployee(JSON.parse(storedUser) as EmployeeUser);
      }
    } catch {
      setEmployee(null);
    }

    void loadComplaints();
  }, [loadComplaints]);

  // Sync polling
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadComplaints(false, true);
    }, 10_000);

    return () => window.clearInterval(intervalId);
  }, [loadComplaints]);

  // Load complaint images
  useEffect(() => {
    let cancelled = false;
    const createdUrls: string[] = [];

    async function loadImages() {
      const token =
        localStorage.getItem("employeeToken") ||
        sessionStorage.getItem("employeeToken");

      if (!token || !data?.complaints?.length) return;

      for (const complaint of data.complaints) {
        const attachments = parseAttachments(complaint.attachments);

        for (const attachment of attachments) {
          const key = `${complaint.id}-${attachment.id}`;

          try {
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
              if (!cancelled) {
                setImageErrors((prev) => ({ ...prev, [key]: true }));
              }
              continue;
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            createdUrls.push(url);

            if (cancelled) {
              URL.revokeObjectURL(url);
              continue;
            }

            setImageUrls((prev) => ({ ...prev, [key]: url }));
            setImageErrors((prev) => ({ ...prev, [key]: false }));
          } catch {
            if (!cancelled) {
              setImageErrors((prev) => ({ ...prev, [key]: true }));
            }
          }
        }
      }
    }

    void loadImages();

    return () => {
      cancelled = true;
      createdUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [data]);

  const updateStatus = async (complaintId: number) => {
    const token =
      localStorage.getItem("employeeToken") ||
      sessionStorage.getItem("employeeToken");

    if (!token) {
      handleSignOut();
      return;
    }

    const status = selectedStatuses[complaintId];

    if (!statusOptions.includes(status)) {
      setMessages((prev) => ({
        ...prev,
        [complaintId]: "Please select a valid status.",
      }));
      return;
    }

    setSavingIds((prev) => [...prev, complaintId]);
    setMessages((prev) => ({ ...prev, [complaintId]: "" }));

    try {
      const response = await fetch(
        `${API_BASE}/api/complaints/department/${complaintId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            note: notes[complaintId] || "",
          }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        handleSignOut();
        return;
      }

      if (response.status === 403) {
        setMessages((prev) => ({
          ...prev,
          [complaintId]:
            result.message || "You do not have permission to perform this action.",
        }));
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || "Could not update complaint.");
      }

      setMessages((prev) => ({
        ...prev,
        [complaintId]: result.message || "Complaint status updated.",
      }));

      setNotes((prev) => ({ ...prev, [complaintId]: "" }));
      await loadComplaints(true);
    } catch (err) {
      setMessages((prev) => ({
        ...prev,
        [complaintId]:
          err instanceof Error ? err.message : "Unable to update complaint.",
      }));
    } finally {
      setSavingIds((prev) => prev.filter((id) => id !== complaintId));
    }
  };

  const handleStatusChange = (id: number, status: string) => {
    setSelectedStatuses((prev) => ({ ...prev, [id]: status }));
  };

  const handleNoteChange = (id: number, note: string) => {
    setNotes((prev) => ({ ...prev, [id]: note }));
  };

  const complaints = data?.complaints || [];

  const pendingCount = complaints.filter((c) =>
    ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "REOPENED"].includes(c.status)
  ).length;

  const inProgressCount = complaints.filter((c) => c.status === "IN_PROGRESS").length;
  const resolvedCount = complaints.filter((c) => c.status === "RESOLVED").length;
  const rejectedCount = complaints.filter((c) => c.status === "REJECTED").length;

  const departmentValue = data?.department;
  const departmentName =
    typeof departmentValue === "string"
      ? departmentValue
      : departmentValue?.name || data?.department_name || "Zonal Operations";

  const employeeName = employee?.full_name || employee?.name || "Field Officer";

  const filteredComplaints = useMemo(() => {
    if (activeTab === "PENDING") {
      return complaints.filter((c) =>
        ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "REOPENED"].includes(c.status)
      );
    }
    if (activeTab === "IN_PROGRESS") {
      return complaints.filter((c) => c.status === "IN_PROGRESS");
    }
    if (activeTab === "RESOLVED") {
      return complaints.filter((c) => c.status === "RESOLVED");
    }
    return complaints;
  }, [complaints, activeTab]);

  const resolutionRate = complaints.length
    ? Math.round((resolvedCount / complaints.length) * 100)
    : 0;

  return (
    <div className="flex min-h-screen bg-[#f7faf5] text-[#243e27]">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        departmentName={departmentName}
        employeeName={employeeName}
        setActiveTab={setActiveTab}
      />

      <div className="min-w-0 flex-1">
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          onRefresh={() => void loadComplaints(true)}
          onSignOut={handleSignOut}
          refreshing={refreshing}
          loading={loading}
        />

        <main className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:space-y-8 sm:p-7 lg:p-9">
          <HeroOverview
            greeting={greeting}
            employeeName={employeeName}
            departmentName={departmentName}
          />

          <AnalyticsSection
            loading={loading}
            resolutionRate={resolutionRate}
            totalComplaints={complaints.length}
            pendingCount={pendingCount}
            inProgressCount={inProgressCount}
            resolvedCount={resolvedCount}
            rejectedCount={rejectedCount}
          />

          <ComplaintList
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            error={error}
            loading={loading}
            filteredComplaints={filteredComplaints}
            onRetry={() => void loadComplaints()}
            selectedStatuses={selectedStatuses}
            onStatusChange={handleStatusChange}
            notes={notes}
            onNoteChange={handleNoteChange}
            savingIds={savingIds}
            messages={messages}
            onUpdateStatus={updateStatus}
            imageUrls={imageUrls}
            imageErrors={imageErrors}
            onPreviewImage={setPreviewImage}
          />
        </main>
      </div>

      <ImagePreviewModal
        previewImage={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}