"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, ExternalLink } from "lucide-react";
import { ComplianceBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/platform-badge";

type Status = "NOT_STARTED" | "IN_PROGRESS" | "COMPLIANT" | "NON_COMPLIANT" | "NOT_APPLICABLE";
type Assessment = {
  status: Status;
  evidenceNotes: string | null;
  evidenceUrl: string | null;
  nextReviewDue: string | null;
  reviewedAt: string | null;
};
type Item = {
  id: string;
  title: string;
  description: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  assessment: Assessment;
};
type Standard = { id: string; title: string; description: string; items: Item[] };
type Tenant = { name: string; logoUrl: string | null };

const PRIORITY_STYLES: Record<Item["priority"], string> = {
  HIGH: "bg-red-50 text-red-600",
  MEDIUM: "bg-amber-50 text-amber-600",
  LOW: "bg-slate-100 text-slate-500",
};

export default function CompliancePrintReportPage() {
  const [standards, setStandards] = useState<Standard[] | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    Promise.all([fetch("/api/compliance").then((r) => r.json()), fetch("/api/tenant").then((r) => r.json())]).then(
      ([s, t]) => {
        setStandards(s);
        setTenant(t);
      },
    );
  }, []);

  if (!standards || !tenant) return <p className="text-sm text-slate-500">Loading…</p>;

  const allItems = standards.flatMap((s) => s.items);
  const compliant = allItems.filter((i) => i.assessment.status === "COMPLIANT").length;
  const overallPct = allItems.length ? Math.round((compliant / allItems.length) * 100) : 0;
  const generated = new Date().toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" });

  return (
    <div>
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/dashboard/compliance"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={14} />
          Back to checklist
        </Link>
        <Button onClick={() => window.print()}>
          <Printer size={15} />
          Print / Save as PDF
        </Button>
      </div>

      <div className="mt-6 print:mt-0">
        <div className="flex items-center gap-3">
          {tenant.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external, per-tenant source
            <img src={tenant.logoUrl} alt="" className="h-11 w-11 rounded-lg object-contain" />
          ) : (
            <PlatformBadge size={44} />
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{tenant.name}</h1>
            <p className="text-sm text-slate-500">DfE digital &amp; technology standards — compliance report</p>
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-400">Generated {generated}</p>

        <div className="mt-5 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between text-sm">
            <p className="font-semibold text-slate-900">Overall readiness</p>
            <p className="text-slate-500">
              <span className="font-semibold text-slate-900">{compliant}</span> / {allItems.length} standards met
              ({overallPct}%)
            </p>
          </div>
          <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 print:border print:border-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {standards.map((standard) => {
            const met = standard.items.filter((i) => i.assessment.status === "COMPLIANT").length;
            return (
              <section key={standard.id}>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-base font-bold tracking-tight text-slate-900">{standard.title}</h2>
                  <p className="text-xs font-medium text-slate-500">
                    {met}/{standard.items.length} met
                  </p>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{standard.description}</p>

                <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {standard.items.map((item) => (
                    <div key={item.id} className="break-inside-avoid p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900">{item.title}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_STYLES[item.priority]}`}>
                            {item.priority}
                          </span>
                        </div>
                        <ComplianceBadge status={item.assessment.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
                      {item.assessment.evidenceNotes && (
                        <p className="mt-1.5 whitespace-pre-wrap text-xs text-slate-600">
                          {item.assessment.evidenceNotes}
                        </p>
                      )}
                      {item.assessment.evidenceUrl && (
                        <a
                          href={item.assessment.evidenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-slate-900 hover:underline"
                        >
                          {item.assessment.evidenceUrl}
                          <ExternalLink size={10} />
                        </a>
                      )}
                      {(item.assessment.nextReviewDue || item.assessment.reviewedAt) && (
                        <div className="mt-1 flex flex-wrap gap-x-4 text-[11px] text-slate-400">
                          {item.assessment.nextReviewDue && (
                            <span>Next review due {new Date(item.assessment.nextReviewDue).toLocaleDateString("en-GB")}</span>
                          )}
                          {item.assessment.reviewedAt && (
                            <span>Last updated {new Date(item.assessment.reviewedAt).toLocaleDateString("en-GB")}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <p className="mt-10 border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-400">
          This is a working self-assessment, not an official DfE certification. Always check the latest guidance
          on{" "}
          <a
            href="https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges"
            className="underline"
          >
            GOV.UK
          </a>{" "}
          before reporting compliance externally.
        </p>
      </div>
    </div>
  );
}
