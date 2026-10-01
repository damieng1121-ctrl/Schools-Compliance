/**
 * Renders the verbatim DfE `sourceText` stored on a ComplianceItem.
 *
 * Format produced by prisma/seed.ts: sections separated by "\n\n---\n\n",
 * each section starting with a one-line heading ("Why this standard is
 * important", "How to meet the standard", …) followed by a blank line and
 * then paragraphs/bullet lists. Lines starting with "- " are rendered as a
 * bullet list.
 */
export function DfeSourceText({ text }: { text: string }) {
  const sections = text.split("\n\n---\n\n").map((section) => {
    const [heading, ...rest] = section.split("\n\n");
    return { heading, body: rest.join("\n\n") };
  });

  return (
    <div className="space-y-3">
      {sections.map((section, i) => (
        <div key={i}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{section.heading}</p>
          <div className="mt-1 space-y-1.5">
            {section.body.split("\n\n").map((block, j) => <SourceBlock key={j} block={block} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function SourceBlock({ block }: { block: string }) {
  const lines = block.split("\n");
  if (lines.every((l) => l.startsWith("- ") || l.trim() === "")) {
    return (
      <ul className="list-disc space-y-0.5 pl-4 text-sm text-slate-700">
        {lines
          .filter((l) => l.trim() !== "")
          .map((l, i) => (
            <li key={i}>{l.replace(/^- /, "")}</li>
          ))}
      </ul>
    );
  }
  return <p className="whitespace-pre-line text-sm text-slate-700">{block}</p>;
}
