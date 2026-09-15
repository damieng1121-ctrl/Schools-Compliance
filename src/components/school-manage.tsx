"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Member = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "MEMBER" | "SUPER_ADMIN";
  isActive: boolean;
  createdAt: string;
};

type SchoolDetail = {
  id: string;
  name: string;
  slug: string;
  urn: string | null;
  logoUrl: string | null;
  isActive: boolean;
  users: Member[];
  totalItems: number;
  compliantCount: number;
};

export function SchoolManage({ tenantId }: { tenantId: string }) {
  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState("");
  const [urn, setUrn] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsMessage, setDetailsMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [togglingActive, setTogglingActive] = useState(false);

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [addingUser, setAddingUser] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);

  function load() {
    fetch(`/api/super-admin/tenants/${tenantId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((t: SchoolDetail) => {
        setSchool(t);
        setName(t.name);
        setUrn(t.urn ?? "");
        setLogoUrl(t.logoUrl ?? "");
      })
      .catch(() => setNotFound(true));
  }

  useEffect(load, [tenantId]);

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    setSavingDetails(true);
    setDetailsMessage(null);
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, urn, logoUrl }),
      });
      const body = await res.json();
      if (!res.ok) {
        setDetailsMessage({ type: "error", text: body.error ?? "Something went wrong." });
        return;
      }
      setDetailsMessage({ type: "ok", text: "Saved." });
      load();
    } finally {
      setSavingDetails(false);
    }
  }

  async function toggleActive() {
    if (!school) return;
    setTogglingActive(true);
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !school.isActive }),
      });
      if (res.ok) load();
    } finally {
      setTogglingActive(false);
    }
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setAddingUser(true);
    setAddUserError(null);
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenantId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userName, email: userEmail, role: userRole }),
      });
      const body = await res.json();
      if (!res.ok) {
        setAddUserError(body.error ?? "Something went wrong.");
        return;
      }
      setUserName("");
      setUserEmail("");
      setUserRole("MEMBER");
      load();
    } finally {
      setAddingUser(false);
    }
  }

  if (notFound) return <p className="text-sm text-slate-700">School not found.</p>;
  if (!school) return <p className="text-sm text-slate-700">Loading…</p>;

  const pct = school.totalItems ? Math.round((school.compliantCount / school.totalItems) * 100) : 0;

  return (
    <div>
      <Link href="/dashboard/super-admin" className="text-sm text-indigo-600 hover:underline">
        ← All schools
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{school.name}</h1>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            school.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {school.isActive ? "Active" : "Suspended"}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        {school.slug} · {school.compliantCount}/{school.totalItems} standards met ({pct}%)
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">School details</h2>
          <form onSubmit={saveDetails} className="mt-3 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700">School name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">DfE URN (optional)</label>
              <input
                value={urn}
                onChange={(e) => setUrn(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Logo URL (optional)</label>
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://…"
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
            {detailsMessage && (
              <p
                className={`rounded-md px-3 py-2 text-sm ${
                  detailsMessage.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}
              >
                {detailsMessage.text}
              </p>
            )}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={savingDetails}
                className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingDetails ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={toggleActive}
                disabled={togglingActive}
                className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {togglingActive ? "Saving…" : school.isActive ? "Suspend school" : "Reactivate school"}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Add a user to this school</h2>
          <form onSubmit={addUser} className="mt-3 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700">Name</label>
              <input
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Email</label>
              <input
                type="email"
                required
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Role</label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as "ADMIN" | "MEMBER")}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            {addUserError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{addUserError}</p>}
            <button
              type="submit"
              disabled={addingUser}
              className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {addingUser ? "Adding…" : "Add user"}
            </button>
            <p className="text-xs text-slate-600">They&apos;ll get an email with a temporary password.</p>
          </form>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="font-semibold text-slate-900">Users ({school.users.length})</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {school.users.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{u.name ?? u.email}</p>
                <p className="text-xs text-slate-600">{u.email}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                {u.role}
              </span>
            </div>
          ))}
          {school.users.length === 0 && <p className="px-5 py-4 text-sm text-slate-600">No users yet.</p>}
        </div>
      </div>
    </div>
  );
}
