import { FilteringCheckDetailView } from "@/components/filtering-check-detail";

export default async function FilteringCheckPage({ params }: PageProps<"/dashboard/filtering-checks/[checkId]">) {
  const { checkId } = await params;

  return (
    <FilteringCheckDetailView
      apiBase="/api"
      checkId={checkId}
      backHref="/dashboard/filtering-checks"
      backLabel="Filtering & Monitoring"
      readOnly
    />
  );
}
