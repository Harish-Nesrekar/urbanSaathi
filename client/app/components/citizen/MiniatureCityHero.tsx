"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface MiniatureCityHeroProps {
  onOpenAbout: () => void;
  onOpenContact: () => void;
}

export default function MiniatureCityHero({
  onOpenAbout,
  onOpenContact,
}: MiniatureCityHeroProps) {
  const [greeting, setGreeting] = useState("Welcome");
  const [pupilPos, setPupilPos] = useState({ x: 0, y: 0 });
  const [headTilt, setHeadTilt] = useState({ x: 0, y: 0 });
  const [mascotBubble, setMascotBubble] = useState(
    "Hi! Hover around and explore our city!"
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Time-based greeting (Morning / Afternoon / Evening)
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Track cursor position to tilt head and move mascot pupils
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) / (rect.width / 2);
    const deltaY = (e.clientY - centerY) / (rect.height / 2);

    // Limit pupil movement within eye radius
    setPupilPos({
      x: Math.max(-5, Math.min(5, deltaX * 7)),
      y: Math.max(-4, Math.min(4, deltaY * 6)),
    });

    // Subtly tilt mascot towards cursor
    setHeadTilt({
      x: deltaX * 6,
      y: deltaY * 4,
    });
  };

  const handleMascotClick = () => {
    const quotes = [
      "Let's build a cleaner, safer neighbourhood together!",
      "Spotted a pothole or dark street? Tap 'Report an issue'!",
      "I'm keeping an eye on our city blocks!",
      "Every report helps our field teams respond faster!",
    ];
    const next = quotes[Math.floor(Math.random() * quotes.length)];
    setMascotBubble(next);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative overflow-hidden rounded-3xl border border-[#d8e5d3] bg-gradient-to-b from-[#e3f2fd] via-[#f0f8ef] to-[#e6f2e2] p-6 shadow-sm transition-all sm:p-9"
    >
      <div className="relative z-10 flex flex-col items-center justify-between gap-8 lg:flex-row">
        {/* Left Side: Welcoming Header & Actions */}
        <div className="w-full text-center lg:w-1/2 lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#cadfc4] bg-[#eef7ec] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#38643d]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#4ba353]" />
            Citizen Dashboard
          </div>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#223925] sm:text-4xl lg:text-5xl">
            {greeting},{" "}
            <span className="bg-gradient-to-r from-[#2f6635] to-[#4c8f53] bg-clip-text text-transparent">
              Citizen!
            </span>
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-[#59715b] sm:text-base">
            Welcome to the UrbanSaathi live civic hub. Watch your city thrive,
            report infrastructure bottlenecks, and monitor civic maintenance in
            real time.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link
              href="/citizen/report"
              className="inline-flex items-center gap-2 rounded-xl bg-[#3f7a44] px-5 py-3 text-sm font-bold text-white shadow transition-transform hover:-translate-y-0.5 hover:bg-[#326436]"
            >
              <span className="text-lg leading-none">＋</span> Report an issue
            </Link>

            <Link
              href="/citizen/complaints"
              className="inline-flex items-center gap-2 rounded-xl border border-[#cbe0c7] bg-white px-5 py-3 text-sm font-bold text-[#355b38] transition hover:bg-[#f2f7f0]"
            >
              <span>▤</span> Track my complaints
            </Link>
          </div>

          {/* Quick links for About Us & Contact from Figma */}
          <div className="mt-6 flex items-center justify-center gap-6 text-sm font-bold text-[#3e6842] lg:justify-start">
            <button
              type="button"
              onClick={onOpenAbout}
              className="group flex items-center gap-1.5 transition hover:text-[#254328]"
            >
              <span>🏢 About us</span>
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </button>
            <span className="text-[#a4bda2]">•</span>
            <button
              type="button"
              onClick={onOpenContact}
              className="group flex items-center gap-1.5 transition hover:text-[#254328]"
            >
              <span>📞 Contact Helpline</span>
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </button>
          </div>
        </div>

        {/* Right Side: Miniature City Diorama + Live Responsive Mascot */}
        <div className="relative flex w-full max-w-lg items-center justify-center lg:w-1/2">
          {/* Miniature City Container */}
          <div className="relative h-64 w-full select-none rounded-2xl border border-[#cce0c8] bg-gradient-to-b from-[#bfe2f7] via-[#e5f5de] to-[#c7e3bd] p-4 shadow-inner">
            {/* Sun */}
            <div className="absolute right-6 top-4 h-12 w-12 animate-pulse rounded-full bg-amber-300 opacity-90 blur-[1px] ring-8 ring-amber-100/50" />

            {/* Construction Crane Animation */}
            <div className="absolute left-6 top-3">
              <svg width="90" height="90" viewBox="0 0 100 100">
                <line
                  x1="20"
                  y1="90"
                  x2="20"
                  y2="20"
                  stroke="#5c6a79"
                  strokeWidth="4"
                />
                <line
                  x1="20"
                  y1="20"
                  x2="75"
                  y2="20"
                  stroke="#e67e22"
                  strokeWidth="4"
                />
                <line
                  x1="20"
                  y1="20"
                  x2="5"
                  y2="20"
                  stroke="#e67e22"
                  strokeWidth="4"
                />
                <line
                  x1="60"
                  y1="20"
                  x2="60"
                  y2="55"
                  stroke="#7f8c8d"
                  strokeWidth="1.5"
                  strokeDasharray="2"
                  className="animate-pulse"
                />
                <rect
                  x="54"
                  y="55"
                  width="12"
                  height="8"
                  fill="#d35400"
                  rx="1"
                />
                <polygon points="12,90 28,90 20,80" fill="#34495e" />
              </svg>
            </div>

            {/* City skyline silhouettes */}
            <div className="absolute bottom-12 left-4 right-4 flex items-end justify-between opacity-85">
              <div className="h-28 w-12 rounded-t-md bg-[#7c9780] shadow-sm">
                <div className="grid grid-cols-2 gap-1 p-1">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="h-2 w-3 rounded-xs bg-[#fff3a8] opacity-80"
                    />
                  ))}
                </div>
              </div>

              <div className="h-36 w-16 rounded-t-md bg-[#648469] shadow-sm">
                <div className="mx-auto mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-red-600">
                  +
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5 p-1.5">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="h-2 w-4 rounded-xs bg-[#def1fc] opacity-80"
                    />
                  ))}
                </div>
              </div>

              <div className="h-24 w-11 rounded-t-md bg-[#8aa68e]">
                <div className="grid grid-cols-2 gap-1 p-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-2 w-2.5 rounded-xs bg-[#fff8cf]"
                    />
                  ))}
                </div>
              </div>

              <div className="h-32 w-14 rounded-t-md bg-[#58795c]">
                <div className="grid grid-cols-2 gap-1 p-1.5">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="h-2.5 w-3 rounded-xs bg-[#fefefe] opacity-80"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Road & Maintenance Truck */}
            <div className="absolute bottom-2 left-0 right-0 h-10 border-t-2 border-[#b0c7ad] bg-[#434b45]">
              <div className="absolute top-4 left-0 right-0 flex justify-around">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="h-1 w-6 bg-[#f4d03f]" />
                ))}
              </div>
              <div className="absolute -top-3 animate-[marquee_14s_linear_infinite] text-xl">
                🚐💨
              </div>
            </div>

            {/* Interactive Mascot (tracks cursor) */}
            <div
              onClick={handleMascotClick}
              className="group absolute -bottom-1 right-6 z-20 flex cursor-pointer flex-col items-center transition-transform hover:scale-105"
              style={{
                transform: `translate(${headTilt.x}px, ${headTilt.y}px)`,
              }}
            >
              {/* Dialogue Bubble */}
              <div className="relative mb-1 max-w-[170px] rounded-xl border border-[#3e6f42] bg-white px-2.5 py-1.5 text-center text-xs font-semibold text-[#234225] shadow-lg">
                <span>{mascotBubble}</span>
                <div className="absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-[#3e6f42] bg-white" />
              </div>

              {/* Cartoon Character SVG */}
              <svg
                width="84"
                height="100"
                viewBox="0 0 100 120"
                className="filter drop-shadow-md"
              >
                {/* Construction Yellow Helmet */}
                <ellipse cx="50" cy="38" rx="28" ry="18" fill="#f39c12" />
                <path
                  d="M 24 38 Q 50 18 76 38 Z"
                  fill="#f1c40f"
                  stroke="#d68910"
                  strokeWidth="2"
                />
                <rect
                  x="46"
                  y="20"
                  width="8"
                  height="12"
                  rx="2"
                  fill="#d68910"
                />
                <line
                  x1="22"
                  y1="38"
                  x2="78"
                  y2="38"
                  stroke="#d68910"
                  strokeWidth="3"
                />

                {/* Head */}
                <circle cx="50" cy="46" r="21" fill="#ffeaa7" />

                {/* Left Eye & Pupil */}
                <ellipse cx="43" cy="45" rx="5" ry="6" fill="#ffffff" />
                <circle
                  cx={43 + pupilPos.x}
                  cy={45 + pupilPos.y}
                  r="2.5"
                  fill="#2c3e50"
                />
                <circle
                  cx={42 + pupilPos.x}
                  cy={44 + pupilPos.y}
                  r="0.8"
                  fill="#ffffff"
                />

                {/* Right Eye & Pupil */}
                <ellipse cx="57" cy="45" rx="5" ry="6" fill="#ffffff" />
                <circle
                  cx={57 + pupilPos.x}
                  cy={45 + pupilPos.y}
                  r="2.5"
                  fill="#2c3e50"
                />
                <circle
                  cx={56 + pupilPos.x}
                  cy={44 + pupilPos.y}
                  r="0.8"
                  fill="#ffffff"
                />

                {/* Cheeks */}
                <ellipse
                  cx="37"
                  cy="51"
                  rx="2.5"
                  ry="1.5"
                  fill="#ff7675"
                  opacity="0.6"
                />
                <ellipse
                  cx="63"
                  cy="51"
                  rx="2.5"
                  ry="1.5"
                  fill="#ff7675"
                  opacity="0.6"
                />

                {/* Friendly Smile */}
                <path
                  d="M 44 54 Q 50 59 56 54"
                  stroke="#2d3436"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />

                {/* Civic Vest Body */}
                <path
                  d="M 33 66 L 67 66 L 73 98 L 27 98 Z"
                  fill="#27ae60"
                  rx="4"
                />
                <rect x="36" y="74" width="28" height="5" fill="#f1c40f" />
                <rect x="34" y="86" width="32" height="5" fill="#f1c40f" />

                {/* Waving Hand */}
                <g className="origin-[25px_70px] animate-[bounce_2s_infinite]">
                  <ellipse cx="23" cy="72" rx="5" ry="5" fill="#ffeaa7" />
                  <path
                    d="M 23 72 L 32 68"
                    stroke="#27ae60"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </g>

                {/* Right Hand */}
                <ellipse cx="77" cy="78" rx="5" ry="5" fill="#ffeaa7" />
                <path
                  d="M 75 78 L 68 70"
                  stroke="#27ae60"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}