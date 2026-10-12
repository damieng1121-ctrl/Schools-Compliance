"use client";

import clsx from "clsx";

export type Rating = "RED" | "AMBER" | "GREEN";
export type CriterionLevel = { value: string; label: string; rating: Rating };
export type Criterion = { id: string; label: string; levels: CriterionLevel[] };

const DOT_COLOR: Record<Rating | "NONE", string> = {
  NONE: "bg-slate-300",
  RED: "bg-red-500",
  AMBER: "bg-amber-500",
  GREEN: "bg-emerald-500",
};
const SELECT_STYLE: Record<Rating | "NONE", string> = {
  NONE: "border-slate-200 text-slate-700",
  RED: "border-red-300 bg-red-50 text-red-800",
  AMBER: "border-amber-300 bg-amber-50 text-amber-800",
  GREEN: "border-emerald-300 bg-emerald-50 text-emerald-800",
};

/**
 * Traffic-light technical checklist for items whose DfE standard itself
 * describes a tiered minimum (e.g. a wireless generation, a switch
 * interconnect speed) — supplementary to, not a replacement for, the
 * item's own Status field. A dropdown per criterion, colored to match the
 * selected level's rating. Purely local state + onChange; the caller owns
 * persistence (same save button as the rest of the row).
 */
export function CriteriaTrafficLight({
  criteria,
  answers,
  onChange,
}: {
  criteria: Criterion[];
  answers: Record<string, string>;
  onChange: (criterionId: string, value: string) => void;
}) {
  if (criteria.length === 0) return null;

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Technical check</p>
      {criteria.map((criterion) => {
        const selectedValue = answers[criterion.id] ?? "";
        const selectedLevel = criterion.levels.find((l) => l.value === selectedValue);
        const rating = selectedLevel?.rating ?? "NONE";
        return (
          <div key={criterion.id}>
            <p className="text-xs font-medium text-slate-700">{criterion.label}</p>
            <div className="relative mt-1.5">
              <span
                className={clsx("pointer-events-none absolute left-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full", DOT_COLOR[rating])}
              />
              <select
                value={selectedValue}
                onChange={(e) => onChange(criterion.id, e.target.value)}
                className={clsx(
                  "w-full appearance-none rounded-lg border py-2 pl-7 pr-8 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-100",
                  SELECT_STYLE[rating],
                )}
              >
                <option value="" disabled>
                  Select…
                </option>
                {criterion.levels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
