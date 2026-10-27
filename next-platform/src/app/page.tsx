import { Catalog } from "@/components/catalog";
import { readFilters, type SearchParams } from "@/lib/catalog-model";
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <Catalog filters={readFilters(await searchParams)} />;
}
