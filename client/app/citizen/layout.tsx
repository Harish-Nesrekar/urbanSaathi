import type { ReactNode } from "react";

// Keeps /citizen/login and /citizen/register unwrapped while nested pages utilize CitizenLayout.
export default function CitizenRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="min-h-screen bg-[#f7faf5]">{children}</div>;
}