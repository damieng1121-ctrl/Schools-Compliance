"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, UserPlus, TriangleAlert, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { inputClass, labelClass } from "@/components/ui/input";
import { ComplianceReadOnly } from "@/components/compliance-readonly";
import { FilteringChecksList } from "@/components/filtering-checks-list";

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
  dslName: string | null;
  dslEmail: string | null;
  isActive: boolean;
  users: Member[];
  totalItems: number;
  compliantCount: number;
};

export function SchoolManage({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [urn, setUrn] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [dslName, setDslName] = useState("");
  const [dslEmail, setDslEmail] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsMessage, setDetailsMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [togglingActive, setTogglingActive] = useState(false);

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [addingUser, setAddingUser] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);

  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

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
        setDslName(t.dslName ?? "");
        setDslEmail(t.dslEmail ?? "");
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
        body: JSON.stringify({ name, urn, logoUrl, dslName, dslEmail }),
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

  async function removeUser(userId: string) {
    setRemovingId(userId);
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenantId}/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        setConfirmRemoveId(null);
        load();
      }
    } finally {
      setRemovingId(null);
    }
  }

  async function deleteSchool() {
    if (!school || deleteConfirmText !== school.name) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenantId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmName: deleteConfirmText }),
      });
      const body = await res.json();
      if (!res.ok) {
        setDeleteError(body.error ?? "Something went wrong.");
        return;
      }
      router.push("/dashboard/super-admin");
    } finally {
      setDeleting(false);
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

  if (notFound) return <p className="text-sm text-slate-500">School not found.</p>;
  if (!school) return <p className="text-sm text-slate-500">Loading…</p>;

  const pct = school.totalItems ? Math.round((school.compliantCount / school.totalItems) * 100) : 0;

  return (
    <div>
      <Link href="/dashboard/super-admin" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft size={14} />
        All schools
      </Link>
      <div className="mt-3 flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{school.name}</h1>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            school.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${school.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
          {school.isActive ? "Active" : "Suspended"}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {school.slug} · {school.compliantCount}/{school.totalItems} standards met ({pct}%)
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-slate-400" />
            <h2 className="font-semibold text-slate-900">School details</h2>
          </div>
          <form onSubmit={saveDetails} className="mt-3 space-y-3">
            <div>
              <label className={labelClass}>School name</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>DfE URN (optional)</label>
              <input value={urn} onChange={(e) => setUrn(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Logo URL (optional)</label>
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://…"
                className={inputClass}
              />
            </div>
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Designated Safeguarding Lead</p>
              <p className="mt-1 text-xs text-slate-500">Filtering &amp; Monitoring check reports get emailed here.</p>
            </div>
            <div>
              <label className={labelClass}>DSL name (optional)</label>
              <input value={dslName} onChange={(e) => setDslName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>DSL email</label>
              <input
                type="email"
                value={dslEmail}
                onChange={(e) => setDslEmail(e.target.value)}
                placeholder="dsl@school.example"
                className={inputClass}
              />
            </div>
            {detailsMessage && (
              <p
                className={`rounded-lg px-3 py-2 text-sm ${
                  detailsMessage.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}
              >
                {detailsMessage.text}
              </p>
            )}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={savingDetails}>
                {savingDetails ? "Saving…" : "Save"}
              </Button>
              <Button type="button" variant="secondary" onClick={toggleActive} disabled={togglingActive}>
                {togglingActive ? "Saving…" : school.isActive ? "Suspend school" : "Reactivate school"}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <UserPlus size={16} className="text-slate-400" />
            <h2 className="font-semibold text-slate-900">Add a user to this school</h2>
          </div>
          <form onSubmit={addUser} className="mt-3 space-y-3">
            <div>
              <label className={labelClass}>Name</label>
              <input required value={userName} onChange={(e) => setUserName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                required
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Role</label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as "ADMIN" | "MEMBER")}
                className={inputClass}
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            {addUserError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{addUserError}</p>}
            <Button type="submit" disabled={addingUser}>
              {addingUser ? "Adding…" : "Add user"}
            </Button>
            <p className="text-xs text-slate-500">They&apos;ll get an email with a temporary password.</p>
          </form>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="font-semibold text-slate-900">Users ({school.users.length})</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {school.users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-5 py-3">
              <Avatar name={u.name ?? u.email} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{u.name ?? u.email}</p>
                <p className="truncate text-xs text-slate-500">{u.email}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {u.role}
              </span>
              {confirmRemoveId === u.id ? (
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeUser(u.id)}
                    disabled={removingId === u.id}
                  >
                    {removingId === u.id ? "Removing…" : "Confirm remove"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmRemoveId(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmRemoveId(u.id)}
                  title="Remove from school"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          ))}
          {school.users.length === 0 && <p className="px-5 py-4 text-sm text-slate-500">No users yet.</p>}
        </div>
      </Card>

      <div className="mt-6">
        <ComplianceReadOnly tenantId={tenantId} />
      </div>

      <div className="mt-6">
        <FilteringChecksList tenantId={tenantId} hasDslEmail={!!school.dslEmail} />
      </div>

      <Card className="mt-6 border-red-200 p-5">
        <div className="flex items-center gap-2">
          <TriangleAlert size={16} className="text-red-500" />
          <h2 className="font-semibold text-slate-900">Danger zone</h2>
        </div>
        {!deleteOpen ? (
          <>
            <p className="mt-1 text-sm text-slate-500">
              Permanently delete this school and everything under it — users, compliance records, and
              Filtering &amp; Monitoring checks. This can&apos;t be undone. Suspending is usually what you
              want instead.
            </p>
            <Button variant="danger" size="sm" className="mt-3" onClick={() => setDeleteOpen(true)}>
              Delete school
            </Button>
          </>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-slate-700">
              This will permanently delete <span className="font-semibold">{school.name}</span> and all of
              its data. Type the school name to confirm.
            </p>
            <input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={school.name}
              className={inputClass}
            />
            {deleteError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{deleteError}</p>}
            <div className="flex items-center gap-3">
              <Button
                variant="danger"
                onClick={deleteSchool}
                disabled={deleteConfirmText !== school.name || deleting}
              >
                {deleting ? "Deleting…" : "Permanently delete"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteConfirmText("");
                  setDeleteError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
