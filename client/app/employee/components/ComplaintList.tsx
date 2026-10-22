"use client";

import { Dispatch, SetStateAction } from "react";
import { ActiveTab, Complaint } from "../types";
import ComplaintCard from "./ComplaintCard";

type ComplaintListProps = {
  activeTab: ActiveTab;
  setActiveTab: Dispatch<SetStateAction<ActiveTab>>;
  error: string;
  loading: boolean;
  filteredComplaints: Complaint[];
  onRetry: () => void;
  selectedStatuses: Record<number, string>;
  onStatusChange: (id: number, status: string) => void;
  notes: Record<number, string>;
  onNoteChange: (id: number, note: string) => void;
  savingIds: number[];
  messages: Record<number, string>;
  onUpdateStatus: (id: number) => void;
  imageUrls: Record<string, string>;
  imageErrors: Record<string, boolean>;
  onPreviewImage: (url: string) => void;
};

export default function ComplaintList({
  activeTab,
  setActiveTab,
  error,
  loading,
  filteredComplaints,
  onRetry,
  selectedStatuses,
  onStatusChange,
  notes,
  onNoteChange,
  savingIds,
  messages,
  onUpdateStatus,
  imageUrls,
  imageErrors,
  onPreviewImage,
}: ComplaintListProps) {
  const tabs: ActiveTab[] = ["ALL", "PENDING", "IN_PROGRESS", "RESOLVED"];

  return (
    <section id="complaints" className="scroll-mt-24 space-y-4">
      <div className="flex flex-col justify-between gap-4 border-t border-[#e5eee3] pt-6 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-xl font-black text-[#233d26]">
            Department Complaints Management
          </h3>
          <p className="text-xs text-[#637a66] sm:text-sm">
            Inspect attached evidence, update ticket stage, and append field progress logs.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === tab
                  ? "bg-[#3e7843] text-white shadow-2xs"
                  : "border border-[#dce8db] bg-white text-[#526a55] hover:bg-[#f2f7f0]"
              }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800"
        >
          <p className="font-bold">Error loading complaints:</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800"
          >
            Retry Connection
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-3xl border border-[#e1ece0] bg-white p-14 text-sm text-[#667d69]">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#d5e7d3] border-t-[#3f7a44]" />
          <span className="ml-3 font-semibold">
            Loading department complaints queue…
          </span>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#d5e3d2] bg-white p-12 text-center">
          <span className="text-3xl text-[#3f7a44]">✓</span>
          <h4 className="mt-3 text-base font-bold text-[#233d26]">
            No complaints found in this category
          </h4>
          <p className="mt-1 text-xs text-[#718774]">
            All assigned reports for this filter are currently addressed.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredComplaints.map((complaint) => (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint}
              selectedStatus={
                selectedStatuses[complaint.id] ??
                (complaint.status || "UNDER_REVIEW")
              }
              onStatusChange={onStatusChange}
              note={notes[complaint.id] || ""}
              onNoteChange={onNoteChange}
              isSaving={savingIds.includes(complaint.id)}
              message={messages[complaint.id]}
              onUpdateStatus={onUpdateStatus}
              imageUrls={imageUrls}
              imageErrors={imageErrors}
              onPreviewImage={onPreviewImage}
            />
          ))}
        </div>
      )}
    </section>
  );
}