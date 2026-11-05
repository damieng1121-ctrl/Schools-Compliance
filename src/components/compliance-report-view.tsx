"use client";

import Link from "next/link";
import { ArrowLeft, Printer, ExternalLink, FolderOpen } from "lucide-react";
import { ComplianceBadge, CoreStandardBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/platform-badge";
import { isCoreStandard } from "@/lib/dfe-standards";
import { AudienceBadge, type Audience } from "@/components/audience-badge";

type Status = "NOT_STARTED" | "IN_PROGRESS" | "COMPLIANT" | "NON_COMPLIANT" | "NOT_APPLICABLE";
type Assessment = {
  status: Status;
  technicianNotes: string | null;
  sltNotes: string | null;
  nextReviewDue: string | null;
  reviewedAt: string | null;
};
type Item = {
  id: string;
  title: string;
  description: string;
  govLink: string | null;
  priority: "HIGH" | "MEDIUM" | "LOW";
  audience: Audience;
  assessment: Assessment;
};
type Standard = {
  id: string;
  code: string;
  title: string;
  description: string;
  evidence?: { evidenceUrl: string | null };
  items: Item[];
};
type Tenant = { name: string; logoUrl: string | null };

const PRIORITY_STYLES: Record<Item["priority"], string> = {
  HIGH: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
  MEDIUM: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
  LOW: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
};

/** Printable DfE compliance report — shared between the school's own view and the super-admin's per-school view. */
export function ComplianceReportView({
  standards,
  tenant,
  backHref,
  backLabel,
  toolbar,
}: {
  standards: Standard[];
  tenant: Tenant;
  backHref: string;
  backLabel: string;
  /** Extra controls rendered next to the Print button, e.g. a "Send to…" dialog. */
  toolbar?: React.ReactNode;
}) {
  const allItems = standards.flatMap((s) => s.items);
  const compliant = allItems.filter((i) => i.assessment.status === "COMPLIANT").length;
  const overallPct = allItems.length ? Math.round((compliant / allItems.length) * 100) : 0;
  const generated = new Date().toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <ArrowLeft size={14} />
          {backLabel}
        </Link>
        <div className="flex items-center gap-2">
          {toolbar}
          <Button onClick={() => window.print()}>
            <Printer size={15} />
            Print / Save as PDF
          </Button>
        </div>
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
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{tenant.name}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">DfE digital &amp; technology standards — compliance report</p>
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Generated {generated}</p>

        <div className="mt-5 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between text-sm">
            <p className="font-semibold text-slate-900 dark:text-slate-100">Overall readiness</p>
            <p className="text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-slate-100">{compliant}</span> / {allItems.length} standards met
              ({overallPct}%)
            </p>
          </div>
          <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 print:border print:border-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
            <span className="mr-1.5 inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-white dark:bg-slate-100 dark:text-slate-900">
              Core standard
            </span>
            marks the 6 standards DfE expects every school and college to meet by 2030 — the minimum baseline.
          </p>
        </div>

        <div className="mt-8 space-y-8">
          {standards.map((standard) => {
            const met = standard.items.filter((i) => i.assessment.status === "COMPLIANT").length;
            return (
              <section key={standard.id}>
                <div className="flex items-baseline justify-between">
                  <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {standard.title}
                    {isCoreStandard(standard.code) && <CoreStandardBadge />}
                  </h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {met}/{standard.items.length} met
                  </p>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{standard.description}</p>
                {standard.evidence?.evidenceUrl && (
                  <a
                    href={standard.evidence.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-slate-900 dark:text-slate-100 hover:underline"
                  >
                    <FolderOpen size={11} />
                    Evidence for this standard
                    <ExternalLink size={10} />
                  </a>
                )}

                <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  {standard.items.map((item) => (
                    <div key={item.id} className="break-inside-avoid p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                          <AudienceBadge audience={item.audience} />
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_STYLES[item.priority]}`}>
                            {item.priority}
                          </span>
                        </div>
                        <ComplianceBadge status={item.assessment.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                      {item.govLink && (
                        <a
                          href={item.govLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:underline print:hidden"
                        >
                          Full DfE wording for this item
                          <ExternalLink size={9} />
                        </a>
                      )}
                      {item.assessment.technicianNotes && (
                        <p className="mt-1.5 whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-medium text-slate-500 dark:text-slate-400">Technician: </span>
                          {item.assessment.technicianNotes}
                        </p>
                      )}
                      {item.assessment.sltNotes && (
                        <p className="mt-1.5 whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-medium text-slate-500 dark:text-slate-400">SLT: </span>
                          {item.assessment.sltNotes}
                        </p>
                      )}
                      {(item.assessment.nextReviewDue || item.assessment.reviewedAt) && (
                        <div className="mt-1 flex flex-wrap gap-x-4 text-[11px] text-slate-400 dark:text-slate-500">
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

        <p className="mt-10 border-t border-slate-200 dark:border-slate-700 pt-4 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
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
