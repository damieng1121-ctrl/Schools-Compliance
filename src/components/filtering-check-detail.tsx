"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Outcome = "PASS" | "FAIL" | "NOT_APPLICABLE" | "NOT_TESTED";
type Result = { itemId: string; title: string; guidance: string | null; outcome: Outcome; actionNotes: string | null };
type Device = { id: string; label: string; results: Result[] };
type CheckDetail = {
  id: string;
  performedAt: string;
  performedByName: string;
  notes: string | null;
  sentToDslAt: string | null;
  devices: Device[];
};

const OUTCOME_STYLES: Record<Outcome, string> = {
  PASS: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  FAIL: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300",
  NOT_APPLICABLE: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
  NOT_TESTED: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
};
const OUTCOME_LABEL: Record<Outcome, string> = {
  PASS: "Pass",
  FAIL: "Fail",
  NOT_APPLICABLE: "N/A",
  NOT_TESTED: "Not tested",
};

export function FilteringCheckDetailView({
  apiBase,
  checkId,
  backHref,
  backLabel = "Back",
  readOnly = false,
}: {
  /** e.g. `/api/super-admin/tenants/${tenantId}` or `/api` (tenant-scoped) — `/filtering-checks/<id>` is appended. */
  apiBase: string;
  checkId: string;
  backHref: string;
  backLabel?: string;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [check, setCheck] = useState<CheckDetail | null>(null);
  const [hasDslEmail, setHasDslEmail] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch(`${apiBase}/filtering-checks/${checkId}`)
      .then((r) => r.json())
      .then(setCheck);
    if (!readOnly) {
      fetch(apiBase)
        .then((r) => r.json())
        .then((tenant) => setHasDslEmail(!!tenant.dslEmail));
    }
  }

  useEffect(load, [apiBase, checkId, readOnly]);

  async function sendToDsl() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/filtering-checks/${checkId}/send`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong.");
        return;
      }
      load();
    } finally {
      setSending(false);
    }
  }

  async function deleteCheck() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/filtering-checks/${checkId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Something went wrong.");
        return;
      }
      router.push(backHref);
    } finally {
      setDeleting(false);
    }
  }

  if (!check) return <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>;

  const failCount = check.devices.flatMap((d) => d.results).filter((r) => r.outcome === "FAIL").length;

  return (
    <div>
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
        <ArrowLeft size={14} />
        {backLabel}
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Filtering &amp; Monitoring check</h1>
        {failCount > 0 ? (
          <span className="rounded-full bg-red-50 dark:bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-300">{failCount} failed</span>
        ) : (
          <span className="rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">All clear</span>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Performed by {check.performedByName} on{" "}
        {new Date(check.performedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      {check.notes && (
        <Card className="mt-5 p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Visit notes</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{check.notes}</p>
        </Card>
      )}

      <div className="mt-6 space-y-5">
        {check.devices.map((device) => (
          <Card key={device.id} className="overflow-hidden">
            <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-3">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">{device.label}</h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {device.results.map((r) => (
                <div key={r.itemId} className="flex items-start gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{r.title}</p>
                    {r.actionNotes && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{r.actionNotes}</p>}
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${OUTCOME_STYLES[r.outcome]}`}>
                    {OUTCOME_LABEL[r.outcome]}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {check.sentToDslAt
                ? `Sent to DSL on ${new Date(check.sentToDslAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`
                : "Not yet sent to DSL"}
            </p>
            {!readOnly && !hasDslEmail && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Add a DSL email on this school first.</p>}
          </div>
          {!readOnly && (
            <Button onClick={sendToDsl} disabled={!hasDslEmail || sending} variant={check.sentToDslAt ? "secondary" : "primary"}>
              <Mail size={15} />
              {sending ? "Sending…" : check.sentToDslAt ? "Resend to DSL" : "Send to DSL"}
            </Button>
          )}
        </div>
        {error && <p className="mt-3 rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</p>}
      </Card>

      {!readOnly && (
        <Card className="mt-6 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Delete this check</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Permanently removes this visit and everything logged against it.</p>
            </div>
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <Button variant="danger" onClick={deleteCheck} disabled={deleting}>
                  {deleting ? "Deleting…" : "Confirm delete"}
                </Button>
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={15} />
                Delete check
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
