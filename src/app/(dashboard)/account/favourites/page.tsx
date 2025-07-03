// SERVER COMPONENT FAVORITES PAGE
import { getUser } from "src/lib/actions/auth.actions";
import { getFavourites } from "src/lib/actions/favourite.actions";
import FavouritesClient from "./FavouritesClient";
import { redirect } from "next/navigation";

export default async function FavouritesPage() {
  // 1. Get authenticated user
  const user = await getUser();
  if (!user) {
    return redirect("/login?callbackUrl=/account/favourites");
  }

  // 2. Fetch favorites (with joined product data)
  const favResult = await getFavourites();
  const favorites = favResult.success ? favResult.data : [];

  // 3. Extract favorite products
  const favoriteProducts = favorites.map((fav) => fav.products).filter(Boolean);

  return (
    <FavouritesClient
      user={user}
      favorites={favorites}
      favoriteProducts={favoriteProducts}
    />
  );
}
