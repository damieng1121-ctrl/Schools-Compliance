"use client";

import { useState } from "react";

type Admin = {
  id: string;
  name: string | null;
  email: string;
  isActive: boolean;
  createdAt: string;
};

export function PlatformAdminsTable({ initialAdmins }: { initialAdmins: Admin[] }) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addAdmin(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/super-admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong.");
        return;
      }
      setAdmins((prev) => [...prev, body]);
      setName("");
      setEmail("");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Add a platform admin</h2>
        <p className="mt-1 text-sm text-slate-600">
          They can see and manage every school, just like you. They&apos;ll get an email with a temporary
          password.
        </p>
        <form onSubmit={addAdmin} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
          <div>
            <label className="block text-xs font-medium text-slate-700">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {adding ? "Adding…" : "Add admin"}
          </button>
        </form>
        {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="font-semibold text-slate-900">Platform admins ({admins.length})</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {admins.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{a.name ?? a.email}</p>
                <p className="text-xs text-slate-600">{a.email}</p>
              </div>
              <span className="text-xs text-slate-600">
                Added {new Date(a.createdAt).toLocaleDateString("en-GB")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
