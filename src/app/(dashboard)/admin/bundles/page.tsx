export const dynamic = "force-dynamic";
import BundlesClient from "./BundlesClient";
import { fetchBundles } from "../../../../queries/bundles";

export default async function BundlesPage({
  searchParams,
}: {
  searchParams: any;
}) {
  const currentPage = Number(searchParams?.page) || 1;
  const itemsPerPage = 10;
  const initialSearch = searchParams?.search || "";

  // Fetch bundles server-side
  const { data: bundles, count: totalBundles } = await fetchBundles({
    page: currentPage,
    itemsPerPage,
    search: initialSearch,
  });

  return (
    <BundlesClient
      initialBundles={bundles || []}
      totalBundles={totalBundles || 0}
      itemsPerPage={itemsPerPage}
      currentPage={currentPage}
      initialSearch={initialSearch}
    />
  );
}
