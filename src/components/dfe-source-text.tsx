import { HelpCircle, ListChecks, Settings2, Clock } from "lucide-react";

/**
 * Renders the verbatim DfE `sourceText` stored on a ComplianceItem.
 *
 * Format produced by prisma/seed.ts: sections separated by "\n\n---\n\n",
 * each section starting with a one-line heading ("Why this standard is
 * important", "How to meet the standard", …) followed by a blank line and
 * then paragraphs/bullet lists. Lines starting with "- " are rendered as a
 * bullet list. A paragraph starting with "Note:" or "Dependencies:" is
 * treated as a callout, since those are the lines schools most often miss.
 */
const SECTION_ICON: Record<string, typeof HelpCircle> = {
  why: HelpCircle,
  how: ListChecks,
  technical: Settings2,
  when: Clock,
};

function iconFor(heading: string) {
  const key = heading.trim().split(/\s+/)[0]?.toLowerCase();
  return SECTION_ICON[key] ?? HelpCircle;
}

export function DfeSourceText({ text }: { text: string }) {
  const sections = text.split("\n\n---\n\n").map((section) => {
    const [heading, ...rest] = section.split("\n\n");
    return { heading, body: rest.join("\n\n") };
  });

  return (
    <div className="divide-y divide-slate-100">
      {sections.map((section, i) => {
        const Icon = iconFor(section.heading);
        return (
          <div key={i} className={i === 0 ? "pb-4" : "py-4"}>
            <div className="flex items-center gap-1.5">
              <Icon size={13} className="shrink-0 text-slate-400" />
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{section.heading}</p>
            </div>
            <div className="mt-2 space-y-2.5">
              {section.body.split("\n\n").map((block, j) => (
                <SourceBlock key={j} block={block} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SourceBlock({ block }: { block: string }) {
  const lines = block.split("\n");
  if (lines.every((l) => l.startsWith("- ") || l.trim() === "")) {
    return (
      <ul className="list-disc space-y-1 pl-4 text-sm leading-relaxed text-slate-700">
        {lines
          .filter((l) => l.trim() !== "")
          .map((l, i) => (
            <li key={i}>{l.replace(/^- /, "")}</li>
          ))}
      </ul>
    );
  }
  if (/^(Note|Dependencies):/i.test(block.trim())) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-900">
        {block}
      </p>
    );
  }
  return <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{block}</p>;
}
