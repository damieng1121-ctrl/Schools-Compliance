import { Wrench, Users, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Audience = "TECHNICIAN" | "SLT" | "DSL";

export const AUDIENCE_LABEL: Record<Audience, string> = {
  TECHNICIAN: "Technician",
  SLT: "SLT",
  DSL: "DSL",
};

const AUDIENCE_ICON: Record<Audience, LucideIcon> = {
  TECHNICIAN: Wrench,
  SLT: Users,
  DSL: ShieldAlert,
};

const AUDIENCE_STYLE: Record<Audience, string> = {
  TECHNICIAN: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300",
  SLT: "bg-violet-50 text-violet-700",
  DSL: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

/** Who's responsible for answering a compliance item. */
export function AudienceBadge({ audience }: { audience: Audience }) {
  const Icon = AUDIENCE_ICON[audience];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${AUDIENCE_STYLE[audience]}`}
    >
      <Icon size={11} />
      {AUDIENCE_LABEL[audience]}
    </span>
  );
}
