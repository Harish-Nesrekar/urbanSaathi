"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

type Props = {
  adminId: number;
  title: string;
  onSignOut: () => void;
  children: ReactNode;
  roleLabel?: string;
  workspaceLabel?: string;
  dashboardHref?: string;
};

export default function AdminLayout({
  adminId,
  title,
  onSignOut,
  children,
  roleLabel = "Administrator",
  workspaceLabel = "Administration",
  dashboardHref = "/admin/dashboard",
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer when returning to desktop dimensions.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent background scrolling while the mobile navigation is open.
  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  return (
    <main className="relative isolate min-h-screen overflow-x-clip bg-[#f1f6ef] text-[#263b2a] selection:bg-[#cce5c7] selection:text-[#23432b]">
      {/* Lightweight ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-40 -top-32 h-[340px] w-[340px] rounded-full bg-[#d5e9ce]/60 blur-[90px] sm:h-[420px] sm:w-[420px]" />
        <div className="absolute -right-36 top-[22%] h-[360px] w-[360px] rounded-full bg-[#dce9e5]/65 blur-[100px] sm:h-[460px] sm:w-[460px]" />
        <div className="absolute -bottom-44 left-[24%] h-[360px] w-[440px] rounded-full bg-[#e2ead1]/55 blur-[100px]" />

        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(#7e9b7c 0.65px, transparent 0.65px)",
            backgroundSize: "26px 26px",
          }}
        />
      </div>

      <AdminSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        roleLabel={roleLabel}
        dashboardHref={dashboardHref}
      />

      {/* Main content follows the sidebar width on desktop */}
      <div
        className={`relative min-h-screen min-w-0 transition-[margin] duration-300 ease-in-out motion-reduce:transition-none ${
          collapsed ? "lg:ml-[84px]" : "lg:ml-64"
        }`}
      >
        <AdminHeader
          adminId={adminId}
          title={title}
          mobileOpen={mobileOpen}
          onOpenMenu={() => setMobileOpen((value) => !value)}
          onSignOut={onSignOut}
          roleLabel={roleLabel}
          workspaceLabel={workspaceLabel}
        />

        <div className="mx-auto w-full max-w-[1800px] min-w-0 px-3 pb-3 pt-4 sm:px-5 sm:pt-6 lg:px-8 lg:pt-8">
          {/* Keep the surface subtle so individual pages control their own cards */}
          <section className="relative min-w-0 rounded-[22px] border border-white/70 bg-white/20 p-3 shadow-[0_12px_44px_-36px_rgba(43,76,46,0.20)] sm:rounded-[28px] sm:p-5 lg:p-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
            />

            <div className="relative min-w-0">{children}</div>
          </section>

          <footer className="flex flex-col items-center justify-between gap-2 px-2 py-5 text-center text-[11px] text-[#829283] sm:flex-row sm:px-3 sm:text-left">
            <p>
              <span className="font-semibold text-[#56735a]">UrbanSathi</span>
              {" "}· Smart City Resource Management
            </p>

            <p className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#70a777]" />
              {roleLabel} workspace
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
