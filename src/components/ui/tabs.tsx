"use client";

import clsx from "clsx";

export type TabItem = {
  id: string;
  label: string;
  /** Small badge rendered after the label, e.g. a count or a done/total ratio. */
  meta?: string;
  /** Highlights the tab (e.g. a core standard) with a dot indicator. */
  flagged?: boolean;
};

/** Horizontal, scrollable tab list. Controlled — the caller owns `active` and renders the matching panel. */
export function Tabs({ tabs, active, onChange }: { tabs: TabItem[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto border-b border-slate-200 px-1 print:hidden">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              "flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-700",
            )}
          >
            {tab.flagged && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900" />}
            {tab.label}
            {tab.meta && (
              <span
                className={clsx(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500",
                )}
              >
                {tab.meta}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
