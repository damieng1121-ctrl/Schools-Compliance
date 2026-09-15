"use client";

import { useState } from "react";
import { UserCog } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { inputClass, labelClass } from "@/components/ui/input";

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
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <UserCog size={16} className="text-slate-400" />
          <h2 className="font-semibold text-slate-900">Add a platform admin</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          They can see and manage every school, just like you. They&apos;ll get an email with a temporary
          password.
        </p>
        <form onSubmit={addAdmin} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
          <div>
            <label className={labelClass}>Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <Button type="submit" disabled={adding}>
            {adding ? "Adding…" : "Add admin"}
          </Button>
        </form>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="font-semibold text-slate-900">Platform admins ({admins.length})</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {admins.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-5 py-3">
              <Avatar name={a.name ?? a.email} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{a.name ?? a.email}</p>
                <p className="truncate text-xs text-slate-500">{a.email}</p>
              </div>
              <span className="shrink-0 text-xs text-slate-500">
                Added {new Date(a.createdAt).toLocaleDateString("en-GB")}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
