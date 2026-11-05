import type { LucideIcon } from "lucide-react";
import { Card } from "./card";

const TONES = {
  neutral: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
  brand: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
  good: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warn: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
  bad: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>
          <Icon size={18} strokeWidth={2.25} />
        </div>
      </div>
    </Card>
  );
}
