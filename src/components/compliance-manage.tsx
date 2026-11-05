"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, Check, FileText } from "lucide-react";
import clsx from "clsx";
import { ComplianceBadge } from "@/components/badges";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { inputClass, labelClass } from "@/components/ui/input";
import { isCoreStandard } from "@/lib/dfe-standards";
import { DfeSourceText } from "@/components/dfe-source-text";
import { ComplianceLogs } from "@/components/compliance-logs";
import { SendReportDialog } from "@/components/send-report-dialog";
import { CriteriaTrafficLight, type Criterion } from "@/components/criteria-traffic-light";
import { AudienceBadge, type Audience } from "@/components/audience-badge";
import { AudienceFilter, type AudienceOrAll } from "@/components/audience-filter";
import { StandardEvidenceArea } from "@/components/standard-evidence-area";
import { registerFlush, unregisterFlush } from "@/lib/idle-logout";

type Status = "NOT_STARTED" | "IN_PROGRESS" | "COMPLIANT" | "NON_COMPLIANT" | "NOT_APPLICABLE";
type Assessment = {
  status: Status;
  technicianNotes: string | null;
  sltNotes: string | null;
  nextReviewDue: string | null;
  reviewedAt: string | null;
  reviewedByName: string | null;
  criteriaAnswers: Record<string, string> | null;
};
type Item = {
  id: string;
  title: string;
  description: string;
  sourceText: string | null;
  govLink: string | null;
  audience: Audience;
  criteria: Criterion[] | null;
  assessment: Assessment;
};
type StandardEvidence = { evidenceUrl: string | null; updatedAt: string | null; updatedByName: string | null };
type Standard = { id: string; code: string; title: string; evidence: StandardEvidence; items: Item[] };

/** Editable view of a school's compliance answers, for platform admins to fill in on a school's behalf. */
export function ComplianceManage({ tenantId }: { tenantId: string }) {
  const [standards, setStandards] = useState<Standard[] | null>(null);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [audienceFilter, setAudienceFilter] = useState<AudienceOrAll>("ALL");

  function load() {
    fetch(`/api/super-admin/tenants/${tenantId}/compliance`)
      .then((r) => r.json())
      .then((data: Standard[]) => {
        setStandards(data);
        setActiveTab((current) => current || data[0]?.id || "logs");
      });
  }

  useEffect(load, [tenantId]);

  if (!standards) return <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>;

  const answered = standards.flatMap((s) => s.items).filter((i) => i.assessment.status !== "NOT_STARTED").length;
  const total = standards.reduce((n, s) => n + s.items.length, 0);

  const visibleItems = (standard: Standard) =>
    audienceFilter === "ALL" ? standard.items : standard.items.filter((i) => i.audience === audienceFilter);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-5 py-3">
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Compliance responses</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{answered}/{total} items answered</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/dashboard/super-admin/${tenantId}/compliance/report`}>
            <Button variant="secondary" size="sm">
              <FileText size={13} />
              View report
            </Button>
          </Link>
          <SendReportDialog
            endpoint={`/api/super-admin/tenants/${tenantId}/compliance/report`}
            fetchRecipients={() =>
              fetch(`/api/super-admin/tenants/${tenantId}`)
                .then((r) => r.json())
                .then((t) => t.users ?? [])
            }
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-5 py-3">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Show items for</p>
        <AudienceFilter value={audienceFilter} onChange={setAudienceFilter} />
      </div>
      <div className="px-5 pt-3">
        <Tabs
          tabs={[
            ...standards.map((standard) => {
              const items = visibleItems(standard);
              return {
                id: standard.id,
                label: standard.title,
                meta: `${items.filter((i) => i.assessment.status !== "NOT_STARTED").length}/${items.length}`,
                flagged: isCoreStandard(standard.code),
              };
            }),
            { id: "logs", label: "Activity log" },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === "logs" ? (
        <ComplianceLogs endpoint={`/api/super-admin/tenants/${tenantId}/compliance/logs`} />
      ) : (
        standards
          .filter((standard) => standard.id === activeTab)
          .map((standard) => (
            <div key={standard.id}>
              <StandardEvidenceArea
                endpoint={`/api/super-admin/tenants/${tenantId}/compliance/evidence/${standard.id}`}
                evidence={standard.evidence}
              />
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleItems(standard).map((item) => (
                  <ComplianceManageRow
                    key={item.id}
                    tenantId={tenantId}
                    item={item}
                    open={openItem === item.id}
                    onToggle={() => setOpenItem(openItem === item.id ? null : item.id)}
                    onSaved={load}
                  />
                ))}
                {visibleItems(standard).length === 0 && (
                  <p className="px-5 py-6 text-sm text-slate-500 dark:text-slate-400">No items for this role under this standard.</p>
                )}
              </div>
            </div>
          ))
      )}
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
  const [technicianNotes, setTechnicianNotes] = useState(item.assessment.technicianNotes ?? "");
  const [sltNotes, setSltNotes] = useState(item.assessment.sltNotes ?? "");
  const [nextReviewDue, setNextReviewDue] = useState(item.assessment.nextReviewDue?.slice(0, 10) ?? "");
  const [criteriaAnswers, setCriteriaAnswers] = useState(item.assessment.criteriaAnswers ?? {});
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/super-admin/tenants/${tenantId}/compliance/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          technicianNotes,
          sltNotes,
          nextReviewDue: nextReviewDue || undefined,
          criteriaAnswers,
        }),
      });
      onSaved();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  // Lets the idle-timeout logout (src/components/idle-timeout.tsx) save any
  // unsaved edits in this row before signing the user out.
  useEffect(() => {
    const key = `super-admin-compliance-item-${tenantId}-${item.id}`;
    const dirty =
      status !== item.assessment.status ||
      technicianNotes !== (item.assessment.technicianNotes ?? "") ||
      sltNotes !== (item.assessment.sltNotes ?? "") ||
      nextReviewDue !== (item.assessment.nextReviewDue?.slice(0, 10) ?? "") ||
      JSON.stringify(criteriaAnswers) !== JSON.stringify(item.assessment.criteriaAnswers ?? {});
    registerFlush(key, () => (dirty ? save() : undefined));
    return () => unregisterFlush(key);
  });

  const notesLabel = item.audience === "TECHNICIAN" ? "Technician notes" : "SLT notes";
  const notesValue = item.audience === "TECHNICIAN" ? technicianNotes : sltNotes;
  const setNotesValue = item.audience === "TECHNICIAN" ? setTechnicianNotes : setSltNotes;

  return (
    <div className="border-t border-slate-50 dark:border-slate-800">
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-5 py-3 text-left">
        <ChevronDown size={14} className={clsx("shrink-0 text-slate-400 dark:text-slate-500 transition-transform", open && "rotate-180")} />
        <p className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-300">{item.title}</p>
        <AudienceBadge audience={item.audience} />
        <ComplianceBadge status={item.assessment.status} />
      </button>

      {open && (
        <div className="animate-fade-in space-y-3 px-5 pb-5 pl-11">
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">In plain English</p>
            <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">{item.description}</p>
          </div>
          {item.sourceText && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-900 dark:text-slate-100">
                  What the DfE standard says, word for word
                </p>
                {item.govLink && (
                  <a
                    href={item.govLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:underline"
                  >
                    View on GOV.UK
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>
              <div className="mt-2">
                <DfeSourceText text={item.sourceText} />
              </div>
            </div>
          )}
          {item.criteria && item.criteria.length > 0 && (
            <CriteriaTrafficLight
              criteria={item.criteria}
              answers={criteriaAnswers}
              onChange={(criterionId, value) =>
                setCriteriaAnswers((prev) => ({ ...prev, [criterionId]: value }))
              }
            />
          )}
          {item.assessment.reviewedAt && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Last updated {new Date(item.assessment.reviewedAt).toLocaleDateString("en-GB")}
              {item.assessment.reviewedByName ? ` by ${item.assessment.reviewedByName}` : ""}
            </p>
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
            <label className={labelClass}>{notesLabel}</label>
            <textarea
              rows={2}
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              className={inputClass}
              placeholder="e.g. current setup, what's been checked, what's outstanding"
            />
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
