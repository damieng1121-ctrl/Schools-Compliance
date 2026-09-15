import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { PlatformBadge } from "@/components/platform-badge";

export function AuthShell({ panel, children }: { panel: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-1">
      <div className="hidden w-[42%] shrink-0 lg:block">{panel}</div>
      <div className="flex flex-1 items-center justify-center bg-[#f7f7f8] px-6 py-16">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthPanel({
  title,
  description,
  points,
}: {
  title: string;
  description: string;
  points: { icon: LucideIcon; text: string }[];
}) {
  return (
    <div className="flex h-full flex-col justify-between bg-gradient-to-br from-slate-900 to-slate-800 p-10 text-white">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white p-1">
          <PlatformBadge size={24} />
        </span>
        <span className="text-[15px] font-bold tracking-tight">Schools Compliance</span>
      </div>
      <div>
        <h2 className="max-w-sm text-3xl font-bold leading-tight tracking-tight">{title}</h2>
        <p className="mt-3 max-w-sm text-sm text-slate-300">{description}</p>
        <ul className="mt-8 space-y-3">
          {points.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-slate-200">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Icon size={16} />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-slate-400">DfE Meeting Digital &amp; Technology Standards</p>
    </div>
  );
}
