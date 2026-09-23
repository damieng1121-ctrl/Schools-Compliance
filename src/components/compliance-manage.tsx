"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ExternalLink, Check, Mail } from "lucide-react";
import clsx from "clsx";
import { ComplianceBadge } from "@/components/badges";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/components/ui/input";

type Status = "NOT_STARTED" | "IN_PROGRESS" | "COMPLIANT" | "NON_COMPLIANT" | "NOT_APPLICABLE";
type Assessment = {
  status: Status;
  evidenceNotes: string | null;
  evidenceUrl: string | null;
  nextReviewDue: string | null;
  reviewedAt: string | null;
  reviewedByName: string | null;
};
type Item = { id: string; title: string; description: string; assessment: Assessment };
type Standard = { id: string; title: string; items: Item[] };

/** Editable view of a school's compliance answers, for platform admins to fill in on a school's behalf. */
export function ComplianceManage({ tenantId }: { tenantId: string }) {
  const [standards, setStandards] = useState<Standard[] | null>(null);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [emailError, setEmailError] = useState<string | null>(null);

  function load() {
    fetch(`/api/super-admin/tenants/${tenantId}/compliance`)
      .then((r) => r.json())
      .then(setStandards);
  }

  useEffect(load, [tenantId]);

  async function emailReport() {
    setEmailState("sending");
    setEmailError(null);
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenantId}/compliance/report`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setEmailState("error");
        setEmailError(body.error ?? "Something went wrong.");
        return;
      }
      setEmailState("sent");
    } catch {
      setEmailState("error");
    } finally {
      setTimeout(() => setEmailState("idle"), 4000);
    }
  }

  if (!standards) return <p className="text-sm text-slate-500">Loading…</p>;

  const answered = standards.flatMap((s) => s.items).filter((i) => i.assessment.status !== "NOT_STARTED").length;
  const total = standards.reduce((n, s) => n + s.items.length, 0);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <div>
          <h2 className="font-semibold text-slate-900">Compliance responses</h2>
          <p className="text-xs text-slate-500">{answered}/{total} items answered</p>
        </div>
        <div className="flex items-center gap-2">
          {emailError && <p className="text-xs text-red-600">{emailError}</p>}
          <Button variant="secondary" size="sm" onClick={emailReport} disabled={emailState === "sending"}>
            <Mail size={13} />
            {emailState === "sending"
              ? "Sending…"
              : emailState === "sent"
                ? "Sent ✓"
                : emailState === "error"
                  ? "Failed"
                  : "Email report to school"}
          </Button>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {standards.map((standard) => (
          <div key={standard.id}>
            <div className="bg-slate-50/60 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {standard.title}
            </div>
            {standard.items.map((item) => (
              <ComplianceManageRow
                key={item.id}
                tenantId={tenantId}
                item={item}
                open={openItem === item.id}
                onToggle={() => setOpenItem(openItem === item.id ? null : item.id)}
                onSaved={load}
              />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

function ComplianceManageRow({
  tenantId,
  item,
  open,
  onToggle,
  onSaved,
}: {
  tenantId: string;
  item: Item;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState(item.assessment.status);
  const [notes, setNotes] = useState(item.assessment.evidenceNotes ?? "");
  const [evidenceUrl, setEvidenceUrl] = useState(item.assessment.evidenceUrl ?? "");
  const [nextReviewDue, setNextReviewDue] = useState(item.assessment.nextReviewDue?.slice(0, 10) ?? "");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/super-admin/tenants/${tenantId}/compliance/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, evidenceNotes: notes, evidenceUrl, nextReviewDue: nextReviewDue || undefined }),
      });
      onSaved();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-t border-slate-50">
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-5 py-3 text-left">
        <ChevronDown size={14} className={clsx("shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
        <p className="min-w-0 flex-1 truncate text-sm text-slate-700">{item.title}</p>
        <ComplianceBadge status={item.assessment.status} />
      </button>

      {open && (
        <div className="animate-fade-in space-y-3 px-5 pb-5 pl-11">
          <p className="text-xs text-slate-500">{item.description}</p>
          {item.assessment.reviewedAt && (
            <p className="text-xs text-slate-400">
              Last updated {new Date(item.assessment.reviewedAt).toLocaleDateString("en-GB")}
              {item.assessment.reviewedByName ? ` by ${item.assessment.reviewedByName}` : ""}
            </p>
          )}
          {item.assessment.evidenceUrl && (
            <a
              href={item.assessment.evidenceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-900 hover:underline"
            >
              {item.assessment.evidenceUrl}
              <ExternalLink size={11} />
            </a>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className={inputClass}>
                <option value="NOT_STARTED">Not started</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLIANT">Compliant</option>
                <option value="NON_COMPLIANT">Non-compliant</option>
                <option value="NOT_APPLICABLE">Not applicable</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Next review due</label>
              <input
                type="date"
                value={nextReviewDue}
                onChange={(e) => setNextReviewDue(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Evidence / notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
              placeholder="e.g. link to policy document, contract, or a description of current setup"
            />
          </div>
          <div>
            <label className={labelClass}>Evidence URL (optional)</label>
            <input value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} placeholder="https://…" className={inputClass} />
          </div>
          <Button size="sm" onClick={save} disabled={saving}>
            {justSaved && <Check size={14} />}
            {saving ? "Saving…" : justSaved ? "Saved" : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}
