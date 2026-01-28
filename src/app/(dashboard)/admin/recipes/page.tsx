export const dynamic = "force-dynamic";
import RecipesClient from "./RecipesClient";
import { fetchBundles } from "../../../../queries/bundles";

export default async function AdminRecipesPage({
  searchParams,
}: {
  searchParams: any;
}) {
  const currentPage = Number(searchParams?.page) || 1;
  const itemsPerPage = 10;
  const initialSearch = searchParams?.search || "";

  // Fetch all bundles, we will filter for recipes in the client for this simple approach
  // or add a proper filter to fetchBundles if needed later.
  const { data: bundles, count: totalBundles } = await fetchBundles({
    page: currentPage,
    itemsPerPage: 100, // Fetch a larger set to filter for recipes easily
    search: initialSearch,
  });

  // Filter for recipes (bundles with video_url)
  const recipes = (bundles || []).filter(b => !!b.video_url);

  return (
    <RecipesClient
      initialRecipes={recipes}
      totalRecipes={recipes.length}
      itemsPerPage={itemsPerPage}
      currentPage={currentPage}
      initialSearch={initialSearch}
    />
  );
}
