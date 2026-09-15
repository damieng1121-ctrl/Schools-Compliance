"use client";

import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { inputClass, labelClass } from "@/components/ui/input";

type Member = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "MEMBER";
  isActive: boolean;
  createdAt: string;
};

export default function TeamPage() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/team")
      .then((r) => r.json())
      .then(setMembers);
  }

  useEffect(load, []);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong.");
        return;
      }
      setName("");
      setEmail("");
      setRole("MEMBER");
      load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Team</h1>
      <p className="mt-1 text-sm text-slate-500">Everyone here can view and update your compliance checklist.</p>

      <Card className="mt-6">
        <div className="divide-y divide-slate-100">
          {members?.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-5 py-3">
              <Avatar name={m.name ?? m.email} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{m.name ?? m.email}</p>
                <p className="truncate text-xs text-slate-500">{m.email}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {m.role}
              </span>
            </div>
          ))}
          {members?.length === 0 && <p className="px-5 py-4 text-sm text-slate-500">No team members yet.</p>}
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <div className="flex items-center gap-2">
          <UserPlus size={16} className="text-slate-400" />
          <h2 className="font-semibold text-slate-900">Add a team member</h2>
        </div>
        <form onSubmit={addMember} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
          <div className="sm:col-span-1">
            <label className={labelClass}>Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-1">
            <label className={labelClass}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-1">
            <label className={labelClass}>Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "ADMIN" | "MEMBER")}
              className={inputClass}
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <Button type="submit" disabled={saving} className="sm:col-span-1">
            {saving ? "Adding…" : "Add member"}
          </Button>
        </form>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <p className="mt-3 text-xs text-slate-500">
          They&apos;ll get an email with a temporary password and can change it once signed in.
        </p>
      </Card>
    </div>
  );
}
