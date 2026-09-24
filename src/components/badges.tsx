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

/** Flags one of the DfE's 6 "core standards" — the minimum baseline every school is expected to meet by 2030. */
export function CoreStandardBadge() {
  return (
    <span
      title="DfE core standard — part of the minimum baseline schools and colleges are expected to meet by 2030"
      className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
    >
      Core standard
    </span>
  );
}
