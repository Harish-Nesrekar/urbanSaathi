"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { citizenFetch } from "@/lib/citizen-api";

const LocationPicker = dynamic(
  () => import("@/app/citizen/dashboard/locationPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2 p-6 text-sm text-[#718071]">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#cfe0cc] border-t-[#3f7a44]" />
        <span>Loading map tools…</span>
      </div>
    ),
  }
);

type Category = {
  id: number;
  name: string;
  description?: string | null;
};

const inputStyle =
  "mt-2 w-full rounded-xl border border-[#dce7dc] bg-white px-4 py-3 text-sm text-[#243e27] outline-none transition placeholder:text-[#9aa89b] focus:border-[#47784b] focus:ring-4 focus:ring-[#47784b]/10";

const labelStyle = "block text-sm font-semibold text-[#28442c]";

export default function ComplaintForm({
  onSubmitted,
}: {
  onSubmitted?: () => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [mapOpen, setMapOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    citizenFetch<{ categories: Category[] }>("/api/complaints/categories")
      .then((d) => setCategories(d.categories || []))
      .catch((e) => setError(e.message));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!categoryId) {
      setError("Please select a category.");
      return;
    }

    if (files.length > 3) {
      setError("You can attach up to 3 images only.");
      return;
    }

    setBusy(true);

    try {
      const data = await citizenFetch<{
        complaint: { id: number; complaintNumber?: string };
      }>("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          categoryId: Number(categoryId),
          priority,
          address: address.trim() || null,
          latitude,
          longitude,
        }),
      });

      if (files.length && data.complaint?.id) {
        const form = new FormData();
        files.forEach((f) => form.append("images", f));
        await citizenFetch(
          `/api/complaints/${data.complaint.id}/attachments`,
          {
            method: "POST",
            body: form,
          }
        );
      }

      setMessage(
        `Complaint ${data.complaint?.complaintNumber || ""} submitted successfully.`
      );
      setTitle("");
      setDescription("");
      setCategoryId("");
      setPriority("MEDIUM");
      setAddress("");
      setLatitude(null);
      setLongitude(null);
      setFiles([]);

      if (fileRef.current) fileRef.current.value = "";
      if (onSubmitted) onSubmitted();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to submit your complaint."
      );
    } finally {
      setBusy(false);
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <section className="rounded-3xl border border-[#e1ece0] bg-white p-6 shadow-2xs sm:p-9">
      <div>
        <h2 className="text-xl font-black text-[#233d26]">
          Complaint Details
        </h2>
        <p className="mt-1 text-sm text-[#667d69]">
          Describe the civic problem clearly so municipal engineers can inspect it.
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
          {message}{" "}
          <a
            className="ml-2 font-bold underline hover:text-[#234527]"
            href="/citizen/complaints"
          >
            Track in My Complaints →
          </a>
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-6">
        {/* Category & Priority Selectors */}
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={labelStyle}>
            Category <span className="text-red-500">*</span>
            <select
              className={inputStyle}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              <option value="">Select issue category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className={labelStyle}>
            Priority <span className="text-red-500">*</span>
            <select
              className={inputStyle}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="LOW">Low (Routine maintenance)</option>
              <option value="MEDIUM">Medium (General attention)</option>
              <option value="HIGH">High (Urgent action needed)</option>
              <option value="URGENT">Urgent (Safety hazard)</option>
            </select>
          </label>
        </div>

        {/* Title */}
        <label className={labelStyle}>
          Complaint title <span className="text-red-500">*</span>
          <input
            className={inputStyle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            placeholder="e.g. Broken streetlight on 4th Main Road"
            required
          />
        </label>

        {/* Description */}
        <label className={labelStyle}>
          Detailed description <span className="text-red-500">*</span>
          <textarea
            className={`${inputStyle} min-h-32 resize-y`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={10000}
            required
            placeholder="Provide context, street markers, or time the issue occurred…"
          />
          <span className="mt-1 block text-right text-xs text-[#8a9d8d]">
            {description.length}/10,000 characters
          </span>
        </label>

        {/* Address */}
        <label className={labelStyle}>
          Address or Landmark
          <input
            className={inputStyle}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            maxLength={500}
            placeholder="Nearest street, building, or landmark"
          />
        </label>

        {/* Location Picker Section */}
        <div className="rounded-2xl border border-[#dfead8] bg-[#f8fbf6] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-[#264129]">
                Pin Geographic Location{" "}
                <span className="font-normal text-xs text-[#718574]">
                  (Optional)
                </span>
              </p>
              <p className="mt-0.5 text-xs text-[#687f6b]">
                Help the field team find the exact GPS coordinates.
              </p>
            </div>

            <button
              type="button"
              className="rounded-xl border border-[#d2e2ce] bg-white px-4 py-2 text-xs font-bold text-[#355b38] shadow-2xs hover:bg-[#edf5ea]"
              onClick={() => setMapOpen((v) => !v)}
            >
              {mapOpen ? "✕ Close Map" : "🗺️ Open Map"}
            </button>
          </div>

          {latitude !== null && longitude !== null && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#d1e5cd] bg-white px-3 py-1.5 text-xs text-[#326037]">
              <span>📍 GPS Pinned:</span>
              <span className="font-mono font-bold">
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </span>
              <button
                type="button"
                className="ml-2 font-bold text-red-600 hover:underline"
                onClick={() => {
                  setLatitude(null);
                  setLongitude(null);
                }}
              >
                Remove
              </button>
            </div>
          )}

          {mapOpen && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-[#d7e5d3]">
              <LocationPicker
                latitude={latitude}
                longitude={longitude}
                onLocationSelect={(lat: number, lng: number) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
                onPlaceSelect={(place: string) =>
                  setAddress(place || address)
                }
              />
            </div>
          )}
        </div>

        {/* Photo Upload */}
        <div>
          <label className={labelStyle}>
            Attach Photos{" "}
            <span className="font-normal text-xs text-[#718574]">
              (Up to 3 images, 5 MB max each)
            </span>
            <input
              ref={fileRef}
              className={`${inputStyle} file:mr-3 file:rounded-lg file:border-0 file:bg-[#e4efe0] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#315f36] file:transition hover:file:bg-[#d6e7d1]`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => {
                const picked = Array.from(e.target.files || []);
                if (
                  picked.length > 3 ||
                  picked.some(
                    (f) =>
                      !["image/jpeg", "image/png", "image/webp"].includes(
                        f.type
                      ) || f.size > 5 * 1024 * 1024
                  )
                ) {
                  setError(
                    "Choose up to 3 JPG, PNG, or WebP images, each 5 MB or smaller."
                  );
                  e.target.value = "";
                  setFiles([]);
                } else {
                  setError("");
                  setFiles(picked);
                }
              }}
            />
          </label>

          {/* Selected File Badges */}
          {files.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {files.map((f, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#d6e5d3] bg-[#f6faf5] px-3 py-1.5 text-xs text-[#2b4b2e]"
                >
                  <span className="truncate max-w-[150px]">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="font-bold text-[#863e37] hover:text-red-700"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={busy || categories.length === 0}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3f7a44] px-6 py-3.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#326436] disabled:opacity-50 sm:w-auto"
        >
          {busy ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Submitting complaint…
            </>
          ) : (
            "Submit Complaint →"
          )}
        </button>
      </form>
    </section>
  );
}