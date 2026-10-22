"use client";

import { useState } from "react";
import { citizenFetch } from "@/lib/citizen-api";

const input =
  "mt-2 w-full rounded-xl border border-[#dce7dc] bg-white px-4 py-3 text-sm text-[#243e27] outline-none transition placeholder:text-[#9aa89b] focus:border-[#47784b] focus:ring-4 focus:ring-[#47784b]/10 disabled:bg-[#f5f8f3]";

const labelStyle = "block text-sm font-semibold text-[#28442c]";

export default function PasswordForm() {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirm) {
      setError("The new passwords do not match.");
      return;
    }

    if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/\d/.test(newPassword) ||
      !/[^A-Za-z0-9]/.test(newPassword) ||
      /\s/.test(newPassword)
    ) {
      setError(
        "Use 8+ characters with uppercase, lowercase, a number, and a special character. No spaces."
      );
      return;
    }

    setBusy(true);

    try {
      await citizenFetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrent("");
      setNew("");
      setConfirm("");
      setMessage("Password changed successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to change password.");
    } finally {
      setBusy(false);
    }
  }

  const fields: [string, string, (v: string) => void, string][] = [
    ["Current password", currentPassword, setCurrent, "current-password"],
    ["New password", newPassword, setNew, "new-password"],
    ["Confirm new password", confirm, setConfirm, "new-password"],
  ];

  return (
    <section className="max-w-2xl rounded-3xl border border-[#e1ece0] bg-white p-6 shadow-2xs sm:p-9">
      <div>
        <h2 className="text-xl font-black text-[#233d26]">Change password</h2>
        <p className="mt-1 text-sm text-[#667d69]">
          Use a strong password that you do not use on other platforms.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="mt-5 rounded-2xl border border-[#cfe3ca] bg-[#eef7ec] p-4 text-sm font-semibold text-[#2f5e35]"
        >
          {message}
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-5">
        {fields.map(([title, val, setter, auto]) => (
          <label key={title} className={labelStyle}>
            {title}
            <input
              className={input}
              type="password"
              autoComplete={auto}
              value={val}
              onChange={(e) => setter(e.target.value)}
              minLength={title === "Current password" ? 1 : 8}
              required
              placeholder="••••••••"
            />
          </label>
        ))}

        <div className="rounded-xl border border-[#dce8db] bg-[#f8faf6] p-3 text-xs leading-5 text-[#6b806d]">
          🔒 Must be at least 8 characters with an uppercase letter, lowercase
          letter, digit, and special symbol.
        </div>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3f7a44] px-6 py-3.5 text-sm font-bold text-white shadow-2xs transition hover:bg-[#326436] disabled:opacity-50"
        >
          {busy ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Updating password…
            </>
          ) : (
            "Update Password →"
          )}
        </button>
      </form>
    </section>
  );
}