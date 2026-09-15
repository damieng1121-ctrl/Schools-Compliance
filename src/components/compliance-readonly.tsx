"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import clsx from "clsx";
import { ComplianceBadge } from "@/components/badges";
import { Card } from "@/components/ui/card";

type Assessment = {
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLIANT" | "NON_COMPLIANT" | "NOT_APPLICABLE";
  evidenceNotes: string | null;
  evidenceUrl: string | null;
  nextReviewDue: string | null;
  reviewedAt: string | null;
  reviewedByName: string | null;
};
type Item = {
  id: string;
  title: string;
  description: string;
  assessment: Assessment;
};
type Standard = { id: string; title: string; items: Item[] };

/** Read-only view of a school's compliance answers, for the super-admin school detail page. */
export function ComplianceReadOnly({ tenantId }: { tenantId: string }) {
  const [standards, setStandards] = useState<Standard[] | null>(null);
  const [openItem, setOpenItem] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/super-admin/tenants/${tenantId}/compliance`)
      .then((r) => r.json())
      .then(setStandards);
  }, [tenantId]);

  if (!standards) return <p className="text-sm text-slate-500">Loading…</p>;

  const answered = standards.flatMap((s) => s.items).filter((i) => i.assessment.status !== "NOT_STARTED").length;
  const total = standards.reduce((n, s) => n + s.items.length, 0);

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <h2 className="font-semibold text-slate-900">Compliance responses</h2>
        <p className="text-xs text-slate-500">{answered}/{total} items answered</p>
      </div>
      <div className="divide-y divide-slate-100">
        {standards.map((standard) => (
          <div key={standard.id}>
            <div className="bg-slate-50/60 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {standard.title}
            </div>
            {standard.items.map((item) => {
              const open = openItem === item.id;
              const a = item.assessment;
              const hasDetail = a.evidenceNotes || a.evidenceUrl || a.nextReviewDue || a.reviewedAt;
              return (
                <div key={item.id} className="border-t border-slate-50">
                  <button
                    onClick={() => hasDetail && setOpenItem(open ? null : item.id)}
                    className={clsx("flex w-full items-center gap-3 px-5 py-3 text-left", hasDetail && "cursor-pointer")}
                  >
                    {hasDetail ? (
                      <ChevronDown size={14} className={clsx("shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
                    ) : (
                      <span className="w-3.5 shrink-0" />
                    )}
                    <p className="min-w-0 flex-1 truncate text-sm text-slate-700">{item.title}</p>
                    <ComplianceBadge status={a.status} />
                  </button>
                  {open && hasDetail && (
                    <div className="animate-fade-in space-y-2 px-5 pb-4 pl-11 text-sm">
                      {a.evidenceNotes && (
                        <div>
                          <p className="text-xs font-medium text-slate-500">Evidence / notes</p>
                          <p className="mt-0.5 whitespace-pre-wrap text-slate-700">{a.evidenceNotes}</p>
                        </div>
                      )}
                      {a.evidenceUrl && (
                        <a
                          href={a.evidenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-900 hover:underline"
                        >
                          {a.evidenceUrl}
                          <ExternalLink size={11} />
                        </a>
                      )}
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
                        {a.nextReviewDue && <p>Next review due: {new Date(a.nextReviewDue).toLocaleDateString("en-GB")}</p>}
                        {a.reviewedAt && (
                          <p>
                            Last updated {new Date(a.reviewedAt).toLocaleDateString("en-GB")}
                            {a.reviewedByName ? ` by ${a.reviewedByName}` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Card>
  );
}
