"use client";

type AnalyticsSectionProps = {
  loading: boolean;
  resolutionRate: number;
  totalComplaints: number;
  pendingCount: number;
  inProgressCount: number;
  resolvedCount: number;
  rejectedCount: number;
};

export default function AnalyticsSection({
  loading,
  resolutionRate,
  totalComplaints,
  pendingCount,
  inProgressCount,
  resolvedCount,
  rejectedCount,
}: AnalyticsSectionProps) {
  const barData = [
    {
      label: "Pending",
      count: pendingCount,
      color: "from-amber-400 to-amber-500",
      max: Math.max(totalComplaints, 1),
    },
    {
      label: "In Progress",
      count: inProgressCount,
      color: "from-blue-400 to-blue-600",
      max: Math.max(totalComplaints, 1),
    },
    {
      label: "Resolved",
      count: resolvedCount,
      color: "from-emerald-400 to-emerald-600",
      max: Math.max(totalComplaints, 1),
    },
    {
      label: "Rejected",
      count: rejectedCount,
      color: "from-rose-400 to-rose-600",
      max: Math.max(totalComplaints, 1),
    },
  ];

  const quickStats = [
    {
      label: "Total Registered",
      value: totalComplaints,
      icon: "▤",
      bg: "bg-[#f1f7ee] text-[#3e7843]",
    },
    {
      label: "Pending Inspection",
      value: pendingCount,
      icon: "◷",
      bg: "bg-[#fff9ed] text-[#b47116]",
    },
    {
      label: "Under Maintenance",
      value: inProgressCount,
      icon: "↻",
      bg: "bg-[#f0f7ff] text-[#1f6db3]",
    },
    {
      label: "Closed & Resolved",
      value: resolvedCount,
      icon: "✓",
      bg: "bg-[#edf7ec] text-[#28663a]",
    },
  ];

  return (
    <section id="analytics" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-[#233d26]">
            Complaint Overview & Analytics
          </h3>
          <p className="text-xs text-[#637a66] sm:text-sm">
            Velocity graphs, status breakdown, and resolution health.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Animated Resolution Rate Meter */}
        <div className="flex flex-col justify-between rounded-3xl border border-[#e1ece0] bg-white p-6 shadow-2xs">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#69806c]">
              Resolution Velocity
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-black text-[#233d26]">
                {loading ? "—" : `${resolutionRate}%`}
              </span>
              <span className="text-xs font-bold text-emerald-600">
                Completed
              </span>
            </div>
            <p className="mt-1 text-xs text-[#7f9482]">
              {resolvedCount} of {totalComplaints} tickets resolved
            </p>
          </div>

          <div className="mt-6">
            <div className="h-3 w-full overflow-hidden rounded-full bg-[#eef5ed]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#3e7843] to-[#5bb363] transition-all duration-1000 ease-out"
                style={{ width: `${loading ? 0 : resolutionRate}%` }}
              />
            </div>
            <div className="mt-3 flex justify-between text-[11px] font-bold text-[#718774]">
              <span>In-Queue ({pendingCount + inProgressCount})</span>
              <span>Resolved ({resolvedCount})</span>
            </div>
          </div>
        </div>

        {/* Workload Distribution Graph */}
        <div className="rounded-3xl border border-[#e1ece0] bg-white p-6 shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[#f0f5ee] pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#69806c]">
                Workload Distribution Graph
              </span>
              <p className="text-xs text-[#7f9482]">
                Live metrics across departmental operational buckets
              </p>
            </div>
            <span className="rounded-xl bg-[#f2f8f0] px-3 py-1 text-xs font-bold text-[#356138]">
              {totalComplaints} Total Cases
            </span>
          </div>

          <div className="mt-5 grid h-40 grid-cols-4 items-end gap-3 pt-4 sm:gap-6">
            {barData.map((bar) => {
              const heightPercent = Math.max(
                14,
                Math.round((bar.count / bar.max) * 100)
              );
              return (
                <div
                  key={bar.label}
                  className="group flex h-full flex-col items-center justify-end"
                >
                  <span className="mb-1 text-xs font-black text-[#233d26] transition-transform group-hover:-translate-y-1">
                    {bar.count}
                  </span>
                  <div
                    style={{ height: `${loading ? 0 : heightPercent}%` }}
                    className={`w-full max-w-[54px] rounded-t-2xl bg-gradient-to-t ${bar.color} transition-all duration-700 ease-out shadow-xs group-hover:opacity-90`}
                  />
                  <span className="mt-2 max-w-full truncate text-[10px] font-bold text-[#718774]">
                    {bar.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {quickStats.map((s) => (
          <div
            key={s.label}
            className="rounded-3xl border border-[#e1ece0] bg-white p-5 shadow-2xs transition hover:-translate-y-0.5 hover:shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#79907c]">
                {s.label}
              </span>
              <span
                className={`grid h-8 w-8 place-items-center rounded-xl text-sm font-bold ${s.bg}`}
              >
                {s.icon}
              </span>
            </div>
            <p className="mt-3 text-2xl font-black text-[#233d26]">
              {loading ? "—" : s.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}