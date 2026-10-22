"use client";

interface DashboardStatsProps {
  total: number;
  open: number;
  resolved: number;
}

export default function DashboardStats({
  total,
  open,
  resolved,
}: DashboardStatsProps) {
  const stats = [
    {
      label: "Total complaints",
      value: total,
      note: "All your submissions",
      icon: "▤",
      iconBg: "bg-[#f1f7ee] text-[#3e7843] border border-[#dce8db]",
    },
    {
      label: "Open complaints",
      value: open,
      note: "Awaiting field resolution",
      icon: "◷",
      iconBg: "bg-[#fff9ed] text-[#b47116] border border-[#fbe5c3]",
    },
    {
      label: "Resolved",
      value: resolved,
      note: "Completed & verified",
      icon: "✓",
      iconBg: "bg-[#edf7ec] text-[#28663a] border border-[#cde5cb]",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <article
          key={s.label}
          className="group relative overflow-hidden rounded-3xl border border-[#e1ece0] bg-white p-6 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-[#cbdcca] hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#69806c]">
              {s.label}
            </span>
            <span
              className={`grid h-11 w-11 place-items-center rounded-2xl text-lg font-bold shadow-2xs transition-transform duration-200 group-hover:scale-105 ${s.iconBg}`}
            >
              {s.icon}
            </span>
          </div>

          <p className="mt-4 text-3xl font-black tracking-tight text-[#233d26]">
            {s.value}
          </p>
          <p className="mt-1 text-xs text-[#829684]">{s.note}</p>
        </article>
      ))}
    </div>
  );
}