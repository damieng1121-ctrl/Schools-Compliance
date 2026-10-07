import { FilteringChecksList } from "@/components/filtering-checks-list";

export default function FilteringChecksPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Filtering &amp; Monitoring</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        A read-only record of the Filtering &amp; Monitoring check visits logged for your school. Your platform
        admin logs these and can send reports to your Designated Safeguarding Lead.
      </p>
      <div className="mt-6">
        <FilteringChecksList apiBase="/api" detailBase="/dashboard" readOnly />
      </div>
    </div>
  );
}
