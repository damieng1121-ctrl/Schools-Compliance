"use client";

import clsx from "clsx";
import { AUDIENCE_LABEL, type Audience } from "@/components/audience-badge";

export type AudienceOrAll = Audience | "ALL";

const OPTIONS: AudienceOrAll[] = ["ALL", "TECHNICIAN", "SLT", "DSL"];

/** Filters the checklist down to the items one role is responsible for. */
export function AudienceFilter({ value, onChange }: { value: AudienceOrAll; onChange: (value: AudienceOrAll) => void }) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1">
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={clsx(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            value === option
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
          )}
        >
          {option === "ALL" ? "Everyone" : AUDIENCE_LABEL[option]}
        </button>
      ))}
    </div>
  );
}
