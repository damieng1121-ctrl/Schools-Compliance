"use client";

import { useState } from "react";

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

  return (
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
                  <p className="font-medium text-slate-900">{t.name}</p>
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
                  <button
                    onClick={() => toggleActive(t)}
                    disabled={pendingId === t.id}
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {pendingId === t.id ? "Saving…" : t.isActive ? "Suspend" : "Reactivate"}
                  </button>
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
  );
}
