import clsx from "clsx";
import type { ComplianceStatus } from "@prisma/client";

const complianceStyles: Record<ComplianceStatus, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLIANT: "bg-green-100 text-green-700",
  NON_COMPLIANT: "bg-red-100 text-red-700",
  NOT_APPLICABLE: "bg-slate-100 text-slate-600",
};

export function ComplianceBadge({ status }: { status: ComplianceStatus }) {
  return (
    <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-medium", complianceStyles[status])}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
