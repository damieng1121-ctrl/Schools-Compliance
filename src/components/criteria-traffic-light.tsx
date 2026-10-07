"use client";

import clsx from "clsx";

export type Rating = "RED" | "AMBER" | "GREEN";
export type CriterionLevel = { value: string; label: string; rating: Rating };
export type Criterion = { id: string; label: string; levels: CriterionLevel[] };

const RATING_STYLE: Record<Rating, string> = {
  RED: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  AMBER: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
  GREEN: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
};
const RATING_STYLE_SELECTED: Record<Rating, string> = {
  RED: "border-red-600 bg-red-600 text-white hover:bg-red-600",
  AMBER: "border-amber-600 bg-amber-600 text-white hover:bg-amber-600",
  GREEN: "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-600",
};

/**
 * Traffic-light technical checklist for items whose DfE standard itself
 * describes a tiered minimum (e.g. a wireless generation, a switch
 * interconnect speed) — supplementary to, not a replacement for, the
 * item's own Status field. Purely local state + onChange; the caller owns
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
      {criteria.map((criterion) => (
        <div key={criterion.id}>
          <p className="text-xs font-medium text-slate-700">{criterion.label}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {criterion.levels.map((level) => {
              const selected = answers[criterion.id] === level.value;
              return (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => onChange(criterion.id, level.value)}
                  className={clsx(
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    selected ? RATING_STYLE_SELECTED[level.rating] : RATING_STYLE[level.rating],
                  )}
                >
                  {level.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
