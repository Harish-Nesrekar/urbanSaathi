"use client";

import CitizenLayout from "../../components/citizen/CitizenLayout";
import PasswordForm from "../../components/citizen/PasswordForm";

export default function SettingsPage() {
  return (
    <CitizenLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl border border-[#dce8db] bg-gradient-to-r from-[#edf6ea] via-white to-[#e4f2e0] p-6 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#3e7243]">
            Security Center
          </span>
          <h1 className="mt-1 text-2xl font-black text-[#233d26] sm:text-3xl">
            Account Security
          </h1>
          <p className="mt-1 text-xs text-[#5e7762] sm:text-sm">
            Protect your citizen profile and update your password regularly.
          </p>
        </div>

        <PasswordForm />
      </div>
    </CitizenLayout>
  );
}