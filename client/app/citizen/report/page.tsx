"use client";

import CitizenLayout from "../../components/citizen/CitizenLayout";
import ComplaintForm from "../../components/citizen/ComplaintForm";

export default function ReportPage() {
  return (
    <CitizenLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Animated Banner with Mascot Element */}
        <div className="relative overflow-hidden rounded-3xl border border-[#dce8db] bg-gradient-to-r from-[#edf6ea] via-white to-[#e4f2e0] p-6 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 animate-bounce items-center justify-center rounded-2xl bg-[#3f7a44] text-2xl text-white shadow-xs">
              🚧
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#3e7243]">
                Civic Services
              </span>
              <h1 className="text-2xl font-black text-[#233d26] sm:text-3xl">
                Report an Issue
              </h1>
              <p className="mt-1 text-xs text-[#5e7762] sm:text-sm">
                Provide clear details and photos so municipal teams can resolve it swiftly.
              </p>
            </div>
          </div>
        </div>

        {/* Existing Complaint Form */}
        <ComplaintForm />
      </div>
    </CitizenLayout>
  );
}