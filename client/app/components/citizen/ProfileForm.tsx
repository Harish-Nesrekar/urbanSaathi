"use client";

import { useEffect, useState } from "react";
import { citizenFetch } from "@/lib/citizen-api";

const input =
  "mt-2 w-full rounded-xl border border-[#dce7dc] bg-white px-4 py-3 text-sm text-[#243e27] outline-none transition placeholder:text-[#9aa89b] focus:border-[#47784b] focus:ring-4 focus:ring-[#47784b]/10 disabled:bg-[#f5f8f3] disabled:text-[#889989]";

const label = "block text-sm font-semibold text-[#28442c]";

export default function ProfileForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    citizenFetch<any>("/api/profile")
      .then((d) => {
        const p = d.profile || d.user || d;
        setName(p.full_name || p.fullName || "");
        setEmail(p.email || "");
      })
      .catch((e) => setError(e.message));
  }, []);

  async function request(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await citizenFetch("/api/profile/request-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: name.trim() }),
      });
      setSent(true);
      setMessage("Verification code sent to your registered email.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send OTP.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const d = await citizenFetch<any>("/api/profile/verify-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      const p = d.profile || d.user || d;
      setName(p.full_name || p.fullName || name);
      setSent(false);
      setOtp("");
      setMessage("Profile updated successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "OTP verification failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="max-w-2xl rounded-3xl border border-[#e1ece0] bg-white p-6 shadow-2xs sm:p-9">
      <div>
        <h2 className="text-xl font-black text-[#233d26]">
          Personal details
        </h2>
        <p className="mt-1 text-sm text-[#667d69]">
          A 6-digit code sent to your registered email verifies name changes.
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

      <form onSubmit={request} className="mt-6 space-y-5">
        <label className={label}>
          Full name
          <input
            className={input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={sent || busy}
            maxLength={100}
            required
            placeholder="Your official full name"
          />
        </label>

        <label className={label}>
          Registered email
          <input
            className={`${input} bg-[#f5f8f3] text-[#718574]`}
            type="email"
            value={email}
            readOnly
          />
          <span className="mt-1 block text-xs text-[#879989]">
            Email address is read-only for citizen security.
          </span>
        </label>

        {!sent && (
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3f7a44] px-6 py-3.5 text-sm font-bold text-white shadow-2xs transition hover:bg-[#326436] disabled:opacity-50"
          >
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Sending verification code…
              </>
            ) : (
              "Send verification code →"
            )}
          </button>
        )}
      </form>

      {sent && (
        <form
          onSubmit={verify}
          className="mt-6 space-y-4 rounded-2xl border border-[#d8e6d5] bg-[#f7faf5] p-5 sm:p-6"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e5f0e1] text-lg text-[#3f7a44]">
              ✉
            </span>
            <div>
              <p className="font-bold text-[#233d26]">Confirm Verification</p>
              <p className="text-xs text-[#6a806d]">
                Enter the code sent to your registered inbox.
              </p>
            </div>
          </div>

          <label className={label}>
            6-digit email OTP
            <input
              className={`${input} max-w-xs text-center text-xl font-bold tracking-[0.4em]`}
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              required
              pattern="[0-9]{6}"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={busy || otp.length !== 6}
              className="rounded-xl bg-[#3f7a44] px-5 py-2.5 text-sm font-bold text-white shadow-2xs hover:bg-[#326436] disabled:opacity-50"
            >
              {busy ? "Verifying…" : "Verify and save"}
            </button>

            <button
              type="button"
              onClick={() => {
                setSent(false);
                setOtp("");
              }}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-[#667d69] hover:bg-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}