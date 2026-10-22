"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CitizenLayout from "../../components/citizen/CitizenLayout";
import { citizenFetch } from "../../../lib/citizen-api";

type Profile = {
  full_name: string;
  email: string;
  original_email: string;
  phone: string | null;
  created_at?: string;
};

type ProfileResponse = {
  profile?: Profile;
  user?: Profile;
  data?: Profile;
  message?: string;
};

const inputClass =
  "mt-2 w-full rounded-xl border border-[#dce7dc] bg-white px-4 py-3 text-sm text-[#263b2a] outline-none transition placeholder:text-[#9aa69a] focus:border-[#47784b] focus:ring-4 focus:ring-[#47784b]/10 disabled:bg-[#f5f8f3] disabled:text-[#879287]";

const labelClass = "text-sm font-semibold text-[#344d37]";

export default function AccountPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoadingProfile(true);
      setError("");

      try {
        const response = await citizenFetch<ProfileResponse>("/api/profile");
        const data = response.profile ?? response.user ?? response.data;

        if (!data) {
          throw new Error("The server did not return your profile details.");
        }

        if (!active) return;
        setProfile(data);
        setFullName(data.full_name ?? "");
        setEmail(data.email ?? "");
        setPhone(data.phone ?? "");
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load your profile."
          );
        }
      } finally {
        if (active) setLoadingProfile(false);
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    if (!profile) {
      setError("Your profile has not loaded. Please refresh the page.");
      return;
    }

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (phone.trim() && !/^[0-9+\-\s()]{7,20}$/.test(phone.trim())) {
      setError("Please enter a valid phone number.");
      return;
    }

    const changingPassword = newPassword.length > 0;

    if (changingPassword) {
      if (!currentPassword) {
        setError("Enter your current password to change your password.");
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("The new password and confirmation do not match.");
        return;
      }

      const strongPassword =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,}$/;

      if (!strongPassword.test(newPassword)) {
        setError(
          "Use at least 8 characters, including uppercase, lowercase, a number and a special character."
        );
        return;
      }
    } else if (confirmPassword) {
      setError("Enter a new password or clear the confirmation field.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await citizenFetch<{ message?: string }>(
        "/api/profile/request-update",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            currentPassword: changingPassword ? currentPassword : "",
            newPassword: changingPassword ? newPassword : "",
          }),
        }
      );

      setOtpRequested(true);
      setOtp("");
      setResendSeconds(60);
      setSuccess(
        response.message ||
          "Verification code sent. Check your original registered email."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not send the verification code."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function resendOtp() {
    clearMessages();
    setSubmitting(true);

    try {
      await citizenFetch("/api/profile/request-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          currentPassword: newPassword ? currentPassword : "",
          newPassword: newPassword || "",
        }),
      });

      setOtp("");
      setResendSeconds(60);
      setSuccess("A new verification code has been sent to your original email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend the code.");
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the complete six-digit verification code.");
      return;
    }

    setVerifying(true);

    try {
      const response = await citizenFetch<{
        message?: string;
        profile?: Profile;
        user?: Profile;
      }>("/api/profile/verify-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });

      setSuccess(response.message || "Your account details were updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOtp("");
      setOtpRequested(false);
      setResendSeconds(0);

      const refreshed = await citizenFetch<ProfileResponse>("/api/profile");
      const updated = refreshed.profile ?? refreshed.user ?? refreshed.data;

      if (updated) {
        setProfile(updated);
        setFullName(updated.full_name ?? "");
        setEmail(updated.email ?? "");
        setPhone(updated.phone ?? "");
      }

      router.replace("/citizen/account");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Verification failed. Please check the code and try again."
      );
    } finally {
      setVerifying(false);
    }
  }

  function cancelVerification() {
    setOtpRequested(false);
    setOtp("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setResendSeconds(0);
    clearMessages();

    if (profile) {
      setFullName(profile.full_name);
      setEmail(profile.email);
      setPhone(profile.phone ?? "");
    }
  }

  return (
    <CitizenLayout>
      <div className="mx-auto max-w-4xl">
        <section className="overflow-hidden rounded-3xl border border-[#e1ece0] bg-white shadow-sm">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-white via-[#fcfdfa] to-[#edf6ea] p-6 sm:p-9">
            <span className="inline-flex rounded-full border border-[#dbe9d8] bg-[#f1f7ee] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#3d6e42]">
              Account & Profile
            </span>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#233d26] sm:text-4xl">
              Profile & Settings
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#627765]">
              Update your registered profile and password. For security, updates
              are applied only after email verification.
            </p>
          </div>

          <div className="p-5 sm:p-9">
            {error && (
              <div
                role="alert"
                className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mb-6 rounded-2xl border border-[#cfe3ca] bg-[#f1f8ee] p-4 text-sm font-semibold text-[#326137]"
              >
                {success}
              </div>
            )}

            {loadingProfile ? (
              <div className="flex items-center gap-3 py-12 text-sm text-[#718071]">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#dcebd9] border-t-[#47784b]" />
                Loading your account details…
              </div>
            ) : !profile ? (
              <div className="rounded-2xl border border-dashed border-[#d5e3d2] p-8 text-center">
                <p className="font-semibold text-[#344d37]">
                  Unable to load your account
                </p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-xl bg-[#47784b] px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-[#38643d]"
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                {/* Account Summary Badge */}
                <div className="mb-8 flex items-start gap-4 rounded-2xl border border-[#e3eae0] bg-[#f9fbf8] p-4 sm:p-5">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e5f0e1] text-xl font-bold text-[#47784b]">
                    {fullName.trim().charAt(0).toUpperCase() || "U"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#233d26]">{profile.full_name}</p>
                    <p className="mt-0.5 break-all text-xs text-[#647967]">{profile.email}</p>
                    <p className="mt-1 text-[11px] text-[#869989]">
                      Registered:{" "}
                      {profile.created_at
                        ? new Date(profile.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Civic Citizen"}
                    </p>
                  </div>
                </div>

                <form onSubmit={requestOtp} className="space-y-8">
                  {/* Personal Information */}
                  <section>
                    <h2 className="text-base font-bold text-[#233d26]">
                      Personal details
                    </h2>
                    <p className="mt-0.5 text-xs text-[#718071]">
                      Your details are shared only with the assigned municipal ward officer.
                    </p>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className={labelClass}>
                        Full name
                        <input
                          className={inputClass}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Enter your full name"
                          autoComplete="name"
                          disabled={otpRequested || submitting}
                          required
                        />
                      </label>

                      <label className={labelClass}>
                        Phone number
                        <input
                          className={inputClass}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Enter phone number"
                          autoComplete="tel"
                          disabled={otpRequested || submitting}
                        />
                      </label>

                      <label className={`${labelClass} sm:col-span-2`}>
                        Account email
                        <input
                          className={inputClass}
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          autoComplete="email"
                          disabled={otpRequested || submitting}
                          required
                        />
                        <span className="mt-1.5 block text-xs text-[#718071]">
                          Verification OTPs are sent to your current verified address.
                        </span>
                      </label>
                    </div>
                  </section>

                  <div className="border-t border-[#edf4ec]" />

                  {/* Password Section */}
                  <section>
                    <h2 className="text-base font-bold text-[#233d26]">
                      Password & Security
                    </h2>
                    <p className="mt-0.5 text-xs text-[#718071]">
                      Leave empty if you don&apos;t wish to change your password.
                    </p>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className={labelClass}>
                        Current password
                        <input
                          className={inputClass}
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          autoComplete="current-password"
                          placeholder="Current password"
                          disabled={otpRequested || submitting}
                        />
                      </label>

                      <div className="hidden sm:block" />

                      <label className={labelClass}>
                        New password
                        <input
                          className={inputClass}
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          autoComplete="new-password"
                          placeholder="At least 8 characters"
                          disabled={otpRequested || submitting}
                        />
                      </label>

                      <label className={labelClass}>
                        Confirm new password
                        <input
                          className={inputClass}
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          autoComplete="new-password"
                          placeholder="Repeat new password"
                          disabled={otpRequested || submitting}
                        />
                      </label>
                    </div>
                  </section>

                  {!otpRequested && (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3f7a44] px-6 py-3.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#326436] disabled:opacity-60 sm:w-auto"
                    >
                      {submitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          Sending verification code…
                        </>
                      ) : (
                        "Save & Verify with Email →"
                      )}
                    </button>
                  )}
                </form>

                {/* OTP Verification Box */}
                {otpRequested && (
                  <form
                    onSubmit={verifyOtp}
                    className="mt-8 rounded-2xl border border-[#d6e5d3] bg-[#f6faf5] p-5 sm:p-7"
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e5f0e1] text-[#3f7a44]">
                        ✉
                      </div>
                      <div>
                        <h3 className="font-bold text-[#233d26]">
                          Verify Profile Update
                        </h3>
                        <p className="mt-1 text-xs text-[#627765]">
                          Enter the 6-digit verification code sent to:
                        </p>
                        <p className="mt-0.5 text-xs font-bold text-[#346639]">
                          {profile.original_email || profile.email}
                        </p>
                      </div>
                    </div>

                    <label className={`${labelClass} mt-5 block`}>
                      Verification Code
                      <input
                        className={`${inputClass} max-w-xs text-center text-xl font-bold tracking-[0.4em]`}
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="000000"
                        maxLength={6}
                        pattern="[0-9]{6}"
                        disabled={verifying}
                        required
                      />
                    </label>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={verifying || otp.length !== 6}
                        className="rounded-xl bg-[#3f7a44] px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-[#326436] disabled:opacity-50"
                      >
                        {verifying ? "Verifying…" : "Confirm Update"}
                      </button>

                      <button
                        type="button"
                        disabled={submitting || resendSeconds > 0}
                        onClick={() => void resendOtp()}
                        className="rounded-xl border border-[#dce7dc] bg-white px-4 py-2.5 text-xs font-bold text-[#456348] disabled:opacity-50"
                      >
                        {resendSeconds > 0
                          ? `Resend in ${resendSeconds}s`
                          : "Resend Code"}
                      </button>

                      <button
                        type="button"
                        onClick={cancelVerification}
                        className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#718071] hover:bg-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </CitizenLayout>
  );
}