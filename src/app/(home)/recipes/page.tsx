export const dynamic = "force-dynamic";

import { fetchRecipes } from "src/queries/bundles";
import RecipesIndexClient from "./RecipesIndexClient";

export default async function RecipesPage() {
  let recipes: any[] = [];
  let error: any = null;

  try {
    const result = await fetchRecipes({
      itemsPerPage: 50,
      publishedStatus: ['published']
    });
    recipes = result.data || [];
  } catch (err: any) {
    console.error("Error fetching recipes:", err);
    error = err;
  }

  return <RecipesIndexClient recipes={recipes} error={error} />;
}
