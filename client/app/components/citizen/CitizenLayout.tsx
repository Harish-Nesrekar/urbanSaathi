"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import CitizenSidebar from "./CitizenSidebar";
import CitizenHeader from "./CitizenHeader";
import PageTransition from "./PageTransition";
import { API_BASE } from "@/lib/citizen-api";

const pageInfo: Record<string, { title: string; subtitle: string }> = {
  "/citizen/dashboard": {
    title: "Overview",
    subtitle: "A quick view of your civic activity",
  },
  "/citizen/report": {
    title: "Report an issue",
    subtitle: "Help make your neighbourhood better",
  },
  "/citizen/complaints": {
    title: "My complaints",
    subtitle: "Track the status of your reports",
  },
  "/citizen/account": {
    title: "Profile & Settings",
    subtitle: "Manage your personal details & security",
  },
  "/citizen/profile": {
    title: "Profile",
    subtitle: "Manage your personal details",
  },
  "/citizen/settings": {
    title: "Settings",
    subtitle: "Keep your account secure",
  },
};

export default function CitizenLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function verifyCitizen() {
      const token =
        localStorage.getItem("citizenToken") ||
        sessionStorage.getItem("citizenToken");

      if (!token) {
        window.location.replace("/");
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/test/protected`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (cancelled) return;

        if (response.status === 401) {
          localStorage.removeItem("citizenToken");
          sessionStorage.removeItem("citizenToken");
          window.location.replace("/");
          return;
        }

        if (response.status === 403) {
          setError(
            data?.message ||
              "Your account does not have permission to access this page."
          );
          setChecking(false);
          return;
        }

        if (!response.ok) {
          throw new Error(
            data?.message || "Could not verify citizen access."
          );
        }

        if (data?.user?.role !== "CITIZEN") {
          setError(
            "This account does not have citizen access. Sign in using the correct account type."
          );
          setChecking(false);
          return;
        }

        setError("");
        setChecking(false);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Unable to reach the server. Please try again."
        );
        setChecking(false);
      }
    }

    void verifyCitizen();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const info = pageInfo[pathname] || pageInfo["/citizen/dashboard"];

  if (checking) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7faf5] text-[#47784b]">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#dcebd9] border-t-[#47784b]" />
          <p className="mt-4 text-sm font-semibold">Verifying your account…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7faf5] p-5">
        <div className="max-w-md rounded-3xl border border-[#e3eae0] bg-white p-8 text-center shadow-md">
          <h1 className="text-xl font-black text-[#263b2a]">
            Unable to verify your account
          </h1>
          <p className="mt-3 text-sm text-[#718071]">{error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-[#47784b] px-5 py-3 text-sm font-bold text-white shadow-xs hover:bg-[#38643d]"
            >
              Try again
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("citizenToken");
                sessionStorage.removeItem("citizenToken");
                window.location.replace("/");
              }}
              className="rounded-xl border border-[#dcebd9] bg-white px-5 py-3 text-sm font-bold text-[#47784b] hover:bg-[#f5f9f3]"
            >
              Sign in
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7faf5] text-[#263b2a]">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-[#e3eae0] bg-white transition-transform duration-300 ease-in-out lg:w-[250px] lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <CitizenSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="min-w-0 lg:pl-[250px]">
        <CitizenHeader
          title={info.title}
          subtitle={info.subtitle}
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        <main className="mx-auto max-w-7xl p-4 sm:p-7 lg:p-9">
          <PageTransition>{children}</PageTransition>

          <footer className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[#e3eae0] py-6 text-xs text-[#879287] sm:flex-row">
            <span>© {new Date().getFullYear()} UrbanSaathi · Smart City Services</span>
            <span className="font-semibold text-[#48784d]">
              Live Citizen Municipal Dashboard
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}