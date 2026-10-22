"use client";

import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutUsModal({ isOpen, onClose }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl rounded-3xl border border-[#d2e2ce] bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-xl border border-[#dce7dc] p-2 text-sm font-bold text-[#456348] hover:bg-[#f2f7f0]"
          aria-label="Close dialog"
        >
          ✕
        </button>

        {/* Header with Mascot Theme */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#ebf6e8] text-3xl shadow-inner">
            👷‍♂️
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#3d7042]">
              About UrbanSaathi
            </span>
            <h3 className="text-xl font-black text-[#233b26]">
              Building a Smarter, Safer City
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-3.5 text-sm leading-6 text-[#586b5c]">
          <p>
            UrbanSaathi bridges citizens and local municipal administration.
            Whether it&apos;s reporting potholes, faulty street lighting, water
            pipeline leaks, or sanitation hazards, we provide a unified tracking
            portal so your civic concerns reach the right zonal engineers directly.
          </p>

          <div className="rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] p-4">
            <h4 className="font-bold text-[#2f5534]">How your voice makes an impact:</h4>
            <ul className="mt-2 space-y-2 list-disc pl-5 text-xs text-[#526a56]">
              <li>
                <strong>Direct Dispatch:</strong> Automated assignment to the nearest municipal maintenance department.
              </li>
              <li>
                <strong>Transparent Accountability:</strong> Follow stage-by-stage status changes with inspector notes.
              </li>
              <li>
                <strong>Community Insights:</strong> Helps city planners prioritize infrastructure upgrades where they matter most.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Button */}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-[#3f7a44] py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[#326436]"
        >
          Close & Return to Dashboard
        </button>
      </div>
    </div>
  );
}

export function ContactModal({ isOpen, onClose }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-[#d2e2ce] bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-xl border border-[#dce7dc] p-2 text-sm font-bold text-[#456348] hover:bg-[#f2f7f0]"
          aria-label="Close dialog"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#eaf4ff] text-3xl shadow-inner">
            📞
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#2f669a]">
              Support & Helpline
            </span>
            <h3 className="text-xl font-black text-[#233b26]">
              Civic Operations Desk
            </h3>
          </div>
        </div>

        {/* Contact Details */}
        <div className="mt-5 space-y-3">
          <div className="rounded-2xl border border-[#dbe6f0] bg-[#f8fbfe] p-4 text-sm">
            <div className="font-bold text-[#203c4f]">
              🚨 Emergency Civic Toll-Free
            </div>
            <div className="mt-1 font-mono text-xl font-black text-[#1e5d8b]">
              1800-200-URBAN (87226)
            </div>
            <div className="mt-0.5 text-xs text-[#637d90]">
              Operational 24/7 for water bursts, open manholes, and electrical hazards.
            </div>
          </div>

          <div className="rounded-2xl border border-[#e1ebe0] bg-[#f8fbf7] p-4 text-sm">
            <div className="font-bold text-[#2a452d]">
              ✉️ Citizen Support Desk
            </div>
            <div className="mt-1 font-mono text-sm font-bold text-[#35633a]">
              support@urbansaathi.gov.in
            </div>
            <div className="mt-0.5 text-xs text-[#657d69]">
              Average resolution reply: under 12 hours.
            </div>
          </div>

          <div className="rounded-2xl border border-[#e6eee3] bg-[#fafcf9] p-4 text-sm">
            <div className="font-bold text-[#2a452d]">
              🏢 Central Municipal Office
            </div>
            <div className="mt-1 text-xs leading-5 text-[#5d7361]">
              Civic Operations Center, 4th Floor, Municipal Corporation Complex, Main Boulevard.
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-[#3f7a44] py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[#326436]"
        >
          Done
        </button>
      </div>
    </div>
  );
}