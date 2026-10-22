"use client";

import { Dispatch, SetStateAction } from "react";
import { ActiveTab } from "../types";

type SidebarProps = {
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: Dispatch<SetStateAction<boolean>>;
  departmentName: string;
  employeeName: string;
  setActiveTab: Dispatch<SetStateAction<ActiveTab>>;
};

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
  departmentName,
  employeeName,
  setActiveTab,
}: SidebarProps) {
  return (
    <>
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/80 bg-white/80 p-4 shadow-[0_20px_60px_-30px_rgba(39,75,44,.28)] backdrop-blur-2xl transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${sidebarCollapsed ? "lg:w-[88px]" : "w-[min(288px,88vw)] lg:w-64"}`}
      >
        <div
          className={`flex items-center border-b border-[#eef4ec] pb-4 ${
            sidebarCollapsed ? "lg:flex-col lg:gap-3" : "justify-between gap-2"
          }`}
        >
          <div
            className={`flex min-w-0 items-center gap-2.5 ${
              sidebarCollapsed ? "lg:justify-center" : ""
            }`}
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[#2f6834] to-[#1e4823] text-lg font-black text-white shadow-xs">
              U
            </span>
            <div className={sidebarCollapsed ? "lg:hidden" : "min-w-0"}>
              <strong className="block text-base font-black tracking-tight text-[#233d26]">
                UrbanSaathi
              </strong>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#437848]">
                Employee panel
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-[#f1f6ef] hover:text-[#254228] lg:hidden"
          >
            ✕
          </button>
        </div>

        <button
          type="button"
          onClick={() => setSidebarCollapsed((v) => !v)}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="mt-3 hidden min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#dce8db] bg-white/75 px-3 text-sm font-bold text-[#456348] transition hover:bg-[#edf6ea] lg:flex"
        >
          <span className="text-lg" aria-hidden="true">
            {sidebarCollapsed ? "→" : "←"}
          </span>
          <span className={sidebarCollapsed ? "lg:hidden" : ""}>
            {sidebarCollapsed ? "Expand menu" : "Collapse menu"}
          </span>
        </button>

        <p
          className={`mt-6 mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-[#859884] ${
            sidebarCollapsed ? "lg:hidden" : ""
          }`}
        >
          Menu
        </p>

        <nav className="space-y-1.5 text-sm font-semibold">
          <a
            href="#overview"
            onClick={() => setSidebarOpen(false)}
            title="Complaint overview"
            className={`flex items-center gap-3 rounded-2xl bg-[#eaf4e7] px-4 py-3 font-bold text-[#27532c] shadow-2xs ${
              sidebarCollapsed ? "lg:justify-center lg:px-2" : ""
            }`}
          >
            <span className="text-base">📊</span>
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>
              Complaint overview
            </span>
          </a>

          <a
            href="#complaints"
            onClick={() => {
              setActiveTab("ALL");
              setSidebarOpen(false);
            }}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[#556c58] transition hover:bg-[#f2f7f0] hover:text-[#233d26] ${
              sidebarCollapsed ? "lg:justify-center lg:px-2" : ""
            }`}
          >
            <span className="text-base">📁</span>
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>
              Complaint management
            </span>
          </a>

          <a
            href="#complaints"
            onClick={() => {
              setActiveTab("IN_PROGRESS");
              setSidebarOpen(false);
            }}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[#556c58] transition hover:bg-[#f2f7f0] hover:text-[#233d26] ${
              sidebarCollapsed ? "lg:justify-center lg:px-2" : ""
            }`}
          >
            <span className="text-base">🏢</span>
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>
              Department complaints
            </span>
          </a>

          <a
            href="#analytics"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[#556c58] transition hover:bg-[#f2f7f0] hover:text-[#233d26] ${
              sidebarCollapsed ? "lg:justify-center lg:px-2" : ""
            }`}
          >
            <span className="text-base">📈</span>
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>
              Complaint progress
            </span>
          </a>
        </nav>

        <div
          className={`mt-auto rounded-3xl border border-[#dce8db] bg-gradient-to-br from-[#ebf5ea] to-[#f4f9f2] p-4 text-xs ${
            sidebarCollapsed ? "lg:hidden" : ""
          }`}
        >
          <span className="font-bold uppercase tracking-wider text-[#2e5e34]">
            Department Station
          </span>
          <p className="mt-1 font-bold text-sm text-[#1e3e23]">{departmentName}</p>
          <p className="mt-0.5 text-[#5e7762]">{employeeName} · Field Officer</p>
        </div>
      </aside>
    </>
  );
}