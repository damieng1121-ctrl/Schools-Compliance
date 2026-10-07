"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ExternalLink, Check, Printer } from "lucide-react";
import Link from "next/link";
import { ComplianceBadge, CoreStandardBadge } from "@/components/badges";
import { isCoreStandard } from "@/lib/dfe-standards";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { DfeSourceText } from "@/components/dfe-source-text";
import { ComplianceLogs } from "@/components/compliance-logs";
import { SendReportDialog } from "@/components/send-report-dialog";
import { CriteriaTrafficLight, type Criterion } from "@/components/criteria-traffic-light";
import { registerFlush, unregisterFlush } from "@/lib/idle-logout";
import clsx from "clsx";

type Assessment = {
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLIANT" | "NON_COMPLIANT" | "NOT_APPLICABLE";
  evidenceNotes: string | null;
  evidenceUrl: string | null;
  nextReviewDue: string | null;
  criteriaAnswers: Record<string, string> | null;
};
type Item = {
  id: string;
  code: string;
  title: string;
  description: string;
  sourceText: string | null;
  guidance: string | null;
  priority: "HIGH" | "MEDIUM" | "LOW";
  govLink: string | null;
  criteria: Criterion[] | null;
  assessment: Assessment;
};

const PRIORITY_STYLES: Record<Item["priority"], string> = {
  HIGH: "bg-red-50 text-red-600",
  MEDIUM: "bg-amber-50 text-amber-600",
  LOW: "bg-slate-100 text-slate-500",
};
type Standard = { id: string; code: string; title: string; description: string; officialUrl: string | null; items: Item[] };

export default function CompliancePage() {
  const [standards, setStandards] = useState<Standard[] | null>(null);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");

  function load() {
    fetch("/api/compliance")
      .then((r) => r.json())
      .then((data: Standard[]) => {
        setStandards(data);
        setActiveTab((current) => current || data[0]?.id || "logs");
      });
  }

  useEffect(load, []);

  if (!standards) return <p className="text-sm text-slate-500">Loading…</p>;

  const allItems = standards.flatMap((s) => s.items);
  const compliant = allItems.filter((i) => i.assessment.status === "COMPLIANT").length;
  const overallPct = allItems.length ? Math.round((compliant / allItems.length) * 100) : 0;

  return (
    <div>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">DfE digital &amp; technology standards</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Track your school&apos;s readiness against the DfE&apos;s digital and technology standards for
            schools and colleges. This is a working self-assessment tool — always check{" "}
            <a
              href="https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-slate-900 hover:underline"
            >
              the latest official guidance on GOV.UK
            </a>{" "}
            before reporting compliance externally.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href="/dashboard/compliance/report">
            <Button variant="secondary">
              <Printer size={15} />
              View report
            </Button>
          </Link>
          <SendReportDialog endpoint="/api/compliance/report" fetchRecipients={() => fetch("/api/team").then((r) => r.json())} />
        </div>
      </div>

      <Card className="mt-5 p-5">
        <div className="flex items-center justify-between text-sm">
          <p className="font-semibold text-slate-900">Overall readiness</p>
          <p className="text-slate-500">
            <span className="font-semibold text-slate-900">{compliant}</span> / {allItems.length} standards met
          </p>
        </div>
        <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-[width] duration-500"
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-slate-400">
          <span className="mr-1.5 inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-white">
            Core standard
          </span>
          marks the 6 standards DfE expects every school and college to meet by 2030 — the minimum baseline. The
          rest of the checklist is still real DfE guidance, just not part of that minimum.
        </p>
      </Card>

      <div className="mt-6">
        <Tabs
          tabs={[
            ...standards.map((standard) => {
              const standardCompliant = standard.items.filter((i) => i.assessment.status === "COMPLIANT").length;
              return {
                id: standard.id,
                label: standard.title,
                meta: `${standardCompliant}/${standard.items.length}`,
                flagged: isCoreStandard(standard.code),
              };
            }),
            { id: "logs", label: "Activity log" },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === "logs" ? (
          <Card className="mt-5 overflow-hidden">
            <ComplianceLogs endpoint="/api/compliance/logs" />
          </Card>
        ) : (
          standards
            .filter((standard) => standard.id === activeTab)
            .map((standard) => (
              <Card key={standard.id} className="mt-5 overflow-hidden">
                <div className="border-b border-slate-100 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                      {standard.title}
                      {isCoreStandard(standard.code) && <CoreStandardBadge />}
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{standard.description}</p>
                  {standard.officialUrl && (
                    <a
                      href={standard.officialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-slate-900 hover:underline"
                    >
                      Official DfE guidance
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
                <div className="divide-y divide-slate-100">
                  {standard.items.map((item) => (
                    <ComplianceItemRow
                      key={item.id}
                      item={item}
                      open={openItem === item.id}
                      onToggle={() => setOpenItem(openItem === item.id ? null : item.id)}
                      onSaved={load}
                    />
                  ))}
                </div>
              </Card>
            ))
        )}
      </div>
    </div>
  );
}

function ComplianceItemRow({
  item,
  open,
  onToggle,
  onSaved,
}: {
  item: Item;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState(item.assessment.status);
  const [notes, setNotes] = useState(item.assessment.evidenceNotes ?? "");
  const [evidenceUrl, setEvidenceUrl] = useState(item.assessment.evidenceUrl ?? "");
  const [nextReviewDue, setNextReviewDue] = useState(item.assessment.nextReviewDue?.slice(0, 10) ?? "");
  const [criteriaAnswers, setCriteriaAnswers] = useState(item.assessment.criteriaAnswers ?? {});
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/compliance/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          evidenceNotes: notes,
          evidenceUrl,
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
    const key = `dashboard-compliance-item-${item.id}`;
    const dirty =
      status !== item.assessment.status ||
      notes !== (item.assessment.evidenceNotes ?? "") ||
      evidenceUrl !== (item.assessment.evidenceUrl ?? "") ||
      nextReviewDue !== (item.assessment.nextReviewDue?.slice(0, 10) ?? "") ||
      JSON.stringify(criteriaAnswers) !== JSON.stringify(item.assessment.criteriaAnswers ?? {});
    registerFlush(key, () => (dirty ? save() : undefined));
    return () => unregisterFlush(key);
  });

  return (
    <div className="transition-colors hover:bg-slate-50/60">
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-5 py-4 text-left">
        <ChevronDown
          size={16}
          className={clsx("shrink-0 text-slate-400 transition-transform", open && "rotate-180")}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-slate-900">{item.title}</p>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLES[item.priority]}`}>
              {item.priority}
            </span>
          </div>
          <p className="mt-0.5 truncate text-sm text-slate-500">{item.description}</p>
        </div>
        <ComplianceBadge status={item.assessment.status} />
      </button>

      {open && (
        <div className="animate-fade-in space-y-4 px-5 pb-5 pl-11">
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">In plain English</p>
            <p className="mt-1 text-sm text-slate-700">{item.description}</p>
            {item.guidance && <p className="mt-1.5 text-sm font-medium text-slate-900">{item.guidance}</p>}
          </div>

          {item.sourceText && (
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-900">
                  What the DfE standard says, word for word
                </p>
                {item.govLink && (
                  <a
                    href={item.govLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 hover:underline"
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-600">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Assessment["status"])}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
              >
                <option value="NOT_STARTED">Not started</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLIANT">Compliant</option>
                <option value="NON_COMPLIANT">Non-compliant</option>
                <option value="NOT_APPLICABLE">Not applicable</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Next review due</label>
              <input
                type="date"
                value={nextReviewDue}
                onChange={(e) => setNextReviewDue(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Evidence / notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
              placeholder="e.g. link to policy document, contract, or a description of current setup"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Evidence URL (optional)</label>
            <input
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://…"
              className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
            />
            <p className="mt-1 text-xs text-slate-400">
              A link to a document, photo, or network diagram — Google Drive works well. Make sure it&apos;s
              shared with &ldquo;Anyone with the link&rdquo; (or your reviewers directly), not restricted to
              your school&apos;s internal Drive users, or others won&apos;t be able to open it.
            </p>
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
