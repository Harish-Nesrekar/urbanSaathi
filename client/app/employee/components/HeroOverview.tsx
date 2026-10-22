"use client";

type HeroOverviewProps = {
  greeting: string;
  employeeName: string;
  departmentName: string;
};

export default function HeroOverview({
  greeting,
  employeeName,
  departmentName,
}: HeroOverviewProps) {
  return (
    <section
      id="overview"
      className="relative overflow-hidden rounded-3xl border border-[#dbe8da] bg-gradient-to-br from-[#ebf5ea] via-white to-[#e2f0e0] p-6 shadow-2xs sm:p-9"
    >
      <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#cadfc6] bg-[#eef7ec] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#35633a]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#419a4a]" />
            Active Field Session
          </span>

          <h2 className="mt-3 text-3xl font-black tracking-tight text-[#223b25] sm:text-4xl">
            {greeting}, {employeeName}!
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5b735e]">
            Welcome back to the municipal command desk. Review real-time triage
            tickets, verify work evidence, and dispatch resolutions for{" "}
            <strong>{departmentName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-[#d2e4cf] bg-white/90 p-4 shadow-sm backdrop-blur-xs">
          <div className="flex h-12 w-12 shrink-0 animate-bounce items-center justify-center rounded-2xl bg-[#3f7a44] text-2xl text-white shadow-xs">
            👷
          </div>
          <div className="text-xs">
            <span className="font-bold text-[#233d26]">Officer Dashboard</span>
            <p className="text-[#657d68]">Auto-syncs every 10s</p>
          </div>
        </div>
      </div>
    </section>
  );
}