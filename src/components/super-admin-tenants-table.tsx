"use client";

import { useState } from "react";
import Link from "next/link";

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  userCount: number;
  compliantCount: number;
  totalItems: number;
};

export function SuperAdminTenantsTable({ initialTenants }: { initialTenants: TenantRow[] }) {
  const [tenants, setTenants] = useState(initialTenants);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [schoolName, setSchoolName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  async function toggleActive(tenant: TenantRow) {
    const nextActive = !tenant.isActive;
    setPendingId(tenant.id);
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      if (!res.ok) return;
      setTenants((prev) => prev.map((t) => (t.id === tenant.id ? { ...t, isActive: nextActive } : t)));
    } finally {
      setPendingId(null);
    }
  }

  async function addSchool(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch("/api/super-admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolName, adminName, adminEmail }),
      });
      const body = await res.json();
      if (!res.ok) {
        setAddError(body.error ?? "Something went wrong.");
        return;
      }
      setTenants((prev) => [body, ...prev]);
      setSchoolName("");
      setAdminName("");
      setAdminEmail("");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Add a school</h2>
        <p className="mt-1 text-sm text-slate-600">
          Creates the school and its first admin, who gets emailed a temporary password.
        </p>
        <form onSubmit={addSchool} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-slate-700">School name</label>
            <input
              required
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="Enter school name here"
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-slate-700">Admin name</label>
            <input
              required
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-slate-700">Admin email</label>
            <input
              type="email"
              required
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 sm:col-span-1"
          >
            {adding ? "Adding…" : "Add school"}
          </button>
        </form>
        {addError && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{addError}</p>}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-600">
          <tr>
            <th className="px-5 py-3 font-medium">School</th>
            <th className="px-5 py-3 font-medium">Users</th>
            <th className="px-5 py-3 font-medium">Readiness</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Created</th>
            <th className="px-5 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tenants.map((t) => {
            const pct = t.totalItems ? Math.round((t.compliantCount / t.totalItems) * 100) : 0;
            return (
              <tr key={t.id}>
                <td className="px-5 py-3">
                  <Link href={`/dashboard/super-admin/${t.id}`} className="font-medium text-slate-900 hover:text-indigo-600 hover:underline">
                    {t.name}
                  </Link>
                  <p className="text-xs text-slate-600">{t.slug}</p>
                </td>
                <td className="px-5 py-3 text-slate-700">{t.userCount}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-600">{pct}%</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      t.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {t.isActive ? "Active" : "Suspended"}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-700">{new Date(t.createdAt).toLocaleDateString("en-GB")}</td>
                <td className="px-5 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/dashboard/super-admin/${t.id}`}
                      className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Manage
                    </Link>
                    <button
                      onClick={() => toggleActive(t)}
                      disabled={pendingId === t.id}
                      className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {pendingId === t.id ? "Saving…" : t.isActive ? "Suspend" : "Reactivate"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {tenants.length === 0 && (
            <tr>
              <td colSpan={6} className="px-5 py-6 text-center text-slate-600">
                No schools yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
