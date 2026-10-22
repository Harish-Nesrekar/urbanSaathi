

// "use client";

// import { useCallback, useEffect, useState } from "react";
// import Link from "next/link";
// import CitizenLayout from "../../components/citizen/CitizenLayout";
// import DashboardStats from "../../components/citizen/DashboardStats";
// import ComplaintCard, {
//   type Complaint,
// } from "../../components/citizen/ComplaintCard";
// import { citizenFetch } from "../../../lib/citizen-api";

// export default function DashboardPage() {
//   const [complaints, setComplaints] = useState<Complaint[]>([]);
//   const [busy, setBusy] = useState(true);
//   const [error, setError] = useState("");

//   const load = useCallback(async () => {
//     setBusy(true);
//     setError("");

//     try {
//       const data = await citizenFetch<{
//         complaints: Complaint[];
//       }>("/api/complaints/my");

//       setComplaints(data.complaints || []);
//     } catch (err) {
//       setError(
//         err instanceof Error
//           ? err.message
//           : "Unable to load complaints. Please try again."
//       );
//     } finally {
//       setBusy(false);
//     }
//   }, []);

//   useEffect(() => {
//     void load();
//   }, [load]);

//   const open = complaints.filter(
//     (complaint) =>
//       !["RESOLVED", "REJECTED"].includes(
//         complaint.status.toUpperCase()
//       )
//   ).length;

//   const resolved = complaints.filter(
//     (complaint) => complaint.status.toUpperCase() === "RESOLVED"
//   ).length;

//   const rejected = complaints.filter(
//     (complaint) => complaint.status.toUpperCase() === "REJECTED"
//   ).length;

//   return (
//     <CitizenLayout>
//       <main className="space-y-8">
//         {/* Welcome section */}
//         <section className="relative overflow-hidden rounded-3xl border border-[#e3eae0] bg-gradient-to-br from-white via-white to-[#eaf3e6] p-6 shadow-sm sm:p-9 lg:p-10">
//           <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-[#dcebd7]/60 blur-3xl" />
//           <div className="pointer-events-none absolute -bottom-20 right-32 h-40 w-40 rounded-full bg-[#edf5e9] blur-2xl" />

//           <div className="relative">
//             <span className="inline-flex items-center gap-2 rounded-full border border-[#dbe9d8] bg-[#f1f7ee] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#416c45]">
//               <span className="h-2 w-2 rounded-full bg-[#5b9460]" />
//               Citizen dashboard
//             </span>

//             <h1 className="mt-5 max-w-2xl text-3xl font-bold tracking-tight text-[#263b2a] sm:text-4xl lg:text-5xl">
//               Welcome to UrbanSathi
//             </h1>

//             <p className="mt-4 max-w-2xl text-sm leading-7 text-[#647665] sm:text-base">
//               Your neighbourhood, your voice. Report civic issues, attach
//               photos, and follow the progress of your complaints from one
//               place.
//             </p>

//             <div className="mt-7 flex flex-col gap-3 sm:flex-row">
//               <Link
//                 href="/citizen/report"
//                 className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#47784b] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#38643d] hover:shadow-md"
//               >
//                 <span className="text-lg">＋</span>
//                 Report an issue
//               </Link>

//               <Link
//                 href="/citizen/complaints"
//                 className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dce7dc] bg-white px-5 py-3.5 text-sm font-bold text-[#456348] transition hover:bg-[#f5f8f3]"
//               >
//                 <span>▤</span>
//                 Track my complaints
//               </Link>
//             </div>
//           </div>
//         </section>

//         {/* Quick actions */}
//         <section>
//           <div className="mb-4">
//             <h2 className="text-lg font-bold text-[#263b2a]">
//               Quick actions
//             </h2>
//             <p className="mt-1 text-sm text-[#718071]">
//               Access the services you use most.
//             </p>
//           </div>

//           <div className="grid gap-4 sm:grid-cols-2">
//             <Link
//               href="/citizen/report"
//               className="group flex items-start gap-4 rounded-2xl border border-[#e3eae0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#bfd5b9] hover:shadow-md"
//             >
//               <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#eaf4e7] text-2xl text-[#47784b] transition group-hover:bg-[#dcebd7]">
//                 +
//               </span>

//               <span>
//                 <span className="block font-bold text-[#263b2a]">
//                   Report a civic issue
//                 </span>
//                 <span className="mt-1 block text-sm leading-6 text-[#718071]">
//                   Report problems in your neighbourhood and provide details.
//                 </span>
//                 <span className="mt-3 inline-block text-sm font-bold text-[#47784b]">
//                   Create report →
//                 </span>
//               </span>
//             </Link>

//             <Link
//               href="/citizen/account"
//               className="group flex items-start gap-4 rounded-2xl border border-[#e3eae0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#bfd5b9] hover:shadow-md"
//             >
//               <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#f1f7ee] text-2xl text-[#47784b] transition group-hover:bg-[#e5f0e1]">
//                 ◎
//               </span>

//               <span>
//                 <span className="block font-bold text-[#263b2a]">
//                   Profile & Settings
//                 </span>
//                 <span className="mt-1 block text-sm leading-6 text-[#718071]">
//                   Manage your personal information, email, and password.
//                 </span>
//                 <span className="mt-3 inline-block text-sm font-bold text-[#47784b]">
//                   Manage account →
//                 </span>
//               </span>
//             </Link>
//           </div>
//         </section>

//         {/* Complaint overview */}
//         <section>
//           <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
//             <div>
//               <h2 className="text-lg font-bold text-[#263b2a]">
//                 Complaint overview
//               </h2>
//               <p className="mt-1 text-sm text-[#718071]">
//                 A summary of the complaints you have submitted.
//               </p>
//             </div>

//             <button
//               type="button"
//               onClick={() => void load()}
//               disabled={busy}
//               className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dce7dc] bg-white px-4 py-2.5 text-sm font-semibold text-[#456348] transition hover:bg-[#f5f8f3] disabled:cursor-not-allowed disabled:opacity-50"
//             >
//               <span aria-hidden="true">{busy ? "◌" : "↻"}</span>
//               {busy ? "Refreshing…" : "Refresh"}
//             </button>
//           </div>

//           {error && (
//             <div
//               role="alert"
//               className="mt-4 flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center"
//             >
//               <p>{error}</p>
//               <button
//                 type="button"
//                 onClick={() => void load()}
//                 disabled={busy}
//                 className="shrink-0 font-bold underline disabled:opacity-50"
//               >
//                 Try again
//               </button>
//             </div>
//           )}

//           <div className="mt-4">
//             <DashboardStats
//               total={complaints.length}
//               open={open}
//               resolved={resolved}
//             />
//           </div>

//           {/* Additional status summary */}
//           {!busy && !error && complaints.length > 0 && (
//             <div className="mt-4 flex flex-wrap gap-2">
//               <span className="rounded-full border border-[#dce7dc] bg-white px-3 py-1.5 text-xs font-semibold text-[#586b5a]">
//                 {open} open
//               </span>

//               <span className="rounded-full border border-[#cfe3ca] bg-[#f1f8ee] px-3 py-1.5 text-xs font-semibold text-[#38643d]">
//                 {resolved} resolved
//               </span>

//               <span className="rounded-full border border-[#eadbd8] bg-[#fff5f3] px-3 py-1.5 text-xs font-semibold text-[#8b4840]">
//                 {rejected} rejected
//               </span>
//             </div>
//           )}
//         </section>

//         {/* Recent complaints */}
//         <section>
//           <div className="flex items-end justify-between gap-3">
//             <div>
//               <h2 className="text-lg font-bold text-[#263b2a]">
//                 Recent complaints
//               </h2>
//               <p className="mt-1 text-sm text-[#718071]">
//                 Your latest submitted reports.
//               </p>
//             </div>

//             <Link
//               href="/citizen/complaints"
//               className="shrink-0 text-sm font-bold text-[#47784b] transition hover:text-[#38643d] hover:underline"
//             >
//               View all →
//             </Link>
//           </div>

//           {busy && complaints.length === 0 ? (
//             <div
//               className="mt-4 flex items-center gap-3 rounded-2xl border border-[#e3eae0] bg-white p-8 text-sm text-[#718071]"
//               role="status"
//             >
//               <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#dcebd9] border-t-[#47784b]" />
//               Loading your complaints…
//             </div>
//           ) : !busy && complaints.length === 0 && !error ? (
//             <div className="mt-4 rounded-2xl border border-dashed border-[#d5e3d2] bg-white p-8 text-center sm:p-10">
//               <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#f1f7ee] text-2xl text-[#47784b]">
//                 ▤
//               </div>

//               <h3 className="mt-4 font-bold text-[#263b2a]">
//                 No complaints yet
//               </h3>

//               <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#718071]">
//                 When you report a civic issue, it will appear here so you can
//                 keep track of its progress.
//               </p>

//               <Link
//                 href="/citizen/report"
//                 className="mt-5 inline-flex rounded-xl bg-[#47784b] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#38643d]"
//               >
//                 ＋ Submit your first report
//               </Link>
//             </div>
//           ) : complaints.length > 0 ? (
//             <div className="mt-4 grid gap-4 lg:grid-cols-2">
//               {complaints.slice(0, 4).map((complaint) => (
//                 <ComplaintCard
//                   key={complaint.id}
//                   complaint={complaint}
//                   onViewDetails={() => {
//                     window.location.assign("/citizen/complaints");
//                   }}
//                 />
//               ))}
//             </div>
//           ) : null}
//         </section>

//         {/* Footer note */}
//         <div className="rounded-2xl border border-[#e3eae0] bg-[#f8faf6] px-5 py-4">
//           <p className="text-sm leading-6 text-[#647665]">
//             <span className="font-bold text-[#38643d]">
//               Together for a better city.
//             </span>{" "}
//             Thank you for helping make your neighbourhood cleaner, safer,
//             and better managed.
//           </p>
//         </div>
//       </main>
//     </CitizenLayout>
//   );
// }
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import CitizenLayout from "../../components/citizen/CitizenLayout";
import DashboardStats from "../../components/citizen/DashboardStats";
import ComplaintCard, {
  type Complaint,
} from "../../components/citizen/ComplaintCard";
import MiniatureCityHero from "../../components/citizen/MiniatureCityHero";
import { AboutUsModal, ContactModal } from "../../components/citizen/CityModals";
import { citizenFetch } from "../../../lib/citizen-api";

export default function DashboardPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  // Modals for the Figma wireframe's About Us & Contact nodes
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setError("");

    try {
      const data = await citizenFetch<{
        complaints: Complaint[];
      }>("/api/complaints/my");

      setComplaints(data.complaints || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load complaints. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const open = complaints.filter(
    (complaint) =>
      !["RESOLVED", "REJECTED"].includes(complaint.status.toUpperCase())
  ).length;

  const resolved = complaints.filter(
    (complaint) => complaint.status.toUpperCase() === "RESOLVED"
  ).length;

  const rejected = complaints.filter(
    (complaint) => complaint.status.toUpperCase() === "REJECTED"
  ).length;

  return (
    <CitizenLayout>
      <main className="space-y-8">
        {/* Figma Hero: Animated Miniature City + Cursor-responsive Mascot */}
        <MiniatureCityHero
          onOpenAbout={() => setIsAboutOpen(true)}
          onOpenContact={() => setIsContactOpen(true)}
        />

        {/* Quick actions (Figma left/main service flows) */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-black tracking-tight text-[#233d26]">
              Quick Actions
            </h2>
            <p className="mt-1 text-xs text-[#627765] sm:text-sm">
              Instant access to core citizen civic utilities.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/citizen/report"
              className="group relative flex items-start gap-4 overflow-hidden rounded-3xl border border-[#e1ece0] bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#cbddca] hover:shadow-md"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#eaf4e7] text-2xl font-bold text-[#3f7a44] transition-all group-hover:scale-105 group-hover:bg-[#dcebd7]">
                ＋
              </span>

              <span className="min-w-0">
                <span className="block font-bold text-[#233d26]">
                  Report a Civic Issue
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#677c6a] sm:text-sm">
                  Potholes, broken streetlights, garbage heaps, or water leaks.
                </span>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#3f7a44] transition-transform group-hover:translate-x-1">
                  Create new report →
                </span>
              </span>
            </Link>

            <Link
              href="/citizen/account"
              className="group relative flex items-start gap-4 overflow-hidden rounded-3xl border border-[#e1ece0] bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#cbddca] hover:shadow-md"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#f1f7ee] text-2xl font-bold text-[#3f7a44] transition-all group-hover:scale-105 group-hover:bg-[#e4efe0]">
                ◎
              </span>

              <span className="min-w-0">
                <span className="block font-bold text-[#233d26]">
                  Profile & Settings
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#677c6a] sm:text-sm">
                  Manage your personal details, email address, and security.
                </span>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#3f7a44] transition-transform group-hover:translate-x-1">
                  Manage account →
                </span>
              </span>
            </Link>
          </div>
        </section>

        {/* Complaint Overview with Stats */}
        <section>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-black tracking-tight text-[#233d26]">
                Complaint Overview
              </h2>
              <p className="mt-1 text-xs text-[#627765] sm:text-sm">
                A live summary of all issues you have submitted.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void load()}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dce7dc] bg-white px-4 py-2 text-xs font-bold text-[#3f7a44] shadow-2xs transition hover:bg-[#f5f8f3] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{busy ? "◌" : "↻"}</span>
              <span>{busy ? "Refreshing…" : "Refresh"}</span>
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 flex flex-col justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center"
            >
              <p>{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                disabled={busy}
                className="shrink-0 font-bold underline hover:text-red-900 disabled:opacity-50"
              >
                Try again
              </button>
            </div>
          )}

          {/* Stat Cards */}
          <div className="mt-4">
            <DashboardStats
              total={complaints.length}
              open={open}
              resolved={resolved}
            />
          </div>

          {/* Status Pills */}
          {!busy && !error && complaints.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-[#dce8db] bg-white px-3.5 py-1 text-xs font-semibold text-[#546b56]">
                {open} open
              </span>

              <span className="rounded-full border border-[#cfe3ca] bg-[#eef7ec] px-3.5 py-1 text-xs font-semibold text-[#2e5e34]">
                {resolved} resolved
              </span>

              <span className="rounded-full border border-[#fbd3cf] bg-[#fff5f4] px-3.5 py-1 text-xs font-semibold text-[#9e2c24]">
                {rejected} rejected
              </span>
            </div>
          )}
        </section>

        {/* Recent complaints grid */}
        <section>
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight text-[#233d26]">
                Recent Complaints
              </h2>
              <p className="mt-1 text-xs text-[#627765] sm:text-sm">
                Your latest submitted reports.
              </p>
            </div>

            <Link
              href="/citizen/complaints"
              className="shrink-0 text-xs font-bold text-[#3f7a44] transition hover:text-[#2d5831] hover:underline sm:text-sm"
            >
              View all ({complaints.length}) →
            </Link>
          </div>

          {busy && complaints.length === 0 ? (
            <div
              className="mt-4 flex items-center justify-center gap-3 rounded-3xl border border-[#e1ece0] bg-white p-12 text-sm text-[#627765]"
              role="status"
            >
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#d5e7d3] border-t-[#3f7a44]" />
              Loading your complaints…
            </div>
          ) : !busy && complaints.length === 0 && !error ? (
            <div className="mt-4 rounded-3xl border border-dashed border-[#d5e3d2] bg-white p-10 text-center sm:p-14">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#edf6eb] text-2xl text-[#3f7a44]">
                📋
              </div>

              <h3 className="mt-4 text-base font-bold text-[#233d26]">
                No complaints yet
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#6c806e] sm:text-sm">
                When you report a civic issue, its verification and progress
                will show right here.
              </p>

              <Link
                href="/citizen/report"
                className="mt-5 inline-flex rounded-xl bg-[#3f7a44] px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[#326436]"
              >
                ＋ Submit your first report
              </Link>
            </div>
          ) : complaints.length > 0 ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {complaints.slice(0, 4).map((complaint) => (
                <ComplaintCard
                  key={complaint.id}
                  complaint={complaint}
                  onViewDetails={() => {
                    window.location.assign("/citizen/complaints");
                  }}
                />
              ))}
            </div>
          ) : null}
        </section>

        {/* Footer Note */}
        <div className="rounded-2xl border border-[#e1ece0] bg-[#f9fbf8] px-5 py-4">
          <p className="text-xs leading-5 text-[#5e7361] sm:text-sm">
            <span className="font-bold text-[#2e5e34]">
              Together for a cleaner, safer city.
            </span>{" "}
            UrbanSaathi directly routes citizen reports to the municipal zone
            engineers.
          </p>
        </div>
      </main>

      {/* Wireframe Modals */}
      <AboutUsModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </CitizenLayout>
  );
}