import { Catalog } from "@/components/catalog";
import { readFilters, type SearchParams } from "@/lib/catalog-model";
export const metadata = { title: "Oyunları keşfet" };
export default async function Explore({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <Catalog filters={readFilters(await searchParams)} />;
}
