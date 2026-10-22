"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Props = {
  collapsed: boolean;
  mobileOpen: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  roleLabel?: string;
  dashboardHref?: string;
};

type NavigationItem = {
  label: string;
  description: string;
  href: string;
  icon: string;
};

export default function AdminSidebar({
  collapsed,
  mobileOpen,
  onClose,
  onToggleCollapse,
  roleLabel = "Administrator",
  dashboardHref = "/admin/dashboard",
}: Props) {
  const pathname = usePathname();
  const isEmployee = roleLabel === "Employee";

  const [currentHash, setCurrentHash] = useState("");
  const [activeSection, setActiveSection] = useState("");

  const navigation: {
    title: string;
    items: NavigationItem[];
  }[] = isEmployee
    ? [
        {
          title: "WORKSPACE",
          items: [
            {
              label: "Overview",
              description: "Your department at a glance",
              href: dashboardHref,
              icon: "▦",
            },
            {
              label: "Department Complaints",
              description: "Review assigned citizen issues",
              href: `${dashboardHref}#complaints`,
              icon: "▤",
            },
          ],
        },
      ]
    : [
        {
          title: "WORKSPACE",
          items: [
            {
              label: "Overview",
              description: "City operations at a glance",
              href: dashboardHref,
              icon: "▦",
            },
            {
              label: "Complaint Management",
              description: "Review and resolve issues",
              href: `${dashboardHref}#complaint-management`,
              icon: "▤",
            },
          ],
        },
        {
          title: "PEOPLE & SERVICES",
          items: [
            {
              label: "Citizen Management",
              description: "Citizen accounts and records",
              href: `${dashboardHref}#citizen-management`,
              icon: "♙",
            },
            {
              label: "Worker Management",
              description: "Staff and department assignments",
              href: `${dashboardHref}#worker-management`,
              icon: "♧",
            },
            {
              label: "City Resources",
              description: "Public facilities and infrastructure",
              href: `${dashboardHref}#city-resources`,
              icon: "⌂",
            },
          ],
        },
        {
          title: "INSIGHTS",
          items: [
            {
              label: "Reports & Analytics",
              description: "Service performance and trends",
              href: `${dashboardHref}#reports-analytics`,
              icon: "▥",
            },
          ],
        },
      ];

  const syncHash = useCallback(() => {
    setCurrentHash(window.location.hash.replace(/^#/, ""));
  }, []);

  useEffect(() => {
    syncHash();
    const initialHash = window.location.hash.replace(/^#/, "");

    // A dashboard opened without a section hash should always start at Overview,
    // even if the browser tries to restore the previous scroll position on refresh.
    if (!initialHash && pathname === dashboardHref) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      setActiveSection("");
      setCurrentHash("");
    } else {
      setActiveSection(initialHash);
    }

    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);

    // Keep the selected sidebar item in sync with whichever dashboard section
    // is actually visible while the user scrolls (not only after clicking a link).
    const sectionIds = navigation.flatMap((group) =>
      group.items.map((item) => item.href.split("#")[1]).filter(Boolean) as string[]
    );
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);

    if (sections.length > 0 && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible[0]?.target.id) {
            setActiveSection(visible[0].target.id);
          }
        },
        { root: null, rootMargin: "-18% 0px -62% 0px", threshold: 0 }
      );
      sections.forEach((section) => observer.observe(section));

      const handleScroll = () => {
        const marker = window.innerHeight * 0.28;
        let current = "";
        sections.forEach((section) => {
          if (section.getBoundingClientRect().top <= marker) current = section.id;
        });
        setActiveSection(current);
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();

      return () => {
        observer.disconnect();
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("hashchange", syncHash);
        window.removeEventListener("popstate", syncHash);
      };
    }

    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("popstate", syncHash);
    };
  }, [syncHash, pathname, roleLabel, dashboardHref]);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onClose]);

  const isActive = (item: NavigationItem) => {
    const [itemPath, itemHash] = item.href.split("#");

    if (pathname !== itemPath) return false;

    if (!itemHash) {
      return activeSection === "" && currentHash === "";
    }

    return activeSection ? activeSection === itemHash : currentHash === itemHash;
  };

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#183321]/35 backdrop-blur-[3px] transition-opacity duration-200 lg:hidden"
        />
      )}

      <aside
        id="admin-sidebar"
        aria-label={`${roleLabel} sidebar`}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-x-hidden overflow-y-auto overscroll-contain border-r border-white/80 bg-[#f8fbf6]/95 px-3 py-4 shadow-[12px_0_45px_-30px_rgba(31,61,38,0.3)] backdrop-blur-2xl transition-[width,transform] duration-300 ease-in-out motion-reduce:transition-none sm:px-4 sm:py-5 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-[84px]" : "lg:w-64"} w-[min(288px,88vw)]`}
      >
        {/* Brand */}
        <div
          className={`flex min-h-12 items-center gap-3 px-1 ${
            collapsed ? "lg:justify-center lg:px-0" : ""
          }`}
        >
          <Link
            href={dashboardHref}
            onClick={onClose}
            aria-label="UrbanSathi dashboard"
            className="group flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65976b] focus-visible:ring-offset-2"
          >
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[15px] border border-white/80 bg-gradient-to-br from-[#72a878] via-[#477c50] to-[#315d3a] text-xl font-bold text-white shadow-[0_5px_16px_-5px_rgba(55,105,62,0.35)]">
              <span className="absolute inset-x-1 top-0 h-1/2 rounded-t-[13px] bg-white/15" />
              <span className="relative">U</span>
            </span>

            <span className={collapsed ? "lg:hidden" : "min-w-0"}>
              <span className="block text-[15px] font-bold tracking-tight text-[#263b2a]">
                UrbanSathi
              </span>
              <span className="mt-0.5 block text-[10px] text-[#819082]">
                {isEmployee ? "Employee workspace" : "City administration"}
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e2eade] bg-white/70 text-xl text-[#586b5a] transition-colors hover:bg-[#edf6e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65976b] lg:hidden"
          >
            ×
          </button>
        </div>

        {/* Always-visible collapse control directly under the brand */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/80 bg-white/65 px-3 py-2 text-xs font-semibold text-[#5c755e] shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65976b] ${collapsed ? "lg:px-1" : ""}`}
        >
          <span aria-hidden="true" className="text-base leading-none">
            {collapsed ? "→" : "←"}
          </span>
          <span className={collapsed ? "lg:hidden" : ""}>
            {collapsed ? "Expand sidebar" : "Collapse sidebar"}
          </span>
        </button>

        {/* Navigation groups */}
        <nav
          aria-label={`${roleLabel} navigation`}
          className="mt-7 flex-1 space-y-6"
        >
          {navigation.map((group) => (
            <section key={group.title}>
              <h2
                className={`mb-2 px-3 text-[10px] font-bold tracking-[0.16em] text-[#91a091] ${
                  collapsed ? "lg:hidden" : ""
                }`}
              >
                {group.title}
              </h2>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item);

                  const classes = `group relative flex min-h-[48px] items-center gap-3 rounded-2xl border px-2.5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65976b] focus-visible:ring-offset-1 ${
                    collapsed ? "lg:justify-center lg:px-0" : ""
                  } ${
                    active
                      ? "border-[#dfecd9] bg-gradient-to-r from-[#e6f3e1] to-white/85 text-[#315f39] shadow-[0_3px_12px_-8px_rgba(49,95,57,0.35)]"
                      : "border-transparent text-[#637565] hover:border-white/90 hover:bg-white/75 hover:text-[#315f39]"
                  }`;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => {
                        onClose();
                        const nextHash = item.href.split("#")[1] ?? "";
                        setCurrentHash(nextHash);
                        setActiveSection(nextHash);
                      }}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={classes}
                    >
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-[#55945e]"
                        />
                      )}

                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[17px] transition-colors duration-200 ${
                          active
                            ? "bg-white text-[#477c50] shadow-sm"
                            : "bg-white/60 text-[#819782] group-hover:bg-[#edf6e9] group-hover:text-[#477c50]"
                        }`}
                      >
                        {item.icon}
                      </span>

                      <span
                        className={`min-w-0 flex-1 ${
                          collapsed ? "lg:hidden" : ""
                        }`}
                      >
                        <span className="block truncate text-[12px] font-semibold leading-5">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] leading-4 text-[#94a195]">
                          {item.description}
                        </span>
                      </span>

                      {active && (
                        <span
                          aria-hidden="true"
                          className={`h-1.5 w-1.5 shrink-0 rounded-full bg-[#5d9564] ${
                            collapsed ? "lg:hidden" : ""
                          }`}
                        />
                      )}

                      {collapsed && (
                        <span className="pointer-events-none absolute left-[calc(100%+10px)] z-[60] hidden whitespace-nowrap rounded-lg border border-white/80 bg-white/95 px-3 py-2 text-xs font-semibold text-[#355d3c] shadow-lg backdrop-blur-xl group-hover:block group-focus-visible:block">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        {/* Protected session */}
        <div className="mt-6 border-t border-[#dce7d9]/80 pt-4">
          <div
            title="Administrator session protected"
            className={`rounded-2xl border border-white/90 bg-white/60 p-2.5 ${
              collapsed ? "lg:flex lg:justify-center lg:px-1.5" : ""
            }`}
          >
            <div
              className={`flex items-center gap-2.5 ${
                collapsed ? "lg:justify-center" : ""
              }`}
            >
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#eff8eb] to-[#dcefd5] text-sm text-[#47784b]">
                ✓
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#69a975]" />
              </span>

              <span className={collapsed ? "lg:hidden" : ""}>
                <span className="block text-xs font-semibold text-[#3e6043]">
                  Session protected
                </span>
                <span className="mt-1 block text-[10px] text-[#8a998b]">
                  {roleLabel} access
                </span>
              </span>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
}
