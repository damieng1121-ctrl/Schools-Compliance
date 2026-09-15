"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/components/ui/input";

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
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <PlusCircle size={16} className="text-slate-400" />
          <h2 className="font-semibold text-slate-900">Add a school</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Creates the school and its first admin, who gets emailed a temporary password.
        </p>
        <form onSubmit={addSchool} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
          <div className="sm:col-span-1">
            <label className={labelClass}>School name</label>
            <input
              required
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="Enter school name here"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-1">
            <label className={labelClass}>Admin name</label>
            <input required value={adminName} onChange={(e) => setAdminName(e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-1">
            <label className={labelClass}>Admin email</label>
            <input
              type="email"
              required
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <Button type="submit" disabled={adding} className="sm:col-span-1">
            {adding ? "Adding…" : "Add school"}
          </Button>
        </form>
        {addError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{addError}</p>}
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-3 font-semibold">School</th>
              <th className="px-5 py-3 font-semibold">Users</th>
              <th className="px-5 py-3 font-semibold">Readiness</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Created</th>
              <th className="px-5 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tenants.map((t) => {
              const pct = t.totalItems ? Math.round((t.compliantCount / t.totalItems) * 100) : 0;
              return (
                <tr key={t.id} className="transition-colors hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/super-admin/${t.id}`} className="font-medium text-slate-900 hover:underline">
                      {t.name}
                    </Link>
                    <p className="text-xs text-slate-500">{t.slug}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{t.userCount}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-medium text-slate-500">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        t.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${t.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                      {t.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{new Date(t.createdAt).toLocaleDateString("en-GB")}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/super-admin/${t.id}`}>
                        <Button variant="secondary" size="sm">
                          Manage
                        </Button>
                      </Link>
                      <Button variant="secondary" size="sm" onClick={() => toggleActive(t)} disabled={pendingId === t.id}>
                        {pendingId === t.id ? "Saving…" : t.isActive ? "Suspend" : "Reactivate"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-slate-500">
                  No schools yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
