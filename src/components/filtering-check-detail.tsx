"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
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
  PASS: "bg-emerald-50 text-emerald-700",
  FAIL: "bg-red-50 text-red-700",
  NOT_APPLICABLE: "bg-slate-100 text-slate-500",
  NOT_TESTED: "bg-slate-100 text-slate-500",
};
const OUTCOME_LABEL: Record<Outcome, string> = {
  PASS: "Pass",
  FAIL: "Fail",
  NOT_APPLICABLE: "N/A",
  NOT_TESTED: "Not tested",
};

export function FilteringCheckDetailView({ tenantId, checkId }: { tenantId: string; checkId: string }) {
  const [check, setCheck] = useState<CheckDetail | null>(null);
  const [hasDslEmail, setHasDslEmail] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    Promise.all([
      fetch(`/api/super-admin/tenants/${tenantId}/filtering-checks/${checkId}`).then((r) => r.json()),
      fetch(`/api/super-admin/tenants/${tenantId}`).then((r) => r.json()),
    ]).then(([c, tenant]) => {
      setCheck(c);
      setSchoolName(tenant.name);
      setHasDslEmail(!!tenant.dslEmail);
    });
  }

  useEffect(load, [tenantId, checkId]);

  async function sendToDsl() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenantId}/filtering-checks/${checkId}/send`, { method: "POST" });
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

  if (!check) return <p className="text-sm text-slate-500">Loading…</p>;

  const failCount = check.devices.flatMap((d) => d.results).filter((r) => r.outcome === "FAIL").length;

  return (
    <div>
      <Link
        href={`/dashboard/super-admin/${tenantId}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={14} />
        {schoolName || "Back"}
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Filtering &amp; Monitoring check</h1>
        {failCount > 0 ? (
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">{failCount} failed</span>
        ) : (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">All clear</span>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Performed by {check.performedByName} on{" "}
        {new Date(check.performedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      {check.notes && (
        <Card className="mt-5 p-4">
          <p className="text-xs font-medium text-slate-500">Visit notes</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{check.notes}</p>
        </Card>
      )}

      <div className="mt-6 space-y-5">
        {check.devices.map((device) => (
          <Card key={device.id} className="overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-3">
              <h2 className="font-semibold text-slate-900">{device.label}</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {device.results.map((r) => (
                <div key={r.itemId} className="flex items-start gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">{r.title}</p>
                    {r.actionNotes && <p className="mt-0.5 text-xs text-slate-500">{r.actionNotes}</p>}
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
            <p className="text-sm font-medium text-slate-900">
              {check.sentToDslAt
                ? `Sent to DSL on ${new Date(check.sentToDslAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`
                : "Not yet sent to DSL"}
            </p>
            {!hasDslEmail && <p className="mt-0.5 text-xs text-slate-500">Add a DSL email on this school first.</p>}
          </div>
          <Button onClick={sendToDsl} disabled={!hasDslEmail || sending} variant={check.sentToDslAt ? "secondary" : "primary"}>
            <Mail size={15} />
            {sending ? "Sending…" : check.sentToDslAt ? "Resend to DSL" : "Send to DSL"}
          </Button>
        </div>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </Card>
    </div>
  );
}
