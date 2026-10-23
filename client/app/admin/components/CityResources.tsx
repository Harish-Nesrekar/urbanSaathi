
"use client";

import { useCallback, useEffect, useState } from "react";

const API = `${process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001"}/api/admin/resources`;

type Resource = {
  id: number;
  resourceName: string;
  resourceType: string;
  description: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  conditionStatus: string;
  status: string;
  createdAt: string;
};

const types = [
  "ROAD",
  "STREETLIGHT",
  "WATER_SUPPLY",
  "DRAINAGE",
  "WASTE_BIN",
  "PUBLIC_FACILITY",
  "OTHER",
];

const conditions = ["GOOD", "NEEDS_MAINTENANCE", "DAMAGED"];

export default function CityResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [conditionFilter, setConditionFilter] = useState("ALL");
  const [saving, setSaving] = useState(false);
  const [updatingResourceId, setUpdatingResourceId] = useState<number | null>(null);

  const [form, setForm] = useState({
    resourceName: "",
    resourceType: "OTHER",
    description: "",
    address: "",
    conditionStatus: "GOOD",
    status: "ACTIVE",
  });

  const token = () =>
    localStorage.getItem("adminToken") ||
    sessionStorage.getItem("adminToken");

  const request = async (url: string, options: RequestInit = {}) => {
    const currentToken = token();

    if (!currentToken) {
      window.location.replace("/admin/login");
      throw new Error("Your session has expired. Please sign in again.");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${currentToken}`,
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401 || response.status === 403) {
      window.location.replace("/admin/login");
      throw new Error(data.message || "Administrator access denied.");
    }

    if (!response.ok) {
      throw new Error(data.message || "Request failed.");
    }

    return data;
  };

  const loadResources = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        search,
        type: typeFilter,
        status: statusFilter,
        condition: conditionFilter,
      });

      const data = await request(`${API}?${params.toString()}`);
      setResources(Array.isArray(data.resources) ? data.resources : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load resources."
      );
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, conditionFilter]);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  async function createResource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await request(API, {
        method: "POST",
        body: JSON.stringify(form),
      });

      setMessage("City resource added successfully.");
      setForm({
        resourceName: "",
        resourceType: "OTHER",
        description: "",
        address: "",
        conditionStatus: "GOOD",
        status: "ACTIVE",
      });

      await loadResources();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to add resource."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateResource(
    resource: Resource,
    changes: Partial<Pick<Resource, "conditionStatus" | "status">>
  ) {
    if (updatingResourceId !== null) return;
    setUpdatingResourceId(resource.id);
    setError("");
    setMessage("");

    try {
      await request(`${API}/${resource.id}`, {
        method: "PATCH",
        body: JSON.stringify(changes),
      });

      setMessage(`Updated ${resource.resourceName}.`);
      await loadResources();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update resource."
      );
    } finally {
      setUpdatingResourceId(null);
    }
  }

  const fieldClass =
    "w-full rounded-xl border border-[#dfe8da] bg-white px-3 py-2.5 text-sm text-[#263b2a] outline-none focus:border-[#47784b] focus:ring-2 focus:ring-[#47784b]/10";

  const activeCount = resources.filter((r) => r.status === "ACTIVE").length;
  const maintenanceCount = resources.filter(
    (r) => r.conditionStatus !== "GOOD"
  ).length;

  return (
    <section
      id="city-resources"
      className="relative mt-5 scroll-mt-24 overflow-hidden rounded-2xl border border-white/80 bg-white/65 p-3 shadow-[0_10px_35px_-28px_rgba(39,72,43,0.22)] backdrop-blur-xl sm:mt-6 sm:rounded-3xl sm:p-5 lg:p-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-200/25 blur-3xl"
      />
      <div className="relative flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#47784b]">
            City infrastructure
          </p>
          <h2 className="mt-2 text-xl font-bold text-[#263b2a]">
            City Resources
          </h2>
          <p className="mt-1 text-sm text-[#728174]">
            Register public assets and monitor their maintenance condition.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadResources()}
          disabled={loading}
          className="min-h-10 rounded-xl border border-white/90 bg-white/85 px-4 py-2.5 text-sm font-semibold text-[#456348] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65976b] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh resources"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Resources shown", value: resources.length },
          { label: "Active resources", value: activeCount },
          { label: "Need maintenance", value: maintenanceCount },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/90 bg-white/70 p-4 shadow-sm"
          >
            <p className="text-sm text-[#728174]">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-[#47784b]">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <form
        onSubmit={createResource}
        className="mt-5 rounded-2xl border border-white/90 bg-white/65 p-3 shadow-sm sm:p-5"
      >
        <h3 className="font-bold text-[#263b2a]">＋ Add a city resource</h3>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            required
            maxLength={150}
            className={fieldClass}
            placeholder="Resource name *"
            value={form.resourceName}
            onChange={(e) =>
              setForm({ ...form, resourceName: e.target.value })
            }
          />

          <select
            className={fieldClass}
            value={form.resourceType}
            onChange={(e) =>
              setForm({ ...form, resourceType: e.target.value })
            }
          >
            {types.map((type) => (
              <option key={type} value={type}>
                {type.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <input
            required
            maxLength={500}
            className={fieldClass}
            placeholder="Address *"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <select
            className={fieldClass}
            value={form.conditionStatus}
            onChange={(e) =>
              setForm({ ...form, conditionStatus: e.target.value })
            }
          >
            {conditions.map((condition) => (
              <option key={condition} value={condition}>
                {condition.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <select
            className={fieldClass}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <textarea
            maxLength={5000}
            className={`${fieldClass} sm:col-span-2 lg:col-span-3`}
            rows={2}
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-4 min-h-11 rounded-xl border border-[#47784b] bg-gradient-to-br from-[#58875c] to-[#3f7045] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#4d7d52] hover:to-[#345e3a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65976b] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Add resource"}
        </button>
      </form>

      {message && (
        <p role="status" className="mt-4 rounded-xl bg-[#edf5e8] p-3 text-sm text-[#416c45]">
          {message}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-[#fff3f1] p-3 text-sm text-[#9c5148]">
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className={fieldClass}
          placeholder="Search name, address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className={fieldClass}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="ALL">All resource types</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {type.replaceAll("_", " ")}
            </option>
          ))}
        </select>

        <select
          className={fieldClass}
          value={conditionFilter}
          onChange={(e) => setConditionFilter(e.target.value)}
        >
          <option value="ALL">All conditions</option>
          {conditions.map((condition) => (
            <option key={condition} value={condition}>
              {condition.replaceAll("_", " ")}
            </option>
          ))}
        </select>

        <select
          className={fieldClass}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="mt-5 max-w-full overflow-x-auto overscroll-x-contain rounded-2xl border border-[#e5ece1] bg-white/55">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-white/65 text-[10px] uppercase tracking-[0.12em] text-[#849184]">
            <tr>
              <th className="p-3">Resource</th>
              <th className="p-3">Location</th>
              <th className="p-3">Condition</th>
              <th className="p-3">Status</th>
              <th className="p-3">Update condition</th>
              <th className="p-3">Update status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf1ea]">
            {resources.map((resource) => (
              <tr key={resource.id} className="transition-colors duration-150 hover:bg-white/70">
                <td className="p-3">
                  <p className="font-semibold text-[#263b2a]">
                    {resource.resourceName}
                  </p>
                  <p className="mt-1 text-xs text-[#728174]">
                    {resource.resourceType.replaceAll("_", " ")}
                  </p>
                  {resource.description && (
                    <p className="mt-1 max-w-xs text-xs text-[#728174]">
                      {resource.description}
                    </p>
                  )}
                </td>
                <td className="max-w-xs p-3 text-[#586b5a]">
                  {resource.address}
                  {resource.latitude != null && resource.longitude != null && (
                    <a
                      className="mt-1 block text-xs font-semibold text-[#47784b] underline"
                      href={`https://www.google.com/maps?q=${resource.latitude},${resource.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View map
                    </a>
                  )}
                </td>
                <td className="p-3 text-[#586b5a]">
                  {resource.conditionStatus.replaceAll("_", " ")}
                </td>
                <td className="p-3 text-[#586b5a]">{resource.status}</td>
                <td className="p-3">
                  <select
                    aria-label={`Condition for ${resource.resourceName}`}
                    disabled={updatingResourceId !== null}
                    className={fieldClass}
                    value={resource.conditionStatus}
                    onChange={(e) =>
                      void updateResource(resource, {
                        conditionStatus: e.target.value,
                      })
                    }
                  >
                    {conditions.map((condition) => (
                      <option key={condition} value={condition}>
                        {condition.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    disabled={updatingResourceId !== null}
                    onClick={() =>
                      void updateResource(resource, {
                        status:
                          resource.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                      })
                    }
                    className="min-h-9 rounded-xl border border-[#dce7dc] bg-white/75 px-3 py-2 text-xs font-semibold text-[#456348] transition-colors hover:bg-[#f2f8ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65976b] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updatingResourceId === resource.id ? "Updating…" : resource.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}

            {!loading && resources.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#728174]">
                  No city resources match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
