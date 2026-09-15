import clsx from "clsx";
import type { ComplianceStatus } from "@prisma/client";

const STYLES: Record<ComplianceStatus, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  COMPLIANT: "bg-emerald-50 text-emerald-700",
  NON_COMPLIANT: "bg-red-50 text-red-700",
  NOT_APPLICABLE: "bg-slate-100 text-slate-500",
};

const DOT: Record<ComplianceStatus, string> = {
  NOT_STARTED: "bg-slate-400",
  IN_PROGRESS: "bg-amber-500",
  COMPLIANT: "bg-emerald-500",
  NON_COMPLIANT: "bg-red-500",
  NOT_APPLICABLE: "bg-slate-400",
};

const LABEL: Record<ComplianceStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLIANT: "Compliant",
  NON_COMPLIANT: "Non-compliant",
  NOT_APPLICABLE: "Not applicable",
};

export function ComplianceBadge({ status }: { status: ComplianceStatus }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", STYLES[status])}>
      <span className={clsx("h-1.5 w-1.5 rounded-full", DOT[status])} />
      {LABEL[status]}
    </span>
  );
}
